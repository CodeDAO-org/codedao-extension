const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cron = require('node-cron');
const { ethers } = require('ethers');
require('dotenv').config();

const AIAgentOrchestrator = require('./orchestrator');

class CodeDAOAIServer {
    constructor() {
        this.app = express();
        this.port = process.env.AI_AGENT_PORT || 3001;
        this.orchestrator = null;
        this.isRunning = false;
        
        this.setupMiddleware();
        this.setupRoutes();
        this.setupCronJobs();
    }

    setupMiddleware() {
        // Security and performance middleware
        this.app.use(helmet());
        this.app.use(compression());
        this.app.use(cors({
            origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true
        }));
        this.app.use(morgan('combined'));
        this.app.use(express.json({ limit: '10mb' }));
        this.app.use(express.urlencoded({ extended: true }));

        // Rate limiting
        const rateLimit = require('express-rate-limit');
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP'
        });
        this.app.use('/api/', limiter);
    }

    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0',
                agents: this.orchestrator ? this.orchestrator.getAgentStatus() : {},
                uptime: process.uptime()
            });
        });

        // Agent status
        this.app.get('/api/agents/status', (req, res) => {
            if (!this.orchestrator) {
                return res.status(503).json({ error: 'AI agents not initialized' });
            }
            
            res.json({
                agents: this.orchestrator.getAgentStatus(),
                lastActivity: this.orchestrator.getLastActivity(),
                totalDecisions: this.orchestrator.getTotalDecisions()
            });
        });

        // Process contribution (main endpoint)
        this.app.post('/api/contributions/analyze', async (req, res) => {
            try {
                if (!this.orchestrator) {
                    return res.status(503).json({ error: 'AI agents not initialized' });
                }

                const contribution = req.body;
                
                // Validate contribution data
                if (!this.validateContribution(contribution)) {
                    return res.status(400).json({ error: 'Invalid contribution data' });
                }

                console.log(`🔍 Analyzing contribution from ${contribution.developer}`);
                
                const result = await this.orchestrator.processContribution(contribution);
                
                res.json({
                    success: true,
                    contributionHash: result.contributionHash,
                    decisions: result.decisions.map(d => ({
                        agentType: d.agentType,
                        confidence: d.confidence,
                        recommendedReward: d.recommendedReward,
                        reasoning: d.reasoning,
                        skillTags: d.skillTags
                    })),
                    estimatedConsensus: this.estimateConsensus(result.decisions),
                    timestamp: new Date().toISOString()
                });

            } catch (error) {
                console.error('Error processing contribution:', error);
                res.status(500).json({ 
                    error: 'Failed to process contribution',
                    message: error.message 
                });
            }
        });

        // Get contribution history
        this.app.get('/api/contributions/:hash', async (req, res) => {
            try {
                const { hash } = req.params;
                
                if (!this.orchestrator) {
                    return res.status(503).json({ error: 'AI agents not initialized' });
                }

                const result = await this.orchestrator.getContributionResult(hash);
                res.json(result);

            } catch (error) {
                console.error('Error fetching contribution:', error);
                res.status(500).json({ error: 'Failed to fetch contribution data' });
            }
        });

        // Developer statistics
        this.app.get('/api/developers/:address/stats', async (req, res) => {
            try {
                const { address } = req.params;
                
                if (!ethers.utils.isAddress(address)) {
                    return res.status(400).json({ error: 'Invalid address' });
                }

                if (!this.orchestrator) {
                    return res.status(503).json({ error: 'AI agents not initialized' });
                }

                const stats = await this.orchestrator.getDeveloperStats(address);
                res.json(stats);

            } catch (error) {
                console.error('Error fetching developer stats:', error);
                res.status(500).json({ error: 'Failed to fetch developer statistics' });
            }
        });

        // Agent performance metrics
        this.app.get('/api/agents/metrics', (req, res) => {
            if (!this.orchestrator) {
                return res.status(503).json({ error: 'AI agents not initialized' });
            }

            res.json({
                metrics: this.orchestrator.getAgentMetrics(),
                systemHealth: this.orchestrator.getSystemHealth(),
                consensusStats: this.orchestrator.getConsensusStats()
            });
        });

        // Manual agent parameter adjustment (admin only)
        this.app.post('/api/admin/adjust-parameters', async (req, res) => {
            try {
                // Add authentication check here
                const { parameters } = req.body;
                
                if (!this.orchestrator) {
                    return res.status(503).json({ error: 'AI agents not initialized' });
                }

                const result = await this.orchestrator.adjustSystemParameters(parameters);
                res.json({ success: true, result });

            } catch (error) {
                console.error('Error adjusting parameters:', error);
                res.status(500).json({ error: 'Failed to adjust parameters' });
            }
        });

        // Webhook for VS Code extension
        this.app.post('/api/webhook/vscode', async (req, res) => {
            try {
                const { contribution, signature } = req.body;
                
                // Verify webhook signature
                if (!this.verifyWebhookSignature(req.body, signature)) {
                    return res.status(401).json({ error: 'Invalid signature' });
                }

                const result = await this.orchestrator.processContribution(contribution);
                res.json({ success: true, result });

            } catch (error) {
                console.error('Webhook error:', error);
                res.status(500).json({ error: 'Webhook processing failed' });
            }
        });

        // Error handling
        this.app.use((err, req, res, next) => {
            console.error('Unhandled error:', err);
            res.status(500).json({ 
                error: 'Internal server error',
                message: process.env.NODE_ENV === 'development' ? err.message : undefined
            });
        });

        // 404 handler
        this.app.use((req, res) => {
            res.status(404).json({ error: 'Endpoint not found' });
        });
    }

    setupCronJobs() {
        // Agent health check every 5 minutes
        cron.schedule('*/5 * * * *', () => {
            if (this.orchestrator) {
                this.orchestrator.performHealthCheck();
            }
        });

        // System optimization every hour
        cron.schedule('0 * * * *', () => {
            if (this.orchestrator) {
                this.orchestrator.optimizeSystem();
            }
        });

        // Daily metrics aggregation
        cron.schedule('0 0 * * *', () => {
            if (this.orchestrator) {
                this.orchestrator.aggregateDailyMetrics();
            }
        });

        // Agent reputation decay weekly
        cron.schedule('0 0 * * 0', () => {
            if (this.orchestrator) {
                this.orchestrator.applyReputationDecay();
            }
        });
    }

    validateContribution(contribution) {
        const required = ['developer', 'code', 'language', 'timestamp'];
        return required.every(field => contribution.hasOwnProperty(field));
    }

    estimateConsensus(decisions) {
        if (decisions.length < 2) return null;

        const rewards = decisions.map(d => d.recommendedReward);
        const confidences = decisions.map(d => d.confidence);
        
        const avgReward = rewards.reduce((sum, r) => sum + r, 0) / rewards.length;
        const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
        
        // Calculate variance to estimate consensus strength
        const rewardVariance = rewards.reduce((sum, r) => sum + Math.pow(r - avgReward, 2), 0) / rewards.length;
        const consensusStrength = Math.max(0, 1 - (rewardVariance / avgReward));

        return {
            estimatedReward: avgReward,
            consensusStrength,
            averageConfidence: avgConfidence,
            agentAgreement: consensusStrength > 0.8 ? 'high' : consensusStrength > 0.6 ? 'medium' : 'low'
        };
    }

    verifyWebhookSignature(payload, signature) {
        const crypto = require('crypto');
        const secret = process.env.WEBHOOK_SECRET;
        
        if (!secret || !signature) return false;
        
        const expectedSignature = crypto
            .createHmac('sha256', secret)
            .update(JSON.stringify(payload))
            .digest('hex');
            
        return crypto.timingSafeEqual(
            Buffer.from(signature, 'hex'),
            Buffer.from(expectedSignature, 'hex')
        );
    }

    async initialize() {
        try {
            console.log('🤖 Initializing CodeDAO AI Agents...');
            
            // Initialize AI orchestrator
            this.orchestrator = new AIAgentOrchestrator({
                contractAddress: process.env.REWARDS_CONTRACT_ADDRESS,
                rpcUrl: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
                networkName: process.env.NETWORK_NAME || 'base'
            });

            await this.orchestrator.initialize();
            
            console.log('✅ AI Agents initialized successfully');
            this.isRunning = true;

        } catch (error) {
            console.error('❌ Failed to initialize AI agents:', error);
            throw error;
        }
    }

    async start() {
        try {
            await this.initialize();
            
            this.app.listen(this.port, () => {
                console.log(`🚀 CodeDAO AI Server running on port ${this.port}`);
                console.log(`📊 Health check: http://localhost:${this.port}/health`);
                console.log(`🤖 AI Agents: ${this.orchestrator.getAgentCount()} active`);
                console.log('=====================================');
                console.log('🎯 AUTONOMOUS AI REWARD SYSTEM ONLINE');
                console.log('💰 Ready to reward developers with zero management interference!');
                console.log('=====================================');
            });

        } catch (error) {
            console.error('❌ Failed to start AI server:', error);
            process.exit(1);
        }
    }

    async stop() {
        console.log('🛑 Shutting down AI server...');
        
        if (this.orchestrator) {
            await this.orchestrator.shutdown();
        }
        
        this.isRunning = false;
        console.log('✅ AI server stopped gracefully');
    }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
    if (global.aiServer) {
        await global.aiServer.stop();
    }
    process.exit(0);
});

process.on('SIGINT', async () => {
    if (global.aiServer) {
        await global.aiServer.stop();
    }
    process.exit(0);
});

// Start server if called directly
if (require.main === module) {
    const server = new CodeDAOAIServer();
    global.aiServer = server;
    server.start().catch(console.error);
}

module.exports = CodeDAOAIServer;

const express = require('express');
const { Webhooks } = require('@octokit/webhooks');
const { EAS, SchemaEncoder } = require('@ethereum-attestation-service/eas-sdk');
const { ethers } = require('ethers');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const CONFIG = {
    GITHUB_WEBHOOK_SECRET: process.env.GITHUB_WEBHOOK_SECRET,
    ALLOWLIST_REPOS: (process.env.ALLOWLIST_REPOS || 'codedao-org/codedao-extension').split(','),
    BASE_RPC: process.env.BASE_RPC || 'https://mainnet.base.org',
    EAS_CONTRACT_ADDRESS: '0x4200000000000000000000000000000000000021', // Base EAS
    EAS_SCHEMA_ID: process.env.EAS_SCHEMA_ID || '0x', // Set when schema is deployed
    EAS_PRIVATE_KEY: process.env.EAS_PRIVATE_KEY, // Optional for MVP
};

console.log('🚀 CodeDAO GitHub Webhook Starting...');
console.log('📋 Config:');
console.log('   Allowed Repos:', CONFIG.ALLOWLIST_REPOS);
console.log('   Base RPC:', CONFIG.BASE_RPC);
console.log('   EAS Contract:', CONFIG.EAS_CONTRACT_ADDRESS);

// Initialize webhooks
const webhooks = new Webhooks({
    secret: CONFIG.GITHUB_WEBHOOK_SECRET,
});

// Middleware
app.use(express.json());

// Health endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'codedao-github-webhook',
        version: '1.0.0',
        config: {
            allowedRepos: CONFIG.ALLOWLIST_REPOS.length,
            easEnabled: !!CONFIG.EAS_PRIVATE_KEY,
            baseRpc: !!CONFIG.BASE_RPC
        }
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'CodeDAO GitHub Webhook',
        status: 'running',
        docs: 'https://github.com/CodeDAO-org/codedao-extension',
        endpoints: {
            health: '/health',
            webhooks: '/webhooks/github'
        }
    });
});

// Quality scoring algorithm
function calculateQualityScore(prData) {
    console.log('🔍 Calculating quality score for PR:', prData.number);
    
    let score = 0;
    const factors = {};
    
    // Base score for merged PR
    if (prData.merged) {
        score += 100;
        factors.merged = 100;
    }
    
    // Lines changed factor (up to 50 points)
    const linesChanged = (prData.additions || 0) + (prData.deletions || 0);
    const linesFactor = Math.min(50, Math.floor(linesChanged / 10));
    score += linesFactor;
    factors.lines = linesFactor;
    
    // Review factor (up to 30 points)
    const reviewCount = prData.review_comments || 0;
    const reviewFactor = Math.min(30, reviewCount * 5);
    score += reviewFactor;
    factors.review = reviewFactor;
    
    // Complexity factor based on files changed (up to 20 points)
    const filesChanged = prData.changed_files || 0;
    const complexityFactor = Math.min(20, filesChanged * 2);
    score += complexityFactor;
    factors.complexity = complexityFactor;
    
    console.log('📊 Score breakdown:', factors);
    console.log('🎯 Total score:', score);
    
    return {
        score,
        factors,
        timestamp: new Date().toISOString()
    };
}

// Convert score to CODE token amount (basic formula)
function scoreToTokenAmount(score) {
    // Base formula: score / 10 = CODE tokens
    // Max ~20 CODE per excellent PR (score 200)
    const tokens = Math.floor(score / 10);
    return Math.max(1, Math.min(50, tokens)); // Min 1, max 50 CODE
}

// Create EAS attestation (if configured)
async function createPRAttestation(prData, qualityData) {
    if (!CONFIG.EAS_PRIVATE_KEY || !CONFIG.EAS_SCHEMA_ID) {
        console.log('⚠️ EAS not configured, skipping attestation');
        return null;
    }
    
    try {
        console.log('🏗️ Creating EAS attestation...');
        
        const provider = new ethers.JsonRpcProvider(CONFIG.BASE_RPC);
        const signer = new ethers.Wallet(CONFIG.EAS_PRIVATE_KEY, provider);
        
        const eas = new EAS(CONFIG.EAS_CONTRACT_ADDRESS);
        eas.connect(signer);
        
        // Schema: string repo_name,uint256 pr_number,address author_addr,uint256 score,string pr_title,uint256 timestamp
        const schemaEncoder = new SchemaEncoder(
            "string repo_name,uint256 pr_number,address author_addr,uint256 score,string pr_title,uint256 timestamp"
        );
        
        const encodedData = schemaEncoder.encodeData([
            { name: "repo_name", value: prData.repository, type: "string" },
            { name: "pr_number", value: prData.number, type: "uint256" },
            { name: "author_addr", value: prData.author_address || ethers.ZeroAddress, type: "address" },
            { name: "score", value: qualityData.score, type: "uint256" },
            { name: "pr_title", value: prData.title, type: "string" },
            { name: "timestamp", value: Math.floor(Date.now() / 1000), type: "uint256" }
        ]);
        
        const tx = await eas.attest({
            schema: CONFIG.EAS_SCHEMA_ID,
            data: {
                recipient: prData.author_address || ethers.ZeroAddress,
                expirationTime: 0,
                revocable: true,
                data: encodedData,
            },
        });
        
        const attestationUID = await tx.wait();
        console.log('✅ EAS attestation created:', attestationUID);
        
        return attestationUID;
        
    } catch (error) {
        console.error('❌ EAS attestation failed:', error.message);
        return null;
    }
}

// Store epoch data (simple file-based for MVP)
function storeEpochData(address, amount, prData) {
    const fs = require('fs');
    const path = require('path');
    
    try {
        // Load current epoch data
        const epochFile = path.join(__dirname, '..', 'epochs', 'current-epoch.json');
        let epochData = { claims: {} };
        
        if (fs.existsSync(epochFile)) {
            epochData = JSON.parse(fs.readFileSync(epochFile, 'utf8'));
        }
        
        // Add/update claim
        if (!epochData.claims[address]) {
            epochData.claims[address] = {
                cumulative: "0",
                prs: []
            };
        }
        
        const currentCumulative = BigInt(epochData.claims[address].cumulative);
        const newAmount = ethers.parseEther(amount.toString());
        const newCumulative = currentCumulative + newAmount;
        
        epochData.claims[address].cumulative = newCumulative.toString();
        epochData.claims[address].prs.push({
            number: prData.number,
            repository: prData.repository,
            amount: newAmount.toString(),
            timestamp: new Date().toISOString(),
            score: prData.score
        });
        
        // Update metadata
        epochData.lastUpdated = new Date().toISOString();
        epochData.totalClaims = Object.keys(epochData.claims).length;
        
        // Save updated data
        fs.writeFileSync(epochFile, JSON.stringify(epochData, null, 2));
        
        console.log(`💾 Updated epoch data for ${address}: ${ethers.formatEther(newCumulative)} CODE total`);
        
        return {
            address,
            newAmount: ethers.formatEther(newAmount),
            totalAmount: ethers.formatEther(newCumulative),
            prCount: epochData.claims[address].prs.length
        };
        
    } catch (error) {
        console.error('❌ Failed to store epoch data:', error.message);
        return null;
    }
}

// Main webhook handler
webhooks.on('pull_request.closed', async ({ payload }) => {
    console.log('\n🔔 Received PR closed event');
    
    try {
        const pr = payload.pull_request;
        const repo = payload.repository;
        
        // Check if repo is allowlisted
        const repoFullName = repo.full_name;
        if (!CONFIG.ALLOWLIST_REPOS.includes(repoFullName)) {
            console.log(`⚠️ Repository ${repoFullName} not in allowlist`);
            return;
        }
        
        // Check if PR was merged
        if (!pr.merged) {
            console.log(`⚠️ PR #${pr.number} was closed but not merged`);
            return;
        }
        
        console.log(`✅ Processing merged PR #${pr.number} in ${repoFullName}`);
        console.log(`👤 Author: ${pr.user.login}`);
        console.log(`📝 Title: ${pr.title}`);
        
        // Extract PR data
        const prData = {
            number: pr.number,
            title: pr.title,
            repository: repoFullName,
            author: pr.user.login,
            author_address: null, // TODO: Link GitHub to wallet address
            merged: pr.merged,
            additions: pr.additions,
            deletions: pr.deletions,
            changed_files: pr.changed_files,
            review_comments: pr.review_comments,
            merged_at: pr.merged_at
        };
        
        // Calculate quality score
        const qualityData = calculateQualityScore(prData);
        prData.score = qualityData.score;
        
        // Convert to token amount
        const tokenAmount = scoreToTokenAmount(qualityData.score);
        
        console.log(`💰 Reward: ${tokenAmount} CODE tokens`);
        
        // Create EAS attestation (optional)
        const attestationUID = await createPRAttestation(prData, qualityData);
        
        // Store in epoch data (using author's GitHub username as placeholder)
        // TODO: Replace with actual wallet address from GitHub linking
        const placeholderAddress = `github:${pr.user.login}`;
        const epochResult = storeEpochData(placeholderAddress, tokenAmount, prData);
        
        console.log('✅ PR processing complete!');
        console.log('📊 Summary:');
        console.log(`   Score: ${qualityData.score}`);
        console.log(`   Reward: ${tokenAmount} CODE`);
        console.log(`   Attestation: ${attestationUID || 'N/A'}`);
        console.log(`   Epoch Updated: ${!!epochResult}`);
        
        // TODO: Trigger notifications (Discord, Telegram, email)
        
    } catch (error) {
        console.error('❌ Error processing PR webhook:', error);
    }
});

// Webhook endpoint
app.post('/webhooks/github', (req, res) => {
    console.log('📥 Received webhook:', req.headers['x-github-event']);
    
    webhooks.receive({
        id: req.headers['x-github-delivery'],
        name: req.headers['x-github-event'],
        signature: req.headers['x-hub-signature-256'],
        payload: JSON.stringify(req.body),
    }).catch(error => {
        console.error('❌ Webhook processing error:', error);
        res.status(500).json({ error: error.message });
    });
    
    res.status(200).json({ received: true });
});

// Error handling
app.use((error, req, res, next) => {
    console.error('❌ Express error:', error);
    res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 CodeDAO GitHub Webhook running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📨 Webhook endpoint: http://localhost:${PORT}/webhooks/github`);
    console.log('✅ Ready to process GitHub events!');
});

module.exports = app; 
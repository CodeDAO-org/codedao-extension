const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 3333; // Using different port to avoid conflicts

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage
let registrations = new Map();
let githubToWallet = new Map();
let walletToGithub = new Map();

// Data persistence
const DATA_DIR = path.join(__dirname, 'data');

async function initializeStorage() {
    try {
        await fs.mkdir(DATA_DIR, { recursive: true });
        console.log('📂 Data directory initialized');
    } catch (error) {
        console.error('❌ Error initializing storage:', error);
    }
}

function generateRegistrationId() {
    return 'REG_' + crypto.randomBytes(8).toString('hex').toUpperCase();
}

function isValidWalletAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isValidGitHubUsername(username) {
    return /^[a-z\d](?:[a-z\d]|-(?=[a-z\d])){0,38}$/i.test(username);
}

// API Routes

// Register wallet-GitHub mapping
app.post('/api/register-wallet-github', async (req, res) => {
    try {
        const { walletAddress, githubUsername, timestamp, chainId } = req.body;
        
        console.log(`📝 Registration request: ${githubUsername} → ${walletAddress}`);
        
        // Validation
        if (!walletAddress || !githubUsername) {
            return res.status(400).json({ 
                error: 'Missing required fields: walletAddress and githubUsername' 
            });
        }
        
        if (!isValidWalletAddress(walletAddress)) {
            return res.status(400).json({ 
                error: 'Invalid wallet address format' 
            });
        }
        
        if (!isValidGitHubUsername(githubUsername)) {
            return res.status(400).json({ 
                error: 'Invalid GitHub username format' 
            });
        }
        
        // Check for existing mappings
        const existingWalletMapping = walletToGithub.get(walletAddress.toLowerCase());
        const existingGithubMapping = githubToWallet.get(githubUsername.toLowerCase());
        
        if (existingWalletMapping && existingWalletMapping !== githubUsername.toLowerCase()) {
            return res.status(409).json({ 
                error: `Wallet ${walletAddress} is already linked to GitHub user: ${existingWalletMapping}` 
            });
        }
        
        if (existingGithubMapping && existingGithubMapping !== walletAddress.toLowerCase()) {
            return res.status(409).json({ 
                error: `GitHub user ${githubUsername} is already linked to wallet: ${existingGithubMapping}` 
            });
        }
        
        // Create registration
        const registrationId = generateRegistrationId();
        const registration = {
            id: registrationId,
            walletAddress: walletAddress.toLowerCase(),
            githubUsername: githubUsername.toLowerCase(),
            timestamp: timestamp || new Date().toISOString(),
            chainId: chainId || 'unknown',
            status: 'active'
        };
        
        // Store mappings
        registrations.set(registrationId, registration);
        githubToWallet.set(githubUsername.toLowerCase(), walletAddress.toLowerCase());
        walletToGithub.set(walletAddress.toLowerCase(), githubUsername.toLowerCase());
        
        console.log(`✅ Registration successful: ${githubUsername} → ${walletAddress.slice(0, 8)}...`);
        console.log(`📊 Total registrations: ${registrations.size}`);
        
        res.json({
            success: true,
            registrationId,
            message: 'Wallet-GitHub mapping registered successfully',
            data: {
                walletAddress: registration.walletAddress,
                githubUsername: registration.githubUsername,
                timestamp: registration.timestamp
            }
        });
        
    } catch (error) {
        console.error('❌ Registration error:', error);
        res.status(500).json({ 
            error: 'Internal server error during registration' 
        });
    }
});

// Get wallet for GitHub username (for AI Bot rewards)
app.get('/api/github-to-wallet/:username', (req, res) => {
    const username = req.params.username.toLowerCase();
    const walletAddress = githubToWallet.get(username);
    
    if (walletAddress) {
        console.log(`🔍 Lookup: ${username} → ${walletAddress}`);
        res.json({
            success: true,
            githubUsername: username,
            walletAddress,
            message: 'Mapping found'
        });
    } else {
        console.log(`⚠️ No mapping found for GitHub user: ${username}`);
        res.status(404).json({
            success: false,
            message: 'No wallet mapping found for this GitHub username'
        });
    }
});

// Get GitHub for wallet address
app.get('/api/wallet-to-github/:address', (req, res) => {
    const address = req.params.address.toLowerCase();
    const githubUsername = walletToGithub.get(address);
    
    if (githubUsername) {
        res.json({
            success: true,
            walletAddress: address,
            githubUsername,
            message: 'Mapping found'
        });
    } else {
        res.status(404).json({
            success: false,
            message: 'No GitHub mapping found for this wallet address'
        });
    }
});

// AI Bot reward simulation
app.post('/api/ai-bot-reward', async (req, res) => {
    try {
        const { githubUsername, linesOfCode, functions, classes, commits } = req.body;
        
        console.log(`🤖 AI Bot reward request for: ${githubUsername}`);
        
        const walletAddress = githubToWallet.get(githubUsername.toLowerCase());
        if (!walletAddress) {
            return res.status(404).json({
                success: false,
                message: 'No wallet mapping found for this GitHub username'
            });
        }
        
        // Calculate reward
        const baseReward = (linesOfCode || 0) * 0.1;
        const functionBonus = (functions || 0) * 0.05;
        const classBonus = (classes || 0) * 0.1;
        const totalReward = baseReward + functionBonus + classBonus;
        
        console.log(`💰 Reward calculation:`);
        console.log(`   Lines: ${linesOfCode || 0} × 0.1 = ${baseReward} CODE`);
        console.log(`   Functions: ${functions || 0} × 0.05 = ${functionBonus} CODE`);
        console.log(`   Classes: ${classes || 0} × 0.1 = ${classBonus} CODE`);
        console.log(`   Total: ${totalReward} CODE tokens`);
        console.log(`🎯 Target wallet: ${walletAddress}`);
        
        res.json({
            success: true,
            githubUsername,
            walletAddress,
            metrics: {
                linesOfCode: linesOfCode || 0,
                functions: functions || 0,
                classes: classes || 0,
                commits: commits || 1
            },
            reward: {
                baseReward,
                functionBonus,
                classBonus,
                totalReward
            },
            message: `Would send ${totalReward} CODE tokens to ${walletAddress}`
        });
        
    } catch (error) {
        console.error('❌ AI Bot reward error:', error);
        res.status(500).json({ error: 'AI Bot reward processing failed' });
    }
});

// List all registrations
app.get('/api/registrations', (req, res) => {
    const allRegistrations = Array.from(registrations.values());
    res.json({
        success: true,
        count: allRegistrations.length,
        registrations: allRegistrations,
        mappings: {
            githubToWallet: Object.fromEntries(githubToWallet),
            walletToGithub: Object.fromEntries(walletToGithub)
        }
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        registrations: registrations.size,
        mappings: githubToWallet.size,
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Serve registration page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'registration.html'));
});

// Start server
async function startServer() {
    await initializeStorage();
    
    app.listen(PORT, () => {
        console.log('🚀 CodeDAO Wallet-GitHub Registration Server');
        console.log('============================================');
        console.log(`🌐 Server: http://localhost:${PORT}`);
        console.log(`🔗 Registration: http://localhost:${PORT}/`);
        console.log(`📊 Health: http://localhost:${PORT}/health`);
        console.log(`📋 Admin: http://localhost:${PORT}/api/registrations`);
        console.log('============================================');
        console.log('🤖 Ready for AI Bot integration testing!');
    });
}

startServer();

module.exports = app; 
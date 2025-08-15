#!/usr/bin/env node

// CodeDAO SDK - No dependencies version
const fs = require('fs');
const path = require('path');

/**
 * CodeDAO SDK - Earn CODE tokens while you code
 */

class CodeDAOSDK {
    constructor() {
        this.webhookUrl = 'https://codedao-github-app.vercel.app/webhook';
        this.dashboardUrl = 'https://codedao-org.github.io/codedao-extension/dashboard/index.html';
        // No git dependency needed
    }

    async initialize() {
        console.log('🚀 CodeDAO SDK Initializing...');
        console.log('💰 Start earning CODE tokens for your contributions!');
        
        try {
            // Check if we're in a git repository
            if (!fs.existsSync('.git')) {
                console.log('❌ Not in a git repository. Please run this in a git project.');
                return;
            }

            console.log('📂 Repository detected');

            // Setup git hooks for tracking
            await this.setupGitHooks();
            
            console.log('✅ CodeDAO SDK setup complete!');
            console.log('🎯 Next steps:');
            console.log('   1. Make commits to this repository');
            console.log('   2. Your contributions will be tracked automatically');
            console.log(`   3. Visit ${this.dashboardUrl} to see earnings`);
            console.log('   4. Connect your wallet to claim CODE tokens');

        } catch (error) {
            console.error('❌ Setup failed:', error.message);
        }
    }

    async setupGitHooks() {
        // For MVP, we'll use a simple tracking approach
        console.log('🔗 Setting up contribution tracking...');
        
        // Create a .codedao config file
        const config = {
            initialized: new Date().toISOString(),
            webhookUrl: this.webhookUrl,
            trackingEnabled: true
        };

        fs.writeFileSync('.codedao.json', JSON.stringify(config, null, 2));
        
        console.log('✅ Tracking configured in .codedao.json');
    }

    async checkEarnings() {
        console.log('💰 Checking your CODE earnings...');
        console.log(`🌐 Visit: ${this.dashboardUrl}`);
        console.log('🔗 Connect your wallet to see earnings and claim tokens');
    }

    static showHelp() {
        console.log('\n📚 CodeDAO SDK Commands:');
        console.log('  codedao init       - Initialize earning in this repository');
        console.log('  codedao earnings   - Check your CODE token earnings');
        console.log('  codedao dashboard  - Open the CodeDAO dashboard');
        console.log('  codedao help       - Show this help message');
        console.log('\n💡 Tip: Visit the dashboard to connect your wallet and claim tokens!');
    }
}

// CLI Interface
const command = process.argv[2];
const sdk = new CodeDAOSDK();

switch (command) {
    case 'init':
        sdk.initialize();
        break;
    case 'earnings':
        sdk.checkEarnings();
        break;
    case 'dashboard':
        console.log('🌐 Opening CodeDAO dashboard...');
        console.log(`Visit: ${sdk.dashboardUrl}`);
        break;
    case 'help':
    case '--help':
    case '-h':
        CodeDAOSDK.showHelp();
        break;
    default:
        console.log('❌ Unknown command. Use "codedao help" for available commands.');
        CodeDAOSDK.showHelp();
}

module.exports = CodeDAOSDK; 
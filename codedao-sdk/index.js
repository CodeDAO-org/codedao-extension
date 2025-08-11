#!/usr/bin/env node

const chalk = require('chalk');
const axios = require('axios');
const simpleGit = require('simple-git');

/**
 * CodeDAO SDK - Earn CODE tokens while you code
 */

class CodeDAOSDK {
    constructor() {
        this.webhookUrl = 'https://codedao-github-app.vercel.app/webhook';
        this.dashboardUrl = 'https://codedao-org.github.io/codedao-extension/dashboard/index.html';
        this.git = simpleGit();
    }

    async initialize() {
        console.log(chalk.blue.bold('🚀 CodeDAO SDK Initializing...'));
        console.log(chalk.green('💰 Start earning CODE tokens for your contributions!'));
        
        try {
            // Check if we're in a git repository
            const isRepo = await this.git.checkIsRepo();
            if (!isRepo) {
                console.log(chalk.red('❌ Not in a git repository. Please run this in a git project.'));
                return;
            }

            // Get repository info
            const remotes = await this.git.getRemotes(true);
            const origin = remotes.find(r => r.name === 'origin');
            
            if (origin) {
                console.log(chalk.blue(`📂 Repository: ${origin.refs.fetch}`));
            }

            // Setup git hooks for tracking
            await this.setupGitHooks();
            
            console.log(chalk.green.bold('✅ CodeDAO SDK setup complete!'));
            console.log(chalk.yellow('🎯 Next steps:'));
            console.log(chalk.white('   1. Make commits to this repository'));
            console.log(chalk.white('   2. Your contributions will be tracked automatically'));
            console.log(chalk.white(`   3. Visit ${this.dashboardUrl} to see earnings`));
            console.log(chalk.white('   4. Connect your wallet to claim CODE tokens'));

        } catch (error) {
            console.error(chalk.red('❌ Setup failed:'), error.message);
        }
    }

    async setupGitHooks() {
        // For MVP, we'll use a simple tracking approach
        console.log(chalk.blue('🔗 Setting up contribution tracking...'));
        
        // Create a .codedao config file
        const config = {
            initialized: new Date().toISOString(),
            webhookUrl: this.webhookUrl,
            trackingEnabled: true
        };

        const fs = require('fs');
        fs.writeFileSync('.codedao.json', JSON.stringify(config, null, 2));
        
        console.log(chalk.green('✅ Tracking configured in .codedao.json'));
    }

    async checkEarnings() {
        console.log(chalk.blue('💰 Checking your CODE earnings...'));
        console.log(chalk.yellow(`🌐 Visit: ${this.dashboardUrl}`));
        console.log(chalk.green('🔗 Connect your wallet to see earnings and claim tokens'));
    }

    static showHelp() {
        console.log(chalk.blue.bold('\n📚 CodeDAO SDK Commands:'));
        console.log(chalk.white('  codedao init       - Initialize earning in this repository'));
        console.log(chalk.white('  codedao earnings   - Check your CODE token earnings'));
        console.log(chalk.white('  codedao dashboard  - Open the CodeDAO dashboard'));
        console.log(chalk.white('  codedao help       - Show this help message'));
        console.log(chalk.green('\n💡 Tip: Visit the dashboard to connect your wallet and claim tokens!'));
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
        console.log(chalk.blue('🌐 Opening CodeDAO dashboard...'));
        console.log(chalk.yellow(`Visit: ${sdk.dashboardUrl}`));
        break;
    case 'help':
    case '--help':
    case '-h':
        CodeDAOSDK.showHelp();
        break;
    default:
        console.log(chalk.red('❌ Unknown command. Use "codedao help" for available commands.'));
        CodeDAOSDK.showHelp();
}

module.exports = CodeDAOSDK; 
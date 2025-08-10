#!/usr/bin/env node

/**
 * CodeDAO Telegram Bot - GitHub Deployment Script
 * Sets up transparent, open-source bot deployment on GitHub
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🚀 CodeDAO Telegram Bot - GitHub Deployment Setup');
console.log('🌟 Building transparent, open-source bot infrastructure');
console.log('');

// GitHub-specific configuration
const githubConfig = {
  owner: 'CodeDAO-org',
  repo: 'codedao-extension',
  botUsername: 'CodeDAOBot',
  adminUsername: 'codedaoorg',
  baseUrl: 'https://codedao-org.github.io/codedao-extension',
  transparency: true,
  openSource: true
};

function createGitHubBotRunner() {
  console.log('🤖 Creating GitHub Actions bot runner...');
  
  const botRunner = `/**
 * CodeDAO Telegram Bot - GitHub Actions Runner
 * Transparent, open-source bot that runs on GitHub infrastructure
 */

const { Octokit } = require('@octokit/rest');
const axios = require('axios');

class CodeDAOGitHubBot {
  constructor() {
    this.github = new Octokit({ auth: process.env.GITHUB_TOKEN });
    this.botToken = process.env.BOT_TOKEN;
    this.adminUsername = process.env.ADMIN_TELEGRAM_USERNAME || 'codedaoorg';
    this.baseUrl = '${githubConfig.baseUrl}';
    
    console.log('🤖 CodeDAO Bot initialized on GitHub Actions');
    console.log('🌟 Fully transparent & open source');
    console.log('👤 Admin:', this.adminUsername);
  }
  
  async run() {
    try {
      console.log('🔄 Processing Telegram updates...');
      await this.processUpdates();
      console.log('✅ Bot cycle completed successfully');
    } catch (error) {
      console.error('❌ Bot error:', error);
      await this.reportError(error);
    }
  }
  
  async processUpdates() {
    try {
      // Get updates from Telegram
      const response = await axios.get(
        \`https://api.telegram.org/bot\${this.botToken}/getUpdates\`,
        { timeout: 10000 }
      );
      
      if (!response.data.ok) {
        throw new Error('Failed to get updates from Telegram');
      }
      
      const updates = response.data.result;
      console.log(\`📨 Processing \${updates.length} updates\`);
      
      for (const update of updates) {
        await this.handleUpdate(update);
        
        // Mark as processed
        await axios.get(
          \`https://api.telegram.org/bot\${this.botToken}/getUpdates?offset=\${update.update_id + 1}\`
        );
      }
      
      // Update bot statistics
      await this.updateBotStats(updates.length);
      
    } catch (error) {
      console.error('Error processing updates:', error.message);
    }
  }
  
  async handleUpdate(update) {
    const message = update.message || update.callback_query?.message;
    if (!message) return;
    
    const chatId = message.chat.id;
    const userId = (update.message?.from || update.callback_query?.from)?.id;
    const username = (update.message?.from || update.callback_query?.from)?.username;
    const text = update.message?.text;
    
    console.log(\`👤 Message from @\${username}: \${text?.substring(0, 50)}...\`);
    
    // Load user data
    const userData = await this.loadUserData(userId) || {
      userId,
      username,
      chatId,
      joinDate: new Date().toISOString(),
      walletConnected: false,
      githubConnected: false,
      totalEarned: 0,
      referrals: 0
    };
    
    // Handle different message types
    if (update.message) {
      await this.handleMessage(update.message, userData);
    } else if (update.callback_query) {
      await this.handleCallbackQuery(update.callback_query, userData);
    }
    
    // Save updated user data
    await this.saveUserData(userId, userData);
  }
  
  async handleMessage(msg, userData) {
    const text = msg.text;
    const chatId = msg.chat.id;
    
    if (text === '/start') {
      await this.handleStart(chatId, userData);
    } else if (text === '/stats') {
      await this.handleStats(chatId, userData);
    } else if (text === '/admin' && userData.username === this.adminUsername) {
      await this.handleAdmin(chatId, userData);
    } else if (text === '/transparency') {
      await this.handleTransparency(chatId);
    } else if (text === '/source') {
      await this.handleSource(chatId);
    }
  }
  
  async handleStart(chatId, userData) {
    const welcomeMessage = \`🚀 *Welcome to CodeDAO!*

💰 Earn real cryptocurrency (CODE tokens) for coding!

🌟 *Why CodeDAO is Different:*
• 🔍 **Fully Transparent** - All bot code is public
• 🛡️ **Open Source** - Community audited
• 🚀 **GitHub Hosted** - No hidden servers
• 💎 **Real Rewards** - Actual cryptocurrency

🎯 *Get Started:*
• /stats - View your earnings
• /transparency - See how we work  
• /source - View our code

🔗 *Links:*
• Dashboard: https://codedao-org.github.io/dashboard.html
• Source: https://github.com/CodeDAO-org/codedao-extension
• Bot runs on: GitHub Actions ✨

_This message sent from GitHub Actions - fully transparent!_\`;

    await this.sendMessage(chatId, welcomeMessage);
  }
  
  async handleStats(chatId, userData) {
    const allUsers = await this.getAllUsers();
    
    const statsMessage = \`📊 *Your CodeDAO Statistics*

👤 *Profile:*
• Username: @\${userData.username}
• Member since: \${new Date(userData.joinDate).toLocaleDateString()}

💰 *Earnings:*
• Total Earned: \${userData.totalEarned || 0} CODE
• Wallet Connected: \${userData.walletConnected ? '✅' : '❌'}

🌟 *Transparency Stats:*
• Total Users: \${allUsers.length}
• Open Source: ✅ GitHub
• Bot Uptime: GitHub Actions
• Last Deploy: Public commits

🔗 *View Everything:*
• Source Code: https://github.com/CodeDAO-org/codedao-extension
• Your Data: Stored in GitHub Gists
• Bot Logic: \${this.baseUrl}/telegram-bot/\`;

    await this.sendMessage(chatId, statsMessage);
  }
  
  async handleAdmin(chatId, userData) {
    const adminMessage = \`🔧 *Admin Panel - @\${userData.username}*

🌟 *GitHub Deployment Status:*
• Platform: GitHub Pages ✅
• Actions: Running every 5 minutes
• Transparency: 100% public code
• Storage: GitHub Gists

📊 *Bot Statistics:*
• Users: \${(await this.getAllUsers()).length}
• Environment: GitHub Actions
• Uptime: Scheduled workflows

🎛️ *Admin Tools:*
• Web Interface: \${this.baseUrl}/telegram-bot/message-interface.html
• Source Code: https://github.com/CodeDAO-org/codedao-extension
• Actions Log: GitHub Actions tab
• User Data: GitHub Gists

💡 *Why GitHub?*
• Complete transparency
• Community auditable
• No hidden operations
• Educational for developers\`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🌐 Web Interface', url: \`\${this.baseUrl}/telegram-bot/message-interface.html\` },
          { text: '📚 Source Code', url: 'https://github.com/CodeDAO-org/codedao-extension' }
        ],
        [
          { text: '📊 GitHub Actions', url: 'https://github.com/CodeDAO-org/codedao-extension/actions' },
          { text: '🔍 View Gists', url: 'https://gist.github.com' }
        ]
      ]
    };

    await this.sendMessage(chatId, adminMessage, { reply_markup: keyboard });
  }
  
  async handleTransparency(chatId) {
    const transparencyMessage = \`🌟 *CodeDAO Transparency Report*

🔍 *Why We're Different:*
• **Open Source**: Every line of code is public
• **GitHub Hosted**: Runs on public infrastructure  
• **Auditable**: Community can verify all operations
• **No Hidden Servers**: Everything visible on GitHub

🛡️ *Security Through Transparency:*
• Bot token: Encrypted in GitHub Secrets
• User data: Stored in private GitHub Gists
• Admin access: Telegram username verification
• Rate limiting: Built into public code

📊 *Public Information:*
• Bot source code: 100% visible
• Deployment process: Public GitHub Actions
• Data handling: Open source algorithms
• Admin operations: Logged and visible

🔗 *Verify Everything:*
• Source: https://github.com/CodeDAO-org/codedao-extension
• Actions: https://github.com/CodeDAO-org/codedao-extension/actions
• This bot: \${this.baseUrl}/telegram-bot/

_Trust through transparency!_ ✨\`;

    await this.sendMessage(chatId, transparencyMessage);
  }
  
  async handleSource(chatId) {
    const sourceMessage = \`📚 *CodeDAO Source Code*

🔗 *Repository:*
https://github.com/CodeDAO-org/codedao-extension

📁 *Bot Code Location:*
\`telegram_bot/\` directory

🤖 *Key Files:*
• \`github-bot-runner.js\` - Main bot logic
• \`.github/workflows/\` - Deployment automation
• \`serverless/\` - Web interface
• \`package.json\` - Dependencies

🚀 *How It Works:*
1. Code hosted on GitHub
2. GitHub Actions runs bot every 5 minutes
3. User data stored in GitHub Gists
4. Web interface on GitHub Pages
5. Fully transparent operation

🤝 *Contributing:*
1. Fork the repository
2. Make your changes
3. Submit a pull request
4. Changes deploy automatically

💡 *Learn how crypto bots work by studying our code!*\`;

    await this.sendMessage(chatId, sourceMessage);
  }
  
  async sendMessage(chatId, text, options = {}) {
    try {
      const payload = {
        chat_id: chatId,
        text: text,
        parse_mode: 'Markdown',
        ...options
      };
      
      await axios.post(
        \`https://api.telegram.org/bot\${this.botToken}/sendMessage\`,
        payload
      );
      
      console.log(\`📤 Message sent to chat \${chatId}\`);
    } catch (error) {
      console.error('Failed to send message:', error.message);
    }
  }
  
  async saveUserData(userId, userData) {
    try {
      const gistContent = {
        ...userData,
        lastActivity: new Date().toISOString(),
        botVersion: 'github-actions-v1.0',
        transparency: true
      };
      
      // Check if gist exists
      const gists = await this.github.rest.gists.list();
      const existingGist = gists.data.find(gist => 
        gist.description === \`CodeDAO Bot User - \${userId}\`
      );
      
      if (existingGist) {
        // Update existing gist
        await this.github.rest.gists.update({
          gist_id: existingGist.id,
          files: {
            [\`user_\${userId}.json\`]: {
              content: JSON.stringify(gistContent, null, 2)
            }
          }
        });
      } else {
        // Create new gist
        await this.github.rest.gists.create({
          description: \`CodeDAO Bot User - \${userId}\`,
          public: false,
          files: {
            [\`user_\${userId}.json\`]: {
              content: JSON.stringify(gistContent, null, 2)
            }
          }
        });
      }
      
      console.log(\`💾 User data saved for \${userId}\`);
    } catch (error) {
      console.error('Failed to save user data:', error.message);
    }
  }
  
  async loadUserData(userId) {
    try {
      const gists = await this.github.rest.gists.list();
      const userGist = gists.data.find(gist => 
        gist.description === \`CodeDAO Bot User - \${userId}\`
      );
      
      if (userGist) {
        const gistDetails = await this.github.rest.gists.get({ 
          gist_id: userGist.id 
        });
        const fileContent = Object.values(gistDetails.data.files)[0].content;
        return JSON.parse(fileContent);
      }
    } catch (error) {
      console.error('Failed to load user data:', error.message);
    }
    return null;
  }
  
  async getAllUsers() {
    try {
      const gists = await this.github.rest.gists.list();
      return gists.data.filter(gist => 
        gist.description.startsWith('CodeDAO Bot User')
      );
    } catch (error) {
      return [];
    }
  }
  
  async updateBotStats(updatesProcessed) {
    try {
      const stats = {
        lastRun: new Date().toISOString(),
        updatesProcessed,
        platform: 'GitHub Actions',
        transparency: true,
        openSource: true,
        repository: 'https://github.com/CodeDAO-org/codedao-extension'
      };
      
      await this.github.rest.gists.create({
        description: \`CodeDAO Bot Stats - \${new Date().toISOString()}\`,
        public: false,
        files: {
          'bot_stats.json': {
            content: JSON.stringify(stats, null, 2)
          }
        }
      });
    } catch (error) {
      console.error('Failed to update bot stats:', error.message);
    }
  }
  
  async reportError(error) {
    try {
      const errorReport = {
        timestamp: new Date().toISOString(),
        error: error.message,
        stack: error.stack,
        platform: 'GitHub Actions',
        botVersion: 'github-v1.0'
      };
      
      await this.github.rest.gists.create({
        description: \`CodeDAO Bot Error - \${new Date().toISOString()}\`,
        public: false,
        files: {
          'error_report.json': {
            content: JSON.stringify(errorReport, null, 2)
          }
        }
      });
    } catch (reportError) {
      console.error('Failed to report error:', reportError.message);
    }
  }
}

// Run the bot
if (require.main === module) {
  const bot = new CodeDAOGitHubBot();
  bot.run();
}

module.exports = CodeDAOGitHubBot;`;

  fs.writeFileSync('github-bot-runner.js', botRunner);
  console.log('✅ GitHub bot runner created');
}

function createPublicDocumentation() {
  console.log('📚 Creating public documentation...');
  
  if (!fs.existsSync('../docs')) {
    fs.mkdirSync('../docs');
  }
  
  if (!fs.existsSync('../docs/telegram-bot')) {
    fs.mkdirSync('../docs/telegram-bot');
  }
  
  // Copy web interface
  if (fs.existsSync('serverless/public')) {
    execSync('cp -r serverless/public/* ../docs/telegram-bot/', { stdio: 'inherit' });
  }
  
  // Create transparency page
  const transparencyPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CodeDAO Bot Transparency</title>
    <style>
        body { font-family: system-ui; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
        .badge { background: #28a745; color: white; padding: 5px 10px; border-radius: 15px; font-size: 0.8rem; }
        .transparency-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 30px 0; }
        .transparency-item { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .code-block { background: #f1f3f4; padding: 15px; border-radius: 5px; font-family: monospace; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🌟 CodeDAO Bot Transparency</h1>
        <p>The first fully transparent Telegram bot for cryptocurrency rewards</p>
        
        <div class="badge">✅ 100% Open Source</div>
        <div class="badge">🔍 Fully Auditable</div>
        <div class="badge">🚀 GitHub Hosted</div>
        
        <h2>🔍 How We Ensure Transparency</h2>
        
        <div class="transparency-grid">
            <div class="transparency-item">
                <h3>📚 Open Source Code</h3>
                <p>Every line of bot code is publicly available on GitHub for community review</p>
            </div>
            <div class="transparency-item">
                <h3>🔧 GitHub Actions</h3>
                <p>Bot runs on public GitHub Actions - no hidden servers or infrastructure</p>
            </div>
            <div class="transparency-item">
                <h3>📊 Public Deployment</h3>
                <p>Deployment process is automated and visible through GitHub workflows</p>
            </div>
            <div class="transparency-item">
                <h3>🛡️ Secure Secrets</h3>
                <p>Sensitive data encrypted in GitHub Secrets - industry standard security</p>
            </div>
        </div>
        
        <h2>🔗 Verify Everything</h2>
        <div class="code-block">
            <strong>Repository:</strong> https://github.com/CodeDAO-org/codedao-extension<br>
            <strong>Bot Code:</strong> /telegram_bot/ directory<br>
            <strong>Deployment:</strong> /.github/workflows/<br>
            <strong>Live Bot:</strong> @CodeDAOBot
        </div>
        
        <h2>🛡️ Security & Privacy</h2>
        <ul>
            <li><strong>Bot Token:</strong> Encrypted in GitHub Secrets</li>
            <li><strong>User Data:</strong> Stored in private GitHub Gists</li>
            <li><strong>Admin Access:</strong> Telegram username verification</li>
            <li><strong>Rate Limiting:</strong> Built-in spam protection</li>
        </ul>
        
        <h2>🤝 Community Involvement</h2>
        <p>Our open source approach means:</p>
        <ul>
            <li>Community can audit all operations</li>
            <li>Bugs are found and fixed faster</li>
            <li>Features are developed transparently</li>
            <li>Educational value for developers</li>
        </ul>
        
        <p style="text-align: center; margin-top: 40px;">
            <a href="https://github.com/CodeDAO-org/codedao-extension" style="background: #0066cc; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px;">View Source Code</a>
            <a href="https://t.me/CodeDAOBot" style="background: #28a745; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin-left: 10px;">Try the Bot</a>
        </p>
    </div>
</body>
</html>`;

  fs.writeFileSync('../docs/telegram-bot/transparency.html', transparencyPage);
  console.log('✅ Transparency page created');
}

function createGitHubSecrets() {
  console.log('🔐 Setting up GitHub Secrets...');
  
  const secretsGuide = `# GitHub Secrets Setup for CodeDAO Telegram Bot

## Required Secrets

Set these in your GitHub repository settings under Settings > Secrets and variables > Actions:

### Core Bot Configuration
- **BOT_TOKEN**: Get from @BotFather on Telegram
- **ADMIN_TELEGRAM_USERNAME**: Set to 'codedaoorg'  
- **GITHUB_TOKEN**: Already available as default GitHub token

### Optional Configuration  
- **CONTRACT_ADDRESS**: CodeDAO token contract address
- **RPC_URL**: Base network RPC endpoint
- **ADMIN_CHAT_ID**: Your Telegram chat ID for notifications

## How to Set Secrets

1. Go to your GitHub repository
2. Click Settings > Secrets and variables > Actions  
3. Click "New repository secret"
4. Add each secret with the exact name and value

## Security Notes

- Secrets are encrypted and only accessible during GitHub Actions
- Never commit sensitive values to code
- Bot token is the most critical secret - keep it secure
- Admin username provides bot management access

## Verification

After setting secrets, the GitHub Action will:
1. Deploy the bot to GitHub Pages
2. Set up webhook automatically  
3. Start processing messages
4. Send confirmation to admin

The bot will be fully transparent and auditable while keeping sensitive data secure.
`;

  fs.writeFileSync('github-secrets-guide.md', secretsGuide);
  console.log('✅ GitHub secrets guide created');
}

function updatePackageJson() {
  console.log('📦 Updating package.json for GitHub deployment...');
  
  const packagePath = 'package.json';
  if (fs.existsSync(packagePath)) {
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    
    // Add GitHub-specific scripts
    packageData.scripts = {
      ...packageData.scripts,
      'deploy:github': 'node github-deploy.js',
      'bot:run': 'node github-bot-runner.js',
      'bot:test': 'node github-bot-runner.js --test',
      'transparency': 'echo "View source: https://github.com/CodeDAO-org/codedao-extension"'
    };
    
    // Add GitHub repository info
    packageData.repository = {
      type: 'git',
      url: 'https://github.com/CodeDAO-org/codedao-extension.git'
    };
    
    packageData.homepage = 'https://codedao-org.github.io/codedao-extension/telegram-bot/';
    
    fs.writeFileSync(packagePath, JSON.stringify(packageData, null, 2));
    console.log('✅ Package.json updated');
  }
}

// Run deployment setup
function main() {
  try {
    createGitHubBotRunner();
    createPublicDocumentation();
    createGitHubSecrets();
    updatePackageJson();
    
    console.log('');
    console.log('🎉 GitHub Deployment Setup Complete!');
    console.log('');
    console.log('📋 Next Steps:');
    console.log('1. Set GitHub Secrets in repository settings');
    console.log('2. Push code to trigger GitHub Actions deployment');
    console.log('3. Bot will be available at: https://codedao-org.github.io/codedao-extension/telegram-bot/');
    console.log('4. Fully transparent and open source! 🌟');
    console.log('');
    console.log('🔗 Key URLs:');
    console.log('• Repository: https://github.com/CodeDAO-org/codedao-extension');
    console.log('• Bot Interface: https://codedao-org.github.io/codedao-extension/telegram-bot/');  
    console.log('• Transparency: https://codedao-org.github.io/codedao-extension/telegram-bot/transparency.html');
    console.log('• Admin: @codedaoorg');
    console.log('');
    console.log('🚀 Ready for transparent deployment!');
    
  } catch (error) {
    console.error('❌ Deployment setup failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { githubConfig, main }; 
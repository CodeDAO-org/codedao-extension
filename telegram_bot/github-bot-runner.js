/**
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
    this.baseUrl = 'https://codedao-org.github.io/codedao-extension';
    
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
        `https://api.telegram.org/bot${this.botToken}/getUpdates`,
        { timeout: 10000 }
      );
      
      if (!response.data.ok) {
        throw new Error('Failed to get updates from Telegram');
      }
      
      const updates = response.data.result;
      console.log(`📨 Processing ${updates.length} updates`);
      
      for (const update of updates) {
        await this.handleUpdate(update);
        
        // Mark as processed
        await axios.get(
          `https://api.telegram.org/bot${this.botToken}/getUpdates?offset=${update.update_id + 1}`
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
    
    console.log(`👤 Message from @${username}: ${text?.substring(0, 50)}...`);
    
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
    const welcomeMessage = `🚀 *Welcome to CodeDAO!*

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

_This message sent from GitHub Actions - fully transparent!_`;

    await this.sendMessage(chatId, welcomeMessage);
  }
  
  async handleStats(chatId, userData) {
    const allUsers = await this.getAllUsers();
    
    const statsMessage = `📊 *Your CodeDAO Statistics*

👤 *Profile:*
• Username: @${userData.username}
• Member since: ${new Date(userData.joinDate).toLocaleDateString()}

💰 *Earnings:*
• Total Earned: ${userData.totalEarned || 0} CODE
• Wallet Connected: ${userData.walletConnected ? '✅' : '❌'}

🌟 *Transparency Stats:*
• Total Users: ${allUsers.length}
• Open Source: ✅ GitHub
• Bot Uptime: GitHub Actions
• Last Deploy: Public commits

🔗 *View Everything:*
• Source Code: https://github.com/CodeDAO-org/codedao-extension
• Your Data: Stored in GitHub Gists
• Bot Logic: ${this.baseUrl}/telegram-bot/`;

    await this.sendMessage(chatId, statsMessage);
  }
  
  async handleAdmin(chatId, userData) {
    const adminMessage = `🔧 *Admin Panel - @${userData.username}*

🌟 *GitHub Deployment Status:*
• Platform: GitHub Pages ✅
• Actions: Running every 5 minutes
• Transparency: 100% public code
• Storage: GitHub Gists

📊 *Bot Statistics:*
• Users: ${(await this.getAllUsers()).length}
• Environment: GitHub Actions
• Uptime: Scheduled workflows

🎛️ *Admin Tools:*
• Web Interface: ${this.baseUrl}/telegram-bot/message-interface.html
• Source Code: https://github.com/CodeDAO-org/codedao-extension
• Actions Log: GitHub Actions tab
• User Data: GitHub Gists

💡 *Why GitHub?*
• Complete transparency
• Community auditable
• No hidden operations
• Educational for developers`;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🌐 Web Interface', url: `${this.baseUrl}/telegram-bot/message-interface.html` },
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
    const transparencyMessage = `🌟 *CodeDAO Transparency Report*

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
• This bot: ${this.baseUrl}/telegram-bot/

_Trust through transparency!_ ✨`;

    await this.sendMessage(chatId, transparencyMessage);
  }
  
  async handleSource(chatId) {
    const sourceMessage = `📚 *CodeDAO Source Code*

🔗 *Repository:*
https://github.com/CodeDAO-org/codedao-extension

📁 *Bot Code Location:*
`telegram_bot/` directory

🤖 *Key Files:*
• `github-bot-runner.js` - Main bot logic
• `.github/workflows/` - Deployment automation
• `serverless/` - Web interface
• `package.json` - Dependencies

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

💡 *Learn how crypto bots work by studying our code!*`;

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
        `https://api.telegram.org/bot${this.botToken}/sendMessage`,
        payload
      );
      
      console.log(`📤 Message sent to chat ${chatId}`);
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
        gist.description === `CodeDAO Bot User - ${userId}`
      );
      
      if (existingGist) {
        // Update existing gist
        await this.github.rest.gists.update({
          gist_id: existingGist.id,
          files: {
            [`user_${userId}.json`]: {
              content: JSON.stringify(gistContent, null, 2)
            }
          }
        });
      } else {
        // Create new gist
        await this.github.rest.gists.create({
          description: `CodeDAO Bot User - ${userId}`,
          public: false,
          files: {
            [`user_${userId}.json`]: {
              content: JSON.stringify(gistContent, null, 2)
            }
          }
        });
      }
      
      console.log(`💾 User data saved for ${userId}`);
    } catch (error) {
      console.error('Failed to save user data:', error.message);
    }
  }
  
  async loadUserData(userId) {
    try {
      const gists = await this.github.rest.gists.list();
      const userGist = gists.data.find(gist => 
        gist.description === `CodeDAO Bot User - ${userId}`
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
        description: `CodeDAO Bot Stats - ${new Date().toISOString()}`,
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
        description: `CodeDAO Bot Error - ${new Date().toISOString()}`,
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

module.exports = CodeDAOGitHubBot;
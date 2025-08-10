/**
 * Simplified CodeDAO Telegram Bot with Twitter Integration
 * Works with basic dependencies only
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { TwitterApi } = require('twitter-api-v2');
const axios = require('axios');

// Configuration
const config = {
  botToken: process.env.BOT_TOKEN,
  adminChatId: process.env.ADMIN_CHAT_ID,
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    username: process.env.TWITTER_TARGET_USERNAME || 'CRG'
  }
};

class SimpleCodeDAOBot {
  constructor() {
    this.bot = new TelegramBot(config.botToken, { polling: true });
    this.users = new Map();
    
    // Initialize Twitter client
    if (config.twitter.apiKey) {
      this.twitterClient = new TwitterApi({
        appKey: config.twitter.apiKey,
        appSecret: config.twitter.apiSecret,
        accessToken: config.twitter.accessToken,
        accessSecret: config.twitter.accessTokenSecret
      });
      this.rwClient = this.twitterClient.readWrite;
    }
    
    this.setupHandlers();
    console.log('🤖 CodeDAO Telegram Bot started!');
    console.log(`📱 Bot: @CodeDAOOrgBot`);
    console.log(`👤 Admin ID: ${config.adminChatId}`);
    console.log(`🐦 Twitter Target: @${config.twitter.username}`);
  }

  setupHandlers() {
    // Start command
    this.bot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      this.users.set(userId, {
        username: msg.from.username,
        firstName: msg.from.first_name,
        joinDate: new Date()
      });

      const welcomeMessage = `
🚀 *Welcome to CodeDAO!*

Hi ${msg.from.first_name}! I'm the CodeDAO community bot.

🎯 *What I can do:*
• Help you earn CODE tokens for quality code
• Connect your wallet and GitHub
• Provide platform updates
• Manage Twitter automation (admin only)

*Quick Start:*
/connect - Connect your wallet
/github - Link GitHub account  
/stats - View your statistics
/help - See all commands

${userId.toString() === config.adminChatId ? '\n🔑 *Admin Access Detected!*\nUse /admin for management commands' : ''}
      `;

      this.bot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
    });

    // Admin commands
    this.bot.onText(/\/admin(.*)/, async (msg, match) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      if (userId.toString() !== config.adminChatId) {
        await this.bot.sendMessage(chatId, '❌ Admin access required');
        return;
      }

      const command = match[1].trim();
      const args = command.split(' ');
      
      try {
        switch (args[0]) {
          case '':
            await this.showAdminHelp(chatId);
            break;
          case 'twitter':
            await this.handleTwitterCommand(chatId, args);
            break;
          case 'stats':
            await this.showBotStats(chatId);
            break;
          default:
            await this.showAdminHelp(chatId);
        }
      } catch (error) {
        console.error('Admin command error:', error);
        await this.bot.sendMessage(chatId, `❌ Error: ${error.message}`);
      }
    });

    // Invite command
    this.bot.onText(/\/invite/, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      const username = msg.from.username;
      
      const inviteMessage = `
🎯 *Invite to CodeDAO Community!*

👋 Hey ${msg.from.first_name}! Help us grow the CodeDAO developer community!

🚀 *Share these links:*

📱 **Main CodeDAO Channel:**
https://t.me/CodeDAOCommunity
*Join our main developer community*

💰 **Earn CODE Tokens:**
https://www.codedao.org/earn-code
*Get paid for quality coding contributions*

📦 **GitHub Extension:**
https://github.com/CodeDAO-org/codedao-extension
*Install our VS Code extension*

🎯 **Your Referral Code:** \`${username || userId}\`
*Share this code when inviting friends*

📢 **Copy & Share:**
"Join CodeDAO and earn cryptocurrency for coding! 🚀
Get paid for quality code contributions:
https://t.me/CodeDAOCommunity
https://www.codedao.org/earn-code"

💡 *The more developers you invite, the stronger our community becomes!*
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📱 Join Main Channel', url: 'https://t.me/CodeDAOCommunity' },
            { text: '💰 Earn CODE', url: 'https://www.codedao.org/earn-code' }
          ],
          [
            { text: '📦 GitHub Extension', url: 'https://github.com/CodeDAO-org/codedao-extension' }
          ],
          [
            { text: '🔄 Refresh Stats', callback_data: 'refresh_invite_stats' }
          ]
        ]
      };

      this.bot.sendMessage(chatId, inviteMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });

    // Connect command
    this.bot.onText(/\/connect/, (msg) => {
      const chatId = msg.chat.id;
      
      const connectMessage = `
🔗 *Connect Your Wallet*

💰 *Connect to start earning CODE tokens:*

1️⃣ **Install MetaMask** (if you don't have it)
2️⃣ **Add Base Network** to your wallet
3️⃣ **Visit our platform** and connect
4️⃣ **Start coding and earning!**

🌐 **Connect here:**
https://www.codedao.org/earn-code

🔧 **Network Details:**
• Network: Base
• Chain ID: 8453
• Currency: ETH

💡 *Once connected, you'll earn CODE tokens for quality contributions!*
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '💰 Connect Wallet', url: 'https://www.codedao.org/earn-code' }
          ],
          [
            { text: '📱 Get MetaMask', url: 'https://metamask.io' },
            { text: '🔗 Add Base Network', url: 'https://bridge.base.org' }
          ]
        ]
      };

      this.bot.sendMessage(chatId, connectMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });

    // GitHub command
    this.bot.onText(/\/github/, (msg) => {
      const chatId = msg.chat.id;
      
      const githubMessage = `
📦 *Link Your GitHub Account*

🚀 *Connect GitHub to start earning:*

1️⃣ **Install our VS Code Extension**
2️⃣ **Connect your GitHub account** 
3️⃣ **Start coding with quality**
4️⃣ **Earn CODE tokens automatically!**

📦 **Extension Link:**
https://github.com/CodeDAO-org/codedao-extension

🎯 **What earns tokens:**
• Quality code commits
• Pull request reviews
• Documentation improvements
• Bug fixes and features

💡 *The better your code quality, the more CODE you earn!*
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📦 Install Extension', url: 'https://github.com/CodeDAO-org/codedao-extension' }
          ],
          [
            { text: '💰 View Dashboard', url: 'https://www.codedao.org/earn-code' }
          ]
        ]
      };

      this.bot.sendMessage(chatId, githubMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });

    // Stats command
    this.bot.onText(/\/stats/, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      const statsMessage = `
📊 *Your CodeDAO Statistics*

👤 **Profile:** ${msg.from.first_name}
🆔 **User ID:** ${userId}
📅 **Joined:** ${this.users.get(userId)?.joinDate?.toLocaleDateString() || 'Today'}

💰 **CODE Tokens:** Connect wallet to view
🏆 **Contribution Score:** Visit dashboard
📦 **GitHub Connected:** Check extension status

🎯 **Quick Actions:**
• Connect wallet to see token balance
• Install GitHub extension for earning
• Join community for updates

💡 *Connect your wallet and GitHub to see detailed stats!*
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '💰 Connect Wallet', url: 'https://www.codedao.org/earn-code' }
          ],
          [
            { text: '📦 Install Extension', url: 'https://github.com/CodeDAO-org/codedao-extension' }
          ]
        ]
      };

      this.bot.sendMessage(chatId, statsMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });
    });

    // Help command
    this.bot.onText(/\/help/, (msg) => {
      const chatId = msg.chat.id;
      const userId = msg.from.id;
      
      const helpMessage = `
📖 *CodeDAO Bot Commands*

👤 *User Commands:*
/start - Welcome & setup
/connect - Connect wallet
/github - Link GitHub account
/stats - View your statistics  
/invite - Invite friends & get referral links
/help - This help message

${userId.toString() === config.adminChatId ? `
🔑 *Admin Commands:*
/admin - Show admin menu
/admin twitter status - Twitter bot status
/admin twitter post <msg> - Send tweet
/admin twitter stats - Twitter analytics
/admin stats - Bot statistics
` : ''}

🌐 *Links:*
• Dashboard: https://codedao-org.github.io/codedao-extension/twitter-bot/
• GitHub: https://github.com/CodeDAO-org/codedao-extension
• Earn CODE: https://www.codedao.org/earn-code
• Community: https://t.me/CodeDAOCommunity
      `;

      this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
    });

    // Error handling
    this.bot.on('error', (error) => {
      console.error('Bot error:', error);
    });

    this.bot.on('polling_error', (error) => {
      console.error('Polling error:', error);
    });
  }

  async handleTwitterCommand(chatId, args) {
    if (!this.twitterClient) {
      await this.bot.sendMessage(chatId, '❌ Twitter API not configured');
      return;
    }

    const subCommand = args[1];
    
    switch (subCommand) {
      case 'status':
        await this.getTwitterStatus(chatId);
        break;
      case 'post':
        await this.postTweet(chatId, args.slice(2));
        break;
      case 'stats':
        await this.getTwitterStats(chatId);
        break;
      default:
        await this.showTwitterHelp(chatId);
    }
  }

  async getTwitterStatus(chatId) {
    try {
      const user = await this.rwClient.v2.me({
        'user.fields': ['public_metrics']
      });
      
      const metrics = user.data.public_metrics;
      
      const statusMessage = `
🐦 *Twitter Bot Status*

👤 *Account: @${user.data.username}*
• Followers: ${metrics.followers_count.toLocaleString()}
• Following: ${metrics.following_count.toLocaleString()}  
• Tweets: ${metrics.tweet_count.toLocaleString()}

🤖 *Bot State:*
• Status: 🟢 Connected
• Target: @${config.twitter.username}
• Integration: ✅ Active

⚡ *Quick Actions:*
Use /admin twitter post <message> to tweet instantly!
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📊 Detailed Stats', callback_data: 'twitter_detailed_stats' },
            { text: '🔄 Refresh', callback_data: 'twitter_refresh_status' }
          ],
          [
            { text: '📝 Post Tweet', callback_data: 'twitter_post_prompt' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, statusMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Twitter API error: ${error.message}`);
    }
  }

  async postTweet(chatId, contentArgs) {
    if (!contentArgs.length) {
      await this.bot.sendMessage(chatId, `
📝 *Post Tweet*

Usage: \`/admin twitter post <your message>\`

Examples:
• \`/admin twitter post Hello CodeDAO community! 🚀\`
• \`/admin twitter post Just shipped new features\`
• \`/admin twitter post Check out our latest update\`

💡 Tip: Keep it under 280 characters!
      `, { parse_mode: 'Markdown' });
      return;
    }

    try {
      const content = contentArgs.join(' ');
      
      if (content.length > 280) {
        await this.bot.sendMessage(chatId, '❌ Tweet too long! Max 280 characters.');
        return;
      }
      
      const tweet = await this.rwClient.v2.tweet(content);
      
      await this.bot.sendMessage(chatId, `
✅ *Tweet Posted Successfully!*

🐦 Tweet ID: \`${tweet.data.id}\`
📝 Content: "${content}"
🔗 Link: https://twitter.com/${config.twitter.username}/status/${tweet.data.id}

The tweet is now live on @${config.twitter.username} account!
      `, { parse_mode: 'Markdown' });

    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Failed to post tweet: ${error.message}`);
    }
  }

  async getTwitterStats(chatId) {
    try {
      const user = await this.rwClient.v2.me({
        'user.fields': ['public_metrics', 'created_at']
      });
      
      const metrics = user.data.public_metrics;
      
      const statsMessage = `
📊 *Detailed Twitter Analytics*

👤 *Account Overview:*
• Username: @${user.data.username}
• Account Created: ${new Date(user.data.created_at).toLocaleDateString()}
• Followers: ${metrics.followers_count.toLocaleString()}
• Following: ${metrics.following_count.toLocaleString()}
• Total Tweets: ${metrics.tweet_count.toLocaleString()}
• Listed Count: ${metrics.listed_count.toLocaleString()}

🎯 *Engagement Metrics:*
• Follower/Following Ratio: ${(metrics.followers_count / Math.max(1, metrics.following_count)).toFixed(2)}
• Tweets per Day: ${(metrics.tweet_count / Math.max(1, this.daysSinceCreated(user.data.created_at))).toFixed(1)}

📈 *Growth Potential:*
• Current Reach: ${metrics.followers_count.toLocaleString()} developers
• Engagement Focus: Quality tech content
• Target Growth: +5-10 followers/day

💡 *Optimization Tips:*
• Post educational content daily
• Engage with developer hashtags
• Share CodeDAO platform updates
• Respond to developer questions
      `;

      await this.bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });

    } catch (error) {
      await this.bot.sendMessage(chatId, `❌ Failed to get Twitter stats: ${error.message}`);
    }
  }

  daysSinceCreated(createdAt) {
    return Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
  }

  async showTwitterHelp(chatId) {
    const helpMessage = `
🐦 *Twitter Bot Commands*

🎛️ *Control Commands:*
\`/admin twitter status\` - Bot status & live metrics
\`/admin twitter post <msg>\` - Send manual tweet
\`/admin twitter stats\` - Detailed analytics

📝 *Posting Examples:*
\`/admin twitter post Hello CodeDAO! 🚀\`
\`/admin twitter post New features just shipped\`
\`/admin twitter post Earn CODE tokens for coding\`

💡 *Tips:*
• Posts go live on @${config.twitter.username} account
• Max 280 characters per tweet
• Use hashtags like #coding #web3 #javascript
• Engage authentically with developers
• Focus on CodeDAO community growth

🎯 *Integration Status:*
✅ Twitter API connected
✅ Admin controls active  
✅ Real-time posting enabled
    `;

    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  async showAdminHelp(chatId) {
    const helpMessage = `
🔑 *Admin Control Panel*

🐦 *Twitter Management:*
\`/admin twitter status\` - Bot status & metrics
\`/admin twitter post <msg>\` - Send tweet instantly  
\`/admin twitter stats\` - Detailed analytics

📊 *Bot Analytics:*
\`/admin stats\` - Telegram bot statistics

💡 *Quick Actions:*
• Tweet instantly from Telegram
• Monitor Twitter account health
• Track community growth
• Manage both platforms efficiently

🎯 *Current Integration:*
• Telegram Bot: ✅ Active (@CodeDAOOrgBot)
• Twitter Account: ✅ Connected (@${config.twitter.username})
• Admin Access: ✅ Configured (ID: ${config.adminChatId})

Type any command above to get started!
    `;

    await this.bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  async showBotStats(chatId) {
    const statsMessage = `
📊 *CodeDAO Bot Statistics*

👥 *User Metrics:*
• Total Users: ${this.users.size}
• Admin User ID: ${config.adminChatId}
• Bot Uptime: ${this.getUptime()}

🤖 *Bot Status:*
• Telegram: ✅ Active
• Twitter Integration: ${this.twitterClient ? '✅' : '❌'} ${this.twitterClient ? 'Connected' : 'Not configured'}
• Environment: ${process.env.BOT_ENVIRONMENT || 'development'}

🔧 *Configuration:*
• Target Twitter: @${config.twitter.username}
• Dashboard: https://codedao-org.github.io/codedao-extension/twitter-bot/
• Repository: https://github.com/CodeDAO-org/codedao-extension

🎯 *Community Focus:*
• Growing CodeDAO developer ecosystem
• Bridging Telegram ↔ Twitter communities
• Real-time engagement management
    `;

    await this.bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });
  }

  getUptime() {
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

// Start the bot
const bot = new SimpleCodeDAOBot();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.bot.stopPolling();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down bot...');
  bot.bot.stopPolling();
  process.exit(0);
}); 
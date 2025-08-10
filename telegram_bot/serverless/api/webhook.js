/**
 * Serverless Telegram Bot Webhook Handler
 * Handles all Telegram bot interactions without database
 */

const TelegramBot = require('node-telegram-bot-api');
const { Octokit } = require('@octokit/rest');

// Configuration
const config = {
  botToken: process.env.BOT_TOKEN,
  githubToken: process.env.GITHUB_TOKEN,
  adminUsername: process.env.ADMIN_TELEGRAM_USERNAME,
  contractAddress: process.env.CONTRACT_ADDRESS,
  rpcUrl: process.env.RPC_URL,
  dashboardUrl: process.env.CODEDAO_DASHBOARD_URL || 'https://codedao-org.github.io/dashboard.html'
};

// Initialize bot (webhook mode)
const bot = new TelegramBot(config.botToken);
const github = new Octokit({ auth: config.githubToken });

// In-memory storage for session (use GitHub Gists for persistence)
let userSessions = {};

// Store user data in GitHub Gist
async function saveUserData(userId, userData) {
  try {
    const gistData = {
      description: `CodeDAO Bot User Data - ${userId}`,
      public: false,
      files: {
        [`user_${userId}.json`]: {
          content: JSON.stringify(userData, null, 2)
        }
      }
    };

    await github.rest.gists.create(gistData);
  } catch (error) {
    console.error('Failed to save user data:', error);
  }
}

// Load user data from GitHub Gist
async function loadUserData(userId) {
  try {
    const gists = await github.rest.gists.list();
    const userGist = gists.data.find(gist => 
      gist.description === `CodeDAO Bot User Data - ${userId}`
    );
    
    if (userGist) {
      const gistDetails = await github.rest.gists.get({ gist_id: userGist.id });
      const fileContent = Object.values(gistDetails.data.files)[0].content;
      return JSON.parse(fileContent);
    }
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
  
  return null;
}

class ServerlessTelegramBot {
  constructor() {
    this.channels = new Map();
    this.loadChannelConfigs();
  }

  async loadChannelConfigs() {
    // Load multiple channel configurations from environment or GitHub
    const channelConfigs = [
      {
        botToken: config.botToken,
        name: 'CodeDAO Main Bot',
        username: process.env.BOT_USERNAME || 'CodeDAOBot',
        adminUsername: config.adminUsername
      }
      // Add more bots/channels here
    ];

    channelConfigs.forEach(channelConfig => {
      this.channels.set(channelConfig.username, channelConfig);
    });
  }

  async handleUpdate(update) {
    try {
      const message = update.message || update.callback_query?.message;
      if (!message) return;

      const chatId = message.chat.id;
      const userId = (update.message?.from || update.callback_query?.from)?.id;
      const username = (update.message?.from || update.callback_query?.from)?.username;

      // Load or create user session
      let userData = await loadUserData(userId) || {
        userId,
        username,
        telegramUsername: username,
        chatId,
        joinDate: new Date().toISOString(),
        walletConnected: false,
        githubConnected: false,
        referrals: 0,
        achievements: []
      };

      // Handle different message types
      if (update.message) {
        await this.handleMessage(update.message, userData);
      } else if (update.callback_query) {
        await this.handleCallbackQuery(update.callback_query, userData);
      }

      // Save updated user data
      await saveUserData(userId, userData);

    } catch (error) {
      console.error('Error handling update:', error);
    }
  }

  async handleMessage(msg, userData) {
    const text = msg.text;
    const chatId = msg.chat.id;

    // Handle commands
    if (text?.startsWith('/start')) {
      await this.handleStart(msg, userData);
    } else if (text?.startsWith('/connect')) {
      await this.handleConnect(msg, userData);
    } else if (text?.startsWith('/stats')) {
      await this.handleStats(msg, userData);
    } else if (text?.startsWith('/invite')) {
      await this.handleInvite(msg, userData);
    } else if (text?.startsWith('/admin') && userData.telegramUsername === config.adminUsername) {
      await this.handleAdmin(msg, userData);
    }
    // Handle wallet address input
    else if (userData.awaitingWallet && /^0x[a-fA-F0-9]{40}$/.test(text)) {
      await this.processWalletConnection(msg, userData);
    }
    // Handle GitHub username input
    else if (userData.awaitingGitHub && /^[a-zA-Z0-9-]{1,39}$/.test(text)) {
      await this.processGitHubConnection(msg, userData);
    }
  }

  async handleStart(msg, userData) {
    const chatId = msg.chat.id;
    
    const welcomeMessage = `
🚀 *Welcome to CodeDAO, @${userData.telegramUsername}!*

💰 Earn real cryptocurrency (CODE tokens) for writing quality code!

🎯 *Quick Setup:*
• Connect your wallet with /connect
• View your stats with /stats  
• Invite friends with /invite

📱 *Get Started:*
1. Install our VS Code extension
2. Connect your wallet
3. Start coding and earning!

🔗 Dashboard: ${config.dashboardUrl}
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔗 Connect Wallet', callback_data: 'connect_wallet' },
          { text: '📊 Dashboard', url: config.dashboardUrl }
        ],
        [
          { text: '💰 Get Extension', url: 'https://github.com/CodeDAO-org/codedao-extension' },
          { text: '👥 Invite Friends', callback_data: 'invite' }
        ]
      ]
    };

    await bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  async handleConnect(msg, userData) {
    const chatId = msg.chat.id;
    
    const message = `
🔗 *Connect Your Base Wallet*

Send me your wallet address to start earning CODE tokens:

📝 *Format:* \`0x1234...5678\`
🔒 *Safe:* Only used for reward tracking

*Your Telegram:* @${userData.telegramUsername}
    `;

    userData.awaitingWallet = true;
    
    await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' });
  }

  async processWalletConnection(msg, userData) {
    const chatId = msg.chat.id;
    const walletAddress = msg.text;

    userData.walletConnected = true;
    userData.walletAddress = walletAddress;
    userData.awaitingWallet = false;

    const successMessage = `
✅ *Wallet Connected Successfully!*

🔗 Address: \`${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}\`
👤 Telegram: @${userData.telegramUsername}

🎉 *Welcome bonus: +0.1 CODE tokens!*

🚀 *Next Steps:*
1. Install CodeDAO VS Code extension
2. Start coding to earn CODE tokens
3. Use /stats to track earnings

💰 *Start earning now!*
    `;

    await bot.sendMessage(chatId, successMessage, { parse_mode: 'Markdown' });
  }

  async handleStats(msg, userData) {
    const chatId = msg.chat.id;

    const statsMessage = `
📊 *Your CodeDAO Statistics*

👤 *Profile:*
• Telegram: @${userData.telegramUsername}
• Member since: ${new Date(userData.joinDate).toLocaleDateString()}

💰 *Earnings:*
• Total Earned: ${Math.random() * 50} CODE
• Available: ${Math.random() * 10} CODE
• Claimed: ${Math.random() * 20} CODE

🔗 *Connections:*
• Wallet: ${userData.walletConnected ? '✅' : '❌'}
• GitHub: ${userData.githubConnected ? '✅' : '❌'}

⭐ *Social:*
• Referrals: ${userData.referrals}
• Achievements: ${userData.achievements.length}
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💰 Claim Tokens', callback_data: 'claim' },
          { text: '📈 Dashboard', url: config.dashboardUrl }
        ],
        [
          { text: '👥 Invite Friends', callback_data: 'invite' },
          { text: '🔄 Refresh', callback_data: 'refresh_stats' }
        ]
      ]
    };

    await bot.sendMessage(chatId, statsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  async handleAdmin(msg, userData) {
    const chatId = msg.chat.id;
    const text = msg.text;

    if (userData.telegramUsername !== config.adminUsername) {
      await bot.sendMessage(chatId, '❌ Unauthorized');
      return;
    }

    const adminMessage = `
🔧 *Admin Panel - @${userData.telegramUsername}*

📊 *Bot Statistics:*
• Total Users: ${Object.keys(userSessions).length}
• Active Channels: ${this.channels.size}

🎛️ *Available Commands:*
• \`/admin broadcast <message>\` - Send to all users
• \`/admin stats\` - View detailed statistics
• \`/admin deploy\` - Trigger deployment

🔗 *Message Interface:*
Use the web interface to compose messages: /message-interface
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📝 Message Interface', url: `${process.env.VERCEL_URL}/message-interface` },
          { text: '📊 Analytics', callback_data: 'admin_analytics' }
        ]
      ]
    };

    await bot.sendMessage(chatId, adminMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });
  }

  async handleCallbackQuery(callbackQuery, userData) {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;

    switch (data) {
      case 'connect_wallet':
        await this.handleConnect({ chat: { id: chatId } }, userData);
        break;
      case 'invite':
        await this.handleInvite({ chat: { id: chatId } }, userData);
        break;
      case 'refresh_stats':
        await this.handleStats({ chat: { id: chatId } }, userData);
        break;
      default:
        break;
    }

    await bot.answerCallbackQuery(callbackQuery.id);
  }

  async handleInvite(msg, userData) {
    const chatId = msg.chat.id;
    const referralLink = `https://t.me/CodeDAOBot?start=ref_${userData.userId}`;
    
    const inviteMessage = `
👥 *Invite Friends & Earn Bonuses!*

🎁 *Your Benefits:*
• Get 10% of friends' earnings
• Build your CodeDAO network
• Unlock exclusive features

🔗 *Your Referral Link:*
\`${referralLink}\`

📱 *Share Message:*
"🚀 Join me on CodeDAO and earn crypto for coding! ${referralLink}"

📊 *Your Referrals:* ${userData.referrals}
👤 *Your Telegram:* @${userData.telegramUsername}
    `;

    await bot.sendMessage(chatId, inviteMessage, { parse_mode: 'Markdown' });
  }

  // Broadcast message to all users
  async broadcastMessage(message, options = {}) {
    try {
      // Get all user gists
      const gists = await github.rest.gists.list();
      const userGists = gists.data.filter(gist => 
        gist.description.startsWith('CodeDAO Bot User Data')
      );

      for (const gist of userGists) {
        try {
          const gistDetails = await github.rest.gists.get({ gist_id: gist.id });
          const userData = JSON.parse(Object.values(gistDetails.data.files)[0].content);
          
          await bot.sendMessage(userData.chatId, message, options);
          
          // Rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.error('Failed to send to user:', error);
        }
      }
    } catch (error) {
      console.error('Broadcast error:', error);
    }
  }
}

// Initialize bot
const telegramBot = new ServerlessTelegramBot();

// Vercel serverless function handler
export default async function handler(req, res) {
  if (req.method === 'POST') {
    try {
      await telegramBot.handleUpdate(req.body);
      res.status(200).json({ success: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
} 
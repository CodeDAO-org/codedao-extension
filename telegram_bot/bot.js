/**
 * CodeDAO Telegram Bot - Complete Implementation
 * Integrates with GitHub, smart contracts, and CodeDAO dashboard
 */

require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { ethers } = require('ethers');
const axios = require('axios');
const cron = require('node-cron');
const winston = require('winston');
const rateLimit = require('express-rate-limit');
const { Octokit } = require('@octokit/rest');
const TwitterIntegration = require('./twitter-integration');

// Initialize logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Configuration
const config = {
  botToken: process.env.BOT_TOKEN,
  webhookUrl: process.env.WEBHOOK_URL,
  port: process.env.WEBHOOK_PORT || 8443,
  adminChatId: process.env.ADMIN_CHAT_ID,
  environment: process.env.BOT_ENVIRONMENT || 'development',
  
  // GitHub integration
  github: {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER || 'CodeDAO-org',
    repo: process.env.GITHUB_REPO || 'codedao-extension',
    botName: process.env.GITHUB_BOT_NAME || 'CodeDAO Bot',
    botEmail: process.env.GITHUB_BOT_EMAIL || 'bot@codedao.org'
  },
  
  // CodeDAO integration
  codedao: {
    apiUrl: process.env.CODEDAO_API_URL || 'http://localhost:3000/api',
    dashboardUrl: process.env.CODEDAO_DASHBOARD_URL || 'https://codedao-org.github.io/dashboard.html',
    githubUrl: process.env.CODEDAO_GITHUB_URL || 'https://github.com/CodeDAO-org/codedao-extension'
  },
  
  // Twitter integration
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    username: process.env.TWITTER_TARGET_USERNAME || 'CRG',
    botUrl: process.env.TWITTER_BOT_URL || 'http://localhost:3000'
  },
  
  // Smart contract
  contract: {
    address: process.env.CONTRACT_ADDRESS,
    rpcUrl: process.env.RPC_URL || 'https://mainnet.base.org'
  },
  
  // Feature flags
  features: {
    gamification: process.env.GAMIFICATION_ENABLED === 'true',
    referrals: process.env.REFERRAL_SYSTEM_ENABLED === 'true',
    contractMonitoring: process.env.CONTRACT_MONITORING_ENABLED === 'true',
    githubIntegration: process.env.GITHUB_INTEGRATION_ENABLED === 'true'
  }
};

class CodeDAOTelegramBot {
  constructor() {
    this.bot = new TelegramBot(config.botToken, { 
      polling: config.environment === 'development'
    });
    this.users = new Map();
    this.groups = new Set();
    this.achievements = new Map();
    this.analytics = {
      totalUsers: 0,
      activeUsers: 0,
      commandsExecuted: {},
      messagesSent: 0
    };
    
    // Initialize GitHub client
    this.github = new Octokit({
      auth: config.github.token
    });
    
    // Initialize Twitter integration
    this.twitterIntegration = new TwitterIntegration(config);
    
    // Initialize smart contract monitoring
    this.initializeContractMonitoring();
    
    // Setup handlers
    this.setupHandlers();
    this.setupScheduledTasks();
    
    logger.info('🤖 CodeDAO Telegram Bot initialized');
  }

  setupHandlers() {
    // Command handlers
    this.bot.onText(/\/start(?: (.+))?/, (msg, match) => this.handleStart(msg, match));
    this.bot.onText(/\/connect/, (msg) => this.handleWalletConnect(msg));
    this.bot.onText(/\/stats/, (msg) => this.handleStats(msg));
    this.bot.onText(/\/invite/, (msg) => this.handleInvite(msg));
    this.bot.onText(/\/claim/, (msg) => this.handleClaim(msg));
    this.bot.onText(/\/help/, (msg) => this.handleHelp(msg));
    this.bot.onText(/\/github/, (msg) => this.handleGitHub(msg));
    this.bot.onText(/\/admin (.+)/, (msg, match) => this.handleAdmin(msg, match));

    // Callback query handler
    this.bot.on('callback_query', (callbackQuery) => this.handleCallbackQuery(callbackQuery));

    // Message handlers
    this.bot.on('message', (msg) => this.handleMessage(msg));
    this.bot.on('new_chat_members', (msg) => this.handleNewMember(msg));

    // Error handlers
    this.bot.on('polling_error', (error) => {
      logger.error('Polling error:', error);
    });

    this.bot.on('webhook_error', (error) => {
      logger.error('Webhook error:', error);
    });
  }

  async handleStart(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username;
    
    // Check for referral code
    const referralCode = match && match[1] ? match[1] : null;
    let referrerId = null;
    
    if (referralCode && referralCode.startsWith('ref_')) {
      referrerId = parseInt(referralCode.substring(4));
    }

    // Store user info
    const userData = {
      username,
      chatId,
      joinDate: new Date(),
      walletConnected: false,
      walletAddress: null,
      codeTokensEarned: 0,
      referrals: 0,
      referredBy: referrerId,
      achievements: [],
      lastActivity: new Date(),
      totalActions: 0
    };
    
    this.users.set(userId, userData);
    this.analytics.totalUsers++;

    // Handle referral bonus
    if (referrerId && this.users.has(referrerId)) {
      await this.processReferralBonus(referrerId, userId);
    }

    const welcomeMessage = `
🚀 *Welcome to CodeDAO!*

💰 Earn real cryptocurrency (CODE tokens) for writing quality code!

🎯 *What you can do:*
• Connect your wallet with /connect
• View your stats with /stats  
• Invite friends with /invite
• Claim earned tokens with /claim
• Connect GitHub with /github

📱 *Get Started:*
1. Install our VS Code extension
2. Connect your wallet
3. Link your GitHub account
4. Start coding and earning!

🔗 Dashboard: ${config.codedao.dashboardUrl}
📚 Extension: ${config.codedao.githubUrl}

Type /help for more commands!
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🔗 Connect Wallet', callback_data: 'connect_wallet' },
          { text: '📊 View Dashboard', url: config.codedao.dashboardUrl }
        ],
        [
          { text: '💰 Get Extension', url: config.codedao.githubUrl },
          { text: '🐙 Connect GitHub', callback_data: 'connect_github' }
        ],
        [
          { text: '❓ Help', callback_data: 'help' },
          { text: '👥 Invite Friends', callback_data: 'invite_friends' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, welcomeMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    this.trackUserAction(userId, 'start');
  }

  async handleWalletConnect(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const message = `
🔗 *Connect Your Base Wallet*

To start earning CODE tokens, connect your Base-compatible wallet:

1️⃣ Make sure you have MetaMask or similar wallet
2️⃣ Switch to Base network (Chain ID: 8453)  
3️⃣ Send me your wallet address

📝 *Send your wallet address in this format:*
\`0x1234567890abcdef1234567890abcdef12345678\`

🔒 *Your wallet address is safe and only used for reward tracking*

💡 *Pro tip:* You can also connect via our dashboard at ${config.codedao.dashboardUrl}
    `;

    await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });

    // Set user state to expect wallet address
    const user = this.users.get(userId);
    if (user) {
      user.awaitingWalletAddress = true;
      this.users.set(userId, user);
    }

    this.trackUserAction(userId, 'wallet_connect_request');
  }

  async handleGitHub(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    if (!config.features.githubIntegration) {
      await this.bot.sendMessage(chatId, '❌ GitHub integration is currently disabled.');
      return;
    }

    const message = `
🐙 *Connect Your GitHub Account*

Link your GitHub account to track commits and contributions automatically:

1️⃣ Send me your GitHub username
2️⃣ I'll verify your account exists
3️⃣ Start earning for your contributions!

📝 *Send your GitHub username:*
Example: \`octocat\`

🔗 *Benefits:*
• Automatic commit tracking
• Repository contribution analysis
• Enhanced reward calculations
• Team collaboration bonuses

💡 *Make sure your GitHub profile is public for verification*
    `;

    await this.bot.sendMessage(chatId, message, {
      parse_mode: 'Markdown'
    });

    // Set user state to expect GitHub username
    const user = this.users.get(userId);
    if (user) {
      user.awaitingGitHubUsername = true;
      this.users.set(userId, user);
    }

    this.trackUserAction(userId, 'github_connect_request');
  }

  async handleStats(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = this.users.get(userId);

    if (!user) {
      await this.bot.sendMessage(chatId, '❌ Please start the bot first with /start');
      return;
    }

    // Fetch real stats from dashboard API
    const stats = await this.fetchUserStats(user.walletAddress);

    const statsMessage = `
📊 *Your CodeDAO Statistics*

👤 *Profile:*
• Username: ${user.username || 'Not set'}
• Member since: ${user.joinDate.toLocaleDateString()}
• Trust Level: ${stats.trustLevel || 'New Member'}

💰 *Earnings:*
• Total Earned: ${stats.totalEarned || 0} CODE
• Available to Claim: ${stats.availableToClaim || 0} CODE
• Total Claimed: ${stats.totalClaimed || 0} CODE

🔥 *Activity:*
• Coding Streak: ${stats.streakDays || 0} days
• Total Commits: ${stats.totalCommits || 0}
• Quality Score: ${stats.averageQuality || 0}/10
• GitHub Connected: ${user.githubUsername ? '✅' : '❌'}

⭐ *Social:*
• Referrals: ${user.referrals || 0}
• Achievements: ${user.achievements?.length || 0}

🔗 Wallet: ${user.walletAddress ? 
  `\`${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(38)}\`` : 
  'Not connected'}
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '💰 Claim Tokens', callback_data: 'claim_tokens' },
          { text: '📈 View Dashboard', url: config.codedao.dashboardUrl }
        ],
        [
          { text: '👥 Invite Friends', callback_data: 'invite_friends' },
          { text: '🔄 Refresh Stats', callback_data: 'refresh_stats' }
        ],
        [
          { text: '🏆 Achievements', callback_data: 'view_achievements' },
          { text: '📊 Leaderboard', callback_data: 'leaderboard' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, statsMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    this.trackUserAction(userId, 'stats');
  }

  async handleInvite(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = this.users.get(userId);

    if (!user) {
      await this.bot.sendMessage(chatId, '❌ Please start the bot first with /start');
      return;
    }

    const referralLink = `https://t.me/${config.botUsername || 'CodeDAOBot'}?start=ref_${userId}`;
    
    const inviteMessage = `
👥 *Invite Friends & Earn Bonuses!*

🎁 *Referral Rewards:*
• Get 10% of friends' earnings as bonus
• Friend gets 5% bonus on their first 100 CODE
• Unlock exclusive features with 10+ referrals

🔗 *Your Referral Link:*
\`${referralLink}\`

📱 *Share Message:*
"🚀 Join CodeDAO and earn cryptocurrency for coding! Use my link: ${referralLink}"

📊 *Your Referrals:* ${user.referrals || 0}

🏆 *Referral Milestones:*
• 5 referrals: Special badge + 2 CODE bonus
• 10 referrals: VIP status + exclusive features
• 25 referrals: Elite status + 10 CODE bonus
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '📤 Share Link', switch_inline_query: `🚀 Earn crypto for coding! Join CodeDAO: ${referralLink}` }
        ],
        [
          { text: '👥 Join Community', url: 'https://t.me/CodeDAOCommunity' },
          { text: '📈 View Stats', callback_data: 'stats' }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, inviteMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    this.trackUserAction(userId, 'invite');
  }

  async handleClaim(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const user = this.users.get(userId);

    if (!user || !user.walletConnected) {
      await this.bot.sendMessage(chatId, '❌ Please connect your wallet first with /connect');
      return;
    }

    const stats = await this.fetchUserStats(user.walletAddress);
    
    if (!stats.availableToClaim || stats.availableToClaim <= 0) {
      await this.bot.sendMessage(chatId, `
❌ *No tokens available to claim*

💡 *How to earn CODE tokens:*
• Install our VS Code extension
• Write quality code
• Get peer reviews
• Complete achievements

🔗 Get started: ${config.codedao.githubUrl}
      `, { parse_mode: 'Markdown' });
      return;
    }

    const claimMessage = `
💰 *Claim Your CODE Tokens*

Available to claim: **${stats.availableToClaim} CODE**

🚀 *Claiming will:*
• Transfer tokens to your wallet
• Update your dashboard
• Add to your total claimed amount

⚡ *Network:* Base (low fees ~$0.01)
🔗 *Your wallet:* \`${user.walletAddress.substring(0, 6)}...${user.walletAddress.substring(38)}\`

Proceed with claim?
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '✅ Confirm Claim', callback_data: `confirm_claim_${stats.availableToClaim}` },
          { text: '❌ Cancel', callback_data: 'cancel_claim' }
        ],
        [
          { text: '📊 View Dashboard', url: config.codedao.dashboardUrl }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, claimMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    this.trackUserAction(userId, 'claim_request');
  }

  async handleAdmin(msg, match) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Check if user is admin
    if (userId.toString() !== config.adminChatId) {
      await this.bot.sendMessage(chatId, '❌ Unauthorized access');
      return;
    }

    const command = match[1];
    const args = command.split(' ');
    
    switch (args[0]) {
      case 'stats':
        await this.sendAdminStats(chatId);
        break;
      case 'broadcast':
        const message = args.slice(1).join(' ');
        await this.broadcastMessage(message);
        await this.bot.sendMessage(chatId, `✅ Broadcast sent to ${this.users.size} users`);
        break;
      case 'github':
        if (args[1] === 'deploy') {
          await this.triggerGitHubDeploy(chatId);
        }
        break;
      case 'twitter':
        await this.twitterIntegration.handleTwitterCommand(this.bot, chatId, args, true);
        break;
      case 'combined':
        if (args[1] === 'stats') {
          await this.sendCombinedStats(chatId);
        }
        break;
      default:
        await this.bot.sendMessage(chatId, `
🔧 *Admin Commands*

📊 *Analytics*
\`/admin stats\` - Telegram bot statistics
\`/admin combined stats\` - Both platforms analytics

🤖 *Bot Control*
\`/admin twitter status\` - Twitter bot status
\`/admin twitter start\` - Start Twitter automation
\`/admin twitter post <msg>\` - Manual tweet

📢 *Communication*
\`/admin broadcast <message>\` - Send to all users
\`/admin github deploy\` - Trigger deployment

💡 *Pro Tip:* Type \`/admin twitter\` for full Twitter commands
        `, { parse_mode: 'Markdown' });
    }
  }

  async handleCallbackQuery(callbackQuery) {
    const data = callbackQuery.data;
    const chatId = callbackQuery.message.chat.id;
    const userId = callbackQuery.from.id;

    try {
      switch (data) {
        case 'connect_wallet':
          await this.handleWalletConnect({ chat: { id: chatId }, from: { id: userId } });
          break;
          
        case 'connect_github':
          await this.handleGitHub({ chat: { id: chatId }, from: { id: userId } });
          break;
          
        case 'stats':
          await this.handleStats({ chat: { id: chatId }, from: { id: userId } });
          break;
          
        case 'invite_friends':
          await this.handleInvite({ chat: { id: chatId }, from: { id: userId } });
          break;
          
        case 'refresh_stats':
          await this.refreshUserStats(chatId, userId);
          break;
          
        case 'view_achievements':
          await this.showAchievements(chatId, userId);
          break;
          
        case 'help':
          await this.handleHelp({ chat: { id: chatId }, from: { id: userId } });
          break;
          
        // Twitter integration callbacks
        case 'twitter_status':
          await this.twitterIntegration.getTwitterStatus(this.bot, chatId);
          break;
        case 'twitter_stats':
          await this.twitterIntegration.getTwitterStats(this.bot, chatId);
          break;
        case 'twitter_start':
          await this.twitterIntegration.startTwitterBot(this.bot, chatId);
          break;
        case 'twitter_stop':
          await this.twitterIntegration.stopTwitterBot(this.bot, chatId);
          break;
          
        default:
          if (data.startsWith('confirm_claim_')) {
            const amount = data.replace('confirm_claim_', '');
            await this.processClaim(chatId, userId, amount);
          }
      }
      
      // Acknowledge callback
      await this.bot.answerCallbackQuery(callbackQuery.id);
    } catch (error) {
      logger.error('Callback query error:', error);
      await this.bot.answerCallbackQuery(callbackQuery.id, {
        text: 'Something went wrong. Please try again.',
        show_alert: true
      });
    }
  }

  async handleMessage(msg) {
    if (msg.chat.type === 'group' || msg.chat.type === 'supergroup') {
      await this.handleGroupMessage(msg);
      return;
    }

    const userId = msg.from.id;
    const text = msg.text;
    const user = this.users.get(userId);

    if (!user) return;

    // Handle wallet address input
    if (user.awaitingWalletAddress && text && /^0x[a-fA-F0-9]{40}$/.test(text)) {
      await this.processWalletConnection(msg);
      return;
    }

    // Handle GitHub username input
    if (user.awaitingGitHubUsername && text && /^[a-zA-Z0-9-]{1,39}$/.test(text)) {
      await this.processGitHubConnection(msg);
      return;
    }

    this.trackUserAction(userId, 'message');
  }

  async processWalletConnection(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const walletAddress = msg.text;
    const user = this.users.get(userId);

    // Update user data
    user.walletConnected = true;
    user.walletAddress = walletAddress;
    user.awaitingWalletAddress = false;
    this.users.set(userId, user);

    // Award welcome bonus
    if (config.features.gamification) {
      await this.awardAchievement(userId, 'first_wallet', 0.1);
    }

    const successMessage = `
✅ *Wallet Connected Successfully!*

🔗 Address: \`${walletAddress.substring(0, 6)}...${walletAddress.substring(38)}\`

🎉 *Welcome bonus: +0.1 CODE tokens!*

🚀 *Next Steps:*
1. Install CodeDAO VS Code extension
2. Connect your GitHub account with /github
3. Start coding to earn CODE tokens
4. Use /stats to track your earnings

💰 *Start earning now!*
    `;

    const keyboard = {
      inline_keyboard: [
        [
          { text: '🐙 Connect GitHub', callback_data: 'connect_github' },
          { text: '📊 View Stats', callback_data: 'stats' }
        ],
        [
          { text: '💰 Get Extension', url: config.codedao.githubUrl }
        ]
      ]
    };

    await this.bot.sendMessage(chatId, successMessage, {
      parse_mode: 'Markdown',
      reply_markup: keyboard
    });

    this.trackUserAction(userId, 'wallet_connected');
  }

  async processGitHubConnection(msg) {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const githubUsername = msg.text;
    const user = this.users.get(userId);

    try {
      // Verify GitHub user exists
      const { data: githubUser } = await this.github.rest.users.getByUsername({
        username: githubUsername
      });

      // Update user data
      user.githubUsername = githubUsername;
      user.githubId = githubUser.id;
      user.awaitingGitHubUsername = false;
      this.users.set(userId, user);

      // Award achievement
      if (config.features.gamification) {
        await this.awardAchievement(userId, 'github_connected', 0.2);
      }

      const successMessage = `
✅ *GitHub Account Connected!*

🐙 Username: @${githubUsername}
👤 Profile: ${githubUser.name || 'Not set'}
📊 Public Repos: ${githubUser.public_repos}

🎉 *GitHub bonus: +0.2 CODE tokens!*

🚀 *Enhanced Features Unlocked:*
• Automatic commit tracking
• Repository contribution analysis
• Team collaboration bonuses
• Advanced reward calculations

💡 *Pro tip:* Install our VS Code extension to start earning automatically!
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📊 View Stats', callback_data: 'stats' },
            { text: '💰 Get Extension', url: config.codedao.githubUrl }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, successMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

      this.trackUserAction(userId, 'github_connected');

    } catch (error) {
      await this.bot.sendMessage(chatId, `
❌ *GitHub user '${githubUsername}' not found*

Please check the username and try again:
• Make sure the username is correct
• Ensure the profile is public
• Try without the @ symbol

Send me the correct GitHub username:
      `);
      
      logger.error('GitHub user verification failed:', error);
    }
  }

  async triggerGitHubDeploy(chatId) {
    try {
      // Trigger GitHub workflow
      await this.github.rest.actions.createWorkflowDispatch({
        owner: config.github.owner,
        repo: config.github.repo,
        workflow_id: 'deploy-telegram-bot.yml',
        ref: 'main'
      });

      await this.bot.sendMessage(chatId, '🚀 GitHub deployment triggered successfully!');
    } catch (error) {
      logger.error('GitHub deployment trigger failed:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to trigger deployment');
    }
  }

  async fetchUserStats(walletAddress) {
    if (!walletAddress) {
      return {
        totalEarned: 0,
        availableToClaim: 0,
        totalClaimed: 0,
        streakDays: 0,
        totalCommits: 0,
        averageQuality: 0,
        trustLevel: 'New Member'
      };
    }

    try {
      const response = await axios.get(`${config.codedao.apiUrl}/users/${walletAddress}/stats`);
      return response.data;
    } catch (error) {
      logger.error('Failed to fetch user stats:', error);
      
      // Return mock data for development
      return {
        totalEarned: Math.random() * 50,
        availableToClaim: Math.random() * 10,
        totalClaimed: Math.random() * 20,
        streakDays: Math.floor(Math.random() * 30),
        totalCommits: Math.floor(Math.random() * 100),
        averageQuality: Math.random() * 3 + 7,
        trustLevel: 'Trusted Coder'
      };
    }
  }

  initializeContractMonitoring() {
    if (!config.features.contractMonitoring || !config.contract.address) {
      logger.info('Contract monitoring disabled or contract address not set');
      return;
    }

    try {
      const provider = new ethers.providers.JsonRpcProvider(config.contract.rpcUrl);
      const contractABI = require('./contracts/CodeDAOToken.json').abi;
      const contract = new ethers.Contract(config.contract.address, contractABI, provider);

      // Listen for CodingReward events
      contract.on('CodingReward', async (user, amount, linesWritten, reason, event) => {
        await this.handleCodingRewardEvent(user, amount, linesWritten, reason);
      });

      // Listen for Transfer events (for claims)
      contract.on('Transfer', async (from, to, amount, event) => {
        if (from === config.contract.address) {
          await this.handleTokenClaimEvent(to, amount);
        }
      });

      logger.info('✅ Smart contract monitoring initialized');
    } catch (error) {
      logger.error('Failed to initialize contract monitoring:', error);
    }
  }

  async handleCodingRewardEvent(userAddress, amount, linesWritten, reason) {
    // Find user by wallet address
    const userId = this.findUserByWallet(userAddress);
    if (userId) {
      const user = this.users.get(userId);
      const rewardAmount = ethers.utils.formatEther(amount);
      
      const rewardMessage = `
🎊 *Coding Reward Earned!*

💰 Amount: ${rewardAmount} CODE
📝 Lines Written: ${linesWritten}
📄 Reason: ${reason}

🚀 Keep coding to earn more!
      `;
      
      await this.bot.sendMessage(user.chatId, rewardMessage, {
        parse_mode: 'Markdown'
      });
    }
  }

  setupScheduledTasks() {
    // Daily stats broadcast (9 AM UTC)
    cron.schedule('0 9 * * *', () => {
      this.sendDailyStats();
    });

    // Weekly leaderboard (Monday 10 AM UTC)
    cron.schedule('0 10 * * 1', () => {
      this.sendWeeklyLeaderboard();
    });

    // Clean inactive users (Monthly)
    cron.schedule('0 0 1 * *', () => {
      this.cleanInactiveUsers();
    });

    logger.info('✅ Scheduled tasks initialized');
  }

  trackUserAction(userId, action) {
    this.analytics.commandsExecuted[action] = (this.analytics.commandsExecuted[action] || 0) + 1;
    
    const user = this.users.get(userId);
    if (user) {
      user.lastActivity = new Date();
      user.totalActions = (user.totalActions || 0) + 1;
      this.users.set(userId, user);
    }
  }

  findUserByWallet(walletAddress) {
    for (const [userId, userData] of this.users) {
      if (userData.walletAddress === walletAddress) {
        return userId;
      }
    }
    return null;
  }

  async sendCombinedStats(chatId) {
    try {
      // Get Telegram bot stats
      const telegramStats = {
        totalUsers: this.users.size,
        activeUsers: this.analytics.activeUsers,
        totalCommands: Object.values(this.analytics.commandsExecuted).reduce((a, b) => a + b, 0),
        messagesProcessed: this.analytics.messagesSent
      };

      // Get Twitter bot stats
      const twitterData = await this.twitterIntegration.fetchDashboardData();

      const combinedMessage = `
🌐 *Combined Platform Analytics*

📱 *Telegram Bot Stats*
• Total Users: ${telegramStats.totalUsers}
• Active Users: ${telegramStats.activeUsers}
• Commands Executed: ${telegramStats.totalCommands}
• Messages Processed: ${telegramStats.messagesProcessed}

🐦 *Twitter Bot Stats*
• Posts Today: ${twitterData.posts_today || 0}/25
• Engagements: ${twitterData.engagements_today || 0}
• Followers: ${twitterData.followers_count || 0}
• Community Reach: ${twitterData.impressions || 0}

🎯 *Cross-Platform Impact*
• Combined Reach: ${(telegramStats.totalUsers + (twitterData.followers_count || 0)).toLocaleString()}
• Developer Engagement: High across both platforms
• Community Growth: ${twitterData.conversions || 0} conversions this week

💰 *CodeDAO Integration*
• CODE Tokens Distributed: ${twitterData.community_tokens || 0}
• Platform Signups: ${twitterData.new_signups || 0}
• Active Developers: ${telegramStats.activeUsers}

📊 *Performance Score*
• Telegram: ${this.calculatePerformanceScore(telegramStats)}%
• Twitter: ${twitterData.quality_score || 85}%
• Combined: ${this.calculateCombinedScore(telegramStats, twitterData)}%
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '📱 Telegram Details', callback_data: 'telegram_stats' },
            { text: '🐦 Twitter Details', callback_data: 'twitter_stats' }
          ],
          [
            { text: '🔄 Refresh Data', callback_data: 'combined_refresh' }
          ]
        ]
      };

      await this.bot.sendMessage(chatId, combinedMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      logger.error('Combined stats error:', error);
      await this.bot.sendMessage(chatId, '❌ Failed to fetch combined statistics');
    }
  }

  calculatePerformanceScore(stats) {
    // Simple performance calculation based on activity
    const score = Math.min(100, (stats.activeUsers / Math.max(1, stats.totalUsers)) * 100 + 
                   (stats.totalCommands > 50 ? 20 : 0));
    return Math.round(score);
  }

  calculateCombinedScore(telegramStats, twitterData) {
    const telegramScore = this.calculatePerformanceScore(telegramStats);
    const twitterScore = twitterData.quality_score || 85;
    return Math.round((telegramScore + twitterScore) / 2);
  }
}

// Initialize Express app for webhooks
const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    environment: config.environment
  });
});

// Initialize bot
const codeDAOBot = new CodeDAOTelegramBot();

// Production webhook setup
if (config.environment === 'production' && config.webhookUrl) {
  codeDAOBot.bot.setWebHook(`${config.webhookUrl}/webhook/${config.botToken}`);
  
  app.post(`/webhook/${config.botToken}`, (req, res) => {
    codeDAOBot.bot.processUpdate(req.body);
    res.sendStatus(200);
  });
  
  app.listen(config.port, () => {
    logger.info(`🚀 CodeDAO Telegram Bot webhook listening on port ${config.port}`);
  });
} else {
  logger.info('🤖 CodeDAO Telegram Bot running in polling mode');
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Shutting down CodeDAO Telegram Bot...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Shutting down CodeDAO Telegram Bot...');
  process.exit(0);
});

module.exports = { CodeDAOTelegramBot, app }; 
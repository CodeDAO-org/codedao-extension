/**
 * Admin API for Telegram Bot Management
 * Handles message broadcasting and analytics
 */

const TelegramBot = require('node-telegram-bot-api');
const { Octokit } = require('@octokit/rest');

const config = {
  botToken: process.env.BOT_TOKEN,
  githubToken: process.env.GITHUB_TOKEN,
  adminUsername: process.env.ADMIN_TELEGRAM_USERNAME,
  allowedOrigins: [
    'https://codedao-telegram-bot.vercel.app',
    'https://codedao-org.github.io',
    'http://localhost:3000'
  ]
};

const bot = new TelegramBot(config.botToken);
const github = new Octokit({ auth: config.githubToken });

// Verify admin access
function verifyAdmin(req) {
  const adminHeader = req.headers['x-admin-username'];
  return adminHeader === config.adminUsername;
}

// Get all user data from GitHub Gists
async function getAllUsers() {
  try {
    const gists = await github.rest.gists.list();
    const userGists = gists.data.filter(gist => 
      gist.description.startsWith('CodeDAO Bot User Data')
    );

    const users = [];
    for (const gist of userGists) {
      try {
        const gistDetails = await github.rest.gists.get({ gist_id: gist.id });
        const userData = JSON.parse(Object.values(gistDetails.data.files)[0].content);
        users.push(userData);
      } catch (error) {
        console.error('Failed to load user data:', error);
      }
    }

    return users;
  } catch (error) {
    console.error('Failed to get users:', error);
    return [];
  }
}

// Filter users based on criteria
function filterUsers(users, criteria) {
  switch (criteria) {
    case 'wallet_connected':
      return users.filter(user => user.walletConnected);
    case 'github_connected':
      return users.filter(user => user.githubConnected);
    case 'active_last_week':
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return users.filter(user => new Date(user.lastActivity || user.joinDate) > weekAgo);
    case 'high_earners':
      return users.filter(user => (user.totalEarned || 0) > 10);
    default:
      return users;
  }
}

// Main handler
export default async function handler(req, res) {
  // CORS handling
  const origin = req.headers.origin;
  if (config.allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-username');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Verify admin access
  if (!verifyAdmin(req)) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: 'Admin access required'
    });
  }

  const { method, url } = req;
  const path = url.split('?')[0];

  try {
    switch (method) {
      case 'GET':
        if (path.endsWith('/stats')) {
          return await handleGetStats(req, res);
        } else if (path.endsWith('/users')) {
          return await handleGetUsers(req, res);
        } else if (path.endsWith('/channels')) {
          return await handleGetChannels(req, res);
        }
        break;

      case 'POST':
        if (path.endsWith('/broadcast')) {
          return await handleBroadcast(req, res);
        } else if (path.endsWith('/test-message')) {
          return await handleTestMessage(req, res);
        }
        break;

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }

    return res.status(404).json({ error: 'Endpoint not found' });

  } catch (error) {
    console.error('Admin API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Get bot statistics
async function handleGetStats(req, res) {
  try {
    const users = await getAllUsers();
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const stats = {
      totalUsers: users.length,
      activeToday: users.filter(user => 
        new Date(user.lastActivity || user.joinDate) >= todayStart
      ).length,
      activeThisWeek: users.filter(user => 
        new Date(user.lastActivity || user.joinDate) >= weekAgo
      ).length,
      walletsConnected: users.filter(user => user.walletConnected).length,
      githubConnected: users.filter(user => user.githubConnected).length,
      totalEarnings: users.reduce((sum, user) => sum + (user.totalEarned || 0), 0),
      averageEarnings: users.length > 0 ? 
        users.reduce((sum, user) => sum + (user.totalEarned || 0), 0) / users.length : 0,
      topEarners: users
        .sort((a, b) => (b.totalEarned || 0) - (a.totalEarned || 0))
        .slice(0, 5)
        .map(user => ({
          username: user.telegramUsername,
          earnings: user.totalEarned || 0
        })),
      recentJoins: users.filter(user => 
        new Date(user.joinDate) >= weekAgo
      ).length,
      engagementRate: users.length > 0 ? 
        (users.filter(user => new Date(user.lastActivity || user.joinDate) >= weekAgo).length / users.length * 100).toFixed(1) : 0
    };

    return res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    throw new Error(`Failed to get stats: ${error.message}`);
  }
}

// Get all users
async function handleGetUsers(req, res) {
  try {
    const users = await getAllUsers();
    const { filter, limit = 50, offset = 0 } = req.query;

    let filteredUsers = users;
    if (filter) {
      filteredUsers = filterUsers(users, filter);
    }

    const paginatedUsers = filteredUsers
      .slice(parseInt(offset), parseInt(offset) + parseInt(limit))
      .map(user => ({
        userId: user.userId,
        username: user.telegramUsername,
        joinDate: user.joinDate,
        walletConnected: user.walletConnected,
        githubConnected: user.githubConnected,
        totalEarned: user.totalEarned || 0,
        referrals: user.referrals || 0,
        lastActivity: user.lastActivity
      }));

    return res.json({
      success: true,
      data: paginatedUsers,
      pagination: {
        total: filteredUsers.length,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + parseInt(limit) < filteredUsers.length
      }
    });

  } catch (error) {
    throw new Error(`Failed to get users: ${error.message}`);
  }
}

// Get available channels
async function handleGetChannels(req, res) {
  const channels = [
    {
      id: 'main',
      name: 'CodeDAO Main Bot',
      username: 'CodeDAOBot',
      type: 'bot',
      active: true,
      description: 'Main community bot for user interactions'
    },
    {
      id: 'announcements',
      name: 'CodeDAO Announcements',
      username: 'CodeDAOAnnouncements',
      type: 'channel',
      active: true,
      description: 'Official announcements and updates'
    },
    {
      id: 'developers',
      name: 'CodeDAO Developers',
      username: 'CodeDAODev',
      type: 'group',
      active: true,
      description: 'Developer community discussions'
    }
  ];

  return res.json({
    success: true,
    data: channels
  });
}

// Broadcast message to users
async function handleBroadcast(req, res) {
  try {
    const { content, audience = 'all', schedule, buttons } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        error: 'Message content is required'
      });
    }

    // If scheduled for later, store in GitHub Gist for processing
    if (schedule) {
      const scheduledMessage = {
        content,
        audience,
        schedule,
        buttons,
        created: new Date().toISOString(),
        status: 'scheduled'
      };

      await github.rest.gists.create({
        description: `CodeDAO Scheduled Message - ${new Date(schedule).toISOString()}`,
        public: false,
        files: {
          'scheduled_message.json': {
            content: JSON.stringify(scheduledMessage, null, 2)
          }
        }
      });

      return res.json({
        success: true,
        message: 'Message scheduled successfully',
        scheduledFor: schedule
      });
    }

    // Send immediately
    const users = await getAllUsers();
    const targetUsers = filterUsers(users, audience);

    let sentCount = 0;
    let failedCount = 0;

    // Prepare message options
    const messageOptions = {
      parse_mode: 'Markdown'
    };

    if (buttons) {
      messageOptions.reply_markup = {
        inline_keyboard: [[{
          text: buttons.text,
          url: buttons.url
        }]]
      };
    }

    // Send to each user with rate limiting
    for (const user of targetUsers) {
      try {
        await bot.sendMessage(user.chatId, content, messageOptions);
        sentCount++;
        
        // Rate limiting - 30 messages per second max
        if (sentCount % 30 === 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        console.error(`Failed to send to user ${user.userId}:`, error);
        failedCount++;
      }
    }

    // Log broadcast activity
    const broadcastLog = {
      timestamp: new Date().toISOString(),
      admin: req.headers['x-admin-username'],
      content: content.substring(0, 100) + (content.length > 100 ? '...' : ''),
      audience,
      sent: sentCount,
      failed: failedCount,
      total: targetUsers.length
    };

    await github.rest.gists.create({
      description: `CodeDAO Broadcast Log - ${new Date().toISOString()}`,
      public: false,
      files: {
        'broadcast_log.json': {
          content: JSON.stringify(broadcastLog, null, 2)
        }
      }
    });

    return res.json({
      success: true,
      message: 'Broadcast completed',
      stats: {
        sent: sentCount,
        failed: failedCount,
        total: targetUsers.length
      }
    });

  } catch (error) {
    throw new Error(`Broadcast failed: ${error.message}`);
  }
}

// Send test message to admin
async function handleTestMessage(req, res) {
  try {
    const { content } = req.body;
    const adminUsername = req.headers['x-admin-username'];

    if (!content) {
      return res.status(400).json({
        error: 'Message content is required'
      });
    }

    // Find admin user data
    const users = await getAllUsers();
    const adminUser = users.find(user => user.telegramUsername === adminUsername);

    if (!adminUser) {
      return res.status(404).json({
        error: 'Admin user not found in bot database'
      });
    }

    // Send test message
    const testMessage = `🧪 **Test Message**\n\n${content}\n\n_This is a test message sent from the admin interface._`;
    
    await bot.sendMessage(adminUser.chatId, testMessage, {
      parse_mode: 'Markdown'
    });

    return res.json({
      success: true,
      message: 'Test message sent successfully'
    });

  } catch (error) {
    throw new Error(`Test message failed: ${error.message}`);
  }
} 
/**
 * Twitter Bot Integration for CodeDAO Telegram Bot
 * Allows managing Twitter bot through Telegram commands
 */

const axios = require('axios');
const { TwitterApi } = require('twitter-api-v2');
const winston = require('winston');

class TwitterIntegration {
  constructor(config) {
    this.config = config;
    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [
        new winston.transports.File({ filename: 'logs/twitter-integration.log' }),
        new winston.transports.Console()
      ]
    });

    // Initialize Twitter API client
    this.twitterClient = new TwitterApi({
      appKey: config.twitter.apiKey,
      appSecret: config.twitter.apiSecret,
      accessToken: config.twitter.accessToken,
      accessSecret: config.twitter.accessTokenSecret
    });

    this.rwClient = this.twitterClient.readWrite;
    
    // Twitter bot status
    this.botStatus = {
      active: false,
      lastPost: null,
      postsToday: 0,
      engagementsToday: 0,
      followersGained: 0,
      lastError: null
    };

    this.logger.info('🐦 Twitter Integration initialized');
  }

  // ============ ADMIN TWITTER COMMANDS ============

  async handleTwitterCommand(bot, chatId, args, isAdmin) {
    if (!isAdmin) {
      await bot.sendMessage(chatId, '🚫 Admin access required for Twitter commands');
      return;
    }

    const subCommand = args[1];
    
    try {
      switch (subCommand) {
        case 'status':
          await this.getTwitterStatus(bot, chatId);
          break;
        case 'start':
          await this.startTwitterBot(bot, chatId);
          break;
        case 'stop':
          await this.stopTwitterBot(bot, chatId);
          break;
        case 'post':
          await this.manualPost(bot, chatId, args.slice(2));
          break;
        case 'stats':
          await this.getTwitterStats(bot, chatId);
          break;
        case 'engage':
          await this.triggerEngagement(bot, chatId);
          break;
        case 'followers':
          await this.getFollowerStats(bot, chatId);
          break;
        case 'schedule':
          await this.viewSchedule(bot, chatId);
          break;
        default:
          await this.showTwitterHelp(bot, chatId);
      }
    } catch (error) {
      this.logger.error('Twitter command error:', error);
      await bot.sendMessage(chatId, `❌ Twitter command failed: ${error.message}`);
    }
  }

  async getTwitterStatus(bot, chatId) {
    try {
      // Get bot dashboard data
      const dashboardData = await this.fetchDashboardData();
      
      const statusMessage = `
🐦 *Twitter Bot Status*

🤖 *Bot State*
Status: ${this.botStatus.active ? '🟢 Active' : '🔴 Inactive'}
Target Account: @CRG
AI Model: GPT-4o-mini

📊 *Today's Activity*
Posts: ${dashboardData.posts_today || 0}/25
Engagements: ${dashboardData.engagements_today || 0}
Quality Score: ${dashboardData.quality_score || 'N/A'}%

🎯 *Growth Metrics*
New Followers: +${dashboardData.followers_gained || 0} today
Developer Reach: ${dashboardData.impressions || 0} impressions
Conversions: ${dashboardData.conversions || 0} → CodeDAO

⏰ *Next Actions*
Next Post: ${dashboardData.next_post || 'Not scheduled'}
Monitoring: ${dashboardData.monitoring ? '24/7 Active' : 'Paused'}

${this.botStatus.lastError ? `⚠️ Last Error: ${this.botStatus.lastError}` : ''}
      `;

      const keyboard = {
        inline_keyboard: [
          [
            { text: '🚀 Start Bot', callback_data: 'twitter_start' },
            { text: '⏸️ Stop Bot', callback_data: 'twitter_stop' }
          ],
          [
            { text: '📊 Full Stats', callback_data: 'twitter_stats' },
            { text: '🔄 Refresh', callback_data: 'twitter_status' }
          ]
        ]
      };

      await bot.sendMessage(chatId, statusMessage, {
        parse_mode: 'Markdown',
        reply_markup: keyboard
      });

    } catch (error) {
      await bot.sendMessage(chatId, `❌ Failed to get Twitter status: ${error.message}`);
    }
  }

  async getTwitterStats(bot, chatId) {
    try {
      const dashboardData = await this.fetchDashboardData();
      const userInfo = await this.rwClient.v2.me();
      
      const statsMessage = `
📊 *Detailed Twitter Analytics*

👤 *Account Overview*
Username: @${userInfo.data.username}
Followers: ${userInfo.data.public_metrics?.followers_count || 0}
Following: ${userInfo.data.public_metrics?.following_count || 0}

📈 *Performance (Last 7 Days)*
Total Posts: ${dashboardData.weekly_posts || 0}
Avg Engagement Rate: ${dashboardData.engagement_rate || 0}%
Top Performing Post: ${dashboardData.top_post_likes || 0} likes
Developer Interactions: ${dashboardData.dev_interactions || 0}

🎯 *CodeDAO Impact*
Platform Visits: ${dashboardData.platform_visits || 0}
New Signups: ${dashboardData.new_signups || 0}
CODE Tokens Earned by Community: ${dashboardData.community_tokens || 0}

🔍 *Content Performance*
Educational Posts: ${dashboardData.educational_posts || 0} (${dashboardData.educational_engagement || 0}% avg)
Community Posts: ${dashboardData.community_posts || 0} (${dashboardData.community_engagement || 0}% avg)
Tech Updates: ${dashboardData.tech_posts || 0} (${dashboardData.tech_engagement || 0}% avg)

🎲 *AI Insights*
AI Responses: ${dashboardData.ai_responses || 0}
Human-like Score: ${dashboardData.human_score || 0}%
Safety Score: ${dashboardData.safety_score || 0}%
      `;

      await bot.sendMessage(chatId, statsMessage, { parse_mode: 'Markdown' });

    } catch (error) {
      await bot.sendMessage(chatId, `❌ Failed to get Twitter stats: ${error.message}`);
    }
  }

  async manualPost(bot, chatId, contentArgs) {
    if (!contentArgs.length) {
      await bot.sendMessage(chatId, `
📝 *Manual Twitter Post*

Usage: \`/admin twitter post <message>\`

Examples:
\`/admin twitter post Just shipped a new feature! 🚀\`
\`/admin twitter post Check out our latest CodeDAO update\`

Note: Posts will be sent from @CRG account
      `, { parse_mode: 'Markdown' });
      return;
    }

    try {
      const content = contentArgs.join(' ');
      
      // Post to Twitter
      const tweet = await this.rwClient.v2.tweet(content);
      
      await bot.sendMessage(chatId, `
✅ *Tweet Posted Successfully!*

🐦 Tweet ID: ${tweet.data.id}
📝 Content: "${content}"
🔗 Link: https://twitter.com/${this.config.twitter.username}/status/${tweet.data.id}

The tweet is now live on @CRG account!
      `, { parse_mode: 'Markdown' });

      // Update analytics
      this.botStatus.postsToday++;
      this.botStatus.lastPost = new Date();

    } catch (error) {
      await bot.sendMessage(chatId, `❌ Failed to post tweet: ${error.message}`);
    }
  }

  async triggerEngagement(bot, chatId) {
    try {
      // Trigger engagement script
      const response = await axios.post(`${this.config.twitter.botUrl}/api/engage`, {
        action: 'immediate_engagement',
        target_hashtags: ['#coding', '#javascript', '#web3', '#blockchain'],
        max_interactions: 10
      });

      await bot.sendMessage(chatId, `
🎯 *Engagement Triggered!*

Target: Developer hashtags
Max Interactions: 10
Status: ${response.data.status}

The bot will now engage with relevant developer conversations for the next hour.
      `, { parse_mode: 'Markdown' });

    } catch (error) {
      await bot.sendMessage(chatId, `❌ Failed to trigger engagement: ${error.message}`);
    }
  }

  async startTwitterBot(bot, chatId) {
    try {
      const response = await axios.post(`${this.config.twitter.botUrl}/api/control`, {
        action: 'start'
      });

      this.botStatus.active = true;
      
      await bot.sendMessage(chatId, `
🚀 *Twitter Bot Started!*

✅ Automated posting: ACTIVE
✅ Engagement monitoring: ACTIVE  
✅ AI responses: ACTIVE
✅ Community growth: ACTIVE

The bot is now running 24/7 to grow the CodeDAO community!
      `, { parse_mode: 'Markdown' });

    } catch (error) {
      await bot.sendMessage(chatId, `❌ Failed to start Twitter bot: ${error.message}`);
    }
  }

  async stopTwitterBot(bot, chatId) {
    try {
      const response = await axios.post(`${this.config.twitter.botUrl}/api/control`, {
        action: 'stop'
      });

      this.botStatus.active = false;
      
      await bot.sendMessage(chatId, `
⏸️ *Twitter Bot Stopped*

❌ Automated posting: PAUSED
❌ Engagement monitoring: PAUSED
❌ AI responses: PAUSED

Manual commands still available. Use \`/admin twitter start\` to resume.
      `, { parse_mode: 'Markdown' });

    } catch (error) {
      await bot.sendMessage(chatId, `❌ Failed to stop Twitter bot: ${error.message}`);
    }
  }

  async showTwitterHelp(bot, chatId) {
    const helpMessage = `
🐦 *Twitter Bot Commands*

🎛️ *Control*
\`/admin twitter status\` - Bot status & metrics
\`/admin twitter start\` - Start automation
\`/admin twitter stop\` - Stop automation

📊 *Analytics*
\`/admin twitter stats\` - Detailed analytics
\`/admin twitter followers\` - Follower metrics
\`/admin twitter schedule\` - View posting schedule

🎯 *Actions*
\`/admin twitter post <message>\` - Manual tweet
\`/admin twitter engage\` - Trigger engagement
\`/admin twitter test\` - Test bot health

💡 *Tips*
• Bot targets @CRG account
• AI-powered engagement with developers
• Focuses on CodeDAO community growth
• Safe rate limiting (25 posts/day max)
    `;

    await bot.sendMessage(chatId, helpMessage, { parse_mode: 'Markdown' });
  }

  // ============ UTILITY FUNCTIONS ============

  async fetchDashboardData() {
    try {
      const response = await axios.get(`${this.config.twitter.botUrl}/analytics`);
      return response.data;
    } catch (error) {
      this.logger.error('Failed to fetch dashboard data:', error);
      return {};
    }
  }

  async getFollowerStats(bot, chatId) {
    try {
      const userInfo = await this.rwClient.v2.me({
        'user.fields': ['public_metrics']
      });

      const metrics = userInfo.data.public_metrics;
      
      await bot.sendMessage(chatId, `
👥 *Follower Analytics*

📊 Current Stats:
• Followers: ${metrics.followers_count}
• Following: ${metrics.following_count}
• Tweets: ${metrics.tweet_count}
• Listed: ${metrics.listed_count}

🎯 Growth Tracking:
• Daily Goal: +5-10 followers
• Focus: Quality developers
• Strategy: Engagement + valuable content
• Rate: ${this.calculateGrowthRate()}% this week
      `, { parse_mode: 'Markdown' });

    } catch (error) {
      await bot.sendMessage(chatId, `❌ Failed to get follower stats: ${error.message}`);
    }
  }

  calculateGrowthRate() {
    // Mock calculation - would use real historical data
    return (Math.random() * 10 + 2).toFixed(1);
  }

  async viewSchedule(bot, chatId) {
    const schedule = `
📅 *Twitter Bot Schedule*

🌅 *Daily Posting Times (UTC)*
• 09:00 - Daily stats & metrics
• 10:00 - Educational content
• 13:00 - Community engagement
• 15:00 - Tech tips & insights

🔄 *Engagement Monitoring*
• 24/7 hashtag monitoring
• Real-time developer conversations
• Auto-replies to relevant threads
• Smart follow-backs

⚡ *Rate Limits*
• Max 25 posts/day
• Max 50 likes/hour
• Max 15 replies/hour
• Max 10 follows/hour

🎯 *Current Focus*
• #coding #javascript #web3
• Developer onboarding
• CodeDAO platform growth
    `;

    await bot.sendMessage(chatId, schedule, { parse_mode: 'Markdown' });
  }

  // ============ WEBHOOK HANDLERS ============

  async handleTwitterWebhook(data) {
    // Handle Twitter events (new followers, mentions, etc.)
    this.logger.info('Twitter webhook received:', data);
    
    // Could notify admin via Telegram about important Twitter events
    if (data.type === 'new_follower' && data.follower_count % 100 === 0) {
      // Milestone notification
      await this.notifyMilestone(data);
    }
  }

  async notifyMilestone(data) {
    const message = `
🎉 *Twitter Milestone Reached!*

🎯 New Follower Count: ${data.follower_count}
🚀 Growth continues for @CRG account!

Keep up the great community building! 🔥
    `;

    // Send to admin chat
    // Implementation would depend on bot instance access
  }
}

module.exports = TwitterIntegration; 
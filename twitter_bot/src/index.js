#!/usr/bin/env node

const cron = require('node-cron');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

const config = require('./config');
const logger = require('./logger');
const database = require('./database');
const TwitterBot = require('./TwitterBot');
const ContentGenerator = require('./ContentGenerator');
const EngagementEngine = require('./EngagementEngine');
const SimpleAnalytics = require('./simple-analytics');
const LLMResponder = require('./LLMResponder');

class CodeDAOTwitterBot {
  constructor() {
    this.bot = null;
    this.contentGenerator = null;
    this.engagementEngine = null;
    this.analytics = null;
    this.app = null;
    this.server = null;
    this.scheduledJobs = [];
    this.isRunning = false;
    this.startTime = null;
  }

  async initialize() {
    try {
      logger.info('🚀 Initializing CodeDAO Twitter Bot...');
      this.startTime = new Date();

      // Connect to database
      const dbConnected = await database.connect();
      if (!dbConnected) {
        throw new Error('Failed to connect to database');
      }

      // Initialize Twitter bot
      this.bot = new TwitterBot();
      const botInitialized = await this.bot.initialize();
      if (!botInitialized) {
        throw new Error('Failed to initialize Twitter bot');
      }

      // Initialize components
      this.contentGenerator = new ContentGenerator();
      this.engagementEngine = new EngagementEngine(this.bot);
      this.analytics = new SimpleAnalytics(this.bot, database);
      this.llmResponder = new LLMResponder();

      // Setup Express server for health checks and webhooks
      this.setupServer();

      // Setup scheduled tasks
      this.setupScheduledTasks();

      this.isRunning = true;
      logger.info('✅ CodeDAO Twitter Bot initialized successfully');
      
      await this.logInitializationStatus();
      
      return true;

    } catch (error) {
      logger.error('❌ Failed to initialize bot:', error);
      return false;
    }
  }

  setupServer() {
    this.app = express();
    
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: '10mb' }));

    // Health check endpoint
    this.app.get('/health', async (req, res) => {
      try {
        const health = await this.getHealthStatus();
        res.status(health.overall.status === 'healthy' ? 200 : 503).json(health);
      } catch (error) {
        res.status(500).json({ status: 'error', error: error.message });
      }
    });

    // Analytics endpoint
    this.app.get('/analytics', async (req, res) => {
      try {
        const analytics = await this.analytics.getDashboardData();
        res.json(analytics);
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Dashboard HTML interface
    this.app.get('/dashboard', async (req, res) => {
      try {
        const fs = require('fs');
        const path = require('path');
        const dashboardPath = path.join(__dirname, 'dashboard.html');
        const dashboardHTML = fs.readFileSync(dashboardPath, 'utf8');
        res.send(dashboardHTML);
      } catch (error) {
        res.status(500).send('<h1>Dashboard not available</h1><p>Please check if dashboard.html exists.</p>');
      }
    });

    // Manual post endpoint (for testing)
    this.app.post('/post', async (req, res) => {
      try {
        const { content, type } = req.body;
        
        if (!content) {
          return res.status(400).json({ error: 'Content is required' });
        }

        const tweet = await this.bot.postTweet(content, { post_type: type || 'manual' });
        res.json({ success: true, tweet_id: tweet.data.id });
        
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Manual engagement cycle endpoint
    this.app.post('/engage', async (req, res) => {
      try {
        await this.engagementEngine.runEngagementCycle();
        res.json({ success: true, message: 'Engagement cycle completed' });
      } catch (error) {
        res.status(500).json({ error: error.message });
      }
    });

    // Configuration endpoint
    this.app.get('/config', (req, res) => {
      const safeConfig = {
        bot_username: config.bot.username,
        environment: config.bot.environment,
        schedule_enabled: config.schedule.enabled,
        content_generation_enabled: config.content.generationEnabled,
        auto_engagement_enabled: config.content.autoEngagementEnabled,
        rate_limits: config.limits
      };
      res.json(safeConfig);
    });

    // Start server
    const PORT = process.env.PORT || 3000;
    this.server = this.app.listen(PORT, () => {
      logger.info(`🌐 Server running on port ${PORT}`);
    });
  }

  setupScheduledTasks() {
    if (!config.schedule.enabled) {
      logger.info('📅 Scheduled tasks disabled in configuration');
      return;
    }

    logger.info('📅 Setting up scheduled tasks...');

    // Daily stats posting (9 AM UTC)
    const dailyStatsJob = cron.schedule('0 9 * * *', async () => {
      await this.executeScheduledPost('daily_stats');
    }, { 
      scheduled: false,
      timezone: config.bot.timezone 
    });

    // Educational content (10 AM and 3 PM UTC)
    const educationalJob = cron.schedule('0 10,15 * * *', async () => {
      await this.executeScheduledPost('educational_tip');
    }, { 
      scheduled: false,
      timezone: config.bot.timezone 
    });

    // Engagement question (1 PM UTC)
    const engagementJob = cron.schedule('0 13 * * *', async () => {
      await this.executeScheduledPost('engagement_question');
    }, { 
      scheduled: false,
      timezone: config.bot.timezone 
    });

    // Success story (randomly 2-3 times per week)
    const successStoryJob = cron.schedule('0 11 * * 1,3,5', async () => {
      if (Math.random() > 0.4) { // 60% chance
        await this.executeScheduledPost('success_story');
      }
    }, { 
      scheduled: false,
      timezone: config.bot.timezone 
    });

    // Engagement cycle (every 4 hours during active hours)
    const engagementCycleJob = cron.schedule('0 */4 * * *', async () => {
      const hour = new Date().getHours();
      if (hour >= 6 && hour <= 22) { // Only during 6 AM - 10 PM UTC
        await this.engagementEngine.runEngagementCycle();
      }
    }, { 
      scheduled: false,
      timezone: config.bot.timezone 
    });

    // Metrics update (every 2 hours)
    const metricsJob = cron.schedule('0 */2 * * *', async () => {
      await this.bot.updatePostMetrics();
      await this.analytics.updateDailyMetrics();
    }, { 
      scheduled: false,
      timezone: config.bot.timezone 
    });

    // Weekly analytics report (Sunday 8 PM UTC)
    const weeklyReportJob = cron.schedule('0 20 * * 0', async () => {
      await this.generateWeeklyReport();
    }, { 
      scheduled: false,
      timezone: config.bot.timezone 
    });

    // Store jobs for management
    this.scheduledJobs = [
      { name: 'daily_stats', job: dailyStatsJob },
      { name: 'educational_content', job: educationalJob },
      { name: 'engagement_questions', job: engagementJob },
      { name: 'success_stories', job: successStoryJob },
      { name: 'engagement_cycle', job: engagementCycleJob },
      { name: 'metrics_update', job: metricsJob },
      { name: 'weekly_report', job: weeklyReportJob }
    ];

    // Start all jobs
    this.scheduledJobs.forEach(({ name, job }) => {
      job.start();
      logger.info(`📅 Scheduled task started: ${name}`);
    });

    logger.info(`✅ ${this.scheduledJobs.length} scheduled tasks configured`);
  }

  async executeScheduledPost(contentType) {
    try {
      logger.botActivity('SCHEDULED_POST_START', { type: contentType });

      // Generate content
      const content = await this.contentGenerator.generateContent(contentType);
      
      // Post tweet
      const tweet = await this.bot.postTweet(content, { 
        post_type: `scheduled_${contentType}` 
      });

      // Track performance
      await this.analytics.trackContentPerformance({
        type: contentType,
        content,
        tweet_id: tweet.data.id,
        scheduled: true
      });

      logger.botActivity('SCHEDULED_POST_SUCCESS', {
        type: contentType,
        tweet_id: tweet.data.id,
        character_count: content.length
      });

    } catch (error) {
      logger.error(`❌ Scheduled post failed (${contentType}):`, error);
      
      // Try fallback content
      try {
        const fallbackContent = this.contentGenerator.getFallbackContent(contentType);
        await this.bot.postTweet(fallbackContent, { 
          post_type: `fallback_${contentType}` 
        });
        logger.info(`✅ Fallback content posted for ${contentType}`);
      } catch (fallbackError) {
        logger.error(`❌ Fallback content also failed for ${contentType}:`, fallbackError);
      }
    }
  }

  async generateWeeklyReport() {
    try {
      logger.botActivity('WEEKLY_REPORT_START');

      const weeklyData = await this.analytics.getWeeklyReport();
      
      // Create summary tweet
      const reportContent = `📊 Weekly CodeDAO Report:
🚀 ${weeklyData.posts_made} posts shared
👥 ${weeklyData.engagement_actions} community interactions
📈 ${weeklyData.follower_growth} new followers
💎 Top post: ${weeklyData.top_post_performance}% engagement

Building the future of coding rewards! 🔥
#CodeDAO #WeeklyUpdate`;

      await this.bot.postTweet(reportContent, { post_type: 'weekly_report' });
      
      logger.botActivity('WEEKLY_REPORT_SUCCESS', weeklyData);

    } catch (error) {
      logger.error('❌ Weekly report generation failed:', error);
    }
  }

  // Health and status monitoring
  async getHealthStatus() {
    try {
      const [
        botHealth,
        dbHealth,
        dashboardHealth,
        analyticsHealth
      ] = await Promise.allSettled([
        this.bot.healthCheck(),
        database.healthCheck(),
        this.contentGenerator.dashboardData.healthCheck(),
        this.analytics.getSystemHealth()
      ]);

      const overall = {
        status: 'healthy',
        uptime: this.getUptime(),
        environment: config.bot.environment,
        last_check: new Date().toISOString()
      };

      // Check individual components
      if (botHealth.status === 'rejected' || botHealth.value?.status !== 'healthy') {
        overall.status = 'unhealthy';
      }

      if (dbHealth.status === 'rejected' || dbHealth.value?.status !== 'healthy') {
        overall.status = 'degraded';
      }

      return {
        overall,
        components: {
          twitter_bot: botHealth.status === 'fulfilled' ? botHealth.value : { status: 'unhealthy' },
          database: dbHealth.status === 'fulfilled' ? dbHealth.value : { status: 'unhealthy' },
          dashboard_integration: dashboardHealth.status === 'fulfilled' ? dashboardHealth.value : { status: 'unknown' },
          analytics: analyticsHealth.status === 'fulfilled' ? analyticsHealth.value : { status: 'unknown' }
        }
      };

    } catch (error) {
      return {
        overall: { status: 'error', error: error.message },
        components: {}
      };
    }
  }

  getUptime() {
    if (!this.startTime) return 0;
    return Math.floor((Date.now() - this.startTime.getTime()) / 1000);
  }

  async logInitializationStatus() {
    try {
      const health = await this.getHealthStatus();
      const config_summary = {
        username: config.bot.username,
        environment: config.bot.environment,
        scheduling_enabled: config.schedule.enabled,
        content_generation: config.content.generationEnabled,
        auto_engagement: config.content.autoEngagementEnabled,
        daily_post_limit: config.limits.maxPostsPerDay,
        hashtags_monitored: config.targeting.hashtags.length
      };

      logger.info('📋 Bot Initialization Summary:', JSON.stringify({
        health: health.overall,
        config: config_summary
      }, null, 2));

      // Post initialization tweet if in production
      if (config.bot.environment === 'production') {
        const initTweet = `🤖 CodeDAO Bot online!
⚡ Ready to engage the developer community
🎯 Monitoring ${config.targeting.hashtags.length} hashtags
💎 Spreading the word about quality code rewards

Let's build the future together! 🚀
#CodeDAO #BotOnline`;

        await this.bot.postTweet(initTweet, { post_type: 'initialization' });
        logger.info('✅ Initialization tweet posted');
      }

    } catch (error) {
      logger.error('❌ Failed to log initialization status:', error);
    }
  }

  // Graceful shutdown
  async shutdown() {
    logger.info('📴 Shutting down CodeDAO Twitter Bot...');

    try {
      // Stop scheduled jobs
      this.scheduledJobs.forEach(({ name, job }) => {
        job.stop();
        logger.info(`📅 Stopped scheduled task: ${name}`);
      });

      // Shutdown bot
      if (this.bot) {
        await this.bot.shutdown();
      }

      // Close server
      if (this.server) {
        this.server.close();
        logger.info('🌐 Server closed');
      }

      // Disconnect database
      await database.disconnect();

      this.isRunning = false;
      logger.info('✅ Shutdown completed gracefully');

    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
    }

    process.exit(0);
  }

  // Manual operations (for CLI usage)
  async manualPost(contentType, options = {}) {
    try {
      const content = await this.contentGenerator.generateContent(contentType, options);
      const tweet = await this.bot.postTweet(content, { 
        post_type: `manual_${contentType}`,
        ...options 
      });
      
      console.log(`✅ Posted ${contentType}: ${tweet.data.id}`);
      console.log(`📝 Content: ${content}`);
      
      return tweet;

    } catch (error) {
      console.error(`❌ Manual post failed:`, error);
      throw error;
    }
  }

  async manualEngagement() {
    try {
      console.log('🎯 Starting manual engagement cycle...');
      await this.engagementEngine.runEngagementCycle();
      console.log('✅ Engagement cycle completed');
    } catch (error) {
      console.error('❌ Manual engagement failed:', error);
      throw error;
    }
  }
}

// CLI handling
async function handleCLI() {
  const args = process.argv.slice(2);
  const command = args[0];

  const bot = new CodeDAOTwitterBot();
  
  try {
    await bot.initialize();

    switch (command) {
      case 'post':
        const contentType = args[1] || 'daily_stats';
        await bot.manualPost(contentType);
        await bot.shutdown();
        break;

      case 'engage':
        await bot.manualEngagement();
        await bot.shutdown();
        break;

      case 'health':
        const health = await bot.getHealthStatus();
        console.log('🏥 Health Status:', JSON.stringify(health, null, 2));
        await bot.shutdown();
        break;

      case 'start':
      default:
        // Keep running
        console.log('🚀 Bot started and running...');
        console.log('📊 Health endpoint: http://localhost:3000/health');
        console.log('📈 Analytics endpoint: http://localhost:3000/analytics');
        break;
    }

  } catch (error) {
    console.error('❌ CLI command failed:', error);
    await bot.shutdown();
    process.exit(1);
  }
}

// Signal handling for graceful shutdown
if (require.main === module) {
  const bot = new CodeDAOTwitterBot();

  // Handle process signals
  process.on('SIGINT', () => bot.shutdown());
  process.on('SIGTERM', () => bot.shutdown());
  process.on('uncaughtException', (error) => {
    logger.error('💥 Uncaught exception:', error);
    bot.shutdown();
  });
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('💥 Unhandled rejection at:', promise, 'reason:', reason);
    bot.shutdown();
  });

  // Start the application
  handleCLI().catch(console.error);
}

module.exports = CodeDAOTwitterBot; 
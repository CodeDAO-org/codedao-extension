const { MongoClient } = require('mongodb');
const config = require('./config');
const logger = require('./logger');
const simpleDatabase = require('./simple-database');

class Database {
  constructor() {
    this.client = null;
    this.db = null;
    this.connected = false;
  }

  async connect() {
    try {
      this.client = new MongoClient(config.database.uri, config.database.options);
      await this.client.connect();
      this.db = this.client.db();
      this.connected = true;
      
      // Initialize collections with indexes
      await this.initializeCollections();
      
      logger.info('✅ Database connected successfully');
      return true;
    } catch (error) {
      logger.warn('MongoDB not available, falling back to simple file-based database:', error.message);
      
      // Fall back to simple database
      const success = await simpleDatabase.connect();
      if (success) {
        this.useSimpleDatabase = true;
        logger.info('✅ Using simple file-based database');
        return true;
      }
      
      logger.error('❌ Failed to connect to any database');
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.close();
      this.connected = false;
      logger.info('📴 Database disconnected');
    }
  }

  async initializeCollections() {
    // Create indexes for better performance
    const collections = [
      {
        name: 'bot_posts',
        indexes: [
          { tweet_id: 1 },
          { post_type: 1 },
          { created_at: -1 },
          { performance_score: -1 }
        ]
      },
      {
        name: 'engagement_targets',
        indexes: [
          { username: 1 },
          { engagement_score: -1 },
          { last_engaged: -1 }
        ]
      },
      {
        name: 'daily_metrics',
        indexes: [
          { date: -1 },
          { created_at: -1 }
        ]
      },
      {
        name: 'rate_limits',
        indexes: [
          { action_type: 1 },
          { timestamp: -1 }
        ]
      },
      {
        name: 'content_performance',
        indexes: [
          { hashtags: 1 },
          { engagement_rate: -1 },
          { posted_at: -1 }
        ]
      }
    ];

    for (const collection of collections) {
      const coll = this.db.collection(collection.name);
      for (const index of collection.indexes) {
        await coll.createIndex(index);
      }
    }

    logger.info('📊 Database collections and indexes initialized');
  }

  // Bot Posts Collection Methods
  async saveBotPost(postData) {
    if (this.useSimpleDatabase) {
      return await simpleDatabase.saveBotPost(postData);
    }
    
    const post = {
      tweet_id: postData.tweet_id,
      content: postData.content,
      post_type: postData.post_type,
      hashtags: postData.hashtags || [],
      likes_count: 0,
      retweets_count: 0,
      replies_count: 0,
      engagement_rate: 0,
      performance_score: 0,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await this.db.collection('bot_posts').insertOne(post);
    logger.info(`📝 Saved bot post: ${postData.tweet_id} (${postData.post_type})`);
    return result;
  }

  async updatePostMetrics(tweetId, metrics) {
    const updateData = {
      likes_count: metrics.likes || 0,
      retweets_count: metrics.retweets || 0,
      replies_count: metrics.replies || 0,
      engagement_rate: this.calculateEngagementRate(metrics),
      performance_score: this.calculatePerformanceScore(metrics),
      updated_at: new Date()
    };

    const result = await this.db.collection('bot_posts').updateOne(
      { tweet_id: tweetId },
      { $set: updateData }
    );

    return result;
  }

  async getBotPosts(limit = 50, type = null) {
    const query = type ? { post_type: type } : {};
    const posts = await this.db.collection('bot_posts')
      .find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .toArray();
    
    return posts;
  }

  // Engagement Targets Collection Methods
  async saveEngagementTarget(targetData) {
    const target = {
      username: targetData.username,
      display_name: targetData.display_name || '',
      follower_count: targetData.follower_count || 0,
      engagement_score: 0,
      interaction_history: [],
      follow_status: false,
      last_engaged: null,
      created_at: new Date(),
      updated_at: new Date()
    };

    const result = await this.db.collection('engagement_targets').replaceOne(
      { username: targetData.username },
      target,
      { upsert: true }
    );

    return result;
  }

  async updateEngagementTarget(username, updateData) {
    const update = {
      ...updateData,
      updated_at: new Date()
    };

    if (updateData.interaction_type) {
      update.$push = {
        interaction_history: {
          type: updateData.interaction_type,
          timestamp: new Date(),
          details: updateData.interaction_details || {}
        }
      };
    }

    const result = await this.db.collection('engagement_targets').updateOne(
      { username },
      { $set: update }
    );

    return result;
  }

  async getEngagementTargets(limit = 100, minScore = 0) {
    const targets = await this.db.collection('engagement_targets')
      .find({ engagement_score: { $gte: minScore } })
      .sort({ engagement_score: -1, last_engaged: 1 })
      .limit(limit)
      .toArray();
    
    return targets;
  }

  // Daily Metrics Collection Methods
  async saveDailyMetrics(date, metrics) {
    const dailyMetrics = {
      date: date instanceof Date ? date : new Date(date),
      followers_count: metrics.followers_count || 0,
      posts_made: metrics.posts_made || 0,
      total_engagement: metrics.total_engagement || 0,
      website_clicks: metrics.website_clicks || 0,
      new_users_from_twitter: metrics.new_users_from_twitter || 0,
      top_performing_post: metrics.top_performing_post || null,
      engagement_rate: metrics.engagement_rate || 0,
      reach: metrics.reach || 0,
      impressions: metrics.impressions || 0,
      created_at: new Date()
    };

    const result = await this.db.collection('daily_metrics').replaceOne(
      { date: dailyMetrics.date },
      dailyMetrics,
      { upsert: true }
    );

    logger.info(`📊 Saved daily metrics for ${dailyMetrics.date.toDateString()}`);
    return result;
  }

  async getDailyMetrics(days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const metrics = await this.db.collection('daily_metrics')
      .find({ date: { $gte: startDate } })
      .sort({ date: -1 })
      .toArray();
    
    return metrics;
  }

  // Rate Limiting Collection Methods
  async logRateLimit(actionType, count = 1) {
    const rateLimitLog = {
      action_type: actionType,
      count: count,
      timestamp: new Date(),
      hour: new Date().getHours(),
      date: new Date().toDateString()
    };

    const result = await this.db.collection('rate_limits').insertOne(rateLimitLog);
    return result;
  }

  async checkRateLimit(actionType, timeframe = 'hour') {
    if (this.useSimpleDatabase) {
      return await simpleDatabase.checkRateLimit(actionType, timeframe);
    }
    
    const now = new Date();
    let startTime;

    if (timeframe === 'hour') {
      startTime = new Date(now.getTime() - (60 * 60 * 1000));
    } else if (timeframe === 'day') {
      startTime = new Date(now.getTime() - (24 * 60 * 60 * 1000));
    }

    const count = await this.db.collection('rate_limits').countDocuments({
      action_type: actionType,
      timestamp: { $gte: startTime }
    });

    return count;
  }

  // Content Performance Analytics
  async saveContentPerformance(contentData) {
    const performance = {
      content_type: contentData.type,
      hashtags: contentData.hashtags || [],
      post_time: contentData.post_time || new Date(),
      engagement_metrics: contentData.metrics || {},
      engagement_rate: this.calculateEngagementRate(contentData.metrics || {}),
      reach: contentData.reach || 0,
      impressions: contentData.impressions || 0,
      clicks: contentData.clicks || 0,
      posted_at: new Date()
    };

    const result = await this.db.collection('content_performance').insertOne(performance);
    return result;
  }

  async getTopPerformingContent(type = null, limit = 10) {
    const query = type ? { content_type: type } : {};
    const content = await this.db.collection('content_performance')
      .find(query)
      .sort({ engagement_rate: -1 })
      .limit(limit)
      .toArray();
    
    return content;
  }

  async getHashtagPerformance() {
    const pipeline = [
      { $unwind: '$hashtags' },
      {
        $group: {
          _id: '$hashtags',
          avg_engagement: { $avg: '$engagement_rate' },
          total_posts: { $sum: 1 },
          total_reach: { $sum: '$reach' }
        }
      },
      { $sort: { avg_engagement: -1 } },
      { $limit: 20 }
    ];

    const hashtagStats = await this.db.collection('content_performance')
      .aggregate(pipeline)
      .toArray();
    
    return hashtagStats;
  }

  // Analytics Helper Methods
  calculateEngagementRate(metrics) {
    const totalEngagements = (metrics.likes || 0) + (metrics.retweets || 0) + (metrics.replies || 0);
    const impressions = metrics.impressions || 1;
    return ((totalEngagements / impressions) * 100).toFixed(2);
  }

  calculatePerformanceScore(metrics) {
    const likes = metrics.likes || 0;
    const retweets = metrics.retweets || 0;
    const replies = metrics.replies || 0;
    
    // Weighted score: retweets worth more than likes, replies worth most
    const score = (likes * 1) + (retweets * 3) + (replies * 5);
    return Math.min(score, 100); // Cap at 100
  }

  // Dashboard Analytics
  async getDashboardAnalytics() {
    if (this.useSimpleDatabase) {
      return await simpleDatabase.getDashboardAnalytics();
    }
    
    const [
      totalPosts,
      totalEngagementTargets,
      recentMetrics,
      topContent,
      hashtagPerformance
    ] = await Promise.all([
      this.db.collection('bot_posts').countDocuments(),
      this.db.collection('engagement_targets').countDocuments(),
      this.getDailyMetrics(7),
      this.getTopPerformingContent(null, 5),
      this.getHashtagPerformance()
    ]);

    const analytics = {
      overview: {
        total_posts: totalPosts,
        total_targets: totalEngagementTargets,
        avg_engagement_rate: this.calculateAverageEngagement(recentMetrics)
      },
      recent_performance: recentMetrics,
      top_content: topContent,
      hashtag_performance: hashtagPerformance,
      generated_at: new Date()
    };

    return analytics;
  }

  calculateAverageEngagement(metrics) {
    if (!metrics.length) return 0;
    
    const totalEngagement = metrics.reduce((sum, metric) => sum + (metric.engagement_rate || 0), 0);
    return (totalEngagement / metrics.length).toFixed(2);
  }

  // Health Check
  async healthCheck() {
    if (this.useSimpleDatabase) {
      return await simpleDatabase.healthCheck();
    }
    
    try {
      await this.db.admin().ping();
      return { status: 'healthy', connected: this.connected, type: 'mongodb' };
    } catch (error) {
      return { status: 'unhealthy', error: error.message, type: 'mongodb' };
    }
  }
}

module.exports = new Database(); 
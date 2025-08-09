const { TwitterApi } = require('twitter-api-v2');
const config = require('./config');
const logger = require('./logger');
const database = require('./database');
const SafetyManager = require('./SafetyManager');

class TwitterBot {
  constructor() {
    this.client = null;
    this.rwClient = null; // Read-write client
    this.roClient = null; // Read-only client
    this.safetyManager = new SafetyManager();
    this.isInitialized = false;
    this.currentUser = null;
  }

  async initialize() {
    try {
      // Initialize Twitter API clients
      this.client = new TwitterApi({
        appKey: config.twitter.apiKey,
        appSecret: config.twitter.apiSecret,
        accessToken: config.twitter.accessToken,
        accessSecret: config.twitter.accessTokenSecret,
      });

      // Read-write client for posting, liking, following
      this.rwClient = this.client.readWrite;
      
      // Read-only client for searching, reading tweets
      this.roClient = this.client.readOnly;

      // Test authentication and get current user
      this.currentUser = await this.rwClient.currentUser();
      
      logger.info(`✅ Twitter Bot initialized successfully as @${this.currentUser.username}`);
      logger.botActivity('INITIALIZATION', {
        username: this.currentUser.username,
        user_id: this.currentUser.id,
        followers_count: this.currentUser.public_metrics?.followers_count || 0
      });

      this.isInitialized = true;
      return true;

    } catch (error) {
      logger.error('❌ Failed to initialize Twitter Bot:', error);
      logger.twitterAPI('authentication', 'POST', 'failed', { error: error.message });
      return false;
    }
  }

  // Core Posting Methods
  async postTweet(content, options = {}) {
    if (!this.isInitialized) {
      throw new Error('Bot not initialized. Call initialize() first.');
    }

    try {
      // Safety check
      const safetyCheck = await this.safetyManager.validatePost(content, 'tweet');
      if (!safetyCheck.safe) {
        logger.safety('POST_VALIDATION', 'failed', safetyCheck);
        throw new Error(`Post failed safety check: ${safetyCheck.reason}`);
      }

      // Rate limit check
      const canPost = await this.safetyManager.checkRateLimit('posts', 'day');
      if (!canPost) {
        logger.rateLimit('posts', 'N/A', config.limits.maxPostsPerDay, 'exceeded');
        throw new Error('Daily post limit exceeded');
      }

      // Post the tweet
      const startTime = Date.now();
      const tweet = await this.rwClient.tweet(content, options);
      const duration = Date.now() - startTime;

      // Log successful post
      logger.botActivity('TWEET_POSTED', {
        tweet_id: tweet.data.id,
        content_preview: content.substring(0, 50) + '...',
        character_count: content.length
      });
      logger.performance('POST_TWEET', duration, true);
      logger.twitterAPI('tweets', 'POST', 'success', { tweet_id: tweet.data.id });

      // Save to database
      await database.saveBotPost({
        tweet_id: tweet.data.id,
        content: content,
        post_type: options.post_type || 'general',
        hashtags: this.extractHashtags(content)
      });

      // Log rate limit
      await database.logRateLimit('posts');

      return tweet;

    } catch (error) {
      logger.error('❌ Failed to post tweet:', error);
      logger.twitterAPI('tweets', 'POST', 'failed', { error: error.message });
      throw error;
    }
  }

  async replyToTweet(tweetId, content, options = {}) {
    try {
      const safetyCheck = await this.safetyManager.validatePost(content, 'reply');
      if (!safetyCheck.safe) {
        logger.safety('REPLY_VALIDATION', 'failed', safetyCheck);
        return null;
      }

      const canReply = await this.safetyManager.checkRateLimit('replies', 'hour');
      if (!canReply) {
        logger.rateLimit('replies', 'N/A', config.limits.maxRepliesPerHour, 'exceeded');
        return null;
      }

      const reply = await this.rwClient.reply(content, tweetId, options);
      
      logger.engagement('REPLY', `tweet_${tweetId}`, 'success', {
        reply_id: reply.data.id,
        content_preview: content.substring(0, 30) + '...'
      });

      await database.logRateLimit('replies');
      return reply;

    } catch (error) {
      logger.error('❌ Failed to reply to tweet:', error);
      return null;
    }
  }

  // Engagement Methods
  async likeTweet(tweetId) {
    try {
      const canLike = await this.safetyManager.checkRateLimit('likes', 'hour');
      if (!canLike) {
        logger.rateLimit('likes', 'N/A', config.limits.maxLikesPerHour, 'exceeded');
        return false;
      }

      await this.rwClient.like(this.currentUser.id, tweetId);
      
      logger.engagement('LIKE', `tweet_${tweetId}`, 'success');
      await database.logRateLimit('likes');
      
      // Add human-like delay
      await this.safetyManager.addHumanDelay();
      
      return true;

    } catch (error) {
      logger.error('❌ Failed to like tweet:', error);
      logger.engagement('LIKE', `tweet_${tweetId}`, 'failed', { error: error.message });
      return false;
    }
  }

  async retweetTweet(tweetId, options = {}) {
    try {
      const canRetweet = await this.safetyManager.checkRateLimit('retweets', 'hour');
      if (!canRetweet) {
        return false;
      }

      await this.rwClient.retweet(this.currentUser.id, tweetId);
      
      logger.engagement('RETWEET', `tweet_${tweetId}`, 'success');
      await database.logRateLimit('retweets');
      await this.safetyManager.addHumanDelay();
      
      return true;

    } catch (error) {
      logger.error('❌ Failed to retweet:', error);
      return false;
    }
  }

  async followUser(userId) {
    try {
      const canFollow = await this.safetyManager.checkRateLimit('follows', 'hour');
      if (!canFollow) {
        logger.rateLimit('follows', 'N/A', config.limits.maxFollowsPerHour, 'exceeded');
        return false;
      }

      await this.rwClient.follow(this.currentUser.id, userId);
      
      logger.engagement('FOLLOW', `user_${userId}`, 'success');
      await database.logRateLimit('follows');
      await this.safetyManager.addHumanDelay();
      
      return true;

    } catch (error) {
      logger.error('❌ Failed to follow user:', error);
      return false;
    }
  }

  // Search and Discovery Methods
  async searchTweets(query, options = {}) {
    try {
      const defaultOptions = {
        max_results: 20,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'context_annotations'],
        'user.fields': ['username', 'name', 'public_metrics'],
        expansions: ['author_id']
      };

      const searchOptions = { ...defaultOptions, ...options };
      const tweets = await this.roClient.search(query, searchOptions);
      
      logger.twitterAPI('search/tweets', 'GET', 'success', {
        query,
        results_count: tweets.data?.length || 0
      });

      return tweets;

    } catch (error) {
      logger.error('❌ Failed to search tweets:', error);
      logger.twitterAPI('search/tweets', 'GET', 'failed', { error: error.message });
      return null;
    }
  }

  async getUserByUsername(username) {
    try {
      const user = await this.roClient.userByUsername(username, {
        'user.fields': ['created_at', 'description', 'public_metrics', 'verified']
      });
      
      return user;

    } catch (error) {
      logger.error(`❌ Failed to get user ${username}:`, error);
      return null;
    }
  }

  async getTweetById(tweetId, options = {}) {
    try {
      const defaultOptions = {
        'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'context_annotations'],
        'user.fields': ['username', 'name', 'public_metrics'],
        expansions: ['author_id']
      };

      const tweet = await this.roClient.singleTweet(tweetId, { ...defaultOptions, ...options });
      return tweet;

    } catch (error) {
      logger.error(`❌ Failed to get tweet ${tweetId}:`, error);
      return null;
    }
  }

  // Analytics and Monitoring Methods
  async getMyTweets(count = 20) {
    try {
      const tweets = await this.roClient.userTimeline(this.currentUser.id, {
        max_results: count,
        'tweet.fields': ['created_at', 'public_metrics', 'context_annotations']
      });

      return tweets;

    } catch (error) {
      logger.error('❌ Failed to get my tweets:', error);
      return null;
    }
  }

  async updatePostMetrics() {
    try {
      logger.botActivity('METRICS_UPDATE_START');
      
      const recentTweets = await this.getMyTweets(50);
      if (!recentTweets?.data) return;

      let updatedCount = 0;
      
      for (const tweet of recentTweets.data) {
        const metrics = tweet.public_metrics;
        
        await database.updatePostMetrics(tweet.id, {
          likes: metrics.like_count,
          retweets: metrics.retweet_count,
          replies: metrics.reply_count,
          impressions: metrics.impression_count || 0
        });
        
        updatedCount++;
      }

      logger.analytics('POSTS_UPDATED', updatedCount);
      logger.botActivity('METRICS_UPDATE_COMPLETE', { posts_updated: updatedCount });

    } catch (error) {
      logger.error('❌ Failed to update post metrics:', error);
    }
  }

  async getAccountMetrics() {
    try {
      const user = await this.rwClient.currentUser();
      const metrics = {
        followers_count: user.public_metrics?.followers_count || 0,
        following_count: user.public_metrics?.following_count || 0,
        tweet_count: user.public_metrics?.tweet_count || 0,
        listed_count: user.public_metrics?.listed_count || 0
      };

      logger.analytics('ACCOUNT_METRICS', JSON.stringify(metrics));
      return metrics;

    } catch (error) {
      logger.error('❌ Failed to get account metrics:', error);
      return null;
    }
  }

  // Utility Methods
  extractHashtags(content) {
    const hashtagRegex = /#[\w\d_]+/g;
    const hashtags = content.match(hashtagRegex) || [];
    return hashtags.map(tag => tag.toLowerCase());
  }

  extractMentions(content) {
    const mentionRegex = /@[\w\d_]+/g;
    const mentions = content.match(mentionRegex) || [];
    return mentions.map(mention => mention.substring(1).toLowerCase());
  }

  calculateOptimalPostTime() {
    // Based on Twitter best practices and target audience (developers)
    const now = new Date();
    const hour = now.getHours();
    
    // Developer-friendly times: 9-11 AM, 1-3 PM, 6-8 PM UTC
    const optimalHours = [9, 10, 11, 13, 14, 15, 18, 19, 20];
    
    if (optimalHours.includes(hour)) {
      return 'optimal';
    } else if (hour >= 6 && hour <= 23) {
      return 'good';
    } else {
      return 'suboptimal';
    }
  }

  // Health Check
  async healthCheck() {
    try {
      if (!this.isInitialized) {
        return { status: 'unhealthy', reason: 'Not initialized' };
      }

      // Test API connectivity
      const user = await this.rwClient.currentUser();
      
      // Check rate limits
      const rateLimitStatus = await this.safetyManager.getRateLimitStatus();
      
      return {
        status: 'healthy',
        user: {
          username: user.username,
          followers: user.public_metrics?.followers_count || 0
        },
        rate_limits: rateLimitStatus,
        last_check: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Health check failed:', error);
      return {
        status: 'unhealthy',
        reason: error.message,
        last_check: new Date().toISOString()
      };
    }
  }

  // Graceful shutdown
  async shutdown() {
    logger.botActivity('SHUTDOWN_INITIATED');
    
    try {
      // Update final metrics
      await this.updatePostMetrics();
      
      // Log final analytics
      const metrics = await this.getAccountMetrics();
      if (metrics) {
        await database.saveDailyMetrics(new Date(), {
          followers_count: metrics.followers_count,
          posts_made: await database.checkRateLimit('posts', 'day'),
          total_engagement: 0 // Will be calculated from post metrics
        });
      }

      logger.botActivity('SHUTDOWN_COMPLETE');
      return true;

    } catch (error) {
      logger.error('❌ Error during shutdown:', error);
      return false;
    }
  }
}

module.exports = TwitterBot; 
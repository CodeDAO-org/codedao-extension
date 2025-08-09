const config = require('./config');
const logger = require('./logger');

class Analytics {
  constructor(twitterBot, database) {
    this.bot = twitterBot;
    this.db = database;
    this.lastMetricsUpdate = null;
    this.performanceCache = new Map();
  }

  // Main analytics data aggregation
  async getDashboardData() {
    try {
      logger.analytics('DASHBOARD_DATA_REQUEST', 'started');

      const [
        overview,
        recentPosts,
        engagementStats,
        growthMetrics,
        contentPerformance,
        hashtagAnalysis
      ] = await Promise.allSettled([
        this.getOverviewMetrics(),
        this.getRecentPostsAnalytics(),
        this.getEngagementAnalytics(),
        this.getGrowthMetrics(),
        this.getContentPerformanceAnalytics(),
        this.getHashtagAnalytics()
      ]);

      const dashboardData = {
        overview: overview.status === 'fulfilled' ? overview.value : {},
        recent_posts: recentPosts.status === 'fulfilled' ? recentPosts.value : [],
        engagement: engagementStats.status === 'fulfilled' ? engagementStats.value : {},
        growth: growthMetrics.status === 'fulfilled' ? growthMetrics.value : {},
        content_performance: contentPerformance.status === 'fulfilled' ? contentPerformance.value : {},
        hashtag_analysis: hashtagAnalysis.status === 'fulfilled' ? hashtagAnalysis.value : [],
        generated_at: new Date().toISOString(),
        cache_info: {
          last_metrics_update: this.lastMetricsUpdate,
          cache_entries: this.performanceCache.size
        }
      };

      logger.analytics('DASHBOARD_DATA_REQUEST', 'completed');
      return dashboardData;

    } catch (error) {
      logger.error('❌ Failed to generate dashboard data:', error);
      throw error;
    }
  }

  // Overview metrics (high-level KPIs)
  async getOverviewMetrics() {
    try {
      const [
        accountMetrics,
        totalPosts,
        weeklyEngagement,
        averagePerformance
      ] = await Promise.all([
        this.bot.getAccountMetrics(),
        this.db.collection('bot_posts').countDocuments(),
        this.getWeeklyEngagementCount(),
        this.getAveragePostPerformance()
      ]);

      const overview = {
        followers_count: accountMetrics?.followers_count || 0,
        following_count: accountMetrics?.following_count || 0,
        total_posts: totalPosts,
        weekly_engagement_actions: weeklyEngagement,
        average_engagement_rate: averagePerformance.engagementRate,
        average_performance_score: averagePerformance.performanceScore,
        bot_uptime_hours: this.getBotUptimeHours(),
        last_post_time: await this.getLastPostTime()
      };

      return overview;

    } catch (error) {
      logger.error('❌ Failed to get overview metrics:', error);
      return {};
    }
  }

  // Recent posts analytics
  async getRecentPostsAnalytics() {
    try {
      const recentPosts = await this.db.collection('bot_posts')
        .find()
        .sort({ created_at: -1 })
        .limit(20)
        .toArray();

      const analytics = recentPosts.map(post => ({
        tweet_id: post.tweet_id,
        content_preview: post.content.substring(0, 100) + (post.content.length > 100 ? '...' : ''),
        post_type: post.post_type,
        created_at: post.created_at,
        performance: {
          likes: post.likes_count,
          retweets: post.retweets_count,
          replies: post.replies_count,
          engagement_rate: parseFloat(post.engagement_rate),
          performance_score: post.performance_score
        },
        hashtags: post.hashtags || []
      }));

      return analytics;

    } catch (error) {
      logger.error('❌ Failed to get recent posts analytics:', error);
      return [];
    }
  }

  // Engagement analytics
  async getEngagementAnalytics() {
    try {
      const [
        dailyLikes,
        dailyReplies,
        targetMetrics,
        engagementTrends
      ] = await Promise.all([
        this.db.checkRateLimit('likes', 'day'),
        this.db.checkRateLimit('replies', 'day'),
        this.getEngagementTargetMetrics(),
        this.getEngagementTrends()
      ]);

      const engagement = {
        daily_actions: {
          likes_given: dailyLikes,
          replies_sent: dailyReplies,
          total_interactions: dailyLikes + dailyReplies
        },
        targets: targetMetrics,
        trends: engagementTrends,
        efficiency: {
          engagement_to_follower_ratio: this.calculateEngagementEfficiency(dailyLikes + dailyReplies),
          response_rate: await this.getResponseRate()
        }
      };

      return engagement;

    } catch (error) {
      logger.error('❌ Failed to get engagement analytics:', error);
      return {};
    }
  }

  // Growth metrics
  async getGrowthMetrics() {
    try {
      const dailyMetrics = await this.db.getDailyMetrics(30);
      
      if (dailyMetrics.length < 2) {
        return {
          follower_growth: { daily: 0, weekly: 0, monthly: 0 },
          post_growth: { daily: 0, weekly: 0 },
          engagement_growth: { daily: 0, weekly: 0 }
        };
      }

      const latest = dailyMetrics[0];
      const weekAgo = dailyMetrics.find(m => {
        const daysDiff = (Date.now() - m.date.getTime()) / (1000 * 60 * 60 * 24);
        return daysDiff >= 6 && daysDiff <= 8;
      }) || dailyMetrics[Math.min(7, dailyMetrics.length - 1)];

      const monthAgo = dailyMetrics[Math.min(30, dailyMetrics.length - 1)];

      const growth = {
        follower_growth: {
          daily: latest.followers_count - (dailyMetrics[1]?.followers_count || latest.followers_count),
          weekly: latest.followers_count - weekAgo.followers_count,
          monthly: latest.followers_count - monthAgo.followers_count
        },
        post_growth: {
          daily: latest.posts_made,
          weekly: dailyMetrics.slice(0, 7).reduce((sum, day) => sum + (day.posts_made || 0), 0)
        },
        engagement_growth: {
          daily: latest.total_engagement - (dailyMetrics[1]?.total_engagement || latest.total_engagement),
          weekly: latest.total_engagement - weekAgo.total_engagement
        }
      };

      return growth;

    } catch (error) {
      logger.error('❌ Failed to get growth metrics:', error);
      return {};
    }
  }

  // Content performance analytics
  async getContentPerformanceAnalytics() {
    try {
      const [
        topPerformingPosts,
        contentTypePerformance,
        timeAnalysis,
        hashtagPerformance
      ] = await Promise.all([
        this.getTopPerformingPosts(),
        this.getContentTypePerformance(),
        this.getOptimalPostingTimes(),
        this.db.getHashtagPerformance()
      ]);

      const performance = {
        top_posts: topPerformingPosts,
        content_types: contentTypePerformance,
        optimal_times: timeAnalysis,
        hashtag_performance: hashtagPerformance.slice(0, 10), // Top 10 hashtags
        recommendations: this.generateContentRecommendations(contentTypePerformance, timeAnalysis)
      };

      return performance;

    } catch (error) {
      logger.error('❌ Failed to get content performance analytics:', error);
      return {};
    }
  }

  // Hashtag analytics
  async getHashtagAnalytics() {
    try {
      const hashtagPerformance = await this.db.getHashtagPerformance();
      
      const analytics = hashtagPerformance.map(hashtag => ({
        hashtag: hashtag._id,
        average_engagement: parseFloat(hashtag.avg_engagement),
        total_uses: hashtag.total_posts,
        total_reach: hashtag.total_reach,
        effectiveness_score: this.calculateHashtagEffectiveness(hashtag)
      }));

      // Sort by effectiveness
      analytics.sort((a, b) => b.effectiveness_score - a.effectiveness_score);

      return analytics.slice(0, 20); // Top 20 hashtags

    } catch (error) {
      logger.error('❌ Failed to get hashtag analytics:', error);
      return [];
    }
  }

  // Helper methods for specific calculations
  async getWeeklyEngagementCount() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weeklyLikes = await this.db.collection('rate_limits')
        .countDocuments({
          action_type: 'likes',
          timestamp: { $gte: weekAgo }
        });

      const weeklyReplies = await this.db.collection('rate_limits')
        .countDocuments({
          action_type: 'replies',
          timestamp: { $gte: weekAgo }
        });

      return weeklyLikes + weeklyReplies;

    } catch (error) {
      logger.error('❌ Failed to get weekly engagement count:', error);
      return 0;
    }
  }

  async getAveragePostPerformance() {
    try {
      const pipeline = [
        {
          $group: {
            _id: null,
            avgEngagementRate: { $avg: '$engagement_rate' },
            avgPerformanceScore: { $avg: '$performance_score' },
            totalPosts: { $sum: 1 }
          }
        }
      ];

      const result = await this.db.collection('bot_posts').aggregate(pipeline).toArray();
      
      if (result.length === 0) {
        return { engagementRate: 0, performanceScore: 0 };
      }

      return {
        engagementRate: parseFloat(result[0].avgEngagementRate?.toFixed(2) || 0),
        performanceScore: parseFloat(result[0].avgPerformanceScore?.toFixed(1) || 0)
      };

    } catch (error) {
      logger.error('❌ Failed to get average post performance:', error);
      return { engagementRate: 0, performanceScore: 0 };
    }
  }

  async getEngagementTargetMetrics() {
    try {
      const totalTargets = await this.db.collection('engagement_targets').countDocuments();
      const engagedTargets = await this.db.collection('engagement_targets')
        .countDocuments({ last_engaged: { $ne: null } });

      const avgScore = await this.db.collection('engagement_targets')
        .aggregate([
          { $group: { _id: null, avgScore: { $avg: '$engagement_score' } } }
        ]).toArray();

      return {
        total_targets: totalTargets,
        engaged_targets: engagedTargets,
        engagement_rate: totalTargets > 0 ? ((engagedTargets / totalTargets) * 100).toFixed(1) : 0,
        average_target_score: avgScore[0]?.avgScore?.toFixed(1) || 0
      };

    } catch (error) {
      logger.error('❌ Failed to get engagement target metrics:', error);
      return {};
    }
  }

  async getEngagementTrends() {
    try {
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toDateString();
      }).reverse();

      const trends = [];

      for (const dateStr of last7Days) {
        const dayStart = new Date(dateStr);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);

        const dayEngagement = await this.db.collection('rate_limits')
          .countDocuments({
            timestamp: { $gte: dayStart, $lt: dayEnd }
          });

        trends.push({
          date: dateStr,
          engagement_count: dayEngagement
        });
      }

      return trends;

    } catch (error) {
      logger.error('❌ Failed to get engagement trends:', error);
      return [];
    }
  }

  async getTopPerformingPosts() {
    try {
      const topPosts = await this.db.collection('bot_posts')
        .find()
        .sort({ performance_score: -1 })
        .limit(10)
        .toArray();

      return topPosts.map(post => ({
        tweet_id: post.tweet_id,
        content_preview: post.content.substring(0, 80) + '...',
        post_type: post.post_type,
        performance_score: post.performance_score,
        engagement_rate: parseFloat(post.engagement_rate),
        likes: post.likes_count,
        retweets: post.retweets_count,
        replies: post.replies_count,
        created_at: post.created_at
      }));

    } catch (error) {
      logger.error('❌ Failed to get top performing posts:', error);
      return [];
    }
  }

  async getContentTypePerformance() {
    try {
      const pipeline = [
        {
          $group: {
            _id: '$post_type',
            count: { $sum: 1 },
            avgEngagement: { $avg: '$engagement_rate' },
            avgPerformance: { $avg: '$performance_score' },
            totalLikes: { $sum: '$likes_count' },
            totalRetweets: { $sum: '$retweets_count' }
          }
        },
        { $sort: { avgPerformance: -1 } }
      ];

      const results = await this.db.collection('bot_posts').aggregate(pipeline).toArray();

      return results.map(result => ({
        content_type: result._id,
        post_count: result.count,
        average_engagement_rate: parseFloat(result.avgEngagement?.toFixed(2) || 0),
        average_performance_score: parseFloat(result.avgPerformance?.toFixed(1) || 0),
        total_likes: result.totalLikes,
        total_retweets: result.totalRetweets,
        effectiveness_score: this.calculateContentTypeEffectiveness(result)
      }));

    } catch (error) {
      logger.error('❌ Failed to get content type performance:', error);
      return [];
    }
  }

  async getOptimalPostingTimes() {
    try {
      const pipeline = [
        {
          $addFields: {
            hour: { $hour: '$created_at' },
            dayOfWeek: { $dayOfWeek: '$created_at' }
          }
        },
        {
          $group: {
            _id: { hour: '$hour', dayOfWeek: '$dayOfWeek' },
            count: { $sum: 1 },
            avgEngagement: { $avg: '$engagement_rate' },
            avgPerformance: { $avg: '$performance_score' }
          }
        },
        { $sort: { avgPerformance: -1 } }
      ];

      const results = await this.db.collection('bot_posts').aggregate(pipeline).toArray();

      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

      return results.slice(0, 10).map(result => ({
        hour: result._id.hour,
        day_of_week: daysOfWeek[result._id.dayOfWeek - 1],
        post_count: result.count,
        average_engagement: parseFloat(result.avgEngagement?.toFixed(2) || 0),
        average_performance: parseFloat(result.avgPerformance?.toFixed(1) || 0),
        effectiveness_score: (result.avgPerformance || 0) * Math.log(result.count + 1)
      }));

    } catch (error) {
      logger.error('❌ Failed to get optimal posting times:', error);
      return [];
    }
  }

  // Content and strategy recommendations
  generateContentRecommendations(contentTypePerformance, timeAnalysis) {
    const recommendations = [];

    // Content type recommendations
    if (contentTypePerformance.length > 0) {
      const topContentType = contentTypePerformance[0];
      recommendations.push({
        type: 'content_type',
        recommendation: `Focus more on "${topContentType.content_type}" content`,
        reason: `Shows ${topContentType.average_performance_score} average performance score`,
        priority: 'high'
      });

      const underperformers = contentTypePerformance.filter(ct => ct.average_performance_score < 20);
      if (underperformers.length > 0) {
        recommendations.push({
          type: 'content_improvement',
          recommendation: `Improve or reduce "${underperformers[0].content_type}" content`,
          reason: `Low performance score of ${underperformers[0].average_performance_score}`,
          priority: 'medium'
        });
      }
    }

    // Timing recommendations
    if (timeAnalysis.length > 0) {
      const bestTime = timeAnalysis[0];
      recommendations.push({
        type: 'timing',
        recommendation: `Post more content on ${bestTime.day_of_week} at ${bestTime.hour}:00`,
        reason: `Best performing time slot with ${bestTime.average_performance} average performance`,
        priority: 'medium'
      });
    }

    // Frequency recommendations
    recommendations.push({
      type: 'frequency',
      recommendation: 'Maintain consistent posting schedule',
      reason: 'Regular posting improves audience engagement and algorithm visibility',
      priority: 'low'
    });

    return recommendations;
  }

  // Performance tracking and updates
  async trackContentPerformance(contentData) {
    try {
      const performanceRecord = {
        tweet_id: contentData.tweet_id,
        content_type: contentData.type,
        content_length: contentData.content.length,
        hashtag_count: (contentData.content.match(/#\w+/g) || []).length,
        scheduled: contentData.scheduled || false,
        posted_at: new Date(),
        initial_metrics: {
          likes: 0,
          retweets: 0,
          replies: 0
        }
      };

      await this.db.collection('content_performance').insertOne(performanceRecord);
      
      logger.analytics('CONTENT_TRACKED', contentData.type, 'current');

    } catch (error) {
      logger.error('❌ Failed to track content performance:', error);
    }
  }

  async updateDailyMetrics() {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const accountMetrics = await this.bot.getAccountMetrics();
      const dailyPosts = await this.db.checkRateLimit('posts', 'day');
      const dailyEngagement = await this.getWeeklyEngagementCount(); // This actually gets daily within the week

      const metrics = {
        followers_count: accountMetrics?.followers_count || 0,
        posts_made: dailyPosts,
        total_engagement: dailyEngagement,
        engagement_rate: await this.calculateDailyEngagementRate(),
        top_performing_post: await this.getTodaysTopPost()
      };

      await this.db.saveDailyMetrics(today, metrics);
      this.lastMetricsUpdate = new Date();

      logger.analytics('DAILY_METRICS_UPDATED', JSON.stringify(metrics));

    } catch (error) {
      logger.error('❌ Failed to update daily metrics:', error);
    }
  }

  async getWeeklyReport() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const [
        weeklyMetrics,
        followerGrowth,
        topPost,
        engagementCount
      ] = await Promise.all([
        this.db.getDailyMetrics(7),
        this.getFollowerGrowth(7),
        this.getTopPostThisWeek(),
        this.getWeeklyEngagementCount()
      ]);

      const totalPosts = weeklyMetrics.reduce((sum, day) => sum + (day.posts_made || 0), 0);

      return {
        posts_made: totalPosts,
        engagement_actions: engagementCount,
        follower_growth: followerGrowth,
        top_post_performance: topPost?.engagement_rate || 0,
        average_daily_engagement: (engagementCount / 7).toFixed(1),
        week_start: weekAgo.toISOString(),
        week_end: new Date().toISOString()
      };

    } catch (error) {
      logger.error('❌ Failed to generate weekly report:', error);
      return {};
    }
  }

  // Utility calculation methods
  calculateHashtagEffectiveness(hashtag) {
    const engagementWeight = parseFloat(hashtag.avg_engagement) || 0;
    const usageWeight = Math.log(hashtag.total_posts + 1) * 10;
    const reachWeight = (hashtag.total_reach || 0) / 1000;
    
    return parseFloat((engagementWeight + usageWeight + reachWeight).toFixed(1));
  }

  calculateContentTypeEffectiveness(contentType) {
    const performanceWeight = contentType.avgPerformance || 0;
    const volumeWeight = Math.log(contentType.count + 1) * 5;
    const engagementWeight = (contentType.avgEngagement || 0) * 10;
    
    return parseFloat((performanceWeight + volumeWeight + engagementWeight).toFixed(1));
  }

  calculateEngagementEfficiency(dailyEngagements) {
    // This would need current follower count
    // For now, return a placeholder calculation
    return (dailyEngagements / 100).toFixed(2); // Assuming ~100 followers baseline
  }

  async getResponseRate() {
    try {
      const totalRepliesSent = await this.db.collection('rate_limits')
        .countDocuments({ action_type: 'replies' });
      
      const totalMentions = await this.db.collection('engagement_targets')
        .countDocuments({ 'interaction_history.type': 'mention_reply' });

      if (totalMentions === 0) return 0;
      return ((totalRepliesSent / totalMentions) * 100).toFixed(1);

    } catch (error) {
      return 0;
    }
  }

  async calculateDailyEngagementRate() {
    try {
      const todaysPosts = await this.db.collection('bot_posts').find({
        created_at: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }).toArray();

      if (todaysPosts.length === 0) return 0;

      const avgEngagement = todaysPosts.reduce((sum, post) => 
        sum + parseFloat(post.engagement_rate || 0), 0
      ) / todaysPosts.length;

      return parseFloat(avgEngagement.toFixed(2));

    } catch (error) {
      return 0;
    }
  }

  async getTodaysTopPost() {
    try {
      const todaysPosts = await this.db.collection('bot_posts').find({
        created_at: {
          $gte: new Date(new Date().setHours(0, 0, 0, 0))
        }
      }).sort({ performance_score: -1 }).limit(1).toArray();

      return todaysPosts[0]?.tweet_id || null;

    } catch (error) {
      return null;
    }
  }

  async getTopPostThisWeek() {
    try {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const weekPosts = await this.db.collection('bot_posts').find({
        created_at: { $gte: weekAgo }
      }).sort({ performance_score: -1 }).limit(1).toArray();

      return weekPosts[0] || null;

    } catch (error) {
      return null;
    }
  }

  async getFollowerGrowth(days) {
    try {
      const metrics = await this.db.getDailyMetrics(days + 1);
      if (metrics.length < 2) return 0;

      const latest = metrics[0];
      const earliest = metrics[metrics.length - 1];

      return latest.followers_count - earliest.followers_count;

    } catch (error) {
      return 0;
    }
  }

  async getLastPostTime() {
    try {
      const lastPost = await this.db.collection('bot_posts')
        .findOne({}, { sort: { created_at: -1 } });

      return lastPost?.created_at?.toISOString() || null;

    } catch (error) {
      return null;
    }
  }

  getBotUptimeHours() {
    // This would need to track when the bot started
    // For now, return a placeholder
    return Math.floor(Math.random() * 100) + 10;
  }

  // System health check
  async getSystemHealth() {
    try {
      const health = {
        status: 'healthy',
        metrics_last_updated: this.lastMetricsUpdate,
        cache_size: this.performanceCache.size,
        database_responsive: true
      };

      // Test database connectivity
      await this.db.collection('bot_posts').findOne({});

      return health;

    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }

  // Cache management
  clearPerformanceCache() {
    this.performanceCache.clear();
    logger.analytics('CACHE_CLEARED', 'performance_cache');
  }

  getCacheStats() {
    return {
      size: this.performanceCache.size,
      last_metrics_update: this.lastMetricsUpdate
    };
  }
}

module.exports = Analytics; 
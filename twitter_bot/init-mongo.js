// MongoDB initialization script for CodeDAO Twitter Bot
db = db.getSiblingDB('codedao_twitter_bot');

// Create collections with initial structure
db.createCollection('bot_posts');
db.createCollection('engagement_targets');
db.createCollection('daily_metrics');
db.createCollection('rate_limits');
db.createCollection('content_performance');

// Create indexes for better performance
db.bot_posts.createIndex({ tweet_id: 1 }, { unique: true });
db.bot_posts.createIndex({ post_type: 1 });
db.bot_posts.createIndex({ created_at: -1 });
db.bot_posts.createIndex({ performance_score: -1 });

db.engagement_targets.createIndex({ username: 1 }, { unique: true });
db.engagement_targets.createIndex({ engagement_score: -1 });
db.engagement_targets.createIndex({ last_engaged: -1 });

db.daily_metrics.createIndex({ date: -1 }, { unique: true });
db.daily_metrics.createIndex({ created_at: -1 });

db.rate_limits.createIndex({ action_type: 1 });
db.rate_limits.createIndex({ timestamp: -1 });

db.content_performance.createIndex({ hashtags: 1 });
db.content_performance.createIndex({ engagement_rate: -1 });
db.content_performance.createIndex({ posted_at: -1 });

// Insert initial configuration data
db.configuration.insertOne({
  _id: 'bot_settings',
  version: '1.0.0',
  initialized_at: new Date(),
  default_settings: {
    content_generation_enabled: true,
    auto_engagement_enabled: true,
    rate_limiting_enabled: true,
    analytics_enabled: true
  }
});

print('CodeDAO Twitter Bot database initialized successfully');
print('Collections created: bot_posts, engagement_targets, daily_metrics, rate_limits, content_performance');
print('Indexes created for optimal performance');
print('Initial configuration inserted'); 
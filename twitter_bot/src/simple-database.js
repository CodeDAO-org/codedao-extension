const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

class SimpleDatabase {
    constructor() {
        this.dataDir = path.join(__dirname, '../data');
        this.collections = {
            bot_posts: 'bot_posts.json',
            engagement_targets: 'engagement_targets.json',
            daily_metrics: 'daily_metrics.json',
            rate_limits: 'rate_limits.json',
            content_performance: 'content_performance.json'
        };
        this.initialized = false;
    }

    async connect() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // Initialize empty collections if they don't exist
            for (const [name, file] of Object.entries(this.collections)) {
                const filePath = path.join(this.dataDir, file);
                try {
                    await fs.access(filePath);
                } catch (error) {
                    await fs.writeFile(filePath, JSON.stringify([]));
                }
            }
            
            this.initialized = true;
            logger.info('Simple file-based database initialized');
            return true;
        } catch (error) {
            logger.error('Failed to initialize simple database:', error);
            return false;
        }
    }

    async disconnect() {
        this.initialized = false;
        logger.info('Simple database disconnected');
    }

    async readCollection(collectionName) {
        try {
            const filePath = path.join(this.dataDir, this.collections[collectionName]);
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            logger.warn(`Failed to read collection ${collectionName}:`, error.message);
            return [];
        }
    }

    async writeCollection(collectionName, data) {
        try {
            const filePath = path.join(this.dataDir, this.collections[collectionName]);
            await fs.writeFile(filePath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            logger.error(`Failed to write collection ${collectionName}:`, error);
            return false;
        }
    }

    async saveBotPost(postData) {
        try {
            const posts = await this.readCollection('bot_posts');
            const post = {
                tweet_id: postData.tweet_id,
                content: postData.content,
                content_type: postData.content_type,
                hashtags: postData.hashtags || [],
                mentions: postData.mentions || [],
                posted_at: new Date(),
                metrics: {
                    likes: 0,
                    retweets: 0,
                    replies: 0,
                    impressions: 0
                }
            };
            
            posts.push(post);
            await this.writeCollection('bot_posts', posts);
            logger.botActivity('post_saved', { tweet_id: postData.tweet_id, type: postData.content_type });
            return true;
        } catch (error) {
            logger.error('Failed to save bot post:', error);
            return false;
        }
    }

    async updatePostMetrics(tweetId, metrics) {
        try {
            const posts = await this.readCollection('bot_posts');
            const postIndex = posts.findIndex(p => p.tweet_id === tweetId);
            
            if (postIndex !== -1) {
                posts[postIndex].metrics = { ...posts[postIndex].metrics, ...metrics };
                posts[postIndex].last_updated = new Date();
                await this.writeCollection('bot_posts', posts);
                return true;
            }
            
            return false;
        } catch (error) {
            logger.error('Failed to update post metrics:', error);
            return false;
        }
    }

    async saveEngagementTarget(targetData) {
        try {
            const targets = await this.readCollection('engagement_targets');
            const target = {
                username: targetData.username,
                user_id: targetData.user_id,
                relevance_score: targetData.relevance_score || 0,
                engagement_count: targetData.engagement_count || 0,
                last_engaged: targetData.last_engaged || null,
                added_at: new Date(),
                source: targetData.source || 'unknown'
            };
            
            // Check if target already exists
            const existingIndex = targets.findIndex(t => t.username === targetData.username);
            if (existingIndex !== -1) {
                targets[existingIndex] = { ...targets[existingIndex], ...target };
            } else {
                targets.push(target);
            }
            
            await this.writeCollection('engagement_targets', targets);
            return true;
        } catch (error) {
            logger.error('Failed to save engagement target:', error);
            return false;
        }
    }

    async saveDailyMetrics(date, metrics) {
        try {
            const dailyMetrics = await this.readCollection('daily_metrics');
            const dateStr = date.toISOString().split('T')[0];
            
            const existingIndex = dailyMetrics.findIndex(m => m.date === dateStr);
            const metricData = {
                date: dateStr,
                ...metrics,
                updated_at: new Date()
            };
            
            if (existingIndex !== -1) {
                dailyMetrics[existingIndex] = metricData;
            } else {
                dailyMetrics.push(metricData);
            }
            
            await this.writeCollection('daily_metrics', dailyMetrics);
            return true;
        } catch (error) {
            logger.error('Failed to save daily metrics:', error);
            return false;
        }
    }

    async logRateLimit(actionType, count = 1) {
        try {
            const rateLimits = await this.readCollection('rate_limits');
            const now = new Date();
            const hourKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}-${now.getHours()}`;
            
            const existing = rateLimits.find(r => r.action_type === actionType && r.hour_key === hourKey);
            
            if (existing) {
                existing.count += count;
                existing.updated_at = now;
            } else {
                rateLimits.push({
                    action_type: actionType,
                    hour_key: hourKey,
                    count: count,
                    created_at: now,
                    updated_at: now
                });
            }
            
            await this.writeCollection('rate_limits', rateLimits);
            return true;
        } catch (error) {
            logger.error('Failed to log rate limit:', error);
            return false;
        }
    }

    async checkRateLimit(actionType, timeframe = 'hour') {
        try {
            const rateLimits = await this.readCollection('rate_limits');
            const now = new Date();
            
            let cutoff;
            if (timeframe === 'hour') {
                cutoff = new Date(now.getTime() - 60 * 60 * 1000);
            } else if (timeframe === 'day') {
                cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            }
            
            const recentLimits = rateLimits.filter(r => 
                r.action_type === actionType && 
                new Date(r.updated_at) > cutoff
            );
            
            const totalCount = recentLimits.reduce((sum, r) => sum + r.count, 0);
            return totalCount;
        } catch (error) {
            logger.error('Failed to check rate limit:', error);
            return 0;
        }
    }

    calculateEngagementRate(metrics) {
        const totalEngagements = (metrics.likes || 0) + (metrics.replies || 0) + (metrics.retweets || 0);
        const impressions = metrics.impressions || 1;
        return (totalEngagements / impressions) * 100;
    }

    async getDashboardAnalytics() {
        try {
            const posts = await this.readCollection('bot_posts');
            const targets = await this.readCollection('engagement_targets');
            const dailyMetrics = await this.readCollection('daily_metrics');
            
            const totalPosts = posts.length;
            const totalEngagements = posts.reduce((sum, p) => 
                sum + (p.metrics.likes || 0) + (p.metrics.replies || 0) + (p.metrics.retweets || 0), 0
            );
            const totalImpressions = posts.reduce((sum, p) => sum + (p.metrics.impressions || 0), 0);
            
            return {
                total_posts: totalPosts,
                total_engagements: totalEngagements,
                total_impressions: totalImpressions,
                engagement_rate: totalImpressions > 0 ? (totalEngagements / totalImpressions) * 100 : 0,
                engagement_targets: targets.length,
                recent_posts: posts.slice(-10).reverse()
            };
        } catch (error) {
            logger.error('Failed to get dashboard analytics:', error);
            return {
                total_posts: 0,
                total_engagements: 0,
                total_impressions: 0,
                engagement_rate: 0,
                engagement_targets: 0,
                recent_posts: []
            };
        }
    }

    async healthCheck() {
        try {
            if (!this.initialized) {
                await this.connect();
            }
            
            // Test read/write
            await this.readCollection('bot_posts');
            return {
                status: 'healthy',
                type: 'file_based',
                data_directory: this.dataDir,
                collections: Object.keys(this.collections).length
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                type: 'file_based'
            };
        }
    }
}

module.exports = new SimpleDatabase(); 
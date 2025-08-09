const config = require('./config');
const logger = require('./logger');

class SimpleAnalytics {
    constructor(twitterBot, database) {
        this.twitterBot = twitterBot;
        this.database = database;
        this.startTime = new Date();
    }

    async getDashboardData() {
        try {
            const [
                overview,
                recentPosts,
                engagement,
                growth,
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

            logger.analytics('DASHBOARD_DATA_REQUEST', 'completed');

            return {
                overview: overview.status === 'fulfilled' ? overview.value : {},
                recent_posts: recentPosts.status === 'fulfilled' ? recentPosts.value : [],
                engagement: engagement.status === 'fulfilled' ? engagement.value : {
                    daily_actions: { likes_given: 0, replies_sent: 0, total_interactions: 0 },
                    targets: {},
                    trends: [],
                    efficiency: { engagement_to_follower_ratio: "0.00", response_rate: 0 }
                },
                growth: growth.status === 'fulfilled' ? growth.value : {},
                content_performance: contentPerformance.status === 'fulfilled' ? contentPerformance.value : {},
                hashtag_analysis: hashtagAnalysis.status === 'fulfilled' ? hashtagAnalysis.value : [],
                generated_at: new Date(),
                cache_info: {
                    last_metrics_update: null,
                    cache_entries: 0
                }
            };
        } catch (error) {
            logger.error('Failed to get dashboard data:', error);
            return this.getFallbackDashboardData();
        }
    }

    async getOverviewMetrics() {
        try {
            const analytics = await this.database.getDashboardAnalytics();
            
            return {
                total_posts: analytics.total_posts || 0,
                total_engagements: analytics.total_engagements || 0,
                total_impressions: analytics.total_impressions || 0,
                engagement_rate: analytics.engagement_rate || 0,
                engagement_targets: analytics.engagement_targets || 0,
                followers_count: 0, // Will be updated by Twitter API
                following_count: 0,
                tweets_count: 0
            };
        } catch (error) {
            logger.warn('Failed to get overview metrics, using defaults:', error.message);
            return {
                total_posts: 0,
                total_engagements: 0,
                total_impressions: 0,
                engagement_rate: 0,
                engagement_targets: 0,
                followers_count: 0,
                following_count: 0,
                tweets_count: 0
            };
        }
    }

    async getRecentPostsAnalytics() {
        try {
            const analytics = await this.database.getDashboardAnalytics();
            return analytics.recent_posts || [];
        } catch (error) {
            logger.warn('Failed to get recent posts analytics:', error.message);
            return [];
        }
    }

    async getEngagementAnalytics() {
        try {
            return {
                daily_actions: {
                    likes_given: 0,
                    replies_sent: 0,
                    total_interactions: 0
                },
                targets: {},
                trends: [],
                efficiency: {
                    engagement_to_follower_ratio: "0.00",
                    response_rate: 0
                }
            };
        } catch (error) {
            logger.warn('Failed to get engagement analytics:', error.message);
            return {
                daily_actions: { likes_given: 0, replies_sent: 0, total_interactions: 0 },
                targets: {},
                trends: [],
                efficiency: { engagement_to_follower_ratio: "0.00", response_rate: 0 }
            };
        }
    }

    async getGrowthMetrics() {
        try {
            return {
                followers_growth: 0,
                engagement_growth: 0,
                weekly_progress: 0,
                daily_growth_rate: 0,
                weekly_growth_rate: 0,
                monthly_projection: 0
            };
        } catch (error) {
            logger.warn('Failed to get growth metrics:', error.message);
            return {
                followers_growth: 0,
                engagement_growth: 0,
                weekly_progress: 0
            };
        }
    }

    async getContentPerformanceAnalytics() {
        try {
            return {
                avg_engagement_rate: 0,
                best_performing_type: 'daily_stats',
                content_mix: {
                    daily_stats: 0,
                    educational_tip: 0,
                    engagement_question: 0,
                    success_story: 0
                },
                performance_trends: []
            };
        } catch (error) {
            logger.warn('Failed to get content performance analytics:', error.message);
            return {
                avg_engagement_rate: 0,
                best_performing_type: 'daily_stats',
                content_mix: {},
                performance_trends: []
            };
        }
    }

    async getHashtagAnalytics() {
        try {
            return [];
        } catch (error) {
            logger.warn('Failed to get hashtag analytics:', error.message);
            return [];
        }
    }

    getFallbackDashboardData() {
        return {
            overview: {
                total_posts: 0,
                total_engagements: 0,
                total_impressions: 0,
                engagement_rate: 0,
                engagement_targets: 0,
                followers_count: 0,
                following_count: 0,
                tweets_count: 0
            },
            recent_posts: [],
            engagement: {
                daily_actions: {
                    likes_given: 0,
                    replies_sent: 0,
                    total_interactions: 0
                },
                targets: {},
                trends: [],
                efficiency: {
                    engagement_to_follower_ratio: "0.00",
                    response_rate: 0
                }
            },
            growth: {
                followers_growth: 0,
                engagement_growth: 0,
                weekly_progress: 0
            },
            content_performance: {
                avg_engagement_rate: 0,
                best_performing_type: 'daily_stats',
                content_mix: {},
                performance_trends: []
            },
            hashtag_analysis: [],
            generated_at: new Date(),
            cache_info: {
                last_metrics_update: null,
                cache_entries: 0
            }
        };
    }

    // Helper methods for specific analytics
    async updateDailyMetrics() {
        try {
            const today = new Date();
            const metrics = {
                date: today,
                posts_count: 0,
                engagements_count: 0,
                new_followers: 0,
                engagement_rate: 0
            };

            await this.database.saveDailyMetrics(today, metrics);
            logger.info('Daily metrics updated');
        } catch (error) {
            logger.error('Failed to update daily metrics:', error);
        }
    }

    async trackContentPerformance(contentData) {
        try {
            // This would track individual content performance
            // For now, just log it
            logger.info('Content performance tracked:', contentData);
        } catch (error) {
            logger.error('Failed to track content performance:', error);
        }
    }

    getBotUptimeHours() {
        const uptimeMs = Date.now() - this.startTime.getTime();
        return Math.floor(uptimeMs / (1000 * 60 * 60));
    }

    async getSystemHealth() {
        try {
            const dbHealth = await this.database.healthCheck();
            return {
                database: dbHealth.status === 'healthy',
                uptime_hours: this.getBotUptimeHours(),
                last_check: new Date()
            };
        } catch (error) {
            return {
                database: false,
                uptime_hours: this.getBotUptimeHours(),
                last_check: new Date()
            };
        }
    }

    clearPerformanceCache() {
        // Placeholder for cache clearing
        logger.info('Performance cache cleared');
    }

    getCacheStats() {
        return {
            entries: 0,
            size: 0,
            hit_rate: 0
        };
    }
}

module.exports = SimpleAnalytics; 
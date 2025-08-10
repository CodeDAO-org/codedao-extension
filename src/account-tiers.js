// Two-Tier Account Management System
const accountTiers = {
  // Group 1: Managed Service Accounts (Basic Plan)
  managed_accounts: {
    'DEMO_MANAGED': {
      username: 'DemoManaged',
      tier: 'managed',
      access_level: 'view_only',
      
      // Client provides only these basics
      credentials: {
        api_key: 'demo_managed_api_key',
        api_secret: 'demo_managed_api_secret', 
        access_token: 'demo_managed_access_token',
        access_token_secret: 'demo_managed_access_token_secret'
      },
      
      // CodeDAO manages all strategy
      managed_by: 'codedao',
      strategy: {
        type: 'managed_service',
        posting_frequency: 'daily',
        content_themes: ['startup_tips', 'productivity', 'motivation'],
        engagement_level: 'basic',
        
        // Client can only request changes to these
        preferences: {
          posting_times: ['09:00', '15:00'],
          avoid_topics: ['politics', 'controversial'],
          brand_voice: 'professional',
          hashtag_preferences: ['#startup', '#productivity', '#business']
        }
      },
      
      // Limited dashboard features
      dashboard_access: {
        can_view: ['analytics', 'scheduled_posts', 'performance'],
        can_edit: ['preferences', 'posting_times'],
        can_control: [], // No direct bot control
        
        // What they see in dashboard
        widgets: [
          'posts_scheduled',
          'engagement_metrics',
          'follower_growth',
          'content_performance',
          'billing_status'
        ]
      },
      
      billing: {
        plan: 'managed_basic',
        price_per_month: 99,
        includes: [
          'Daily automated posting',
          'Basic engagement (likes, follows)',
          'Analytics dashboard',
          'Content strategy management',
          'Monthly strategy review'
        ]
      }
    },
    
    'CLIENT_STARTUP': {
      username: 'TechStartupXYZ',
      tier: 'managed',
      access_level: 'view_only',
      
      credentials: {
        // Real client would provide their actual credentials
        api_key: process.env.TWITTER_CLIENT_STARTUP_API_KEY,
        api_secret: process.env.TWITTER_CLIENT_STARTUP_API_SECRET,
        access_token: process.env.TWITTER_CLIENT_STARTUP_ACCESS_TOKEN,
        access_token_secret: process.env.TWITTER_CLIENT_STARTUP_ACCESS_TOKEN_SECRET
      },
      
      strategy: {
        type: 'managed_service',
        content_themes: ['saas_growth', 'tech_trends', 'startup_journey'],
        posting_frequency: 'twice_daily',
        
        preferences: {
          posting_times: ['08:00', '17:00'],
          brand_voice: 'innovative',
          target_audience: 'b2b_decision_makers',
          hashtag_preferences: ['#SaaS', '#TechStartup', '#Innovation']
        }
      }
    }
  },

  // Group 2: Full Bot Access Accounts (Pro Plan)
  full_access_accounts: {
    'CRG': {
      username: 'CRG',
      tier: 'full_access',
      access_level: 'admin',
      
      credentials: {
        api_key: process.env.TWITTER_CRG_API_KEY,
        api_secret: process.env.TWITTER_CRG_API_SECRET,
        access_token: process.env.TWITTER_CRG_ACCESS_TOKEN,
        access_token_secret: process.env.TWITTER_CRG_ACCESS_TOKEN_SECRET
      },
      
      // Complete control over strategy
      strategy: {
        type: 'hybrid',
        custom_rules: true,
        advanced_targeting: true,
        
        posting_schedule: {
          daily_stats: '09:00',
          educational_tips: ['10:00', '15:00'],
          engagement_questions: '13:00',
          success_stories: '16:00'
        },
        
        engagement_settings: {
          target_hashtags: ['#coding', '#web3', '#development'],
          auto_like_probability: 0.3,
          auto_reply_probability: 0.2,
          custom_engagement_rules: [
            'Reply to mentions within 2 hours',
            'Like tweets from target developers',
            'Follow accounts with 1k+ followers in tech'
          ]
        }
      },
      
      // Full dashboard control
      dashboard_access: {
        can_view: ['everything'],
        can_edit: ['everything'],
        can_control: ['bot_actions', 'strategy', 'scheduling', 'engagement'],
        
        widgets: [
          'real_time_activity',
          'advanced_analytics', 
          'engagement_controls',
          'content_scheduler',
          'strategy_optimizer',
          'api_rate_limits',
          'custom_automations'
        ]
      },
      
      billing: {
        plan: 'full_access_pro',
        price_per_month: 299,
        includes: [
          'Complete bot control',
          'Custom strategy configuration',
          'Advanced analytics',
          'Real-time engagement',
          'API rate optimization',
          'Custom automation rules',
          'Priority support'
        ]
      }
    },

    'DEMO_FULLACCESS': {
      username: 'DemoFullAccess',
      tier: 'full_access',
      access_level: 'admin',
      
      credentials: {
        api_key: 'demo_full_api_key',
        api_secret: 'demo_full_api_secret',
        access_token: 'demo_full_access_token', 
        access_token_secret: 'demo_full_access_token_secret'
      },
      
      strategy: {
        type: 'aggressive_growth',
        posting_frequency: 'hourly_during_peak',
        
        advanced_targeting: {
          competitor_monitoring: ['@competitor1', '@competitor2'],
          keyword_tracking: ['AI', 'machine learning', 'automation'],
          sentiment_analysis: true,
          auto_dm_sequences: true
        },
        
        custom_automations: [
          'Auto-reply to mentions with CodeDAO link',
          'DM new followers with welcome message',
          'Retweet high-performing industry content',
          'Auto-follow back verified accounts'
        ]
      }
    }
  }
};

// Access control functions
function getAccountAccess(username) {
  // Check if managed account
  for (const account of Object.values(accountTiers.managed_accounts)) {
    if (account.username === username) {
      return {
        tier: 'managed',
        access_level: account.access_level,
        permissions: account.dashboard_access
      };
    }
  }
  
  // Check if full access account  
  for (const account of Object.values(accountTiers.full_access_accounts)) {
    if (account.username === username) {
      return {
        tier: 'full_access',
        access_level: account.access_level, 
        permissions: account.dashboard_access
      };
    }
  }
  
  return null;
}

function canPerformAction(username, action) {
  const access = getAccountAccess(username);
  if (!access) return false;
  
  if (access.tier === 'managed') {
    // Managed accounts have limited actions
    const allowedActions = ['view_analytics', 'update_preferences', 'view_schedule'];
    return allowedActions.includes(action);
  }
  
  if (access.tier === 'full_access') {
    // Full access accounts can do everything
    return true;
  }
  
  return false;
}

module.exports = {
  accountTiers,
  getAccountAccess,
  canPerformAction
}; 
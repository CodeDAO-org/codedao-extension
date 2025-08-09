require('dotenv').config();

const config = {
  // Twitter API Configuration
  twitter: {
    apiKey: process.env.TWITTER_API_KEY,
    apiSecret: process.env.TWITTER_API_SECRET,
    accessToken: process.env.TWITTER_ACCESS_TOKEN,
    accessTokenSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    bearerToken: process.env.TWITTER_BEARER_TOKEN,
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY,
    model: 'gpt-3.5-turbo',
    maxTokens: 280, // Twitter character limit consideration
  },

  // Database Configuration
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/codedao_twitter_bot',
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    },
  },

  // CodeDAO Integration
  codedao: {
    dashboardUrl: process.env.CODEDAO_DASHBOARD_URL || 'https://codedao-org.github.io/dashboard.html',
    apiUrl: process.env.CODEDAO_API_URL || 'https://api.codedao.org',
    githubUrl: process.env.CODEDAO_GITHUB_URL || 'https://github.com/CodeDAO-org/codedao-extension',
  },

  // Bot Configuration
  bot: {
    username: process.env.BOT_USERNAME || 'CodeDAOBot',
    environment: process.env.BOT_ENVIRONMENT || 'development',
    timezone: process.env.TIMEZONE || 'UTC',
    targetUsername: process.env.TWITTER_TARGET_USERNAME || 'CRG',
    engagementStrategy: process.env.ENGAGEMENT_STRATEGY || 'hybrid',
  },

  // OpenAI Configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || null,
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    enabled: process.env.LLM_ENABLED === 'true',
  },

  // Hybrid Strategy Configuration
  strategy: {
    manualContentPercentage: parseInt(process.env.MANUAL_CONTENT_PERCENTAGE) || 40,
    aiAssistedPercentage: parseInt(process.env.AI_ASSISTED_PERCENTAGE) || 35,
    scheduledContentPercentage: parseInt(process.env.SCHEDULED_CONTENT_PERCENTAGE) || 25,
  },

  // Safety & Rate Limiting
  limits: {
    maxPostsPerDay: parseInt(process.env.MAX_POSTS_PER_DAY) || 25,
    maxFollowsPerHour: parseInt(process.env.MAX_FOLLOWS_PER_HOUR) || 10,
    maxLikesPerHour: parseInt(process.env.MAX_LIKES_PER_HOUR) || 50,
    maxRepliesPerHour: parseInt(process.env.MAX_REPLIES_PER_HOUR) || 15,
    minDelayBetweenActions: parseInt(process.env.MIN_DELAY_BETWEEN_ACTIONS) || 30000,
  },

  // Content Strategy
  content: {
    generationEnabled: process.env.CONTENT_GENERATION_ENABLED === 'true',
    autoEngagementEnabled: process.env.AUTO_ENGAGEMENT_ENABLED === 'true',
    hashtagMonitoringEnabled: process.env.HASHTAG_MONITORING_ENABLED === 'true',
    influencerEngagementEnabled: process.env.INFLUENCER_ENGAGEMENT_ENABLED === 'true',
  },

  // Scheduling
  schedule: {
    enabled: process.env.POSTING_SCHEDULE_ENABLED === 'true',
    dailyStatsTime: process.env.DAILY_STATS_TIME || '09:00',
    educationalContentTimes: (process.env.EDUCATIONAL_CONTENT_TIMES || '10:00,15:00').split(','),
    engagementPostTime: process.env.ENGAGEMENT_POST_TIME || '13:00',
  },

  // Analytics & Monitoring
  analytics: {
    enabled: process.env.ANALYTICS_ENABLED === 'true',
    logLevel: process.env.LOG_LEVEL || 'info',
    webhookUrl: process.env.WEBHOOK_URL,
  },

  // Target Hashtags and Keywords
  targeting: {
    hashtags: [
      '#BuildInPublic', '#100DaysOfCode', '#WebDev', '#JavaScript',
      '#Python', '#React', '#Web3', '#Blockchain', '#OpenSource',
      '#DevLife', '#Programming', '#TechTwitter', '#CodeNewbie',
      '#EarnToCod', '#CodeDAO', '#DeveloperTools', '#RemoteWork'
    ],
    keywords: [
      'code quality', 'developer tools', 'earning money coding',
      'web3 development', 'blockchain developer', 'coding rewards',
      'developer productivity', 'code review', 'programming tips'
    ],
    influencerKeywords: [
      'build in public', 'developer experience', 'coding bootcamp',
      'tech career', 'remote developer', 'freelance developer'
    ]
  },

  // Content Templates
  templates: {
    dailyStats: {
      format: `📊 CodeDAO Daily Stats:
💰 {totalTokensEarned} CODE tokens earned today
👨‍💻 {activeDevelopers} developers actively coding
🏆 Top quality score: {topScore}/10
💎 Longest streak: {streakDays} days

Start earning from your code: {dashboardUrl} 🚀
#CodeDAO #Web3Dev #EarnToCod`,
      hashtags: ['#CodeDAO', '#Web3Dev', '#EarnToCod']
    },
    successStory: {
      format: `🎉 Developer Milestone Alert!
🥇 Another developer just earned their first 100 CODE tokens!
📈 Quality score improved from {oldScore} to {newScore}
⭐ {streakDays}-day coding streak maintained

Your code has value. Start earning: {dashboardUrl}
#BuildInPublic #DeveloperSuccess #CodeDAO`,
      hashtags: ['#BuildInPublic', '#DeveloperSuccess', '#CodeDAO']
    },
    educationalTip: {
      format: `💡 Code Quality Tip #{tipNumber}:
{codeQualityTip}

Our AI analysis shows this improves quality scores by {percentage}%!

📱 Install CodeDAO extension: {githubUrl}
#CodingTips #CodeQuality #DeveloperTools`,
      hashtags: ['#CodingTips', '#CodeQuality', '#DeveloperTools']
    },
    engagement: {
      format: `🤔 Question for developers:
{thoughtProvokingQuestion}

Drop your thoughts below! 👇
Best answer gets featured in our next quality report 📊
#DeveloperCommunity #CodeDAO #TechTwitter`,
      hashtags: ['#DeveloperCommunity', '#CodeDAO', '#TechTwitter']
    }
  }
};

// Validation
const requiredEnvVars = [
  'TWITTER_API_KEY',
  'TWITTER_API_SECRET', 
  'TWITTER_ACCESS_TOKEN',
  'TWITTER_ACCESS_TOKEN_SECRET'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Missing required environment variables:', missingVars.join(', '));
  console.error('Please check your .env file and ensure all Twitter API credentials are set.');
  process.exit(1);
}

module.exports = config; 
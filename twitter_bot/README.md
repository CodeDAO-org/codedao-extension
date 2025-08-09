# 🤖 CodeDAO Twitter Bot

An intelligent Twitter bot that promotes CodeDAO, engages with the developer community, and drives user acquisition through automated content posting and community engagement.

## 🎯 **Features**

### **🚀 Core Functionality**
- **Automated Content Generation**: Daily stats, educational tips, success stories, and engagement posts
- **Community Engagement**: Hashtag monitoring, developer outreach, and intelligent responses
- **Real-time Analytics**: Performance tracking, engagement metrics, and growth analysis
- **Safety & Compliance**: Rate limiting, content validation, and Twitter policy adherence
- **Dashboard Integration**: Live data from CodeDAO dashboard and GitHub repository

### **📊 Content Strategy**
- **20% Daily Stats**: Real-time CodeDAO metrics and achievements
- **25% Educational Tips**: Code quality insights and best practices
- **20% Engagement Questions**: Community discussions and developer interactions
- **15% Success Stories**: Developer milestones and achievements
- **10% Trending Topics**: Industry news with CodeDAO perspective
- **10% Mixed Content**: Motivational posts, milestones, and announcements

### **🎯 Target Audience**
- Web3 developers and blockchain enthusiasts
- Code quality advocates and clean code practitioners
- Remote developers and freelancers
- Coding bootcamp graduates and junior developers
- Open source contributors and maintainers

## 🛠️ **Installation & Setup**

### **Prerequisites**
- Node.js 18+ 
- MongoDB (local or MongoDB Atlas)
- Twitter Developer Account with API v2 access
- OpenAI API key (optional, for enhanced content generation)

### **Quick Start**

```bash
# Clone the repository
git clone https://github.com/CodeDAO-org/codedao-extension
cd codedao-extension/twitter_bot

# Install dependencies
npm install

# Copy environment template
cp env.example .env

# Configure your environment variables
# Edit .env with your API credentials

# Start the bot
npm start
```

### **Environment Configuration**

Create a `.env` file with the following variables:

```bash
# Twitter API Credentials (Required)
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
TWITTER_BEARER_TOKEN=your_twitter_bearer_token

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/codedao_twitter_bot

# CodeDAO Integration
CODEDAO_DASHBOARD_URL=https://codedao-org.github.io/dashboard.html
CODEDAO_GITHUB_URL=https://github.com/CodeDAO-org/codedao-extension

# Bot Configuration
BOT_USERNAME=CodeDAOBot
BOT_ENVIRONMENT=development

# Optional: OpenAI for enhanced content
OPENAI_API_KEY=your_openai_api_key
```

## 📚 **Usage**

### **Starting the Bot**

```bash
# Start in production mode
npm start

# Start in development mode
npm run dev

# Check bot health
node src/index.js health

# Manual post generation
node src/index.js post daily_stats

# Manual engagement cycle
node src/index.js engage
```

### **Available Commands**

```bash
# Content generation
node src/index.js post daily_stats          # Post daily statistics
node src/index.js post educational_tip      # Share coding tip
node src/index.js post engagement_question  # Ask community question
node src/index.js post success_story        # Share developer success
node src/index.js post milestone_celebration # Celebrate milestones

# Operations
node src/index.js engage                     # Run engagement cycle
node src/index.js health                     # Check system health
node src/index.js start                      # Start bot server (default)
```

### **API Endpoints**

When running, the bot exposes these endpoints:

```bash
# Health check
GET http://localhost:3000/health

# Analytics dashboard
GET http://localhost:3000/analytics

# Bot configuration
GET http://localhost:3000/config

# Manual posting (for testing)
POST http://localhost:3000/post
{
  "content": "Your tweet content here",
  "type": "manual"
}

# Trigger engagement cycle
POST http://localhost:3000/engage
```

## 🏗️ **Architecture**

### **Core Components**

```
CodeDAO Twitter Bot
├── TwitterBot.js           # Twitter API integration & core operations
├── ContentGenerator.js     # Automated content creation engine
├── EngagementEngine.js     # Community interaction & hashtag monitoring
├── DashboardIntegration.js # CodeDAO data fetching & processing
├── SafetyManager.js        # Rate limiting & content validation
├── Analytics.js            # Performance tracking & reporting
├── Database.js             # MongoDB operations & data persistence
└── index.js               # Main application & scheduler
```

### **Data Flow**

```mermaid
graph TD
    A[Scheduler] --> B[Content Generator]
    A --> C[Engagement Engine]
    B --> D[Safety Manager]
    D --> E[Twitter Bot]
    C --> F[Target Discovery]
    F --> G[Engagement Queue]
    G --> E
    E --> H[Analytics]
    H --> I[Database]
    J[Dashboard Integration] --> B
    J --> H
```

### **Database Schema**

```javascript
// Bot Posts Collection
{
  tweet_id: "1234567890",
  content: "Full tweet content",
  post_type: "daily_stats",
  hashtags: ["#CodeDAO", "#WebDev"],
  likes_count: 42,
  retweets_count: 8,
  replies_count: 3,
  engagement_rate: 5.2,
  performance_score: 65,
  created_at: ISODate("2024-01-01T10:00:00Z")
}

// Engagement Targets Collection
{
  username: "developer_username",
  display_name: "Developer Name",
  follower_count: 1500,
  engagement_score: 75,
  last_engaged: ISODate("2024-01-01T15:30:00Z"),
  interaction_history: [...]
}

// Daily Metrics Collection
{
  date: ISODate("2024-01-01T00:00:00Z"),
  followers_count: 1250,
  posts_made: 8,
  total_engagement: 45,
  engagement_rate: 4.8,
  top_performing_post: "1234567890"
}
```

## 🚀 **Deployment**

### **Production Deployment**

#### **1. Environment Setup**
```bash
# Set production environment
export BOT_ENVIRONMENT=production
export NODE_ENV=production

# Use production database
export MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/codedao_bot

# Enable all features
export CONTENT_GENERATION_ENABLED=true
export AUTO_ENGAGEMENT_ENABLED=true
export POSTING_SCHEDULE_ENABLED=true
```

#### **2. Process Management**
```bash
# Using PM2 for production
npm install -g pm2

# Start bot with PM2
pm2 start src/index.js --name "codedao-twitter-bot"

# Monitor logs
pm2 logs codedao-twitter-bot

# Auto-restart on system reboot
pm2 startup
pm2 save
```

#### **3. Docker Deployment**
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY src/ ./src/
COPY env.example ./

EXPOSE 3000

CMD ["node", "src/index.js"]
```

```bash
# Build and run Docker container
docker build -t codedao-twitter-bot .
docker run -d --name twitter-bot -p 3000:3000 --env-file .env codedao-twitter-bot
```

#### **4. Cloud Deployment (AWS)**
```bash
# Using AWS Lambda with Serverless Framework
npm install -g serverless

# Deploy to AWS
serverless deploy --stage production

# Monitor CloudWatch logs
serverless logs -f bot --tail
```

### **Monitoring & Maintenance**

#### **Health Monitoring**
```bash
# Automated health checks
curl -f http://localhost:3000/health || exit 1

# Performance monitoring
curl http://localhost:3000/analytics
```

#### **Log Analysis**
```bash
# View recent logs
tail -f logs/combined.log

# Filter error logs
grep "ERROR" logs/combined.log

# Analyze bot activity
grep "BOT ACTION" logs/bot-activity.log
```

## 📊 **Analytics & Performance**

### **Key Metrics Tracked**
- **Engagement Rate**: Likes + Retweets + Replies / Impressions
- **Growth Rate**: Follower growth over time periods
- **Content Performance**: Success rate by content type
- **Hashtag Effectiveness**: Reach and engagement by hashtag
- **Optimal Timing**: Best performing posting times
- **Community Response**: Reply rates and sentiment

### **Dashboard Analytics**
Access comprehensive analytics at `http://localhost:3000/analytics`:

```json
{
  "overview": {
    "followers_count": 1250,
    "total_posts": 156,
    "average_engagement_rate": 4.8,
    "weekly_engagement_actions": 45
  },
  "content_performance": {
    "top_posts": [...],
    "content_types": [...],
    "optimal_times": [...],
    "recommendations": [...]
  },
  "growth": {
    "follower_growth": { "daily": 5, "weekly": 23, "monthly": 87 },
    "engagement_growth": { "daily": 12, "weekly": 78 }
  }
}
```

## 🛡️ **Safety & Compliance**

### **Rate Limiting**
```javascript
const SAFETY_LIMITS = {
  postsPerDay: 25,        // Twitter recommendation
  followsPerHour: 10,     // Conservative limit
  likesPerHour: 50,       // Avoid spam detection
  repliesPerHour: 15,     // Quality over quantity
  minDelayBetweenActions: 30000 // 30 seconds
};
```

### **Content Validation**
- **Spam Detection**: Pattern recognition for spam indicators
- **Policy Compliance**: Automated Twitter policy checking
- **Quality Scoring**: Content value assessment
- **Relevance Check**: CodeDAO context validation

### **Human-like Behavior**
- **Variable Delays**: Random intervals between actions
- **Natural Language**: Varied response templates
- **Engagement Patterns**: Realistic interaction timing
- **Error Handling**: Graceful failure recovery

## 🧪 **Development**

### **Project Structure**
```
twitter_bot/
├── src/
│   ├── index.js                 # Main application entry
│   ├── config.js               # Configuration management
│   ├── TwitterBot.js           # Twitter API wrapper
│   ├── ContentGenerator.js     # Content creation engine
│   ├── EngagementEngine.js     # Community interaction
│   ├── DashboardIntegration.js # CodeDAO data integration
│   ├── SafetyManager.js        # Safety & compliance
│   ├── Analytics.js            # Performance tracking
│   ├── database.js             # Database operations
│   └── logger.js               # Logging system
├── logs/                       # Application logs
├── package.json               # Dependencies & scripts
├── env.example               # Environment template
└── README.md                 # This file
```

### **Adding New Content Types**

1. **Define Content Type in ContentGenerator.js**:
```javascript
async generateNewContentType(options = {}) {
  // Your content generation logic
  return generatedContent;
}
```

2. **Add to Content Generation Switch**:
```javascript
case 'new_content_type':
  content = await this.generateNewContentType(options);
  break;
```

3. **Update Content Mix Strategy**:
```javascript
getOptimalContentMix() {
  return {
    // existing types...
    new_content_type: 0.05  // 5% of content
  };
}
```

### **Custom Engagement Rules**

```javascript
// Add to EngagementEngine.js
filterEngagementCandidates(tweets, users) {
  return tweets.filter(tweet => {
    // Your custom filtering logic
    return customRelevanceCheck(tweet);
  });
}
```

### **Testing**

```bash
# Run health check
npm run test:health

# Test content generation
npm run test:content

# Test engagement cycle
npm run test:engagement

# Full integration test
npm run test:integration
```

## 🔧 **Configuration**

### **Content Strategy Customization**
```javascript
// Modify config.js
templates: {
  custom_template: {
    format: `Your custom template with {variables}`,
    hashtags: ['#YourHashtag']
  }
}
```

### **Targeting Configuration**
```javascript
targeting: {
  hashtags: [
    '#YourTargetHashtag',
    '#AnotherHashtag'
  ],
  keywords: [
    'your target keyword',
    'another keyword'
  ]
}
```

### **Scheduling Customization**
```javascript
// Modify scheduled tasks in index.js
const customJob = cron.schedule('0 12 * * *', async () => {
  await this.executeScheduledPost('custom_content_type');
});
```

## 🚨 **Troubleshooting**

### **Common Issues**

#### **Twitter API Errors**
```bash
# Check API credentials
node -e "console.log(require('./src/config').twitter)"

# Verify API access
curl -H "Authorization: Bearer $TWITTER_BEARER_TOKEN" \
  "https://api.twitter.com/2/users/me"
```

#### **Database Connection Issues**
```bash
# Test MongoDB connection
node -e "require('./src/database').connect().then(console.log)"

# Check MongoDB status
systemctl status mongod
```

#### **Rate Limiting**
```bash
# Check current rate limit status
curl http://localhost:3000/health | jq '.components.twitter_bot.rate_limits'

# View rate limit logs
grep "RATE LIMIT" logs/combined.log
```

#### **Content Generation Failures**
```bash
# Test content generation
node src/index.js post daily_stats

# Check dashboard integration
curl https://codedao-org.github.io/dashboard.html
```

### **Log Analysis**

```bash
# Monitor real-time activity
tail -f logs/bot-activity.log

# Check for errors
grep -E "(ERROR|Failed)" logs/combined.log

# Analyze engagement success rate
grep "ENGAGEMENT.*success" logs/combined.log | wc -l
```

## 📞 **Support & Contributing**

### **Getting Help**
- 📧 **Email**: support@codedao.org
- 💬 **Discord**: [CodeDAO Community](https://discord.gg/codedao)
- 📖 **Documentation**: [docs.codedao.org](https://docs.codedao.org)
- 🐛 **Issues**: [GitHub Issues](https://github.com/CodeDAO-org/codedao-extension/issues)

### **Contributing**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### **Development Guidelines**
- Follow existing code style and patterns
- Add comprehensive logging for new features
- Include error handling and safety checks
- Update documentation for significant changes
- Test thoroughly before submitting PRs

## 📜 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 **Acknowledgments**

- **Twitter API v2** for robust social media integration
- **MongoDB** for reliable data persistence
- **OpenAI** for enhanced content generation capabilities
- **CodeDAO Community** for feedback and feature requests

---

**Built with ❤️ by the CodeDAO Team**

*Making quality code profitable, one tweet at a time.* 🚀 
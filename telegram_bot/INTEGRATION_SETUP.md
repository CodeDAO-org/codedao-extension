# 🚀 Twitter-Telegram Bot Integration Setup

Complete guide to set up the unified CodeDAO bot management system.

## 🎯 What This Integration Provides

### **Unified Command Center**
Manage both Twitter and Telegram bots from one Telegram interface:

```
/admin twitter status     → Twitter bot health & metrics
/admin twitter post <msg> → Send manual tweet
/admin twitter start      → Start Twitter automation  
/admin twitter stop       → Stop Twitter automation
/admin combined stats     → Both platforms analytics
```

### **Cross-Platform Features**
- **Real-time monitoring** of both bots
- **Unified analytics** dashboard  
- **Instant notifications** for milestones
- **Centralized control** from Telegram

## 📋 Prerequisites

### 1. Telegram Bot Token
Get from [@BotFather](https://t.me/BotFather):
```
/newbot
CodeDAO Community Bot
@CodeDAOCommunityBot
```

### 2. Twitter API Access
Get from [developer.twitter.com](https://developer.twitter.com):
- API Key & Secret
- Access Token & Secret
- Essential access tier is sufficient

### 3. GitHub Personal Access Token
Create at [github.com/settings/tokens](https://github.com/settings/tokens):
- Scope: `repo`, `workflow`

## 🛠️ Installation Steps

### Step 1: Install Dependencies
```bash
cd telegram_bot
npm install twitter-api-v2 @octokit/rest
```

### Step 2: Environment Configuration
Create `.env` file:

```env
# Telegram Bot
BOT_TOKEN=your_telegram_bot_token
ADMIN_CHAT_ID=your_telegram_user_id

# Twitter Integration  
TWITTER_API_KEY=your_twitter_api_key
TWITTER_API_SECRET=your_twitter_api_secret
TWITTER_ACCESS_TOKEN=your_twitter_access_token
TWITTER_ACCESS_TOKEN_SECRET=your_twitter_access_token_secret
TWITTER_TARGET_USERNAME=CRG
TWITTER_BOT_URL=http://localhost:3000

# GitHub
GITHUB_TOKEN=your_github_pat
GITHUB_OWNER=CodeDAO-org
GITHUB_REPO=codedao-extension

# CodeDAO Platform
CODEDAO_API_URL=https://api.codedao.org
CODEDAO_DASHBOARD_URL=https://codedao-org.github.io/codedao-extension/twitter-bot/

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:pass@localhost:5432/codedao_bot

# Smart Contract
CONTRACT_ADDRESS=0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0
RPC_URL=https://mainnet.base.org
```

### Step 3: Database Setup
```sql
-- Create users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  user_id BIGINT PRIMARY KEY,
  username VARCHAR(255),
  wallet_address VARCHAR(42),
  github_username VARCHAR(255),
  github_id BIGINT,
  join_date TIMESTAMP DEFAULT NOW(),
  wallet_connected BOOLEAN DEFAULT FALSE,
  total_earnings DECIMAL(18,8) DEFAULT 0,
  total_claimed DECIMAL(18,8) DEFAULT 0,
  referrals INTEGER DEFAULT 0,
  referred_by BIGINT,
  achievements JSONB DEFAULT '[]',
  last_activity TIMESTAMP DEFAULT NOW()
);

-- Create analytics table
CREATE TABLE IF NOT EXISTS analytics (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100),
  user_id BIGINT,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

### Step 4: Start the Bot
```bash
# Development mode
npm run dev

# Production mode  
npm start
```

## 🎮 Available Commands

### **Admin Commands**

#### Twitter Management
```
/admin twitter status        → Bot status & live metrics
/admin twitter start         → Start Twitter automation
/admin twitter stop          → Stop Twitter automation  
/admin twitter post <msg>    → Send manual tweet
/admin twitter stats         → Detailed analytics
/admin twitter followers     → Follower metrics
/admin twitter schedule      → View posting schedule
/admin twitter engage        → Trigger immediate engagement
```

#### Combined Analytics
```
/admin combined stats        → Both platforms overview
/admin stats                 → Telegram bot only
```

#### Communication
```
/admin broadcast <message>   → Send to all Telegram users
/admin github deploy         → Trigger GitHub workflow
```

### **User Commands**
Standard Telegram bot commands remain the same:
```
/start      → Welcome & onboarding
/connect    → Connect wallet
/github     → Link GitHub account  
/stats      → Personal statistics
/claim      → Claim CODE tokens
/invite     → Referral system
/help       → Command list
```

## 📊 Integration Features

### **Real-Time Monitoring**
- Live Twitter bot status
- Posting schedule tracking
- Engagement metrics
- Error monitoring & alerts

### **Cross-Platform Analytics**
- Combined user reach
- Engagement rates across platforms
- Conversion tracking (Twitter → CodeDAO)
- Community growth metrics

### **Automated Workflows**
- Tweet milestones automatically
- Notify admin of important events
- Cross-promote between platforms
- Sync community updates

## 🔧 Configuration Options

### Twitter Bot Settings
```env
# Posting Schedule (UTC times)
TWITTER_DAILY_STATS_TIME=09:00
TWITTER_EDUCATIONAL_TIME=10:00,15:00
TWITTER_COMMUNITY_TIME=13:00

# Rate Limits
TWITTER_MAX_POSTS_DAY=25
TWITTER_MAX_LIKES_HOUR=50
TWITTER_MAX_REPLIES_HOUR=15
TWITTER_MAX_FOLLOWS_HOUR=10

# Target Hashtags
TWITTER_TARGET_HASHTAGS=#coding,#javascript,#web3,#blockchain

# AI Configuration
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4o-mini
LLM_ENABLED=true
```

### Telegram Bot Settings
```env
# Feature Flags
GAMIFICATION_ENABLED=true
REFERRAL_SYSTEM_ENABLED=true
CONTRACT_MONITORING_ENABLED=true

# Logging
LOG_LEVEL=info
ANALYTICS_ENABLED=true
```

## 🎯 Success Metrics

Track these KPIs through the integrated dashboard:

### Twitter Metrics
- **Follower Growth**: +5-10 developers/day
- **Engagement Rate**: >4% average
- **Platform Visits**: Track clicks to CodeDAO
- **Developer Conversions**: Signups from Twitter

### Telegram Metrics  
- **Active Users**: Daily/weekly activity
- **Wallet Connections**: Onboarding success
- **GitHub Links**: Developer integration
- **Token Claims**: Platform utilization

### Combined Impact
- **Total Community Reach**: Twitter + Telegram
- **Cross-Platform Engagement**: Users active on both
- **CodeDAO Growth**: Platform signups & activity
- **TOKEN Distribution**: Community rewards

## 🚨 Troubleshooting

### Common Issues

#### 1. Twitter API Errors
```
❌ Twitter command failed: Unauthorized
```
**Solution**: Check Twitter API credentials in `.env`

#### 2. Dashboard Connection Failed
```
❌ Failed to fetch dashboard data
```  
**Solution**: Verify `TWITTER_BOT_URL` points to running Twitter bot

#### 3. Database Connection Issues
```
❌ Combined stats error: connection refused
```
**Solution**: Check PostgreSQL is running and `DATABASE_URL` is correct

#### 4. Rate Limiting
```
❌ Twitter rate limit exceeded
```
**Solution**: Wait for rate limit reset or reduce posting frequency

### Debug Mode
Set `LOG_LEVEL=debug` for detailed logging:
```bash
LOG_LEVEL=debug npm run dev
```

## 🔐 Security Best Practices

### Environment Variables
- Never commit `.env` files
- Use strong database passwords
- Rotate API keys regularly
- Limit admin access

### API Security
- Enable 2FA on all accounts
- Use least-privilege principles
- Monitor for unusual activity
- Regular security updates

## 📈 Scaling Considerations

### Production Deployment
- Use PM2 for process management
- Set up log rotation
- Configure monitoring/alerting
- Use load balancers if needed

### Database Optimization
- Add indexes for frequent queries
- Set up connection pooling
- Regular maintenance tasks
- Backup strategy

## 🎉 Success! 

Your unified CodeDAO bot management system is now ready! 

### Quick Test
1. Start the bot: `npm run dev`
2. Message your bot: `/admin twitter status`
3. Should see Twitter bot dashboard with metrics

### Next Steps
- Monitor both platforms from Telegram
- Use `/admin combined stats` for overview
- Set up automated workflows
- Scale community engagement! 🚀

---

**Built with ❤️ by CodeDAO Team**  
For support: [GitHub Issues](https://github.com/CodeDAO-org/codedao-extension/issues) 
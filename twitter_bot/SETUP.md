# 🚀 CodeDAO Twitter Bot - Setup Guide

## 📋 **Quick Setup with Your API Keys**

### **Step 1: Install Dependencies**
```bash
cd twitter_bot
npm install
```

### **Step 2: Create Environment File**
Copy the environment template and add your Twitter API credentials:

```bash
cp env.example .env
```

Then edit the `.env` file with your specific credentials:

```bash
# Twitter API Credentials (✅ YOUR KEYS)
TWITTER_API_KEY=JkvwT9YcEWSuK56ud6EibGTr6
TWITTER_API_SECRET=azaWRbfTUUVHU02eO9sI2kvbMtEqWgjvWI5ASKkBDVMVyDLfXn
TWITTER_ACCESS_TOKEN=1879605233493405696-3584SP9SLewXUCZOaCOBmMfS7WYNg0
TWITTER_ACCESS_TOKEN_SECRET=F1Krlkoq10358joaLW2yXiP4vGrudysB7ccIzhIp27eil

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/codedao_twitter_bot

# CodeDAO Dashboard Integration
CODEDAO_DASHBOARD_URL=https://codedao-org.github.io/dashboard.html
CODEDAO_GITHUB_URL=https://github.com/CodeDAO-org/codedao-extension

# Bot Configuration
BOT_USERNAME=CodeDAOBot
BOT_ENVIRONMENT=development

# Enable Features
CONTENT_GENERATION_ENABLED=true
AUTO_ENGAGEMENT_ENABLED=true
POSTING_SCHEDULE_ENABLED=true
```

### **Step 3: Setup Database**

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# macOS
brew install mongodb-community

# Ubuntu
sudo apt-get install -y mongodb

# Start MongoDB
mongod --dbpath ./data/db
```

**Option B: Docker (Recommended)**
```bash
# Start MongoDB with Docker
docker run -d --name codedao-mongodb -p 27017:27017 mongo:6.0

# Or use docker-compose
docker-compose up mongodb -d
```

**Option C: MongoDB Atlas (Cloud)**
1. Sign up for [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free cluster
3. Get connection string and update `MONGODB_URI` in `.env`

### **Step 4: Test the Bot**

**Health Check:**
```bash
node src/index.js health
```

**Expected Output:**
```
✅ Twitter Bot initialized successfully as @CodeDAOBot
🏥 Health Status: {
  "overall": { "status": "healthy" },
  "components": {
    "twitter_bot": { "status": "healthy" },
    "database": { "status": "healthy" }
  }
}
```

**Test Content Generation:**
```bash
node src/index.js post daily_stats
```

**Expected Output:**
```
✅ Posted daily_stats: 1879605233493405697
📝 Content: 📊 CodeDAO Daily Stats:
💰 1247 CODE tokens earned today
👨‍💻 89 developers actively coding
🏆 Top quality score: 9.2/10
💎 Longest streak: 23 days

Start earning from your code: https://codedao-org.github.io/dashboard.html 🚀
#CodeDAO #Web3Dev #EarnToCod
```

### **Step 5: Start the Bot**

**Development Mode:**
```bash
npm run dev
```

**Production Mode:**
```bash
npm start
```

**With Docker:**
```bash
docker-compose up -d
```

### **Step 6: Monitor the Bot**

**Access Endpoints:**
- **Health Check**: http://localhost:3000/health
- **Analytics Dashboard**: http://localhost:3000/analytics  
- **Bot Configuration**: http://localhost:3000/config

**View Logs:**
```bash
# Real-time logs
tail -f logs/combined.log

# Bot activity
tail -f logs/bot-activity.log

# Errors only
grep "ERROR" logs/combined.log
```

## 🎯 **Immediate Next Steps**

### **1. Verify Twitter Access**
Test your API credentials:
```bash
curl -H "Authorization: Bearer YOUR_BEARER_TOKEN" \
  "https://api.twitter.com/2/users/me"
```

### **2. Configure Bot Username**
Update your actual Twitter username in `.env`:
```bash
BOT_USERNAME=YourActualTwitterUsername
```

### **3. Test Posting**
Start with a manual test post:
```bash
# Test daily stats
node src/index.js post daily_stats

# Test educational content
node src/index.js post educational_tip

# Test engagement question
node src/index.js post engagement_question
```

### **4. Enable Scheduling**
Once testing is complete, enable automated posting:
```bash
# In .env file
POSTING_SCHEDULE_ENABLED=true
BOT_ENVIRONMENT=production
```

## 📊 **Expected Performance**

### **Daily Schedule (UTC)**
- **09:00** - Daily stats post
- **10:00** - Educational tip
- **13:00** - Engagement question  
- **15:00** - Educational tip
- **Every 4 hours** - Community engagement cycle

### **Content Mix**
- **25%** Educational tips (code quality, best practices)
- **20%** Daily stats (CodeDAO metrics)
- **20%** Engagement questions (community building)
- **15%** Success stories (developer achievements)
- **10%** Trending topics (industry news)
- **10%** Mixed content (motivation, milestones)

### **Engagement Strategy**
- Monitor **17 target hashtags** (#BuildInPublic, #100DaysOfCode, #WebDev, etc.)
- Engage with **100+ developers daily** through likes and responses
- Target **Web3 developers**, **bootcamp graduates**, and **quality advocates**
- Maintain **5%+ engagement rate** through authentic interactions

## 🚨 **Troubleshooting**

### **Common Issues**

**Twitter API Errors:**
```bash
# Check credentials
node -e "console.log(require('./src/config').twitter)"

# Test API access
curl -X GET "https://api.twitter.com/2/users/me" \
  -H "Authorization: Bearer YOUR_BEARER_TOKEN"
```

**Database Connection:**
```bash
# Test MongoDB connection
mongosh mongodb://localhost:27017/codedao_twitter_bot

# Check if MongoDB is running
ps aux | grep mongod
```

**Rate Limiting:**
```bash
# Check current rate limits
curl http://localhost:3000/health | jq '.components.twitter_bot.rate_limits'
```

## 🎉 **Ready to Launch!**

Your bot is now configured with:
- ✅ Valid Twitter API credentials
- ✅ Comprehensive content strategy
- ✅ Intelligent engagement system
- ✅ Analytics and monitoring
- ✅ Safety and compliance features

Start the bot and watch it begin building your developer community on Twitter! 🚀

---

**Need Help?**
- Check logs in `logs/` directory
- Visit health endpoint: http://localhost:3000/health  
- Review analytics: http://localhost:3000/analytics 
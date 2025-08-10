# CodeDAO Reddit Bot - Complete Documentation

## 🚀 Overview

The CodeDAO Reddit Bot is an automated system that creates engaging community threads every 4 hours to boost weekend and daily activity in the r/CodeDAO subreddit. It transforms manual posting into a professional, consistent automation system.

## 📋 Features

### ✅ **Automated Thread Creation**
- **Frequency**: Every 4 hours (6 posts per day)
- **Content**: Professional, engaging builder threads
- **Timing**: Optimized for maximum weekend engagement
- **Consistency**: Never forgets, always posts quality content

### ✅ **Multiple Actions**
- **Weekend Threads**: Main community engagement posts
- **Milestone Posts**: Celebrate community achievements  
- **Connection Testing**: Verify bot functionality

### ✅ **Smart Content Generation**
- **Dynamic titles** with current day of week
- **Comprehensive content** with resources and guidelines
- **Professional formatting** with emojis and structure
- **Community links** to dashboard and resources

## 🔧 Technical Setup

### **1. GitHub Actions Workflow**
**File**: `.github/workflows/reddit-bot.yml`
**Trigger**: Every 4 hours + manual dispatch
**Runtime**: Ubuntu Latest with Python 3.11

### **2. Required Secrets**
Add these to GitHub repository secrets:

```
REDDIT_CLIENT_ID      - Reddit app client ID
REDDIT_CLIENT_SECRET  - Reddit app secret  
REDDIT_USERNAME       - Bot account username (CodeDAOAgent)
REDDIT_PASSWORD       - Bot account password
REDDIT_USER_AGENT     - User agent string
REDDIT_SUBREDDIT      - Target subreddit (CodeDAO)
```

### **3. Dependencies**
- `praw` - Python Reddit API Wrapper
- `python-dotenv` - Environment variable management

## 📊 Usage & Monitoring

### **Automatic Operation**
- **Schedule**: Runs every 4 hours automatically
- **Content**: Creates "Builder Thread" posts with current day
- **Location**: Posts to r/CodeDAO subreddit
- **Tracking**: All activity logged in GitHub Actions

### **Manual Controls**
**GitHub Actions Interface**: 
- Go to: `https://github.com/CodeDAO-org/codedao-extension/actions`
- Click: "CodeDAO Reddit Bot" workflow
- Click: "Run workflow" for manual execution

**Available Actions**:
- `weekend_thread` - Post builder thread (default)
- `test_connection` - Verify Reddit connection
- `milestone_post` - Post milestone celebration

### **Monitoring & Analytics**

#### **Reddit Profile Tracking**
- **URL**: `https://reddit.com/u/CodeDAOAgent`
- **What to watch**: New posts every 4 hours
- **Engagement**: Upvotes, comments, views per post

#### **GitHub Actions Logs**
- **URL**: `https://github.com/CodeDAO-org/codedao-extension/actions`
- **Information**: Execution status, post URLs, timestamps
- **Success indicators**: ✅ marks and post links

#### **Performance Metrics**
Track these KPIs for community growth:
- Posts created per day (target: 6)
- Average upvotes per post
- Comments and engagement rate  
- Community growth in r/CodeDAO
- User interaction patterns

## 🎯 Post Content Structure

### **Weekend/Daily Builder Thread Format**
```
Title: 🚀 [Day] Builder Thread - What are you coding?

Content:
- Welcome message with day-specific greeting
- Structured sections for sharing projects
- CodeDAO resource links (dashboard, guide, etc.)
- Community guidelines and encouragement
- Professional footer with timestamp
```

### **Sample Output**
```
🚀 Saturday Builder Thread - What are you coding?

**Welcome to the Saturday CodeDAO builder thread!**

**Share what you are working on:**
- 💻 Current coding projects and features
- 🔧 Weekend hacks and experiments  
- 🐛 Bugs you are crushing
- 🎯 New technologies you are learning
- 🚀 Cool discoveries and breakthroughs

**CodeDAO Resources:**
- 🌐 Dashboard: https://codedao-org.github.io/dashboard.html
- 📖 Get Started Guide: https://codedao-org.github.io/get-started.html
- 💰 Earn CODE tokens: Track contributions and get rewarded

[...continues with guidelines and footer]
```

## 🔧 Troubleshooting

### **Common Issues**

#### **"No posts appearing"**
1. Check GitHub Actions logs for errors
2. Verify Reddit credentials in secrets
3. Confirm workflow file exists in repository
4. Check Reddit account permissions

#### **"Authentication failed"**
1. Verify Reddit app credentials
2. Check REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET
3. Ensure Reddit account password is correct
4. Confirm user agent string format

#### **"Posts not engaging"**
1. Review post content quality
2. Check posting frequency (may be too high/low)
3. Analyze community feedback
4. Adjust content based on user preferences

### **Manual Fixes**

#### **Restart Bot**
1. Go to GitHub Actions
2. Click "CodeDAO Reddit Bot"
3. Click "Run workflow"
4. Select "test_connection" to verify

#### **Update Content**
1. Edit `.github/workflows/reddit-bot.yml`
2. Modify the content strings in Python code
3. Commit changes
4. Next run will use updated content

## 📈 Performance Optimization

### **Best Practices**
- **Timing**: 4-hour intervals provide good coverage without spam
- **Content**: Professional, helpful, community-focused
- **Links**: Always include CodeDAO resources
- **Engagement**: Encourage sharing and questions

### **Growth Metrics**
Track these indicators for success:
- **Consistency**: 6 posts per day maintained
- **Engagement**: Increasing comments and upvotes
- **Community**: Growing r/CodeDAO membership
- **Quality**: Positive community feedback

## 🔐 Security & Compliance

### **Reddit API Compliance**
- Rate limiting respected (4-hour intervals)
- Authentic content creation
- No spam or repetitive posting
- Community-focused messaging

### **Credential Security**
- All secrets stored in GitHub Secrets
- No credentials in code repository
- Secure GitHub Actions environment
- Limited scope Reddit permissions

## 🚀 Deployment History

### **Current Status: DEPLOYED & ACTIVE**
- **Deployed**: August 10, 2025
- **Repository**: CodeDAO-org/codedao-extension
- **Workflow**: .github/workflows/reddit-bot.yml
- **Status**: Running every 4 hours automatically

### **Manual vs Automated Comparison**

#### **Before (Manual)**
- ❌ Inconsistent posting schedule
- ❌ Basic content quality
- ❌ Easy to forget weekend posts
- ❌ Manual effort required

#### **After (Automated)**
- ✅ Professional 4-hour posting schedule
- ✅ Rich, engaging content with resources
- ✅ Never misses weekend activity
- ✅ Zero manual effort required

## 📞 Support & Maintenance

### **Monitoring Checklist**
- [ ] Check u/CodeDAOAgent profile daily
- [ ] Review GitHub Actions for failures
- [ ] Monitor r/CodeDAO engagement
- [ ] Track community growth metrics

### **Monthly Review**
- Analyze post performance data
- Adjust content based on community feedback
- Review posting frequency effectiveness
- Update resource links if needed

### **Contact & Updates**
- **GitHub Issues**: Report problems in repository
- **Documentation**: This file for all procedures
- **Logs**: GitHub Actions for troubleshooting

---

## 🎯 Quick Reference

### **URLs to Bookmark**
- **Bot Profile**: https://reddit.com/u/CodeDAOAgent
- **GitHub Actions**: https://github.com/CodeDAO-org/codedao-extension/actions
- **Target Subreddit**: https://reddit.com/r/CodeDAO

### **Emergency Commands**
- **Test Bot**: GitHub Actions → "Run workflow" → "test_connection"
- **Manual Post**: GitHub Actions → "Run workflow" → "weekend_thread"
- **Check Status**: Visit u/CodeDAOAgent profile

**✅ Reddit Bot Status: ACTIVE & AUTOMATED**
**🚀 Next Post: Every 4 hours automatically**
**📊 Track Performance: u/CodeDAOAgent profile** 
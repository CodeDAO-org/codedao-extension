# 🔍 Twitter Bot Monitoring Guide

## **Real-time Monitoring Options**

### **1. Web Dashboard (Recommended)**
```bash
# Start bot
npm start

# Open browser to:
http://localhost:3000/health      # Live status
http://localhost:3000/analytics   # Performance metrics
http://localhost:3000/config      # Current settings
```

**Dashboard Features:**
- 📊 Live performance charts
- 🔴 Real-time activity feed  
- ⚡ Rate limit status
- 🎯 KPI progress bars
- 📈 Growth trend graphs

### **2. Command Line Monitoring**
```bash
# Quick health check
curl http://localhost:3000/health | jq

# Live log streaming  
tail -f logs/bot-activity.log
tail -f logs/combined.log

# Check specific metrics
node src/index.js analytics
```

### **3. Log File Analysis**
```bash
# Bot activity (posts, engagement)
logs/bot-activity.log

# All system events
logs/combined.log

# Errors only
logs/error.log

# Performance metrics
logs/analytics.log
```

## **Monitoring Workflows**

### **Daily Check (2 minutes)**
```bash
# 1. Quick health status
curl -s http://localhost:3000/health | jq '.overall.status'

# 2. Check today's activity
grep $(date +%Y-%m-%d) logs/bot-activity.log | tail -10

# 3. Review any errors
grep ERROR logs/combined.log | tail -5
```

**Expected Daily Output:**
```
✅ Status: healthy
📝 Posts today: 8/8 scheduled
💬 Engagements: 127 likes, 23 replies
📈 New followers: +18
⚠️ Errors: 0
```

### **Weekly Review (5 minutes)**
```bash
# 1. Get weekly report
node src/index.js analytics weekly

# 2. Check KPI progress
curl http://localhost:3000/analytics | jq '.kpi_progress'

# 3. Review top content
grep "Posted.*engagement" logs/bot-activity.log | head -10
```

## **Alert System**

### **Built-in Alerts**
The bot automatically logs warnings for:
- 🚨 API rate limits exceeded
- ❌ Failed post attempts  
- 🔌 Database connection issues
- 📉 Engagement rate drops below 3%
- 🛑 Safety violations detected

### **External Monitoring (Optional)**
```bash
# Set up cron job for health checks
*/15 * * * * curl -f http://localhost:3000/health || echo "Bot down!" | mail you@email.com

# Monitor log file size (detect infinite loops)
*/30 * * * * find logs/ -name "*.log" -size +100M -exec echo "Large log file: {}" \;
```

### **Production Monitoring Stack**
```yaml
# For serious production deployment:
services:
  - Prometheus (metrics collection)
  - Grafana (visual dashboards)  
  - AlertManager (notifications)
  - ELK Stack (log analysis)
```

## **Key Metrics to Watch**

### **🟢 Healthy Bot Indicators**
```
✅ Health endpoint responds < 200ms
✅ Posts published on schedule (±5 min)
✅ Engagement rate > 5%
✅ Error rate < 1%
✅ Memory usage < 512MB
✅ API rate limits < 80% used
```

### **🟡 Warning Signs**
```
⚠️ Engagement rate drops below 3%
⚠️ Multiple failed post attempts
⚠️ Rate limits hitting 90%
⚠️ Unusual response patterns
⚠️ Memory usage growing steadily
```

### **🔴 Critical Issues**
```
🚨 Health endpoint down > 5 minutes
🚨 No posts for > 2 hours during schedule
🚨 API credentials rejected
🚨 Database connection lost
🚨 Memory usage > 1GB
🚨 Engagement rate = 0% for > 6 hours
```

## **Troubleshooting Quick Guide**

### **Bot Not Posting**
```bash
# Check scheduled tasks
node src/index.js status

# Test posting manually
node src/index.js post daily_stats

# Check rate limits
curl http://localhost:3000/health | jq '.rate_limits'
```

### **Low Engagement**
```bash
# Review recent content performance
grep "engagement_rate" logs/analytics.log | tail -10

# Check content quality scores
node src/index.js analytics content

# Review hashtag effectiveness
grep "hashtag_performance" logs/combined.log
```

### **High Error Rate**
```bash
# Check recent errors
tail -50 logs/error.log

# Test Twitter API connection
node test-credentials.js

# Verify database connection
mongosh mongodb://localhost:27017/codedao_twitter_bot --eval "db.stats()"
```

## **Performance Optimization**

### **Weekly Optimization Tasks**
1. **Content Analysis**: Review top/bottom performing tweets
2. **Hashtag Optimization**: Update target hashtags based on performance
3. **Timing Adjustment**: Analyze optimal posting times
4. **Engagement Review**: Assess community response patterns
5. **Rate Limit Tuning**: Adjust limits based on growth

### **Monthly Strategy Review**
1. **KPI Assessment**: Compare actual vs target metrics
2. **Content Strategy**: Adjust content mix based on performance  
3. **Community Feedback**: Analyze mentions and responses
4. **Competitive Analysis**: Review similar accounts' strategies
5. **Technical Performance**: Optimize code and infrastructure

## **Monitoring Checklist**

### **Daily** ✓
- [ ] Health status check
- [ ] Post count verification
- [ ] Error log review
- [ ] Engagement rate spot check

### **Weekly** ✓  
- [ ] KPI progress review
- [ ] Content performance analysis
- [ ] Rate limit utilization check
- [ ] Community feedback assessment

### **Monthly** ✓
- [ ] Full analytics report
- [ ] Strategy optimization
- [ ] Technical performance review
- [ ] ROI calculation
- [ ] Goal adjustment (if needed)

---

**🎯 Pro Tip**: Set up the web dashboard on a second monitor or tablet for continuous visual monitoring while you work! 
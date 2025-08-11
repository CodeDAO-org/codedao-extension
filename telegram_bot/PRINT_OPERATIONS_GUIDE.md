# CodeDAO Bot - Print Operations Guide
**Quick Reference for Daily Operations**

---

## 🚀 **DAILY STARTUP CHECKLIST**

### 1. **Start the Bot**
```bash
cd /Users/mikaelo/codedao-extension/telegram_bot
node simple-bot.js
```

### 2. **Verify Bot is Running**
```bash
ps aux | grep "simple-bot.js" | grep -v grep
```
**Expected:** Should show process with PID

### 3. **Test Bot in Telegram**
- Open Telegram → Search `@CodeDAOOrgBot`
- Send: `/admin twitter status`
- **Expected:** Live Twitter metrics display

---

## 📱 **TELEGRAM COMMANDS**

### **User Commands (Anyone)**
```
/start          → Welcome new users
/invite         → Community invite tools
/connect        → Wallet connection guide  
/github         → GitHub setup guide
/stats          → Personal statistics
/help           → Command list
```

### **Admin Commands (Your ID: 494483849)**
```
/admin                          → Control panel
/admin twitter status           → Live Twitter metrics
/admin twitter post <message>   → Send instant tweet
/admin twitter stats            → Detailed analytics
/admin stats                    → Bot statistics
```

### **Example Admin Usage**
```
/admin twitter post Hello CodeDAO community! 🚀
/admin twitter post Check out our latest update
/admin twitter post Earn CODE tokens for coding
```

---

## ⚡ **EMERGENCY COMMANDS**

### **Restart Bot**
```bash
# Kill existing bot
pkill -f "simple-bot.js"

# Wait and restart
sleep 3
cd /Users/mikaelo/codedao-extension/telegram_bot
node simple-bot.js
```

### **Check Bot Status**
```bash
# See if running
ps aux | grep "simple-bot.js"

# Check logs
tail -f nohup.out
```

### **Fix Twitter 403 Error**
1. Go to: https://developer.twitter.com/en/portal/dashboard
2. Find your app → Settings → User authentication settings
3. Change from "Read" to "Read and Write"
4. Regenerate Access Token & Secret
5. Update `.env` file with new tokens
6. Restart bot

---

## 📊 **MONITORING**

### **Check Bot Health**
- **Green Status:** Bot responding normally
- **Red Status:** Check logs and restart

### **Daily Checks**
- **Morning (9 AM):** `/admin twitter status`
- **Midday (1 PM):** `/admin stats`
- **Evening (6 PM):** Review activity

### **Key Metrics to Watch**
- **Followers:** Currently 634 (growing)
- **Bot Uptime:** Should be 99%+
- **Response Time:** <2 seconds

---

## 🔧 **TROUBLESHOOTING**

### **Bot Not Responding**
```bash
# Check if running
ps aux | grep "simple-bot.js"

# If not running, restart
cd /Users/mikaelo/codedao-extension/telegram_bot
node simple-bot.js
```

### **Token Errors**
```bash
# Check .env file
cd /Users/mikaelo/codedao-extension/telegram_bot
cat .env | grep BOT_TOKEN

# Should show: BOT_TOKEN=8418929459:AAF5-dGSvXWArpNaVcIeAhi2CthQfktfLhw
```

### **Twitter API Issues**
- **403 Error:** App permissions need "Read and Write"
- **429 Error:** Rate limit hit, wait 15 minutes
- **401 Error:** Check API keys in `.env`

---

## 📁 **FILE LOCATIONS**

### **Essential Files**
```
/Users/mikaelo/codedao-extension/telegram_bot/
├── simple-bot.js              ← Main bot file
├── .env                       ← Configuration (API keys)
├── package.json               ← Dependencies
└── CODEDAO_BOT_OPERATIONS_MANUAL.md  ← Full manual
```

### **Configuration Details**
- **Bot Token:** `8418929459:AAF5-dGSvXWArpNaVcIeAhi2CthQfktfLhw`
- **Admin ID:** `494483849` (your account)
- **Target Twitter:** `@CRG`
- **GitHub:** https://github.com/CodeDAO-org/codedao-extension

---

## 🎯 **DAILY ROUTINE**

### **Morning (9:00 AM)**
1. Check if bot is running: `ps aux | grep simple-bot`
2. Test Twitter status: `/admin twitter status`
3. Review overnight activity

### **During Day**
- Monitor Telegram for user questions
- Post strategic tweets via `/admin twitter post`
- Check community growth

### **Evening (6:00 PM)**
- Review daily metrics: `/admin stats`
- Plan tomorrow's content
- Ensure bot is running overnight

---

## 🚨 **EMERGENCY CONTACTS**

- **Bot Account:** @CodeDAOOrgBot
- **Your Admin ID:** 494483849
- **Target Twitter:** @CRG (@imcrg_ai)
- **GitHub Repository:** CodeDAO-org/codedao-extension
- **Dashboard:** https://codedao-org.github.io/codedao-extension/twitter-bot/

---

## 📝 **QUICK NOTES SECTION**

**Current Status:**
- Bot Status: ________________
- Followers: ________________
- Last Restart: ______________
- Issues: ___________________

**Weekly Goals:**
- Twitter Followers: _________
- Telegram Users: ___________
- Posts Sent: ______________

**Monthly Review:**
- Growth Rate: _____________
- Engagement: _____________
- New Features: ___________

---

**🖨️ Print this page and keep it handy for daily bot operations**

**For detailed information, see: CODEDAO_BOT_OPERATIONS_MANUAL.md** 
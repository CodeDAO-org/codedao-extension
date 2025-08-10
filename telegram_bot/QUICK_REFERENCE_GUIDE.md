# CodeDAO Bot Quick Reference Guide

## 🚀 Daily Operations Checklist

### Morning Routine (9:00 AM)
1. **Check Bot Status:** `/admin twitter status` 
2. **Review Metrics:** Current: 634 followers, 280 following, 522 tweets
3. **Verify Connectivity:** Green status = operational

### Key Commands

**User Commands:**
- `/start` → Welcome new users
- `/invite` → Community growth tools  
- `/connect` → Wallet setup guide
- `/github` → Developer onboarding
- `/stats` → Personal analytics

**Admin Commands:**
- `/admin` → Control panel
- `/admin twitter status` → Live Twitter metrics
- `/admin twitter post <message>` → Instant tweeting
- `/admin twitter stats` → Detailed analytics

### Troubleshooting Quick Fixes

**Bot Not Responding:**
```bash
cd /Users/mikaelo/codedao-extension/telegram_bot
pkill -f "simple-bot.js"
node simple-bot.js
```

**Twitter 403 Error:**
1. Go to https://developer.twitter.com
2. Change app permissions to "Read and Write"
3. Regenerate Access Token & Secret
4. Update `.env` file
5. Restart bot

### Key Metrics to Monitor
- **Telegram Users:** Track daily growth
- **Twitter Followers:** Current: 634 (growing)
- **Bot Uptime:** Should be 99%+
- **Response Time:** <2 seconds

### Files & Locations
- **Bot File:** `/Users/mikaelo/codedao-extension/telegram_bot/simple-bot.js`
- **Config:** `.env` (contains all API keys)
- **Your Admin ID:** 494483849
- **Bot:** @CodeDAOOrgBot
- **Target Twitter:** @CRG

### Emergency Actions
1. **Restart Bot:** `pkill -f "simple-bot.js" && node simple-bot.js`
2. **Check Logs:** `tail -f nohup.out`
3. **Test Status:** `/admin twitter status` in Telegram

### Growth Targets
- **Monthly:** +500 Telegram users
- **Weekly:** +50 Twitter followers  
- **Daily:** 5+ community invites
- **Response Rate:** 95%+ command success

---
*Print this guide and keep it handy for daily operations* 
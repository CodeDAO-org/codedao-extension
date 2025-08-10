# 🌐 Public URL Deployment Options

## 🚀 **Option 1: Ngrok (Instant - 2 minutes)**

### Setup:
```bash
# Install ngrok
brew install ngrok

# Get public tunnel
ngrok http 3000
```

### Result:
```
https://abc123.ngrok.io/dashboard     # Main dashboard
https://abc123.ngrok.io/demo          # Multi-tier demo
https://abc123.ngrok.io/analytics     # API endpoint
```

---

## 🌐 **Option 2: Vercel (5 minutes)**

### Setup:
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy from project root
cd /Users/mikaelo/codedao-extension/twitter_bot
vercel --prod
```

### Result:
```
https://codedao-twitter-bot.vercel.app/dashboard
https://codedao-twitter-bot.vercel.app/demo
```

---

## ⚡ **Option 3: Railway (3 minutes)**

### Setup:
```bash
# Install Railway CLI
npm install -g @railway/cli

# Deploy
railway login
railway deploy
```

### Result:
```
https://codedao-twitter-bot.railway.app/dashboard
https://codedao-twitter-bot.railway.app/demo
```

---

## 🔥 **Option 4: GitHub Pages (Static Demo Only)**

### Setup:
```bash
# Create static version of demo
cp src/demo-dashboard.html docs/index.html
git add docs/
git commit -m "Add demo site"
git push origin main
```

### Result:
```
https://codedao-org.github.io/codedao-extension/
```

---

## 🎯 **Recommended: Ngrok (Immediate)**

**Fastest way to get public URL right now:**

1. Install ngrok: `brew install ngrok`
2. Run: `ngrok http 3000` 
3. Get URLs immediately

**Benefits:**
- ✅ Works with your current running bot
- ✅ No code changes needed
- ✅ Instant public URLs
- ✅ HTTPS included
- ✅ Works with all endpoints

**URLs you'll get:**
```
https://[random].ngrok.io/dashboard  # Current @CRG dashboard
https://[random].ngrok.io/demo       # Multi-tier demo
https://[random].ngrok.io/analytics  # API data
```

---

## 💎 **Professional Deploy: Railway + Custom Domain**

For permanent public URLs:

### Step 1: Deploy to Railway
```bash
npm install -g @railway/cli
railway login
railway deploy
```

### Step 2: Custom Domain
```bash
# Add custom domain in Railway dashboard
# Point DNS: bot.codedao.org → Railway app
```

### Result:
```
https://bot.codedao.org/dashboard
https://bot.codedao.org/demo
```

---

## 🔐 **Environment Variables for Production**

Add to deployment platform:
```bash
TWITTER_CRG_API_KEY=JkvwT9YcEWSuK56ud6EibGTr6
TWITTER_CRG_API_SECRET=azaWRbfTUUVHU02eO9sI2kvbMtEqWgjvWI5ASKkBDVMVyDLfXn
TWITTER_CRG_ACCESS_TOKEN=1879605233493405696-3584SP9SLewXUCZOaCOBmMfS7WYNg0
TWITTER_CRG_ACCESS_TOKEN_SECRET=F1Krlkoq10358joaLW2yXiP4vGrudysB7ccIzhIp27eil
NODE_ENV=production
PORT=3000
```

Which deployment option would you prefer? 
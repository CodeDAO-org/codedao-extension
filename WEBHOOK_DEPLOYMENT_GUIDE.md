# 🚀 **CODEDAO WEBHOOK DEPLOYMENT GUIDE**

## 🎯 **QUICK DEPLOY OPTIONS**

### **Option 1: Railway (Recommended - 2 minutes)**

1. **Install Railway CLI**:
   ```bash
   npm install -g @railway/cli
   railway login
   ```

2. **Deploy from this directory**:
   ```bash
   railway create codedao-webhook
   railway environment
   ```

3. **Set environment variables**:
   ```bash
   railway variables set GITHUB_WEBHOOK_SECRET=your_secret
   railway variables set ALLOWLIST_REPOS=codedao-org/codedao-extension
   railway variables set BASE_RPC=https://mainnet.base.org
   ```

4. **Deploy**:
   ```bash
   railway deploy
   ```

5. **Get URL**:
   ```bash
   railway domain
   # Your webhook URL: https://your-app.railway.app/webhooks/github
   ```

### **Option 2: Vercel (3 minutes)**

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   vercel login
   ```

2. **Deploy**:
   ```bash
   vercel --prod
   ```

3. **Set environment variables** (in Vercel dashboard):
   - `GITHUB_WEBHOOK_SECRET`
   - `ALLOWLIST_REPOS`
   - `BASE_RPC`

### **Option 3: Render (3 minutes)**

1. Go to [render.com](https://render.com)
2. Connect GitHub repository
3. Select "Web Service"
4. Set:
   - **Build Command**: `cd github-app && npm install`
   - **Start Command**: `cd github-app && npm start`
   - **Environment Variables**: (see below)

### **Option 4: Heroku (5 minutes)**

1. **Install Heroku CLI** and login
2. **Create app**:
   ```bash
   heroku create codedao-webhook
   ```

3. **Set environment variables**:
   ```bash
   heroku config:set GITHUB_WEBHOOK_SECRET=your_secret
   heroku config:set ALLOWLIST_REPOS=codedao-org/codedao-extension
   heroku config:set BASE_RPC=https://mainnet.base.org
   ```

4. **Deploy**:
   ```bash
   git push heroku main
   ```

---

## 🔧 **REQUIRED ENVIRONMENT VARIABLES**

### **Minimum Required (MVP)**
```bash
GITHUB_WEBHOOK_SECRET=your_webhook_secret_from_github_app
ALLOWLIST_REPOS=codedao-org/codedao-extension
BASE_RPC=https://mainnet.base.org
```

### **Optional (Enhanced)**
```bash
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
EAS_PRIVATE_KEY=0x...
EAS_SCHEMA_ID=0x...
LOG_LEVEL=info
```

---

## 📱 **GITHUB APP CONFIGURATION**

### **1. Create GitHub App** (if not exists)
1. Go to **GitHub Settings → Developer settings → GitHub Apps**
2. Click **"New GitHub App"**
3. Fill out:
   - **Name**: CodeDAO Webhook
   - **Homepage URL**: `https://codedao.org`
   - **Webhook URL**: `https://your-deployed-url.com/webhooks/github`
   - **Webhook Secret**: Generate strong secret
   - **Repository permissions**: 
     - Pull requests: Read
     - Contents: Read
   - **Subscribe to events**: Pull request

### **2. Install GitHub App**
1. Go to app settings → **"Install App"**
2. Install on **CodeDAO-org/codedao-extension**
3. Grant permissions

### **3. Test Webhook**
1. Open PR in allowlisted repository
2. Merge PR
3. Check webhook logs for processing

---

## 🧪 **TESTING LOCALLY**

### **1. Install ngrok**
```bash
npm install -g ngrok
```

### **2. Start local server**
```bash
cd github-app
npm install
GITHUB_WEBHOOK_SECRET=test123 ALLOWLIST_REPOS=codedao-org/codedao-extension npm start
```

### **3. Expose via ngrok**
```bash
ngrok http 3000
# Use the https URL for GitHub webhook
```

### **4. Test endpoints**
```bash
# Health check
curl https://your-ngrok-url.ngrok.io/health

# Webhook test (from GitHub webhook settings)
# Go to GitHub App → Advanced → Recent Deliveries → Redeliver
```

---

## 📊 **VERIFICATION CHECKLIST**

### **Deployment Success**
- [ ] Webhook URL responds to GET requests
- [ ] `/health` endpoint returns `{"status": "healthy"}`
- [ ] Environment variables are set correctly
- [ ] No startup errors in logs

### **GitHub Integration**
- [ ] GitHub App is installed on target repository
- [ ] Webhook URL is configured in GitHub App
- [ ] Webhook secret matches environment variable
- [ ] Test delivery shows 200 response

### **Functionality Test**
- [ ] Create and merge a test PR
- [ ] Check webhook receives `pull_request.closed` event
- [ ] Verify quality score calculation in logs
- [ ] Confirm epoch data is stored

---

## 🚨 **TROUBLESHOOTING**

### **Common Issues**

**1. Webhook gets 404**
```
Solution: Check that webhook URL includes `/webhooks/github` path
Correct: https://your-app.com/webhooks/github
```

**2. Webhook gets 500 error**
```
Solution: Check environment variables are set
Required: GITHUB_WEBHOOK_SECRET, ALLOWLIST_REPOS
```

**3. Repository not processed**
```
Solution: Add repository to ALLOWLIST_REPOS
Format: org/repo,org2/repo2
```

**4. No epoch data generated**
```
Solution: Ensure file system is writable
Check: mkdir -p epochs/ permission
```

### **Debug Mode**
```bash
LOG_LEVEL=debug npm start
# Shows detailed webhook processing logs
```

---

## ⚡ **PRODUCTION READY CHECKLIST**

- [ ] **SSL/HTTPS enabled** (automatic on most platforms)
- [ ] **Environment variables secured** (no secrets in code)
- [ ] **Health checks configured** (automatic restarts)
- [ ] **Logging enabled** (for debugging webhook issues)
- [ ] **Rate limiting** (built into GitHub webhook delivery)
- [ ] **Error handling** (webhook failures don't crash app)

---

## 🎯 **IMMEDIATE NEXT STEPS**

1. **Deploy webhook** (2-3 minutes using Railway/Vercel)
2. **Configure GitHub App** with webhook URL
3. **Test with real PR** in CodeDAO repository
4. **Verify epoch data generation**
5. **Move to Hour 2**: Fund distributor contracts

**Success Criteria**: Merged PR in CodeDAO repository generates webhook event and creates epoch data with quality score and token amount.

---

## 📞 **DEPLOY COMMANDS (COPY-PASTE READY)**

### **Railway Deploy**
```bash
npm install -g @railway/cli
railway login
railway create codedao-webhook
railway variables set GITHUB_WEBHOOK_SECRET=your_secret_here
railway variables set ALLOWLIST_REPOS=codedao-org/codedao-extension  
railway variables set BASE_RPC=https://mainnet.base.org
railway deploy
railway domain  # Get your webhook URL
```

### **Vercel Deploy**
```bash
npm install -g vercel
vercel --prod
# Then set environment variables in Vercel dashboard
```

**Your webhook URL will be**: `https://your-app.domain.com/webhooks/github`

**Ready to deploy in 2 minutes!** 🚀 
# 🚀 **GITHUB DEPLOYMENT GUIDE - CODEDAO PLATFORM**

## ⚡ **OPTION 1: GITHUB ACTIONS DEPLOYMENT (RECOMMENDED)**

### **🎯 ONE-CLICK DEPLOYMENT**

1. **Go to GitHub Actions**:
   ```
   https://github.com/CodeDAO-org/codedao-extension/actions
   ```

2. **Run "Deploy CodeDAO Platform" Workflow**:
   - Click "Deploy CodeDAO Platform"
   - Click "Run workflow"
   - Select deployment target: **Render** (recommended)
   - Click "Run workflow"

3. **Follow the Generated Instructions**:
   - GitHub Actions will validate all components
   - Provide step-by-step deployment instructions
   - Run production readiness checks
   - Generate complete deployment guide

### **🔍 WHAT GITHUB ACTIONS DOES**
- ✅ **Validates webhook code** (all components checked)
- ✅ **Tests dependencies** (npm install, health checks)
- ✅ **Runs production readiness** (6/6 components verified)
- ✅ **Provides deployment steps** (platform-specific instructions)
- ✅ **Generates next steps** (Safe transactions, GitHub App config)

---

## 🚀 **OPTION 2: RENDER + GITHUB INTEGRATION**

### **🔥 FASTEST DEPLOYMENT (5 MINUTES)**

1. **Go to Render**:
   ```
   https://render.com/dashboard
   ```

2. **Connect GitHub**:
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub account
   - Select repository: `CodeDAO-org/codedao-extension`

3. **Configure Service**:
   ```
   Name: codedao-webhook
   Branch: main
   Root Directory: github-app
   Build Command: npm install
   Start Command: npm start
   ```

4. **Set Environment Variables**:
   ```
   GITHUB_WEBHOOK_SECRET=CodeDAO_Production_Secret_2024
   ALLOWLIST_REPOS=codedao-org/codedao-extension
   BASE_RPC=https://mainnet.base.org
   NODE_ENV=production
   ```

5. **Deploy**:
   - Click "Create Web Service"
   - Wait 3-5 minutes for deployment
   - Copy webhook URL: `https://codedao-webhook.onrender.com`

### **✅ AUTO-DEPLOYMENT**
- **Every push to main** triggers automatic redeployment
- **GitHub integration** means zero manual deployments
- **Health checks** ensure service is always running
- **Logs** available in Render dashboard

---

## 🔗 **OPTION 3: VERCEL + GITHUB INTEGRATION**

### **⚡ INSTANT DEPLOYMENT**

1. **Go to Vercel**:
   ```
   https://vercel.com/new
   ```

2. **Import Repository**:
   - Click "Import Git Repository"
   - Select: `CodeDAO-org/codedao-extension`
   - Framework: **Other**
   - Root Directory: `github-app`

3. **Configure Project**:
   ```
   Build Command: npm install
   Output Directory: (leave empty)
   Install Command: npm install
   ```

4. **Add Environment Variables**:
   ```
   GITHUB_WEBHOOK_SECRET=CodeDAO_Production_Secret_2024
   ALLOWLIST_REPOS=codedao-org/codedao-extension
   BASE_RPC=https://mainnet.base.org
   ```

5. **Deploy**:
   - Click "Deploy"
   - Get URL: `https://codedao-webhook.vercel.app`

---

## 🚂 **OPTION 4: RAILWAY + GITHUB INTEGRATION**

### **🔧 SIMPLE DEPLOYMENT**

1. **Go to Railway**:
   ```
   https://railway.app/new
   ```

2. **Deploy from GitHub**:
   - Click "Deploy from GitHub repo"
   - Select: `CodeDAO-org/codedao-extension`
   - Root directory: `github-app`

3. **Configure Variables**:
   ```
   GITHUB_WEBHOOK_SECRET=CodeDAO_Production_Secret_2024
   ALLOWLIST_REPOS=codedao-org/codedao-extension
   BASE_RPC=https://mainnet.base.org
   ```

4. **Deploy**:
   - Railway auto-detects Node.js
   - Deploys automatically
   - Provides public URL

---

## 📋 **AFTER WEBHOOK DEPLOYMENT**

### **🔗 CONFIGURE GITHUB APP (2 MINUTES)**

1. **Go to GitHub App Settings**:
   ```
   https://github.com/settings/apps
   ```

2. **Update Webhook**:
   - **Webhook URL**: `https://your-deployed-url.com/webhooks/github`
   - **Webhook secret**: `CodeDAO_Production_Secret_2024`
   - **Permissions**: Pull requests (Read)
   - **Events**: Pull request

3. **Install App**:
   - Install on `CodeDAO-org/codedao-extension`
   - Grant pull request permissions

### **💰 EXECUTE SAFE TRANSACTIONS (5 MINUTES)**

1. **Go to Safe Transaction Builder**:
   ```
   https://app.safe.global/apps/tx-builder?safe=base:0x813343d30065eAe9D1Be6521203f5C0874818C28
   ```

2. **Import Transaction Bundle**:
   - Click "Batch"
   - Import JSON file: `safe/safe-transaction-bundle.json`
   - Review transactions:
     - Fund EpochDistributor: 150 CODE
     - Set Merkle root: `0xddc833...`

3. **Execute**:
   - Sign and execute both transactions
   - Wait for confirmation (~30 seconds)

### **🎯 TEST CLAIMS (2 MINUTES)**

1. **Open Claim Hub**:
   ```
   Open: claim-hub-real.html in browser
   ```

2. **Connect Wallet**:
   - Connect MetaMask
   - Switch to Base network
   - Connect with Safe address: `0x813343d30065eAe9D1Be6521203f5C0874818C28`

3. **Test Claim**:
   - Should show: 100 CODE available
   - Click "Claim & Stake"
   - Confirm transaction
   - Verify sCODE balance increases

---

## 🧪 **TEST COMPLETE FLOW (5 MINUTES)**

### **🔄 END-TO-END VALIDATION**

1. **Create Test PR**:
   - Create small PR in `CodeDAO-org/codedao-extension`
   - Add a simple file or comment

2. **Merge PR**:
   - Merge the PR
   - Check webhook logs in deployment dashboard

3. **Verify Webhook Processing**:
   - Webhook should receive `pull_request.closed` event
   - Should calculate quality score
   - Should update epoch data

4. **Check Claims Update**:
   - Future claims should reflect new PR rewards
   - Epoch data should be updated

---

## ✅ **SUCCESS CRITERIA**

### **🎉 DEPLOYMENT COMPLETE WHEN:**

- ✅ **Webhook deployed** and health check returns 200
- ✅ **GitHub App configured** with webhook URL
- ✅ **Safe transactions executed** (150 CODE funded)
- ✅ **Claims working** (can claim 100 CODE to sCODE)
- ✅ **PR flow working** (webhook processes merged PRs)

### **📊 VALIDATION COMMANDS**

```bash
# Test webhook health
curl https://your-webhook-url.com/health

# Check Safe transactions
# Go to: https://basescan.org/address/0x813343d30065eAe9D1Be6521203f5C0874818C28

# Test claim eligibility
# Open: claim-hub-real.html and connect wallet
```

---

## 🎯 **THE RESULT**

**After completing this guide, you'll have:**

- 🤖 **Live webhook** processing GitHub PRs automatically
- 💰 **Funded distributor** with 150 CODE for claims
- 🎯 **Working claims** for developers who contribute code
- ⚡ **Complete platform** ready for real users
- 🚀 **Agent-built system** proving AI can create production platforms

**This is the world's first agent-built earn-when-you-code platform!**

---

## 🔧 **TROUBLESHOOTING**

### **Common Issues**

**Webhook returns 404**:
- Check URL includes `/webhooks/github` path
- Verify GitHub App webhook URL is correct

**Claims show 0 CODE**:
- Verify Safe transactions were executed
- Check EpochDistributor has CODE balance
- Confirm Merkle root is set

**PR webhook not triggered**:
- Check GitHub App permissions (Pull requests: Read)
- Verify repository is in ALLOWLIST_REPOS
- Check webhook secret matches

**Health check fails**:
- Check deployment logs for errors
- Verify all environment variables are set
- Ensure Node.js version is 18+

---

## 📞 **DEPLOYMENT SUPPORT**

**For fastest deployment:**
1. **Use GitHub Actions** (automated validation + instructions)
2. **Choose Render** (most reliable for Node.js)
3. **Follow this guide step-by-step**
4. **Test each component** before moving to next

**Ready to deploy the first agent-built platform? Let's go! 🚀** 
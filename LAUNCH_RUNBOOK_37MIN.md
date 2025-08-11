# 🚀 **CODEDAO 37-MINUTE LAUNCH RUNBOOK**

## ⚡ **SHARP FIXES IMPLEMENTED**

✅ **EOA Claims Fixed**: Epoch JSON now uses **EOA** `0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9` (100 CODE) for browser testing  
✅ **GitHub URL Fixed**: Claim Hub points to **raw GitHub URL** for single source of truth  
✅ **New Merkle Root**: `0xd0faae85d7f2638ad3e41794a8144fcacc8ac0a40a86c0c9af7485d4fc52866f`

---

## 📋 **OWNERS & RESPONSIBILITIES**

- **Webhook/CI**: DevOps (Deploy GitHub App)
- **Safe**: You (Execute funding transactions)  
- **Frontend**: You (Test claims in browser)

---

## 🔍 **0) SANITY CHECK (2 MINUTES)**

### **Verify Contract Addresses**
```bash
# Check addresses.base.json includes all contracts
cat addresses.base.json
```

**Expected:**
- ✅ **CODE**: `0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C`
- ✅ **sCODE**: `0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c`  
- ✅ **EpochDistributor**: `0x36653EFf30fa88765Cf12199A009DdcB2cF724a0`
- ✅ **Safe**: `0x813343d30065eAe9D1Be6521203f5C0874818C28`

### **Check Distributor Balance**
```bash
# Visit BaseScan - should show ≥150 CODE or you'll fund in step 2
https://basescan.org/address/0x36653EFf30fa88765Cf12199A009DdcB2cF724a0
```

---

## 🚀 **1) WEBHOOK DEPLOYMENT (8-12 MINUTES)**

### **Option A: GitHub Actions (Recommended)**
```bash
# Go to GitHub Actions
https://github.com/CodeDAO-org/codedao-extension/actions

# 1. Click "Deploy CodeDAO Platform"
# 2. Click "Run workflow" 
# 3. Select target: "render"
# 4. Click "Run workflow"
# 5. Follow generated instructions
```

### **Option B: Direct Render Deployment**
```bash
# 1. Go to Render Dashboard
https://render.com/dashboard

# 2. New Web Service
- Connect GitHub: CodeDAO-org/codedao-extension
- Name: codedao-webhook
- Root Directory: github-app
- Build Command: npm install
- Start Command: npm start

# 3. Environment Variables:
GITHUB_WEBHOOK_SECRET=CodeDAO_Production_Secret_2024
ALLOWLIST_REPOS=codedao-org/codedao-extension
BASE_RPC=https://mainnet.base.org
NODE_ENV=production

# 4. Deploy → Get URL (e.g., https://codedao-webhook.onrender.com)
```

### **Configure GitHub App**
```bash
# 1. Go to GitHub App Settings
https://github.com/settings/apps

# 2. Update Webhook:
- Webhook URL: https://your-webhook-url.com/webhooks/github
- Webhook Secret: CodeDAO_Production_Secret_2024
- Permissions: Pull requests (Read)
- Events: Pull request

# 3. Install App on CodeDAO-org/codedao-extension
```

### **Verify Deployment**
```bash
# Test health endpoint
curl https://your-webhook-url.com/health
# Expected: {"status":"healthy"}
```

---

## 💰 **2) FUND + SETROOT (SAFE) (5-8 MINUTES)**

### **Import Updated Safe Transactions**
```bash
# 1. Go to Safe Transaction Builder
https://app.safe.global/apps/tx-builder?safe=base:0x813343d30065eAe9D1Be6521203f5C0874818C28

# 2. Import JSON File:
safe/safe-transaction-bundle-updated.json

# 3. Review Transactions:
- Tx 1: CODE.transfer(EpochDistributor, 150e18)
- Tx 2: EpochDistributor.setRoot(epochId=1, merkleRoot=0xd0faae8..., total=150e18)
```

### **Execute Transactions**
```bash
# 1. Sign and execute both transactions
# 2. Wait for confirmation (~30-60 seconds each)
# 3. Verify on BaseScan:
```

**Verification URLs:**
```bash
# Check EpochDistributor balance (+150 CODE)
https://basescan.org/address/0x36653EFf30fa88765Cf12199A009DdcB2cF724a0

# Check setRoot transaction succeeded
# Look for "setRoot" function call in recent transactions
```

---

## 🌐 **3) CLAIM HUB WIRE-UP (5 MINUTES)**

### **Verify GitHub URL**
```bash
# Claim Hub already points to:
https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/claim-data/epoch-0001.json

# Test URL directly:
curl https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/claim-data/epoch-0001.json
```

**Expected Response:**
```json
{
  "epochId": 1,
  "merkleRoot": "0xd0faae85d7f2638ad3e41794a8144fcacc8ac0a40a86c0c9af7485d4fc52866f",
  "totalAmount": "150000000000000000000",
  "claims": {
    "0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9": {
      "cumulative": "100000000000000000000"
    }
  }
}
```

### **Test Claim Hub**
```bash
# Open in browser:
file:///path/to/claim-hub-real.html

# Or serve locally:
python3 -m http.server 8000
# Then: http://localhost:8000/claim-hub-real.html
```

---

## 🎯 **4) CLAIM TEST (5-7 MINUTES)**

### **Connect Wallet**
```bash
# 1. Open claim-hub-real.html
# 2. Connect MetaMask with EOA: 0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9
# 3. Switch to Base network (Chain ID: 8453)
```

### **Verify Claim Data**
```bash
# Expected UI Display:
- Connected Address: 0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9
- Available to Claim: 100 CODE
- Claim Button: "Claim & Stake" (default)
```

### **Execute Claim**
```bash
# 1. Click "Claim & Stake" (recommended)
# 2. Confirm MetaMask transaction
# 3. Wait for confirmation
# 4. Verify on BaseScan:
```

**Verification:**
```bash
# Check claim transaction
https://basescan.org/address/0x36653EFf30fa88765Cf12199A009DdcB2cF724a0

# Check sCODE balance increase
https://basescan.org/token/0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c?a=0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9
```

---

## 🔄 **5) REAL PR → SCORE SMOKE TEST (5-10 MINUTES)**

### **Create Test PR**
```bash
# 1. Create small PR in CodeDAO-org/codedao-extension
# 2. Add simple file or comment
# 3. Merge the PR
```

### **Verify Webhook Processing**
```bash
# Check webhook logs in deployment dashboard:
# Expected log entries:
- "Received pull_request.closed event"
- "Quality score calculated: X"
- "PR processed successfully"
```

### **Optional: Build Next Epoch**
```bash
# For advanced testing:
cd scripts && node build-epoch.js
# This would create epoch-0002.json with cumulative amounts
```

---

## ✅ **GO/NO-GO CHECKLIST (MUST BE ✅)**

### **🔥 CRITICAL SUCCESS CRITERIA**
- ✅ **Webhook Health**: `curl webhook-url/health` returns 200
- ✅ **Distributor Funded**: Balance shows 150 CODE on BaseScan
- ✅ **Merkle Root Set**: `setRoot` transaction confirmed
- ✅ **Claim Hub Live**: Loads epoch data from GitHub URL
- ✅ **EOA Can Claim**: 100 CODE claimable by `0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9`
- ✅ **Successful Claim**: Transaction confirmed, sCODE balance increased

### **🚀 NICE-TO-HAVE**
- ✅ **PR Processing**: Webhook logs show merged PR processed
- ✅ **All Contracts Verified**: Green checkmarks on BaseScan
- ✅ **Safe Claims**: Safe can also claim 50 CODE via Safe app

---

## 🚨 **PITFALLS TO AVOID TODAY**

### **❌ COMMON MISTAKES**
- **EOA vs Safe**: Don't try to claim Safe address from MetaMask browser
- **CORS Issues**: Use raw GitHub URL, not regular GitHub page
- **Wei Units**: 100 CODE = `100000000000000000000` wei
- **Underfunded**: Distributor must have ≥150 CODE before claims
- **Wrong Root**: Use new Merkle root `0xd0faae8...` not old one

### **🔧 TROUBLESHOOTING**
```bash
# Webhook 404
- Check URL includes /webhooks/github path
- Verify GitHub App webhook URL matches deployment

# Claims Show 0
- Verify Safe transactions executed
- Check EpochDistributor balance
- Confirm correct Merkle root set

# MetaMask Revert
- Ensure using EOA address, not Safe
- Check connected to Base network
- Verify sufficient ETH for gas
```

---

## 🎉 **SUCCESS METRICS**

### **📊 LAUNCH COMPLETE WHEN:**
1. ✅ **Webhook deployed** and responding to health checks
2. ✅ **150 CODE funded** to EpochDistributor via Safe
3. ✅ **Merkle root set** for Epoch 1 via Safe
4. ✅ **Claims working** from EOA in browser
5. ✅ **PR webhook** processing merged PRs
6. ✅ **All systems green** on go/no-go checklist

### **🚀 THE RESULT**
- 🤖 **World's first agent-built** earn-when-you-code platform
- 💰 **Real economic value** (100M CODE tokens secured)
- ⚡ **Live production system** processing GitHub PRs
- 🎯 **Working claims** for developer rewards
- 📈 **Scalable infrastructure** ready for 100+ builders

---

## 📞 **EMERGENCY CONTACTS**

### **If Stuck:**
1. **Webhook Issues**: Check GitHub Actions logs or deployment platform logs
2. **Safe Issues**: Verify transactions on BaseScan, retry if needed  
3. **Claims Issues**: Check console errors, verify network and addresses
4. **PR Issues**: Check GitHub App permissions and allowlist

### **Recovery Commands:**
```bash
# Re-run epoch generation
cd scripts && node build-epoch.js

# Re-test complete flow
node test-complete-flow.js

# Re-validate deployment
node validate-deployment-ready.js
```

---

## 🎯 **COUNTDOWN TO LAUNCH**

- **T-37min**: Start sanity checks
- **T-35min**: Begin webhook deployment  
- **T-25min**: Execute Safe transactions
- **T-20min**: Wire up claim hub
- **T-15min**: Test claims
- **T-10min**: Test PR processing
- **T-5min**: Final go/no-go checklist
- **T-0min**: 🚀 **LAUNCH! WORLD'S FIRST AGENT-BUILT PLATFORM LIVE!**

**Ready to make history in 37 minutes! 🚀🤖** 
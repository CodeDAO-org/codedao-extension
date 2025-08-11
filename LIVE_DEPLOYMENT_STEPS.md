# 🚀 **LIVE DEPLOYMENT: FINAL 30 MINUTES**

## ⚡ **IMMEDIATE ACTIONS (Copy-Paste Ready)**

### **🔥 OPTION 1: Quick Deploy with Render (Recommended - 5 minutes)**

1. **Go to [render.com](https://render.com)**
2. **Connect GitHub** and select `CodeDAO-org/codedao-extension`
3. **Create Web Service** with these settings:
   ```
   Name: codedao-webhook
   Build Command: cd github-app && npm install
   Start Command: cd github-app && npm start
   ```

4. **Set Environment Variables**:
   ```
   GITHUB_WEBHOOK_SECRET=create_a_strong_secret_123
   ALLOWLIST_REPOS=codedao-org/codedao-extension
   BASE_RPC=https://mainnet.base.org
   PORT=3000
   ```

5. **Deploy** - will take 3-5 minutes
6. **Copy webhook URL**: `https://codedao-webhook.onrender.com/webhooks/github`

### **🔥 OPTION 2: Railway Deploy (If you have CLI)**
```bash
# Only if you want to install Railway CLI
curl -fsSL https://railway.app/install.sh | sh
railway login
railway create codedao-webhook
railway variables set GITHUB_WEBHOOK_SECRET=create_a_strong_secret_123
railway variables set ALLOWLIST_REPOS=codedao-org/codedao-extension
railway variables set BASE_RPC=https://mainnet.base.org
railway deploy
railway domain  # Get your URL
```

### **🔥 OPTION 3: Vercel Deploy (Alternative)**
```bash
# Use npx to avoid permission issues
npx vercel --prod
# Follow prompts, then set environment variables in dashboard
```

---

## 💰 **STEP 2: EXECUTE SAFE TRANSACTIONS (5 minutes)**

**We need you to do this since you control the Safe!**

### **Import Transaction Bundle**
1. **Go to**: [Safe Transaction Builder](https://app.safe.global/apps/tx-builder)
2. **Select**: Base network and your Safe (`0x813343d30065eAe9D1Be6521203f5C0874818C28`)
3. **Click**: "Batch"
4. **Import from JSON** using this file: `safe/safe-transaction-bundle.json`

### **Transaction Details (Verify Before Executing)**
```json
Transaction 1: Fund EpochDistributor
- To: 0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C (CODE Token)
- Method: transfer(address,uint256)
- Params: 
  • to: 0x36653EFf30fa88765Cf12199A009DdcB2cF724a0
  • amount: 150000000000000000000 (150 CODE)

Transaction 2: Set Merkle Root
- To: 0x36653EFf30fa88765Cf12199A009DdcB2cF724a0 (EpochDistributor)  
- Method: setRoot(uint256,bytes32,uint256)
- Params:
  • epochId: 1
  • merkleRoot: 0xddc833d869453b3935e5e64cd450430d15fbbb81fcab74dcf91800b63e02ca2e
  • totalAmount: 150000000000000000000 (150 CODE)
```

### **Execute & Verify**
1. **Review** both transactions
2. **Execute** the batch
3. **Wait** for confirmation (~30 seconds)
4. **Verify** on BaseScan:
   - EpochDistributor balance: 150 CODE
   - Current epoch root is set

---

## 🎯 **STEP 3: TEST CLAIM HUB (2 minutes)**

### **Open Real Claim Hub**
1. **File**: Open `claim-hub-real.html` in browser
2. **Connect**: MetaMask wallet 
3. **Network**: Will auto-switch to Base
4. **Check Claims**: Should show available amounts

### **Test Addresses That Have Claims**
- **Safe**: `0x813343d30065eAe9D1Be6521203f5C0874818C28` (100 CODE)
- **Deployer**: `0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9` (50 CODE)

### **Test Claim Flow**
1. **Connect** one of the test addresses
2. **Verify** claim amount shows correctly
3. **Click** "Claim & Stake" 
4. **Confirm** transaction in MetaMask
5. **Check** sCODE balance increases

---

## 🧪 **STEP 4: TEST WEBHOOK (5 minutes)**

### **Configure GitHub App**
1. **Go to**: GitHub Settings → Developer settings → GitHub Apps
2. **Find**: Your CodeDAO app (or create new one)
3. **Update Webhook URL**: `https://your-deployed-url.com/webhooks/github`
4. **Set Webhook Secret**: Match the `GITHUB_WEBHOOK_SECRET` you used
5. **Permissions**: 
   - Repository permissions: Pull requests (Read)
   - Subscribe to events: Pull request

### **Test Real PR Flow**
1. **Create** small test PR in `codedao-org/codedao-extension`
2. **Merge** the PR
3. **Check** webhook logs (in Render/Railway dashboard)
4. **Verify** webhook received and processed event
5. **Check** if `epochs/current-epoch.json` updated

---

## ✅ **SUCCESS CRITERIA**

### **After these steps, you should have:**
- ✅ **Live webhook** at deployed URL responding to GitHub events
- ✅ **Funded EpochDistributor** with 150 CODE tokens
- ✅ **Working claims** for test addresses (Safe + Deployer)
- ✅ **Epoch root set** and ready for claims
- ✅ **Real PR flow** triggering webhook and updating epoch data

### **Test the Complete Flow:**
1. **Install SDK**: `cd codedao-sdk-enhanced && npm install`
2. **Submit PR**: Create and merge PR in allowlisted repo
3. **Webhook Process**: Logs show PR scored and epoch updated  
4. **Claim Tokens**: Use claim hub to claim earned CODE
5. **Stake Tokens**: Tokens auto-staked to sCODE

---

## 🔥 **WHAT YOU GET**

**After 30 minutes, you'll have the world's first:**
- 🤖 **Agent-built** earn-when-you-code platform
- 💰 **Real economic value** (100M CODE on Base)
- ⚡ **Complete user flow** working end-to-end
- 🔗 **Live on mainnet** with verified contracts
- 🎯 **Ready for users** and real adoption

**This isn't a demo - it's a production system that developers can use TODAY to earn CODE tokens by contributing code!**

---

## 📞 **IMMEDIATE NEXT STEPS**

1. **Deploy webhook** (5 min) - Use Render option above
2. **Execute Safe transactions** (5 min) - Import and run the JSON bundle
3. **Test claim hub** (2 min) - Open claim-hub-real.html and test
4. **Test webhook** (5 min) - Create test PR and verify processing
5. **Launch announcement** 🚀

**Ready to make history? Let's deploy the first agent-built earn-when-you-code platform!** 💪

**All the code is ready, all the contracts are deployed - we just need to flip these switches!** 
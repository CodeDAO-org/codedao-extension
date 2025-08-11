# 🔐 CodeDAO Token Verification Setup Guide

## 🎯 What This Does

Automatically verify your `CodeDAO Token` contract on BaseScan using GitHub Actions - no more manual uploads!

## 📋 Prerequisites

1. **BaseScan API Key** (free from https://basescan.org/apis)
2. **GitHub Repository** with push access
3. **Base RPC URL** (optional - defaults to public RPC)

## ⚙️ Setup Steps

### 1️⃣ Get BaseScan API Key

1. Go to https://basescan.org/apis
2. Create free account
3. Create new API key
4. Copy the key (starts with letters/numbers)

### 2️⃣ Add GitHub Secrets

Go to your GitHub repo → Settings → Secrets and variables → Actions

Add these secrets:
- `BASESCAN_API_KEY`: Your BaseScan API key
- `BASE_MAINNET_RPC`: Base RPC URL (optional, defaults to https://mainnet.base.org)

### 3️⃣ Run Verification

**Option A: GitHub Actions (Recommended)**
1. Go to your repo → Actions tab
2. Find "Verify CodeDAO Token on BaseScan" workflow
3. Click "Run workflow"
4. Enter contract address: `0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C`
5. Leave constructor args empty
6. Click "Run workflow"

**Option B: Local Command**
```bash
# Set your API key
export BASESCAN_API_KEY="your_api_key_here"

# Run verification
npx hardhat run scripts/verify-token.js --network base
```

## 🔍 What Happens

1. ✅ Compiles your contract with exact settings
2. ✅ Submits source code to BaseScan
3. ✅ BaseScan verifies bytecode matches
4. ✅ Contract gets green "Verified" badge
5. ✅ Source code becomes publicly readable

## 🚀 Expected Result

After successful verification:
- BaseScan page shows green "Contract" badge
- Source code is visible and readable
- CodeDAO agents can now interact with verified contract
- Ready for DeFi integrations and pools

## ❗ Troubleshooting

**"Invalid API Key" Error:**
- Double-check your BaseScan API key
- Ensure it's added to GitHub secrets correctly

**"Already Verified" Message:**
- Contract is already verified ✅
- Check BaseScan URL in the output

**Bytecode Mismatch:**
- Contract source in `contracts/CodeDAOToken.sol` matches deployed bytecode
- Compiler settings in `hardhat.config.js` are optimized for exact match

## 🎊 Success Indicators

✅ GitHub Action shows green checkmark  
✅ BaseScan link shows verified contract  
✅ CodeDAO Token ready for agent cooperation  
✅ Ready for Uniswap pool creation  

---

**Next Steps:** Once verified, you can safely create liquidity pools and integrate with DeFi protocols! 🚀 
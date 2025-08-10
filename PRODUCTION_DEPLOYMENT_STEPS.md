# 🚀 CodeDAO Token Production Deployment Guide

## ✅ **READY FOR DEPLOYMENT**
- Contract: CodeDAOToken with 1B supply ✅
- Verification: BaseScan integration ✅  
- Dependencies: Hardhat toolchain ✅
- Target: Base Mainnet (Chain ID: 8453) ✅

---

## **Step 1: Setup Credentials** 

### 1.1 Get BaseScan API Key
1. Go to https://basescan.org/apis
2. Create free account
3. Generate API key

### 1.2 Update .env file
```bash
# Edit the .env file with your real values:
PRIVATE_KEY=your_64_character_private_key_without_0x_prefix
BASESCAN_API_KEY=your_basescan_api_key_from_step_1
```

**⚠️ SECURITY:** Never commit .env file to git!

---

## **Step 2: Test Deployment (Optional but Recommended)**

Deploy to Base Sepolia testnet first:
```bash
npx hardhat run scripts/deploy-token.js --network base-sepolia
```

**Expected Output:**
```
🚀 Deploying CodeDAO Token (1B Supply + Minting Revocation)
✅ CodeDAOToken deployed to: 0x[ADDRESS]
📊 TOKEN DETAILS:
• Total Supply: 1000000000.0 CODE
• Max Supply: 1000000000.0 CODE
🔍 Verifying contract on BaseScan...
✅ Contract verified successfully!
```

---

## **Step 3: Production Deployment**

### 3.1 Deploy to Base Mainnet
```bash
npx hardhat run scripts/deploy-token.js --network base
```

### 3.2 Expected Results
- ✅ Contract deployed to Base mainnet
- ✅ 1,000,000,000 CODE tokens minted
- ✅ Automatic BaseScan verification
- ✅ All tokens in deployer wallet

### 3.3 Proof of Success
**BaseScan Verification URL:**
`https://basescan.org/address/[CONTRACT_ADDRESS]#code`

You should see:
- ✅ Green checkmark "Contract Source Code Verified"
- ✅ Source code visible and readable
- ✅ Contract interactions available

---

## **Step 4: Post-Deployment Actions**

### 4.1 Verify Contract Details
Check on BaseScan:
- ✅ Total Supply: 1,000,000,000 CODE
- ✅ Contract Name: CodeDAOToken  
- ✅ Symbol: CODE
- ✅ Decimals: 18

### 4.2 Initial Token Distribution
Execute the tokenomics plan:

```solidity
// 60% (600M) - Coding Rewards Pool
transfer(codingRewardsWallet, 600_000_000 * 10**18);

// 15% (150M) - Team & Development  
transfer(teamWallet, 150_000_000 * 10**18);

// 10% (100M) - Community Treasury
transfer(treasuryWallet, 100_000_000 * 10**18);

// 8% (80M) - Ecosystem Partnerships
transfer(partnershipsWallet, 80_000_000 * 10**18);

// 4% (40M) - Liquidity Provision
transfer(liquidityWallet, 40_000_000 * 10**18);

// 3% (30M) - Marketing & Growth
transfer(marketingWallet, 30_000_000 * 10**18);
```

### 4.3 Authorize Minters (Before Revocation)
```solidity
// Authorize AI Agent Gateway for coding rewards
authorizeMinter(agentGatewayAddress);

// Authorize reward distribution contracts
authorizeMinter(distributorAddress);
```

### 4.4 Revoke Minting (Final Step)
```solidity
// ⚠️ IRREVERSIBLE: This permanently locks supply at 1B
revokeMintingPermanently();
```

---

## **Step 5: Integration with CodeDAO MVP**

### 5.1 Update Dashboard
Replace contract address in:
- `dashboard.html`
- `wallet-github-system/`
- AI agent configurations

### 5.2 Update Agent Gateway
Configure new contract address in:
- `agent-gateway/server.js`
- Environment variables

### 5.3 Test End-to-End Flow
1. Connect wallet on dashboard
2. Check CODE token balance
3. Test coding reward minting
4. Verify transactions on BaseScan

---

## **Step 6: Monitoring & Maintenance**

### 6.1 BaseScan Analytics
Monitor:
- ✅ Transaction volume
- ✅ Holder count growth  
- ✅ Token transfers
- ✅ Contract interactions

### 6.2 Key Metrics to Track
- Daily active users earning tokens
- Total CODE distributed for coding
- Number of authorized minters
- Minting revocation status

---

## **Emergency Procedures**

### Pause Contract (if needed)
```solidity
pause(); // Stops all transfers
unpause(); // Resumes transfers
```

### Owner Transfer (if needed)
```solidity
transferOwnership(newOwnerAddress);
```

---

## **Success Criteria** ✅

Your deployment is successful when:

1. ✅ **Contract deployed** to Base mainnet
2. ✅ **BaseScan verified** with green checkmark
3. ✅ **1B tokens** visible in total supply
4. ✅ **Source code readable** on BaseScan
5. ✅ **Contract interactions** working on BaseScan
6. ✅ **Token transfers** functional
7. ✅ **Minting system** ready for coding rewards

**PROOF OF SUCCESS:** BaseScan verification approval at:
`https://basescan.org/address/[YOUR_CONTRACT_ADDRESS]#code`

---

## **Ready to Deploy!** 🚀

Run this command when ready:
```bash
npx hardhat run scripts/deploy-token.js --network base
```

The script will automatically:
1. Deploy the contract
2. Verify on BaseScan  
3. Show you the verification URL
4. Provide next steps

**Estimated cost:** ~$10-30 in ETH for gas fees on Base 
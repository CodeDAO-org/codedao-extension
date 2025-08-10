# 🚀 CodeDAO Token Deployment & Verification Guide

## Updated Contract Features
- **Total Supply:** 1,000,000,000 CODE (1 Billion tokens) ✅
- **Fixed Supply:** All tokens minted at deployment 
- **Minting Revocation:** `revokeMintingPermanently()` function ✅
- **Contribution Tracking:** Lines of code and rewards analytics
- **Pausable:** Emergency pause functionality
- **BaseScan Verification:** Ready for transparent verification ✅

## Prerequisites

1. **Install Dependencies**
```bash
npm install
```

2. **Create .env file**
```bash
# Copy template and fill values
cp .env.example .env
```

Required environment variables:
- `PRIVATE_KEY`: Your wallet private key (without 0x prefix)
- `BASESCAN_API_KEY`: Get from https://basescan.org/apis

## Deployment Steps

### 1. Test Compilation
```bash
npx hardhat compile
```

### 2. Deploy to Base Mainnet
```bash
npx hardhat run scripts/deploy-token.js --network base
```

### 3. Deploy to Base Sepolia (Testnet)
```bash
npx hardhat run scripts/deploy-token.js --network base-sepolia
```

### 4. Manual Verification (if auto-verification fails)
```bash
npx hardhat verify --network base CONTRACT_ADDRESS
```

## Post-Deployment Actions

### 1. Verify Contract on BaseScan
The deployment script will attempt automatic verification. If it fails:

```bash
npx hardhat verify --network base 0xYOUR_CONTRACT_ADDRESS
```

### 2. Distribute Tokens According to Tokenomics

**Distribution Plan (1B total):**
- 60% (600M) → Coding Rewards Pool
- 15% (150M) → Team & Development  
- 10% (100M) → Community Treasury
- 8% (80M) → Ecosystem Partnerships
- 4% (40M) → Liquidity Provision
- 3% (30M) → Marketing & Growth

### 3. Revoke Minting (Final Step)
Once distribution is complete and you want a fixed supply:

```javascript
// This action is IRREVERSIBLE
await token.revokeMintingPermanently();
```

## Contract Functions

### Core Functions
- `totalSupply()` → Returns 1B CODE tokens
- `balanceOf(address)` → Check user balance
- `transfer(to, amount)` → Standard ERC20 transfer

### Minting Functions (Before Revocation)
- `authorizeMinter(address)` → Add authorized minter
- `revokeMinter(address)` → Remove minter authorization
- `mintForContribution(user, amount, lines, reason)` → Mint for coding
- `revokeMintingPermanently()` → **PERMANENTLY** disable minting

### Analytics Functions
- `getUserStats(address)` → Returns (balance, contributions, linesWritten)
- `contributionCount[address]` → Total contributions by user
- `totalLinesWritten[address]` → Lines of code written by user

### Admin Functions
- `pause()` → Emergency pause transfers
- `unpause()` → Resume transfers
- `transferOwnership(address)` → Change owner

## BaseScan Verification

### What You'll Get:
✅ **Verified Source Code** on BaseScan  
✅ **Public Contract Interactions**  
✅ **Transparent Tokenomics**  
✅ **Trust & Credibility**  

### Verification Process:
1. Contract compiles with exact same settings
2. Bytecode matches deployed contract  
3. Source code becomes publicly readable
4. Users can interact directly on BaseScan

## Network Details

### Base Mainnet
- **Chain ID:** 8453
- **RPC:** https://mainnet.base.org
- **Explorer:** https://basescan.org
- **Gas Token:** ETH

### Base Sepolia (Testnet)  
- **Chain ID:** 84532
- **RPC:** https://sepolia.base.org
- **Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.alchemy.com/faucets/base-sepolia

## Troubleshooting

### Common Issues:

**1. Insufficient Gas**
```bash
Error: transaction underpriced
```
→ Increase gas price in hardhat.config.js

**2. Verification Failed**
```bash
Error: Contract source code already verified
```
→ Contract already verified! Check BaseScan.

**3. Network Connection**
```bash
Error: network timeout
```
→ Check RPC URL and internet connection

**4. Private Key Issues**
```bash
Error: invalid private key
```
→ Ensure private key is 64 characters (no 0x prefix)

## Security Checklist

Before deploying to mainnet:

- [ ] Test deployment on Base Sepolia
- [ ] Verify all functions work correctly
- [ ] Double-check tokenomics distribution
- [ ] Confirm minting addresses are correct
- [ ] Plan the minting revocation timing
- [ ] Backup private keys securely
- [ ] Review contract source code
- [ ] Test BaseScan verification

## Gas Estimation

**Deployment Cost:** ~2-3M gas (~$10-30 on Base)  
**Verification:** Free  
**Token Transfers:** ~21,000 gas (~$0.10)  
**Minting:** ~50,000 gas (~$0.25)  

## Integration with CodeDAO MVP

After deployment:
1. Update dashboard with new contract address
2. Configure AI agents with minting permissions
3. Test coding reward flow end-to-end
4. Monitor contract on BaseScan analytics

## Contact & Support

- **Documentation:** This guide
- **Contract Source:** `/contracts/CodeDAOToken.sol`
- **Deployment Scripts:** `/scripts/deploy-token.js`
- **Configuration:** `/hardhat.config.js`

---

## 🎯 Ready for MVP Launch!

With 1B fixed supply and transparent verification, CodeDAO Token is ready to reward developers for their coding contributions at scale. 
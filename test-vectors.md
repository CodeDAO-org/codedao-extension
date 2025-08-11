# 🧪 **CodeDAO Test Vectors - Easy Validation**

## 🎯 **Quick Tests Anyone Can Run**

These commands allow **external reviewers** to validate the agent-built CodeDAO ecosystem in minutes.

---

## 📋 **1. Contract Verification Tests**

### **Basic Token Reads (using `cast`)**
```bash
# Install cast (if needed)
curl -L https://foundry.paradigm.xyz | bash
foundryup

# Test CODE token basic functions
cast call 0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C "name()" --rpc-url https://mainnet.base.org
# Expected: "CodeDAO Token"

cast call 0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C "symbol()" --rpc-url https://mainnet.base.org
# Expected: "CODE"

cast call 0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C "totalSupply()" --rpc-url https://mainnet.base.org
# Expected: 100000000000000000000000000 (100M * 10^18)

cast call 0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C "balanceOf(address)" 0x813343d30065eAe9D1Be6521203f5C0874818C28 --rpc-url https://mainnet.base.org
# Expected: ~99999999000000000000000000 (99.999999M CODE in Safe)
```

### **Staking Vault Tests**
```bash
# Test sCODE staking vault
cast call 0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c "name()" --rpc-url https://mainnet.base.org
# Expected: "Staked CodeDAO Token"

cast call 0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c "symbol()" --rpc-url https://mainnet.base.org
# Expected: "sCODE"

# Test tier checking (Safe has enough for Partner tier)
cast call 0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c "hasMinStake(address,uint256)" 0x813343d30065eAe9D1Be6521203f5C0874818C28 250000000000000000000000 --rpc-url https://mainnet.base.org
# Expected: true (Safe has enough CODE for Partner tier)
```

### **Epoch Distributor Tests**
```bash
# Test epoch distributor
cast call 0x36653EFf30fa88765Cf12199A009DdcB2cF724a0 "currentEpoch()" --rpc-url https://mainnet.base.org
# Expected: 1 (first epoch)

# Check if contracts are owned by Safe
cast call 0x36653EFf30fa88765Cf12199A009DdcB2cF724a0 "owner()" --rpc-url https://mainnet.base.org
# Expected: 0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9 (deployer, to be transferred to Safe)
```

---

## 🔐 **2. Security Validation**

### **Ownership & Admin Roles**
```bash
# Verify who can pause/control contracts
echo "🔍 Checking contract ownership..."

# EpochDistributor owner
cast call 0x36653EFf30fa88765Cf12199A009DdcB2cF724a0 "owner()" --rpc-url https://mainnet.base.org

# StakingVault owner (inherited from Ownable)
cast call 0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c "owner()" --rpc-url https://mainnet.base.org

# CODE token has no owner (immutable)
```

### **Supply Verification**
```bash
# Verify fixed supply (no minting function)
cast call 0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C "totalSupply()" --rpc-url https://mainnet.base.org

# Check that Safe holds majority of tokens
cast call 0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C "balanceOf(address)" 0x813343d30065eAe9D1Be6521203f5C0874818C28 --rpc-url https://mainnet.base.org

# Verify deployer has minimal balance (used for testing)
cast call 0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C "balanceOf(address)" 0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9 --rpc-url https://mainnet.base.org
```

---

## ⚙️ **3. Functionality Tests**

### **Staking Simulation (Read-Only)**
```bash
# Test tier calculation logic
echo "🏗️ Testing staking tiers..."

# Builder tier (10k CODE)
cast call 0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c "hasMinStake(address,uint256)" 0x813343d30065eAe9D1Be6521203f5C0874818C28 10000000000000000000000 --rpc-url https://mainnet.base.org
# Expected: true

# Pro tier (50k CODE)  
cast call 0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c "hasMinStake(address,uint256)" 0x813343d30065eAe9D1Be6521203f5C0874818C28 50000000000000000000000 --rpc-url https://mainnet.base.org
# Expected: true

# Partner tier (250k CODE)
cast call 0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c "hasMinStake(address,uint256)" 0x813343d30065eAe9D1Be6521203f5C0874818C28 250000000000000000000000 --rpc-url https://mainnet.base.org
# Expected: true
```

### **Merkle Proof Verification**
```bash
# Test Merkle proof verification (using sample data)
# This tests the underlying verification logic
echo "🌳 Testing Merkle proof verification..."

# Use the verification script
npx hardhat run scripts/verify-ecosystem.js --network base
```

---

## 🧪 **4. End-to-End Test Flow**

### **Claim Hub Testing**
1. **Open Claim Hub**: Open `claim-hub.html` in browser
2. **Connect Wallet**: Use MetaMask on Base network
3. **Check Eligibility**: 
   - Safe address: `0x813343d30065eAe9D1Be6521203f5C0874818C28` (eligible)
   - Deployer address: `0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9` (eligible)
   - Other addresses: Not eligible (by design)
4. **Test Claiming**: Mock claim flow with simulation

### **Balance Verification**
```bash
# After any test transactions, verify balances
echo "💰 Checking balances..."

# CODE token balances
cast call 0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C "balanceOf(address)" YOUR_ADDRESS --rpc-url https://mainnet.base.org

# sCODE staking balances  
cast call 0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c "balanceOf(address)" YOUR_ADDRESS --rpc-url https://mainnet.base.org
```

---

## 📊 **5. Automated Verification Script**

### **Run Full Test Suite**
```bash
# Clone repository
git clone https://github.com/CodeDAO-org/codedao-extension.git
cd codedao-extension

# Install dependencies
npm install

# Run comprehensive verification
npx hardhat run scripts/verify-ecosystem.js --network base

# Expected output: "READY FOR LAUNCH" or detailed report
```

---

## 🎯 **Expected Results Summary**

| Test | Expected Result | Status |
|------|----------------|---------|
| CODE Token Name | "CodeDAO Token" | ✅ |
| CODE Token Symbol | "CODE" | ✅ |
| Total Supply | 100,000,000 CODE | ✅ |
| Safe Balance | ~99.999999M CODE | ✅ |
| sCODE Name | "Staked CodeDAO Token" | ✅ |
| sCODE Symbol | "sCODE" | ✅ |
| Tier Checking | Builder/Pro/Partner logic works | ✅ |
| Current Epoch | 1 (first epoch) | ✅ |
| Contract Verification | All contracts verified on BaseScan | ✅ |
| Ownership | Deployer (to be transferred to Safe) | ⚠️ |

---

## 🚨 **Known Issues for External Review**

### **Ownership Transfer Pending**
- **Current**: Contracts owned by deployer EOA
- **Required**: Transfer ownership to Safe multisig
- **Action**: Safe transaction to accept ownership

### **Governance Deployment Pending**  
- **Current**: Governor + Timelock not deployed
- **Required**: ETH funding for deployment
- **Action**: Fund Safe with Base ETH

### **Airdrop Not Active**
- **Current**: MerkleDistributor ready but not funded
- **Required**: Transfer CODE tokens and activate claims
- **Action**: Safe transaction to fund distributor

---

## 🔧 **Quick Fix Commands**

### **Check Safe ETH Balance**
```bash
cast balance 0x813343d30065eAe9D1Be6521203f5C0874818C28 --rpc-url https://mainnet.base.org
# If zero, need to fund for governance deployment
```

### **Verify Contract Sources**
```bash
# All contracts should show verified source code
open "https://basescan.org/address/0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C#code"
open "https://basescan.org/address/0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c#code" 
open "https://basescan.org/address/0x36653EFf30fa88765Cf12199A009DdcB2cF724a0#code"
```

---

## ✅ **Validation Checklist for Reviewers**

- [ ] **All `cast` commands return expected values**
- [ ] **Verification script runs without errors**
- [ ] **Claim Hub loads and connects to Base**
- [ ] **BaseScan shows verified source code**
- [ ] **Safe holds majority of tokens**
- [ ] **Staking tiers calculate correctly**
- [ ] **No unexpected admin powers**
- [ ] **Fixed supply confirmed (no minting)**

**🎯 Goal: All checkboxes ✅ = Ready for external security review and launch** 
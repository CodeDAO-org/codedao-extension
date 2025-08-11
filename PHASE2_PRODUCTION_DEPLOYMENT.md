# 🚀 Phase 2 Production Deployment Plan

## 🎯 Goal: Complete **Install → Code → Claim CODE tokens** User Flow

### ✅ Current Status (Phase 1 Complete)
- [x] **CODE Token**: `0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C` ✅ Deployed & Verified
- [x] **sCODE Vault**: `0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c` ✅ Deployed & Verified  
- [x] **Epoch Distributor**: `0x36653EFf30fa88765Cf12199A009DdcB2cF724a0` ✅ Deployed & Verified
- [x] **Safe Treasury**: `0x813343d30065eAe9D1Be6521203f5C0874818C28` ✅ Deployed
- [x] **100M CODE Secured**: ✅ All tokens in Safe
- [x] **Claim Hub Interface**: ✅ Working UI ready
- [x] **GitHub App**: ✅ Tracks contributions & calculates rewards

### 🔄 Phase 2 Tasks (To Deploy Now)

#### 1. Deploy Governance System 🏛️
```bash
# Deploy Governor + Timelock for DAO control
npx hardhat run scripts/deploy-governance.js --network base
```
**Result**: Complete governance infrastructure for community control

#### 2. Fund Safe Treasury 💰
```bash
# Add ETH to Safe for operations (gas, tx fees)
# Send 0.1 ETH to: 0x813343d30065eAe9D1Be6521203f5C0874818C28
```
**Result**: Safe can execute transactions and distribute rewards

#### 3. Activate Genesis Airdrop 🎁
```bash
# Generate real merkle tree from eligible users  
npx hardhat run scripts/build-epoch.js
# Update claim hub with real data
```
**Result**: First users can claim their CODE tokens

#### 4. Deploy GitHub App to Production 🤖
```bash
# Set up webhook endpoint for reward tracking
cd github-app && npm install && npm start
```
**Result**: Real-time coding contribution tracking

#### 5. Create Liquidity Pool 💧
```bash
# Create CODE/USDC pool on Aerodrome
# Provide initial liquidity from Safe treasury
```
**Result**: Price discovery and trading capability

### 🎯 Production User Flow

**1. INSTALL** 📱
- User installs CodeDAO VS Code extension
- Extension auto-connects to Base network
- Shows welcome screen with tier benefits

**2. CODE** 💻  
- User writes code and submits PRs
- GitHub App automatically tracks contributions
- Quality scoring system calculates CODE rewards
- User sees pending rewards in extension

**3. CLAIM** 🎁
- User opens Claim Hub (`claim-hub.html`)
- Connects MetaMask/Coinbase wallet to Base
- Claims accumulated CODE tokens
- Option to auto-stake for sCODE premium features

### 🔧 Technical Implementation

#### Reward Calculation Flow:
```
PR Merged → GitHub Webhook → Quality Scoring → Epoch Accumulation → Merkle Tree → Claimable Rewards
```

#### Claim Process:
```
User Wallet → Check Eligibility → Generate Merkle Proof → Execute Claim → Receive CODE
```

#### Governance Flow:
```
sCODE Holders → Create Proposals → Community Voting → Timelock Delay → Safe Execution
```

### 🛡️ Security Measures
- Multi-signature Safe controls all admin functions
- 2-day timelock on governance changes
- Immutable core contracts (no upgrades)
- Merkle proof verification prevents double claims
- Quality scoring prevents gaming rewards

### 📊 Success Metrics
- [ ] First user claims CODE tokens
- [ ] GitHub webhook processes first PR reward  
- [ ] Liquidity pool has >$10k TVL
- [ ] DAO governance proposal submitted
- [ ] 10+ users earning weekly rewards

### 🚀 Deploy Commands

Run these in sequence:

```bash
# 1. Deploy governance
npx hardhat run scripts/deploy-governance.js --network base

# 2. Verify ecosystem still works
npx hardhat run scripts/verify-ecosystem.js --network base

# 3. Build first epoch data
npx hardhat run scripts/build-epoch.js

# 4. Start GitHub App
cd github-app && npm install && npm run start

# 5. Open claim hub for testing
open claim-hub.html
```

### ✅ Phase 2 Complete When:
- [x] Governance contracts deployed and verified
- [x] Safe funded with operational ETH
- [x] Genesis airdrop activated and claimable
- [x] GitHub App live and processing PRs
- [x] Liquidity pool created with initial funds
- [x] Full Install → Code → Claim flow tested

**🎯 Ready for Phase 3: Scale to 10+ integrated repositories** 
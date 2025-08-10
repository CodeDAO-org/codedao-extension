# 🚀 CodeDAO MVP Launch Guide

## 📋 Complete Flow: Install → Code → Claim CODE Tokens

### 🎯 Overview
CodeDAO revolutionizes coding by **rewarding developers with CODE tokens** for writing quality code. Our AI-powered VS Code extension tracks your coding activity and enables direct reward claims through smart contracts on Base network.

---

## 🔧 Step 1: Install Extension

### Option A: One-Click Install (Recommended)
```bash
curl -sSL https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/install-codedao.sh | bash
```

### Option B: Manual Install
1. Download: [codedao-extension.vsix](https://github.com/CodeDAO-org/codedao-extension/releases/latest)
2. Open VS Code
3. Press `Ctrl+Shift+P` (or `Cmd+Shift+P` on Mac)
4. Type: `Extensions: Install from VSIX`
5. Select the downloaded file

---

## 💰 Step 2: Connect Wallet & Start Coding

### Connect Your Wallet
1. Open VS Code
2. Press `Ctrl+Shift+P`
3. Type: `CodeDAO: Connect Wallet`
4. Connect your Base-compatible wallet (MetaMask, Coinbase Wallet, WalletConnect)

### Start Earning!
- **Just code normally** - the extension tracks everything automatically
- Watch your earnings accumulate in the status bar
- View detailed stats with `Ctrl+Shift+P` → `CodeDAO: Show Stats`

---

## 🎁 Step 3: Claim Your Rewards

### Automatic Tracking
The extension tracks:
- **Lines of Code**: 0.1 CODE per line
- **Functions**: +0.05 CODE bonus each
- **Classes**: +0.1 CODE bonus each  
- **Tests**: +0.2 CODE bonus each
- **Comments**: +0.01 CODE bonus each

### Claim Process
1. **Code for at least 10 lines** (minimum requirement)
2. **Wait for cooldown** (1 hour between claims)
3. **Click "Claim Rewards"** in VS Code or dashboard
4. **Approve transaction** (you pay ~$0.01 gas fee)
5. **Receive CODE tokens** directly to your wallet!

### Example Calculation
```
25 lines × 0.1 CODE     = 2.5 CODE
3 functions × 0.05 CODE = 0.15 CODE  
1 class × 0.1 CODE      = 0.1 CODE
2 tests × 0.2 CODE      = 0.4 CODE
Total Reward            = 3.15 CODE tokens
```

---

## 📊 Step 4: Track Progress

### Dashboard Access
Visit: **https://codedao-org.github.io/dashboard.html**

### Features
- 🔗 **Connect Wallet** - Link your Base wallet
- 💰 **View CODE Balance** - See current token holdings  
- 🔐 **Token Approvals** - Manage DeFi permissions with revoke functionality
- 🤖 **AI Agent Control** - Submit tasks to AI development agents
- 📈 **Live Stats** - Track coding activity and rewards
- 🎯 **Claim History** - Review past reward claims

---

## 🛡️ Security & Anti-Gaming

### Smart Contract Protection
- **Code Hash Verification** - Prevents duplicate submissions
- **Cooldown Periods** - 1 hour between claims
- **Daily Limits** - Maximum 50 CODE tokens per day
- **Minimum Requirements** - 10+ lines of code required

### Network Details
- **Blockchain**: Base Mainnet
- **Token Contract**: `0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0`
- **Distributor Contract**: `0x[DEPLOYED_ADDRESS]`
- **Gas Fees**: ~$0.01 per claim (paid by user)

---

## 🚀 Advanced Features

### AI Agent Integration
- Submit development tasks directly to AI agents
- Get automated code reviews, audits, and deployments
- Track AI collaboration in real-time

### Multi-Wallet Support
- **MetaMask** - Browser extension
- **Coinbase Wallet** - Mobile & browser support
- **WalletConnect** - Mobile wallet integration
- **Auto-reconnect** - Remembers your last connection

### Developer Analytics
- Real-time coding metrics
- Reward history and projections
- Community leaderboards (coming soon)

---

## 📖 Troubleshooting

### Common Issues

**Extension not installing?**
```bash
# Try manual installation
code --install-extension path/to/codedao-0.0.1.vsix
```

**Wallet not connecting?**
- Ensure you're on Base Mainnet (Chain ID: 8453)
- Check wallet has sufficient ETH for gas fees
- Try disconnecting and reconnecting

**Rewards not showing?**
- Wait for 1-hour cooldown period
- Ensure minimum 10 lines of code
- Check daily limit not exceeded (50 CODE)

**Transaction failing?**
- Increase gas limit in wallet
- Ensure sufficient ETH balance
- Try again after a few minutes

### Support Channels
- 🐛 **Issues**: [GitHub Issues](https://github.com/CodeDAO-org/codedao-extension/issues)
- 💬 **Community**: [GitHub Discussions](https://github.com/CodeDAO-org/codedao-extension/discussions)
- 📧 **Email**: support@codedao.org

---

## 🔮 Roadmap

### Phase 1: MVP (Current)
- ✅ VS Code Extension
- ✅ Base Network Integration  
- ✅ Basic Reward System
- ✅ Dashboard & Wallet Integration

### Phase 2: Enhanced Features
- 🔄 Multiple IDE Support (IntelliJ, Sublime, etc.)
- 🏆 Leaderboards & Achievements
- 🎮 Gamification Elements
- 📱 Mobile App Companion

### Phase 3: Ecosystem Expansion
- 🌐 Multi-chain Support (Ethereum, Polygon, etc.)
- 🤝 DeFi Integrations (Staking, Governance)
- 🏢 Enterprise Solutions
- 🌍 Global Developer DAO

---

## 💡 Why CodeDAO?

### For Developers
- **Earn while you code** - Turn coding time into tokens
- **Quality incentives** - Better code = more rewards
- **Community driven** - Shape the future of development
- **Skill recognition** - Transparent proof of coding activity

### For Projects
- **Attract talent** - Reward contributors directly
- **Quality assurance** - AI-powered code review
- **Transparent metrics** - Public coding activity tracking
- **Cost effective** - Automated reward distribution

### For the Ecosystem
- **Decentralized development** - No central authority
- **Open source friendly** - Rewards all contributions
- **AI-human collaboration** - Augmented development workflows
- **Data transparency** - All activity on-chain

---

## 🤝 Contributing

### Extension Development
```bash
git clone https://github.com/CodeDAO-org/codedao-extension
cd codedao-extension
npm install
npm run compile
npx vsce package
```

### Smart Contract Development
```bash
npm install
npx hardhat compile
npx hardhat test
npx hardhat deploy --network base
```

### Dashboard Development
All dashboard code is self-contained in `dashboard.html` with integrated:
- Wallet connection (Moralis v2)
- AI Agent control system
- Token approval management
- Real-time GitHub activity

---

## 📄 License & Legal

- **Extension**: MIT License
- **Smart Contracts**: MIT License  
- **Dashboard**: MIT License
- **Terms of Service**: [codedao.org/terms](https://codedao.org/terms)
- **Privacy Policy**: [codedao.org/privacy](https://codedao.org/privacy)

---

## 🎉 Launch Checklist

### Pre-Launch ✅
- [x] Extension packaged and tested
- [x] Smart contracts deployed to Base
- [x] Dashboard live with wallet integration
- [x] Install script functional
- [x] Reward calculation verified
- [x] Anti-gaming measures implemented

### Launch Day 🚀
- [ ] Announce on social media
- [ ] Share in developer communities
- [ ] Monitor for issues and feedback
- [ ] Provide community support
- [ ] Track adoption metrics

### Post-Launch 📈
- [ ] Gather user feedback
- [ ] Iterate based on usage data
- [ ] Plan feature enhancements
- [ ] Expand to additional platforms

---

**🌟 Ready to revolutionize how developers are rewarded?**

**Start now:** `curl -sSL https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/install-codedao.sh | bash`

**Track progress:** https://codedao-org.github.io/dashboard.html

**Built entirely by AI agents with human oversight** 🤖✨ 
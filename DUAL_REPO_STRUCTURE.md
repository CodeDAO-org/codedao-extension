# 🏗️ CodeDAO Dual Repository Structure

**Perfect Strategy**: Keep both repos with clear separation of concerns!

---

## 🎯 **Dual Repository Architecture**

### 🔧 **Extension Repository** 
**`https://github.com/CodeDAO-org/codedao-extension`**
**Purpose**: VS Code extension, tracking, claiming, smart contracts

```
📁 codedao-extension/
├── src/
│   ├── extension.ts          # Real-time tracking logic
│   └── claimRewards.ts       # Reward claiming system
├── contracts/                # Smart contracts (CodeDAO Token, Distributor)
├── install-codedao.sh       # One-click extension installer
├── package.json             # Extension manifest
├── hardhat.config.js        # Contract deployment config
├── tsconfig.json           # TypeScript config
├── codedao-0.0.1.vsix      # Extension package
├── docs/                   # Extension documentation
│   ├── MVP_LAUNCH_GUIDE.md
│   └── CODING_REWARD_SYSTEM_FAQ.md
└── README.md               # Extension-focused README
```

### 🌐 **Website Repository** 
**`https://github.com/CodeDAO-org/CodeDAO-org.github.io`**
**Purpose**: Main website, dashboard, web pages

```
📁 CodeDAO-org.github.io/
├── index.html              # Main CodeDAO website
├── dashboard.html          # Web dashboard (wallet integration)
├── peer-review.html        # Peer review page
├── tokenomics.html         # Tokenomics page
├── about.html              # About page
├── assets/                 # Website assets
│   ├── css/
│   ├── js/
│   └── images/
└── README.md               # Website-focused README
```

---

## 🔗 **How They Work Together**

### **Connection Points:**

#### 1. **Installation Flow**
```
User visits: https://codedao-org.github.io/
   ↓
Clicks "Install Extension"
   ↓
Runs: curl -sSL https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/install-codedao.sh | bash
   ↓
Extension installed from extension repo
```

#### 2. **Dashboard Integration**
```
Extension tracks coding
   ↓
User visits: https://codedao-org.github.io/dashboard.html
   ↓
Dashboard shows CODE balance & allows claiming
   ↓
Claims processed via contracts from extension repo
```

#### 3. **Smart Contract Interaction**
```
Contracts deployed from: extension repo
   ↓
Dashboard connects to: same contract addresses
   ↓
Extension claims via: same smart contracts
```

---

## 📋 **What Goes Where**

### ✅ **Extension Repo Contains:**
- **Code tracking logic** (`src/extension.ts`)
- **Reward claiming** (`src/claimRewards.ts`)
- **Smart contracts** (`contracts/`)
- **Installation script** (`install-codedao.sh`)
- **Extension packaging** (`package.json`, `.vsix`)
- **Contract deployment** (`hardhat.config.js`)
- **Extension documentation**

### ✅ **Website Repo Contains:**
- **Main CodeDAO website** (`index.html`)
- **Web dashboard** (`dashboard.html`)
- **Marketing pages** (about, tokenomics, etc.)
- **Website assets** (CSS, images, JS for web)
- **Web-specific documentation**

---

## 🔄 **Migration Plan: Keep Both**

### **Step 1: Move Extension Files** ✅
```bash
# Clone clean extension repo
git clone https://github.com/CodeDAO-org/codedao-extension.git ~/codedao-extension-clean

# Copy extension-specific files
cp -r /Users/mikaelo/codedao-extension/src ~/codedao-extension-clean/
cp -r /Users/mikaelo/codedao-extension/contracts ~/codedao-extension-clean/
cp /Users/mikaelo/codedao-extension/install-codedao.sh ~/codedao-extension-clean/
cp /Users/mikaelo/codedao-extension/package.json ~/codedao-extension-clean/
cp /Users/mikaelo/codedao-extension/hardhat.config.js ~/codedao-extension-clean/
cp /Users/mikaelo/codedao-extension/tsconfig.json ~/codedao-extension-clean/
```

### **Step 2: Keep Website Files** ✅
```bash
# Website files stay in CodeDAO-org.github.io
# dashboard.html already live at: https://codedao-org.github.io/dashboard.html
# Main website already live at: https://codedao-org.github.io/
```

### **Step 3: Update Cross-References**
```bash
# Update website to point to extension repo for installation
# Update extension README to point to website for dashboard
# Update documentation with correct repository links
```

---

## 🎯 **Benefits of Dual Repo Structure**

### **For Extension Development:**
- ✅ **Clean codebase** - Only extension code
- ✅ **Proper versioning** - Extension versions independent
- ✅ **Marketplace ready** - Standard VS Code structure
- ✅ **Smart contract focus** - Contracts with claiming logic

### **For Website Development:**
- ✅ **Web-focused** - Only website and dashboard code
- ✅ **GitHub Pages** - Optimized for static site hosting
- ✅ **Marketing content** - Focused on user acquisition
- ✅ **Dashboard features** - Web wallet integration

### **For Contributors:**
- ✅ **Clear separation** - Know exactly where to contribute
- ✅ **Focused repositories** - Extension devs vs web devs
- ✅ **Independent issues** - Separate issue trackers
- ✅ **Specialized CI/CD** - Different build processes

---

## 📊 **Repository Responsibilities**

| Feature | Extension Repo | Website Repo |
|---------|---------------|--------------|
| **VS Code Extension** | ✅ Primary | ❌ None |
| **Code Tracking** | ✅ Primary | ❌ None |
| **Smart Contracts** | ✅ Primary | ❌ None |
| **Installation Script** | ✅ Primary | 🔗 Links to |
| **Web Dashboard** | ❌ None | ✅ Primary |
| **Main Website** | ❌ None | ✅ Primary |
| **Marketing Pages** | ❌ None | ✅ Primary |
| **Documentation** | ✅ Extension docs | ✅ Website docs |

---

## 🔗 **Cross-Repository Links**

### **From Website → Extension:**
```html
<!-- In website pages -->
<a href="https://github.com/CodeDAO-org/codedao-extension">
  Install VS Code Extension
</a>

<!-- Installation button -->
<button onclick="installExtension()">
  Install CodeDAO Extension
</button>
<script>
function installExtension() {
  // Shows install command from extension repo
  alert('Run: curl -sSL https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/install-codedao.sh | bash');
}
</script>
```

### **From Extension → Website:**
```typescript
// In extension code
const DASHBOARD_URL = 'https://codedao-org.github.io/dashboard.html';

// Show user where to claim rewards
vscode.window.showInformationMessage(
  'Visit dashboard to claim rewards',
  'Open Dashboard'
).then(selection => {
  if (selection === 'Open Dashboard') {
    vscode.env.openExternal(vscode.Uri.parse(DASHBOARD_URL));
  }
});
```

---

## 🚀 **Deployment Strategy**

### **Extension Repo Deployment:**
```bash
# Extension development
cd ~/codedao-extension-clean
npm run compile
npx vsce package
git push origin main

# Users install via:
curl -sSL https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/install-codedao.sh | bash
```

### **Website Repo Deployment:**
```bash
# Website development
# Edit dashboard.html, push to main branch
# GitHub Pages auto-deploys to: https://codedao-org.github.io/

# Users visit:
https://codedao-org.github.io/dashboard.html
```

---

## 🎉 **Perfect Result**

### **For Users:**
- 🌐 **Visit website**: https://codedao-org.github.io/
- 📦 **Install extension**: One-click from extension repo
- 📝 **Code tracking**: Extension works in VS Code
- 💰 **Claim rewards**: Dashboard on website

### **For Developers:**
- 🔧 **Extension development**: Clear, focused repository
- 🌐 **Website development**: Separate, focused repository
- 📚 **Documentation**: Appropriate to each repository
- 🔄 **CI/CD**: Independent build pipelines

---

## 💡 **This is the IDEAL Structure**

**You're absolutely right to keep both repositories!**

- ✅ **Extension repo**: For all tracking, claiming, and smart contract logic
- ✅ **Website repo**: For dashboard, marketing, and web presence
- ✅ **Clear separation**: Each repository has a focused purpose
- ✅ **Professional organization**: Standard for software projects
- ✅ **Easy maintenance**: Contributors know exactly where to work

**This dual-repo approach is perfect for your MVP launch and long-term success!** 🚀 
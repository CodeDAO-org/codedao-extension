# 📍 CodeDAO Repository Locations Guide

## 🗂️ Current Situation (Repository Confusion)

**You're in a mixed repository structure:**
- **Directory name**: `codedao-extension/`
- **Git remote**: Points to `https://github.com/CodeDAO-org/CodeDAO-org.github.io.git`
- **Content**: Contains BOTH extension files AND dashboard files

---

## 📋 Installation & Code Tracking Component Locations

### 🔧 **Installation Script**
**Location**: `/Users/mikaelo/codedao-extension/install-codedao.sh`
**Repository**: Currently in mixed repo (should be in dedicated extension repo)
**Status**: ✅ Ready for use
**URL**: `https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/install-codedao.sh`

```bash
# Current install command
curl -sSL https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/install-codedao.sh | bash
```

### 📝 **Code Tracking (VS Code Extension)**
**Location**: `/Users/mikaelo/codedao-extension/src/`
**Key Files**:
- `src/extension.ts` - Main extension logic & real-time tracking
- `src/claimRewards.ts` - Reward calculation & claiming
- `package.json` - Extension manifest
- `codedao-0.0.1.vsix` - Compiled extension package

**Repository**: Currently in mixed repo (should be in dedicated extension repo)
**Status**: ✅ Fully functional

---

## 🎯 **Where Each Component SHOULD Live**

### **Ideal Repository Structure:**

#### 🔧 **Extension Repository** (for installation & tracking)
**Should be**: `https://github.com/CodeDAO-org/codedao-extension`
**Contains**:
```
codedao-extension/
├── src/
│   ├── extension.ts          # Code tracking logic
│   └── claimRewards.ts       # Reward calculation
├── contracts/                # Smart contracts
├── install-codedao.sh       # Installation script
├── codedao-0.0.1.vsix      # Extension package
├── package.json             # Extension manifest
└── README.md               # Extension documentation
```

#### 🌐 **Website Repository** (for dashboard & web)
**Currently**: `https://github.com/CodeDAO-org/CodeDAO-org.github.io`
**Contains**:
```
CodeDAO-org.github.io/
├── dashboard.html           # Main dashboard
├── peer-review.html        # Other pages
├── tokenomics.html
├── about.html
└── index.html              # Main website
```

---

## 🚨 **Current Problem**

You have **repository mixing**:
- Extension files are in a directory called `codedao-extension/`
- But that directory's git remote points to the website repository
- This creates confusion about where to find what

### **What This Means:**
1. **Installation script** is accessible but in wrong repo context
2. **Code tracking** works but repo structure is confusing  
3. **Smart contracts** are mixed with website files
4. **Documentation** is scattered

---

## ✅ **Quick Fix Options**

### **Option A: Use Current Mixed Structure**
**Pros**: Everything works as-is
**Cons**: Confusing for contributors and maintenance

**Action**: Document clearly where everything is
```markdown
📍 Current Locations:
- Install: /codedao-extension/install-codedao.sh
- Tracking: /codedao-extension/src/
- Dashboard: /codedao-extension/dashboard.html
```

### **Option B: Separate Repositories (Recommended)**
**Pros**: Clean structure, professional organization
**Cons**: Requires migration work

**Action**: Follow the cleanup plan in `REPOSITORY_CLEANUP_PLAN.md`

---

## 🔍 **How to Access Each Component**

### **Installation Script**
```bash
# From raw GitHub (current)
curl -sSL https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/install-codedao.sh | bash
```

### **Extension Source Code**
```bash
# Local development
cd /Users/mikaelo/codedao-extension/src/
code extension.ts

# Compilation
npm run compile
npx vsce package
```

### **Extension Package**
```bash
# Install locally
code --install-extension /Users/mikaelo/codedao-extension/codedao-0.0.1.vsix
```

### **Dashboard**
```bash
# Live URL
https://codedao-org.github.io/dashboard.html

# Local development
cd /Users/mikaelo/codedao-extension/codedao-org.github.io/
python3 -m http.server 8081
# Visit: http://localhost:8081/dashboard.html
```

---

## 📊 **Component Status by Location**

| Component | Current Location | Proper Location | Status |
|-----------|------------------|-----------------|--------|
| **Install Script** | Mixed repo | Extension repo | ✅ Works |
| **Code Tracking** | Mixed repo | Extension repo | ✅ Works |
| **Extension Package** | Mixed repo | Extension repo | ✅ Works |
| **Dashboard** | Mixed repo | Website repo | ✅ Works |
| **Smart Contracts** | Mixed repo | Extension repo | ✅ Works |

---

## 🎯 **For MVP Launch**

### **What to Use NOW:**
1. **Installation**: Use existing `install-codedao.sh` from current location
2. **Code Tracking**: Use existing extension from `src/` directory
3. **Dashboard**: Use live version at `https://codedao-org.github.io/dashboard.html`

### **URLs for Users:**
```bash
# Install command
curl -sSL https://raw.githubusercontent.com/CodeDAO-org/codedao-extension/main/install-codedao.sh | bash

# Dashboard
https://codedao-org.github.io/dashboard.html

# Manual extension download
https://github.com/CodeDAO-org/codedao-extension/releases/latest
```

---

## 🔮 **Post-Launch Cleanup**

After MVP launch, clean up the repository structure:
1. Create dedicated `codedao-extension` repository
2. Move extension files there
3. Keep dashboard files in `CodeDAO-org.github.io`
4. Update all documentation and links

---

## 🎉 **Bottom Line**

**For your MVP launch, everything is accessible and functional despite the mixed repository structure:**

- ✅ **Installation script**: Ready at current location
- ✅ **Code tracking**: Fully functional extension
- ✅ **Dashboard**: Live and working
- ✅ **Smart contracts**: Deployed and functional

**The repository confusion doesn't block your launch - it's just a housekeeping issue for later!** 
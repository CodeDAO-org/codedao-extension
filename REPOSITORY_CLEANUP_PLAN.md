# 🧹 CodeDAO Repository Cleanup Plan

## 🎯 Goal: Consolidate into Clean Monorepo Structure

### Current Issues
- ❌ Nested repositories (`codedao-org.github.io` inside `codedao-extension`)
- ❌ Scattered contracts across multiple folders
- ❌ Duplicate dashboard implementations
- ❌ Build artifacts committed to repo
- ❌ Unclear project structure

---

## 🏗️ Target Structure: CodeDAO Monorepo

```
CodeDAO/
├── .github/
│   ├── workflows/              # CI/CD pipelines
│   └── ISSUE_TEMPLATE/         # Issue templates
├── packages/
│   ├── extension/              # VS Code extension
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   ├── contracts/              # Smart contracts
│   │   ├── src/
│   │   ├── hardhat.config.js
│   │   └── README.md
│   ├── dashboard/              # Web dashboard
│   │   ├── src/
│   │   ├── package.json
│   │   └── README.md
│   └── shared/                 # Shared utilities
│       ├── types/
│       ├── constants/
│       └── utils/
├── apps/
│   └── website/                # Main website (codedao-org.github.io)
├── tools/
│   ├── deployment/             # Deployment scripts
│   ├── testing/               # Test utilities
│   └── build/                 # Build tools
├── docs/                      # Documentation
│   ├── user-guides/
│   ├── developer-docs/
│   └── api-reference/
├── package.json               # Root package.json
├── lerna.json                 # Lerna config (if using Lerna)
├── README.md                  # Main project README
└── .gitignore                 # Root gitignore
```

---

## 📋 Step-by-Step Migration Plan

### Phase 1: Prepare New Structure
1. Create new `CodeDAO` repository
2. Set up monorepo tooling (Lerna or npm workspaces)
3. Create folder structure
4. Set up shared TypeScript configs

### Phase 2: Migrate Extension
1. Move `src/`, `package.json` to `packages/extension/`
2. Update build scripts and paths
3. Test extension compilation
4. Update CI/CD workflows

### Phase 3: Migrate Contracts
1. Consolidate all contracts into `packages/contracts/`
2. Merge `contracts/`, `codedao-premium-contract/`
3. Update Hardhat configuration
4. Test contract compilation and deployment

### Phase 4: Migrate Dashboard
1. Extract dashboard to `packages/dashboard/`
2. Create proper build system
3. Remove inline CSS/JS, use proper bundling
4. Set up development server

### Phase 5: Migrate Website
1. Move `codedao-org.github.io` content to `apps/website/`
2. Set up GitHub Pages deployment from monorepo
3. Configure custom deployment workflow

### Phase 6: Clean Up
1. Remove old repositories
2. Update all documentation
3. Update GitHub references
4. Archive old repos

---

## 🔧 Technical Implementation

### Package.json (Root)
```json
{
  "name": "@codedao/monorepo",
  "private": true,
  "workspaces": [
    "packages/*",
    "apps/*"
  ],
  "scripts": {
    "build": "lerna run build",
    "test": "lerna run test",
    "dev": "lerna run dev --parallel",
    "deploy": "lerna run deploy"
  },
  "devDependencies": {
    "@lerna/cli": "^6.0.0",
    "typescript": "^4.9.0"
  }
}
```

### Lerna Configuration
```json
{
  "version": "independent",
  "npmClient": "npm",
  "command": {
    "publish": {
      "conventionalCommits": true,
      "registry": "https://registry.npmjs.org/"
    },
    "version": {
      "allowBranch": ["main", "release/*"]
    }
  }
}
```

### Shared TypeScript Config
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## 🚀 Benefits of New Structure

### Development Experience
- **Single `git clone`** - Get entire codebase
- **Shared dependencies** - No version conflicts
- **Cross-package imports** - Easy code sharing
- **Unified testing** - Test all packages together

### Deployment & CI/CD
- **Single pipeline** - Build and deploy everything
- **Atomic releases** - All packages stay in sync
- **Better caching** - Shared node_modules
- **Simplified workflows** - One set of GitHub Actions

### Maintenance
- **Single issue tracker** - All bugs and features in one place
- **Unified documentation** - Everything documented together
- **Easier onboarding** - New contributors see full picture
- **Better project overview** - Clear separation of concerns

---

## 🗓️ Migration Timeline

### Week 1: Setup & Planning
- [ ] Create new `CodeDAO` repository
- [ ] Set up monorepo tooling
- [ ] Create migration scripts
- [ ] Document current state

### Week 2: Core Migration
- [ ] Migrate extension package
- [ ] Migrate contracts package
- [ ] Set up shared utilities
- [ ] Update build systems

### Week 3: Dashboard & Website
- [ ] Migrate dashboard with proper bundling
- [ ] Move website to monorepo
- [ ] Set up GitHub Pages deployment
- [ ] Test all integrations

### Week 4: Cleanup & Polish
- [ ] Remove old repositories
- [ ] Update all documentation
- [ ] Set up automated releases
- [ ] Announce migration to community

---

## 🔄 Migration Commands

### Create New Repository Structure
```bash
mkdir CodeDAO && cd CodeDAO
git init
npm init -w packages/extension
npm init -w packages/contracts  
npm init -w packages/dashboard
npm init -w packages/shared
npm init -w apps/website
```

### Move Extension Code
```bash
cp -r ../codedao-extension/src packages/extension/
cp ../codedao-extension/package.json packages/extension/
cp ../codedao-extension/tsconfig.json packages/extension/
```

### Move Contracts
```bash
cp -r ../codedao-extension/contracts packages/contracts/src
cp ../codedao-extension/hardhat.config.js packages/contracts/
```

### Move Dashboard
```bash
cp -r ../codedao-extension/dashboard packages/dashboard/src
# Extract inline CSS/JS to separate files
```

---

## 📊 Repository Comparison

| Aspect | Current (Multi-repo) | Proposed (Monorepo) |
|--------|---------------------|-------------------|
| **Setup** | Multiple clones needed | Single clone |
| **Dependencies** | Duplicate across repos | Shared, deduplicated |
| **Versioning** | Manual coordination | Automatic sync |
| **CI/CD** | Multiple pipelines | Single pipeline |
| **Testing** | Separate test suites | Integrated testing |
| **Documentation** | Scattered | Centralized |
| **Issues** | Multiple trackers | Single tracker |
| **Releases** | Manual coordination | Atomic releases |

---

## 🎯 Success Criteria

### Technical Goals
- [ ] All packages build successfully
- [ ] Extension installs and works
- [ ] Contracts deploy to Base network
- [ ] Dashboard loads and connects wallets
- [ ] Website deploys to GitHub Pages

### Process Goals
- [ ] Single command builds everything
- [ ] Single command runs all tests
- [ ] Single command deploys everything
- [ ] Documentation is comprehensive
- [ ] New contributors can onboard easily

---

## 🚨 Risks & Mitigation

### Risk: GitHub Pages Deployment
**Mitigation**: Use GitHub Actions to build from monorepo and deploy to separate GitHub Pages repo

### Risk: Extension Publishing
**Mitigation**: Set up automated publishing from monorepo to VS Code marketplace

### Risk: Breaking Changes
**Mitigation**: Migrate incrementally, keep old repos until new structure is stable

### Risk: Community Confusion
**Mitigation**: Clear communication, migration guide, redirect old repos

---

## 📝 Next Steps

1. **Review this plan** with stakeholders
2. **Create new CodeDAO repository** on GitHub
3. **Set up monorepo tooling** (Lerna + npm workspaces)
4. **Start with extension migration** (lowest risk)
5. **Test thoroughly** before proceeding
6. **Migrate contracts** (medium risk)
7. **Migrate dashboard** (highest risk due to deployment)
8. **Clean up old repositories**

---

**🌟 The result will be a professional, maintainable codebase that scales with CodeDAO's growth and makes development much more efficient!** 
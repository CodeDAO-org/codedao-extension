# 💰 CodeDAO Coding Reward System - Technical FAQ

## ❓ Your Questions Answered

### 1. **Do we have a script that calculates codes they earn in real-time?**

✅ **YES - Real-time calculation is implemented!**

#### How it Works:
```typescript
// Extension tracks coding in real-time (src/extension.ts)
private analyzeCodeChanges(event: vscode.TextDocumentChangeEvent) {
    const text = document.getText();
    
    // Count lines (non-empty)
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    this.currentSession.linesOfCode = lines.length;
    
    // Count functions, classes, tests, comments
    // Updates status bar immediately
    this.updateStatusBar();
}
```

#### Real-time Tracking Features:
- **Lines of Code**: Counted instantly as you type
- **Functions**: Detects `function`, `def`, `fn` keywords
- **Classes**: Detects `class` declarations  
- **Tests**: Detects `test()`, `it()`, `describe()`, `@Test`
- **Comments**: Counts `//`, `/* */`, `#` comments
- **Status Bar**: Shows earning potential live

#### Current Calculation Rates:
```
Base Rate: 0.1 CODE per line
Function Bonus: +0.05 CODE each
Class Bonus: +0.1 CODE each  
Test Bonus: +0.2 CODE each
Comment Bonus: +0.01 CODE each
```

---

### 2. **Do we have script that evaluates what they can earn from various inputs?**

✅ **YES - Multiple evaluation methods!**

#### A) Extension Real-time Evaluation
```typescript
// Instant calculation in VS Code
private async calculatePotentialReward(): Promise<string> {
    return await this.rewardClaimer.calculateReward(this.currentSession);
}
```

#### B) Dashboard Calculator (`claim-rewards-widget.html`)
```javascript
function calculateRewards() {
    const lines = parseInt(document.getElementById('lines-input').value);
    const functions = parseInt(document.getElementById('functions-input').value);
    // ... calculates total reward in real-time
    const totalReward = baseReward + functionReward + classReward + testReward;
    return totalReward;
}
```

#### C) Smart Contract Calculator
```solidity
function calculatePotentialReward(
    uint256 linesOfCode,
    uint256 functionsWritten,
    uint256 classesWritten,
    uint256 testsWritten,
    uint256 commentsWritten
) external view returns (uint256) {
    // On-chain calculation for accuracy
}
```

#### Example Calculations:
```
Scenario 1: Simple Script
- 15 lines, 2 functions, 0 classes, 0 tests
- Reward: (15 × 0.1) + (2 × 0.05) = 1.60 CODE

Scenario 2: Full Feature
- 50 lines, 5 functions, 1 class, 3 tests  
- Reward: (50 × 0.1) + (5 × 0.05) + (1 × 0.1) + (3 × 0.2) = 5.95 CODE

Scenario 3: Test-Heavy Development
- 100 lines, 10 functions, 2 classes, 15 tests
- Reward: (100 × 0.1) + (10 × 0.05) + (2 × 0.1) + (15 × 0.2) = 13.70 CODE
```

---

### 3. **Is their code open source by default and shared on the platform?**

❌ **NO - Code is PRIVATE by default!**

#### Privacy-First Design:
- **No Code Sharing**: Extension doesn't upload or share your actual code
- **Local Processing**: All analysis happens locally in VS Code
- **Hash-Only Submission**: Only cryptographic hashes are sent to blockchain
- **No Platform Sharing**: Code doesn't appear on any public platform

#### What IS Shared:
```
✅ Coding Metrics Only:
- Number of lines written
- Number of functions created  
- Number of classes created
- Number of tests written
- Cryptographic hash of code (for anti-gaming)

❌ Never Shared:
- Actual source code content
- File names or paths
- Project details
- Personal information
```

#### Smart Contract Data:
```solidity
// Only these metrics are recorded on-chain
event RewardClaimed(
    address indexed developer,
    uint256 linesOfCode,        // Number only
    uint256 functions,          // Number only  
    uint256 classes,           // Number only
    uint256 tests,             // Number only
    bytes32 codeHash,          // Hash only
    uint256 totalReward
);
```

#### Optional Sharing (Future):
- **AI Agent Integration**: Opt-in code sharing for AI assistance
- **Code Review**: Optional sharing for peer review rewards
- **Open Source Bonus**: Extra rewards for public repositories
- **Team Collaboration**: Sharing within private teams

---

### 4. **When does the cutoff time happen to claim CODE tokens?**

⏰ **Flexible Timing - User Controls When to Claim!**

#### Current Implementation:
```
Trigger: MANUAL (User-initiated)
Method: Click "Claim Rewards" button
Location: VS Code or Dashboard
```

#### Claim Timing Options:

**A) Real-time Manual Claims**
```typescript
// User clicks when ready
async claimRewards() {
    if (this.currentSession.linesOfCode === 0) {
        vscode.window.showWarningMessage('No code to claim rewards for!');
        return;
    }
    // Process claim immediately
}
```

**B) Session-Based Claims**
- After completing a coding session
- When switching projects  
- End of workday
- User decides timing

**C) Automatic Triggers (Future Enhancement)**
```javascript
// Potential auto-claim scenarios
const autoClaimTriggers = {
    timeInterval: '4 hours',           // Every 4 hours
    codeThreshold: '100 lines',        // After 100 lines
    inactivityPeriod: '30 minutes',    // After stopping coding
    projectCompletion: 'git commit',   // After git commits
    dailyLimit: 'approaching limit'    // Before hitting daily cap
};
```

#### Cooldown Protection:
```
⏱️ Minimum Wait: 1 hour between claims
📊 Daily Limit: 50 CODE tokens maximum  
🛡️ Anti-Gaming: Code hash prevents duplicates
```

#### Claim Process Flow:
```
1. Developer codes in VS Code
   ↓
2. Extension tracks metrics in real-time
   ↓  
3. Status bar shows potential earnings
   ↓
4. Developer clicks "Claim Rewards" (when ready)
   ↓
5. Extension generates code hash
   ↓
6. Smart contract validates & processes
   ↓
7. CODE tokens sent to wallet
   ↓
8. Session resets for next claim
```

---

## 🎯 **Summary: How The System Works**

### Real-Time Tracking ✅
- **Live calculation** as you code
- **Status bar display** of current earnings
- **Multi-language support** (JS, Python, Java, Rust, etc.)
- **Local processing** - no code leaves your machine

### Reward Evaluation ✅  
- **Extension calculator** - Real-time in VS Code
- **Dashboard calculator** - Web-based estimation
- **Smart contract calculator** - On-chain verification
- **Multiple scenarios** supported

### Privacy Protection ✅
- **Code stays private** - never shared by default
- **Metrics only** sent to blockchain  
- **Cryptographic hashes** for security
- **Opt-in sharing** for future features

### Flexible Claiming ✅
- **User-controlled timing** - claim when ready
- **Session-based** - after coding sessions
- **Cooldown protection** - 1 hour minimum
- **Daily limits** - 50 CODE maximum

---

## 🔮 **Future Enhancements**

### Smart Triggers
- **Git integration** - Claim on commits/pushes  
- **IDE events** - Claim on file save/project close
- **Time-based** - Auto-claim every X hours
- **Threshold-based** - Auto-claim at X lines

### Advanced Privacy
- **Granular controls** - Choose what to share
- **Team modes** - Private team sharing
- **Public opt-in** - Bonus for open source
- **Anonymous metrics** - Contribute to research

### Enhanced Tracking
- **Code quality metrics** - Complexity analysis
- **Refactoring rewards** - Improving existing code
- **Documentation bonuses** - README, comments
- **Bug fix multipliers** - Extra rewards for fixes

---

**🌟 The system is designed to be privacy-first, user-controlled, and transparently rewarding quality coding work!** 
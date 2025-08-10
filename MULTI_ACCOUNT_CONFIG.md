# 🤖 Multi-Account Twitter Bot Configuration

## 📋 **Setup Process for Additional Accounts**

### **Step 1: Twitter Developer Setup**
For each new account:
1. **Apply for Twitter Developer Account** for the new username
2. **Create new Twitter App** in the developer portal
3. **Generate API credentials** (API Key, Secret, Access Token, Secret)
4. **Set permissions** to "Read and Write" 

### **Step 2: Environment Variables**
Add to `.env` file:
```bash
# Account 1 (CRG) - Already configured
TWITTER_CRG_API_KEY=JkvwT9YcEWSuK56ud6EibGTr6
TWITTER_CRG_API_SECRET=azaWRbfTUUVHU02eO9sI2kvbMtEqWgjvWI5ASKkBDVMVyDLfXn
TWITTER_CRG_ACCESS_TOKEN=1879605233493405696-3584SP9SLewXUCZOaCOBmMfS7WYNg0
TWITTER_CRG_ACCESS_TOKEN_SECRET=F1Krlkoq10358joaLW2yXiP4vGrudysB7ccIzhIp27eil

# Account 2 (New account)
TWITTER_ACCOUNT2_USERNAME=YourSecondAccount
TWITTER_ACCOUNT2_API_KEY=your_api_key_here
TWITTER_ACCOUNT2_API_SECRET=your_api_secret_here
TWITTER_ACCOUNT2_ACCESS_TOKEN=your_access_token_here
TWITTER_ACCOUNT2_ACCESS_TOKEN_SECRET=your_access_token_secret_here

# Account 3 (Optional)
TWITTER_ACCOUNT3_USERNAME=YourThirdAccount
TWITTER_ACCOUNT3_API_KEY=your_api_key_here
# ... and so on
```

### **Step 3: GitHub Secrets**
Add to GitHub repository secrets:
```
TWITTER_CRG_API_KEY
TWITTER_CRG_API_SECRET
TWITTER_CRG_ACCESS_TOKEN
TWITTER_CRG_ACCESS_TOKEN_SECRET

TWITTER_ACCOUNT2_USERNAME
TWITTER_ACCOUNT2_API_KEY
TWITTER_ACCOUNT2_API_SECRET
TWITTER_ACCOUNT2_ACCESS_TOKEN
TWITTER_ACCOUNT2_ACCESS_TOKEN_SECRET
```

### **Step 4: Account Configuration**
Create `src/accounts-config.js`:
```javascript
const accountsConfig = {
  CRG: {
    username: 'CRG',
    strategy: 'hybrid',
    content_focus: 'web3_development',
    posting_schedule: {
      daily_stats: '09:00',
      educational_tips: ['10:00', '15:00'],
      engagement_questions: '13:00',
      success_stories: '16:00'
    },
    engagement_settings: {
      target_hashtags: ['#coding', '#web3', '#development', '#blockchain'],
      target_users: ['@developers', '@web3community'],
      auto_like_probability: 0.3,
      auto_reply_probability: 0.2,
      max_follows_per_day: 50
    },
    content_themes: [
      'CodeDAO platform updates',
      'Web3 development tips',
      'Community highlights',
      'Coding best practices'
    ]
  },
  
  ACCOUNT2: {
    username: process.env.TWITTER_ACCOUNT2_USERNAME,
    strategy: 'scheduled_only',
    content_focus: 'ai_startup',
    posting_schedule: {
      daily_stats: '10:00',
      educational_tips: ['12:00', '17:00'],
      engagement_questions: '14:00',
      success_stories: '18:00'
    },
    engagement_settings: {
      target_hashtags: ['#AI', '#startup', '#innovation', '#tech'],
      target_users: ['@startups', '@airesearchers'],
      auto_like_probability: 0.2,
      auto_reply_probability: 0.1,
      max_follows_per_day: 30
    },
    content_themes: [
      'AI industry insights',
      'Startup growth tips',
      'Technology trends',
      'Innovation updates'
    ]
  }
};

module.exports = accountsConfig;
```

## 🔧 **Implementation Architecture**

### **Enhanced TwitterBot Class**
```javascript
class MultiAccountTwitterBot {
  constructor() {
    this.accounts = new Map();
    this.schedulers = new Map();
    this.analytics = new Map();
  }

  async initializeAccount(accountName, config) {
    const twitterClient = new TwitterApi({
      appKey: config.api_key,
      appSecret: config.api_secret,
      accessToken: config.access_token,
      accessSecret: config.access_token_secret
    });

    this.accounts.set(accountName, {
      client: twitterClient,
      config: config,
      lastActivity: new Date(),
      stats: {
        posts_today: 0,
        likes_today: 0,
        follows_today: 0,
        replies_today: 0
      }
    });
  }

  async postToAccount(accountName, content) {
    const account = this.accounts.get(accountName);
    if (!account) throw new Error(`Account ${accountName} not found`);

    // Check rate limits
    if (!this.checkRateLimit(accountName, 'posts')) {
      throw new Error(`Rate limit exceeded for ${accountName}`);
    }

    const result = await account.client.v2.tweet(content);
    account.stats.posts_today++;
    
    // Log to account-specific analytics
    await this.logActivity(accountName, 'post', result);
    
    return result;
  }

  async engageWithAccount(accountName, targetTweet) {
    const account = this.accounts.get(accountName);
    if (!account) return;

    const strategy = account.config.strategy;
    
    switch (strategy) {
      case 'hybrid':
        await this.hybridEngagement(accountName, targetTweet);
        break;
      case 'scheduled_only':
        // No real-time engagement
        break;
      case 'aggressive':
        await this.aggressiveEngagement(accountName, targetTweet);
        break;
    }
  }
}
```

### **Multi-Account Dashboard**
```javascript
// Enhanced analytics endpoint
app.get('/analytics/:account?', async (req, res) => {
  const accountName = req.params.account;
  
  if (accountName) {
    // Single account analytics
    const analytics = await getAccountAnalytics(accountName);
    res.json(analytics);
  } else {
    // All accounts overview
    const allAccounts = await getAllAccountsAnalytics();
    res.json(allAccounts);
  }
});

// Account management endpoints
app.get('/accounts', (req, res) => {
  const accountsList = Array.from(this.accounts.keys()).map(name => ({
    name,
    status: this.accounts.get(name).status,
    last_activity: this.accounts.get(name).lastActivity,
    posts_today: this.accounts.get(name).stats.posts_today
  }));
  res.json(accountsList);
});

app.post('/accounts/:account/action', async (req, res) => {
  const { account } = req.params;
  const { action, content } = req.body;
  
  try {
    let result;
    switch (action) {
      case 'post':
        result = await this.postToAccount(account, content);
        break;
      case 'pause':
        result = await this.pauseAccount(account);
        break;
      case 'resume':
        result = await this.resumeAccount(account);
        break;
    }
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

## 🎨 **Dashboard UI Updates**

### **Multi-Account Dashboard HTML**
```html
<!-- Account Selection Tabs -->
<div class="account-tabs">
  <button class="tab-btn active" onclick="switchAccount('overview')">📊 Overview</button>
  <button class="tab-btn" onclick="switchAccount('CRG')">🎯 @CRG</button>
  <button class="tab-btn" onclick="switchAccount('ACCOUNT2')">🚀 @Account2</button>
  <button class="tab-btn" onclick="addAccount()">➕ Add Account</button>
</div>

<!-- Account-specific dashboard content -->
<div id="account-dashboard">
  <!-- Dynamic content based on selected account -->
</div>

<script>
function switchAccount(accountName) {
  // Update UI for selected account
  if (accountName === 'overview') {
    loadOverviewDashboard();
  } else {
    loadAccountDashboard(accountName);
  }
}

async function loadAccountDashboard(accountName) {
  const data = await fetch(`/analytics/${accountName}`).then(r => r.json());
  renderAccountSpecificDashboard(accountName, data);
}

function renderAccountSpecificDashboard(accountName, data) {
  document.getElementById('account-dashboard').innerHTML = `
    <div class="account-header">
      <h2>@${accountName} Analytics</h2>
      <div class="account-controls">
        <button onclick="pauseAccount('${accountName}')">⏸️ Pause</button>
        <button onclick="postNow('${accountName}')">📝 Post Now</button>
        <button onclick="updateStrategy('${accountName}')">⚙️ Settings</button>
      </div>
    </div>
    
    <!-- Account-specific metrics -->
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>📊 Today's Activity</h3>
        <div class="metric-value">${data.posts_today}</div>
        <div class="metric-label">Posts</div>
      </div>
      
      <div class="metric-card">
        <h3>💬 Engagement</h3>
        <div class="metric-value">${data.engagement_rate}%</div>
        <div class="metric-label">Rate</div>
      </div>
      
      <div class="metric-card">
        <h3>👥 Growth</h3>
        <div class="metric-value">+${data.followers_gained}</div>
        <div class="metric-label">Followers</div>
      </div>
    </div>
  `;
}
</script>
```

## 📋 **Quick Setup Process**

### **For Adding a Second Account:**

1. **Get Twitter API credentials** for the new account
2. **Add environment variables** for the new account
3. **Update GitHub secrets** with new credentials
4. **Configure account settings** in `accounts-config.js`
5. **Deploy updated bot** via GitHub Actions
6. **Test multi-account dashboard**

### **Estimated Time:**
- **API Setup:** 30 minutes (Twitter developer approval)
- **Code Implementation:** 2-3 hours
- **Testing & Deployment:** 1 hour

**Total:** ~4 hours for complete multi-account setup

## 🎯 **Benefits of Multi-Account Setup**

### **Diversified Reach:**
- Different audiences per account
- Specialized content strategies
- Risk distribution across accounts

### **Advanced Analytics:**
- Cross-account performance comparison
- A/B testing different strategies
- Consolidated reporting

### **Scalable Management:**
- Centralized dashboard for all accounts
- Individual account controls
- Unified scheduling system

Would you like me to implement this multi-account system for your bot? 
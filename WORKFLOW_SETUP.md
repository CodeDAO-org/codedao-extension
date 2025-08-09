# 🚀 CodeDAO Twitter Bot - GitHub Actions Workflow Setup

This guide will help you set up automated deployment and monitoring for your Twitter bot using GitHub Actions.

## 📋 Prerequisites

1. **GitHub Repository** with the Twitter bot code
2. **Twitter API Credentials** (already have ✅)
3. **GitHub Repository Admin Access** to configure secrets

## 🔐 Step 1: Configure GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions**

### Required Secrets:

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `TWITTER_API_KEY` | Your Twitter API Key | `JkvwT9YcEWSuK56ud6EibGTr6` |
| `TWITTER_API_SECRET` | Your Twitter API Secret | `azaWRbfTUUVHU02eO9sI2kvbMtEqWgjvWI5ASKkBDVMVyDLfXn` |
| `TWITTER_ACCESS_TOKEN` | Your Twitter Access Token | `1879605233493405696-3584SP9SLewXUCZOaCOBmMfS7WYNg0` |
| `TWITTER_ACCESS_TOKEN_SECRET` | Your Twitter Access Token Secret | `F1Krlkoq10358joaLW2yXiP4vGrudysB7ccIzhIp27eil` |
| `TWITTER_TARGET_USERNAME` | Target Twitter handle (without @) | `CRG` |

### Optional Secrets (for enhanced features):

| Secret Name | Description | Example Value |
|-------------|-------------|---------------|
| `BOT_USERNAME` | Bot display name | `CodeDAOBot` |
| `MONGODB_URI` | MongoDB connection string | `mongodb+srv://user:pass@cluster.mongodb.net/codedao` |
| `OPENAI_API_KEY` | OpenAI API key for LLM features | `sk-...` |
| `CODEDAO_DASHBOARD_URL` | Your dashboard URL | `https://codedao.org/dashboard` |
| `CODEDAO_API_URL` | Your API endpoint | `https://api.codedao.org` |

## 🛠️ Step 2: Add Secrets to GitHub

1. **Navigate to Repository Settings:**
   ```
   Your Repo → Settings → Secrets and variables → Actions
   ```

2. **Click "New repository secret"**

3. **Add each secret:**
   ```bash
   Name: TWITTER_API_KEY
   Secret: JkvwT9YcEWSuK56ud6EibGTr6
   ```

4. **Repeat for all required secrets**

## 🎯 Step 3: Workflow Capabilities

### 🚀 **Automatic Triggers:**

- **Push to main/develop** → Runs tests + deploys
- **Pull Requests** → Runs tests only
- **Every 6 hours** → Health check
- **Monday 9 AM UTC** → Weekly analytics report

### 🎮 **Manual Actions:**

Access via: **Actions** tab → **CodeDAO Twitter Bot - Deploy & Monitor** → **Run workflow**

| Action | Description |
|--------|-------------|
| `deploy` | Full deployment with health check |
| `health_check` | Quick health verification |
| `restart_bot` | Restart bot instance |
| `analytics_report` | Generate performance report |
| `test_credentials` | Verify Twitter API access |
| `emergency_stop` | Emergency shutdown |

## 📊 Step 4: Understanding Workflow Outputs

### ✅ **Successful Deployment:**
```
✅ Bot deployed successfully
✅ Analytics working
✅ Health check passed
```

### 📈 **Weekly Analytics Report:**
```
📊 CODEDAO TWITTER BOT - WEEKLY REPORT
=====================================
🎯 OVERVIEW:
- Total Posts: 45
- Bot Uptime: 168 hours
- Engagement Rate: 3.2 %

📈 GROWTH:
- Posts This Week: 12
- Top Performing Content: educational_content

🔥 TOP HASHTAGS:
1. #coding (15 uses)
2. #web3 (12 uses)
3. #development (8 uses)
```

### 🚨 **Error Handling:**
- Automatic retry on transient failures
- Detailed error logs in **Actions** tab
- Artifact uploads for debugging

## 🔧 Step 5: Advanced Configuration

### **Environment-Specific Deployment:**

```yaml
# Deploy to different environments
environment: 'production'  # or 'staging', 'development'
```

### **Custom Scheduling:**

Edit `.github/workflows/twitter-bot-deploy.yml`:

```yaml
schedule:
  # Custom schedule (every 4 hours)
  - cron: '0 */4 * * *'
```

### **Notification Integration:**

Add to workflow steps:
```yaml
- name: Send Slack Notification
  if: failure()
  run: |
    curl -X POST -H 'Content-type: application/json' \
    --data '{"text":"🚨 Twitter Bot Failed!"}' \
    ${{ secrets.SLACK_WEBHOOK_URL }}
```

## 🔍 Step 6: Monitoring & Troubleshooting

### **View Workflow Logs:**
1. Go to **Actions** tab
2. Click on latest workflow run
3. Expand any step to see detailed logs

### **Common Issues:**

| Issue | Solution |
|-------|----------|
| `Invalid Twitter credentials` | Verify secrets are correct |
| `Health check failed` | Check bot startup logs |
| `MongoDB connection failed` | Verify MONGODB_URI secret |
| `Rate limit exceeded` | Normal - bot will retry |

### **Debug Mode:**

Add this secret for verbose logging:
```
DEBUG_MODE: true
```

## 🎉 Step 7: First Deployment

1. **Add all required secrets** ✅
2. **Commit workflow file** to main branch
3. **Go to Actions tab**
4. **Click "Run workflow"**
5. **Select "deploy" action**
6. **Choose "production" environment**
7. **Click "Run workflow"**

### **What Happens:**
1. Code checkout & dependency installation
2. Twitter API credentials test
3. Bot deployment & health check
4. Analytics endpoint verification
5. Success notification

## 📚 Additional Resources

### **Workflow File Location:**
```
.github/workflows/twitter-bot-deploy.yml
```

### **Local Testing:**
```bash
# Test credentials locally first
cd twitter_bot
node test-credentials.js
```

### **Manual Health Check:**
```bash
# Test bot health
npm run test:health
```

## 🔒 Security Best Practices

1. **Never commit secrets** to code
2. **Use repository secrets** only
3. **Limit workflow permissions**
4. **Regular security scans** (included in workflow)
5. **Monitor access logs**

## 🚀 Next Steps

After setup:
1. ✅ Test manual deployment
2. ✅ Verify health checks work
3. ✅ Monitor first week analytics
4. ✅ Set up notification channels
5. ✅ Schedule regular monitoring

---

## 🆘 Need Help?

- **GitHub Actions logs** → Detailed error information
- **Bot health endpoint** → `http://your-bot-url/health`
- **Analytics dashboard** → `http://your-bot-url/dashboard`

Your Twitter bot will now be **fully automated** with professional CI/CD! 🎯 
# Serverless Reddit Bot Deployment

## 🚀 Deployment Options

### 1. **AWS Lambda + EventBridge** (Recommended)

```bash
# Install Serverless Framework
npm install -g serverless

# Create serverless.yml
cat > serverless.yml << EOF
service: codedao-reddit-bot

provider:
  name: aws
  runtime: python3.9
  environment:
    REDDIT_CLIENT_ID: \${env:REDDIT_CLIENT_ID}
    REDDIT_CLIENT_SECRET: \${env:REDDIT_CLIENT_SECRET}
    REDDIT_USERNAME: \${env:REDDIT_USERNAME}
    REDDIT_PASSWORD: \${env:REDDIT_PASSWORD}
    REDDIT_USER_AGENT: \${env:REDDIT_USER_AGENT}
    REDDIT_SUBREDDIT: \${env:REDDIT_SUBREDDIT}

functions:
  weeklyThread:
    handler: reddit_bot.serverless_handler.lambda_handler
    events:
      - schedule: cron(0 9 ? * MON *)  # Monday 9 AM UTC
    environment:
      REDDIT_SERVERLESS: true

  milestonePost:
    handler: reddit_bot.serverless_handler.lambda_handler
    events:
      - http:
          path: milestone
          method: post

  analytics:
    handler: reddit_bot.serverless_handler.lambda_handler
    events:
      - http:
          path: analytics
          method: get

plugins:
  - serverless-python-requirements
EOF

# Deploy
serverless deploy
```

### 2. **Vercel Functions**

```bash
# Install Vercel CLI
npm install -g vercel

# Create vercel.json
cat > vercel.json << EOF
{
  "functions": {
    "api/reddit-bot.py": {
      "runtime": "python3.9"
    }
  },
  "crons": [
    {
      "path": "/api/reddit-bot?action=weekly_thread",
      "schedule": "0 9 * * 1"
    }
  ],
  "env": {
    "REDDIT_CLIENT_ID": "@reddit_client_id",
    "REDDIT_CLIENT_SECRET": "@reddit_client_secret",
    "REDDIT_USERNAME": "@reddit_username",
    "REDDIT_PASSWORD": "@reddit_password",
    "REDDIT_USER_AGENT": "@reddit_user_agent",
    "REDDIT_SUBREDDIT": "@reddit_subreddit"
  }
}
EOF

# Create API endpoint
mkdir -p api
cp reddit_bot/serverless_handler.py api/reddit-bot.py

# Deploy
vercel --prod
```

### 3. **GitHub Actions** (Free!)

```yaml
# .github/workflows/reddit-bot.yml
name: Reddit Bot Automation

on:
  schedule:
    - cron: '0 9 * * 1'  # Monday 9 AM UTC
  workflow_dispatch:  # Manual trigger

jobs:
  weekly-thread:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.9'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      
      - name: Run weekly thread
        env:
          REDDIT_CLIENT_ID: \${{ secrets.REDDIT_CLIENT_ID }}
          REDDIT_CLIENT_SECRET: \${{ secrets.REDDIT_CLIENT_SECRET }}
          REDDIT_USERNAME: \${{ secrets.REDDIT_USERNAME }}
          REDDIT_PASSWORD: \${{ secrets.REDDIT_PASSWORD }}
          REDDIT_USER_AGENT: \${{ secrets.REDDIT_USER_AGENT }}
          REDDIT_SUBREDDIT: \${{ secrets.REDDIT_SUBREDDIT }}
        run: |
          python -c "
          from reddit_bot.bot import CodeDAOBot
          bot = CodeDAOBot()
          bot.post_weekly_thread()
          "
```

### 4. **Render Cron Jobs**

```bash
# Create render.yaml
cat > render.yaml << EOF
services:
  - type: cron
    name: reddit-bot-weekly
    env: python
    schedule: "0 9 * * 1"  # Monday 9 AM
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python -c 'from reddit_bot.bot import CodeDAOBot; CodeDAOBot().post_weekly_thread()'"
    envVars:
      - key: REDDIT_CLIENT_ID
        sync: false
      - key: REDDIT_CLIENT_SECRET
        sync: false
      - key: REDDIT_USERNAME
        sync: false
      - key: REDDIT_PASSWORD
        sync: false
      - key: REDDIT_USER_AGENT
        value: "CodeDAO Bot v1.0 by u/CodeDAOAgent"
      - key: REDDIT_SUBREDDIT
        value: "CodeDAO"
EOF
```

## 💰 Cost Comparison

| Platform | Cost | Pros | Cons |
|----------|------|------|------|
| **GitHub Actions** | FREE (2000 min/month) | No setup, integrated | Limited to public repos |
| **AWS Lambda** | ~$0.20/month | Reliable, scalable | Complex setup |
| **Vercel** | FREE (100 executions) | Easy deployment | Limited free tier |
| **Render** | $7/month | Simple, reliable | Not truly serverless |

## 🔧 Configuration

All platforms use the same environment variables:

```bash
REDDIT_CLIENT_ID=your_app_id
REDDIT_CLIENT_SECRET=your_secret
REDDIT_USERNAME=CodeDAOAgent
REDDIT_PASSWORD=your_password
REDDIT_USER_AGENT=CodeDAO Bot v1.0 by u/CodeDAOAgent
REDDIT_SUBREDDIT=CodeDAO

# Optional customization
REDDIT_WEEKLY_DAY=monday
REDDIT_WEEKLY_TIME=09:00
REDDIT_SERVERLESS=true
``` 
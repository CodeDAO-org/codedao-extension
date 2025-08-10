#!/usr/bin/env node

/**
 * CodeDAO Telegram Bot Admin Setup
 * Configures admin access for @codedaoorg
 */

const fs = require('fs');
const path = require('path');

console.log('🤖 Setting up CodeDAO Telegram Bot Admin Access...');
console.log('👤 Admin: @codedaoorg');
console.log('');

// Configuration for @codedaoorg
const adminConfig = {
  ADMIN_TELEGRAM_USERNAME: 'codedaoorg',
  BOT_USERNAME: 'CodeDAOBot',
  ADMIN_WHITELIST: 'codedaoorg'
};

// Update serverless .env.example
const serverlessEnvPath = path.join(__dirname, 'serverless', '.env.example');
if (fs.existsSync(serverlessEnvPath)) {
  let envContent = fs.readFileSync(serverlessEnvPath, 'utf8');
  
  envContent = envContent.replace(
    /ADMIN_TELEGRAM_USERNAME=.*/,
    `ADMIN_TELEGRAM_USERNAME=${adminConfig.ADMIN_TELEGRAM_USERNAME}`
  );
  
  envContent = envContent.replace(
    /ADMIN_WHITELIST=.*/,
    `ADMIN_WHITELIST=${adminConfig.ADMIN_WHITELIST}`
  );
  
  fs.writeFileSync(serverlessEnvPath, envContent);
  console.log('✅ Updated serverless/.env.example');
}

// Create deployment environment file
const deploymentEnv = `# CodeDAO Telegram Bot - Production Environment
# Configured for admin: @${adminConfig.ADMIN_TELEGRAM_USERNAME}

# Core Configuration
BOT_TOKEN=\${BOT_TOKEN}
BOT_USERNAME=${adminConfig.BOT_USERNAME}
ADMIN_TELEGRAM_USERNAME=${adminConfig.ADMIN_TELEGRAM_USERNAME}

# GitHub Integration
GITHUB_TOKEN=\${GITHUB_TOKEN}

# CodeDAO Integration  
CODEDAO_DASHBOARD_URL=https://codedao-org.github.io/dashboard.html
CODEDAO_API_URL=https://api.codedao.org
CODEDAO_GITHUB_URL=https://github.com/CodeDAO-org/codedao-extension

# Smart Contract (Optional)
CONTRACT_ADDRESS=\${CONTRACT_ADDRESS}
RPC_URL=https://mainnet.base.org

# Vercel Deployment
VERCEL_URL=\${VERCEL_URL}

# Security
ADMIN_WHITELIST=${adminConfig.ADMIN_WHITELIST}
RATE_LIMIT_ENABLED=true

# Features
ANALYTICS_ENABLED=true
REFERRAL_SYSTEM_ENABLED=true
`;

fs.writeFileSync(path.join(__dirname, 'serverless', '.env.production'), deploymentEnv);
console.log('✅ Created .env.production');

// Create admin quick access script
const adminScript = `#!/bin/bash

# CodeDAO Telegram Bot - Admin Quick Access
# For: @${adminConfig.ADMIN_TELEGRAM_USERNAME}

echo "🤖 CodeDAO Telegram Bot Admin Panel"
echo "👤 Admin: @${adminConfig.ADMIN_TELEGRAM_USERNAME}"
echo ""

# Check if deployed
if command -v vercel &> /dev/null; then
    DEPLOYMENT_URL=$(vercel ls 2>/dev/null | grep "codedao-telegram-bot" | head -1 | awk '{print $2}')
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        echo "🌐 Bot URL: https://$DEPLOYMENT_URL"
        echo "📝 Admin Interface: https://$DEPLOYMENT_URL/message-interface"
        echo "🔗 Webhook: https://$DEPLOYMENT_URL/webhook"
        echo ""
    fi
fi

echo "🚀 Quick Commands:"
echo "  vercel deploy                    # Deploy to production"
echo "  vercel env add ADMIN_TELEGRAM_USERNAME  # Set admin username"
echo "  vercel env add BOT_TOKEN         # Set bot token"
echo "  vercel env add GITHUB_TOKEN      # Set GitHub token"
echo ""

echo "📋 Setup Checklist:"
echo "  [ ] Get bot token from @BotFather"
echo "  [ ] Set webhook: https://api.telegram.org/bot<TOKEN>/setWebhook?url=<VERCEL_URL>/webhook"
echo "  [ ] Configure bot commands with @BotFather"
echo "  [ ] Test admin access: /admin"
echo ""

echo "🔧 Bot Commands to set with @BotFather:"
echo "start - 🚀 Start using CodeDAO Bot"
echo "connect - 🔗 Connect your wallet"
echo "stats - 📊 View your statistics"
echo "invite - 👥 Invite friends and earn bonuses"
echo "claim - 💰 Claim your CODE tokens"
echo "help - ❓ Get help and commands"
`;

fs.writeFileSync(path.join(__dirname, 'admin-access.sh'), adminScript);
fs.chmodSync(path.join(__dirname, 'admin-access.sh'), '755');
console.log('✅ Created admin-access.sh');

// Create Vercel deployment config
const vercelConfig = {
  "name": "codedao-telegram-bot",
  "version": 2,
  "builds": [
    {
      "src": "serverless/api/**/*.js",
      "use": "@vercel/node"
    },
    {
      "src": "serverless/public/**/*",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    {
      "src": "/webhook",
      "dest": "/serverless/api/webhook.js"
    },
    {
      "src": "/admin/(.*)",
      "dest": "/serverless/api/admin.js"
    },
    {
      "src": "/message-interface",
      "dest": "/serverless/public/message-interface.html"
    },
    {
      "src": "/",
      "dest": "/serverless/public/index.html"
    }
  ],
  "env": {
    "BOT_TOKEN": "@bot_token",
    "GITHUB_TOKEN": "@github_token",
    "ADMIN_TELEGRAM_USERNAME": adminConfig.ADMIN_TELEGRAM_USERNAME,
    "CONTRACT_ADDRESS": "@contract_address",
    "RPC_URL": "@rpc_url"
  },
  "functions": {
    "serverless/api/**/*.js": {
      "maxDuration": 30
    }
  }
};

fs.writeFileSync(path.join(__dirname, 'vercel.json'), JSON.stringify(vercelConfig, null, 2));
console.log('✅ Created vercel.json');

console.log('');
console.log('🎉 Setup Complete!');
console.log('');
console.log('📋 Next Steps:');
console.log('1. Deploy: cd telegram_bot && vercel deploy');
console.log('2. Set secrets: vercel env add BOT_TOKEN');
console.log('3. Set webhook with your bot token');
console.log('4. Access admin panel: https://your-deployment.vercel.app/message-interface');
console.log('');
console.log('🔗 Admin will authenticate as: @codedaoorg');
console.log('💬 Test bot with: /start, /admin');
console.log('');
console.log('🚀 Ready to launch your CodeDAO Telegram Bot!'); 
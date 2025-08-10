# 🤖 CodeDAO Telegram Bot

A comprehensive Telegram bot that integrates with the CodeDAO platform, enabling users to earn cryptocurrency for coding, manage their wallets, connect GitHub accounts, and interact with the community.

## 🚀 Features

### Core Functionality
- **Wallet Integration**: Connect Base-compatible wallets for token management
- **GitHub Integration**: Link GitHub accounts for automatic contribution tracking
- **Smart Contract Monitoring**: Real-time tracking of token rewards and claims
- **Dashboard Integration**: Seamless connection to CodeDAO dashboard API
- **Referral System**: Earn bonuses for inviting friends

### User Commands
- `/start` - Welcome message and bot introduction
- `/connect` - Connect wallet address
- `/github` - Link GitHub account
- `/stats` - View personal statistics and earnings
- `/invite` - Generate referral links and view referral stats
- `/claim` - Claim available CODE tokens
- `/help` - Get help and command list

### Admin Features
- `/admin stats` - View bot analytics
- `/admin broadcast <message>` - Send message to all users
- `/admin github deploy` - Trigger GitHub deployment

## 📋 Prerequisites

1. **Telegram Bot Token**: Get from [@BotFather](https://t.me/BotFather)
2. **GitHub Personal Access Token**: For repository integration
3. **Base Network RPC**: For smart contract monitoring
4. **Database**: PostgreSQL for user data storage
5. **CodeDAO Contract**: Deployed token contract address

## 🛠️ Installation

### 1. Clone and Install Dependencies
```bash
cd telegram_bot
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

### 3. Required Environment Variables
```env
# Essential Configuration
BOT_TOKEN=your_telegram_bot_token
GITHUB_TOKEN=your_github_pat_token
DATABASE_URL=your_postgresql_connection_string
CONTRACT_ADDRESS=deployed_codedao_token_address
ADMIN_CHAT_ID=your_telegram_user_id

# CodeDAO Integration
CODEDAO_API_URL=https://your-api-domain.com/api
CODEDAO_DASHBOARD_URL=https://codedao-org.github.io/dashboard.html
```

### 4. GitHub Secrets Setup

Configure these secrets in your GitHub repository settings:

```
BOT_TOKEN - Telegram bot token from @BotFather
GITHUB_TOKEN - GitHub PAT with repo access
DATABASE_URL - Production database connection
CONTRACT_ADDRESS - Deployed CodeDAO token contract
ADMIN_CHAT_ID - Your Telegram user ID for admin notifications
RPC_URL - Base network RPC endpoint
WEBHOOK_URL - Production webhook URL
```

## 🚀 Deployment

### Development Mode
```bash
npm run dev
```

### Production Deployment

#### Option 1: Direct Server Deployment
```bash
npm start
```

#### Option 2: Docker Deployment
```bash
npm run docker:build
npm run docker:run
```

#### Option 3: GitHub Actions (Recommended)

Create `.github/workflows/deploy-telegram-bot.yml`:

```yaml
name: Deploy Telegram Bot

on:
  workflow_dispatch:
  push:
    branches: [main]
    paths: ['telegram_bot/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: telegram_bot/package-lock.json
    
    - name: Install dependencies
      run: |
        cd telegram_bot
        npm ci
    
    - name: Run tests
      run: |
        cd telegram_bot
        npm test
    
    - name: Deploy to production
      env:
        BOT_TOKEN: ${{ secrets.BOT_TOKEN }}
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        DATABASE_URL: ${{ secrets.DATABASE_URL }}
        CONTRACT_ADDRESS: ${{ secrets.CONTRACT_ADDRESS }}
        ADMIN_CHAT_ID: ${{ secrets.ADMIN_CHAT_ID }}
        RPC_URL: ${{ secrets.RPC_URL }}
        WEBHOOK_URL: ${{ secrets.WEBHOOK_URL }}
      run: |
        cd telegram_bot
        npm run deploy:production
```

## 🔧 Configuration

### Bot Commands Setup
Message @BotFather with these commands:

```
start - 🚀 Start using CodeDAO Bot
connect - 🔗 Connect your wallet
github - 🐙 Link GitHub account
stats - 📊 View your statistics
invite - 👥 Invite friends and earn bonuses
claim - 💰 Claim your CODE tokens
help - ❓ Get help and commands
```

### Webhook Configuration (Production)
```javascript
// Set webhook URL
bot.setWebHook(`${WEBHOOK_URL}/webhook/${BOT_TOKEN}`);
```

## 📊 Database Schema

### Users Table
```sql
CREATE TABLE users (
  user_id BIGINT PRIMARY KEY,
  username VARCHAR(255),
  wallet_address VARCHAR(42),
  github_username VARCHAR(255),
  github_id BIGINT,
  join_date TIMESTAMP DEFAULT NOW(),
  wallet_connected BOOLEAN DEFAULT FALSE,
  total_earnings DECIMAL(18,8) DEFAULT 0,
  total_claimed DECIMAL(18,8) DEFAULT 0,
  referrals INTEGER DEFAULT 0,
  referred_by BIGINT,
  achievements JSONB DEFAULT '[]',
  last_activity TIMESTAMP DEFAULT NOW()
);
```

### Analytics Table
```sql
CREATE TABLE analytics (
  id SERIAL PRIMARY KEY,
  event_type VARCHAR(100),
  user_id BIGINT,
  data JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Security Features

- **Rate Limiting**: Prevents spam and abuse
- **Input Validation**: Wallet address and GitHub username verification
- **Admin Authentication**: Secure admin command access
- **Error Handling**: Comprehensive error logging and recovery

## 📈 Analytics & Monitoring

### Tracked Metrics
- Total users and active users
- Command usage statistics
- Wallet connection rates
- GitHub integration stats
- Token claim analytics

### Admin Dashboard
Access via `/admin stats` command:
- User growth metrics
- Feature adoption rates
- Error monitoring
- Performance statistics

## 🎮 Gamification Features

### Achievements System
- **First Wallet**: Connect your first wallet (+0.1 CODE)
- **GitHub Connected**: Link GitHub account (+0.2 CODE)
- **Week Warrior**: 7-day coding streak (+1.0 CODE)
- **Quality Master**: Maintain 9+ quality score (+2.0 CODE)

### Referral Program
- **Referrer Bonus**: 10% of friend's earnings
- **Referee Bonus**: 5% bonus on first 100 CODE
- **Milestone Rewards**: Special bonuses at 5, 10, 25 referrals

## 🐞 Troubleshooting

### Common Issues

1. **Bot not responding**
   - Check bot token validity
   - Verify webhook URL (production)
   - Check rate limiting

2. **Wallet connection fails**
   - Validate wallet address format
   - Check Base network compatibility

3. **GitHub integration issues**
   - Verify GitHub token permissions
   - Check username exists and is public

### Debug Mode
Set `LOG_LEVEL=debug` in environment variables for detailed logging.

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Telegram**: [@CodeDAOBot](https://t.me/CodeDAOBot)
- **GitHub Issues**: [Create an issue](https://github.com/CodeDAO-org/codedao-extension/issues)
- **Dashboard**: [CodeDAO Dashboard](https://codedao-org.github.io/dashboard.html)

## 🔗 Related Projects

- [CodeDAO Extension](https://github.com/CodeDAO-org/codedao-extension)
- [CodeDAO Dashboard](https://codedao-org.github.io)
- [CodeDAO Smart Contracts](../contracts/)

---

**Built with ❤️ by the CodeDAO Team** 
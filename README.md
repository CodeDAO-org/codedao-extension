# CodeDAO Extension & Reddit Bot

CodeDAO - Earn cryptocurrency by coding

## 🤖 Reddit Bot Setup

### Quick Start

1. **Create `.env` file** (never commit this):
```bash
# Reddit bot credentials
REDDIT_CLIENT_ID=7uuV_XZZzibq9VOWjYr...      # from "App ID" on the app page
REDDIT_CLIENT_SECRET=YOUR_LONG_SECRET_HERE    # from "secret" on the app page
REDDIT_USERNAME=CodeDAOAgent                  # the bot account
REDDIT_PASSWORD=********                      # the bot account password
REDDIT_USER_AGENT=CodeDAO Bot v1.0 by u/CodeDAOAgent

# Bot config
REDDIT_SUBREDDIT=CodeDAO                      # change to your subreddit
```

2. **Install and test**:
```bash
# Automatic setup
./setup_reddit_bot.sh

# Manual setup
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python bot.py  # Simple test
```

### Features

- **Weekly Threads**: Automated "What are you building?" posts every Monday
- **Welcome Messages**: Greets first-time posters with helpful links
- **Milestone Announcements**: Posts community achievements
- **Rate Limiting**: Respects Reddit API guidelines
- **Logging**: Comprehensive activity tracking

### Deployment Options

#### Local Development
```bash
python reddit_bot/bot.py  # Full bot with scheduling
```

#### Docker (Recommended for Production)
```bash
docker-compose -f docker-compose.reddit.yml up -d
```

#### Cloud Platforms
- **Render/Railway**: Set environment variables in dashboard
- **DigitalOcean**: Deploy as long-running droplet
- **AWS/GCP**: Use container services

### Bot Configuration

Make sure `u/CodeDAOAgent` is a **moderator** of `r/CodeDAO` for:
- Sticky posts
- Post flair management
- Content moderation

### Development

- `bot.py`: Simple test script
- `reddit_bot/bot.py`: Full automation system
- `requirements.txt`: Python dependencies
- `Dockerfile.reddit-bot`: Container setup

## 📱 Extension Features

- GitHub integration
- Contribution tracking
- Reward system
- Dashboard interface

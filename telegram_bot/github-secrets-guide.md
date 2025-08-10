# GitHub Secrets Setup for CodeDAO Telegram Bot

## Required Secrets

Set these in your GitHub repository settings under Settings > Secrets and variables > Actions:

### Core Bot Configuration
- **BOT_TOKEN**: Get from @BotFather on Telegram
- **ADMIN_TELEGRAM_USERNAME**: Set to 'codedaoorg'  
- **GITHUB_TOKEN**: Already available as default GitHub token

### Optional Configuration  
- **CONTRACT_ADDRESS**: CodeDAO token contract address
- **RPC_URL**: Base network RPC endpoint
- **ADMIN_CHAT_ID**: Your Telegram chat ID for notifications

## How to Set Secrets

1. Go to your GitHub repository
2. Click Settings > Secrets and variables > Actions  
3. Click "New repository secret"
4. Add each secret with the exact name and value

## Security Notes

- Secrets are encrypted and only accessible during GitHub Actions
- Never commit sensitive values to code
- Bot token is the most critical secret - keep it secure
- Admin username provides bot management access

## Verification

After setting secrets, the GitHub Action will:
1. Deploy the bot to GitHub Pages
2. Set up webhook automatically  
3. Start processing messages
4. Send confirmation to admin

The bot will be fully transparent and auditable while keeping sensitive data secure.

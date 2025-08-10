#!/bin/bash

# CodeDAO Telegram Bot - GitHub Secrets Setup Script
# This script helps configure GitHub repository secrets for automated deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🤖 CodeDAO Telegram Bot - GitHub Secrets Setup${NC}"
echo "=============================================="

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${RED}❌ GitHub CLI is not installed. Please install it first:${NC}"
    echo "   https://cli.github.com/manual/installation"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo -e "${YELLOW}🔐 Please authenticate with GitHub CLI:${NC}"
    gh auth login
fi

# Get repository information
REPO_OWNER=${1:-"CodeDAO-org"}
REPO_NAME=${2:-"codedao-extension"}
REPO="$REPO_OWNER/$REPO_NAME"

echo -e "${BLUE}📋 Repository: $REPO${NC}"
echo ""

# Function to set secret
set_secret() {
    local secret_name=$1
    local secret_description=$2
    local secret_example=$3
    
    echo -e "${YELLOW}🔑 Setting up: $secret_name${NC}"
    echo "   Description: $secret_description"
    
    if [ -n "$secret_example" ]; then
        echo "   Example: $secret_example"
    fi
    
    read -sp "   Enter value: " secret_value
    echo ""
    
    if [ -n "$secret_value" ]; then
        if gh secret set "$secret_name" --body "$secret_value" --repo "$REPO" 2>/dev/null; then
            echo -e "${GREEN}   ✅ Secret '$secret_name' set successfully${NC}"
        else
            echo -e "${RED}   ❌ Failed to set secret '$secret_name'${NC}"
        fi
    else
        echo -e "${YELLOW}   ⏭️  Skipped (empty value)${NC}"
    fi
    echo ""
}

echo -e "${BLUE}📝 Setting up GitHub Secrets...${NC}"
echo ""

# Core bot configuration
set_secret "BOT_TOKEN" \
    "Telegram bot token from @BotFather" \
    "123456789:ABCdefGHIjklMNOpqrsTUVwxyz"

set_secret "ADMIN_CHAT_ID" \
    "Your Telegram user ID for admin notifications" \
    "123456789"

# GitHub integration
set_secret "GITHUB_TOKEN" \
    "GitHub Personal Access Token with repo access" \
    "ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# Database configuration
set_secret "DATABASE_URL" \
    "PostgreSQL database connection string" \
    "postgresql://user:pass@host:5432/codedao_telegram_bot"

set_secret "REDIS_URL" \
    "Redis connection string (optional)" \
    "redis://localhost:6379"

# Smart contract configuration
set_secret "CONTRACT_ADDRESS" \
    "Deployed CodeDAO token contract address" \
    "0x1234567890abcdef1234567890abcdef12345678"

set_secret "RPC_URL" \
    "Base network RPC endpoint" \
    "https://mainnet.base.org"

# Production webhook
set_secret "WEBHOOK_URL" \
    "Production webhook URL for bot" \
    "https://your-domain.com"

echo -e "${GREEN}🎉 GitHub Secrets Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Create your Telegram bot with @BotFather if you haven't already"
echo "2. Configure bot commands using the setup in telegram_bot/README.md"
echo "3. Deploy the bot using GitHub Actions:"
echo "   gh workflow run 'Deploy CodeDAO Telegram Bot' --ref main"
echo ""
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "• Telegram Bot: https://t.me/YourBotUsername"
echo "• Repository: https://github.com/$REPO"
echo "• Actions: https://github.com/$REPO/actions"
echo "• Dashboard: https://codedao-org.github.io/dashboard.html"
echo ""

# Verify secrets were set
echo -e "${BLUE}🔍 Verifying secrets...${NC}"
if gh secret list --repo "$REPO" &> /dev/null; then
    echo -e "${GREEN}✅ Secrets verification passed${NC}"
    gh secret list --repo "$REPO"
else
    echo -e "${RED}❌ Could not verify secrets${NC}"
fi

echo ""
echo -e "${GREEN}🚀 Ready for deployment!${NC}" 
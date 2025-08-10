#!/bin/bash

# CodeDAO Telegram Bot - Admin Quick Access
# For: @codedaoorg

echo "🤖 CodeDAO Telegram Bot Admin Panel"
echo "👤 Admin: @codedaoorg"
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

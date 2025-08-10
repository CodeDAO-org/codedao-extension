#!/bin/bash

# CodeDAO Reddit Bot - Production Serverless Deployment Script

echo "🚀 Deploying CodeDAO Reddit Bot to Production (Serverless)"
echo "============================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if we're in a git repository
if [ ! -d ".git" ]; then
    echo -e "${RED}❌ Error: This must be run from the root of your git repository${NC}"
    exit 1
fi

echo -e "${BLUE}📋 Step 1: Checking requirements...${NC}"

# Check if GitHub CLI is installed
if ! command -v gh &> /dev/null; then
    echo -e "${YELLOW}⚠️  GitHub CLI not found. Install it from: https://cli.github.com/${NC}"
    echo "   Or continue manually by adding secrets via GitHub web interface"
    MANUAL_SECRETS=true
else
    echo -e "${GREEN}✅ GitHub CLI found${NC}"
    MANUAL_SECRETS=false
fi

echo -e "${BLUE}📋 Step 2: Checking Python dependencies...${NC}"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
    echo -e "${RED}❌ requirements.txt not found${NC}"
    exit 1
fi

# Check if reddit_bot directory exists
if [ ! -d "reddit_bot" ]; then
    echo -e "${RED}❌ reddit_bot directory not found${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All required files found${NC}"

echo -e "${BLUE}📋 Step 3: Setting up GitHub repository secrets...${NC}"

# Function to add secret
add_secret() {
    local secret_name=$1
    local secret_description=$2
    
    if [ "$MANUAL_SECRETS" = true ]; then
        echo -e "${YELLOW}📝 Please add this secret manually in GitHub:${NC}"
        echo -e "   Name: ${BLUE}$secret_name${NC}"
        echo -e "   Description: $secret_description"
        echo -e "   URL: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/settings/secrets/actions"
        echo ""
        read -p "Press Enter when you've added this secret..."
    else
        echo -e "${YELLOW}Enter value for $secret_name ($secret_description):${NC}"
        read -s secret_value
        if [ -n "$secret_value" ]; then
            if gh secret set "$secret_name" --body "$secret_value"; then
                echo -e "${GREEN}✅ $secret_name added successfully${NC}"
            else
                echo -e "${RED}❌ Failed to add $secret_name${NC}"
            fi
        else
            echo -e "${YELLOW}⚠️  Skipping empty secret $secret_name${NC}"
        fi
    fi
}

echo "Setting up Reddit bot credentials..."

add_secret "REDDIT_CLIENT_ID" "Reddit app client ID from https://www.reddit.com/prefs/apps"
add_secret "REDDIT_CLIENT_SECRET" "Reddit app client secret"
add_secret "REDDIT_USERNAME" "Reddit bot account username (e.g., CodeDAOAgent)"
add_secret "REDDIT_PASSWORD" "Reddit bot account password"
add_secret "REDDIT_USER_AGENT" "Reddit user agent string (e.g., CodeDAO Bot v1.0 by u/CodeDAOAgent)"
add_secret "REDDIT_SUBREDDIT" "Target subreddit name (e.g., CodeDAO)"

echo -e "${BLUE}📋 Step 4: Setting up GitHub token for webhook integration...${NC}"
add_secret "GITHUB_TOKEN" "GitHub personal access token with repo and actions permissions"

echo -e "${BLUE}📋 Step 5: Testing the deployment...${NC}"

# Check if GitHub Actions workflow exists
if [ ! -f ".github/workflows/reddit-bot.yml" ]; then
    echo -e "${RED}❌ GitHub Actions workflow not found at .github/workflows/reddit-bot.yml${NC}"
    exit 1
fi

echo -e "${GREEN}✅ GitHub Actions workflow found${NC}"

# Commit and push if there are changes
if ! git diff --quiet || ! git diff --cached --quiet; then
    echo -e "${YELLOW}📤 Committing and pushing changes...${NC}"
    git add .
    git commit -m "🤖 Add Reddit bot serverless deployment"
    git push
    echo -e "${GREEN}✅ Changes pushed to repository${NC}"
else
    echo -e "${GREEN}✅ Repository up to date${NC}"
fi

echo -e "${BLUE}📋 Step 6: Triggering test run...${NC}"

if [ "$MANUAL_SECRETS" = false ]; then
    echo "Triggering test connection..."
    if gh workflow run reddit-bot.yml -f action=test_connection; then
        echo -e "${GREEN}✅ Test run triggered successfully${NC}"
        echo -e "${BLUE}🔍 Check the run at: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions${NC}"
    else
        echo -e "${YELLOW}⚠️  Failed to trigger test run. You can run it manually from GitHub Actions${NC}"
    fi
else
    echo -e "${YELLOW}🔧 Trigger test manually:${NC}"
    echo "   1. Go to: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
    echo "   2. Click 'CodeDAO Reddit Bot' workflow"
    echo "   3. Click 'Run workflow'"
    echo "   4. Select 'test_connection' action"
    echo "   5. Click 'Run workflow'"
fi

echo ""
echo -e "${GREEN}🎉 Production deployment setup complete!${NC}"
echo ""
echo -e "${BLUE}📅 Automatic Schedule:${NC}"
echo "   • Weekly threads: Every Monday at 9 AM UTC"
echo "   • Analytics tracking: Continuous"
echo ""
echo -e "${BLUE}🔧 Manual Triggers Available:${NC}"
echo "   • Test connection: Verify Reddit bot works"
echo "   • Post milestone: Announce achievements"
echo "   • Weekly thread: Post immediately"
echo "   • Analytics report: Get community stats"
echo ""
echo -e "${BLUE}🌐 Integration with Agent Gateway:${NC}"
echo "   • Add GITHUB_TOKEN to your agent-gateway .env"
echo "   • Use the webhook endpoints in reddit_bot/webhook_integration.py"
echo "   • POST /api/reddit/milestone to announce milestones"
echo ""
echo -e "${BLUE}📊 Monitoring:${NC}"
echo "   • GitHub Actions logs: https://github.com/$(git remote get-url origin | sed 's/.*github.com[:/]\([^.]*\).*/\1/')/actions"
echo "   • Analytics artifacts: Downloaded after each run"
echo "   • Reddit posts: Check r/CodeDAO for automation"
echo ""
echo -e "${GREEN}✨ Your Reddit bot is now live and will post automatically!${NC}" 
#!/bin/bash

# CodeDAO Easy Push Script
# Automates git operations with user approval

set -e  # Exit on any error

echo "🚀 CodeDAO Easy Push Workflow"
echo "=============================="

# Check if we're in a git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Not in a git repository!"
    exit 1
fi

# Show current status
echo "📊 Current Repository Status:"
git status --short
echo ""

# Check for changes
if [[ -z $(git status --porcelain) ]]; then
    echo "✅ No changes to commit."
    echo "📋 Checking if we have commits to push..."
    
    # Check if we're ahead of remote
    if git status | grep -q "Your branch is ahead"; then
        echo "📤 Found commits ready to push:"
        git log --oneline origin/main..HEAD
        echo ""
        
        read -p "🔄 Push these commits to GitHub? (y/N): " push_confirm
        if [[ $push_confirm =~ ^[Yy]$ ]]; then
            echo "🚀 Pushing to GitHub..."
            git push origin main
            echo "✅ Push completed!"
        else
            echo "❌ Push cancelled."
        fi
    else
        echo "✅ Repository is up to date."
    fi
    exit 0
fi

# Show what will be added
echo "📁 Files that will be added:"
git status --porcelain | grep -E "^\?\?" | cut -c4- | head -10
echo ""

echo "📝 Files that will be modified:"
git status --porcelain | grep -E "^.M" | cut -c4- | head -10
echo ""

# Interactive file selection
echo "📋 Choose what to commit:"
echo "1) 🎯 Smart selection (dashboard, contracts, docs)"
echo "2) 📚 All changes"
echo "3) 🔍 Custom selection"
echo "4) ❌ Cancel"
echo ""

read -p "Choose option (1-4): " selection

case $selection in
    1)
        echo "🎯 Adding smart selection..."
        git add dashboard/ contracts/ docs/ *.md *.json *.js *.ts 2>/dev/null || true
        git add scripts/ hardhat.config.js package.json 2>/dev/null || true
        ;;
    2)
        echo "📚 Adding all changes..."
        git add .
        ;;
    3)
        echo "🔍 Interactive file selection..."
        git add -i
        ;;
    4)
        echo "❌ Operation cancelled."
        exit 0
        ;;
    *)
        echo "❌ Invalid selection."
        exit 1
        ;;
esac

# Check if anything was staged
if [[ -z $(git diff --cached --name-only) ]]; then
    echo "⚠️ No files staged for commit."
    exit 0
fi

# Show what will be committed
echo ""
echo "📋 Files staged for commit:"
git diff --cached --name-only
echo ""

# Suggest commit message based on changes
DASHBOARD_CHANGES=$(git diff --cached --name-only | grep -c "dashboard/" 2>/dev/null || echo "0")
CONTRACT_CHANGES=$(git diff --cached --name-only | grep -c "contracts/" 2>/dev/null || echo "0")
DOCS_CHANGES=$(git diff --cached --name-only | grep -c -E "\.(md|txt)$" 2>/dev/null || echo "0")

SUGGESTED_MSG=""
if [ "$DASHBOARD_CHANGES" -gt 0 ]; then
    SUGGESTED_MSG="Update wallet dashboard"
fi
if [ "$CONTRACT_CHANGES" -gt 0 ]; then
    if [ -n "$SUGGESTED_MSG" ]; then
        SUGGESTED_MSG="$SUGGESTED_MSG and smart contracts"
    else
        SUGGESTED_MSG="Update smart contracts"
    fi
fi
if [ "$DOCS_CHANGES" -gt 0 ]; then
    if [ -n "$SUGGESTED_MSG" ]; then
        SUGGESTED_MSG="$SUGGESTED_MSG with documentation"
    else
        SUGGESTED_MSG="Update documentation"
    fi
fi

if [ -z "$SUGGESTED_MSG" ]; then
    SUGGESTED_MSG="Update CodeDAO components"
fi

echo "💭 Suggested commit message: $SUGGESTED_MSG"
echo ""

read -p "✏️ Enter commit message (or press Enter for suggested): " commit_msg

if [[ -z "$commit_msg" ]]; then
    commit_msg="$SUGGESTED_MSG"
fi

# Confirm commit
echo ""
echo "📝 About to commit with message: \"$commit_msg\""
read -p "🔄 Proceed with commit? (y/N): " commit_confirm

if [[ ! $commit_confirm =~ ^[Yy]$ ]]; then
    echo "❌ Commit cancelled."
    exit 0
fi

# Make the commit
echo "💾 Creating commit..."
git commit -m "$commit_msg"
echo "✅ Commit created successfully!"

# Check if we need to pull first
echo ""
echo "🔍 Checking remote status..."
git fetch origin

if git status | grep -q "Your branch is behind"; then
    echo "⚠️ Remote has newer commits. Need to pull first."
    read -p "🔄 Pull latest changes and merge? (y/N): " pull_confirm
    
    if [[ $pull_confirm =~ ^[Yy]$ ]]; then
        echo "📥 Pulling latest changes..."
        git pull origin main --no-rebase
        echo "✅ Pull completed!"
    else
        echo "⚠️ Skipping pull. You may need to pull before pushing."
    fi
fi

# Offer to push
echo ""
echo "📤 Ready to push to GitHub!"
echo "📊 Commits to push:"
git log --oneline origin/main..HEAD 2>/dev/null || git log --oneline -3
echo ""

read -p "🚀 Push to GitHub now? (y/N): " push_confirm

if [[ $push_confirm =~ ^[Yy]$ ]]; then
    echo "🚀 Pushing to GitHub..."
    
    if git push origin main; then
        echo ""
        echo "🎉 SUCCESS! Changes pushed to GitHub!"
        echo "🔗 View at: https://github.com/CodeDAO-org/codedao-extension"
        
        # Check if GitHub Pages should be updated
        if git diff --name-only HEAD~1 | grep -q "docs/"; then
            echo ""
            echo "📋 Dashboard updated! Remember to:"
            echo "   1. Go to GitHub repo settings"
            echo "   2. Enable GitHub Pages (if not already)"
            echo "   3. Set source to: main branch /docs folder"
            echo "   4. Your dashboard will be live at:"
            echo "      https://codedao-org.github.io/codedao-extension/"
        fi
    else
        echo "❌ Push failed! Check the error above."
        exit 1
    fi
else
    echo "💾 Commit saved locally. Push later with: git push origin main"
fi

echo ""
echo "✅ Easy push workflow completed!"

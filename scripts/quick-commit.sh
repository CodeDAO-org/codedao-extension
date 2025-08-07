#!/bin/bash

# Quick Commit Templates for CodeDAO

echo "⚡ CodeDAO Quick Commit"
echo "======================"

# Check for changes
if [[ -z $(git status --porcelain) ]]; then
    echo "✅ No changes to commit."
    exit 0
fi

echo "🎯 Choose commit type:"
echo "1) 🎨 Dashboard update"
echo "2) ⚙️ Contract update" 
echo "3) 📚 Documentation update"
echo "4) 🐛 Bug fix"
echo "5) ✨ New feature"
echo "6) 🔧 Configuration update"
echo "7) ✏️ Custom message"

read -p "Select (1-7): " choice

case $choice in
    1)
        msg="Update wallet dashboard - enhance Web3 functionality"
        files="dashboard/ docs/"
        ;;
    2)
        msg="Update smart contracts - improve token functionality"
        files="contracts/ hardhat.config.js"
        ;;
    3)
        msg="Update documentation - improve setup guides"
        files="*.md docs/"
        ;;
    4)
        msg="Fix bugs - resolve extension and contract issues"
        files="."
        ;;
    5)
        msg="Add new features - enhance CodeDAO functionality"
        files="."
        ;;
    6)
        msg="Update configuration - improve build and deployment"
        files="*.json *.js *.ts"
        ;;
    7)
        read -p "Enter custom message: " msg
        files="."
        ;;
    *)
        echo "❌ Invalid selection"
        exit 1
        ;;
esac

echo "📝 Message: $msg"
echo "📁 Adding files..."

if [ "$files" = "." ]; then
    git add .
else
    for file in $files; do
        git add $file 2>/dev/null || true
    done
fi

# Show what will be committed
echo "📋 Files to commit:"
git diff --cached --name-only

read -p "🔄 Proceed? (y/N): " confirm
if [[ $confirm =~ ^[Yy]$ ]]; then
    git commit -m "$msg"
    echo "✅ Quick commit completed!"
    echo "🚀 Run ./scripts/easy-push.sh to push to GitHub"
else
    echo "❌ Cancelled"
fi

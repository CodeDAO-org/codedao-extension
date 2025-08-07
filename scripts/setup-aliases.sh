#!/bin/bash

# Setup CodeDAO Git Aliases

echo "🔧 Setting up CodeDAO Git Aliases"
echo "================================="

# Add aliases to .zshrc (or .bashrc)
SHELL_CONFIG="$HOME/.zshrc"
if [ ! -f "$SHELL_CONFIG" ]; then
    SHELL_CONFIG="$HOME/.bashrc"
fi

echo "📝 Adding aliases to $SHELL_CONFIG"

# Create backup
cp "$SHELL_CONFIG" "$SHELL_CONFIG.backup"

# Add CodeDAO aliases
cat >> "$SHELL_CONFIG" << 'EOF'

# CodeDAO Git Automation Aliases
alias cdpush='./scripts/easy-push.sh'      # Easy push workflow
alias cdcommit='./scripts/quick-commit.sh' # Quick commit templates
alias cdstatus='git status && echo "" && git log --oneline -3'
alias cdsync='git fetch origin && git status'
alias cdlog='git log --oneline --graph -10'
alias cddiff='git diff --name-only'

# Quick navigation
alias cddash='cd dashboard && ls -la'
alias cdcontracts='cd contracts && ls -la'
alias cddocs='cd docs && ls -la'

EOF

echo "✅ Aliases added! Restart terminal or run: source $SHELL_CONFIG"
echo ""
echo "🎯 New commands available:"
echo "   cdpush      - Run easy push workflow"
echo "   cdcommit    - Quick commit with templates"
echo "   cdstatus    - Enhanced git status + recent commits"
echo "   cdsync      - Check remote status"
echo "   cdlog       - Pretty git log"
echo "   cddiff      - Show changed files"
echo ""
echo "🚀 Usage: Just type 'cdpush' to start the workflow!"

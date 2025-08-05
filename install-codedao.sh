#!/bin/bash
# CodeDAO Extension - One-Click Installer
# Bypasses VS Code Marketplace entirely!

echo "🤖 CodeDAO Extension Installer"
echo "🚀 Installing directly from GitHub..."
echo "==============================================="

# Configuration
REPO="CodeDAO-org/codedao-extension"
EXTENSION_NAME="codedao-extension"

# Check if VS Code is installed
if ! command -v code &> /dev/null; then
    echo "❌ VS Code not found. Please install VS Code first."
    echo "📥 Download from: https://code.visualstudio.com/"
    exit 1
fi

echo "✅ VS Code found"

# Get latest release info
echo "🔍 Fetching latest release..."
LATEST_RELEASE=$(curl -s "https://api.github.com/repos/$REPO/releases/latest")
DOWNLOAD_URL=$(echo "$LATEST_RELEASE" | grep -o '"browser_download_url": "[^"]*\.vsix"' | cut -d'"' -f4)
VERSION=$(echo "$LATEST_RELEASE" | grep -o '"tag_name": "[^"]*"' | cut -d'"' -f4)

if [ -z "$DOWNLOAD_URL" ]; then
    echo "❌ Could not find extension download URL"
    exit 1
fi

echo "📦 Found version: $VERSION"
echo "⬇️  Downloading extension..."

# Download the extension
TEMP_DIR=$(mktemp -d)
VSIX_FILE="$TEMP_DIR/$EXTENSION_NAME-$VERSION.vsix"

curl -L -o "$VSIX_FILE" "$DOWNLOAD_URL"

if [ ! -f "$VSIX_FILE" ]; then
    echo "❌ Download failed"
    exit 1
fi

echo "✅ Downloaded successfully"

# Install the extension
echo "🔧 Installing extension in VS Code..."
code --install-extension "$VSIX_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Installation successful!"
    echo ""
    echo "🎉 CodeDAO Extension installed!"
    echo "💰 Start earning CODE tokens while you code!"
    echo ""
    echo "🚀 Next steps:"
    echo "1. Open VS Code"
    echo "2. Press Ctrl+Shift+P"
    echo "3. Type 'CodeDAO: Connect Wallet'"
    echo "4. Connect your Base-compatible wallet"
    echo "5. Start coding and earning!"
    echo ""
    echo "📊 View stats: Ctrl+Shift+P → 'CodeDAO: Show Stats'"
else
    echo "❌ Installation failed"
    echo "📖 Manual installation:"
    echo "1. Open VS Code"
    echo "2. Press Ctrl+Shift+P"
    echo "3. Type 'Extensions: Install from VSIX'"
    echo "4. Select: $VSIX_FILE"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo "🌟 Thank you for using CodeDAO!"
echo "🤖 This extension was built and maintained by AI agents"
echo "🌍 Join the community: https://github.com/CodeDAO-org"

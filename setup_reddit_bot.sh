#!/bin/bash

# CodeDAO Reddit Bot Setup Script

echo "🚀 Setting up CodeDAO Reddit Bot..."

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "📦 Creating virtual environment..."
    python -m venv .venv
fi

# Activate virtual environment
echo "🔌 Activating virtual environment..."
source .venv/bin/activate

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found!"
    echo "📝 Please create .env file with your Reddit credentials:"
    echo "   cp .env.example .env"
    echo "   # Then edit .env with your actual credentials"
    exit 1
fi

echo "✅ Setup complete!"
echo ""
echo "🔧 Available commands:"
echo "  python bot.py                    # Simple test"
echo "  python reddit_bot/bot.py         # Full bot with automation"
echo ""
echo "📖 Next steps:"
echo "  1. Make sure u/CodeDAOAgent is a moderator of r/CodeDAO"
echo "  2. Test with: python bot.py"
echo "  3. Run full bot: python reddit_bot/bot.py"
echo ""
echo "🌐 Production deployment:"
echo "  - Deploy to Render/Railway/DigitalOcean"
echo "  - Set environment variables in host UI"
echo "  - Run as long-running process" 
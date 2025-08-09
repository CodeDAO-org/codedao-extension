#!/bin/bash

# 🚀 CodeDAO Twitter Bot - Quick Start Script
echo "🤖 CodeDAO Twitter Bot - Quick Start Setup"
echo "=========================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js $(node --version) detected"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    
    echo "⚠️  IMPORTANT: Please edit .env file with your Twitter API credentials:"
    echo ""
    echo "TWITTER_API_KEY=JkvwT9YcEWSuK56ud6EibGTr6"
    echo "TWITTER_API_SECRET=azaWRbfTUUVHU02eO9sI2kvbMtEqWgjvWI5ASKkBDVMVyDLfXn"
    echo "TWITTER_ACCESS_TOKEN=1879605233493405696-3584SP9SLewXUCZOaCOBmMfS7WYNg0"
    echo "TWITTER_ACCESS_TOKEN_SECRET=F1Krlkoq10358joaLW2yXiP4vGrudysB7ccIzhIp27eil"
    echo ""
    echo "Edit .env file now? (y/n)"
    read -r EDIT_ENV
    
    if [ "$EDIT_ENV" = "y" ] || [ "$EDIT_ENV" = "Y" ]; then
        if command -v code &> /dev/null; then
            code .env
        elif command -v nano &> /dev/null; then
            nano .env
        else
            echo "Please edit .env file manually with your preferred editor"
        fi
    fi
else
    echo "✅ .env file already exists"
fi

# Check if MongoDB is running
echo "🔍 Checking MongoDB connection..."

# Try to connect to MongoDB
if command -v mongosh &> /dev/null; then
    mongosh --eval "db.adminCommand('ping')" mongodb://localhost:27017/test --quiet > /dev/null 2>&1
    MONGO_STATUS=$?
elif command -v mongo &> /dev/null; then
    mongo --eval "db.adminCommand('ping')" mongodb://localhost:27017/test --quiet > /dev/null 2>&1
    MONGO_STATUS=$?
else
    MONGO_STATUS=1
fi

if [ $MONGO_STATUS -eq 0 ]; then
    echo "✅ MongoDB is running"
else
    echo "⚠️  MongoDB is not running or not accessible"
    echo ""
    echo "Choose an option:"
    echo "1) Start MongoDB with Docker (recommended)"
    echo "2) Use MongoDB Atlas (cloud)"
    echo "3) Install MongoDB locally"
    echo "4) Skip MongoDB setup for now"
    
    read -r -p "Enter choice (1-4): " MONGO_CHOICE
    
    case $MONGO_CHOICE in
        1)
            if command -v docker &> /dev/null; then
                echo "🐳 Starting MongoDB with Docker..."
                docker run -d --name codedao-mongodb -p 27017:27017 mongo:6.0
                echo "✅ MongoDB started with Docker"
                sleep 3
            else
                echo "❌ Docker not found. Please install Docker first."
            fi
            ;;
        2)
            echo "📱 For MongoDB Atlas:"
            echo "1. Visit https://www.mongodb.com/atlas"
            echo "2. Create a free account and cluster"
            echo "3. Get your connection string"
            echo "4. Update MONGODB_URI in .env file"
            ;;
        3)
            echo "💻 For local MongoDB installation:"
            echo "macOS: brew install mongodb-community"
            echo "Ubuntu: sudo apt-get install -y mongodb"
            echo "Windows: Download from https://www.mongodb.com/try/download/community"
            ;;
        4)
            echo "⏭️  Skipping MongoDB setup"
            ;;
    esac
fi

# Create logs directory
echo "📁 Creating logs directory..."
mkdir -p logs

# Test the bot
echo "🧪 Testing bot configuration..."
node src/index.js health

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Setup completed successfully!"
    echo ""
    echo "🚀 Quick Commands:"
    echo "  npm start                    # Start the bot"
    echo "  npm run dev                  # Start in development mode"
    echo "  npm run test:health          # Test bot health"
    echo "  npm run test:content         # Test content generation"
    echo "  node src/index.js post daily_stats  # Post a daily stats tweet"
    echo ""
    echo "📊 Monitor URLs (when running):"
    echo "  http://localhost:3000/health     # Health check"
    echo "  http://localhost:3000/analytics  # Analytics dashboard"
    echo "  http://localhost:3000/config     # Bot configuration"
    echo ""
    echo "📖 Read SETUP.md for detailed instructions"
    echo ""
    echo "Ready to start building your developer community! 🤖✨"
else
    echo ""
    echo "⚠️  Setup completed with warnings"
    echo "Please check your Twitter API credentials in .env file"
    echo "See SETUP.md for troubleshooting guide"
fi 
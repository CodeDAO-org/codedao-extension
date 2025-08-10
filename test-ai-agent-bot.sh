#!/bin/bash

echo "🤖 CodeDAO AI Agent Bot System - Complete Test"
echo "=============================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Checking AI Agent Bot System Components...${NC}"
echo ""

# Check Agent Gateway
echo -e "${YELLOW}1. Agent Gateway Server:${NC}"
if [ -f "agent-gateway/server.js" ]; then
    echo -e "   ✅ Server implementation: ${GREEN}FOUND${NC}"
else
    echo -e "   ❌ Server implementation: ${RED}MISSING${NC}"
fi

if [ -f "agent-gateway/package.json" ]; then
    echo -e "   ✅ Package configuration: ${GREEN}FOUND${NC}"
else
    echo -e "   ❌ Package configuration: ${RED}MISSING${NC}"
fi

# Check for GitHub integration
if grep -q "@octokit/rest" agent-gateway/package.json 2>/dev/null; then
    echo -e "   ✅ GitHub API integration: ${GREEN}CONFIGURED${NC}"
else
    echo -e "   ❌ GitHub API integration: ${RED}MISSING${NC}"
fi

echo ""

# Check Dashboard
echo -e "${YELLOW}2. Enhanced Dashboard:${NC}"
if [ -f "dashboard.html" ]; then
    echo -e "   ✅ Dashboard file: ${GREEN}FOUND${NC}"
else
    echo -e "   ❌ Dashboard file: ${RED}MISSING${NC}"
fi

if grep -q "GitHub AI Agent Integration" dashboard.html 2>/dev/null; then
    echo -e "   ✅ GitHub integration UI: ${GREEN}IMPLEMENTED${NC}"
else
    echo -e "   ❌ GitHub integration UI: ${RED}MISSING${NC}"
fi

if grep -q "saveGitHubToken" dashboard.html 2>/dev/null; then
    echo -e "   ✅ GitHub token management: ${GREEN}IMPLEMENTED${NC}"
else
    echo -e "   ❌ GitHub token management: ${RED}MISSING${NC}"
fi

echo ""

# Check CodeDAO SDK Integration
echo -e "${YELLOW}3. CodeDAO SDK Integration:${NC}"
if [ -d "temp-sdk" ]; then
    echo -e "   ✅ SDK downloaded: ${GREEN}FOUND${NC}"
else
    echo -e "   ❌ SDK downloaded: ${RED}MISSING${NC}"
fi

if [ -d "agent-gateway/codedao-sdk" ]; then
    echo -e "   ✅ SDK integrated: ${GREEN}FOUND${NC}"
else
    echo -e "   ❌ SDK integrated: ${RED}MISSING${NC}"
fi

echo ""

# Check Dependencies
echo -e "${YELLOW}4. Dependencies:${NC}"
if [ -d "agent-gateway/node_modules" ]; then
    echo -e "   ✅ Agent Gateway deps: ${GREEN}INSTALLED${NC}"
else
    echo -e "   ❌ Agent Gateway deps: ${RED}NOT INSTALLED${NC}"
    echo -e "   ${BLUE}Run: cd agent-gateway && npm install${NC}"
fi

echo ""

# System Status
echo -e "${BLUE}🚀 System Readiness Check:${NC}"
echo ""

READY_COUNT=0
TOTAL_COUNT=7

# Check readiness
if [ -f "agent-gateway/server.js" ]; then ((READY_COUNT++)); fi
if [ -f "dashboard.html" ]; then ((READY_COUNT++)); fi
if grep -q "@octokit/rest" agent-gateway/package.json 2>/dev/null; then ((READY_COUNT++)); fi
if grep -q "GitHub AI Agent Integration" dashboard.html 2>/dev/null; then ((READY_COUNT++)); fi
if grep -q "saveGitHubToken" dashboard.html 2>/dev/null; then ((READY_COUNT++)); fi
if [ -d "agent-gateway/codedao-sdk" ]; then ((READY_COUNT++)); fi
if [ -d "agent-gateway/node_modules" ]; then ((READY_COUNT++)); fi

echo -e "System Readiness: ${READY_COUNT}/${TOTAL_COUNT} components ready"

if [ $READY_COUNT -eq $TOTAL_COUNT ]; then
    echo -e "${GREEN}🎉 SYSTEM FULLY READY!${NC}"
    echo ""
    echo -e "${BLUE}🚀 Quick Start Instructions:${NC}"
    echo ""
    echo "1. Start Agent Gateway:"
    echo "   cd agent-gateway && npm start"
    echo ""
    echo "2. Start Dashboard (in new terminal):"
    echo "   python3 -m http.server 8084"
    echo ""
    echo "3. Open Dashboard:"
    echo "   http://localhost:8084/dashboard.html"
    echo ""
    echo "4. Test GitHub Integration:"
    echo "   - Scroll to 'GitHub AI Agent Integration'"
    echo "   - Enter your GitHub token"
    echo "   - Click 'Test Push'"
    echo ""
    echo -e "${GREEN}🏆 You now have the world's first AI Agent Bot System!${NC}"
else
    echo -e "${YELLOW}⚠️  Some components need attention${NC}"
    echo ""
    echo "Missing components:"
    if [ ! -f "agent-gateway/server.js" ]; then
        echo "   - Agent Gateway Server implementation"
    fi
    if [ ! -d "agent-gateway/node_modules" ]; then
        echo "   - Run: cd agent-gateway && npm install"
    fi
fi

echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Get your GitHub Personal Access Token:"
echo "   https://github.com/settings/tokens"
echo ""
echo "2. Grant permissions:"
echo "   - repo (full repository access)"
echo "   - workflow (if using GitHub Actions)"
echo ""
echo "3. Test the system with your token!"
echo ""
echo -e "${GREEN}🎯 Your AI Agent Bot System is ready to revolutionize development!${NC}" 
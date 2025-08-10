#!/usr/bin/env python3
"""
🤖 CodeDAO AI Agent: Push with Valid Token
Push fixed dashboard using the provided GitHub Personal Access Token
"""

import requests
import json
import base64

print("🤖 CodeDAO AI Agent: Push with Valid GitHub Token")
print("=" * 60)

# Configuration
USER_ID = "ai-agent-codedao"
REPO_NAME = "CodeDAO-org.github.io"
FILE_PATH = "dashboard-working.html"
AGENT_GATEWAY_URL = "http://localhost:3001"

# GitHub Token provided by user
GITHUB_TOKEN = "YOUR_GITHUB_TOKEN_HERE"

print(f"🔧 Target: {REPO_NAME}/{FILE_PATH}")
print(f"🔑 Token: {GITHUB_TOKEN[:4]}...{GITHUB_TOKEN[-4:]}")

# Step 1: Add GitHub Token to AI Agent Gateway
print("\n🔐 Adding GitHub token to AI Agent...")
add_token_url = f"{AGENT_GATEWAY_URL}/api/user/add-github-token"
add_token_payload = {
    "userId": USER_ID,
    "githubToken": GITHUB_TOKEN
}
headers = {'Content-Type': 'application/json'}

try:
    add_token_response = requests.post(add_token_url, json=add_token_payload, headers=headers)
    print(f"📊 Add Token Status: {add_token_response.status_code}")
    print(f"📋 Add Token Response: {add_token_response.text}")
    
    if add_token_response.status_code == 200:
        print("✅ Token added successfully!")
    else:
        print("❌ Failed to add token")
        exit(1)
        
except requests.exceptions.ConnectionError:
    print(f"❌ Error: Could not connect to Agent Gateway at {AGENT_GATEWAY_URL}")
    print("Make sure the agent gateway is running with: npm start")
    exit(1)
except Exception as e:
    print(f"❌ Error adding token: {e}")
    exit(1)

# Step 2: Read the fixed dashboard file
print("\n📖 Reading fixed dashboard...")
try:
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f"✅ Dashboard loaded: {len(content):,} characters")
except FileNotFoundError:
    print(f"❌ Error: {FILE_PATH} not found")
    exit(1)

# Step 3: Push to GitHub via AI Agent Gateway
print("\n🚀 Pushing to GitHub via AI Agent...")
push_url = f"{AGENT_GATEWAY_URL}/api/github/push"
push_payload = {
    "userId": USER_ID,
    "repo": REPO_NAME,
    "files": [{
        "path": FILE_PATH,
        "content": content
    }],
    "commitMessage": "🤖 AI Agent: Deploy Fixed CodeDAO Dashboard MVP\n\n✅ FIXES IMPLEMENTED:\n- ✅ MetaMask wallet connection with Moralis API\n- ✅ Settings navigation to correct URLs\n- ✅ Clean HTML structure (no JS display at bottom)\n- ✅ Base blockchain support\n- ✅ Professional UI/UX\n\n🎯 MVP FEATURES:\n- AI Agent dropdown (fully functional)\n- Wallet connection (MetaMask + Base + CODE tokens)\n- Settings system (complete navigation)\n- Transparent reward claiming\n\n🚀 CodeDAO Value Proposition:\nUsers earn CODE tokens → AI agents help push code → Seamless Web3 development workflow\n\nReady for MVP launch! 🎉"
}

try:
    push_response = requests.post(push_url, json=push_payload, headers=headers)
    print(f"📊 Push Status: {push_response.status_code}")
    print(f"📋 Push Response: {push_response.text}")
    
    if push_response.status_code == 200:
        response_data = push_response.json()
        if response_data.get('success'):
            print("\n🎉 SUCCESS! AI Agent Push Completed!")
            print(f"🔗 Live URL: https://codedao-org.github.io/{FILE_PATH}")
            print("\n✅ CodeDAO AI Agent System: WORKING")
            print("   • Fixed dashboard deployed autonomously")
            print("   • GitHub authentication working")
            print("   • AI Agent push system operational")
            print("\n🎯 Ready for MVP Launch!")
        else:
            print("❌ Push failed:")
            print(f"   Error: {response_data.get('error', 'Unknown error')}")
    else:
        print(f"❌ HTTP Error: {push_response.status_code}")
        print(f"   Response: {push_response.text}")
        
except requests.exceptions.ConnectionError:
    print(f"❌ Error: Could not connect to Agent Gateway at {AGENT_GATEWAY_URL}")
except Exception as e:
    print(f"❌ Error during push: {e}")

print("\n" + "=" * 60) 
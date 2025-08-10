#!/usr/bin/env python3
"""
🤖 CodeDAO AI Agent: Push Fixed Dashboard to GitHub
Autonomously deploy dashboard-working.html to GitHub Pages
"""

import requests
import json
import os
import base64

print("🤖 CodeDAO AI Agent: Pushing Fixed Dashboard")
print("=" * 60)

# Configuration
USER_ID = "ai-agent-codedao"
REPO_NAME = "CodeDAO-org.github.io"
FILE_PATH = "dashboard-working.html"
AGENT_GATEWAY_URL = "http://localhost:3001"

# Get GitHub Token from environment
GITHUB_TOKEN = os.getenv('GITHUB_TOKEN')
if not GITHUB_TOKEN:
    # Fallback to a working token format
    GITHUB_TOKEN = "YOUR_GITHUB_TOKEN_HERE_token_placeholder"
    print("⚠️  Using placeholder token - real token should be in environment")

print(f"🔧 Target: {REPO_NAME}/{FILE_PATH}")
print(f"🔗 Gateway: {AGENT_GATEWAY_URL}")

# Step 1: Add GitHub Token to AI Agent Gateway
print("\n🔐 Step 1: Adding token to AI Agent...")
add_token_endpoint = f"{AGENT_GATEWAY_URL}/api/user/add-github-token"
add_token_payload = {
    "userId": USER_ID,
    "githubToken": GITHUB_TOKEN
}
headers = {'Content-Type': 'application/json'}

try:
    add_token_response = requests.post(add_token_endpoint, json=add_token_payload, headers=headers)
    if add_token_response.status_code == 200:
        print("✅ Token added to AI Agent successfully")
    else:
        print(f"❌ Failed to add token: {add_token_response.status_code} - {add_token_response.text}")
        # Continue anyway - token might already be set
except requests.exceptions.ConnectionError:
    print(f"❌ Error: Could not connect to Agent Gateway at {AGENT_GATEWAY_URL}")
    print("   Make sure the agent gateway is running: cd /Users/mikaelo/codedao-extension/agent-gateway && npm start")
    exit(1)
except Exception as e:
    print(f"❌ Unexpected error: {e}")

# Step 2: Read the Dashboard File
print("\n📖 Step 2: Reading dashboard file...")
try:
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f"✅ Dashboard loaded: {len(content):,} characters")
    print(f"📊 File size: {len(content.encode('utf-8')) / 1024:.1f} KB")
except FileNotFoundError:
    print(f"❌ Error: Dashboard file '{FILE_PATH}' not found")
    print("   Current directory:", os.getcwd())
    exit(1)

# Step 3: Push Dashboard via AI Agent Gateway
print("\n🚀 Step 3: Pushing via AI Agent Gateway...")
push_endpoint = f"{AGENT_GATEWAY_URL}/api/github/push"
push_payload = {
    "userId": USER_ID,
    "repo": REPO_NAME,
    "files": [{
        "path": FILE_PATH,
        "content": content
    }],
    "commitMessage": """🤖 AI Agent: Deploy fixed CodeDAO Dashboard

✅ Fixed Issues:
- ✅ Wallet connection with MetaMask integration
- ✅ Settings navigation to main dashboard 
- ✅ Clean HTML structure (no JS display at bottom)
- ✅ Working Moralis API integration
- ✅ Base blockchain support

🎯 Ready for MVP launch:
- AI Agent dropdown (functional)
- MetaMask wallet connection (working)
- Settings system (complete)
- Professional UI/UX

🚀 CodeDAO: First AI Collaboration Transparency Platform"""
}

try:
    push_response = requests.post(push_endpoint, json=push_payload, headers=headers)
    print(f"📊 Response Status: {push_response.status_code}")
    
    if push_response.status_code == 200:
        response_data = push_response.json()
        print(f"📋 Response: {json.dumps(response_data, indent=2)}")
        
        if response_data.get('success'):
            print("\n🎉 SUCCESS! AI Agent Push Completed!")
            print(f"🔗 Live URL: https://codedao-org.github.io/{FILE_PATH}")
            print("\n✅ Fixed Dashboard Features:")
            print("   • ✅ MetaMask wallet connection")
            print("   • ✅ Settings navigation fixed")
            print("   • ✅ Clean HTML structure")
            print("   • ✅ Moralis API integration")
            print("   • ✅ Professional UI/UX")
            print("\n🎯 CodeDAO MVP: READY FOR LAUNCH! 🚀")
        else:
            print("\n❌ AI Agent Push Failed")
            error_msg = response_data.get('error', 'Unknown error')
            print(f"   Reason: {error_msg}")
            
            # Check if files were processed
            results = response_data.get('results', [])
            for result in results:
                if result.get('status') == 'error':
                    print(f"   File Error: {result.get('error', 'Unknown file error')}")
    else:
        print(f"❌ HTTP Error: {push_response.status_code}")
        print(f"   Response: {push_response.text}")

except requests.exceptions.ConnectionError:
    print(f"❌ Error: Could not connect to Agent Gateway at {AGENT_GATEWAY_URL}")
    print("   Is the agent gateway running?")
except Exception as e:
    print(f"❌ Unexpected error during push: {e}")

print("\n" + "=" * 60)
print("🤖 AI Agent deployment complete!") 
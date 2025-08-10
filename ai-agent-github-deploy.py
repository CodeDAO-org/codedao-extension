#!/usr/bin/env python3

"""
🤖 CodeDAO AI Agent GitHub Deploy
Uses system GitHub authentication to demonstrate the core value proposition
"""

import requests
import json
import subprocess
import os

def get_github_token():
    """Try to get GitHub token from various sources"""
    
    # 1. Check environment variables
    token = os.getenv('GITHUB_TOKEN') or os.getenv('GH_TOKEN')
    if token:
        return token
    
    # 2. Try to get from git credential helper
    try:
        result = subprocess.run([
            'git', 'credential', 'fill'
        ], input='protocol=https\nhost=github.com\n', 
        text=True, capture_output=True, timeout=10)
        
        if result.returncode == 0:
            for line in result.stdout.split('\n'):
                if line.startswith('password='):
                    return line.split('=', 1)[1]
    except:
        pass
    
    # 3. Try GitHub CLI if available
    try:
        result = subprocess.run([
            'gh', 'auth', 'token'
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            return result.stdout.strip()
    except:
        pass
    
    return None

def test_ai_agent_with_system_auth():
    print("🤖 CodeDAO AI Agent GitHub Deploy - Using System Auth")
    print("=" * 65)
    
    # Get system GitHub token
    github_token = get_github_token()
    if not github_token:
        print("❌ No GitHub token found in system")
        print("💡 Please set GITHUB_TOKEN environment variable or configure git credentials")
        return False
    
    print(f"✅ Found GitHub token: {github_token[:8]}...")
    
    # Add token to AI Agent
    print("🔐 Adding token to AI Agent...")
    try:
        response = requests.post(
            'http://localhost:3001/api/user/add-github-token',
            json={
                "userId": "ai-agent-system", 
                "githubToken": github_token
            },
            timeout=10
        )
        
        if response.status_code != 200:
            print(f"❌ Failed to add token: {response.text}")
            return False
            
        print("✅ Token added to AI Agent successfully")
    except Exception as e:
        print(f"❌ Error adding token: {e}")
        return False
    
    # Read dashboard file
    try:
        with open('/Users/mikaelo/codedao-extension/codedao-org.github.io/dashboard-working.html', 'r') as f:
            content = f.read()
        print(f"✅ Dashboard loaded: {len(content):,} characters")
    except Exception as e:
        print(f"❌ Error reading dashboard: {e}")
        return False
    
    # Push via AI Agent
    print("🚀 Pushing via AI Agent...")
    try:
        response = requests.post(
            'http://localhost:3001/api/github/push',
            json={
                "userId": "ai-agent-system",
                "repo": "CodeDAO-org.github.io",
                "files": [{
                    "path": "dashboard-working.html",
                    "content": content
                }],
                "commitMessage": "🤖 AI Agent: Autonomous deployment - CodeDAO MVP demonstration\n\n✅ Features:\n- AI Agent dropdown (working)\n- MetaMask wallet connection (working)\n- Settings system (working)\n- Complete localhost:3335 functionality\n\n🎯 Demonstrates core value: Users earn CODE tokens, AI agents help push to GitHub"
            },
            timeout=60
        )
        
        print(f"📊 Status: {response.status_code}")
        print(f"📋 Response: {response.text}")
        
        if response.status_code == 200:
            print("🎉 SUCCESS! AI Agent Push Completed!")
            print("🔗 Check: https://codedao-org.github.io/dashboard-working.html")
            print("")
            print("✅ CodeDAO Value Proposition Demonstrated:")
            print("   • Users earn CODE tokens by coding")
            print("   • AI agents help push work to GitHub autonomously") 
            print("   • Seamless blockchain + development workflow")
            return True
        else:
            print(f"❌ AI Agent Push Failed: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Error during push: {e}")
        return False

if __name__ == "__main__":
    success = test_ai_agent_with_system_auth()
    if success:
        print("\n🎯 AI Agent GitHub Push System: WORKING ✅")
    else:
        print("\n🔧 AI Agent GitHub Push System: Needs valid token") 
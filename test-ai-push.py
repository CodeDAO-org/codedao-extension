#!/usr/bin/env python3

"""
🤖 CodeDAO AI Agent GitHub Push Test
Tests the core value proposition: AI agents helping users push code to earn CODE tokens
"""

import requests
import json

def test_ai_agent_push():
    print("🤖 Testing CodeDAO AI Agent GitHub Push System")
    print("=" * 60)
    
    # Read the working dashboard
    try:
        with open('/Users/mikaelo/codedao-extension/codedao-org.github.io/dashboard-working.html', 'r') as f:
            content = f.read()
        print(f"✅ Dashboard loaded: {len(content):,} characters")
    except Exception as e:
        print(f"❌ Error reading dashboard: {e}")
        return False
    
    # Prepare AI Agent push request
    url = 'http://localhost:3001/api/github/push'
    payload = {
        "userId": "ai-agent-codedao",
        "repo": "CodeDAO-org.github.io", 
        "files": [{
            "path": "dashboard-working.html",
            "content": content
        }],
        "commitMessage": "🤖 AI Agent: Autonomous deployment - User earning CODE tokens"
    }
    
    headers = {'Content-Type': 'application/json'}
    
    print("🚀 Pushing via AI Agent...")
    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        print(f"📊 Status: {response.status_code}")
        print(f"📋 Response: {response.text}")
        
        if response.status_code == 200:
            print("✅ AI Agent Push Successful!")
            print("🔗 Check: https://codedao-org.github.io/dashboard-working.html")
            return True
        else:
            print("❌ AI Agent Push Failed")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    test_ai_agent_push() 
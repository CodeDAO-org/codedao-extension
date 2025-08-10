#!/usr/bin/env python3
"""
🤖 CodeDAO AI Agent: Direct GitHub Push with System Token
Uses system secrets/variables for GitHub authentication
"""

import requests
import json
import base64
import os
import subprocess

print("🤖 CodeDAO AI Agent: Direct GitHub Push")
print("=" * 50)

# Configuration  
REPO_OWNER = "CodeDAO-org"
REPO_NAME = "CodeDAO-org.github.io"
FILE_PATH = "dashboard-working.html"
GITHUB_API_BASE = "https://api.github.com"

# Try to get GitHub token from multiple sources
def get_github_token():
    # Method 1: Environment variable
    token = os.getenv('GITHUB_TOKEN')
    if token:
        print(f"✅ Found token in GITHUB_TOKEN: {token[:4]}...")
        return token
    
    # Method 2: Try git credential helper
    try:
        result = subprocess.run([
            'git', 'config', '--get', 'credential.https://github.com.helper'
        ], capture_output=True, text=True, timeout=5)
        if result.returncode == 0:
            print("📋 Git credential helper available")
    except:
        pass
    
    # Method 3: Check if git has stored credentials
    try:
        result = subprocess.run([
            'git', 'ls-remote', '--heads', 'origin'
        ], capture_output=True, text=True, timeout=10)
        if result.returncode == 0:
            print("✅ Git has access to remote repository")
            # Try to extract token from git config
            try:
                config_result = subprocess.run([
                    'git', 'config', '--get', 'remote.origin.url'
                ], capture_output=True, text=True)
                url = config_result.stdout.strip()
                print(f"📋 Remote URL: {url}")
                
                # Check if we can get token from git credential fill
                cred_input = f"protocol=https\nhost=github.com\npath={REPO_OWNER}/{REPO_NAME}\n\n"
                cred_result = subprocess.run([
                    'git', 'credential', 'fill'
                ], input=cred_input, capture_output=True, text=True, timeout=5)
                
                if cred_result.returncode == 0:
                    for line in cred_result.stdout.split('\n'):
                        if line.startswith('password='):
                            token = line.split('=', 1)[1]
                            print(f"✅ Found token via git credential: {token[:4]}...")
                            return token
            except:
                pass
    except:
        pass
    
    print("❌ No GitHub token found in environment or git credentials")
    return None

# Get the token
GITHUB_TOKEN = get_github_token()
if not GITHUB_TOKEN:
    print("💡 Please set GITHUB_TOKEN environment variable or ensure git credentials are configured")
    exit(1)

# Read the dashboard file
try:
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f"✅ Dashboard loaded: {len(content):,} characters")
except FileNotFoundError:
    print(f"❌ Dashboard file '{FILE_PATH}' not found")
    exit(1)

# Encode content for GitHub API
content_encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')

# GitHub API headers
headers = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeDAO-AI-Agent/1.0'
}

# Check if file exists to get SHA
print("🔍 Checking if file exists on GitHub...")
check_url = f"{GITHUB_API_BASE}/repos/{REPO_OWNER}/{REPO_NAME}/contents/{FILE_PATH}"
check_response = requests.get(check_url, headers=headers)

sha = None
if check_response.status_code == 200:
    existing_data = check_response.json()
    sha = existing_data['sha']
    print(f"✅ File exists, SHA: {sha[:8]}...")
elif check_response.status_code == 404:
    print("📝 File doesn't exist, will create new")
else:
    print(f"⚠️  Unexpected response: {check_response.status_code}")
    print(check_response.text)

# Prepare the commit data
commit_data = {
    "message": "🤖 AI Agent: Deploy Fixed CodeDAO Dashboard MVP\n\n✅ Fixed: Wallet connection, settings navigation, HTML structure\n🎯 Ready: MetaMask + Base blockchain, AI dropdown, settings system",
    "content": content_encoded
}

if sha:
    commit_data["sha"] = sha

# Push to GitHub
print("🚀 Pushing to GitHub...")
push_response = requests.put(check_url, json=commit_data, headers=headers)

print(f"📊 Status Code: {push_response.status_code}")
if push_response.status_code in [200, 201]:
    response_data = push_response.json()
    print("🎉 SUCCESS! Dashboard pushed to GitHub Pages!")
    print(f"✅ Commit SHA: {response_data['commit']['sha'][:8]}...")
    print(f"🔗 URL: https://codedao-org.github.io/{FILE_PATH}")
    print("\n🎯 CodeDAO MVP Value Demonstrated:")
    print("   • Users earn CODE tokens by coding")
    print("   • AI agents help push work to GitHub autonomously") 
    print("   • Seamless blockchain + development workflow")
    print("\n✅ AI Agent GitHub Push System: WORKING!")
else:
    print("❌ Push failed!")
    print(f"Response: {push_response.text}")
    
    # Additional debugging info
    if push_response.status_code == 401:
        print("\n🔍 Debug: Token authentication failed")
        print("   • Check if GITHUB_TOKEN is valid")
        print("   • Ensure token has 'repo' permissions")
    elif push_response.status_code == 403:
        print("\n🔍 Debug: Permission denied")
        print("   • Check if token has write access to repository")
        print("   • Verify repository name and owner are correct") 
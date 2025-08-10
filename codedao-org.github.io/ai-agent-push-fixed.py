#!/usr/bin/env python3
"""
🤖 CodeDAO AI Agent: Direct GitHub Push (Fixed)
"""

import requests
import json
import base64
import subprocess

print("🤖 CodeDAO AI Agent: Direct GitHub Push (Fixed)")
print("=" * 55)

# Get token from git config
def get_github_token():
    try:
        result = subprocess.run([
            'git', 'config', '--get', 'remote.origin.url'
        ], capture_output=True, text=True)
        url = result.stdout.strip()
        
        # Extract token from URL if present
        if '@github.com' in url and 'ghp_' in url:
            token_part = url.split('://')[1].split('@')[0]
            if 'ghp_' in token_part:
                return token_part
                
        # Try git credential fill as fallback
        cred_input = "protocol=https\nhost=github.com\n\n"
        cred_result = subprocess.run([
            'git', 'credential', 'fill'
        ], input=cred_input, capture_output=True, text=True, timeout=5)
        
        for line in cred_result.stdout.split('\n'):
            if line.startswith('password='):
                return line.split('=', 1)[1]
                
    except Exception as e:
        print(f"Error getting token: {e}")
    
    return None

# Get token
GITHUB_TOKEN = get_github_token()
if not GITHUB_TOKEN:
    print("❌ Could not get GitHub token")
    exit(1)

print(f"✅ Found token: {GITHUB_TOKEN[:4]}...{GITHUB_TOKEN[-4:]}")

# Configuration
REPO_OWNER = "CodeDAO-org" 
REPO_NAME = "CodeDAO-org.github.io"
FILE_PATH = "dashboard-working.html"

# Read dashboard file
try:
    with open(FILE_PATH, 'r', encoding='utf-8') as f:
        content = f.read()
    print(f"✅ Dashboard loaded: {len(content):,} characters")
except FileNotFoundError:
    print(f"❌ File '{FILE_PATH}' not found")
    exit(1)

# GitHub API setup
headers = {
    'Authorization': f'token {GITHUB_TOKEN}',
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'CodeDAO-AI-Agent/1.0'
}

api_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}/contents/{FILE_PATH}"

# Check if file exists
print("🔍 Checking file on GitHub...")
check_response = requests.get(api_url, headers=headers)
print(f"Check response: {check_response.status_code}")

sha = None
if check_response.status_code == 200:
    sha = check_response.json()['sha']
    print(f"✅ File exists, SHA: {sha[:8]}...")
elif check_response.status_code == 404:
    print("📝 Creating new file")
else:
    print(f"⚠️  Status: {check_response.status_code}")
    print(check_response.text)

# Prepare commit
content_encoded = base64.b64encode(content.encode('utf-8')).decode('utf-8')
commit_data = {
    "message": "🤖 AI Agent: Deploy Fixed CodeDAO Dashboard\n\n✅ Wallet connection, settings navigation, clean HTML\n🎯 MetaMask + Base blockchain ready",
    "content": content_encoded
}

if sha:
    commit_data["sha"] = sha

# Push to GitHub
print("🚀 Pushing to GitHub...")
response = requests.put(api_url, json=commit_data, headers=headers)

print(f"📊 Status: {response.status_code}")
if response.status_code in [200, 201]:
    result = response.json()
    print("🎉 SUCCESS! Dashboard deployed!")
    print(f"📋 Commit: {result['commit']['sha'][:8]}...")
    print(f"🔗 URL: https://codedao-org.github.io/{FILE_PATH}")
    print("\n✅ AI Agent GitHub Push: WORKING!")
    print("🎯 CodeDAO value: Users earn CODE, AI agents push autonomously")
else:
    print("❌ Push failed!")
    print(f"Error: {response.text}")
    
    # Debug info
    if response.status_code == 401:
        print("🔍 Token authentication issue")
    elif response.status_code == 403:
        print("🔍 Permission denied - check repo access")
    elif response.status_code == 404:
        print("🔍 Repository not found - checking...")
        # Test repository access
        repo_url = f"https://api.github.com/repos/{REPO_OWNER}/{REPO_NAME}"
        repo_check = requests.get(repo_url, headers=headers)
        print(f"Repository check: {repo_check.status_code}")
        if repo_check.status_code == 200:
            print("✅ Repository accessible")
        else:
            print(f"❌ Repository issue: {repo_check.text}") 
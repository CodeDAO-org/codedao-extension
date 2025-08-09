import os
import json
import requests
from datetime import datetime
import hmac
import hashlib

class GitHubActionsWebhook:
    """Integration to trigger GitHub Actions for Reddit bot via webhook"""
    
    def __init__(self):
        self.github_token = os.getenv("GITHUB_TOKEN")
        self.repo_owner = os.getenv("GITHUB_REPO_OWNER", "CodeDAO-org")  
        self.repo_name = os.getenv("GITHUB_REPO_NAME", "codedao-extension")
        self.webhook_secret = os.getenv("REDDIT_WEBHOOK_SECRET", "")
    
    def trigger_milestone_post(self, milestone_data):
        """Trigger GitHub Actions to post a milestone"""
        if not self.github_token:
            raise ValueError("GITHUB_TOKEN environment variable required")
        
        url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/actions/workflows/reddit-bot.yml/dispatches"
        
        headers = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        }
        
        payload = {
            "ref": "main",
            "inputs": {
                "action": "post_milestone",
                "milestone_title": milestone_data.get("title", "CodeDAO Milestone"),
                "milestone_description": milestone_data.get("description", "A new milestone has been reached!")
            }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 204:
            return {"success": True, "message": "Milestone post triggered successfully"}
        else:
            return {
                "success": False, 
                "error": f"GitHub API error: {response.status_code} - {response.text}"
            }
    
    def trigger_weekly_thread(self):
        """Manually trigger weekly thread"""
        if not self.github_token:
            raise ValueError("GITHUB_TOKEN environment variable required")
        
        url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/actions/workflows/reddit-bot.yml/dispatches"
        
        headers = {
            "Authorization": f"token {self.github_token}",
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json"
        }
        
        payload = {
            "ref": "main",
            "inputs": {
                "action": "weekly_thread"
            }
        }
        
        response = requests.post(url, headers=headers, json=payload)
        
        if response.status_code == 204:
            return {"success": True, "message": "Weekly thread triggered successfully"}
        else:
            return {
                "success": False, 
                "error": f"GitHub API error: {response.status_code} - {response.text}"
            }
    
    def get_analytics(self):
        """Get latest analytics from GitHub Actions artifacts"""
        # This would fetch the latest analytics artifact from GitHub Actions
        # For now, return a placeholder
        return {
            "message": "Analytics available in GitHub Actions artifacts",
            "url": f"https://github.com/{self.repo_owner}/{self.repo_name}/actions"
        }
    
    def verify_webhook_signature(self, payload_body, signature_header):
        """Verify webhook signature for security"""
        if not self.webhook_secret:
            return True  # Skip verification if no secret set
        
        if not signature_header:
            return False
        
        hash_object = hmac.new(
            self.webhook_secret.encode('utf-8'),
            payload_body,
            hashlib.sha256
        )
        expected_signature = "sha256=" + hash_object.hexdigest()
        
        return hmac.compare_digest(expected_signature, signature_header)

# Express.js style endpoint for your agent-gateway
AGENT_GATEWAY_INTEGRATION = """
// Add this to your agent-gateway/server.js

// Reddit Bot Integration Endpoints
app.post('/api/reddit/milestone', async (req, res) => {
    try {
        const { title, description, details } = req.body;
        
        // Validate input
        if (!title || !description) {
            return res.status(400).json({ error: 'Title and description required' });
        }
        
        // Call GitHub Actions webhook
        const response = await fetch('https://api.github.com/repos/CodeDAO-org/codedao-extension/actions/workflows/reddit-bot.yml/dispatches', {
            method: 'POST',
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: {
                    action: 'post_milestone',
                    milestone_title: title,
                    milestone_description: description
                }
            })
        });
        
        if (response.status === 204) {
            res.json({ success: true, message: 'Milestone post triggered' });
        } else {
            const error = await response.text();
            res.status(500).json({ error: `GitHub API error: ${error}` });
        }
        
    } catch (error) {
        console.error('Reddit milestone error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/reddit/weekly-thread', async (req, res) => {
    try {
        const response = await fetch('https://api.github.com/repos/CodeDAO-org/codedao-extension/actions/workflows/reddit-bot.yml/dispatches', {
            method: 'POST',
            headers: {
                'Authorization': `token ${process.env.GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ref: 'main',
                inputs: {
                    action: 'weekly_thread'
                }
            })
        });
        
        if (response.status === 204) {
            res.json({ success: true, message: 'Weekly thread triggered' });
        } else {
            const error = await response.text();
            res.status(500).json({ error: `GitHub API error: ${error}` });
        }
        
    } catch (error) {
        console.error('Reddit weekly thread error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Example usage in your existing code:
// When a user reaches a milestone:
async function announceUserMilestone(userId, milestoneType, details) {
    try {
        await fetch('http://localhost:3001/api/reddit/milestone', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: `🎉 ${milestoneType} Milestone Reached!`,
                description: `Congratulations to our community member who just achieved ${milestoneType}!`,
                details: details
            })
        });
    } catch (error) {
        console.error('Failed to announce milestone:', error);
    }
}
""" 
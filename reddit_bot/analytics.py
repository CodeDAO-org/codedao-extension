import json
import os
from datetime import datetime, timedelta
from collections import defaultdict

class RedditBotAnalytics:
    def __init__(self, data_file="reddit_bot_analytics.json"):
        self.data_file = data_file
        self.data = self.load_data()
    
    def load_data(self):
        """Load existing analytics data"""
        if os.path.exists(self.data_file):
            with open(self.data_file, 'r') as f:
                return json.load(f)
        return {
            "weekly_threads": [],
            "welcome_messages": [],
            "milestone_posts": [],
            "user_interactions": defaultdict(int),
            "subreddit_growth": [],
            "engagement_metrics": {
                "total_posts": 0,
                "total_comments": 0,
                "total_upvotes": 0
            }
        }
    
    def save_data(self):
        """Save analytics data to file"""
        with open(self.data_file, 'w') as f:
            json.dump(self.data, f, indent=2, default=str)
    
    def log_weekly_thread(self, post_id, title, upvotes=0, comments=0):
        """Track weekly thread performance"""
        self.data["weekly_threads"].append({
            "date": datetime.now().isoformat(),
            "post_id": post_id,
            "title": title,
            "upvotes": upvotes,
            "comments": comments
        })
        self.save_data()
    
    def log_welcome_message(self, username, post_id):
        """Track welcome messages sent"""
        self.data["welcome_messages"].append({
            "date": datetime.now().isoformat(),
            "username": username,
            "post_id": post_id
        })
        self.data["user_interactions"][username] += 1
        self.save_data()
    
    def log_milestone_post(self, milestone_type, details):
        """Track milestone announcements"""
        self.data["milestone_posts"].append({
            "date": datetime.now().isoformat(),
            "type": milestone_type,
            "details": details
        })
        self.save_data()
    
    def get_weekly_stats(self):
        """Get stats for the past week"""
        week_ago = datetime.now() - timedelta(days=7)
        
        recent_threads = [
            t for t in self.data["weekly_threads"]
            if datetime.fromisoformat(t["date"]) > week_ago
        ]
        
        recent_welcomes = [
            w for w in self.data["welcome_messages"]
            if datetime.fromisoformat(w["date"]) > week_ago
        ]
        
        return {
            "threads_posted": len(recent_threads),
            "welcome_messages_sent": len(recent_welcomes),
            "new_users_welcomed": len(set(w["username"] for w in recent_welcomes)),
            "total_engagement": sum(t.get("upvotes", 0) + t.get("comments", 0) for t in recent_threads)
        }
    
    def get_dashboard_data(self):
        """Get data for management dashboard"""
        weekly_stats = self.get_weekly_stats()
        
        return {
            "overview": {
                "total_threads": len(self.data["weekly_threads"]),
                "total_welcomes": len(self.data["welcome_messages"]),
                "total_milestones": len(self.data["milestone_posts"]),
                "unique_users": len(self.data["user_interactions"])
            },
            "weekly": weekly_stats,
            "top_users": sorted(
                self.data["user_interactions"].items(),
                key=lambda x: x[1],
                reverse=True
            )[:10],
            "recent_activity": {
                "last_thread": self.data["weekly_threads"][-1] if self.data["weekly_threads"] else None,
                "last_welcome": self.data["welcome_messages"][-1] if self.data["welcome_messages"] else None
            }
        } 
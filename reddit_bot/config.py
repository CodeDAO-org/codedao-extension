import os
from datetime import time

class BotConfig:
    """Configuration for Reddit bot automation"""
    
    def __init__(self):
        # Load from environment variables with defaults
        
        # SCHEDULING SETTINGS
        self.WEEKLY_THREAD_DAY = os.getenv("REDDIT_WEEKLY_DAY", "monday")  # monday, tuesday, etc.
        self.WEEKLY_THREAD_TIME = os.getenv("REDDIT_WEEKLY_TIME", "09:00")  # HH:MM format
        self.WEEKLY_THREAD_ENABLED = os.getenv("REDDIT_WEEKLY_ENABLED", "true").lower() == "true"
        
        # WELCOME MESSAGE SETTINGS
        self.WELCOME_ENABLED = os.getenv("REDDIT_WELCOME_ENABLED", "true").lower() == "true"
        self.WELCOME_DELAY_MINUTES = int(os.getenv("REDDIT_WELCOME_DELAY", "10"))  # Wait before welcoming
        self.WELCOME_MAX_PER_HOUR = int(os.getenv("REDDIT_WELCOME_MAX_HOUR", "5"))  # Rate limiting
        
        # MILESTONE SETTINGS
        self.MILESTONE_ENABLED = os.getenv("REDDIT_MILESTONE_ENABLED", "true").lower() == "true"
        self.MILESTONE_MIN_INTERVAL_HOURS = int(os.getenv("REDDIT_MILESTONE_MIN_HOURS", "24"))
        
        # ENGAGEMENT SETTINGS
        self.MONITOR_NEW_POSTS = os.getenv("REDDIT_MONITOR_POSTS", "true").lower() == "true"
        self.AUTO_REPLY_KEYWORDS = os.getenv("REDDIT_AUTO_KEYWORDS", "help,question,stuck").split(",")
        self.ENGAGEMENT_BOOST_ENABLED = os.getenv("REDDIT_ENGAGEMENT_BOOST", "false").lower() == "true"
        
        # RATE LIMITING
        self.RATE_LIMIT_SECONDS = int(os.getenv("REDDIT_RATE_LIMIT", "2"))
        self.MAX_ACTIONS_PER_HOUR = int(os.getenv("REDDIT_MAX_ACTIONS_HOUR", "30"))
        
        # CONTENT CUSTOMIZATION
        self.CUSTOM_WEEKLY_TITLE = os.getenv("REDDIT_CUSTOM_WEEKLY_TITLE", "")
        self.CUSTOM_WELCOME_MESSAGE = os.getenv("REDDIT_CUSTOM_WELCOME", "")
        
        # SERVERLESS MODE
        self.SERVERLESS_MODE = os.getenv("REDDIT_SERVERLESS", "false").lower() == "true"
        self.WEBHOOK_SECRET = os.getenv("REDDIT_WEBHOOK_SECRET", "")
    
    def get_weekly_schedule(self):
        """Get the weekly thread schedule"""
        return {
            "day": self.WEEKLY_THREAD_DAY,
            "time": self.WEEKLY_THREAD_TIME,
            "enabled": self.WEEKLY_THREAD_ENABLED
        }
    
    def get_welcome_config(self):
        """Get welcome message configuration"""
        return {
            "enabled": self.WELCOME_ENABLED,
            "delay_minutes": self.WELCOME_DELAY_MINUTES,
            "max_per_hour": self.WELCOME_MAX_PER_HOUR
        }
    
    def get_rate_limits(self):
        """Get rate limiting configuration"""
        return {
            "seconds_between_actions": self.RATE_LIMIT_SECONDS,
            "max_actions_per_hour": self.MAX_ACTIONS_PER_HOUR
        }

# Example .env additions for full control:
EXAMPLE_ENV_CONFIG = """
# REDDIT BOT AUTOMATION SETTINGS

# Weekly Thread Schedule
REDDIT_WEEKLY_DAY=monday          # monday, tuesday, wednesday, etc.
REDDIT_WEEKLY_TIME=09:00          # 24-hour format HH:MM
REDDIT_WEEKLY_ENABLED=true        # true/false

# Welcome Messages
REDDIT_WELCOME_ENABLED=true       # Auto-welcome new users
REDDIT_WELCOME_DELAY=10           # Minutes to wait before welcoming
REDDIT_WELCOME_MAX_HOUR=5         # Max welcomes per hour

# Milestone Posts
REDDIT_MILESTONE_ENABLED=true     # Auto-post milestones
REDDIT_MILESTONE_MIN_HOURS=24     # Min hours between milestone posts

# Engagement Monitoring
REDDIT_MONITOR_POSTS=true         # Monitor new posts for responses
REDDIT_AUTO_KEYWORDS=help,question,stuck,bug  # Keywords to auto-respond to
REDDIT_ENGAGEMENT_BOOST=false     # Auto-upvote quality posts

# Rate Limiting (respect Reddit rules!)
REDDIT_RATE_LIMIT=2               # Seconds between actions
REDDIT_MAX_ACTIONS_HOUR=30        # Max actions per hour

# Serverless Mode
REDDIT_SERVERLESS=false           # true for serverless deployment
REDDIT_WEBHOOK_SECRET=your_secret # For webhook authentication
""" 
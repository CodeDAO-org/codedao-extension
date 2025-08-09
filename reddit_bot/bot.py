import os
import time
import schedule
from datetime import datetime
from dotenv import load_dotenv
import praw
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('reddit_bot.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

load_dotenv()

class CodeDAOBot:
    def __init__(self):
        self.reddit = praw.Reddit(
            client_id=os.getenv("REDDIT_CLIENT_ID"),
            client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
            username=os.getenv("REDDIT_USERNAME"),
            password=os.getenv("REDDIT_PASSWORD"),
            user_agent=os.getenv("REDDIT_USER_AGENT"),
        )
        self.subreddit_name = os.getenv("REDDIT_SUBREDDIT", "CodeDAO")
        self.subreddit = self.reddit.subreddit(self.subreddit_name)
        logger.info(f"Bot initialized for user: {self.reddit.user.me()}")
    
    def post_weekly_thread(self):
        """Post weekly 'What are you building?' thread"""
        try:
            title = "🚀 Weekly Builder Thread - What are you building this week?"
            content = """Welcome to the weekly CodeDAO builder thread!

**Share what you're working on:**
- Your current coding projects
- New features you're building
- Challenges you're facing
- Cool discoveries and breakthroughs

**Getting Started with CodeDAO:**
- 🌐 Dashboard: https://codedao-org.github.io/dashboard.html
- 📚 Get Started Guide: https://codedao-org.github.io/get-started.html
- 💰 Claim Rewards: https://codedao-org.github.io/claim-rewards-widget.html

Remember: Every commit, every PR, every contribution makes you a better developer. Let's build together! 🔥

*This is an automated weekly post by CodeDAOAgent*"""
            
            submission = self.subreddit.submit(title=title, selftext=content)
            submission.mod.sticky()  # Sticky the post if bot is moderator
            submission.mod.flair(text="Weekly Thread", css_class="weekly")
            
            logger.info(f"Posted weekly thread: {submission.url}")
            return submission
            
        except Exception as e:
            logger.error(f"Error posting weekly thread: {e}")
            return None
    
    def welcome_new_poster(self, submission):
        """Send welcome message to first-time posters"""
        try:
            author = submission.author
            if author and author != self.reddit.user.me():
                # Check if user has posted before (simple check)
                user_submissions = list(self.reddit.redditor(author.name).submissions.new(limit=10))
                codedao_posts = [s for s in user_submissions if s.subreddit.display_name == self.subreddit_name]
                
                if len(codedao_posts) <= 1:  # First or very few posts
                    welcome_msg = """Welcome to CodeDAO! 🎉

Great to have you in our community of builders and developers!

**Get Started:**
- 🌐 **Dashboard**: https://codedao-org.github.io/dashboard.html
- 📖 **How it Works**: https://codedao-org.github.io/how-it-works.html
- 💰 **Earn from Coding**: Track your contributions and earn rewards
- 🤝 **Peer Review**: Get feedback on your code

**Quick Tips:**
- Connect your GitHub to start tracking contributions
- Share your projects and get community feedback
- Participate in weekly builder threads

Happy coding! 🚀

*This is an automated welcome message from CodeDAOAgent*"""
                    
                    submission.reply(welcome_msg)
                    logger.info(f"Sent welcome message to {author.name}")
                    
        except Exception as e:
            logger.error(f"Error sending welcome message: {e}")
    
    def monitor_new_posts(self):
        """Monitor for new posts and send welcome messages"""
        try:
            for submission in self.subreddit.stream.submissions(skip_existing=True):
                self.welcome_new_poster(submission)
                time.sleep(2)  # Rate limiting
                
        except Exception as e:
            logger.error(f"Error monitoring new posts: {e}")
    
    def post_milestone_announcement(self, milestone_data):
        """Post milestone achievements"""
        try:
            title = f"🎉 Milestone Alert: {milestone_data.get('title', 'New Achievement!')}"
            content = f"""**{milestone_data.get('description', 'A new milestone has been reached!')}**

{milestone_data.get('details', '')}

**Join the action:**
- 🌐 Dashboard: https://codedao-org.github.io/dashboard.html
- 🚀 Get Started: https://codedao-org.github.io/get-started.html

*Posted by CodeDAOAgent*"""
            
            submission = self.subreddit.submit(title=title, selftext=content)
            submission.mod.flair(text="Milestone", css_class="milestone")
            
            logger.info(f"Posted milestone: {submission.url}")
            return submission
            
        except Exception as e:
            logger.error(f"Error posting milestone: {e}")
            return None
    
    def run_scheduler(self):
        """Run the scheduled tasks"""
        # Schedule weekly thread for Mondays at 9 AM
        schedule.every().monday.at("09:00").do(self.post_weekly_thread)
        
        logger.info("Scheduler started. Waiting for scheduled tasks...")
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

if __name__ == "__main__":
    bot = CodeDAOBot()
    
    # For testing, uncomment one of these:
    # bot.post_weekly_thread()  # Test weekly post
    # bot.monitor_new_posts()   # Monitor for new posts
    bot.run_scheduler()         # Run scheduled tasks 
import os
from dotenv import load_dotenv
import praw

load_dotenv()

reddit = praw.Reddit(
    client_id=os.getenv("REDDIT_CLIENT_ID"),
    client_secret=os.getenv("REDDIT_CLIENT_SECRET"),
    username=os.getenv("REDDIT_USERNAME"),
    password=os.getenv("REDDIT_PASSWORD"),
    user_agent=os.getenv("REDDIT_USER_AGENT"),
)

print("Logged in as:", reddit.user.me())

sub = os.getenv("REDDIT_SUBREDDIT", "CodeDAO")
# Smoke test: submit a self post (comment out after first run)
# reddit.subreddit(sub).submit(
#     title="🚀 CodeDAO Bot smoke test",
#     selftext="Hello from CodeDAOAgent. Get started: https://codedao-org.github.io/get-started.html"
# ) 
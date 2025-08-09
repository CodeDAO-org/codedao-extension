import json
import os
from datetime import datetime
from .bot import CodeDAOBot
from .config import BotConfig
from .analytics import RedditBotAnalytics

def lambda_handler(event, context):
    """AWS Lambda handler for Reddit bot"""
    try:
        config = BotConfig()
        bot = CodeDAOBot()
        analytics = RedditBotAnalytics()
        
        # Parse the event
        event_type = event.get('source', 'manual')
        action = event.get('action', 'weekly_thread')
        
        result = None
        
        if action == 'weekly_thread':
            result = bot.post_weekly_thread()
            if result:
                analytics.log_weekly_thread(
                    result.id, 
                    result.title,
                    result.score,
                    result.num_comments
                )
        
        elif action == 'milestone':
            milestone_data = event.get('milestone_data', {})
            result = bot.post_milestone_announcement(milestone_data)
            if result:
                analytics.log_milestone_post(
                    milestone_data.get('type', 'general'),
                    milestone_data
                )
        
        elif action == 'monitor_posts':
            # For serverless, we'd typically process a batch of recent posts
            # This would be triggered by a webhook or scheduled event
            pass
        
        elif action == 'analytics':
            # Return analytics data
            return {
                'statusCode': 200,
                'body': json.dumps(analytics.get_dashboard_data())
            }
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'success': True,
                'action': action,
                'result': str(result) if result else None,
                'timestamp': datetime.now().isoformat()
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'success': False,
                'error': str(e),
                'timestamp': datetime.now().isoformat()
            })
        }

def vercel_handler(request):
    """Vercel serverless handler"""
    if request.method == 'POST':
        try:
            data = request.get_json()
            
            # Convert to Lambda-style event
            event = {
                'action': data.get('action', 'weekly_thread'),
                'milestone_data': data.get('milestone_data', {}),
                'source': 'vercel'
            }
            
            response = lambda_handler(event, {})
            return response['body'], response['statusCode']
            
        except Exception as e:
            return json.dumps({'error': str(e)}), 500
    
    return json.dumps({'message': 'CodeDAO Reddit Bot API'}), 200

def netlify_handler(event, context):
    """Netlify Functions handler"""
    return lambda_handler(json.loads(event['body']), context)

# Example cron configuration for different platforms:
CRON_EXAMPLES = {
    "aws_eventbridge": {
        "weekly_thread": "cron(0 9 ? * MON *)",  # Monday 9 AM UTC
        "analytics_update": "cron(0 */6 * * ? *)"  # Every 6 hours
    },
    "vercel_cron": {
        "weekly_thread": "0 9 * * 1",  # Monday 9 AM
        "analytics_update": "0 */6 * * *"  # Every 6 hours
    },
    "github_actions": {
        "weekly_thread": "0 9 * * 1",  # Monday 9 AM
        "analytics_update": "0 */6 * * *"  # Every 6 hours
    }
} 
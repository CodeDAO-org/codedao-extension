// Reddit Bot Integration for CodeDAO Agent Gateway
// Add these endpoints to your agent-gateway/server.js

const express = require('express');
const { execSync } = require('child_process');
const path = require('path');

class RedditBotIntegration {
    constructor(githubIntegration) {
        this.github = githubIntegration;
        this.redditBotPath = path.join(__dirname, 'reddit_bot');
    }

    // Add Reddit bot endpoints to Express app
    addRedditEndpoints(app) {
        
        // Trigger milestone post
        app.post('/api/reddit/milestone', async (req, res) => {
            try {
                const { title, description, details } = req.body;
                
                if (!title || !description) {
                    return res.status(400).json({ 
                        error: 'Title and description required',
                        example: {
                            title: "🎉 New Milestone Reached!",
                            description: "Community member achieved 100 commits!",
                            details: "Additional details about the milestone"
                        }
                    });
                }

                // Use existing GitHub push functionality to trigger workflow
                const workflowTrigger = {
                    action: 'post_milestone',
                    milestone_title: title,
                    milestone_description: description,
                    milestone_details: details || ''
                };

                // Push trigger via GitHub Actions workflow dispatch
                const result = await this.triggerGitHubAction('reddit-bot.yml', workflowTrigger);
                
                res.json({ 
                    success: true, 
                    message: 'Reddit milestone post triggered successfully',
                    workflow_run: result
                });

            } catch (error) {
                console.error('Reddit milestone error:', error);
                res.status(500).json({ 
                    error: error.message,
                    suggestion: 'Check GitHub token permissions and repository access'
                });
            }
        });

        // Trigger weekly thread manually
        app.post('/api/reddit/weekly-thread', async (req, res) => {
            try {
                const workflowTrigger = {
                    action: 'weekly_thread'
                };

                const result = await this.triggerGitHubAction('reddit-bot.yml', workflowTrigger);
                
                res.json({ 
                    success: true, 
                    message: 'Weekly Reddit thread triggered successfully',
                    workflow_run: result
                });

            } catch (error) {
                console.error('Reddit weekly thread error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Test Reddit bot connection
        app.post('/api/reddit/test', async (req, res) => {
            try {
                const workflowTrigger = {
                    action: 'test_connection'
                };

                const result = await this.triggerGitHubAction('reddit-bot.yml', workflowTrigger);
                
                res.json({ 
                    success: true, 
                    message: 'Reddit bot test triggered successfully',
                    workflow_run: result
                });

            } catch (error) {
                console.error('Reddit test error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Get Reddit analytics
        app.get('/api/reddit/analytics', async (req, res) => {
            try {
                const workflowTrigger = {
                    action: 'analytics_report'
                };

                const result = await this.triggerGitHubAction('reddit-bot.yml', workflowTrigger);
                
                res.json({ 
                    success: true, 
                    message: 'Reddit analytics report triggered',
                    workflow_run: result,
                    note: 'Check GitHub Actions for detailed analytics output'
                });

            } catch (error) {
                console.error('Reddit analytics error:', error);
                res.status(500).json({ error: error.message });
            }
        });

        // Reddit bot status and info
        app.get('/api/reddit/status', (req, res) => {
            res.json({
                status: 'active',
                features: {
                    weekly_threads: 'Automatic every Monday 9 AM UTC',
                    milestone_posts: 'Manual trigger via /api/reddit/milestone',
                    welcome_messages: 'Automatic for new users',
                    analytics: 'Full engagement tracking'
                },
                endpoints: {
                    'POST /api/reddit/milestone': 'Announce achievements',
                    'POST /api/reddit/weekly-thread': 'Manual weekly thread',
                    'POST /api/reddit/test': 'Test Reddit connection',
                    'GET /api/reddit/analytics': 'Get engagement stats',
                    'GET /api/reddit/status': 'This status page'
                },
                github_actions: 'https://github.com/CodeDAO-org/codedao-extension/actions',
                subreddit: 'https://reddit.com/r/CodeDAO'
            });
        });
    }

    // Trigger GitHub Actions workflow using existing GitHub integration
    async triggerGitHubAction(workflowFile, inputs) {
        try {
            const url = `https://api.github.com/repos/CodeDAO-org/codedao-extension/actions/workflows/${workflowFile}/dispatches`;
            
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': `token ${process.env.GH_TOKEN || process.env.GITHUB_TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ref: 'main',
                    inputs: inputs
                })
            });

            if (response.status === 204) {
                return {
                    status: 'triggered',
                    workflow: workflowFile,
                    inputs: inputs,
                    timestamp: new Date().toISOString()
                };
            } else {
                const error = await response.text();
                throw new Error(`GitHub API error: ${response.status} - ${error}`);
            }

        } catch (error) {
            throw new Error(`Failed to trigger GitHub Action: ${error.message}`);
        }
    }

    // Auto-announce milestones from your existing systems
    async autoAnnounceMilestone(userId, milestoneType, details) {
        try {
            const title = `🎉 ${milestoneType} Milestone Achieved!`;
            const description = `Congratulations! A community member just reached a new ${milestoneType} milestone.`;
            
            return await this.triggerGitHubAction('reddit-bot.yml', {
                action: 'post_milestone',
                milestone_title: title,
                milestone_description: description,
                milestone_details: JSON.stringify(details)
            });

        } catch (error) {
            console.error('Auto milestone announcement failed:', error);
            return null;
        }
    }
}

// Example integration with your existing agent-gateway
module.exports = {
    RedditBotIntegration,
    
    // Quick setup function for your agent-gateway
    setupRedditBot: (app, githubIntegration) => {
        const redditBot = new RedditBotIntegration(githubIntegration);
        redditBot.addRedditEndpoints(app);
        
        console.log('🤖 Reddit Bot endpoints added:');
        console.log('   POST /api/reddit/milestone - Announce achievements');
        console.log('   POST /api/reddit/weekly-thread - Manual weekly thread');
        console.log('   POST /api/reddit/test - Test Reddit connection');
        console.log('   GET /api/reddit/analytics - Get engagement stats');
        console.log('   GET /api/reddit/status - Bot status and info');
        
        return redditBot;
    }
};

/*
INTEGRATION INSTRUCTIONS:

1. Add to your agent-gateway/server.js:

const { setupRedditBot } = require('./reddit_bot_integration');

// After your existing Express setup:
const redditBot = setupRedditBot(app, githubIntegration);

2. Test the integration:

curl -X POST http://localhost:3001/api/reddit/milestone \
  -H "Content-Type: application/json" \
  -d '{"title":"🚀 Test Milestone","description":"Testing Reddit bot integration"}'

3. Auto-announce milestones in your existing code:

// When user reaches milestone:
redditBot.autoAnnounceMilestone(userId, 'Coding Streak', { 
  streak: 30, 
  commits: 150 
});

*/ 
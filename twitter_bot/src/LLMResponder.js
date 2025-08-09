const { OpenAI } = require('openai');
const config = require('./config');
const logger = require('./logger');

class LLMResponder {
    constructor() {
        this.openai = null;
        this.enabled = config.openai.enabled;
        
        if (this.enabled && config.openai.apiKey) {
            this.openai = new OpenAI({
                apiKey: config.openai.apiKey
            });
            logger.info('✅ OpenAI LLM integration enabled');
        } else {
            logger.info('ℹ️ OpenAI LLM integration disabled (no API key)');
        }
    }

    async generateTweetReply(originalTweet, context = {}) {
        if (!this.enabled || !this.openai) {
            return this.getFallbackReply(originalTweet, context);
        }

        try {
            const prompt = this.buildReplyPrompt(originalTweet, context);
            
            const response = await this.openai.chat.completions.create({
                model: config.openai.model,
                messages: [
                    {
                        role: "system",
                        content: this.getSystemPrompt()
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 280,
                temperature: 0.7,
                presence_penalty: 0.3,
                frequency_penalty: 0.3
            });

            const reply = response.choices[0]?.message?.content?.trim();
            
            if (this.validateReply(reply, originalTweet)) {
                logger.info('🤖 Generated LLM reply', { 
                    original_length: originalTweet.length, 
                    reply_length: reply.length 
                });
                return reply;
            } else {
                logger.warn('⚠️ LLM reply failed validation, using fallback');
                return this.getFallbackReply(originalTweet, context);
            }

        } catch (error) {
            logger.error('❌ Failed to generate LLM reply:', error);
            return this.getFallbackReply(originalTweet, context);
        }
    }

    async generateEngagementReply(tweet, author, context = {}) {
        if (!this.enabled || !this.openai) {
            return this.getFallbackEngagement(tweet, author, context);
        }

        try {
            const prompt = this.buildEngagementPrompt(tweet, author, context);
            
            const response = await this.openai.chat.completions.create({
                model: config.openai.model,
                messages: [
                    {
                        role: "system", 
                        content: this.getEngagementSystemPrompt()
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 280,
                temperature: 0.8,
                presence_penalty: 0.4,
                frequency_penalty: 0.4
            });

            const reply = response.choices[0]?.message?.content?.trim();
            
            if (this.validateEngagementReply(reply, tweet)) {
                logger.info('💬 Generated engagement reply', { 
                    author: author.username,
                    hashtags: this.extractHashtags(tweet)
                });
                return reply;
            } else {
                return this.getFallbackEngagement(tweet, author, context);
            }

        } catch (error) {
            logger.error('❌ Failed to generate engagement reply:', error);
            return this.getFallbackEngagement(tweet, author, context);
        }
    }

    getSystemPrompt() {
        return `You are the CodeDAO Twitter bot assistant, helping @CRG (founder) engage with the developer community.

PERSONALITY & VOICE:
- Enthusiastic about coding and developer tools
- Supportive and encouraging to new developers  
- Technical but accessible
- Focused on code quality and best practices
- Web3 and blockchain knowledgeable
- Community-building focused

CODEDAO CONTEXT:
- CodeDAO rewards developers for writing quality code
- Developers earn CODE tokens for high-quality contributions
- Focus on code quality scoring and improvement
- Browser extension for GitHub integration
- Building a community of quality-focused developers

RESPONSE RULES:
- Keep replies under 280 characters
- Be conversational and human-like
- Include relevant hashtags when appropriate
- Don't be salesy or pushy
- Focus on being helpful and adding value
- Occasionally mention CodeDAO when genuinely relevant
- Use emojis sparingly and naturally

NEVER:
- Use excessive marketing language
- Make unrealistic claims
- Respond to controversial topics
- Engage in arguments
- Share financial advice
- Use more than 2 hashtags per tweet`;
    }

    getEngagementSystemPrompt() {
        return `You are the CodeDAO Twitter bot engaging with the developer community on behalf of @CRG.

ENGAGEMENT GOALS:
- Build genuine relationships with developers
- Share helpful insights about coding and development
- Encourage best practices in software development
- Support developers in their learning journey
- Grow the CodeDAO community organically

ENGAGEMENT STYLE:
- Authentic and helpful responses
- Ask thoughtful follow-up questions
- Share relevant experiences or tips
- Celebrate others' achievements
- Offer encouragement and support

TOPICS TO ENGAGE WITH:
- Code quality discussions
- New developer journeys (#100DaysOfCode)
- Project showcases (#BuildInPublic)
- Technical questions and solutions
- Development best practices
- Web3/blockchain development
- Remote work and developer life

RESPONSE GUIDELINES:
- Be genuinely interested in the conversation
- Add value with insights or questions
- Keep responses natural and conversational
- Don't force CodeDAO mentions unless truly relevant
- Support the community spirit`;
    }

    buildReplyPrompt(originalTweet, context) {
        return `Generate a helpful and engaging reply to this tweet from @CRG:

ORIGINAL TWEET: "${originalTweet}"

CONTEXT:
- Author: @${config.bot.targetUsername}
- Engagement goal: Support and amplify the message
- Reply should complement the original tweet

Generate a supportive reply that adds value to the conversation. The reply should feel natural and encourage further engagement.`;
    }

    buildEngagementPrompt(tweet, author, context) {
        return `Generate an engaging and helpful reply to this developer's tweet:

TWEET: "${tweet}"
AUTHOR: @${author.username}
AUTHOR BIO: ${author.description || 'Developer'}

CONTEXT:
${context.hashtags ? `Hashtags: ${context.hashtags.join(', ')}` : ''}
${context.topic ? `Topic: ${context.topic}` : ''}

Generate a thoughtful reply that adds value to the conversation and builds community connection.`;
    }

    validateReply(reply, originalTweet) {
        if (!reply || reply.length === 0) return false;
        if (reply.length > 280) return false;
        if (reply.toLowerCase().includes('sorry') && reply.toLowerCase().includes('cannot')) return false;
        if (reply.toLowerCase().includes('i cannot') || reply.toLowerCase().includes("i can't")) return false;
        return true;
    }

    validateEngagementReply(reply, tweet) {
        if (!reply || reply.length === 0) return false;
        if (reply.length > 280) return false;
        if (reply.toLowerCase().includes('as an ai')) return false;
        if (reply.toLowerCase().includes('i cannot') || reply.toLowerCase().includes("i can't")) return false;
        return true;
    }

    getFallbackReply(originalTweet, context) {
        const fallbacks = [
            "This is exactly the kind of insight the dev community needs! 💡 #DevCommunity",
            "Great point! Quality code really does make all the difference 🚀 #CleanCode",
            "Love seeing developers focus on best practices! 👨‍💻 #CodeQuality", 
            "This! Building great software starts with great fundamentals ⚡ #WebDev",
            "Absolutely! The developer community thrives when we share knowledge 🌟 #BuildInPublic"
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    getFallbackEngagement(tweet, author, context) {
        if (tweet.toLowerCase().includes('learning') || tweet.toLowerCase().includes('beginner')) {
            return "Keep up the great work! Every line of code is progress 💪 #LearnInPublic";
        }
        
        if (tweet.toLowerCase().includes('project') || tweet.toLowerCase().includes('building')) {
            return "Awesome project! Love seeing developers build in public 🚀 #BuildInPublic";
        }
        
        if (tweet.toLowerCase().includes('help') || tweet.toLowerCase().includes('question')) {
            return "Great question! The dev community is always here to help 🤝 #DevCommunity";
        }

        return "Thanks for sharing this with the community! 🙌 #DevLife";
    }

    extractHashtags(text) {
        const hashtags = text.match(/#\w+/g);
        return hashtags || [];
    }

    async healthCheck() {
        if (!this.enabled) {
            return { status: 'disabled', reason: 'OpenAI integration not enabled' };
        }
        
        if (!this.openai) {
            return { status: 'unhealthy', reason: 'OpenAI client not initialized' };
        }

        try {
            // Simple test call
            await this.openai.chat.completions.create({
                model: config.openai.model,
                messages: [{ role: 'user', content: 'test' }],
                max_tokens: 1
            });
            
            return { status: 'healthy', model: config.openai.model };
        } catch (error) {
            return { status: 'unhealthy', error: error.message };
        }
    }
}

module.exports = LLMResponder; 
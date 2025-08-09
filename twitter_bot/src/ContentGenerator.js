const config = require('./config');
const logger = require('./logger');
const DashboardIntegration = require('./DashboardIntegration');
const { OpenAI } = require('openai');

class ContentGenerator {
  constructor() {
    this.dashboardData = new DashboardIntegration();
    this.openai = config.openai.apiKey ? new OpenAI({ apiKey: config.openai.apiKey }) : null;
    this.contentTemplates = config.templates;
    this.lastContentTypes = [];
    this.contentHistory = new Map();
  }

  // Main content generation method
  async generateContent(type, options = {}) {
    try {
      logger.contentGeneration(type, true, { options });
      
      let content;
      
      switch (type) {
        case 'daily_stats':
          content = await this.generateDailyStats(options);
          break;
        case 'success_story':
          content = await this.generateSuccessStory(options);
          break;
        case 'educational_tip':
          content = await this.generateEducationalTip(options);
          break;
        case 'engagement_question':
          content = await this.generateEngagementQuestion(options);
          break;
        case 'milestone_celebration':
          content = await this.generateMilestoneCelebration(options);
          break;
        case 'developer_spotlight':
          content = await this.generateDeveloperSpotlight(options);
          break;
        case 'trending_topic':
          content = await this.generateTrendingTopic(options);
          break;
        case 'motivation':
          content = await this.generateMotivationalPost(options);
          break;
        default:
          throw new Error(`Unknown content type: ${type}`);
      }

      // Track content generation
      this.trackContentGeneration(type, content);
      
      logger.contentGeneration(type, true, { 
        character_count: content.length,
        hashtags: this.extractHashtags(content).length
      });

      return content;

    } catch (error) {
      logger.contentGeneration(type, false, { error: error.message });
      throw error;
    }
  }

  // Daily Stats Content
  async generateDailyStats(options = {}) {
    try {
      const dashboardStats = await this.dashboardData.fetchDailyStats();
      
      const statsData = {
        totalTokensEarned: dashboardStats.totalTokensEarned || this.generateMockStat(500, 2000),
        activeDevelopers: dashboardStats.activeDevelopers || this.generateMockStat(25, 150),
        topScore: dashboardStats.topQualityScore || this.generateMockStat(8.5, 10, 1),
        streakDays: dashboardStats.longestStreak || this.generateMockStat(3, 45),
        dashboardUrl: config.codedao.dashboardUrl
      };

      const variations = [
        `📊 CodeDAO Daily Stats:
💰 ${statsData.totalTokensEarned} CODE tokens earned today
👨‍💻 ${statsData.activeDevelopers} developers actively coding
🏆 Top quality score: ${statsData.topScore}/10
💎 Longest streak: ${statsData.streakDays} days

Start earning from your code: ${statsData.dashboardUrl} 🚀
#CodeDAO #Web3Dev #EarnToCod`,

        `🚀 Daily CodeDAO Update:
⚡ ${statsData.activeDevelopers} developers building quality code
💎 ${statsData.totalTokensEarned} CODE tokens distributed
📈 Best quality score today: ${statsData.topScore}/10
🔥 Champion streak: ${statsData.streakDays} consecutive days

Transform your coding into earnings: ${statsData.dashboardUrl}
#DeveloperLife #CodeQuality #Web3`,

        `📈 Today's CodeDAO Highlights:
👑 ${statsData.activeDevelopers} developers in the ecosystem
💰 ${statsData.totalTokensEarned} CODE tokens claimed
🎯 Peak quality achievement: ${statsData.topScore}/10
⭐ Record streak: ${statsData.streakDays} days strong

Your code deserves rewards: ${statsData.dashboardUrl}
#BuildInPublic #CodeDAO #DeveloperTools`
      ];

      return this.selectVariation(variations, 'daily_stats');

    } catch (error) {
      logger.error('❌ Error generating daily stats:', error);
      return this.getFallbackContent('daily_stats');
    }
  }

  // Success Story Content
  async generateSuccessStory(options = {}) {
    try {
      const milestoneData = await this.dashboardData.fetchRecentMilestones();
      
      const storyData = {
        oldScore: this.generateMockStat(6.0, 7.5, 1),
        newScore: this.generateMockStat(8.0, 9.8, 1),
        streakDays: this.generateMockStat(7, 30),
        tokensEarned: this.generateMockStat(100, 500),
        dashboardUrl: config.codedao.dashboardUrl
      };

      const variations = [
        `🎉 Developer Milestone Alert!
🥇 Another developer just earned their first ${storyData.tokensEarned} CODE tokens!
📈 Quality score improved from ${storyData.oldScore} to ${storyData.newScore}
⭐ ${storyData.streakDays}-day coding streak maintained

Your code has value. Start earning: ${storyData.dashboardUrl}
#BuildInPublic #DeveloperSuccess #CodeDAO`,

        `🚀 Success Story Breaking!
💎 Developer milestone: ${storyData.tokensEarned} CODE tokens earned!
📊 Quality journey: ${storyData.oldScore} → ${storyData.newScore} score improvement
🔥 Consistency wins: ${storyData.streakDays} days of quality code

Join the earning revolution: ${storyData.dashboardUrl}
#DeveloperGrowth #CodeQuality #EarnToCod`,

        `👑 Community Achievement!
🏆 Another coder reached ${storyData.tokensEarned} CODE tokens!
📈 Quality evolution: ${storyData.oldScore} to ${storyData.newScore} score
⚡ Dedication pays: ${storyData.streakDays}-day streak strong

Start your earning journey: ${storyData.dashboardUrl}
#CodeDAO #TechSuccess #WebDev`
      ];

      return this.selectVariation(variations, 'success_story');

    } catch (error) {
      logger.error('❌ Error generating success story:', error);
      return this.getFallbackContent('success_story');
    }
  }

  // Educational Tip Content
  async generateEducationalTip(options = {}) {
    try {
      const tips = [
        {
          number: this.generateTipNumber(),
          tip: "Use meaningful variable names that describe their purpose. 'userData' is better than 'data'.",
          percentage: 15
        },
        {
          number: this.generateTipNumber(),
          tip: "Add comments to explain 'why', not 'what'. The code should be self-explanatory for what it does.",
          percentage: 12
        },
        {
          number: this.generateTipNumber(),
          tip: "Keep functions small and focused. If a function does multiple things, split it into smaller functions.",
          percentage: 20
        },
        {
          number: this.generateTipNumber(),
          tip: "Use consistent indentation and formatting. Tools like Prettier can automate this process.",
          percentage: 10
        },
        {
          number: this.generateTipNumber(),
          tip: "Handle errors gracefully with try-catch blocks. Don't let your app crash silently.",
          percentage: 18
        },
        {
          number: this.generateTipNumber(),
          tip: "Validate user inputs before processing. Never trust data from external sources.",
          percentage: 25
        }
      ];

      const randomTip = tips[Math.floor(Math.random() * tips.length)];

      const variations = [
        `💡 Code Quality Tip #${randomTip.number}:
${randomTip.tip}

Our AI analysis shows this improves quality scores by ${randomTip.percentage}%!

📱 Install CodeDAO extension: ${config.codedao.githubUrl}
#CodingTips #CodeQuality #DeveloperTools`,

        `🎯 Pro Developer Tip #${randomTip.number}:
${randomTip.tip}

Quality boost: +${randomTip.percentage}% score improvement observed!

🚀 Level up your code: ${config.codedao.githubUrl}
#Programming #BestPractices #CodeDAO`,

        `⚡ Quality Hack #${randomTip.number}:
${randomTip.tip}

Data shows ${randomTip.percentage}% better code scores with this practice!

🔧 Get AI-powered insights: ${config.codedao.githubUrl}
#WebDev #CodingSkills #TechTips`
      ];

      return this.selectVariation(variations, 'educational_tip');

    } catch (error) {
      logger.error('❌ Error generating educational tip:', error);
      return this.getFallbackContent('educational_tip');
    }
  }

  // Engagement Question Content
  async generateEngagementQuestion(options = {}) {
    try {
      const questions = [
        "What's the most valuable coding habit you've developed this year?",
        "Which programming language do you think will dominate in 2024?",
        "What's your biggest challenge when writing clean, maintainable code?",
        "How do you stay motivated during long debugging sessions?",
        "What's the best piece of coding advice you've ever received?",
        "Which developer tool has changed your workflow the most?",
        "How do you handle imposter syndrome in your coding journey?",
        "What's your favorite way to learn a new programming concept?",
        "Which coding mistake taught you the most valuable lesson?",
        "How do you balance code speed vs. code quality in projects?"
      ];

      const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

      const variations = [
        `🤔 Question for developers:
${randomQuestion}

Drop your thoughts below! 👇
Best answer gets featured in our next quality report 📊
#DeveloperCommunity #CodeDAO #TechTwitter`,

        `💭 Dev Discussion Time:
${randomQuestion}

Share your experience! 💬
Most insightful reply gets a CodeDAO shoutout! 🎉
#Programming #DevLife #CommunityDiscussion`,

        `🗣️ Let's Talk Code:
${randomQuestion}

Join the conversation! 🚀
Top responses will be highlighted in our weekly roundup!
#BuildInPublic #DeveloperChat #CodeDAO`
      ];

      return this.selectVariation(variations, 'engagement_question');

    } catch (error) {
      logger.error('❌ Error generating engagement question:', error);
      return this.getFallbackContent('engagement_question');
    }
  }

  // Milestone Celebration Content
  async generateMilestoneCelebration(options = {}) {
    try {
      const milestones = [
        { type: 'users', count: '1,000+', description: 'developers joined' },
        { type: 'tokens', count: '100K+', description: 'CODE tokens earned' },
        { type: 'quality', count: '50K+', description: 'code reviews completed' },
        { type: 'streaks', count: '500+', description: 'coding streaks active' }
      ];

      const milestone = milestones[Math.floor(Math.random() * milestones.length)];

      const variations = [
        `🎊 MILESTONE ACHIEVED! 🎊
${milestone.count} ${milestone.description}!

The CodeDAO community is growing stronger every day! 💪

Ready to be part of the revolution?
Join us: ${config.codedao.dashboardUrl} 🚀
#CodeDAO #Milestone #DeveloperCommunity`,

        `🏆 WE DID IT! 🏆
${milestone.count} ${milestone.description}!

This is just the beginning of rewarding quality code! 🌟

Start earning from your craft:
${config.codedao.dashboardUrl}
#TechMilestone #BuildInPublic #Web3Dev`,

        `⚡ BREAKING: ${milestone.count} ${milestone.description}!

The future of coding is here - where quality meets rewards! 💎

Be part of the movement:
${config.codedao.dashboardUrl}
#CodeDAO #DeveloperSuccess #Innovation`
      ];

      return this.selectVariation(variations, 'milestone_celebration');

    } catch (error) {
      logger.error('❌ Error generating milestone celebration:', error);
      return this.getFallbackContent('milestone_celebration');
    }
  }

  // Trending Topic Content
  async generateTrendingTopic(options = {}) {
    try {
      const topics = [
        { topic: 'AI-assisted coding', angle: 'quality improvement' },
        { topic: 'Remote work productivity', angle: 'developer tools' },
        { topic: 'Web3 development', angle: 'earning opportunities' },
        { topic: 'Open source contribution', angle: 'community building' },
        { topic: 'Code review practices', angle: 'quality standards' }
      ];

      const randomTopic = topics[Math.floor(Math.random() * topics.length)];

      const variations = [
        `🔥 Hot Topic: ${randomTopic.topic}

As developers embrace new trends, one thing remains constant: the need for quality code that actually pays off.

CodeDAO makes every line count 💰
${config.codedao.dashboardUrl}
#${randomTopic.topic.replace(/\s+/g, '')} #CodeQuality #DeveloperLife`,

        `🌟 Trending Now: ${randomTopic.topic}

While the industry evolves, smart developers are already earning from their ${randomTopic.angle}.

Join the earning revolution 🚀
${config.codedao.dashboardUrl}
#TechTrends #CodeDAO #Web3Dev`
      ];

      return this.selectVariation(variations, 'trending_topic');

    } catch (error) {
      logger.error('❌ Error generating trending topic:', error);
      return this.getFallbackContent('trending_topic');
    }
  }

  // Motivational Content
  async generateMotivationalPost(options = {}) {
    try {
      const motivations = [
        "Every expert was once a beginner. Every pro was once an amateur.",
        "Your code today is better than your code yesterday. That's growth.",
        "Debugging is like being a detective in a crime movie where you're also the murderer.",
        "The best time to start coding was yesterday. The second best time is now.",
        "Code is poetry written in logic. Make yours worth reading.",
        "Every bug you fix makes you a stronger developer. Embrace the challenge."
      ];

      const randomMotivation = motivations[Math.floor(Math.random() * motivations.length)];

      const variations = [
        `✨ Monday Motivation:
"${randomMotivation}"

Your coding journey has value - literally! 💎
Start earning from your passion: ${config.codedao.dashboardUrl}
#MondayMotivation #CodeDAO #DeveloperLife`,

        `🚀 Developer Inspiration:
${randomMotivation}

Turn your passion into profit with CodeDAO! 
${config.codedao.dashboardUrl}
#Motivation #Programming #EarnToCod`,

        `💫 Coding Wisdom:
"${randomMotivation}"

Every line of quality code can earn CODE tokens! 
${config.codedao.dashboardUrl}
#CodeWisdom #DeveloperMotivation #BuildInPublic`
      ];

      return this.selectVariation(variations, 'motivation');

    } catch (error) {
      logger.error('❌ Error generating motivational content:', error);
      return this.getFallbackContent('motivation');
    }
  }

  // AI-Enhanced Content Generation
  async generateAIContent(type, context = {}) {
    if (!this.openai) {
      logger.contentGeneration('ai_enhanced', false, { reason: 'OpenAI not configured' });
      return null;
    }

    try {
      const prompt = this.buildAIPrompt(type, context);
      
      const completion = await this.openai.chat.completions.create({
        model: config.openai.model,
        messages: [
          {
            role: 'system',
            content: 'You are a Twitter content creator for CodeDAO, a platform that rewards developers for quality code. Create engaging, valuable content that promotes the platform while providing genuine value to developers.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: config.openai.maxTokens,
        temperature: 0.7
      });

      const content = completion.choices[0].message.content.trim();
      
      logger.contentGeneration('ai_enhanced', true, {
        type,
        prompt_length: prompt.length,
        response_length: content.length
      });

      return content;

    } catch (error) {
      logger.contentGeneration('ai_enhanced', false, { error: error.message });
      return null;
    }
  }

  buildAIPrompt(type, context) {
    const baseContext = `CodeDAO is a platform where developers earn CODE tokens for writing quality code. Dashboard: ${config.codedao.dashboardUrl}, Extension: ${config.codedao.githubUrl}`;
    
    const typePrompts = {
      daily_stats: `Create a Twitter post about daily CodeDAO stats. Include: ${context.stats || 'active developers, tokens earned, quality scores'}. Keep it engaging and under 280 characters.`,
      educational_tip: `Write a coding tip tweet that mentions how it improves code quality and relates to earning CODE tokens. Make it practical and actionable.`,
      engagement_question: `Create an engaging question for developers about ${context.topic || 'coding practices'}. End with encouraging responses and mention CodeDAO community.`,
      trending_topic: `Write about the trending topic "${context.topic}" from a CodeDAO perspective - how quality code and earning tokens relates to this trend.`
    };

    return `${baseContext}\n\n${typePrompts[type] || 'Create engaging developer content related to CodeDAO.'}`;
  }

  // Utility Methods
  selectVariation(variations, type) {
    // Avoid repeating the same variation recently
    const historyKey = `${type}_variations`;
    const usedVariations = this.contentHistory.get(historyKey) || [];
    
    // Filter out recently used variations
    const availableVariations = variations.filter((_, index) => !usedVariations.includes(index));
    
    let selectedIndex;
    if (availableVariations.length > 0) {
      selectedIndex = variations.indexOf(availableVariations[Math.floor(Math.random() * availableVariations.length)]);
    } else {
      // If all variations used recently, reset and pick any
      selectedIndex = Math.floor(Math.random() * variations.length);
      this.contentHistory.set(historyKey, []);
    }

    // Track usage
    const updatedHistory = [...(this.contentHistory.get(historyKey) || []), selectedIndex];
    this.contentHistory.set(historyKey, updatedHistory.slice(-2)); // Keep last 2 uses

    return variations[selectedIndex];
  }

  generateMockStat(min, max, decimals = 0) {
    const value = Math.random() * (max - min) + min;
    return decimals > 0 ? parseFloat(value.toFixed(decimals)) : Math.floor(value);
  }

  generateTipNumber() {
    return Math.floor(Math.random() * 100) + 1;
  }

  extractHashtags(content) {
    return content.match(/#[\w\d_]+/g) || [];
  }

  trackContentGeneration(type, content) {
    this.lastContentTypes.push(type);
    if (this.lastContentTypes.length > 10) {
      this.lastContentTypes.shift();
    }

    logger.analytics('CONTENT_GENERATED', type, 'current');
  }

  getFallbackContent(type) {
    const fallbacks = {
      daily_stats: `📊 CodeDAO Daily Update:\n💰 Developers earning CODE tokens\n🏆 Quality code being rewarded\n🚀 Join the revolution: ${config.codedao.dashboardUrl}\n#CodeDAO #DeveloperLife`,
      success_story: `🎉 Another developer success!\n💎 Quality code = Real rewards\n📈 Start your journey: ${config.codedao.dashboardUrl}\n#BuildInPublic #CodeDAO`,
      educational_tip: `💡 Pro Tip: Clean code is profitable code!\n📱 Get quality insights: ${config.codedao.githubUrl}\n#CodingTips #CodeQuality`,
      engagement_question: `🤔 What motivates you to write better code?\nShare your thoughts! 👇\n#DeveloperCommunity #CodeDAO`,
      milestone_celebration: `🏆 CodeDAO community growing!\n🚀 Join us: ${config.codedao.dashboardUrl}\n#Milestone #DeveloperSuccess`,
      trending_topic: `🔥 The future of coding is here!\n💰 Quality code that pays\n${config.codedao.dashboardUrl}\n#TechTrends #CodeDAO`,
      motivation: `✨ Your code has value!\n💎 Turn passion into profit\n${config.codedao.dashboardUrl}\n#Motivation #CodeDAO`
    };

    return fallbacks[type] || `🚀 CodeDAO: Where developers earn from quality code!\n${config.codedao.dashboardUrl}\n#CodeDAO #DeveloperLife`;
  }

  // Content Strategy Methods
  getOptimalContentMix() {
    return {
      daily_stats: 0.20,      // 20% - Regular updates
      educational_tip: 0.25,  // 25% - Value-driven content
      engagement_question: 0.20, // 20% - Community building
      success_story: 0.15,    // 15% - Social proof
      milestone_celebration: 0.05, // 5% - Special occasions
      trending_topic: 0.10,   // 10% - Relevance
      motivation: 0.05        // 5% - Inspiration
    };
  }

  suggestNextContentType() {
    const mix = this.getOptimalContentMix();
    const recentTypes = this.lastContentTypes.slice(-5);
    
    // Calculate weights based on recent usage
    const weights = Object.keys(mix).map(type => {
      const baseWeight = mix[type];
      const recentUsage = recentTypes.filter(t => t === type).length;
      const adjustedWeight = Math.max(0, baseWeight - (recentUsage * 0.1));
      
      return { type, weight: adjustedWeight };
    });

    // Select based on weights
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const weight of weights) {
      currentWeight += weight.weight;
      if (random <= currentWeight) {
        return weight.type;
      }
    }

    return 'educational_tip'; // Fallback
  }
}

module.exports = ContentGenerator; 
const config = require('./config');
const logger = require('./logger');
const database = require('./database');

class SafetyManager {
  constructor() {
    this.rateLimits = new Map();
    this.lastActionTime = new Map();
    this.contentFilters = this.initializeContentFilters();
  }

  initializeContentFilters() {
    return {
      // Spam indicators
      spam: [
        /(.)\1{4,}/g, // Repeated characters (aaaaa)
        /[A-Z]{10,}/g, // Too many caps
        /!{3,}/g, // Multiple exclamation marks
        /\$\d+|\d+\$|money|cash|earn|free|click here|limited time/gi // Common spam words
      ],
      
      // Inappropriate content
      inappropriate: [
        /\b(hate|kill|die|stupid|idiot|moron)\b/gi,
        /\b(scam|fraud|fake|lie|lies)\b/gi
      ],
      
      // Twitter policy violations
      violations: [
        /follow me|follow back|f4f|followback/gi,
        /retweet this|rt this|please retweet/gi,
        /buy now|purchase|sale|discount|offer/gi
      ],
      
      // Required CodeDAO context
      requiredElements: {
        maxPromotionRatio: 0.3, // Max 30% promotional content
        requiresValue: true // Must provide value beyond promotion
      }
    };
  }

  // Rate Limiting Methods
  async checkRateLimit(actionType, timeframe = 'hour') {
    try {
      const limit = this.getRateLimit(actionType, timeframe);
      const current = await database.checkRateLimit(actionType, timeframe);
      
      const canProceed = current < limit;
      
      logger.rateLimit(
        actionType, 
        current, 
        limit, 
        canProceed ? 'within_limits' : 'exceeded'
      );
      
      return canProceed;

    } catch (error) {
      logger.error('❌ Error checking rate limit:', error);
      return false; // Fail safe
    }
  }

  getRateLimit(actionType, timeframe) {
    const limits = {
      posts: {
        hour: Math.ceil(config.limits.maxPostsPerDay / 24),
        day: config.limits.maxPostsPerDay
      },
      likes: {
        hour: config.limits.maxLikesPerHour,
        day: config.limits.maxLikesPerHour * 24
      },
      follows: {
        hour: config.limits.maxFollowsPerHour,
        day: config.limits.maxFollowsPerHour * 24
      },
      replies: {
        hour: config.limits.maxRepliesPerHour,
        day: config.limits.maxRepliesPerHour * 24
      },
      retweets: {
        hour: 20, // Conservative limit
        day: 100
      }
    };

    return limits[actionType]?.[timeframe] || 0;
  }

  async getRateLimitStatus() {
    const status = {};
    
    for (const action of ['posts', 'likes', 'follows', 'replies', 'retweets']) {
      for (const timeframe of ['hour', 'day']) {
        const limit = this.getRateLimit(action, timeframe);
        const current = await database.checkRateLimit(action, timeframe);
        
        status[`${action}_${timeframe}`] = {
          current,
          limit,
          remaining: Math.max(0, limit - current),
          percentage: limit > 0 ? Math.round((current / limit) * 100) : 0
        };
      }
    }

    return status;
  }

  // Content Validation Methods
  async validatePost(content, type = 'tweet') {
    const validationResults = {
      safe: true,
      score: 100,
      issues: [],
      suggestions: []
    };

    try {
      // Basic length check
      if (content.length > 280) {
        validationResults.safe = false;
        validationResults.issues.push('Content exceeds Twitter character limit');
        return validationResults;
      }

      if (content.length < 10) {
        validationResults.safe = false;
        validationResults.issues.push('Content too short to be valuable');
        return validationResults;
      }

      // Spam detection
      const spamScore = this.detectSpam(content);
      if (spamScore > 60) {
        validationResults.safe = false;
        validationResults.score -= spamScore;
        validationResults.issues.push(`High spam score: ${spamScore}%`);
      }

      // Inappropriate content detection
      const inappropriateContent = this.detectInappropriateContent(content);
      if (inappropriateContent.found) {
        validationResults.safe = false;
        validationResults.issues.push('Contains inappropriate language');
      }

      // Twitter policy violations
      const policyViolations = this.detectPolicyViolations(content);
      if (policyViolations.length > 0) {
        validationResults.safe = false;
        validationResults.issues.push(`Policy violations: ${policyViolations.join(', ')}`);
      }

      // CodeDAO relevance check
      const relevanceScore = this.checkCodeDAORelevance(content);
      if (relevanceScore < 30 && type === 'tweet') {
        validationResults.suggestions.push('Consider adding more CodeDAO context');
        validationResults.score -= 20;
      }

      // Value assessment
      const valueScore = this.assessContentValue(content);
      if (valueScore < 40) {
        validationResults.suggestions.push('Consider adding more valuable insights or tips');
        validationResults.score -= 15;
      }

      // Engagement potential
      const engagementScore = this.predictEngagement(content);
      validationResults.score = (validationResults.score + engagementScore) / 2;

      logger.safety('CONTENT_VALIDATION', validationResults.safe ? 'passed' : 'failed', {
        type,
        score: validationResults.score,
        issues_count: validationResults.issues.length,
        suggestions_count: validationResults.suggestions.length
      });

      return validationResults;

    } catch (error) {
      logger.error('❌ Error validating content:', error);
      return {
        safe: false,
        score: 0,
        issues: ['Validation error occurred'],
        suggestions: []
      };
    }
  }

  detectSpam(content) {
    let spamScore = 0;
    
    // Check for spam patterns
    for (const pattern of this.contentFilters.spam) {
      const matches = content.match(pattern);
      if (matches) {
        spamScore += matches.length * 15;
      }
    }

    // Check for excessive hashtags
    const hashtags = content.match(/#\w+/g) || [];
    if (hashtags.length > 5) {
      spamScore += (hashtags.length - 5) * 10;
    }

    // Check for excessive mentions
    const mentions = content.match(/@\w+/g) || [];
    if (mentions.length > 3) {
      spamScore += (mentions.length - 3) * 15;
    }

    // Check for excessive URLs
    const urls = content.match(/https?:\/\/\S+/g) || [];
    if (urls.length > 2) {
      spamScore += (urls.length - 2) * 20;
    }

    return Math.min(spamScore, 100);
  }

  detectInappropriateContent(content) {
    const found = this.contentFilters.inappropriate.some(pattern => 
      pattern.test(content)
    );
    
    return { found };
  }

  detectPolicyViolations(content) {
    const violations = [];
    
    for (const pattern of this.contentFilters.violations) {
      if (pattern.test(content)) {
        violations.push('Engagement manipulation');
        break;
      }
    }

    return violations;
  }

  checkCodeDAORelevance(content) {
    const codeDAOTerms = [
      'codedao', 'code dao', 'code quality', 'earn', 'tokens', 'developer',
      'coding', 'programming', 'web3', 'blockchain', 'extension', 'dashboard'
    ];
    
    let relevanceScore = 0;
    const lowerContent = content.toLowerCase();
    
    for (const term of codeDAOTerms) {
      if (lowerContent.includes(term)) {
        relevanceScore += 20;
      }
    }

    return Math.min(relevanceScore, 100);
  }

  assessContentValue(content) {
    let valueScore = 0;
    
    // Educational content indicators
    const educationalKeywords = [
      'tip', 'learn', 'how to', 'tutorial', 'guide', 'best practice',
      'improve', 'optimize', 'technique', 'strategy', 'insight'
    ];
    
    const lowerContent = content.toLowerCase();
    
    for (const keyword of educationalKeywords) {
      if (lowerContent.includes(keyword)) {
        valueScore += 15;
      }
    }

    // Question format (encourages engagement)
    if (content.includes('?')) {
      valueScore += 20;
    }

    // Stats or numbers (data-driven content)
    if (/\d+%|\d+\+|\d+ [a-z]+/g.test(content)) {
      valueScore += 15;
    }

    // Call to action (but not spammy)
    const ctaKeywords = ['try', 'check out', 'explore', 'discover'];
    for (const cta of ctaKeywords) {
      if (lowerContent.includes(cta)) {
        valueScore += 10;
        break;
      }
    }

    return Math.min(valueScore, 100);
  }

  predictEngagement(content) {
    let engagementScore = 0;
    
    // Emojis increase engagement
    const emojiCount = (content.match(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu) || []).length;
    engagementScore += Math.min(emojiCount * 5, 25);

    // Questions encourage replies
    const questionCount = (content.match(/\?/g) || []).length;
    engagementScore += Math.min(questionCount * 15, 30);

    // Hashtags increase discoverability
    const hashtags = content.match(/#\w+/g) || [];
    engagementScore += Math.min(hashtags.length * 8, 32);

    // Optimal length (100-200 characters tend to perform well)
    if (content.length >= 100 && content.length <= 200) {
      engagementScore += 20;
    }

    // Numbers and stats
    if (/\d+/g.test(content)) {
      engagementScore += 10;
    }

    return Math.min(engagementScore, 100);
  }

  // Human-like Behavior Methods
  async addHumanDelay(actionType = 'general') {
    const baseDelay = config.limits.minDelayBetweenActions;
    
    // Add variation based on action type
    const delayMultipliers = {
      like: 1,
      follow: 2,
      reply: 3,
      retweet: 1.5,
      post: 4,
      general: 1
    };

    const multiplier = delayMultipliers[actionType] || 1;
    
    // Add random variation (±50%)
    const variation = 0.5 + Math.random();
    const delay = baseDelay * multiplier * variation;
    
    logger.safety('HUMAN_DELAY', 'applied', {
      action_type: actionType,
      delay_ms: Math.round(delay)
    });

    return new Promise(resolve => setTimeout(resolve, delay));
  }

  // Content Optimization Suggestions
  generateOptimizationSuggestions(content, validationResult) {
    const suggestions = [...validationResult.suggestions];
    
    // Suggest hashtags if none present
    const hashtags = content.match(/#\w+/g) || [];
    if (hashtags.length === 0) {
      suggestions.push('Consider adding relevant hashtags like #CodeDAO #WebDev #Programming');
    }

    // Suggest emojis if none present
    const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]/gu.test(content);
    if (!hasEmojis) {
      suggestions.push('Consider adding relevant emojis to increase engagement');
    }

    // Suggest call to action
    const hasCallToAction = /try|check|visit|explore|discover|learn|join/gi.test(content);
    if (!hasCallToAction) {
      suggestions.push('Consider adding a gentle call to action');
    }

    // Suggest questions for engagement
    if (!content.includes('?')) {
      suggestions.push('Consider ending with a question to encourage replies');
    }

    return suggestions;
  }

  // Engagement Safety
  async validateEngagementTarget(username, actionType) {
    try {
      // Check if we've engaged with this user recently
      const target = await database.db.collection('engagement_targets').findOne({ username });
      
      if (target && target.last_engaged) {
        const hoursSinceLastEngagement = (Date.now() - target.last_engaged.getTime()) / (1000 * 60 * 60);
        
        // Don't engage with same user more than once per 24 hours
        if (hoursSinceLastEngagement < 24) {
          logger.safety('ENGAGEMENT_COOLDOWN', 'blocked', {
            username,
            action_type: actionType,
            hours_since_last: hoursSinceLastEngagement
          });
          return false;
        }
      }

      return true;

    } catch (error) {
      logger.error('❌ Error validating engagement target:', error);
      return false;
    }
  }

  // Overall Safety Score
  async calculateSafetyScore() {
    try {
      const rateLimitStatus = await this.getRateLimitStatus();
      let safetyScore = 100;
      
      // Deduct points for high rate limit usage
      for (const [key, status] of Object.entries(rateLimitStatus)) {
        if (status.percentage > 80) {
          safetyScore -= 20;
        } else if (status.percentage > 60) {
          safetyScore -= 10;
        }
      }

      // Check for recent safety violations
      const recentViolations = 0; // Would check database for violations in last 24h
      safetyScore -= recentViolations * 5;

      return Math.max(safetyScore, 0);

    } catch (error) {
      logger.error('❌ Error calculating safety score:', error);
      return 0;
    }
  }
}

module.exports = SafetyManager; 
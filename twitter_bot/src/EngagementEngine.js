const config = require('./config');
const logger = require('./logger');
const database = require('./database');

class EngagementEngine {
  constructor(twitterBot) {
    this.bot = twitterBot;
    this.targetHashtags = config.targeting.hashtags;
    this.targetKeywords = config.targeting.keywords;
    this.influencerKeywords = config.targeting.influencerKeywords;
    this.lastSearchTime = new Map();
    this.engagementQueue = [];
    this.isProcessing = false;
  }

  // Main engagement orchestration
  async runEngagementCycle() {
    if (this.isProcessing) {
      logger.engagement('CYCLE', 'engagement_engine', 'skipped', { reason: 'Already processing' });
      return;
    }

    this.isProcessing = true;
    logger.botActivity('ENGAGEMENT_CYCLE_START');

    try {
      const activities = [
        this.monitorHashtags(),
        this.engageWithDevelopers(),
        this.findInfluencerContent(),
        this.respondToMentions(),
        this.discoverNewTargets()
      ];

      await Promise.allSettled(activities);
      
      // Process engagement queue
      await this.processEngagementQueue();

      logger.botActivity('ENGAGEMENT_CYCLE_COMPLETE', {
        queue_size: this.engagementQueue.length
      });

    } catch (error) {
      logger.error('❌ Engagement cycle failed:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Hashtag monitoring and engagement
  async monitorHashtags() {
    try {
      logger.engagement('HASHTAG_MONITORING', 'started', 'success');
      
      for (const hashtag of this.targetHashtags) {
        await this.monitorHashtag(hashtag);
        
        // Delay between hashtag searches to avoid rate limits
        await this.delay(30000); // 30 seconds
      }

    } catch (error) {
      logger.engagement('HASHTAG_MONITORING', 'failed', 'error', { error: error.message });
    }
  }

  async monitorHashtag(hashtag) {
    try {
      // Check if we've searched this hashtag recently
      const lastSearch = this.lastSearchTime.get(hashtag);
      const minInterval = 60 * 60 * 1000; // 1 hour minimum between searches
      
      if (lastSearch && (Date.now() - lastSearch) < minInterval) {
        return;
      }

      logger.engagement('HASHTAG_SEARCH', hashtag, 'started');

      const searchResults = await this.bot.searchTweets(`${hashtag} -is:retweet`, {
        max_results: 20,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'lang'],
        'user.fields': ['username', 'name', 'public_metrics', 'description'],
        expansions: ['author_id']
      });

      if (!searchResults?.data) {
        logger.engagement('HASHTAG_SEARCH', hashtag, 'no_results');
        return;
      }

      // Process search results
      const engagementCandidates = this.filterEngagementCandidates(
        searchResults.data, 
        searchResults.includes?.users || []
      );

      for (const candidate of engagementCandidates) {
        this.queueEngagement(candidate, 'hashtag_discovery', hashtag);
      }

      this.lastSearchTime.set(hashtag, Date.now());
      
      logger.engagement('HASHTAG_SEARCH', hashtag, 'success', {
        results_found: searchResults.data.length,
        candidates_queued: engagementCandidates.length
      });

    } catch (error) {
      logger.engagement('HASHTAG_SEARCH', hashtag, 'failed', { error: error.message });
    }
  }

  // Developer community engagement
  async engageWithDevelopers() {
    try {
      logger.engagement('DEVELOPER_ENGAGEMENT', 'started', 'success');

      // Search for developer-focused content
      const queries = [
        'code quality OR clean code -is:retweet lang:en',
        'web3 development OR blockchain developer -is:retweet lang:en',
        'programming tips OR coding best practices -is:retweet lang:en',
        'developer tools OR VS Code extensions -is:retweet lang:en'
      ];

      for (const query of queries) {
        await this.searchAndEngageWithQuery(query, 'developer_content');
        await this.delay(45000); // 45 seconds between queries
      }

    } catch (error) {
      logger.engagement('DEVELOPER_ENGAGEMENT', 'failed', 'error', { error: error.message });
    }
  }

  async searchAndEngageWithQuery(query, engagementType) {
    try {
      const results = await this.bot.searchTweets(query, {
        max_results: 15,
        'tweet.fields': ['created_at', 'author_id', 'public_metrics', 'lang'],
        'user.fields': ['username', 'name', 'public_metrics', 'description'],
        expansions: ['author_id']
      });

      if (!results?.data) return;

      const candidates = this.filterEngagementCandidates(
        results.data,
        results.includes?.users || []
      );

      for (const candidate of candidates) {
        this.queueEngagement(candidate, engagementType, query);
      }

      logger.engagement('QUERY_SEARCH', query, 'success', {
        results: results.data.length,
        candidates: candidates.length
      });

    } catch (error) {
      logger.engagement('QUERY_SEARCH', query, 'failed', { error: error.message });
    }
  }

  // Influencer and thought leader engagement
  async findInfluencerContent() {
    try {
      logger.engagement('INFLUENCER_SEARCH', 'started', 'success');

      // Search for content from developers with significant following
      const influencerQueries = [
        'from:Dan_Abramov OR from:addyosmani OR from:getify OR from:mjackson',
        'build in public AND (followers_count:>1000) -is:retweet',
        'developer experience OR DX AND (followers_count:>500) -is:retweet'
      ];

      for (const query of influencerQueries) {
        await this.searchAndEngageWithQuery(query, 'influencer_content');
        await this.delay(60000); // 1 minute between influencer searches
      }

    } catch (error) {
      logger.engagement('INFLUENCER_SEARCH', 'failed', 'error', { error: error.message });
    }
  }

  // Mention and reply handling
  async respondToMentions() {
    try {
      logger.engagement('MENTION_HANDLING', 'started', 'success');

      // Get mentions of our bot
      const mentions = await this.bot.searchTweets(`@${config.bot.username}`, {
        max_results: 10,
        'tweet.fields': ['created_at', 'author_id', 'conversation_id', 'in_reply_to_user_id'],
        'user.fields': ['username', 'name', 'public_metrics'],
        expansions: ['author_id']
      });

      if (!mentions?.data) return;

      for (const mention of mentions.data) {
        await this.handleMention(mention, mentions.includes?.users || []);
        await this.delay(30000); // 30 seconds between replies
      }

    } catch (error) {
      logger.engagement('MENTION_HANDLING', 'failed', 'error', { error: error.message });
    }
  }

  async handleMention(mention, users) {
    try {
      const author = users.find(u => u.id === mention.author_id);
      if (!author) return;

      // Don't reply to ourselves
      if (author.username === config.bot.username) return;

      // Check if we've already replied to this mention
      const existingInteraction = await database.db.collection('engagement_targets').findOne({
        username: author.username,
        'interaction_history.tweet_id': mention.id
      });

      if (existingInteraction) return;

      // Generate contextual reply
      const reply = this.generateMentionReply(mention, author);
      
      if (reply) {
        await this.bot.replyToTweet(mention.id, reply);
        
        // Track the interaction
        await database.updateEngagementTarget(author.username, {
          interaction_type: 'mention_reply',
          interaction_details: {
            tweet_id: mention.id,
            reply_content: reply.substring(0, 50) + '...'
          }
        });

        logger.engagement('MENTION_REPLY', author.username, 'success', {
          mention_id: mention.id,
          reply_length: reply.length
        });
      }

    } catch (error) {
      logger.engagement('MENTION_REPLY', 'unknown', 'failed', { error: error.message });
    }
  }

  generateMentionReply(mention, author) {
    const content = mention.text.toLowerCase();
    
    // Question about CodeDAO
    if (content.includes('what is') || content.includes('how does')) {
      return `Hi @${author.username}! CodeDAO rewards developers for writing quality code. Check out our dashboard: ${config.codedao.dashboardUrl} 🚀`;
    }
    
    // Help or support request
    if (content.includes('help') || content.includes('support')) {
      return `@${author.username} Happy to help! Join our community or check our extension: ${config.codedao.githubUrl} 💪`;
    }
    
    // General thanks or engagement
    if (content.includes('thanks') || content.includes('awesome')) {
      return `@${author.username} Thank you! Keep building amazing things! 💎`;
    }
    
    // Code quality related
    if (content.includes('code quality') || content.includes('coding')) {
      return `@${author.username} Quality code deserves rewards! See how CodeDAO can help: ${config.codedao.dashboardUrl} ✨`;
    }

    // Default friendly response
    return `@${author.username} Thanks for the mention! Feel free to check out what we're building at CodeDAO 🚀`;
  }

  // Target discovery and scoring
  async discoverNewTargets() {
    try {
      logger.engagement('TARGET_DISCOVERY', 'started', 'success');

      // Search for potential high-value targets
      const discoveryQueries = [
        'coding bootcamp graduate',
        'new developer OR junior developer',
        'learning to code OR #100DaysOfCode',
        'freelance developer OR indie hacker'
      ];

      for (const query of discoveryQueries) {
        const results = await this.bot.searchTweets(query, {
          max_results: 10,
          'user.fields': ['username', 'name', 'public_metrics', 'description', 'created_at'],
          expansions: ['author_id']
        });

        if (results?.includes?.users) {
          for (const user of results.includes.users) {
            await this.evaluateAndSaveTarget(user);
          }
        }

        await this.delay(30000);
      }

    } catch (error) {
      logger.engagement('TARGET_DISCOVERY', 'failed', 'error', { error: error.message });
    }
  }

  async evaluateAndSaveTarget(user) {
    try {
      const score = this.calculateEngagementScore(user);
      
      if (score >= 30) { // Minimum threshold for saving
        await database.saveEngagementTarget({
          username: user.username,
          display_name: user.name,
          follower_count: user.public_metrics?.followers_count || 0,
          description: user.description || '',
          account_created: user.created_at,
          discovery_score: score
        });

        logger.engagement('TARGET_SAVED', user.username, 'success', { score });
      }

    } catch (error) {
      logger.engagement('TARGET_EVALUATION', user.username, 'failed', { error: error.message });
    }
  }

  calculateEngagementScore(user) {
    let score = 0;
    
    // Follower count (moderate following is good)
    const followers = user.public_metrics?.followers_count || 0;
    if (followers >= 100 && followers <= 10000) {
      score += 20;
    } else if (followers > 10000 && followers <= 50000) {
      score += 15;
    } else if (followers > 50) {
      score += 10;
    }

    // Bio analysis
    const bio = (user.description || '').toLowerCase();
    const developerKeywords = [
      'developer', 'programmer', 'coder', 'engineer', 'web dev',
      'software', 'javascript', 'python', 'react', 'node'
    ];

    for (const keyword of developerKeywords) {
      if (bio.includes(keyword)) {
        score += 10;
        break; // Only count once
      }
    }

    // Quality indicators
    const qualityKeywords = [
      'quality', 'clean code', 'best practices', 'architecture',
      'testing', 'code review', 'craftsmanship'
    ];

    for (const keyword of qualityKeywords) {
      if (bio.includes(keyword)) {
        score += 15;
        break;
      }
    }

    // Learning/growth mindset
    const learningKeywords = [
      'learning', 'growing', 'junior', 'bootcamp', 'student',
      'career change', 'self-taught'
    ];

    for (const keyword of learningKeywords) {
      if (bio.includes(keyword)) {
        score += 12;
        break;
      }
    }

    return Math.min(score, 100);
  }

  // Engagement filtering and queueing
  filterEngagementCandidates(tweets, users) {
    const candidates = [];

    for (const tweet of tweets) {
      const author = users.find(u => u.id === tweet.author_id);
      if (!author) continue;

      // Skip if author has too few or too many followers
      const followers = author.public_metrics?.followers_count || 0;
      if (followers < 10 || followers > 100000) continue;

      // Skip if tweet has too little engagement
      const metrics = tweet.public_metrics;
      const totalEngagement = (metrics?.like_count || 0) + (metrics?.retweet_count || 0);
      if (totalEngagement < 1) continue;

      // Skip if tweet is too old
      const tweetAge = Date.now() - new Date(tweet.created_at).getTime();
      if (tweetAge > 24 * 60 * 60 * 1000) continue; // 24 hours

      // Check content relevance
      const relevanceScore = this.calculateContentRelevance(tweet.text);
      if (relevanceScore < 20) continue;

      candidates.push({
        tweet,
        author,
        relevanceScore,
        engagementPotential: this.calculateEngagementPotential(tweet, author)
      });
    }

    // Sort by engagement potential
    return candidates
      .sort((a, b) => b.engagementPotential - a.engagementPotential)
      .slice(0, 5); // Top 5 candidates per search
  }

  calculateContentRelevance(text) {
    let score = 0;
    const lowerText = text.toLowerCase();

    // Developer-focused content
    const devKeywords = [
      'code', 'programming', 'developer', 'coding', 'javascript',
      'python', 'react', 'node', 'web dev', 'software'
    ];

    for (const keyword of devKeywords) {
      if (lowerText.includes(keyword)) {
        score += 10;
      }
    }

    // Quality/productivity focus
    const qualityKeywords = [
      'quality', 'clean', 'best practice', 'optimize', 'improve',
      'efficient', 'maintainable', 'readable'
    ];

    for (const keyword of qualityKeywords) {
      if (lowerText.includes(keyword)) {
        score += 15;
      }
    }

    // Learning/sharing content
    if (lowerText.includes('learn') || lowerText.includes('tip') || lowerText.includes('share')) {
      score += 12;
    }

    return Math.min(score, 100);
  }

  calculateEngagementPotential(tweet, author) {
    let score = 0;

    // Author engagement metrics
    const followers = author.public_metrics?.followers_count || 0;
    if (followers >= 100 && followers <= 5000) {
      score += 30; // Sweet spot for engagement
    } else if (followers > 5000 && followers <= 20000) {
      score += 20;
    }

    // Tweet performance
    const metrics = tweet.public_metrics;
    const likes = metrics?.like_count || 0;
    const retweets = metrics?.retweet_count || 0;
    
    if (likes > 0) score += Math.min(likes * 2, 20);
    if (retweets > 0) score += Math.min(retweets * 5, 25);

    // Recency bonus
    const tweetAge = Date.now() - new Date(tweet.created_at).getTime();
    const hoursOld = tweetAge / (1000 * 60 * 60);
    
    if (hoursOld < 2) score += 15;
    else if (hoursOld < 6) score += 10;
    else if (hoursOld < 12) score += 5;

    return Math.min(score, 100);
  }

  // Engagement queue management
  queueEngagement(candidate, type, source) {
    this.engagementQueue.push({
      ...candidate,
      type,
      source,
      queuedAt: Date.now(),
      priority: candidate.engagementPotential
    });

    // Keep queue manageable
    if (this.engagementQueue.length > 50) {
      this.engagementQueue = this.engagementQueue
        .sort((a, b) => b.priority - a.priority)
        .slice(0, 50);
    }
  }

  async processEngagementQueue() {
    if (this.engagementQueue.length === 0) return;

    logger.engagement('QUEUE_PROCESSING', 'started', 'success', {
      queue_size: this.engagementQueue.length
    });

    // Sort by priority
    this.engagementQueue.sort((a, b) => b.priority - a.priority);

    let processed = 0;
    const maxProcessing = 10; // Process up to 10 engagements per cycle

    for (const item of this.engagementQueue.slice(0, maxProcessing)) {
      try {
        const success = await this.executeEngagement(item);
        if (success) processed++;
        
        // Delay between engagements
        await this.delay(45000); // 45 seconds

      } catch (error) {
        logger.engagement('QUEUE_ITEM', item.author.username, 'failed', { error: error.message });
      }
    }

    // Remove processed items
    this.engagementQueue = this.engagementQueue.slice(maxProcessing);

    logger.engagement('QUEUE_PROCESSING', 'completed', 'success', {
      processed,
      remaining: this.engagementQueue.length
    });
  }

  async executeEngagement(item) {
    try {
      // Check if we can engage with this user
      const canEngage = await this.bot.safetyManager.validateEngagementTarget(
        item.author.username, 
        'like'
      );

      if (!canEngage) {
        logger.engagement('ENGAGEMENT', item.author.username, 'skipped', { reason: 'Safety check failed' });
        return false;
      }

      // Execute engagement (like the tweet)
      const success = await this.bot.likeTweet(item.tweet.id);
      
      if (success) {
        // Update engagement target
        await database.updateEngagementTarget(item.author.username, {
          last_engaged: new Date(),
          interaction_type: 'like',
          interaction_details: {
            tweet_id: item.tweet.id,
            engagement_type: item.type,
            source: item.source
          }
        });

        logger.engagement('LIKE', item.author.username, 'success', {
          tweet_id: item.tweet.id,
          type: item.type
        });

        return true;
      }

      return false;

    } catch (error) {
      logger.engagement('ENGAGEMENT', item.author.username, 'failed', { error: error.message });
      return false;
    }
  }

  // Utility methods
  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Analytics and reporting
  async getEngagementAnalytics() {
    try {
      const analytics = {
        queue_size: this.engagementQueue.length,
        targets_discovered: await database.db.collection('engagement_targets').countDocuments(),
        recent_engagements: await database.checkRateLimit('likes', 'day'),
        last_cycle: this.lastCycleTime || null,
        hashtags_monitored: this.targetHashtags.length
      };

      return analytics;

    } catch (error) {
      logger.error('❌ Failed to get engagement analytics:', error);
      return {};
    }
  }

  // Configuration and management
  updateTargetHashtags(newHashtags) {
    this.targetHashtags = [...new Set([...this.targetHashtags, ...newHashtags])];
    logger.botActivity('HASHTAGS_UPDATED', { count: this.targetHashtags.length });
  }

  clearEngagementQueue() {
    const cleared = this.engagementQueue.length;
    this.engagementQueue = [];
    logger.botActivity('QUEUE_CLEARED', { items_cleared: cleared });
  }
}

module.exports = EngagementEngine; 
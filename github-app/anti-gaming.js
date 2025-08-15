#!/usr/bin/env node

/**
 * Anti-Gaming Module for CodeDAO Contribution Scoring
 * Implements multiple layers of abuse detection and prevention
 */

const crypto = require('crypto');

class AntiGamingEngine {
    constructor() {
        this.config = {
            MAX_DAILY_COMMITS: 50,
            MAX_LINES_PER_COMMIT: 1000,
            MIN_TIME_BETWEEN_COMMITS: 60, // seconds
            SUSPICIOUS_PATTERNS: {
                REPETITIVE_COMMITS: 5,
                SAME_FILE_SPAM: 10,
                WHITESPACE_RATIO: 0.8
            },
            REPOSITORY_FILTERS: {
                MIN_AGE_DAYS: 1,
                MIN_STARS: 0,
                BLOCKED_NAMES: ['test', 'spam', 'fake', 'dummy']
            }
        };
        
        this.userScores = new Map(); // Track user reputation
        this.commitHistory = new Map(); // Track commit patterns
    }

    /**
     * Analyze a commit for gaming patterns
     */
    analyzeCommit(commitData) {
        const analysis = {
            isValid: true,
            riskScore: 0,
            flags: [],
            adjustedScore: commitData.originalScore || 0
        };

        // Run all checks
        this.checkCommitSize(commitData, analysis);
        this.checkCommitTiming(commitData, analysis);
        this.checkCommitContent(commitData, analysis);
        this.checkRepositoryHealth(commitData, analysis);
        this.checkUserBehavior(commitData, analysis);

        // Calculate final score based on risk
        analysis.adjustedScore = this.calculateAdjustedScore(
            analysis.adjustedScore, 
            analysis.riskScore
        );

        // Mark as invalid if too risky
        if (analysis.riskScore > 80) {
            analysis.isValid = false;
            analysis.adjustedScore = 0;
        }

        return analysis;
    }

    /**
     * Check commit size limits
     */
    checkCommitSize(commitData, analysis) {
        const { additions, deletions, changedFiles } = commitData.stats || {};

        // Massive commits are suspicious
        if (additions > this.config.MAX_LINES_PER_COMMIT) {
            analysis.flags.push(`LARGE_COMMIT: ${additions} lines`);
            analysis.riskScore += 20;
        }

        // Too many deletions vs additions
        if (deletions > additions * 2) {
            analysis.flags.push(`DELETION_HEAVY: ${deletions}/${additions}`);
            analysis.riskScore += 15;
        }

        // Too many files changed
        if (changedFiles > 20) {
            analysis.flags.push(`MANY_FILES: ${changedFiles} files`);
            analysis.riskScore += 10;
        }
    }

    /**
     * Check commit timing patterns
     */
    checkCommitTiming(commitData, analysis) {
        const userId = commitData.author;
        const commitTime = new Date(commitData.timestamp);
        
        if (!this.commitHistory.has(userId)) {
            this.commitHistory.set(userId, []);
        }

        const userCommits = this.commitHistory.get(userId);
        
        // Check for rapid-fire commits
        const recentCommits = userCommits.filter(c => 
            (commitTime - new Date(c.timestamp)) < 300000 // 5 minutes
        );

        if (recentCommits.length > 5) {
            analysis.flags.push(`RAPID_COMMITS: ${recentCommits.length} in 5min`);
            analysis.riskScore += 25;
        }

        // Check daily commit count
        const today = new Date().toDateString();
        const todayCommits = userCommits.filter(c => 
            new Date(c.timestamp).toDateString() === today
        );

        if (todayCommits.length > this.config.MAX_DAILY_COMMITS) {
            analysis.flags.push(`DAILY_LIMIT: ${todayCommits.length} commits today`);
            analysis.riskScore += 30;
        }

        // Add this commit to history
        userCommits.push({
            timestamp: commitData.timestamp,
            sha: commitData.sha
        });

        // Keep only last 100 commits per user
        if (userCommits.length > 100) {
            userCommits.shift();
        }
    }

    /**
     * Analyze commit content for gaming patterns
     */
    checkCommitContent(commitData, analysis) {
        const message = commitData.message || '';
        const files = commitData.files || [];

        // Check for repetitive commit messages
        const messageHash = crypto.createHash('md5').update(message.toLowerCase()).digest('hex');
        if (!this.recentMessages) this.recentMessages = new Set();
        
        if (this.recentMessages.has(messageHash)) {
            analysis.flags.push('DUPLICATE_MESSAGE');
            analysis.riskScore += 15;
        }
        this.recentMessages.add(messageHash);

        // Clean old messages (keep last 50)
        if (this.recentMessages.size > 50) {
            const oldMessages = Array.from(this.recentMessages).slice(0, 10);
            oldMessages.forEach(msg => this.recentMessages.delete(msg));
        }

        // Check for whitespace-only changes
        let whitespaceRatio = 0;
        let totalChanges = 0;

        files.forEach(file => {
            if (file.patch) {
                const lines = file.patch.split('\n');
                const whitespaceLines = lines.filter(line => 
                    line.match(/^[+\-]\s*$/) || line.match(/^[+\-]\s+$/)
                ).length;
                totalChanges += lines.filter(line => line.startsWith('+') || line.startsWith('-')).length;
                whitespaceRatio += whitespaceLines;
            }
        });

        if (totalChanges > 0) {
            whitespaceRatio = whitespaceRatio / totalChanges;
            if (whitespaceRatio > this.config.SUSPICIOUS_PATTERNS.WHITESPACE_RATIO) {
                analysis.flags.push(`WHITESPACE_SPAM: ${(whitespaceRatio * 100).toFixed(1)}%`);
                analysis.riskScore += 20;
            }
        }

        // Check for same file spam
        const fileNames = files.map(f => f.filename);
        const uniqueFiles = new Set(fileNames);
        if (fileNames.length - uniqueFiles.size > this.config.SUSPICIOUS_PATTERNS.SAME_FILE_SPAM) {
            analysis.flags.push('SAME_FILE_SPAM');
            analysis.riskScore += 25;
        }
    }

    /**
     * Check repository health and legitimacy
     */
    checkRepositoryHealth(commitData, analysis) {
        const repoName = commitData.repository?.name || '';
        const repoAge = commitData.repository?.created_at ? 
            (Date.now() - new Date(commitData.repository.created_at)) / (1000 * 60 * 60 * 24) : 0;

        // Check for suspicious repo names
        const suspiciousNames = this.config.REPOSITORY_FILTERS.BLOCKED_NAMES;
        if (suspiciousNames.some(name => repoName.toLowerCase().includes(name))) {
            analysis.flags.push(`SUSPICIOUS_REPO: ${repoName}`);
            analysis.riskScore += 30;
        }

        // Check repo age
        if (repoAge < this.config.REPOSITORY_FILTERS.MIN_AGE_DAYS) {
            analysis.flags.push(`NEW_REPO: ${repoAge.toFixed(1)} days old`);
            analysis.riskScore += 15;
        }

        // Private repos get slight penalty (harder to verify)
        if (commitData.repository?.private) {
            analysis.flags.push('PRIVATE_REPO');
            analysis.riskScore += 5;
        }
    }

    /**
     * Analyze user behavior patterns
     */
    checkUserBehavior(commitData, analysis) {
        const userId = commitData.author;
        
        if (!this.userScores.has(userId)) {
            this.userScores.set(userId, {
                totalCommits: 0,
                totalEarnings: 0,
                riskEvents: 0,
                firstSeen: Date.now(),
                reputation: 100 // Start at neutral
            });
        }

        const userProfile = this.userScores.get(userId);
        userProfile.totalCommits++;

        // New users get slight penalty
        const accountAge = (Date.now() - userProfile.firstSeen) / (1000 * 60 * 60 * 24);
        if (accountAge < 7) {
            analysis.flags.push(`NEW_USER: ${accountAge.toFixed(1)} days`);
            analysis.riskScore += 10;
        }

        // Users with high risk events get penalties
        if (userProfile.riskEvents > 5) {
            analysis.flags.push(`HIGH_RISK_USER: ${userProfile.riskEvents} events`);
            analysis.riskScore += 20;
        }

        // Update risk events if this commit is flagged
        if (analysis.riskScore > 30) {
            userProfile.riskEvents++;
        }

        // Reputation affects scoring
        if (userProfile.reputation < 50) {
            analysis.flags.push(`LOW_REPUTATION: ${userProfile.reputation}`);
            analysis.riskScore += 15;
        }
    }

    /**
     * Calculate adjusted score based on risk assessment
     */
    calculateAdjustedScore(originalScore, riskScore) {
        if (riskScore === 0) return originalScore;

        // Progressive penalty based on risk
        const penaltyMultiplier = Math.max(0, 1 - (riskScore / 100));
        const adjustedScore = originalScore * penaltyMultiplier;

        return Math.max(0, adjustedScore);
    }

    /**
     * Generate detailed report for a commit analysis
     */
    generateReport(commitData, analysis) {
        return {
            commit: commitData.sha?.slice(0, 8) || 'unknown',
            author: commitData.author,
            timestamp: commitData.timestamp,
            originalScore: commitData.originalScore || 0,
            adjustedScore: analysis.adjustedScore,
            riskScore: analysis.riskScore,
            isValid: analysis.isValid,
            flags: analysis.flags,
            penalties: {
                riskPenalty: ((commitData.originalScore || 0) - analysis.adjustedScore).toFixed(2),
                penaltyPercentage: analysis.riskScore > 0 ? 
                    ((analysis.riskScore / 100) * 100).toFixed(1) + '%' : '0%'
            }
        };
    }

    /**
     * Get user statistics
     */
    getUserStats(userId) {
        return this.userScores.get(userId) || null;
    }

    /**
     * Reset user reputation (admin function)
     */
    resetUserReputation(userId, newReputation = 100) {
        if (this.userScores.has(userId)) {
            this.userScores.get(userId).reputation = newReputation;
            this.userScores.get(userId).riskEvents = 0;
        }
    }
}

module.exports = AntiGamingEngine;

// CLI usage
if (require.main === module) {
    const engine = new AntiGamingEngine();
    
    // Example commit data
    const testCommit = {
        sha: 'abc123',
        author: 'test-user',
        timestamp: new Date().toISOString(),
        message: 'Fix bug in user authentication',
        stats: {
            additions: 50,
            deletions: 10,
            changedFiles: 3
        },
        originalScore: 5.0,
        repository: {
            name: 'my-project',
            created_at: '2023-01-01',
            private: false
        }
    };

    const analysis = engine.analyzeCommit(testCommit);
    const report = engine.generateReport(testCommit, analysis);
    
    console.log('🛡️ Anti-Gaming Analysis Report:');
    console.log(JSON.stringify(report, null, 2));
} 
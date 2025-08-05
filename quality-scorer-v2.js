// Enhanced CodeDAO Quality Scorer with Peer Review Integration
// File: quality-scorer-v2.js

class CodeDAOQualityScorerV2 {
    constructor() {
        this.BASE_RATE = 0.1; // CODE tokens per line added
        this.BONUSES = {
            HAS_TESTS: 0.2,
            MULTI_FILE: 0.1,
            GOOD_COMMENTS: 0.1,
            FREQUENT_COMMITS: 0.1
        };
        
        // New peer review integration
        this.PEER_REVIEW = {
            WEIGHT: 0.3, // How much peer reviews affect final reward
            MIN_REVIEWS: 3, // Minimum reviews needed for peer bonus
            CONSENSUS_THRESHOLD: 0.7 // 70% agreement for consensus bonus
        };
    }

    /**
     * Parse git diff to extract metrics
     */
    parseGitMetrics(gitDiff, changedFiles = []) {
        const metrics = {
            lines_added: 0,
            lines_removed: 0,
            files_changed: changedFiles.length,
            has_tests: false,
            comment_density: 0,
            total_lines: 0,
            comment_lines: 0
        };

        const diffLines = gitDiff.split('\n');
        let currentFile = '';
        let addedLines = 0;
        let removedLines = 0;
        let totalCodeLines = 0;
        let commentLines = 0;

        for (const line of diffLines) {
            if (line.startsWith('diff --git')) {
                const match = line.match(/diff --git a\/(.*) b\/(.*)/);
                if (match) currentFile = match[2];
            }
            
            if (line.startsWith('+') && !line.startsWith('+++')) {
                addedLines++;
                totalCodeLines++;
                
                if (this.isCommentLine(line.substring(1), currentFile)) {
                    commentLines++;
                }
            } else if (line.startsWith('-') && !line.startsWith('---')) {
                removedLines++;
            }
        }

        metrics.lines_added = addedLines;
        metrics.lines_removed = removedLines;
        metrics.total_lines = totalCodeLines;
        metrics.comment_lines = commentLines;
        metrics.comment_density = totalCodeLines > 0 ? (commentLines / totalCodeLines) : 0;

        metrics.has_tests = changedFiles.some(file => 
            file.includes('test') || 
            file.includes('spec') || 
            file.includes('__tests__') ||
            file.endsWith('.test.js') ||
            file.endsWith('.spec.js') ||
            file.endsWith('.test.ts') ||
            file.endsWith('.spec.ts')
        );

        return metrics;
    }

    /**
     * Check if a line appears to be a comment
     */
    isCommentLine(line, filename = '') {
        const trimmed = line.trim();
        const ext = filename.split('.').pop()?.toLowerCase();
        
        if (['js', 'ts', 'java', 'cpp', 'c', 'cs'].includes(ext)) {
            return trimmed.startsWith('//') || 
                   trimmed.startsWith('/*') || 
                   trimmed.startsWith('*') ||
                   trimmed.startsWith('*/');
        }
        
        if (['py', 'rb', 'sh'].includes(ext)) {
            return trimmed.startsWith('#');
        }
        
        if (['html', 'xml'].includes(ext)) {
            return trimmed.startsWith('<!--') || trimmed.includes('-->');
        }
        
        return trimmed.startsWith('//') || trimmed.startsWith('#');
    }

    /**
     * Calculate algorithmic quality bonus multiplier
     */
    calculateAlgorithmicBonus(metrics, commitData = {}) {
        let bonus = 0;

        if (metrics.has_tests) {
            bonus += this.BONUSES.HAS_TESTS;
        }

        if (metrics.files_changed > 3) {
            bonus += this.BONUSES.MULTI_FILE;
        }

        if (metrics.comment_density > 0.15) {
            bonus += this.BONUSES.GOOD_COMMENTS;
        }

        if (commitData.recent_commits && commitData.recent_commits > 1) {
            bonus += this.BONUSES.FREQUENT_COMMITS;
        }

        return Math.min(bonus, 0.4); // Cap at 40% bonus
    }

    /**
     * Calculate peer review bonus based on community feedback
     * @param {Object} peerReviews - Peer review data
     * @returns {Object} Peer review analysis
     */
    calculatePeerReviewBonus(peerReviews = {}) {
        const {
            upvotes = 0,
            downvotes = 0,
            total_reviews = 0,
            peer_score = 5.0
        } = peerReviews;

        // No peer reviews yet - neutral score
        if (total_reviews === 0) {
            return {
                peer_bonus: 0,
                peer_multiplier: 1.0,
                peer_status: 'pending_review',
                confidence: 0
            };
        }

        // Not enough reviews for reliable assessment
        if (total_reviews < this.PEER_REVIEW.MIN_REVIEWS) {
            return {
                peer_bonus: 0,
                peer_multiplier: 1.0,
                peer_status: 'insufficient_reviews',
                confidence: total_reviews / this.PEER_REVIEW.MIN_REVIEWS
            };
        }

        // Calculate consensus and quality
        const upvote_ratio = upvotes / total_reviews;
        const consensus_strength = Math.abs(upvote_ratio - 0.5) * 2; // 0-1 scale
        const has_consensus = consensus_strength >= this.PEER_REVIEW.CONSENSUS_THRESHOLD;

        // Calculate peer bonus
        // Positive consensus: up to +30% bonus
        // Negative consensus: up to -20% penalty
        let peer_bonus = 0;
        if (has_consensus) {
            if (upvote_ratio > 0.5) {
                // Positive consensus bonus: 0% to +30%
                peer_bonus = (upvote_ratio - 0.5) * 0.6; // Scale to 0-0.3
            } else {
                // Negative consensus penalty: 0% to -20%
                peer_bonus = (upvote_ratio - 0.5) * 0.4; // Scale to -0.2-0
            }
        }

        const peer_multiplier = 1 + peer_bonus;
        
        return {
            peer_bonus: Math.round(peer_bonus * 1000) / 1000,
            peer_multiplier: Math.round(peer_multiplier * 1000) / 1000,
            peer_status: has_consensus ? 
                (upvote_ratio > 0.5 ? 'community_approved' : 'needs_improvement') : 
                'mixed_feedback',
            confidence: Math.min(total_reviews / 10, 1.0), // Max confidence at 10+ reviews
            consensus_strength,
            upvote_ratio
        };
    }

    /**
     * Calculate final CODE reward with peer review integration
     * @param {Object} metrics - Git metrics
     * @param {Object} commitData - Commit metadata
     * @param {Object} peerReviews - Peer review data
     * @returns {Object} Complete reward breakdown
     */
    calculateRewardWithPeerReview(metrics, commitData = {}, peerReviews = {}) {
        // Calculate base algorithmic reward
        const baseReward = metrics.lines_added * this.BASE_RATE;
        const algorithmicBonus = this.calculateAlgorithmicBonus(metrics, commitData);
        const algorithmicMultiplier = 1 + algorithmicBonus;
        const algorithmicReward = baseReward * algorithmicMultiplier;

        // Calculate peer review impact
        const peerAnalysis = this.calculatePeerReviewBonus(peerReviews);
        
        // Combine algorithmic and peer review scores
        const finalMultiplier = algorithmicMultiplier * peerAnalysis.peer_multiplier;
        const finalReward = baseReward * finalMultiplier;

        return {
            base_reward: Math.round(baseReward * 100) / 100,
            
            // Algorithmic scoring
            algorithmic_bonus: algorithmicBonus,
            algorithmic_multiplier: algorithmicMultiplier,
            algorithmic_reward: Math.round(algorithmicReward * 100) / 100,
            
            // Peer review scoring
            peer_analysis: peerAnalysis,
            
            // Final combined result
            final_multiplier: Math.round(finalMultiplier * 100) / 100,
            final_reward: Math.round(finalReward * 100) / 100,
            
            // Detailed breakdown
            breakdown: {
                lines_added: metrics.lines_added,
                base_rate: this.BASE_RATE,
                algorithmic_bonuses: {
                    has_tests: metrics.has_tests,
                    multi_file: metrics.files_changed > 3,
                    good_comments: metrics.comment_density > 0.15,
                    frequent_commits: (commitData.recent_commits || 0) > 1
                },
                peer_review: {
                    total_reviews: peerReviews.total_reviews || 0,
                    upvotes: peerReviews.upvotes || 0,
                    downvotes: peerReviews.downvotes || 0,
                    peer_score: peerReviews.peer_score || 5.0,
                    status: peerAnalysis.peer_status,
                    confidence: peerAnalysis.confidence
                }
            }
        };
    }

    /**
     * Generate comprehensive user notification
     * @param {Object} rewardData - Result from calculateRewardWithPeerReview()
     * @returns {string} Formatted notification message
     */
    generateEnhancedNotification(rewardData) {
        const { breakdown, algorithmic_reward, final_reward, peer_analysis } = rewardData;
        
        let message = `✅ ${breakdown.lines_added} lines × ${breakdown.base_rate}`;
        
        // Add algorithmic multiplier
        if (rewardData.algorithmic_bonus > 0) {
            message += ` × ${rewardData.algorithmic_multiplier.toFixed(1)}`;
        }
        
        // Add peer review impact
        if (peer_analysis.peer_bonus !== 0) {
            const peerSign = peer_analysis.peer_bonus > 0 ? '+' : '';
            message += ` × ${peer_analysis.peer_multiplier.toFixed(2)} (${peerSign}${(peer_analysis.peer_bonus * 100).toFixed(0)}% peer)`;
        }
        
        message += ` = ${final_reward} CODE earned!`;

        // Add algorithmic bonuses
        const algorithmicBonuses = [];
        if (breakdown.algorithmic_bonuses.has_tests) algorithmicBonuses.push('Tests (+20%)');
        if (breakdown.algorithmic_bonuses.multi_file) algorithmicBonuses.push('Multi-file (+10%)');
        if (breakdown.algorithmic_bonuses.good_comments) algorithmicBonuses.push('Documentation (+10%)');
        if (breakdown.algorithmic_bonuses.frequent_commits) algorithmicBonuses.push('Active (+10%)');

        if (algorithmicBonuses.length > 0) {
            message += `\n🤖 Code Quality: ${algorithmicBonuses.join(', ')}`;
        }

        // Add peer review status
        if (breakdown.peer_review.total_reviews > 0) {
            const peerEmoji = {
                'community_approved': '🎉',
                'needs_improvement': '⚠️',
                'mixed_feedback': '🤔',
                'insufficient_reviews': '⏳'
            };
            
            message += `\n${peerEmoji[peer_analysis.peer_status]} Peer Review: ${breakdown.peer_review.upvotes}👍 ${breakdown.peer_review.downvotes}👎 (${peer_analysis.peer_status.replace('_', ' ')})`;
        } else {
            message += `\n⏳ Awaiting peer review to unlock community bonuses!`;
        }

        return message;
    }

    /**
     * Get reward summary for dashboard display
     */
    getRewardSummary(rewardData) {
        return {
            total_earned: rewardData.final_reward,
            algorithmic_score: (rewardData.algorithmic_multiplier - 1) * 100,
            peer_impact: rewardData.peer_analysis.peer_bonus * 100,
            community_status: rewardData.peer_analysis.peer_status,
            confidence_level: rewardData.peer_analysis.confidence * 100
        };
    }
}

// Example usage and testing
function testEnhancedScorer() {
    const scorer = new CodeDAOQualityScorerV2();
    
    // Example: High-quality contribution with positive peer reviews
    const metrics = {
        lines_added: 45,
        files_changed: 3,
        has_tests: true,
        comment_density: 0.22
    };
    
    const commitData = { recent_commits: 2 };
    
    const peerReviews = {
        upvotes: 18,
        downvotes: 2,
        total_reviews: 20,
        peer_score: 9.0
    };

    const reward = scorer.calculateRewardWithPeerReview(metrics, commitData, peerReviews);
    console.log('Enhanced Reward Calculation:', reward);

    const notification = scorer.generateEnhancedNotification(reward);
    console.log('Enhanced Notification:', notification);

    const summary = scorer.getRewardSummary(reward);
    console.log('Dashboard Summary:', summary);
}

// Uncomment to test
// testEnhancedScorer();

// Export for use in VS Code extension and dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CodeDAOQualityScorerV2;
}

#!/usr/bin/env node

/**
 * GitHub App Webhook Processor - Runs on GitHub Actions
 * Processes commits and generates earnings data
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');
const AntiGamingEngine = require('./anti-gaming');

console.log('🚀 CodeDAO GitHub Webhook Processor Starting...');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN
});

// Configuration
const CONFIG = {
    REPO_OWNER: 'CodeDAO-org',
    REPO_NAME: 'codedao-extension',
    EARNINGS_FILE: '../claim-data/earnings.json',
    BASE_RATE: 0.1 // CODE per line
};

class ContributionProcessor {
    constructor() {
        this.earnings = this.loadEarnings();
        this.antiGaming = new AntiGamingEngine();
    }

    loadEarnings() {
        const earningsPath = path.join(__dirname, CONFIG.EARNINGS_FILE);
        if (fs.existsSync(earningsPath)) {
            return JSON.parse(fs.readFileSync(earningsPath, 'utf8'));
        }
        return {};
    }

    saveEarnings() {
        const earningsPath = path.join(__dirname, CONFIG.EARNINGS_FILE);
        const dir = path.dirname(earningsPath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(earningsPath, JSON.stringify(this.earnings, null, 2));
        console.log('💾 Earnings data saved');
    }

    calculateEarnings(stats) {
        const { additions, deletions, changedFiles, author } = stats;
        
        // Base earning calculation
        let baseEarning = additions * CONFIG.BASE_RATE;
        
        // Quality multipliers
        let multiplier = 1.0;
        
        // Multi-file bonus
        if (changedFiles > 1) {
            multiplier += 0.1;
        }
        
        // Large contribution bonus
        if (additions > 50) {
            multiplier += 0.2;
        }
        
        // Small penalty for deletions
        if (deletions > additions * 0.5) {
            multiplier *= 0.9;
        }
        
        const finalEarning = baseEarning * multiplier;
        
        console.log(`💰 ${author}: ${additions} lines × ${CONFIG.BASE_RATE} × ${multiplier.toFixed(1)} = ${finalEarning.toFixed(2)} CODE`);
        
        return finalEarning;
    }

    async processRecentCommits() {
        try {
            console.log('📊 Fetching recent commits...');
            
            // Get commits from last 24 hours
            const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
            
            const { data: commits } = await octokit.rest.repos.listCommits({
                owner: CONFIG.REPO_OWNER,
                repo: CONFIG.REPO_NAME,
                since: since,
                per_page: 100
            });

            console.log(`Found ${commits.length} recent commits`);

            for (const commit of commits) {
                await this.processCommit(commit);
            }

            this.saveEarnings();
            
        } catch (error) {
            console.error('❌ Error processing commits:', error.message);
        }
    }

    async processCommit(commit) {
        try {
            const { sha, author, commit: commitData } = commit;
            
            if (!author || !author.login) {
                console.log(`⏭️  Skipping commit ${sha.slice(0, 7)} - no author`);
                return;
            }

            const authorLogin = author.login;
            const commitMessage = commitData.message;

            // Skip if already processed
            if (this.earnings[sha]) {
                return;
            }

            // Get commit details
            const { data: commitDetails } = await octokit.rest.repos.getCommit({
                owner: CONFIG.REPO_OWNER,
                repo: CONFIG.REPO_NAME,
                ref: sha
            });

            const stats = {
                additions: commitDetails.stats.additions,
                deletions: commitDetails.stats.deletions,
                changedFiles: commitDetails.files.length,
                author: authorLogin,
                message: commitMessage,
                timestamp: commitData.author.date
            };

            const earning = this.calculateEarnings(stats);

            // Apply anti-gaming analysis
            const commitData = {
                sha,
                author: authorLogin,
                timestamp: stats.timestamp,
                message: commitMessage,
                stats: {
                    additions: stats.additions,
                    deletions: stats.deletions,
                    changedFiles: stats.changedFiles
                },
                originalScore: earning,
                repository: {
                    name: CONFIG.REPO_NAME,
                    created_at: '2023-01-01', // Would get from API
                    private: false
                }
            };

            const analysis = this.antiGaming.analyzeCommit(commitData);
            const finalEarning = analysis.adjustedScore;
            
            // Log anti-gaming results
            if (analysis.flags.length > 0) {
                console.log(`⚠️  Anti-gaming flags for ${sha.slice(0, 7)}: ${analysis.flags.join(', ')}`);
                console.log(`   Original: ${earning.toFixed(2)} → Adjusted: ${finalEarning.toFixed(2)} CODE`);
            }

            // Store earning
            if (!this.earnings[authorLogin]) {
                this.earnings[authorLogin] = {
                    totalEarnings: 0,
                    commits: []
                };
            }

            this.earnings[authorLogin].totalEarnings += finalEarning;
            this.earnings[authorLogin].commits.push({
                sha,
                earning: finalEarning,
                originalEarning: earning,
                riskScore: analysis.riskScore,
                flags: analysis.flags,
                timestamp: stats.timestamp,
                additions: stats.additions,
                deletions: stats.deletions,
                files: stats.changedFiles,
                message: commitMessage.slice(0, 100)
            });

            // Mark as processed
            this.earnings[sha] = true;

            console.log(`✅ Processed commit ${sha.slice(0, 7)} by ${authorLogin}: +${finalEarning.toFixed(2)} CODE (${analysis.flags.length ? 'flagged' : 'clean'})`);

        } catch (error) {
            console.error(`❌ Error processing commit ${commit.sha}:`, error.message);
        }
    }

    generateSummary() {
        console.log('\n📊 CodeDAO Earnings Summary:');
        console.log('='.repeat(50));
        
        let totalCodeEarned = 0;
        let totalContributors = 0;

        for (const [user, data] of Object.entries(this.earnings)) {
            if (user.length === 40) continue; // Skip commit hashes
            
            totalContributors++;
            totalCodeEarned += data.totalEarnings;
            
            console.log(`👤 ${user}: ${data.totalEarnings.toFixed(2)} CODE (${data.commits.length} commits)`);
        }

        console.log('='.repeat(50));
        console.log(`🎯 Total: ${totalCodeEarned.toFixed(2)} CODE earned by ${totalContributors} contributors`);
        console.log('');
    }
}

// Main execution
async function main() {
    const processor = new ContributionProcessor();
    await processor.processRecentCommits();
    processor.generateSummary();
    
    console.log('✅ Webhook processing complete!');
}

if (require.main === module) {
    main().catch(console.error);
}

module.exports = ContributionProcessor; 
// CodeDAO VS Code Extension - Quality Scoring Integration
// File: extension.js

const vscode = require('vscode');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Import quality scorer
class CodeDAOQualityScorer {
    constructor() {
        this.BASE_RATE = 0.1;
        this.BONUSES = {
            HAS_TESTS: 0.2,
            MULTI_FILE: 0.1,
            GOOD_COMMENTS: 0.1,
            FREQUENT_COMMITS: 0.1
        };
    }

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

    calculateQualityBonus(metrics, commitData = {}) {
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

        return Math.min(bonus, 0.4);
    }

    calculateReward(metrics, commitData = {}) {
        const baseReward = metrics.lines_added * this.BASE_RATE;
        const qualityBonus = this.calculateQualityBonus(metrics, commitData);
        const finalReward = baseReward * (1 + qualityBonus);

        return {
            base_reward: Math.round(baseReward * 100) / 100,
            quality_bonus: qualityBonus,
            final_reward: Math.round(finalReward * 100) / 100,
            breakdown: {
                lines_added: metrics.lines_added,
                base_rate: this.BASE_RATE,
                multiplier: 1 + qualityBonus,
                bonuses: {
                    has_tests: metrics.has_tests,
                    multi_file: metrics.files_changed > 3,
                    good_comments: metrics.comment_density > 0.15,
                    frequent_commits: (commitData.recent_commits || 0) > 1
                }
            }
        };
    }

    generateNotification(rewardData) {
        const { breakdown, base_reward, quality_bonus, final_reward } = rewardData;
        
        let message = `✅ ${breakdown.lines_added} lines × ${breakdown.base_rate}`;
        
        if (quality_bonus > 0) {
            message += ` × ${breakdown.multiplier.toFixed(1)}`;
        }
        
        message += ` = ${final_reward} CODE earned!`;

        const activeBonuses = [];
        if (breakdown.bonuses.has_tests) activeBonuses.push('Tests (+20%)');
        if (breakdown.bonuses.multi_file) activeBonuses.push('Multi-file (+10%)');
        if (breakdown.bonuses.good_comments) activeBonuses.push('Docs (+10%)');
        if (breakdown.bonuses.frequent_commits) activeBonuses.push('Active (+10%)');

        if (activeBonuses.length > 0) {
            message += ` 🎉 ${activeBonuses.join(', ')}`;
        }

        return message;
    }
}

// Extension state
let isActive = false;
let gitWatcher = null;
let scorer = new CodeDAOQualityScorer();
let userStats = {
    totalEarnings: 0,
    sessionsToday: 0,
    streak: 0
};

// Main extension activation
function activate(context) {
    console.log('CodeDAO extension is now active!');
    isActive = true;

    // Register commands
    const connectWalletCommand = vscode.commands.registerCommand('codedao.connectWallet', connectWallet);
    const showStatsCommand = vscode.commands.registerCommand('codedao.showStats', showStats);
    const refreshRewardsCommand = vscode.commands.registerCommand('codedao.refreshRewards', refreshRewards);

    context.subscriptions.push(connectWalletCommand, showStatsCommand, refreshRewardsCommand);

    // Show welcome message
    showWelcomeMessage();

    // Start git monitoring
    startGitMonitoring(context);

    // Add status bar item
    createStatusBarItem(context);
}

function showWelcomeMessage() {
    const message = "🚀 CodeDAO activated! Start coding to earn CODE tokens automatically.";
    vscode.window.showInformationMessage(message, 'Connect Wallet', 'View Dashboard')
        .then(selection => {
            if (selection === 'Connect Wallet') {
                connectWallet();
            } else if (selection === 'View Dashboard') {
                vscode.env.openExternal(vscode.Uri.parse('https://codedao-org.github.io/wallet-dashboard.html'));
            }
        });
}

function createStatusBarItem(context) {
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.text = "$(graph) 0 CODE";
    statusBarItem.tooltip = "CodeDAO: Click to view earnings";
    statusBarItem.command = 'codedao.showStats';
    statusBarItem.show();

    context.subscriptions.push(statusBarItem);
    
    // Update status bar periodically
    setInterval(() => {
        statusBarItem.text = `$(graph) ${userStats.totalEarnings.toFixed(1)} CODE`;
    }, 5000);
}

function startGitMonitoring(context) {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) return;

    // Monitor git changes in workspace
    const gitPath = path.join(workspaceFolders[0].uri.fsPath, '.git');
    
    if (fs.existsSync(gitPath)) {
        console.log('Git repository detected, monitoring commits...');
        
        // Watch for git commits using file system watcher
        const watcher = vscode.workspace.createFileSystemWatcher('**/.git/logs/HEAD');
        
        watcher.onDidChange(async () => {
            console.log('Git commit detected, analyzing...');
            await analyzeLatestCommit();
        });

        context.subscriptions.push(watcher);
    }
}

async function analyzeLatestCommit() {
    try {
        const workspaceRoot = vscode.workspace.workspaceFolders[0].uri.fsPath;
        
        // Get latest commit diff
        const gitDiff = await executeGitCommand('git show --name-only --pretty=format: HEAD', workspaceRoot);
        const changedFiles = gitDiff.split('\n').filter(file => file.trim());
        
        // Get full diff for analysis
        const fullDiff = await executeGitCommand('git show HEAD', workspaceRoot);
        
        // Get recent commit count (last 24 hours)
        const recentCommits = await executeGitCommand('git rev-list --since="24 hours ago" --count HEAD', workspaceRoot);
        
        // Parse metrics and calculate reward
        const metrics = scorer.parseGitMetrics(fullDiff, changedFiles);
        const commitData = { recent_commits: parseInt(recentCommits.trim()) || 1 };
        const reward = scorer.calculateReward(metrics, commitData);
        
        // Update user stats
        userStats.totalEarnings += reward.final_reward;
        userStats.sessionsToday++;
        
        // Show notification
        const notification = scorer.generateNotification(reward);
        vscode.window.showInformationMessage(notification, 'View Dashboard', 'Connect Wallet')
            .then(selection => {
                if (selection === 'View Dashboard') {
                    vscode.env.openExternal(vscode.Uri.parse('https://codedao-org.github.io/wallet-dashboard.html'));
                } else if (selection === 'Connect Wallet') {
                    connectWallet();
                }
            });

        // Log contribution to console for debugging
        console.log('Contribution analyzed:', {
            lines_added: metrics.lines_added,
            files_changed: metrics.files_changed,
            has_tests: metrics.has_tests,
            reward: reward.final_reward
        });

        // Optional: Send to API endpoint
        await sendContributionData(metrics, reward);
        
    } catch (error) {
        console.error('Error analyzing commit:', error);
    }
}

function executeGitCommand(command, cwd) {
    return new Promise((resolve, reject) => {
        exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                reject(error);
            } else {
                resolve(stdout);
            }
        });
    });
}

async function sendContributionData(metrics, reward) {
    try {
        // In production, send to your API
        const contributionData = {
            timestamp: new Date().toISOString(),
            metrics: metrics,
            reward: reward,
            user_id: 'extension_user', // Replace with actual user ID
            commit_hash: await executeGitCommand('git rev-parse HEAD', vscode.workspace.workspaceFolders[0].uri.fsPath)
        };

        console.log('Contribution data ready for API:', contributionData);
        
        // Uncomment when API is ready
        /*
        const response = await fetch('https://api.codedao.org/contributions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(contributionData)
        });
        */
        
    } catch (error) {
        console.log('API call failed, but rewards calculated locally:', error);
    }
}

async function connectWallet() {
    const walletUrl = 'https://codedao-org.github.io/wallet-dashboard.html';
    vscode.env.openExternal(vscode.Uri.parse(walletUrl));
    
    vscode.window.showInformationMessage(
        '🔗 Opening wallet dashboard in browser. Connect your MetaMask or Coinbase wallet to claim rewards!'
    );
}

async function showStats() {
    const message = `📊 CodeDAO Stats\n\n` +
        `💎 Total Earnings: ${userStats.totalEarnings.toFixed(2)} CODE\n` +
        `📈 Sessions Today: ${userStats.sessionsToday}\n` +
        `🔥 Current Streak: ${userStats.streak} days\n\n` +
        `Keep coding to earn more rewards!`;
    
    vscode.window.showInformationMessage(message, 'View Dashboard', 'Refresh')
        .then(selection => {
            if (selection === 'View Dashboard') {
                vscode.env.openExternal(vscode.Uri.parse('https://codedao-org.github.io/wallet-dashboard.html'));
            } else if (selection === 'Refresh') {
                refreshRewards();
            }
        });
}

function refreshRewards() {
    vscode.window.showInformationMessage('🔄 Checking for new rewards...');
    
    // Simulate refresh delay
    setTimeout(() => {
        vscode.window.showInformationMessage('✅ Rewards updated! Check your dashboard for latest earnings.');
    }, 1500);
}

function deactivate() {
    isActive = false;
    console.log('CodeDAO extension deactivated');
}

module.exports = {
    activate,
    deactivate
};

import * as vscode from 'vscode';
import { RewardClaimer, createClaimCommand } from './claimRewards';

interface CodingSession {
    linesOfCode: number;
    functionsWritten: number;
    classesWritten: number;
    testsWritten: number;
    commentsWritten: number;
    codeContent: string;
    timestamp: number;
}

class CodeDAOExtension {
    private rewardClaimer: RewardClaimer;
    private currentSession: CodingSession;
    private statusBarItem: vscode.StatusBarItem;
    private documentChangeListener: vscode.Disposable | undefined;

    constructor(private context: vscode.ExtensionContext) {
        this.rewardClaimer = new RewardClaimer();
        this.currentSession = this.initializeSession();
        
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right, 
            100
        );
        this.statusBarItem.command = 'codedao.claimRewards';
        this.updateStatusBar();
        this.statusBarItem.show();
        
        // Start tracking code changes
        this.startCodeTracking();
    }

    private initializeSession(): CodingSession {
        return {
            linesOfCode: 0,
            functionsWritten: 0,
            classesWritten: 0,
            testsWritten: 0,
            commentsWritten: 0,
            codeContent: '',
            timestamp: Date.now()
        };
    }

    private startCodeTracking() {
        // Track document changes
        this.documentChangeListener = vscode.workspace.onDidChangeTextDocument((event) => {
            if (event.document.languageId !== 'plaintext') {
                this.analyzeCodeChanges(event);
            }
        });
    }

    private analyzeCodeChanges(event: vscode.TextDocumentChangeEvent) {
        const document = event.document;
        const text = document.getText();
        
        // Count lines (non-empty)
        const lines = text.split('\n').filter(line => line.trim().length > 0);
        this.currentSession.linesOfCode = lines.length;
        
        // Count functions (simple regex patterns)
        const functionPatterns = [
            /function\s+\w+/g,           // JavaScript/TypeScript
            /def\s+\w+/g,                // Python
            /public\s+\w+\s+\w+\s*\(/g,  // Java/C#
            /fn\s+\w+/g                  // Rust
        ];
        
        let functionCount = 0;
        functionPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) functionCount += matches.length;
        });
        this.currentSession.functionsWritten = functionCount;
        
        // Count classes
        const classMatches = text.match(/class\s+\w+/g);
        this.currentSession.classesWritten = classMatches ? classMatches.length : 0;
        
        // Count tests (test functions)
        const testPatterns = [
            /test\s*\(/g,
            /it\s*\(/g,
            /describe\s*\(/g,
            /@Test/g
        ];
        
        let testCount = 0;
        testPatterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) testCount += matches.length;
        });
        this.currentSession.testsWritten = testCount;
        
        // Count comments
        const commentMatches = text.match(/\/\/.*|\/\*[\s\S]*?\*\/|#.*/g);
        this.currentSession.commentsWritten = commentMatches ? commentMatches.length : 0;
        
        // Store content for hash generation
        this.currentSession.codeContent = text;
        this.currentSession.timestamp = Date.now();
        
        // Update status bar
        this.updateStatusBar();
    }

    private async updateStatusBar() {
        const potentialReward = await this.calculatePotentialReward();
        this.statusBarItem.text = `$(code) ${this.currentSession.linesOfCode} lines | $(zap) ${potentialReward} CODE`;
        this.statusBarItem.tooltip = `Click to claim ${potentialReward} CODE tokens\nLines: ${this.currentSession.linesOfCode} | Functions: ${this.currentSession.functionsWritten} | Tests: ${this.currentSession.testsWritten}`;
    }

    private async calculatePotentialReward(): Promise<string> {
        try {
            return await this.rewardClaimer.calculateReward(this.currentSession);
        } catch (error) {
            return '0.0';
        }
    }

    async showStats() {
        try {
            const stats = await this.rewardClaimer.getDeveloperStats();
            if (stats) {
                const message = `📊 CodeDAO Stats\n\n` +
                    `💰 Total Rewards: ${stats.totalRewards} CODE\n` +
                    `📝 Total Lines: ${stats.totalLines}\n` +
                    `🔥 Streak: ${stats.streakDays} days\n` +
                    `🎯 Total Claims: ${stats.totalClaims}\n` +
                    `⏰ Next Claim Available: ${stats.nextClaimTime.toLocaleString()}`;
                
                vscode.window.showInformationMessage(message);
            } else {
                vscode.window.showInformationMessage('Connect your wallet to view stats');
            }
        } catch (error) {
            vscode.window.showErrorMessage('Failed to load stats');
        }
    }

    async connectWallet() {
        const connected = await this.rewardClaimer.connectWallet();
        if (connected) {
            this.updateStatusBar();
        }
    }

    async claimRewards() {
        if (this.currentSession.linesOfCode === 0) {
            vscode.window.showWarningMessage('No code to claim rewards for. Start coding!');
            return;
        }

        const success = await this.rewardClaimer.claimRewards(this.currentSession);
        if (success) {
            // Reset session after successful claim
            this.currentSession = this.initializeSession();
            this.updateStatusBar();
        }
    }

    dispose() {
        this.statusBarItem.dispose();
        if (this.documentChangeListener) {
            this.documentChangeListener.dispose();
        }
    }
}

export function activate(context: vscode.ExtensionContext) {
    console.log('CodeDAO extension is now active!');

    const codeDAOExtension = new CodeDAOExtension(context);

    // Register commands
    const showStatsCommand = vscode.commands.registerCommand('codedao.showStats', () => {
        codeDAOExtension.showStats();
    });

    const connectWalletCommand = vscode.commands.registerCommand('codedao.connectWallet', () => {
        codeDAOExtension.connectWallet();
    });

    const claimRewardsCommand = vscode.commands.registerCommand('codedao.claimRewards', () => {
        codeDAOExtension.claimRewards();
    });

    context.subscriptions.push(
        showStatsCommand, 
        connectWalletCommand, 
        claimRewardsCommand,
        codeDAOExtension
    );

    // Welcome message
    vscode.window.showInformationMessage(
        '🚀 CodeDAO is active! Start coding to earn CODE tokens!',
        'Connect Wallet'
    ).then(selection => {
        if (selection === 'Connect Wallet') {
            vscode.commands.executeCommand('codedao.connectWallet');
        }
    });
}

export function deactivate() {
    console.log('CodeDAO extension deactivated');
}

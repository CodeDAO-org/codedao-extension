import * as vscode from 'vscode';

interface CodeStats {
    linesWritten: number;
    tokensEarned: number;
    lastSession: number;
}

class CodeDAOExtension {
    private codeStats: CodeStats;
    private statusBarItem: vscode.StatusBarItem;
    private context: vscode.ExtensionContext;
    
    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        
        // Load existing stats or initialize
        this.codeStats = context.globalState.get('codeStats', {
            linesWritten: 0,
            tokensEarned: 0,
            lastSession: Date.now()
        });
        
        // Create status bar item
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'codedao.showStats';
        this.updateStatusBar();
        this.statusBarItem.show();
        
        this.setupEventListeners();
    }
    
    private setupEventListeners() {
        // Track text document changes
        vscode.workspace.onDidChangeTextDocument((event) => {
            this.handleCodeChange(event);
        });
        
        // Track file saves
        vscode.workspace.onDidSaveTextDocument((document) => {
            this.handleFileSave(document);
        });
    }
    
    private handleCodeChange(event: vscode.TextDocumentChangeEvent) {
        // Only track substantial changes (not just cursor movement)
        const meaningfulChanges = event.contentChanges.filter(change => 
            change.text.length > 0 && change.text.trim().length > 0
        );
        
        if (meaningfulChanges.length > 0) {
            const linesAdded = meaningfulChanges.reduce((total, change) => {
                return total + (change.text.split('\n').length - 1);
            }, 0);
            
            if (linesAdded > 0) {
                this.trackCodeContribution(linesAdded);
            }
        }
    }
    
    private handleFileSave(document: vscode.TextDocument) {
        // Bonus tokens for saving work
        this.earnTokens(2, `File saved: ${document.fileName.split('/').pop()}`);
    }
    
    private trackCodeContribution(linesAdded: number) {
        this.codeStats.linesWritten += linesAdded;
        
        // Calculate tokens earned (1 token per line, with bonuses)
        let tokensForLines = linesAdded;
        
        // Bonus for productive sessions
        if (linesAdded >= 5) {
            tokensForLines += 2; // Productivity bonus
        }
        
        this.earnTokens(tokensForLines, `${linesAdded} lines written`);
    }
    
    private earnTokens(amount: number, reason: string) {
        this.codeStats.tokensEarned += amount;
        this.updateStatusBar();
        this.saveStats();
        
        // Show reward notification
        this.showTokenReward(amount, reason);
    }
    
    private showTokenReward(amount: number, reason: string) {
        const message = `🎉 +${amount} DAO tokens earned! ${reason}`;
        
        vscode.window.showInformationMessage(
            message,
            'View Stats',
            'Connect Wallet'
        ).then(selection => {
            if (selection === 'View Stats') {
                this.showStats();
            } else if (selection === 'Connect Wallet') {
                this.connectWallet();
            }
        });
    }
    
    private updateStatusBar() {
        this.statusBarItem.text = `$(star) ${this.codeStats.tokensEarned} DAO tokens`;
        this.statusBarItem.tooltip = `Lines written: ${this.codeStats.linesWritten} | Tokens earned: ${this.codeStats.tokensEarned}`;
    }
    
    private saveStats() {
        this.context.globalState.update('codeStats', this.codeStats);
    }
    
    public showStats() {
        const panel = vscode.window.createWebviewPanel(
            'codeDAOStats',
            'CodeDAO Stats',
            vscode.ViewColumn.Two,
            {
                enableScripts: true
            }
        );
        
        panel.webview.html = this.getStatsWebviewContent();
    }
    
    public connectWallet() {
        vscode.window.showInformationMessage(
            'Connect your MetaMask wallet to claim tokens on-chain!',
            'Coming Soon...'
        );
    }
    
    private getStatsWebviewContent(): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>CodeDAO Stats</title>
            <style>
                body {
                    font-family: var(--vscode-font-family);
                    padding: 20px;
                    color: var(--vscode-foreground);
                    background: var(--vscode-editor-background);
                }
                .stat-card {
                    background: var(--vscode-editor-selectionBackground);
                    padding: 20px;
                    margin: 10px 0;
                    border-radius: 8px;
                    border: 1px solid var(--vscode-panel-border);
                }
                .big-number {
                    font-size: 2.5em;
                    font-weight: bold;
                    color: var(--vscode-textLink-foreground);
                }
                .label {
                    font-size: 0.9em;
                    opacity: 0.8;
                    margin-top: 5px;
                }
                .progress-bar {
                    width: 100%;
                    height: 10px;
                    background: var(--vscode-progressBar-background);
                    border-radius: 5px;
                    margin: 10px 0;
                }
                .progress-fill {
                    height: 100%;
                    background: var(--vscode-progressBar-foreground);
                    border-radius: 5px;
                    transition: width 0.3s ease;
                }
            </style>
        </head>
        <body>
            <h1>🎯 Your CodeDAO Progress</h1>
            
            <div class="stat-card">
                <div class="big-number">${this.codeStats.tokensEarned}</div>
                <div class="label">DAO Tokens Earned</div>
            </div>
            
            <div class="stat-card">
                <div class="big-number">${this.codeStats.linesWritten}</div>
                <div class="label">Lines of Code Written</div>
            </div>
            
            <div class="stat-card">
                <h3>Next Milestone</h3>
                <div class="label">Reach 100 tokens to unlock premium AI agent features</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${Math.min(100, (this.codeStats.tokensEarned / 100) * 100)}%"></div>
                </div>
                <div class="label">${Math.max(0, 100 - this.codeStats.tokensEarned)} tokens to go!</div>
            </div>
            
            <div class="stat-card">
                <h3>🤖 AI Agent Status</h3>
                <p>Your coding companion "Alex" is learning from your contributions!</p>
                <p><strong>Specialization:</strong> ${this.getAgentSpecialization()}</p>
                <p><strong>Trust Level:</strong> ${this.getAgentTrustLevel()}</p>
            </div>
        </body>
        </html>
        `;
    }
    
    private getAgentSpecialization(): string {
        if (this.codeStats.linesWritten < 50) return "Beginner Assistant";
        if (this.codeStats.linesWritten < 200) return "Code Completion Specialist";
        if (this.codeStats.linesWritten < 500) return "Full-Stack Helper";
        return "Advanced Architecture Advisor";
    }
    
    private getAgentTrustLevel(): string {
        const trust = Math.min(100, Math.floor((this.codeStats.tokensEarned / 500) * 100));
        return `${trust}% - ${trust < 25 ? 'Building Trust' : trust < 50 ? 'Reliable' : trust < 75 ? 'Trusted Partner' : 'Elite Collaborator'}`;
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
    
    context.subscriptions.push(showStatsCommand, connectWalletCommand);
    
    // Welcome message
    vscode.window.showInformationMessage(
        '🚀 CodeDAO is active! Start coding to earn DAO tokens!',
        'View Stats'
    ).then(selection => {
        if (selection === 'View Stats') {
            codeDAOExtension.showStats();
        }
    });
}

export function deactivate() {
    console.log('CodeDAO extension deactivated');
}

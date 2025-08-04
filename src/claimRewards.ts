import * as vscode from 'vscode';

export interface CodingSession {
    linesOfCode: number;
    functionsWritten: number;
    classesWritten: number;
    testsWritten: number;
    commentsWritten: number;
    codeContent: string;
    timestamp: number;
}

export class RewardClaimer {
    async calculateReward(session: CodingSession): Promise<string> {
        // Simple calculation for now
        const reward = (session.linesOfCode * 0.1 + session.functionsWritten * 0.5).toFixed(2);
        return reward;
    }

    async connectWallet(): Promise<boolean> {
        const result = await vscode.window.showInformationMessage(
            'Connect your Base wallet to claim rewards',
            'Connect', 'Cancel'
        );
        return result === 'Connect';
    }

    async claimRewards(session: CodingSession): Promise<boolean> {
        const reward = await this.calculateReward(session);
        vscode.window.showInformationMessage(`Claimed ${reward} CODE tokens! 🎉`);
        return true;
    }

    async getDeveloperStats() {
        return {
            totalRewards: '123.45',
            totalLines: 5000,
            streakDays: 7,
            totalClaims: 15,
            nextClaimTime: new Date()
        };
    }
}

export function createClaimCommand() {
    // Stub function
    return vscode.commands.registerCommand('codedao.claim', () => {});
}

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createClaimCommand = exports.RewardClaimer = void 0;
const vscode = __importStar(require("vscode"));
class RewardClaimer {
    async calculateReward(session) {
        // Simple calculation for now
        const reward = (session.linesOfCode * 0.1 + session.functionsWritten * 0.5).toFixed(2);
        return reward;
    }
    async connectWallet() {
        const result = await vscode.window.showInformationMessage('Connect your Base wallet to claim rewards', 'Connect', 'Cancel');
        return result === 'Connect';
    }
    async claimRewards(session) {
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
exports.RewardClaimer = RewardClaimer;
function createClaimCommand() {
    // Stub function
    return vscode.commands.registerCommand('codedao.claim', () => { });
}
exports.createClaimCommand = createClaimCommand;
//# sourceMappingURL=claimRewards.js.map
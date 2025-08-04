import * as vscode from 'vscode';
import { ethers } from 'ethers';

// Contract configuration
const CONTRACT_ADDRESS = '0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0';
const BASE_RPC_URL = 'https://mainnet.base.org';

// Contract ABI (simplified for claiming)
const CONTRACT_ABI = [
    "function claimRewards(uint256 linesOfCode, uint256 functionsWritten, uint256 classesWritten, uint256 testsWritten, uint256 commentsWritten, bytes32 codeHash, string calldata sessionData) external",
    "function calculatePotentialReward(uint256 linesOfCode, uint256 functionsWritten, uint256 classesWritten, uint256 testsWritten, uint256 commentsWritten) external view returns (uint256)",
    "function getDeveloperStats(address developer) external view returns (uint256, uint256, uint256, uint256, uint256)",
    "function getCurrentNonce(address user) external view returns (uint256)"
];

interface CodingSession {
    linesOfCode: number;
    functionsWritten: number;
    classesWritten: number;
    testsWritten: number;
    commentsWritten: number;
    codeContent: string;
    timestamp: number;
}

export class RewardClaimer {
    private provider: ethers.providers.Web3Provider | null = null;
    private contract: ethers.Contract | null = null;
    private userAddress: string | null = null;

    constructor() {
        this.initializeWeb3();
    }

    private async initializeWeb3() {
        if (typeof (window as any).ethereum !== 'undefined') {
            this.provider = new ethers.providers.Web3Provider((window as any).ethereum);
            this.contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, this.provider);
        }
    }

    async connectWallet(): Promise<boolean> {
        try {
            if (!this.provider) {
                vscode.window.showErrorMessage('MetaMask not detected. Please install MetaMask.');
                return false;
            }

            // Request account access
            await (window as any).ethereum.request({ method: 'eth_requestAccounts' });
            
            // Switch to Base network
            await this.switchToBaseNetwork();
            
            const signer = this.provider.getSigner();
            this.userAddress = await signer.getAddress();
            this.contract = this.contract?.connect(signer);
            
            vscode.window.showInformationMessage(`✅ Wallet connected: ${this.userAddress}`);
            return true;
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to connect wallet: ${error}`);
            return false;
        }
    }

    private async switchToBaseNetwork() {
        const baseNetwork = {
            chainId: '0x2105', // Base Mainnet
            chainName: 'Base',
            nativeCurrency: {
                name: 'Ethereum',
                symbol: 'ETH',
                decimals: 18
            },
            rpcUrls: ['https://mainnet.base.org'],
            blockExplorerUrls: ['https://basescan.org']
        };

        try {
            await (window as any).ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: baseNetwork.chainId }]
            });
        } catch (error: any) {
            if (error.code === 4902) {
                await (window as any).ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [baseNetwork]
                });
            }
        }
    }

    async calculateReward(session: CodingSession): Promise<string> {
        if (!this.contract) {
            throw new Error('Contract not initialized');
        }

        try {
            const reward = await this.contract.calculatePotentialReward(
                session.linesOfCode,
                session.functionsWritten,
                session.classesWritten,
                session.testsWritten,
                session.commentsWritten
            );
            
            return ethers.utils.formatEther(reward);
        } catch (error) {
            throw new Error(`Failed to calculate reward: ${error}`);
        }
    }

    async claimRewards(session: CodingSession): Promise<boolean> {
        if (!this.contract || !this.userAddress) {
            vscode.window.showErrorMessage('Please connect your wallet first');
            return false;
        }

        try {
            // Generate code hash for anti-gaming
            const codeHash = ethers.utils.keccak256(
                ethers.utils.toUtf8Bytes(session.codeContent + session.timestamp)
            );

            // Show estimated reward
            const estimatedReward = await this.calculateReward(session);
            const proceed = await vscode.window.showInformationMessage(
                `🎯 Claim ${estimatedReward} CODE tokens?\n💰 Gas fee: ~$0.01\n⏱️ Lines: ${session.linesOfCode}`,
                'Claim Rewards',
                'Cancel'
            );

            if (proceed !== 'Claim Rewards') {
                return false;
            }

            // Execute claim transaction (user pays gas)
            const tx = await this.contract.claimRewards(
                session.linesOfCode,
                session.functionsWritten,
                session.classesWritten,
                session.testsWritten,
                session.commentsWritten,
                codeHash,
                JSON.stringify({
                    timestamp: session.timestamp,
                    editor: 'vscode'
                })
            );

            vscode.window.showInformationMessage('⏳ Claiming rewards...');
            
            const receipt = await tx.wait();
            
            vscode.window.showInformationMessage(
                `🎉 Rewards claimed successfully!\n💰 ${estimatedReward} CODE tokens earned\n🔗 Tx: ${receipt.transactionHash}`
            );

            return true;
        } catch (error: any) {
            if (error.code === 4001) {
                vscode.window.showWarningMessage('Transaction cancelled by user');
            } else if (error.message.includes('Daily limit exceeded')) {
                vscode.window.showErrorMessage('⚠️ Daily claim limit reached. Try again tomorrow!');
            } else if (error.message.includes('Cooldown period not met')) {
                vscode.window.showErrorMessage('⏰ Please wait 1 hour between claims');
            } else {
                vscode.window.showErrorMessage(`Failed to claim rewards: ${error.message}`);
            }
            return false;
        }
    }

    async getDeveloperStats(): Promise<any> {
        if (!this.contract || !this.userAddress) {
            return null;
        }

        try {
            const stats = await this.contract.getDeveloperStats(this.userAddress);
            return {
                totalLines: stats[0].toString(),
                totalRewards: ethers.utils.formatEther(stats[1]),
                streakDays: stats[2].toString(),
                totalClaims: stats[3].toString(),
                nextClaimTime: new Date(stats[4].toNumber() * 1000)
            };
        } catch (error) {
            return null;
        }
    }
}

// Export for use in extension
export function createClaimCommand(rewardClaimer: RewardClaimer) {
    return vscode.commands.registerCommand('codedao.claimRewards', async () => {
        // This would be called with actual coding session data
        const mockSession: CodingSession = {
            linesOfCode: 50,
            functionsWritten: 3,
            classesWritten: 1,
            testsWritten: 2,
            commentsWritten: 10,
            codeContent: "// Sample code content",
            timestamp: Date.now()
        };

        await rewardClaimer.claimRewards(mockSession);
    });
}

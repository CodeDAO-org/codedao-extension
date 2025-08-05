// ============================================================================
// FILE 1: wallet-claim.js (NEW FILE - Create this in your repository)
// ============================================================================

class CodeDAOWallet {
    constructor() {
        this.contractAddress = '0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0';
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        
        // Simple ERC20 ABI for token claiming
        this.contractABI = [
            "function balanceOf(address owner) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function claimRewards() returns (bool)",
            "function getPendingRewards(address user) view returns (uint256)",
            "event RewardsClaimed(address indexed user, uint256 amount)"
        ];
    }

    // Initialize wallet connection
    async init() {
        if (typeof window.ethereum !== 'undefined') {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            return true;
        }
        return false;
    }

    // Connect wallet and get user address
    async connectWallet() {
        try {
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.signer = this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();
            
            // Initialize contract
            this.contract = new ethers.Contract(
                this.contractAddress,
                this.contractABI,
                this.signer
            );

            // Update UI
            this.updateWalletUI();
            await this.loadBalances();
            
            return true;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            this.showError('Failed to connect wallet. Please try again.');
            return false;
        }
    }

    // Load user's CODE balance and pending rewards
    async loadBalances() {
        if (!this.contract || !this.userAddress) return;

        try {
            // Get CODE token balance
            const balance = await this.contract.balanceOf(this.userAddress);
            const balanceFormatted = ethers.utils.formatEther(balance);

            // Get pending rewards (mock data for now)
            const pendingRewards = await this.getPendingRewards();

            // Update UI
            document.getElementById('codeBalance').textContent = parseFloat(balanceFormatted).toFixed(2);
            document.getElementById('pendingRewards').textContent = pendingRewards.toFixed(2);
            document.getElementById('usdValue').textContent = (balanceFormatted * 0.1).toFixed(2); // Mock $0.10 per CODE

            // Show/hide claim button
            const claimButton = document.getElementById('claimButton');
            if (pendingRewards > 0) {
                claimButton.style.display = 'block';
                claimButton.textContent = `Claim ${pendingRewards.toFixed(2)} CODE`;
            } else {
                claimButton.style.display = 'none';
            }

        } catch (error) {
            console.error('Failed to load balances:', error);
        }
    }

    // Get pending rewards (mock implementation)
    async getPendingRewards() {
        // TODO: Replace with actual API call to your backend
        // For now, return mock data based on wallet address
        const mockRewards = {
            '0x742d35Cc6434C0532925a3b8D1B9e8c7': 47.3,
            '0x8ba1f109551bD432803012645Hf': 12.7,
            '0x123456789abcdef123456789abcdef': 0
        };
        
        // Return mock reward or 0
        return mockRewards[this.userAddress] || Math.random() * 25 + 5; // Random 5-30 CODE for demo
    }

    // Claim pending rewards
    async claimRewards() {
        if (!this.contract || !this.userAddress) {
            this.showError('Please connect your wallet first');
            return;
        }

        const claimButton = document.getElementById('claimButton');
        const originalText = claimButton.textContent;
        
        try {
            claimButton.textContent = 'Claiming...';
            claimButton.disabled = true;

            // For MVP, we'll simulate the claim with a mock transaction
            // TODO: Replace with actual smart contract call
            await this.mockClaimTransaction();

            // Show success
            this.showSuccess('Rewards claimed successfully!');
            
            // Reload balances
            await this.loadBalances();

        } catch (error) {
            console.error('Claim failed:', error);
            this.showError('Claim failed. Please try again.');
            claimButton.textContent = originalText;
            claimButton.disabled = false;
        }
    }

    // Mock claim transaction for MVP testing
    async mockClaimTransaction() {
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                // Mock: Add pending rewards to balance
                const currentBalance = parseFloat(document.getElementById('codeBalance').textContent);
                const pendingRewards = parseFloat(document.getElementById('pendingRewards').textContent);
                
                // Update balance immediately for demo
                document.getElementById('codeBalance').textContent = (currentBalance + pendingRewards).toFixed(2);
                document.getElementById('pendingRewards').textContent = '0';
                
                resolve();
            }, 2000);
        });
    }

    // Update wallet connection UI
    updateWalletUI() {
        const connectButtons = document.querySelectorAll('.wallet-connect-btn');
        const walletInfo = document.querySelector('.wallet-connected');
        
        if (this.userAddress) {
            // Hide connect buttons
            connectButtons.forEach(btn => btn.style.display = 'none');
            
            // Show connected state
            if (walletInfo) {
                walletInfo.style.display = 'block';
                const addressElement = walletInfo.querySelector('.wallet-address');
                if (addressElement) {
                    addressElement.textContent = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
                }
            }
        }
    }

    // Show success message
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Show error message
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Show notification
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 1000;
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// Initialize wallet system
const codeDAOWallet = new CodeDAOWallet();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const initialized = await codeDAOWallet.init();
    if (!initialized) {
        console.error('Web3 wallet not detected');
        return;
    }

    // Check if already connected
    if (window.ethereum.selectedAddress) {
        await codeDAOWallet.connectWallet();
    }

    // Add event listeners
    document.addEventListener('click', async (e) => {
        if (e.target.matches('.wallet-connect-btn')) {
            await codeDAOWallet.connectWallet();
        }
        
        if (e.target.matches('#claimButton')) {
            await codeDAOWallet.claimRewards();
        }
    });
});

// Auto-refresh balances every 30 seconds
setInterval(async () => {
    if (codeDAOWallet.userAddress) {
        await codeDAOWallet.loadBalances();
    }
}, 30000);

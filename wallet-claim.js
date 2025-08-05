// ============================================================================
// CodeDAO Wallet Claiming System
// File: wallet-claim.js
// ============================================================================

class CodeDAOWallet {
    constructor() {
        this.contractAddress = '0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0';
        this.provider = null;
        this.signer = null;
        this.contract = null;
        this.userAddress = null;
        
        // Simple ERC20 ABI for token operations
        this.contractABI = [
            "function balanceOf(address owner) view returns (uint256)",
            "function transfer(address to, uint256 amount) returns (bool)",
            "function claimRewards() returns (bool)",
            "function getPendingRewards(address user) view returns (uint256)",
            "event RewardsClaimed(address indexed user, uint256 amount)"
        ];
    }

    // Initialize wallet system
    async init() {
        if (typeof window.ethereum !== 'undefined') {
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            return true;
        }
        console.log('Web3 wallet not detected');
        return false;
    }

    // Connect wallet and get user address
    async connectWallet(walletType = 'metamask') {
        try {
            if (!window.ethereum) {
                this.showError('Please install MetaMask or another Web3 wallet to continue.');
                return false;
            }

            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            this.signer = this.provider.getSigner();
            this.userAddress = await this.signer.getAddress();
            
            // Check if we're on the correct network (Base)
            const network = await this.provider.getNetwork();
            if (network.chainId !== 8453) {
                await this.switchToBase();
            }

            // Initialize contract
            this.contract = new ethers.Contract(
                this.contractAddress,
                this.contractABI,
                this.signer
            );

            // Update UI
            this.updateWalletUI();
            await this.loadBalances();
            
            this.showSuccess(`Connected to ${walletType}! Welcome to CodeDAO.`);
            return true;
        } catch (error) {
            console.error('Wallet connection failed:', error);
            if (error.code === 4001) {
                this.showError('Wallet connection rejected. Please try again.');
            } else {
                this.showError('Failed to connect wallet. Please try again.');
            }
            return false;
        }
    }

    // Switch to Base network
    async switchToBase() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x2105' }], // Base chainId in hex
            });
        } catch (switchError) {
            // Network doesn't exist, add it
            if (switchError.code === 4902) {
                try {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x2105',
                            chainName: 'Base',
                            nativeCurrency: {
                                name: 'Ethereum',
                                symbol: 'ETH',
                                decimals: 18
                            },
                            rpcUrls: ['https://mainnet.base.org'],
                            blockExplorerUrls: ['https://basescan.org']
                        }],
                    });
                } catch (addError) {
                    console.error('Failed to add Base network:', addError);
                }
            }
        }
    }

    // Load user's CODE balance and pending rewards
    async loadBalances() {
        if (!this.userAddress) return;

        try {
            // Get pending rewards (mock data for now - replace with real API)
            const pendingRewards = await this.getPendingRewards();
            
            // Get current CODE balance (mock for now)
            const currentBalance = await this.getCurrentBalance();

            // Update UI elements
            const balanceElement = document.getElementById('codeBalance');
            const pendingElement = document.getElementById('pendingRewards');
            const usdElement = document.getElementById('usdValue');
            const claimButton = document.getElementById('claimButton');

            if (balanceElement) {
                balanceElement.textContent = currentBalance.toFixed(2);
            }
            
            if (pendingElement) {
                pendingElement.textContent = pendingRewards.toFixed(2);
            }
            
            if (usdElement) {
                // Mock $0.10 per CODE token
                usdElement.textContent = (currentBalance * 0.1).toFixed(2);
            }

            // Show/hide claim button based on pending rewards
            if (claimButton) {
                if (pendingRewards > 0) {
                    claimButton.style.display = 'block';
                    claimButton.textContent = `Claim ${pendingRewards.toFixed(2)} CODE`;
                    claimButton.disabled = false;
                } else {
                    claimButton.textContent = 'No Rewards to Claim';
                    claimButton.disabled = true;
                }
            }

        } catch (error) {
            console.error('Failed to load balances:', error);
            this.showError('Failed to load wallet balances. Please refresh and try again.');
        }
    }

    // Get pending rewards (mock implementation for now)
    async getPendingRewards() {
        // TODO: Replace with actual API call to your backend
        // This should fetch pending rewards based on user's contributions
        
        // Mock data based on wallet address for demo
        const mockRewards = {
            // Add some example addresses with different reward amounts
            '0x742d35Cc6434C0532925a3b8D1B9e8c7': 47.3,
            '0x8ba1f109551bD432803012645Hf': 12.7,
            '0x123456789abcdef123456789abcdef': 25.1
        };
        
        // Return mock reward or generate random amount for demo
        return mockRewards[this.userAddress] || (Math.random() * 30 + 5); // 5-35 CODE
    }

    // Get current CODE balance (mock implementation)
    async getCurrentBalance() {
        // TODO: Replace with actual smart contract call
        // const balance = await this.contract.balanceOf(this.userAddress);
        // return parseFloat(ethers.utils.formatEther(balance));
        
        // Mock balance for demo
        const storedBalance = localStorage.getItem(`codeBalance_${this.userAddress}`) || '0';
        return parseFloat(storedBalance);
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
            claimButton.textContent = 'Claiming Rewards...';
            claimButton.disabled = true;

            // Get current pending rewards
            const pendingRewards = await this.getPendingRewards();
            
            if (pendingRewards <= 0) {
                this.showError('No rewards available to claim');
                return;
            }

            // For MVP, simulate the claim transaction
            // TODO: Replace with actual smart contract call
            await this.simulateClaimTransaction(pendingRewards);

            // Show success
            this.showSuccess(`Successfully claimed ${pendingRewards.toFixed(2)} CODE tokens!`);
            
            // Update balances
            await this.updateBalancesAfterClaim(pendingRewards);
            await this.loadBalances();

        } catch (error) {
            console.error('Claim failed:', error);
            this.showError('Failed to claim rewards. Please try again.');
        } finally {
            claimButton.disabled = false;
        }
    }

    // Simulate claim transaction for MVP
    async simulateClaimTransaction(amount) {
        return new Promise((resolve) => {
            // Simulate network delay
            setTimeout(() => {
                resolve();
            }, 2000);
        });
    }

    // Update balances after successful claim
    async updateBalancesAfterClaim(claimedAmount) {
        // Update stored balance (for demo)
        const currentBalance = await this.getCurrentBalance();
        const newBalance = currentBalance + claimedAmount;
        localStorage.setItem(`codeBalance_${this.userAddress}`, newBalance.toString());

        // Clear pending rewards (for demo)
        // In production, this would be handled by the smart contract
    }

    // Update wallet connection UI
    updateWalletUI() {
        const connectButtons = document.querySelectorAll('.wallet-connect-btn');
        const walletConnected = document.querySelector('.wallet-connected');
        
        if (this.userAddress) {
            // Hide connect buttons
            connectButtons.forEach(btn => {
                btn.style.display = 'none';
            });
            
            // Show connected state
            if (walletConnected) {
                walletConnected.style.display = 'flex';
                const addressElement = walletConnected.querySelector('.wallet-address');
                if (addressElement) {
                    addressElement.textContent = `${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
                }
            }

            // Update page title if on wallet dashboard
            if (window.location.pathname.includes('wallet-dashboard')) {
                document.title = `CodeDAO Wallet - ${this.userAddress.slice(0, 6)}...${this.userAddress.slice(-4)}`;
            }
        }
    }

    // Show success notification
    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    // Show error notification
    showError(message) {
        this.showNotification(message, 'error');
    }

    // Show notification toast
    showNotification(message, type) {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.wallet-notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `wallet-notification ${type}`;
        notification.textContent = message;
        
        // Styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 12px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            max-width: 400px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            background: ${type === 'success' ? '#10b981' : '#ef4444'};
            animation: slideInNotification 0.3s ease;
        `;

        // Add animation styles
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInNotification {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(notification);

        // Remove after 4 seconds
        setTimeout(() => {
            notification.style.animation = 'slideInNotification 0.3s ease reverse';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    // Disconnect wallet
    async disconnectWallet() {
        this.userAddress = null;
        this.signer = null;
        this.contract = null;
        
        // Show connect buttons again
        const connectButtons = document.querySelectorAll('.wallet-connect-btn');
        const walletConnected = document.querySelector('.wallet-connected');
        
        connectButtons.forEach(btn => {
            btn.style.display = 'flex';
        });
        
        if (walletConnected) {
            walletConnected.style.display = 'none';
        }

        // Clear balance display
        const balanceElement = document.getElementById('codeBalance');
        const pendingElement = document.getElementById('pendingRewards');
        const usdElement = document.getElementById('usdValue');
        
        if (balanceElement) balanceElement.textContent = '0';
        if (pendingElement) pendingElement.textContent = '0';
        if (usdElement) usdElement.textContent = '0.00';

        this.showSuccess('Wallet disconnected');
    }
}

// Initialize wallet system globally
const codeDAOWallet = new CodeDAOWallet();

// Initialize when page loads
document.addEventListener('DOMContentLoaded', async () => {
    const initialized = await codeDAOWallet.init();
    if (!initialized) {
        console.log('Web3 wallet not available - wallet features disabled');
        return;
    }

    // Check if already connected
    if (window.ethereum && window.ethereum.selectedAddress) {
        await codeDAOWallet.connectWallet();
    }

    // Add event listeners for wallet buttons
    document.addEventListener('click', async (e) => {
        // Connect wallet buttons
        if (e.target.matches('.wallet-connect-btn') || e.target.closest('.wallet-connect-btn')) {
            const walletType = e.target.dataset.wallet || 'metamask';
            await codeDAOWallet.connectWallet(walletType);
        }
        
        // Claim rewards button
        if (e.target.matches('#claimButton') || e.target.closest('#claimButton')) {
            await codeDAOWallet.claimRewards();
        }

        // Disconnect wallet (if you add a disconnect button)
        if (e.target.matches('.disconnect-btn')) {
            await codeDAOWallet.disconnectWallet();
        }
    });

    // Listen for account changes
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', function (accounts) {
            if (accounts.length === 0) {
                codeDAOWallet.disconnectWallet();
            } else if (accounts[0] !== codeDAOWallet.userAddress) {
                // Account changed, reconnect
                codeDAOWallet.connectWallet();
            }
        });

        // Listen for network changes
        window.ethereum.on('chainChanged', function (chainId) {
            // Reload page when network changes
            window.location.reload();
        });
    }
});

// Auto-refresh balances every 30 seconds
setInterval(async () => {
    if (codeDAOWallet.userAddress) {
        await codeDAOWallet.loadBalances();
    }
}, 30000);

// Export for external use if needed
window.codeDAOWallet = codeDAOWallet;

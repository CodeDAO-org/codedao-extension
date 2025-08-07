// Configuration
const MORALIS_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImQzY2NjOTEzLTcwZDUtNGZkOC05ZmQzLTQxYjY1YmM3ZDljMiIsIm9yZ0lkIjoiNDYyNjY1IiwidXNlcklkIjoiNDc1OTg4IiwidHlwZUlkIjoiNGIzMzk5MDUtZjVlZC00N2FhLTliNmYtZjdiMDQ1NzgwODEzIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTM5OTI2ODQsImV4cCI6NDkwOTc1MjY4NH0._82QL7vojD2DwHwh8U182qpZXqJ2lei_llw2Mdyl7fg";
const CODE_TOKEN_ADDRESS = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
const BASE_CHAIN_ID = "0x2105"; // Base Mainnet
const BASE_RPC_URL = "https://mainnet.base.org";

// ERC20 ABI for token balance reading
const ERC20_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function transfer(address to, uint256 amount) returns (bool)"
];

// Global state
let currentAccount = null;
let provider = null;
let isConnecting = false;

// Initialize Moralis
async function initMoralis() {
    try {
        await Moralis.start({
            apiKey: MORALIS_API_KEY
        });
        console.log("Moralis initialized successfully");
    } catch (error) {
        console.error("Failed to initialize Moralis:", error);
    }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', async () => {
    await initMoralis();
    setupEventListeners();
    checkExistingConnection();
    setupNetworkSwitching();
});

// Event Listeners
function setupEventListeners() {
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.addEventListener('click', () => connectWallet('metamask'));
    }
    
    // Add other wallet options if they exist
    const metaMaskBtn = document.getElementById('connectMetaMask');
    const coinbaseBtn = document.getElementById('connectCoinbase');
    const walletConnectBtn = document.getElementById('connectWalletConnect');
    const disconnectBtn = document.getElementById('disconnectWallet');
    const claimBtn = document.getElementById('claimRewards');
    const refreshBtn = document.getElementById('refreshFeed');
    
    if (metaMaskBtn) metaMaskBtn.addEventListener('click', () => connectWallet('metamask'));
    if (coinbaseBtn) coinbaseBtn.addEventListener('click', () => connectWallet('coinbase'));
    if (walletConnectBtn) walletConnectBtn.addEventListener('click', () => connectWallet('walletconnect'));
    if (disconnectBtn) disconnectBtn.addEventListener('click', disconnectWallet);
    if (claimBtn) claimBtn.addEventListener('click', claimRewards);
    if (refreshBtn) refreshBtn.addEventListener('click', refreshCollaborationFeed);
    
    // Copy SDK command
    const copyBtn = document.querySelector('.copy-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            navigator.clipboard.writeText('npm install codedao-dashboard-sdk');
            showNotification('Copied to clipboard!');
        });
    }
}

// Check for existing wallet connection
async function checkExistingConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await handleAccountConnection(accounts[0]);
            }
        } catch (error) {
            console.error("Error checking existing connection:", error);
        }
    }
}

// Connect wallet function
async function connectWallet(walletType) {
    if (isConnecting) return;
    
    isConnecting = true;
    updateConnectionStatus('Connecting...', false);
    
    try {
        let account = null;
        
        switch (walletType) {
            case 'metamask':
                account = await connectMetaMask();
                break;
            case 'coinbase':
                account = await connectCoinbase();
                break;
            case 'walletconnect':
                account = await connectWalletConnect();
                break;
        }
        
        if (account) {
            await handleAccountConnection(account);
        }
    } catch (error) {
        console.error(`Error connecting ${walletType}:`, error);
        updateConnectionStatus('Connection failed', false);
        showNotification(`Failed to connect ${walletType}: ${error.message}`);
    } finally {
        isConnecting = false;
    }
}

// MetaMask connection
async function connectMetaMask() {
    if (typeof window.ethereum === 'undefined') {
        throw new Error('MetaMask is not installed');
    }
    
    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
    });
    
    provider = new ethers.providers.Web3Provider(window.ethereum);
    return accounts[0];
}

// Coinbase Wallet connection
async function connectCoinbase() {
    if (typeof window.ethereum === 'undefined' || !window.ethereum.isCoinbaseWallet) {
        throw new Error('Coinbase Wallet is not installed');
    }
    
    const accounts = await window.ethereum.request({
        method: 'eth_requestAccounts'
    });
    
    provider = new ethers.providers.Web3Provider(window.ethereum);
    return accounts[0];
}

// WalletConnect connection
async function connectWalletConnect() {
    // For WalletConnect, you would typically use @walletconnect/web3-provider
    // For now, we'll fall back to generic web3 provider
    if (typeof window.ethereum !== 'undefined') {
        const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts'
        });
        provider = new ethers.providers.Web3Provider(window.ethereum);
        return accounts[0];
    }
    throw new Error('No wallet provider found');
}

// Handle successful connection
async function handleAccountConnection(account) {
    currentAccount = account;
    updateConnectionStatus(`Connected: ${formatAddress(account)}`, true);
    
    // Update wallet status in stats
    const walletStatusElement = document.getElementById('walletStatus');
    if (walletStatusElement) {
        walletStatusElement.textContent = 'Connected';
    }
    
    // Enable claim button if it exists
    const claimBtn = document.getElementById('claimRewards');
    if (claimBtn) {
        claimBtn.disabled = false;
        claimBtn.textContent = 'Claim Rewards';
    }
    
    // Show disconnect button if it exists
    const disconnectBtn = document.getElementById('disconnectWallet');
    if (disconnectBtn) {
        disconnectBtn.style.display = 'block';
    }
    
    // Load token balance
    await loadTokenBalance();
    
    // Setup account change listener
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
    }
    
    showNotification('Wallet connected successfully!');
}

// Load CODE token balance
async function loadTokenBalance() {
    if (!currentAccount || !provider) return;
    
    try {
        // Switch to Base network if needed
        await ensureBaseNetwork();
        
        const contract = new ethers.Contract(CODE_TOKEN_ADDRESS, ERC20_ABI, provider);
        const balance = await contract.balanceOf(currentAccount);
        const decimals = await contract.decimals();
        
        const formattedBalance = ethers.utils.formatUnits(balance, decimals);
        const roundedBalance = parseFloat(formattedBalance).toFixed(2);
        
        const tokenBalanceElement = document.getElementById('tokenBalance');
        if (tokenBalanceElement) {
            tokenBalanceElement.textContent = `${roundedBalance} CODE`;
        }
        
        // Mock USD value (you would get this from a price API)
        const usdValue = (parseFloat(roundedBalance) * 0.10).toFixed(2); // Assuming $0.10 per CODE
        const usdValueElement = document.getElementById('usdValue');
        if (usdValueElement) {
            usdValueElement.textContent = `$${usdValue} USD`;
        }
        
    } catch (error) {
        console.error("Error loading token balance:", error);
        const tokenBalanceElement = document.getElementById('tokenBalance');
        if (tokenBalanceElement) {
            tokenBalanceElement.textContent = "Error loading balance";
        }
    }
}

// Ensure user is on Base network
async function ensureBaseNetwork() {
    if (!window.ethereum) return;
    
    try {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: BASE_CHAIN_ID }],
        });
    } catch (switchError) {
        // If the chain hasn't been added yet
        if (switchError.code === 4902) {
            try {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: BASE_CHAIN_ID,
                        chainName: 'Base',
                        nativeCurrency: {
                            name: 'Ethereum',
                            symbol: 'ETH',
                            decimals: 18
                        },
                        rpcUrls: [BASE_RPC_URL],
                        blockExplorerUrls: ['https://basescan.org/']
                    }],
                });
            } catch (addError) {
                console.error("Error adding Base network:", addError);
            }
        }
    }
}

// Setup network switching
function setupNetworkSwitching() {
    if (window.ethereum) {
        window.ethereum.on('chainChanged', handleChainChanged);
    }
}

// Handle chain/network changes
function handleChainChanged(chainId) {
    console.log("Chain changed to:", chainId);
    if (currentAccount) {
        loadTokenBalance();
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else if (accounts[0] !== currentAccount) {
        handleAccountConnection(accounts[0]);
    }
}

// Disconnect wallet
function disconnectWallet() {
    currentAccount = null;
    provider = null;
    
    updateConnectionStatus('Not Connected', false);
    
    // Reset UI
    const tokenBalanceElement = document.getElementById('tokenBalance');
    const usdValueElement = document.getElementById('usdValue');
    const pendingRewardsElement = document.getElementById('pendingRewards');
    const walletStatusElement = document.getElementById('walletStatus');
    
    if (tokenBalanceElement) tokenBalanceElement.textContent = '0.00 CODE';
    if (usdValueElement) usdValueElement.textContent = '$0.00 USD';
    if (pendingRewardsElement) pendingRewardsElement.textContent = '0 CODE';
    if (walletStatusElement) walletStatusElement.textContent = 'Not Connected';
    
    const claimBtn = document.getElementById('claimRewards');
    if (claimBtn) {
        claimBtn.disabled = true;
        claimBtn.textContent = 'Connect Wallet to Claim';
    }
    
    const disconnectBtn = document.getElementById('disconnectWallet');
    if (disconnectBtn) {
        disconnectBtn.style.display = 'none';
    }
    
    showNotification('Wallet disconnected');
}

// Update connection status display
function updateConnectionStatus(status, isConnected) {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.textContent = status;
        
        if (isConnected) {
            statusElement.classList.add('connected');
        } else {
            statusElement.classList.remove('connected');
        }
    }
}

// Claim rewards function
async function claimRewards() {
    if (!currentAccount || !provider) {
        showNotification('Please connect your wallet first');
        return;
    }
    
    try {
        showNotification('Claiming rewards... (This is a demo)');
        
        // In a real implementation, you would:
        // 1. Call your distributor contract's claimRewards function
        // 2. Pass the user's coding metrics
        // 3. Handle the transaction
        
        // For demo purposes, we'll simulate a successful claim
        setTimeout(() => {
            showNotification('Rewards claimed successfully! (Demo)');
            loadTokenBalance(); // Reload balance
        }, 2000);
        
    } catch (error) {
        console.error("Error claiming rewards:", error);
        showNotification(`Failed to claim rewards: ${error.message}`);
    }
}

// Refresh collaboration feed
function refreshCollaborationFeed() {
    showNotification('Feed refreshed!');
    
    // In a real implementation, you would fetch latest data
    // For demo purposes, we'll just show the notification
    const refreshBtn = document.getElementById('refreshFeed');
    if (refreshBtn) {
        refreshBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            refreshBtn.style.transform = 'rotate(0deg)';
        }, 500);
    }
}

// Utility functions
function formatAddress(address) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 15px 20px;
        border-radius: 10px;
        z-index: 1000;
        font-weight: 600;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    // Remove notification after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => {
            if (notification.parentNode) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

// Smart Wallet Integration with Claim Notifications
let userWallet = null;
let userEarnings = 0;

// Initialize wallet connection
async function initializeWallet() {
    const connectBtn = document.getElementById('connectWallet');
    
    if (connectBtn) {
        connectBtn.addEventListener('click', handleWalletConnection);
    }
    
    // Check if already connected
    await checkExistingConnection();
    
    // Check for earnings periodically
    setInterval(checkEarnings, 30000); // Every 30 seconds
}

async function handleWalletConnection() {
    if (userWallet) {
        // Already connected - show wallet options
        showWalletOptions();
    } else {
        // Connect wallet
        await connectWallet();
    }
}

async function connectWallet() {
    try {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            userWallet = accounts[0];
            updateWalletUI();
            await checkEarnings();
            
        } else {
            alert('Please install MetaMask or another Web3 wallet');
        }
    } catch (error) {
        console.error('Wallet connection failed:', error);
    }
}

async function checkExistingConnection() {
    try {
        if (window.ethereum) {
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            
            if (accounts.length > 0) {
                userWallet = accounts[0];
                updateWalletUI();
                await checkEarnings();
            }
        }
    } catch (error) {
        console.error('Error checking existing connection:', error);
    }
}

function updateWalletUI() {
    const connectBtn = document.getElementById('connectWallet');
    const balanceDisplay = document.querySelector('.code-balance');
    
    if (connectBtn) {
        if (userWallet) {
            connectBtn.innerHTML = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <div style="width: 8px; height: 8px; background: #00ff88; border-radius: 50%;"></div>
                    <span>Connected: ${userWallet.slice(0, 6)}...${userWallet.slice(-4)}</span>
                    ${userEarnings > 0 ? '<span style="color: #00ff88;">💰</span>' : ''}
                </div>
            `;
            connectBtn.style.background = userEarnings > 0 ? 'linear-gradient(135deg, #00ff88, #00cc6a)' : '';
        }
    }
    
    if (balanceDisplay) {
        balanceDisplay.textContent = `${userEarnings.toFixed(4)} CODE`;
        if (userEarnings > 0) {
            balanceDisplay.style.color = '#00ff88';
            balanceDisplay.style.fontWeight = 'bold';
        }
    }
}

async function checkEarnings() {
    if (!userWallet) return;
    
    try {
        // Simulate checking for user earnings (this would connect to real contract)
        // For demo, check if user has any claimable tokens
        const mockEarnings = await simulateEarningsCheck(userWallet);
        
        if (mockEarnings > userEarnings) {
            // New earnings detected!
            showEarningsNotification(mockEarnings - userEarnings);
            userEarnings = mockEarnings;
            updateWalletUI();
        }
    } catch (error) {
        console.error('Error checking earnings:', error);
    }
}

async function simulateEarningsCheck(address) {
    // This simulates checking the user's earnings
    // In production, this would query the smart contract
    const knownAddresses = {
        '0x813343d30065eAe9D1Be6521203f5C0874818C28': 50.0,
        '0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9': 100.0
    };
    
    return knownAddresses[address] || 0;
}

function showEarningsNotification(newEarnings) {
    // Create earnings notification
    const notification = document.createElement('div');
    notification.className = 'earnings-notification';
    notification.innerHTML = `
        <div style="
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #00ff88, #00cc6a);
            color: white;
            padding: 16px 20px;
            border-radius: 12px;
            box-shadow: 0 10px 30px rgba(0, 255, 136, 0.3);
            z-index: 1000;
            animation: slideIn 0.3s ease-out;
        ">
            <div style="display: flex; align-items: center; gap: 12px;">
                <span style="font-size: 24px;">🎉</span>
                <div>
                    <div style="font-weight: bold; font-size: 16px;">New CODE Earned!</div>
                    <div style="font-size: 14px; opacity: 0.9;">+${newEarnings} CODE available to claim</div>
                </div>
                <button onclick="goToClaim()" style="
                    background: rgba(255,255,255,0.2);
                    border: none;
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-weight: bold;
                ">Claim Now</button>
            </div>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
        if (notification.parentNode) {
            notification.remove();
        }
    }, 10000);
}

function showWalletOptions() {
    const options = document.createElement('div');
    options.className = 'wallet-options';
    options.innerHTML = `
        <div style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            padding: 24px;
            z-index: 1000;
            min-width: 300px;
        ">
            <h3 style="color: white; margin: 0 0 16px 0; text-align: center;">Wallet Options</h3>
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <button onclick="goToClaim()" style="
                    background: linear-gradient(135deg, #00ff88, #00cc6a);
                    border: none;
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                    font-weight: bold;
                ">
                    🎁 Claim ${userEarnings.toFixed(2)} CODE
                </button>
                <button onclick="viewBalance()" style="
                    background: rgba(255,255,255,0.1);
                    border: 1px solid rgba(255,255,255,0.2);
                    color: white;
                    padding: 12px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                ">
                    💰 View Balance Details
                </button>
                <button onclick="disconnectWallet()" style="
                    background: rgba(255,0,0,0.1);
                    border: 1px solid rgba(255,0,0,0.2);
                    color: #ff6b6b;
                    padding: 12px 16px;
                    border-radius: 8px;
                    cursor: pointer;
                ">
                    🔌 Disconnect Wallet
                </button>
                <button onclick="closeWalletOptions()" style="
                    background: transparent;
                    border: none;
                    color: #888;
                    padding: 8px;
                    cursor: pointer;
                ">
                    Cancel
                </button>
            </div>
        </div>
        <div onclick="closeWalletOptions()" style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.5);
            z-index: 999;
        "></div>
    `;
    
    document.body.appendChild(options);
}

function goToClaim() {
    window.location.href = 'claim-hub.html';
}

function viewBalance() {
    alert(`Your CODE Balance: ${userEarnings.toFixed(4)} CODE\nWallet: ${userWallet}`);
    closeWalletOptions();
}

function disconnectWallet() {
    userWallet = null;
    userEarnings = 0;
    updateWalletUI();
    closeWalletOptions();
    
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.innerHTML = 'Connect Wallet & Start';
        connectBtn.style.background = '';
    }
}

function closeWalletOptions() {
    const options = document.querySelector('.wallet-options');
    if (options) {
        options.remove();
    }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
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

// Initialize when page loads
document.addEventListener('DOMContentLoaded', initializeWallet);

// Export functions for global access
window.goToClaim = goToClaim;
window.viewBalance = viewBalance;
window.disconnectWallet = disconnectWallet;
window.closeWalletOptions = closeWalletOptions; 
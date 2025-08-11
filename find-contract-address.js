const { ethers } = require('ethers');

const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
const safeAddress = '0x813343d30065eAe9D1Be6521203f5C0874818C28';

async function findContractAddress() {
    console.log('🔍 Searching for CodeDAO Token contract address...');
    
    try {
        // Method 1: Check recent blocks for contract creations from the Safe
        console.log('\n📡 Method 1: Scanning recent blocks for contract creations...');
        
        const latestBlock = await provider.getBlockNumber();
        console.log(`Latest block: ${latestBlock}`);
        
        // Search last 1000 blocks (about 30 minutes on Base)
        const searchBlocks = 1000;
        const startBlock = Math.max(latestBlock - searchBlocks, 0);
        
        console.log(`Searching blocks ${startBlock} to ${latestBlock}...`);
        
        for (let blockNum = latestBlock; blockNum >= startBlock; blockNum--) {
            try {
                const block = await provider.getBlock(blockNum, true);
                if (!block || !block.transactions) continue;
                
                for (const tx of block.transactions) {
                    // Look for transactions FROM the Safe TO the zero address (contract creation)
                    if (tx.from && tx.from.toLowerCase() === safeAddress.toLowerCase() && 
                        tx.to === null) {
                        
                        console.log(`\n🎯 Found potential contract creation in block ${blockNum}:`);
                        console.log(`- Transaction Hash: ${tx.hash}`);
                        console.log(`- From: ${tx.from}`);
                        console.log(`- Nonce: ${tx.nonce}`);
                        console.log(`- Gas Used: ${tx.gasLimit}`);
                        
                        // Get the receipt to find the contract address
                        const receipt = await provider.getTransactionReceipt(tx.hash);
                        if (receipt && receipt.contractAddress) {
                            console.log(`- Contract Address: ${receipt.contractAddress}`);
                            
                            // Verify this is our CodeDAO Token
                            const isOurToken = await verifyToken(receipt.contractAddress);
                            if (isOurToken) {
                                return receipt.contractAddress;
                            }
                        }
                    }
                }
                
                // Progress indicator every 100 blocks
                if (blockNum % 100 === 0) {
                    console.log(`  Checked block ${blockNum}...`);
                }
                
            } catch (error) {
                // Skip blocks that can't be fetched
                continue;
            }
        }
        
        console.log('\n❌ No contract creation found in recent blocks');
        
        // Method 2: Try to calculate based on Safe nonce
        console.log('\n📡 Method 2: Calculating based on Safe nonce...');
        
        const currentNonce = await provider.getTransactionCount(safeAddress);
        console.log(`Current Safe nonce: ${currentNonce}`);
        
        // Try the last few nonces
        for (let nonce = Math.max(0, currentNonce - 10); nonce < currentNonce; nonce++) {
            const predictedAddress = ethers.getCreateAddress({
                from: safeAddress,
                nonce: nonce
            });
            
            console.log(`- Nonce ${nonce} → ${predictedAddress}`);
            
            // Check if there's a contract at this address
            const code = await provider.getCode(predictedAddress);
            if (code !== '0x') {
                console.log(`  ✅ Contract found! Verifying...`);
                const isOurToken = await verifyToken(predictedAddress);
                if (isOurToken) {
                    return predictedAddress;
                }
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('❌ Error searching for contract:', error.message);
        return null;
    }
}

async function verifyToken(address) {
    try {
        const contract = new ethers.Contract(address, [
            'function name() view returns (string)',
            'function symbol() view returns (string)',
            'function totalSupply() view returns (uint256)',
            'function balanceOf(address) view returns (uint256)'
        ], provider);
        
        const [name, symbol, totalSupply, safeBalance] = await Promise.all([
            contract.name(),
            contract.symbol(),
            contract.totalSupply(),
            contract.balanceOf(safeAddress)
        ]);
        
        console.log(`    Name: ${name}`);
        console.log(`    Symbol: ${symbol}`);
        console.log(`    Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
        console.log(`    Safe Balance: ${ethers.formatEther(safeBalance)} ${symbol}`);
        
        // Check if this matches our expected CodeDAO Token
        const isCorrect = name === 'CodeDAO Token' && 
                         symbol === 'CODE' && 
                         totalSupply.toString() === ethers.parseEther('100000000').toString() &&
                         safeBalance.toString() === totalSupply.toString();
        
        if (isCorrect) {
            console.log(`    ✅ This is our CodeDAO Token!`);
            return true;
        } else {
            console.log(`    ❌ Not our token (wrong name/symbol/supply)`);
            return false;
        }
        
    } catch (error) {
        console.log(`    ❌ Not a valid ERC20 token: ${error.message}`);
        return false;
    }
}

// Run the search
findContractAddress().then(address => {
    if (address) {
        console.log(`\n🎉 FOUND CODEDAO TOKEN CONTRACT!`);
        console.log(`📍 Address: ${address}`);
        console.log(`🔗 BaseScan: https://basescan.org/address/${address}`);
        
        console.log(`\n🚀 READY FOR VERIFICATION COMMANDS:`);
        console.log(`\n1. Verify on BaseScan:`);
        console.log(`   node token-verify-real.js ${address}`);
        console.log(`\n2. Manual commands to run after verification:`);
        console.log(`   /token verify-mainnet address = ${address}`);
        console.log(`   /token canary-transfer address = ${address}`);
        console.log(`   /token publish address = ${address}`);
    } else {
        console.log('\n❌ CodeDAO Token contract not found');
        console.log('💡 Suggestions:');
        console.log('- Check if the Safe transaction actually executed');
        console.log('- Verify the Safe address is correct');
        console.log('- Look in Safe UI Activity for the "Contract Created" address');
    }
}).catch(console.error); 
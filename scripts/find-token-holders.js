const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    console.log("🔍 FINDING TOKEN HOLDERS");
    console.log("========================");
    console.log(`Contract: ${contractAddress}\n`);
    
    const provider = ethers.provider;
    
    // Get recent transfer events
    console.log("📋 CHECKING TRANSFER EVENTS");
    console.log("===========================");
    
    try {
        // Transfer event signature: Transfer(address indexed from, address indexed to, uint256 value)
        const transferTopic = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
        
        // Get recent blocks to search
        const currentBlock = await provider.getBlockNumber();
        const fromBlock = Math.max(0, currentBlock - 10000); // Last 10000 blocks
        
        console.log(`Searching transfer events from block ${fromBlock} to ${currentBlock}...`);
        
        const logs = await provider.getLogs({
            address: contractAddress,
            topics: [transferTopic],
            fromBlock: fromBlock,
            toBlock: "latest"
        });
        
        console.log(`Found ${logs.length} transfer events`);
        
        if (logs.length > 0) {
            console.log("\n📋 RECENT TRANSFERS:");
            
            // Parse the most recent transfers
            const recentTransfers = logs.slice(-10); // Last 10 transfers
            
            for (let i = 0; i < recentTransfers.length; i++) {
                const log = recentTransfers[i];
                
                // Parse transfer event data
                const from = "0x" + log.topics[1].slice(26); // Remove 0x000...000 padding
                const to = "0x" + log.topics[2].slice(26);
                const value = BigInt(log.data);
                const valueFormatted = (Number(value) / 1e18).toLocaleString();
                
                console.log(`${i + 1}. Block ${log.blockNumber}: ${from} → ${to} (${valueFormatted} tokens)`);
                
                // Check if this shows who has the tokens now
                if (value > BigInt("1000000000000000000000000")) { // More than 1M tokens
                    console.log(`   🎯 LARGE TRANSFER: ${valueFormatted} tokens to ${to}`);
                }
            }
        } else {
            console.log("❌ No transfer events found in recent blocks");
            console.log("   This could mean:");
            console.log("   1. Transfers are not working (broken contract)");
            console.log("   2. No transfers have happened recently");
            console.log("   3. Contract was deployed before our search window");
        }
        
    } catch (error) {
        console.log(`❌ Error getting transfer events: ${error.message}`);
    }
    
    // Try to find holders by checking some known addresses
    console.log("\n📋 CHECKING POTENTIAL HOLDERS");
    console.log("=============================");
    
    const addressesToCheck = [
        "0xe4e53f3c17fde8ef635c0921fa340fd1808c16e9", // Owner
        "0x0000000000000000000000000000000000000000", // Zero address (burn)
        contractAddress, // Contract itself
    ];
    
    for (const addr of addressesToCheck) {
        try {
            const balanceCall = await provider.call({
                to: contractAddress,
                data: "0x70a08231000000000000000000000000" + addr.slice(2)
            });
            
            const balance = BigInt(balanceCall);
            const balanceFormatted = (Number(balance) / 1e18).toLocaleString();
            
            if (balance > 0) {
                console.log(`✅ ${addr}: ${balanceFormatted} tokens`);
            } else {
                console.log(`❌ ${addr}: 0 tokens`);
            }
            
        } catch (error) {
            console.log(`❌ ${addr}: Error checking balance`);
        }
    }
    
    // Check deployment transaction
    console.log("\n📋 DEPLOYMENT INFO");
    console.log("==================");
    
    try {
        // Try to get contract creation info
        const code = await provider.getCode(contractAddress);
        console.log(`Contract has ${code.length} characters of bytecode`);
        
        // The tokens should have been minted to someone during deployment
        console.log("\n🎯 NEXT STEPS:");
        console.log("1. Check BaseScan for this contract's deployment transaction");
        console.log("2. Look at the first Transfer event (minting event)");
        console.log("3. Find who received the initial 100M tokens");
        console.log("4. Test transfer functionality with the actual token holder");
        
    } catch (error) {
        console.log(`Error: ${error.message}`);
    }
    
    console.log("\n🚨 CRITICAL FOR VERIFICATION:");
    console.log("If owner has 0 tokens, either:");
    console.log("1. Tokens were transferred away (contract works)");
    console.log("2. Minting failed during deployment (broken contract)");
    console.log("3. Different minting mechanism than expected");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
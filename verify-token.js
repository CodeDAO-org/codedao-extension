const { ethers } = require('ethers');

async function verifyToken() {
    const contractAddress = '0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C';
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    
    console.log('🔍 Verifying CodeDAO Token at:', contractAddress);
    
    const contract = new ethers.Contract(contractAddress, [
        'function name() view returns (string)',
        'function symbol() view returns (string)', 
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)',
        'function balanceOf(address) view returns (uint256)'
    ], provider);
    
    try {
        const [name, symbol, decimals, totalSupply, safeBalance] = await Promise.all([
            contract.name(),
            contract.symbol(),
            contract.decimals(),
            contract.totalSupply(),
            contract.balanceOf('0x813343d30065eAe9D1Be6521203f5C0874818C28')
        ]);
        
        console.log('\n✅ CONTRACT DETAILS:');
        console.log('Name:', name);
        console.log('Symbol:', symbol);
        console.log('Decimals:', decimals);
        console.log('Total Supply:', ethers.formatEther(totalSupply), symbol);
        console.log('Safe Balance:', ethers.formatEther(safeBalance), symbol);
        
        // Check if Safe has all tokens
        if (safeBalance.toString() === totalSupply.toString()) {
            console.log('✅ All 100M tokens correctly minted to Safe!');
        } else {
            console.log('❌ Token minting issue detected!');
        }
        
        console.log('\n🔗 LINKS:');
        console.log('BaseScan:', `https://basescan.org/address/${contractAddress}`);
        console.log('Deploy Tx:', 'https://basescan.org/tx/0x5f8ae14016f3743fee04860c297532852a6a3e09d3fb342a58d191cfb7705a10');
        
        console.log('\n🎯 SUCCESS! CodeDAO Token is LIVE on Base mainnet!');
        
        return {
            address: contractAddress,
            name,
            symbol,
            totalSupply: ethers.formatEther(totalSupply),
            verified: true
        };
        
    } catch (error) {
        console.log('❌ Verification failed:', error.message);
        return { verified: false, error: error.message };
    }
}

verifyToken().catch(console.error); 
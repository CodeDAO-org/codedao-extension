const { ethers } = require('ethers');
const fs = require('fs');

async function deployNow() {
    console.log('🚀 Deploying CodeDAO Token RIGHT NOW...');
    
    // Load compiled contract
    const contractPath = './artifacts/contracts/CodeDAOToken.sol/CodeDAOToken.json';
    if (!fs.existsSync(contractPath)) {
        throw new Error('Contract not compiled! Run: npx hardhat compile');
    }
    
    const contractJson = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    const bytecode = contractJson.bytecode;
    
    console.log('✅ Contract loaded, bytecode length:', bytecode.length);
    
    // Setup wallet and provider
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const wallet = new ethers.Wallet('0b24ee2ee4a4931c95c0c8d44d5942b1a1c3a63191b95c1904bfb44efb51c00f', provider);
    
    console.log('Deploying from:', wallet.address);
    const balance = await provider.getBalance(wallet.address);
    console.log('Balance:', ethers.formatEther(balance), 'ETH');
    
    if (balance < ethers.parseEther('0.01')) {
        throw new Error('Insufficient balance for deployment!');
    }
    
    // Deploy contract
    console.log('🔥 Deploying to Base mainnet...');
    
    const tx = await wallet.sendTransaction({
        data: bytecode,
        gasLimit: 2000000,
    });
    
    console.log('Deploy tx sent:', tx.hash);
    console.log('⏳ Waiting for confirmation...');
    
    const receipt = await tx.wait();
    const contractAddress = receipt.contractAddress;
    
    console.log('\n🎉 SUCCESS! CONTRACT DEPLOYED!');
    console.log('📍 Address:', contractAddress);
    console.log('⛽ Gas used:', receipt.gasUsed.toString());
    console.log('💰 Cost:', ethers.formatEther(receipt.gasUsed * tx.gasPrice), 'ETH');
    
    // Verify deployment
    console.log('\n🔍 Verifying deployment...');
    
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
        
        console.log('\n✅ CONTRACT VERIFICATION:');
        console.log('Name:', name);
        console.log('Symbol:', symbol);
        console.log('Decimals:', decimals);
        console.log('Total Supply:', ethers.formatEther(totalSupply), symbol);
        console.log('Safe Balance:', ethers.formatEther(safeBalance), symbol);
        
        // Check if Safe has all tokens
        if (safeBalance.toString() === totalSupply.toString()) {
            console.log('✅ All tokens correctly minted to Safe!');
        } else {
            console.log('❌ Token minting issue detected!');
        }
        
    } catch (error) {
        console.log('❌ Verification failed:', error.message);
    }
    
    console.log('\n🔗 LINKS:');
    console.log('BaseScan:', `https://basescan.org/address/${contractAddress}`);
    console.log('Transaction:', `https://basescan.org/tx/${tx.hash}`);
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('1. Check BaseScan to confirm contract is verified');
    console.log('2. Test a transfer from the Safe');
    console.log('3. Update CodeDAO apps with the new address');
    
    return {
        address: contractAddress,
        txHash: tx.hash,
        gasUsed: receipt.gasUsed.toString(),
        baseScanUrl: `https://basescan.org/address/${contractAddress}`
    };
}

if (require.main === module) {
    deployNow()
        .then(result => {
            console.log('\n🏆 DEPLOYMENT COMPLETE!');
            console.log('Save this info:', JSON.stringify(result, null, 2));
        })
        .catch(error => {
            console.error('💥 DEPLOYMENT FAILED:', error.message);
            process.exit(1);
        });
}

module.exports = deployNow; 
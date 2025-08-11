const { ethers } = require('ethers');
const fs = require('fs');

async function analyzeDeployed() {
    const contractAddress = '0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C';
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    
    console.log('🔍 Analyzing deployed contract...');
    
    // Get deployed bytecode
    const deployedCode = await provider.getCode(contractAddress);
    console.log('✅ Deployed bytecode length:', deployedCode.length);
    console.log('✅ Deployed bytecode (first 100 chars):', deployedCode.substring(0, 100));
    
    // Check if we have compiled bytecode to compare
    const compiledPath = './artifacts/contracts/CodeDAOToken.sol/CodeDAOToken.json';
    if (fs.existsSync(compiledPath)) {
        const compiled = JSON.parse(fs.readFileSync(compiledPath, 'utf8'));
        const compiledBytecode = compiled.bytecode;
        
        console.log('✅ Compiled bytecode length:', compiledBytecode.length);
        console.log('✅ Compiled bytecode (first 100 chars):', compiledBytecode.substring(0, 100));
        
        console.log('🔍 Bytecode match:', deployedCode === compiled.deployedBytecode ? '✅ YES' : '❌ NO');
        console.log('🔍 Creation bytecode match:', compiledBytecode.startsWith(deployedCode.substring(2)) ? '✅ Partial' : '❌ NO');
    }
    
    // Try to call contract functions
    const contract = new ethers.Contract(contractAddress, [
        'function name() view returns (string)',
        'function symbol() view returns (string)',
        'function decimals() view returns (uint8)',
        'function totalSupply() view returns (uint256)'
    ], provider);
    
    try {
        const name = await contract.name();
        const symbol = await contract.symbol();
        const decimals = await contract.decimals();
        const totalSupply = await contract.totalSupply();
        
        console.log('📋 Contract Info:');
        console.log('  Name:', name);
        console.log('  Symbol:', symbol);
        console.log('  Decimals:', decimals);
        console.log('  Total Supply:', ethers.formatEther(totalSupply));
    } catch (error) {
        console.log('❌ Error reading contract:', error.message);
    }
}

analyzeDeployed().catch(console.error); 
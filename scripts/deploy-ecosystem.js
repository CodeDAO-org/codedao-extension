const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Deploying CodeDAO Ecosystem...');
    
    const [deployer] = await ethers.getSigners();
    console.log('📍 Deploying from:', deployer.address);
    console.log('💰 Balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');
    
    // Get existing CodeDAO Token
    const codeTokenAddress = '0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C';
    console.log('🪙 Using existing CodeDAO Token:', codeTokenAddress);
    
    // Deploy StakingVault (sCODE)
    console.log('\n📈 Deploying StakingVault...');
    const StakingVault = await ethers.getContractFactory('StakingVault');
    const stakingVault = await StakingVault.deploy(codeTokenAddress);
    await stakingVault.waitForDeployment();
    
    const stakingVaultAddress = await stakingVault.getAddress();
    console.log('✅ StakingVault deployed:', stakingVaultAddress);
    
    // Deploy CodeEpochDistributor
    console.log('\n🎯 Deploying CodeEpochDistributor...');
    const CodeEpochDistributor = await ethers.getContractFactory('CodeEpochDistributor');
    const epochDistributor = await CodeEpochDistributor.deploy(codeTokenAddress);
    await epochDistributor.waitForDeployment();
    
    const epochDistributorAddress = await epochDistributor.getAddress();
    console.log('✅ CodeEpochDistributor deployed:', epochDistributorAddress);
    
    // Verify deployments
    console.log('\n🔍 Verifying deployments...');
    
    // Check StakingVault
    const stakingName = await stakingVault.name();
    const stakingSymbol = await stakingVault.symbol();
    console.log(`📊 StakingVault: ${stakingName} (${stakingSymbol})`);
    
    // Check EpochDistributor  
    const currentEpoch = await epochDistributor.currentEpoch();
    console.log(`📅 Current Epoch: ${currentEpoch}`);
    
    // Test tier checking
    const testAddress = '0x813343d30065eAe9D1Be6521203f5C0874818C28'; // Safe address
    const tier = await stakingVault.getUserTier(testAddress);
    console.log(`🏆 Safe tier: ${tier}`);
    
    console.log('\n🎉 CodeDAO Ecosystem Deployed Successfully!');
    console.log('\n📝 Contract Addresses:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🪙 CodeDAO Token:       ${codeTokenAddress}`);
    console.log(`📈 StakingVault (sCODE): ${stakingVaultAddress}`);
    console.log(`🎯 EpochDistributor:     ${epochDistributorAddress}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Fund EpochDistributor with CODE tokens');
    console.log('2. Set up GitHub App for PR attestations');
    console.log('3. Create CODE/USDC pool on Aerodrome');
    console.log('4. Integrate SIWE + tier gating in dashboard');
    
    // Save addresses for verification
    const addresses = {
        codeToken: codeTokenAddress,
        stakingVault: stakingVaultAddress,
        epochDistributor: epochDistributorAddress,
        network: 'base',
        deployer: deployer.address,
        timestamp: new Date().toISOString()
    };
    
    const fs = require('fs');
    fs.writeFileSync(
        'deployed-addresses.json',
        JSON.stringify(addresses, null, 2)
    );
    
    console.log('\n💾 Addresses saved to: deployed-addresses.json');
    
    return addresses;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }); 
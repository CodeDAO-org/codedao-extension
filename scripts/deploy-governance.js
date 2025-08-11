const { ethers } = require('hardhat');

async function main() {
    console.log('🏛️ Deploying CodeDAO Governance System...');
    
    const [deployer] = await ethers.getSigners();
    console.log('📍 Deploying from:', deployer.address);
    console.log('💰 Balance:', ethers.formatEther(await deployer.provider.getBalance(deployer.address)), 'ETH');
    
    // Contract addresses from previous deployments
    const codeTokenAddress = '0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C';
    const stakingVaultAddress = '0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c'; // Will be redeployed with voting
    const epochDistributorAddress = '0x36653EFf30fa88765Cf12199A009DdcB2cF724a0';
    const safeAddress = '0x813343d30065eAe9D1Be6521203f5C0874818C28';
    
    console.log('🪙 Using existing CodeDAO Token:', codeTokenAddress);
    
    // Deploy new StakingVault with voting capabilities
    console.log('\n📈 Deploying StakingVault with ERC20Votes...');
    const StakingVault = await ethers.getContractFactory('StakingVault');
    const stakingVault = await StakingVault.deploy(codeTokenAddress);
    await stakingVault.waitForDeployment();
    
    const newStakingVaultAddress = await stakingVault.getAddress();
    console.log('✅ New StakingVault deployed:', newStakingVaultAddress);
    
    // Deploy TimelockController
    console.log('\n⏰ Deploying TimelockController...');
    const TimelockController = await ethers.getContractFactory('@openzeppelin/contracts/governance/TimelockController.sol:TimelockController');
    
    const minDelay = 2 * 24 * 60 * 60; // 2 days
    const proposers = []; // Will be set to Governor after deployment
    const executors = [safeAddress]; // Safe can execute
    const admin = deployer.address; // Deployer initially, will renounce
    
    const timelock = await TimelockController.deploy(minDelay, proposers, executors, admin);
    await timelock.waitForDeployment();
    
    const timelockAddress = await timelock.getAddress();
    console.log('✅ TimelockController deployed:', timelockAddress);
    
    // Deploy Governor
    console.log('\n🗳️ Deploying CodeDAOGovernor...');
    const Governor = await ethers.getContractFactory('CodeDAOGovernor');
    const governor = await Governor.deploy(newStakingVaultAddress, timelockAddress);
    await governor.waitForDeployment();
    
    const governorAddress = await governor.getAddress();
    console.log('✅ CodeDAOGovernor deployed:', governorAddress);
    
    // Setup TimelockController roles
    console.log('\n🔐 Setting up Timelock roles...');
    
    const PROPOSER_ROLE = await timelock.PROPOSER_ROLE();
    const EXECUTOR_ROLE = await timelock.EXECUTOR_ROLE();
    const TIMELOCK_ADMIN_ROLE = await timelock.TIMELOCK_ADMIN_ROLE();
    
    // Grant proposer role to Governor
    await timelock.grantRole(PROPOSER_ROLE, governorAddress);
    console.log('✅ Granted PROPOSER_ROLE to Governor');
    
    // Grant executor role to anyone (for transparency)
    await timelock.grantRole(EXECUTOR_ROLE, ethers.ZeroAddress);
    console.log('✅ Granted EXECUTOR_ROLE to everyone');
    
    // Renounce admin role (governor should control timelock)
    await timelock.renounceRole(TIMELOCK_ADMIN_ROLE, deployer.address);
    console.log('✅ Renounced TIMELOCK_ADMIN_ROLE');
    
    // Deploy MerkleDistributor for airdrop
    console.log('\n🎁 Deploying MerkleDistributor for airdrop...');
    
    // Temporary merkle root for deployment (will be updated with real airdrop data)
    const tempMerkleRoot = '0x0000000000000000000000000000000000000000000000000000000000000000';
    const airdropExpiry = Math.floor(Date.now() / 1000) + (90 * 24 * 60 * 60); // 90 days
    
    const MerkleDistributor = await ethers.getContractFactory('MerkleDistributor');
    const airdropDistributor = await MerkleDistributor.deploy(
        codeTokenAddress,
        tempMerkleRoot,
        'CodeDAO Genesis Airdrop - 5M CODE',
        airdropExpiry,
        safeAddress // Safe as admin
    );
    await airdropDistributor.waitForDeployment();
    
    const airdropDistributorAddress = await airdropDistributor.getAddress();
    console.log('✅ Airdrop MerkleDistributor deployed:', airdropDistributorAddress);
    
    // Verify deployments
    console.log('\n🔍 Verifying deployments...');
    
    const stakingName = await stakingVault.name();
    const stakingSymbol = await stakingVault.symbol();
    console.log(`📊 StakingVault: ${stakingName} (${stakingSymbol})`);
    
    const governorName = await governor.name();
    const votingDelay = await governor.votingDelay();
    const votingPeriod = await governor.votingPeriod();
    console.log(`🗳️ Governor: ${governorName}`);
    console.log(`⏱️ Voting Delay: ${votingDelay} blocks`);
    console.log(`📅 Voting Period: ${votingPeriod} blocks`);
    
    const minDelayActual = await timelock.getMinDelay();
    console.log(`⏰ Timelock Min Delay: ${minDelayActual} seconds (${minDelayActual / (24 * 60 * 60)} days)`);
    
    console.log('\n🎉 CodeDAO Governance System Deployed Successfully!');
    console.log('\n📝 Contract Addresses:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`🪙 CodeDAO Token:        ${codeTokenAddress}`);
    console.log(`📈 StakingVault (sCODE):  ${newStakingVaultAddress}`);
    console.log(`🎯 EpochDistributor:      ${epochDistributorAddress}`);
    console.log(`🗳️ Governor:              ${governorAddress}`);
    console.log(`⏰ Timelock:              ${timelockAddress}`);
    console.log(`🎁 Airdrop Distributor:   ${airdropDistributorAddress}`);
    console.log(`🏛️ Safe (Treasury):       ${safeAddress}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    console.log('\n🔧 Next Steps:');
    console.log('1. Verify contracts on BaseScan');
    console.log('2. Create airdrop snapshot and update MerkleDistributor');
    console.log('3. Create CODE/USDC pool on Aerodrome');
    console.log('4. Fund EpochDistributor and start first reward epoch');
    console.log('5. Setup first governance proposals');
    
    // Save addresses for verification
    const addresses = {
        codeToken: codeTokenAddress,
        stakingVault: newStakingVaultAddress,
        epochDistributor: epochDistributorAddress,
        governor: governorAddress,
        timelock: timelockAddress,
        airdropDistributor: airdropDistributorAddress,
        safe: safeAddress,
        network: 'base',
        deployer: deployer.address,
        timestamp: new Date().toISOString(),
        governance: {
            votingDelay: votingDelay.toString(),
            votingPeriod: votingPeriod.toString(),
            timelockDelay: minDelayActual.toString(),
            quorum: '6%'
        }
    };
    
    const fs = require('fs');
    fs.writeFileSync(
        'governance-addresses.json',
        JSON.stringify(addresses, null, 2)
    );
    
    console.log('\n💾 Addresses saved to: governance-addresses.json');
    
    return addresses;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Governance deployment failed:', error);
        process.exit(1);
    }); 
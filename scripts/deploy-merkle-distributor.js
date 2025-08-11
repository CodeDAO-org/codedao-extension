#!/usr/bin/env node

/**
 * 🎯 Deploy MerkleDistributorV2 for Real Claims
 * Fast deployment to get the flow working
 */

const { ethers } = require('hardhat');

async function main() {
    console.log('🚀 Deploying MerkleDistributorV2...');
    console.log('═══════════════════════════════════════════════');
    
    const [deployer] = await ethers.getSigners();
    console.log('📝 Deploying with account:', deployer.address);
    
    // Contract addresses
    const CONFIG = {
        codeToken: '0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C',
        stakingVault: '0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c',
        safe: '0x813343d30065eAe9D1Be6521203f5C0874818C28'
    };
    
    console.log('📋 Configuration:');
    console.log('   CODE Token:', CONFIG.codeToken);
    console.log('   Staking Vault:', CONFIG.stakingVault);
    console.log('   Root Guardian:', CONFIG.safe);
    
    try {
        // Deploy MerkleDistributorV2
        console.log('\n🔄 Deploying MerkleDistributorV2...');
        const MerkleDistributorV2 = await ethers.getContractFactory('MerkleDistributorV2');
        
        const merkleDistributor = await MerkleDistributorV2.deploy(
            CONFIG.codeToken,
            CONFIG.stakingVault,
            CONFIG.safe // Root guardian
        );
        
        await merkleDistributor.waitForDeployment();
        const distributorAddress = await merkleDistributor.getAddress();
        
        console.log('✅ MerkleDistributorV2 deployed!');
        console.log('📍 Address:', distributorAddress);
        
        // Verify deployment
        console.log('\n🔍 Verifying deployment...');
        const token = await merkleDistributor.token();
        const stakingVault = await merkleDistributor.stakingVault();
        const rootGuardian = await merkleDistributor.rootGuardian();
        const owner = await merkleDistributor.owner();
        
        console.log('✓ Token:', token);
        console.log('✓ Staking Vault:', stakingVault);
        console.log('✓ Root Guardian:', rootGuardian);
        console.log('✓ Owner:', owner);
        
        // Update addresses.base.json
        console.log('\n📝 Updating addresses.base.json...');
        const fs = require('fs');
        const addressesPath = './addresses.base.json';
        const addresses = JSON.parse(fs.readFileSync(addressesPath, 'utf8'));
        
        addresses.contracts.merkleDistributorV2 = {
            address: distributorAddress,
            name: 'MerkleDistributorV2',
            description: 'Cumulative Merkle distribution with gasless support',
            verified: false,
            basescanUrl: `https://basescan.org/address/${distributorAddress}#code`
        };
        
        fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
        console.log('✅ Updated addresses.base.json');
        
        // Generate Safe Transaction Data for funding
        console.log('\n🔐 Generating Safe Funding Transaction...');
        const fundingAmount = ethers.parseEther("1000"); // 1000 CODE for initial funding
        
        const safeTx = {
            to: CONFIG.codeToken,
            value: "0",
            data: null,
            method: "transfer(address,uint256)",
            parameters: {
                to: distributorAddress,
                amount: fundingAmount.toString()
            },
            description: `Fund MerkleDistributorV2 with 1000 CODE tokens`,
            contractInterface: {
                name: "ERC20",
                method: "transfer", 
                inputs: [
                    { name: "to", type: "address", value: distributorAddress },
                    { name: "amount", type: "uint256", value: fundingAmount.toString() }
                ]
            }
        };
        
        const txFile = './safe/fund-merkle-distributor.json';
        fs.writeFileSync(txFile, JSON.stringify(safeTx, null, 2));
        
        console.log('📋 Safe Transaction Summary:');
        console.log('   Contract:', 'CODE Token');
        console.log('   Method:', 'transfer');
        console.log('   To:', distributorAddress);
        console.log('   Amount:', ethers.formatEther(fundingAmount), 'CODE');
        console.log('   File:', txFile);
        
        // Verify contract on BaseScan
        console.log('\n🔍 Starting BaseScan verification...');
        try {
            await hre.run("verify:verify", {
                address: distributorAddress,
                constructorArguments: [
                    CONFIG.codeToken,
                    CONFIG.stakingVault, 
                    CONFIG.safe
                ],
            });
            console.log('✅ Contract verified on BaseScan!');
            
            // Update verification status
            addresses.contracts.merkleDistributorV2.verified = true;
            fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
            
        } catch (error) {
            console.log('⚠️ Verification failed (will try later):', error.message);
        }
        
        console.log('\n🎯 DEPLOYMENT COMPLETE!');
        console.log('═══════════════════════════════════════════════');
        console.log('✅ MerkleDistributorV2:', distributorAddress);
        console.log('✅ Epoch 1 Root:', '0xddc833d869453b3935e5e64cd450430d15fbbb81fcab74dcf91800b63e02ca2e');
        console.log('✅ Safe Funding Transaction ready');
        
        console.log('\n🔄 NEXT STEPS:');
        console.log('1. Execute Safe funding transaction (1000 CODE)');
        console.log('2. Set epoch root via Safe (see epoch-1-safe-transactions.json)');
        console.log('3. Update Claim Hub to use this distributor');
        console.log('4. Test real claims!');
        
        // Generate deployment summary
        const deploymentSummary = {
            timestamp: new Date().toISOString(),
            network: 'base',
            contracts: {
                merkleDistributorV2: distributorAddress,
                codeToken: CONFIG.codeToken,
                stakingVault: CONFIG.stakingVault,
                safe: CONFIG.safe
            },
            epoch1: {
                root: '0xddc833d869453b3935e5e64cd450430d15fbbb81fcab74dcf91800b63e02ca2e',
                totalAmount: '150000000000000000000',
                claims: 2
            },
            funding: {
                amount: fundingAmount.toString(),
                transaction: txFile
            },
            status: 'READY_FOR_FUNDING'
        };
        
        fs.writeFileSync('./deployment-summary.json', JSON.stringify(deploymentSummary, null, 2));
        console.log('💾 Deployment summary saved to deployment-summary.json');
        
    } catch (error) {
        console.error('❌ Deployment failed:', error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error('❌ Script failed:', error);
        process.exit(1);
    }); 
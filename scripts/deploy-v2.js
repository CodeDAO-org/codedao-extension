const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 Deploying CodeDAO Token V2 (Enhanced)");
    console.log("=========================================");
    
    // Get the deployer account
    const [deployer] = await ethers.getSigners();
    console.log("Deploying from account:", deployer.address);
    console.log("Account balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");
    
    // For now, use deployer as admin (should be replaced with Safe multisig in production)
    const adminAddress = deployer.address;
    console.log("Setting admin to:", adminAddress);
    console.log("⚠️  PRODUCTION NOTE: Replace with Safe multisig address");
    console.log("");
    
    // Deploy the contract
    console.log("📦 Deploying CodeDAOToken V2...");
    const CodeDAOTokenV2 = await ethers.getContractFactory("CodeDAOToken");
    const token = await CodeDAOTokenV2.deploy(adminAddress);
    
    console.log("⏳ Waiting for deployment...");
    await token.waitForDeployment();
    
    const contractAddress = await token.getAddress();
    console.log("✅ CodeDAO Token V2 deployed successfully!");
    console.log(`📍 Contract Address: ${contractAddress}`);
    console.log("");
    
    // Verify deployment
    console.log("🔍 Verifying deployment...");
    const [name, symbol, decimals, cap, totalSupply] = await Promise.all([
        token.name(),
        token.symbol(),
        token.decimals(),
        token.cap(),
        token.totalSupply()
    ]);
    
    console.log("Contract Details:");
    console.log(`  Name: ${name}`);
    console.log(`  Symbol: ${symbol}`);
    console.log(`  Decimals: ${decimals}`);
    console.log(`  Cap: ${ethers.formatUnits(cap, decimals)} ${symbol}`);
    console.log(`  Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
    console.log("");
    
    // Check roles
    console.log("👥 Role Assignments:");
    const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await token.MINTER_ROLE();
    const PAUSER_ROLE = await token.PAUSER_ROLE();
    
    const [isAdmin, isMinter, isPauser] = await Promise.all([
        token.hasRole(DEFAULT_ADMIN_ROLE, adminAddress),
        token.hasRole(MINTER_ROLE, adminAddress),
        token.hasRole(PAUSER_ROLE, adminAddress)
    ]);
    
    console.log(`  DEFAULT_ADMIN_ROLE: ${isAdmin ? '✅' : '❌'} ${adminAddress}`);
    console.log(`  MINTER_ROLE: ${isMinter ? '✅' : '❌'} ${adminAddress}`);  
    console.log(`  PAUSER_ROLE: ${isPauser ? '✅' : '❌'} ${adminAddress}`);
    console.log("");
    
    // Test minting capability
    console.log("🧪 Testing mint capability...");
    try {
        const [canMint, reason] = await token.getMintingStatus();
        console.log(`  Can mint: ${canMint ? '✅' : '❌'} ${reason}`);
        
        if (canMint) {
            console.log("  Minting 1000 test tokens...");
            const mintTx = await token.mint(deployer.address, ethers.parseUnits("1000", decimals));
            await mintTx.wait();
            
            const newBalance = await token.balanceOf(deployer.address);
            console.log(`  ✅ Test mint successful! Balance: ${ethers.formatUnits(newBalance, decimals)} ${symbol}`);
        }
    } catch (error) {
        console.log(`  ❌ Mint test failed: ${error.message}`);
    }
    console.log("");
    
    // Auto-verification attempt
    console.log("🔗 Attempting automatic verification...");
    try {
        if (process.env.BASESCAN_API_KEY) {
            console.log("Starting BaseScan verification...");
            
            // Note: In real deployment, you might want to wait a bit for the transaction to be confirmed
            await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
            
            await hre.run("verify:verify", {
                address: contractAddress,
                constructorArguments: [adminAddress],
                contract: "contracts/v2/CodeDAOTokenV2.sol:CodeDAOToken"
            });
            
            console.log("✅ Contract verified on BaseScan!");
        } else {
            console.log("⚠️  No BASESCAN_API_KEY found, skipping auto-verification");
        }
    } catch (error) {
        console.log(`⚠️  Auto-verification failed: ${error.message}`);
        console.log("You can verify manually with:");
        console.log(`npx hardhat verify --network base ${contractAddress} ${adminAddress}`);
    }
    console.log("");
    
    // Deployment summary
    console.log("📋 DEPLOYMENT SUMMARY");
    console.log("=====================");
    console.log(`✅ Contract: ${contractAddress}`);
    console.log(`✅ Network: Base Mainnet (Chain ID: 8453)`);
    console.log(`✅ Admin: ${adminAddress}`);
    console.log(`✅ Cap: 1,000,000,000 CODE`);
    console.log(`✅ Features: Mintable, Pausable, AccessControl, Permit`);
    console.log("");
    console.log("🔗 Links:");
    console.log(`  BaseScan: https://basescan.org/address/${contractAddress}`);
    console.log(`  Token: https://basescan.org/token/${contractAddress}`);
    console.log("");
    console.log("📝 Next Steps:");
    console.log("1. Verify contract on BaseScan (if auto-verification failed)");
    console.log("2. Set up distribution contracts/addresses");
    console.log("3. Transfer admin role to Safe multisig");
    console.log("4. Execute tokenomics distribution plan");
    console.log("5. Set up migration from v1 to v2");
    
    // Save deployment info
    const deploymentInfo = {
        contractAddress,
        network: "base",
        chainId: 8453,
        deployer: deployer.address,
        admin: adminAddress,
        timestamp: new Date().toISOString(),
        txHash: token.deploymentTransaction?.hash,
        constructorArgs: [adminAddress]
    };
    
    const fs = require('fs');
    fs.writeFileSync(
        'deployment-v2.json', 
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("💾 Deployment info saved to deployment-v2.json");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }); 
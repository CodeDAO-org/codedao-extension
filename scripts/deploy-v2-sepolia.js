const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🚀 Deploying CodeDAO Token V2 to Base Sepolia");
    console.log("==============================================");
    
    // Get deployment info
    const [deployer] = await ethers.getSigners();
    const network = await ethers.provider.getNetwork();
    const balance = await ethers.provider.getBalance(deployer.address);
    
    console.log("📋 DEPLOYMENT INFO:");
    console.log(`• Network: ${network.name} (Chain ID: ${network.chainId})`);
    console.log(`• Deployer: ${deployer.address}`);
    console.log(`• Balance: ${ethers.formatEther(balance)} ETH`);
    console.log(`• Timestamp: ${new Date().toISOString()}`);
    console.log("");
    
    // Verify we're on Sepolia
    if (network.chainId !== 84532n) {
        throw new Error(`❌ Wrong network! Expected Base Sepolia (84532), got ${network.chainId}`);
    }
    
    // Check balance
    if (balance < ethers.parseEther("0.01")) {
        console.log("⚠️  WARNING: Low ETH balance. You may need more for deployment.");
    }
    
    // Deploy contract - using fully qualified name
    console.log("📦 Deploying CodeDAOToken V2...");
    const CodeDAOToken = await ethers.getContractFactory("contracts/v2/CodeDAOTokenV2.sol:CodeDAOToken");
    
    // Constructor args: admin address (temporary EOA for Sepolia)
    const constructorArgs = [deployer.address];
    
    const token = await CodeDAOToken.deploy(...constructorArgs);
    await token.waitForDeployment();
    
    const contractAddress = await token.getAddress();
    console.log(`✅ CodeDAOToken V2 deployed to: ${contractAddress}`);
    
    // Setup initial roles (temporary for Sepolia)
    console.log("");
    console.log("🔐 Setting up roles (Sepolia - temporary EOA)...");
    
    const ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
    const MINTER_ROLE = await token.MINTER_ROLE();
    const PAUSER_ROLE = await token.PAUSER_ROLE();
    
    console.log(`• Admin Role: ${deployer.address} (already set by constructor)`);
    
    // Grant minter role to deployer (for testing)
    const grantMinterTx = await token.grantRole(MINTER_ROLE, deployer.address);
    await grantMinterTx.wait();
    console.log(`• Minter Role: ${deployer.address} - TX: ${grantMinterTx.hash}`);
    
    // Grant pauser role to deployer (for testing)
    const grantPauserTx = await token.grantRole(PAUSER_ROLE, deployer.address);
    await grantPauserTx.wait();
    console.log(`• Pauser Role: ${deployer.address} - TX: ${grantPauserTx.hash}`);
    
    // Generate deployment artifacts
    console.log("");
    console.log("📄 Generating deployment artifacts...");
    
    const deploymentData = {
        network: "baseSepolia",
        chainId: Number(network.chainId),
        contractAddress: contractAddress,
        deployer: deployer.address,
        deploymentTx: token.deploymentTransaction().hash,
        timestamp: new Date().toISOString(),
        block: await ethers.provider.getBlockNumber(),
        constructorArgs: constructorArgs,
        roles: {
            admin: deployer.address,
            minter: deployer.address,
            pauser: deployer.address
        },
        transactions: {
            deployment: token.deploymentTransaction().hash,
            grantMinter: grantMinterTx.hash,
            grantPauser: grantPauserTx.hash
        }
    };
    
    // Create artifacts directory
    const artifactsDir = path.join(__dirname, "../artifacts/v2");
    if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir, { recursive: true });
    }
    
    // Save deployment data
    fs.writeFileSync(
        path.join(artifactsDir, "addresses.base-sepolia.json"),
        JSON.stringify(deploymentData, null, 2)
    );
    
    // Save ABI
    const artifact = await ethers.getContractFactory("contracts/v2/CodeDAOTokenV2.sol:CodeDAOToken");
    fs.writeFileSync(
        path.join(artifactsDir, "ABI.json"),
        JSON.stringify(artifact.interface.fragments, null, 2)
    );
    
    console.log("✅ Artifacts saved to artifacts/v2/");
    
    // Verification info
    console.log("");
    console.log("🔍 VERIFICATION COMMAND:");
    console.log("=======================");
    console.log(`npx hardhat verify --network baseSepolia ${contractAddress} ${constructorArgs.join(" ")}`);
    
    console.log("");
    console.log("🎯 NEXT STEPS:");
    console.log("=============");
    console.log("1. Run verification command above");
    console.log("2. Execute smoke tests with: npm run test:sepolia");
    console.log("3. Check BaseScan: https://sepolia.basescan.org/address/" + contractAddress);
    
    return {
        contractAddress,
        deployer: deployer.address,
        network: network.name,
        chainId: Number(network.chainId)
    };
}

main()
    .then((result) => {
        console.log(`\n🎉 Deployment successful! Contract: ${result.contractAddress}`);
        process.exit(0);
    })
    .catch((error) => {
        console.error(`\n❌ Deployment failed:`, error);
        process.exit(1);
    }); 
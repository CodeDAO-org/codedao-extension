const hre = require("hardhat");

async function main() {
  console.log("🚀 Deploying CodeDAO Token (1B Supply + Minting Revocation)");
  console.log("============================================================");

  // Get the contract factory
  const CodeDAOToken = await hre.ethers.getContractFactory("CodeDAOToken");
  
  // Deploy the contract
  console.log("📦 Deploying contract...");
  const token = await CodeDAOToken.deploy();
  
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  
  console.log("✅ CodeDAOToken deployed to:", tokenAddress);
  
  // Get deployment details
  const [deployer] = await hre.ethers.getSigners();
  const totalSupply = await token.totalSupply();
  const maxSupply = await token.MAX_SUPPLY();
  const deployerBalance = await token.balanceOf(deployer.address);
  
  console.log("\n📊 TOKEN DETAILS:");
  console.log("==================");
  console.log("• Contract Address:", tokenAddress);
  console.log("• Deployer:", deployer.address);
  console.log("• Total Supply:", hre.ethers.formatEther(totalSupply), "CODE");
  console.log("• Max Supply:", hre.ethers.formatEther(maxSupply), "CODE");
  console.log("• Deployer Balance:", hre.ethers.formatEther(deployerBalance), "CODE");
  console.log("• Network:", hre.network.name);
  console.log("• Chain ID:", hre.network.config.chainId);

  console.log("\n🎯 TOKENOMICS DISTRIBUTION PLAN:");
  console.log("=================================");
  const oneToken = hre.ethers.parseEther("1");
  const totalSupplyBigInt = BigInt(totalSupply);
  
  console.log("• 60% (600M) - Coding Rewards Pool:", hre.ethers.formatEther(totalSupplyBigInt * 60n / 100n), "CODE");
  console.log("• 15% (150M) - Team & Development:", hre.ethers.formatEther(totalSupplyBigInt * 15n / 100n), "CODE");
  console.log("• 10% (100M) - Community Treasury:", hre.ethers.formatEther(totalSupplyBigInt * 10n / 100n), "CODE");
  console.log("• 8% (80M) - Ecosystem Partnerships:", hre.ethers.formatEther(totalSupplyBigInt * 8n / 100n), "CODE");
  console.log("• 4% (40M) - Liquidity Provision:", hre.ethers.formatEther(totalSupplyBigInt * 4n / 100n), "CODE");
  console.log("• 3% (30M) - Marketing & Growth:", hre.ethers.formatEther(totalSupplyBigInt * 3n / 100n), "CODE");

  console.log("\n⚙️  NEXT STEPS:");
  console.log("================");
  console.log("1. 📝 Verify contract on BaseScan:");
  console.log(`   npx hardhat verify --network ${hre.network.name} ${tokenAddress}`);
  console.log("");
  console.log("2. 🔄 Transfer tokens according to distribution plan");
  console.log("3. 🚫 Revoke minting permanently when ready:");
  console.log("   token.revokeMintingPermanently()");
  console.log("");
  console.log("4. 🌐 Update frontend with new contract address");

  // If we're on a live network, provide verification command
  if (hre.network.name !== "localhost" && hre.network.name !== "hardhat") {
    console.log("\n🔍 AUTOMATIC VERIFICATION:");
    console.log("==========================");
    try {
      console.log("⏳ Waiting 30 seconds for contract deployment to propagate...");
      await new Promise(resolve => setTimeout(resolve, 30000));
      
      console.log("🔍 Verifying contract on BaseScan...");
      await hre.run("verify:verify", {
        address: tokenAddress,
        constructorArguments: [],
      });
      console.log("✅ Contract verified successfully!");
    } catch (error) {
      console.log("❌ Automatic verification failed:");
      console.log(error.message);
      console.log("\n💡 Manual verification command:");
      console.log(`npx hardhat verify --network ${hre.network.name} ${tokenAddress}`);
    }
  }

  console.log("\n🎉 Deployment Complete!");
  console.log("========================");
  return {
    token,
    address: tokenAddress
  };
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  }); 
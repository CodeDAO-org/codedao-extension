import { ethers } from "hardhat";

async function main() {
  console.log("🌐 Deploying CodeDAO Token to Base Sepolia...");
  console.log("🔑 Deployer address: 0x6143Bf86c4B1232A2A1791f496f774C6Ffb3f9BA");
  
  const CodeDAOToken = await ethers.getContractFactory("CodeDAOToken");
  const token = await CodeDAOToken.deploy("0x813343d30065eAe9D1Be6521203f5C0874818C28");
  await token.waitForDeployment();
  
  const address = await token.getAddress();
  console.log("✅ Contract deployed to:", address);
  console.log("🔗 BaseScan:", `https://sepolia.basescan.org/address/${address}`);
  
  // Run verification
  console.log("📜 Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: ["0x813343d30065eAe9D1Be6521203f5C0874818C28"]
    });
    console.log("✅ Contract verified on BaseScan");
  } catch (error) {
    console.log("⚠️  Verification error:", error.message);
  }
  
  // Save deployment info
  const deployment = {
    address,
    network: "baseSepolia",
    chainId: 84532,
    deployer: "0x6143Bf86c4B1232A2A1791f496f774C6Ffb3f9BA",
    mintTo: "0x813343d30065eAe9D1Be6521203f5C0874818C28",
    timestamp: new Date().toISOString(),
    txHash: token.deploymentTransaction()?.hash,
    basescanUrl: `https://sepolia.basescan.org/address/${address}`
  };
  
  require("fs").writeFileSync("deployment-sepolia.json", JSON.stringify(deployment, null, 2));
  console.log("💾 Deployment info saved to deployment-sepolia.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
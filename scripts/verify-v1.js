const { run } = require("hardhat");

async function main() {
    console.log("🔍 Verifying CodeDAO Token v1 on BaseScan");
    console.log("==========================================");
    
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    const contractPath = "contracts/v1/CodeDAOTokenV1.sol:CodeDAOToken";
    
    console.log(`Contract: ${contractAddress}`);
    console.log(`Source: ${contractPath}`);
    console.log(`Network: Base Mainnet (Chain ID: 8453)`);
    console.log("");
    
    try {
        console.log("🚀 Starting verification...");
        
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: [], // No constructor arguments
            contract: contractPath
        });
        
        console.log("✅ SUCCESS! Contract verified on BaseScan!");
        console.log(`🔗 View on BaseScan: https://basescan.org/address/${contractAddress}#code`);
        console.log("");
        console.log("📋 VERIFICATION COMPLETE:");
        console.log("- ✅ Source code published");
        console.log("- ✅ Compiler settings matched"); 
        console.log("- ✅ ABI available for dashboard integration");
        
    } catch (error) {
        console.error("❌ Verification failed:", error.message);
        
        if (error.message.includes("Already Verified")) {
            console.log("✅ Contract is already verified on BaseScan!");
            console.log(`🔗 View: https://basescan.org/address/${contractAddress}#code`);
        } else {
            console.log("\n🔧 TROUBLESHOOTING GUIDE:");
            console.log("1. Check compiler version matches deployment");
            console.log("2. Verify optimizer settings (likely enabled with 200 runs)");
            console.log("3. Ensure exact OpenZeppelin version used");
            console.log("4. Try with different solc versions: 0.8.19, 0.8.20, 0.8.21, 0.8.22, 0.8.24");
            
            console.log("\n📋 MANUAL VERIFICATION DETAILS:");
            console.log(`Contract Address: ${contractAddress}`);
            console.log("Contract Name: CodeDAOToken");
            console.log("Compiler: solc ^0.8.20");
            console.log("Optimization: Enabled");
            console.log("Runs: 200 (standard)");
            console.log("Constructor Arguments: None");
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    }); 
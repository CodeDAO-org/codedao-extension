const { run } = require("hardhat");

async function main() {
    console.log("🔍 Verifying Original CodeDAO Token on BaseScan");
    console.log("===============================================");
    
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: [], // No constructor arguments
            contract: "contracts/CodeDAOTokenOriginal.sol:CodeDAOToken"
        });
        
        console.log("✅ Contract verified successfully!");
        console.log(`🔗 BaseScan: https://basescan.org/address/${contractAddress}#code`);
        
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("✅ Contract already verified on BaseScan");
        } else {
            console.error("❌ Verification failed:", error.message);
            
            // Provide manual verification details
            console.log("\n📋 MANUAL VERIFICATION DETAILS:");
            console.log("Contract Address:", contractAddress);
            console.log("Compiler: solc 0.8.20");
            console.log("Optimization: Enabled (200 runs)");
            console.log("Constructor Arguments: None");
            console.log("Contract Name: CodeDAOToken");
        }
    }
}

main().catch(console.error); 
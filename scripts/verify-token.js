const hre = require("hardhat");

async function main() {
    const contractAddress = "0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C";
    
    console.log("🔍 Verifying CodeDAO Token contract...");
    console.log("📍 Contract Address:", contractAddress);
    console.log("🌐 Network:", hre.network.name);
    
    try {
        // Verify the contract (no constructor arguments needed)
        await hre.run("verify:verify", {
            address: contractAddress,
            constructorArguments: [], // Empty array - our constructor has no parameters
        });
        
        console.log("✅ Contract verification submitted successfully!");
        console.log(`🔗 Check verification status: https://basescan.org/address/${contractAddress}#code`);
        
    } catch (error) {
        if (error.message.toLowerCase().includes("already verified")) {
            console.log("✅ Contract is already verified!");
        } else {
            console.error("❌ Verification failed:", error.message);
            process.exit(1);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("❌ Script failed:", error);
        process.exit(1);
    }); 
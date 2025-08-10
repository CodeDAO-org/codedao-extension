const { ethers } = require("hardhat");

async function main() {
    const addr = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    console.log("🔍 VERIFYING ADDRESS ON BASE SEPOLIA");
    console.log("====================================");
    console.log(`Address: ${addr}`);
    console.log(`Network: ${hre.network.name}`);
    
    // Check 1: Does address have code?
    const code = await ethers.provider.getCode(addr);
    console.log(`\n📋 Code Check:`);
    console.log(`Length: ${code.length}`);
    console.log(`Has code: ${code !== '0x'}`);
    
    if (code === '0x') {
        console.log("❌ NO CODE AT ADDRESS - This confirms the issue!");
        console.log("🔧 SOLUTION: We need to find the actual deployed address or redeploy");
        return;
    }
    
    console.log("✅ Contract exists! Let's test the interface...");
    
    // Check 2: Can we attach and call basic functions?
    try {
        const Token = await ethers.getContractFactory("contracts/v2/CodeDAOTokenV2.sol:CodeDAOToken");
        const token = Token.attach(addr);
        
        console.log(`\n📋 Interface Check:`);
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        
        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        console.log(`Decimals: ${decimals}`);
        
        // Check 3: AccessControl support
        const supportsAccessControl = await token.supportsInterface("0x7965db0b");
        console.log(`Supports AccessControl: ${supportsAccessControl}`);
        
        if (supportsAccessControl) {
            const [deployer] = await ethers.getSigners();
            const DEFAULT_ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
            const hasAdminRole = await token.hasRole(DEFAULT_ADMIN_ROLE, deployer.address);
            
            console.log(`\n📋 Role Check:`);
            console.log(`Deployer has admin role: ${hasAdminRole}`);
        }
        
        console.log("\n✅ All checks passed! Contract is working correctly.");
        
    } catch (error) {
        console.log(`\n❌ Interface Error: ${error.message}`);
        console.log("🔧 This suggests ABI mismatch or wrong contract");
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
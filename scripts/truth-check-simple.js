const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    console.log("🔍 DEFINITIVE TRUTH CHECK");
    console.log("=========================");
    console.log(`Contract: ${contractAddress}\n`);
    
    const provider = ethers.provider;
    
    console.log("📋 TESTING CORE ERC20 FUNCTIONS");
    console.log("===============================");
    
    // Test 1: balanceOf
    try {
        console.log("1. Testing balanceOf(address)...");
        const balanceCall = await provider.call({
            to: contractAddress,
            data: "0x70a08231000000000000000000000000" + "e4e53f3c17fde8ef635c0921fa340fd1808c16e9" // balanceOf with owner address
        });
        console.log(`   ✅ balanceOf() SUCCESS: ${balanceCall}`);
        
        if (balanceCall && balanceCall !== "0x") {
            const balance = BigInt(balanceCall);
            const balanceFormatted = (Number(balance) / 1e18).toLocaleString();
            console.log(`   📊 Balance: ${balanceFormatted} tokens`);
        }
        
    } catch (error) {
        console.log(`   ❌ balanceOf() FAILED: ${error.reason || error.message}`);
    }
    
    // Test 2: transfer
    try {
        console.log("\n2. Testing transfer(address,uint256)...");
        const transferCall = await provider.call({
            to: contractAddress,
            data: "0xa9059cbb000000000000000000000000" + "e4e53f3c17fde8ef635c0921fa340fd1808c16e9" + "0000000000000000000000000000000000000000000000000000000000000001" // transfer 1 wei
        });
        console.log(`   ✅ transfer() function exists: ${transferCall}`);
        
    } catch (error) {
        console.log(`   ❌ transfer() FAILED: ${error.reason || error.message}`);
        if (error.message && error.message.includes("function selector not found")) {
            console.log("   🚨 CRITICAL: transfer() DOES NOT EXIST");
        }
    }
    
    // Test 3: allowance
    try {
        console.log("\n3. Testing allowance(address,address)...");
        const allowanceCall = await provider.call({
            to: contractAddress,
            data: "0xdd62ed3e000000000000000000000000" + "e4e53f3c17fde8ef635c0921fa340fd1808c16e9" + "000000000000000000000000" + "e4e53f3c17fde8ef635c0921fa340fd1808c16e9"
        });
        console.log(`   ✅ allowance() SUCCESS: ${allowanceCall}`);
        
    } catch (error) {
        console.log(`   ❌ allowance() FAILED: ${error.reason || error.message}`);
    }
    
    // Test 4: Working functions (we know these work)
    console.log("\n📋 TESTING KNOWN WORKING FUNCTIONS");
    console.log("==================================");
    
    try {
        const nameCall = await provider.call({
            to: contractAddress,
            data: "0x06fdde03" // name()
        });
        
        const symbolCall = await provider.call({
            to: contractAddress,
            data: "0x95d89b41" // symbol()
        });
        
        const totalSupplyCall = await provider.call({
            to: contractAddress,
            data: "0x18160ddd" // totalSupply()
        });
        
        console.log("✅ name(), symbol(), totalSupply() all work");
        
        if (totalSupplyCall && totalSupplyCall !== "0x") {
            const totalSupply = BigInt(totalSupplyCall);
            const totalFormatted = (Number(totalSupply) / 1e18).toLocaleString();
            console.log(`📊 Total Supply: ${totalFormatted} tokens`);
        }
        
    } catch (e) {
        console.log("❌ Basic functions failed");
    }
    
    // Test 5: Check contract size
    console.log("\n📋 CONTRACT SIZE ANALYSIS");
    console.log("=========================");
    
    const code = await provider.getCode(contractAddress);
    console.log(`Code length: ${code.length} characters`);
    
    // Final verdict
    console.log("\n🎯 VERDICT");
    console.log("==========");
    
    console.log("Based on the tests above:");
    console.log("- If balanceOf/transfer/allowance ALL work → Contract is standard ERC20");
    console.log("- If name/symbol/totalSupply work but balanceOf/transfer fail → NOT a usable token");
    console.log("- If contract size is very small (< 1000 chars) → Likely proxy or incomplete");
    
    console.log("\n🚨 DECISION TREE:");
    console.log("If NOT a usable token → DEPLOY V2 IMMEDIATELY");
    console.log("If it IS a usable token → Continue verification");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    console.log("🔍 10-MINUTE TRUTH CHECK");
    console.log("========================");
    console.log(`Contract: ${contractAddress}\n`);
    
    const provider = ethers.provider;
    
    // Test 1: Actual ERC20 function calls
    console.log("📋 TEST 1: ACTUAL ERC20 FUNCTION CALLS");
    console.log("======================================");
    
    try {
        // Test balanceOf
        console.log("Testing balanceOf(address)...");
        const balanceCall = await provider.call({
            to: contractAddress,
            data: "0x70a08231000000000000000000000000" + contractAddress.slice(2) // balanceOf(address) with contract address as parameter
        });
        console.log(`✅ balanceOf() works: ${balanceCall}`);
        
        const balanceValue = ethers.BigNumber.from(balanceCall);
        console.log(`   Balance: ${ethers.utils.formatEther(balanceValue)} tokens`);
        
    } catch (error) {
        console.log(`❌ balanceOf() FAILED: ${error.message}`);
        if (error.message.includes("function selector not found") || error.message.includes("execution reverted")) {
            console.log("   → CONTRACT DOES NOT IMPLEMENT balanceOf()");
        }
    }
    
    try {
        // Test transfer (this will revert but we want to see if function exists)
        console.log("\nTesting transfer(address,uint256)...");
        const transferCall = await provider.call({
            to: contractAddress,
            data: "0xa9059cbb000000000000000000000000" + contractAddress.slice(2) + "0000000000000000000000000000000000000000000000000000000000000001" // transfer(address,uint256) with 1 wei
        });
        console.log(`✅ transfer() function exists: ${transferCall}`);
        
    } catch (error) {
        console.log(`❌ transfer() FAILED: ${error.message}`);
        if (error.message.includes("function selector not found")) {
            console.log("   → CONTRACT DOES NOT IMPLEMENT transfer()");
        } else if (error.message.includes("ERC20: transfer amount exceeds balance")) {
            console.log("   → transfer() exists but insufficient balance (GOOD)");
        }
    }
    
    try {
        // Test allowance
        console.log("\nTesting allowance(address,address)...");
        const allowanceCall = await provider.call({
            to: contractAddress,
            data: "0xdd62ed3e000000000000000000000000" + contractAddress.slice(2) + "000000000000000000000000" + contractAddress.slice(2) // allowance(address,address)
        });
        console.log(`✅ allowance() works: ${allowanceCall}`);
        
    } catch (error) {
        console.log(`❌ allowance() FAILED: ${error.message}`);
        if (error.message.includes("function selector not found")) {
            console.log("   → CONTRACT DOES NOT IMPLEMENT allowance()");
        }
    }
    
    // Test 2: Check for EIP-1967 proxy pattern
    console.log("\n📋 TEST 2: EIP-1967 PROXY DETECTION");
    console.log("===================================");
    
    // EIP-1967 implementation slot
    const IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc";
    const implSlotValue = await provider.getStorageAt(contractAddress, IMPL_SLOT);
    console.log(`Implementation slot: ${implSlotValue}`);
    
    if (implSlotValue !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        const implAddress = "0x" + implSlotValue.slice(-40);
        console.log(`✅ PROXY DETECTED! Implementation: ${implAddress}`);
        
        // Check implementation code
        const implCode = await provider.getCode(implAddress);
        console.log(`Implementation code length: ${implCode.length} chars`);
        
        if (implCode.length > 2) {
            console.log("✅ Implementation has code - this is a proxy!");
            
            // Test ERC20 functions on implementation
            console.log("\nTesting ERC20 functions on implementation...");
            try {
                const implBalanceCall = await provider.call({
                    to: implAddress,
                    data: "0x70a08231000000000000000000000000" + contractAddress.slice(2)
                });
                console.log(`✅ Implementation balanceOf() works: ${implBalanceCall}`);
            } catch (e) {
                console.log(`❌ Implementation balanceOf() failed: ${e.message}`);
            }
        }
    } else {
        console.log("❌ No proxy detected (implementation slot is zero)");
    }
    
    // Check admin slot
    const ADMIN_SLOT = "0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103";
    const adminSlotValue = await provider.getStorageAt(contractAddress, ADMIN_SLOT);
    console.log(`Admin slot: ${adminSlotValue}`);
    
    if (adminSlotValue !== "0x0000000000000000000000000000000000000000000000000000000000000000") {
        const adminAddress = "0x" + adminSlotValue.slice(-40);
        console.log(`✅ Proxy admin detected: ${adminAddress}`);
    }
    
    // Test 3: Code length analysis
    console.log("\n📋 TEST 3: CODE LENGTH ANALYSIS");
    console.log("===============================");
    
    const code = await provider.getCode(contractAddress);
    console.log(`Code length: ${code.length} characters`);
    
    if (code.length < 1000) {
        console.log("⚠️  Very small code - likely minimal proxy or broken contract");
    } else if (code.length < 5000) {
        console.log("🔍 Small-medium code - could be simple token or proxy");
    } else {
        console.log("📦 Substantial code - likely full implementation");
    }
    
    // Final assessment
    console.log("\n🎯 FINAL ASSESSMENT");
    console.log("===================");
    
    // Re-test the basic functions we know work
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
        
        console.log("✅ Contract has name/symbol/totalSupply");
        console.log(`   Total Supply: ${ethers.BigNumber.from(totalSupplyCall).toString()}`);
        
    } catch (e) {
        console.log("❌ Even basic token functions don't work");
    }
    
    console.log("\n🚨 DECISION REQUIRED:");
    console.log("If balanceOf/transfer/allowance ALL FAILED + no proxy detected:");
    console.log("→ CONTRACT IS NOT A USABLE TOKEN");
    console.log("→ DEPLOY V2 TO MAINNET IMMEDIATELY");
    console.log("→ UPDATE DASHBOARD TO NEW ADDRESS");
    console.log("\nIf proxy detected:");
    console.log("→ VERIFY IMPLEMENTATION CONTRACT");
    console.log("→ THEN VERIFY PROXY ON BASESCAN");
    console.log("\nIf ERC20 functions work:");
    console.log("→ CONTINUE V1 VERIFICATION EFFORTS");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
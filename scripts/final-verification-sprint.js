const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    const ownerAddress = "0xe4e53f3c17fde8ef635c0921fa340fd1808c16e9";
    
    console.log("🎯 FINAL VERIFICATION SPRINT");
    console.log("============================");
    console.log(`Contract: ${contractAddress}`);
    console.log(`Owner: ${ownerAddress}\n`);
    
    const provider = ethers.provider;
    
    // Step 1: Ground-truth validation with proper balance check
    console.log("📋 STEP 1: GROUND-TRUTH VALIDATION");
    console.log("==================================");
    
    try {
        // Check owner balance
        const ownerBalanceCall = await provider.call({
            to: contractAddress,
            data: "0x70a08231000000000000000000000000" + ownerAddress.slice(2) // balanceOf(owner)
        });
        
        const ownerBalance = BigInt(ownerBalanceCall);
        const ownerBalanceFormatted = (Number(ownerBalance) / 1e18).toLocaleString();
        console.log(`✅ Owner balance: ${ownerBalanceFormatted} tokens`);
        
        if (ownerBalance > 0) {
            console.log("✅ Owner has tokens - contract is functional for balances");
        } else {
            console.log("⚠️ Owner has 0 tokens - unusual for initial holder");
        }
        
    } catch (error) {
        console.log(`❌ Owner balance check failed: ${error.message}`);
    }
    
    // Check total supply and compare
    try {
        const totalSupplyCall = await provider.call({
            to: contractAddress,
            data: "0x18160ddd" // totalSupply()
        });
        
        const totalSupply = BigInt(totalSupplyCall);
        const totalSupplyFormatted = (Number(totalSupply) / 1e18).toLocaleString();
        console.log(`📊 Total Supply: ${totalSupplyFormatted} tokens`);
        
        if (totalSupply === BigInt("100000000000000000000000000")) {
            console.log("✅ Total supply is exactly 100M - matches expectation");
        }
        
    } catch (error) {
        console.log(`❌ Total supply check failed: ${error.message}`);
    }
    
    // Step 2: Test transfer functionality with simulation
    console.log("\n📋 STEP 2: TRANSFER FUNCTIONALITY TEST");
    console.log("=====================================");
    
    try {
        // Simulate transfer from owner to itself (should work if transfer exists)
        const transferData = "0xa9059cbb" + // transfer(address,uint256)
                           "000000000000000000000000" + ownerAddress.slice(2) + // to address
                           "0000000000000000000000000000000000000000000000000000000000000001"; // 1 wei
        
        const transferResult = await provider.call({
            to: contractAddress,
            data: transferData,
            from: ownerAddress // Simulate call from owner
        });
        
        console.log(`✅ Transfer simulation successful: ${transferResult}`);
        console.log("✅ Contract supports transfers");
        
    } catch (error) {
        console.log(`❌ Transfer simulation failed: ${error.message}`);
        
        if (error.message.includes("function selector not found")) {
            console.log("🚨 CRITICAL: transfer() function does not exist");
        } else if (error.message.includes("ERC20")) {
            console.log("✅ Transfer function exists but has ERC20 logic (good sign)");
        } else {
            console.log("⚠️ Transfer may be paused or restricted");
        }
    }
    
    // Step 3: Complete ERC20 interface validation
    console.log("\n📋 STEP 3: COMPLETE ERC20 INTERFACE");
    console.log("===================================");
    
    const erc20Functions = [
        { name: "name()", selector: "0x06fdde03", hasParams: false },
        { name: "symbol()", selector: "0x95d89b41", hasParams: false },
        { name: "decimals()", selector: "0x313ce567", hasParams: false },
        { name: "totalSupply()", selector: "0x18160ddd", hasParams: false },
        { name: "balanceOf(address)", selector: "0x70a08231", hasParams: true },
        { name: "allowance(address,address)", selector: "0xdd62ed3e", hasParams: true },
        { name: "approve(address,uint256)", selector: "0x095ea7b3", hasParams: true },
        { name: "transfer(address,uint256)", selector: "0xa9059cbb", hasParams: true },
        { name: "transferFrom(address,address,uint256)", selector: "0x23b872dd", hasParams: true }
    ];
    
    let workingFunctions = 0;
    let totalFunctions = erc20Functions.length;
    
    for (const func of erc20Functions) {
        try {
            let callData = func.selector;
            
            if (func.hasParams) {
                // Add dummy parameters
                if (func.name.includes("balanceOf")) {
                    callData += "000000000000000000000000" + ownerAddress.slice(2);
                } else if (func.name.includes("allowance")) {
                    callData += "000000000000000000000000" + ownerAddress.slice(2) + "000000000000000000000000" + ownerAddress.slice(2);
                } else if (func.name.includes("approve")) {
                    callData += "000000000000000000000000" + ownerAddress.slice(2) + "0000000000000000000000000000000000000000000000000000000000000001";
                } else if (func.name.includes("transfer(")) {
                    callData += "000000000000000000000000" + ownerAddress.slice(2) + "0000000000000000000000000000000000000000000000000000000000000001";
                } else if (func.name.includes("transferFrom")) {
                    callData += "000000000000000000000000" + ownerAddress.slice(2) + "000000000000000000000000" + ownerAddress.slice(2) + "0000000000000000000000000000000000000000000000000000000000000001";
                }
            }
            
            const result = await provider.call({
                to: contractAddress,
                data: callData,
                from: ownerAddress
            });
            
            console.log(`✅ ${func.name}: works`);
            workingFunctions++;
            
        } catch (error) {
            console.log(`❌ ${func.name}: ${error.message.includes('selector') ? 'not found' : 'reverted'}`);
        }
    }
    
    const completeness = (workingFunctions / totalFunctions * 100).toFixed(1);
    console.log(`\n📊 ERC20 Interface Completeness: ${workingFunctions}/${totalFunctions} (${completeness}%)`);
    
    if (completeness >= 80) {
        console.log("✅ Contract is sufficiently ERC20-compatible");
    } else {
        console.log("❌ Contract is missing critical ERC20 functions");
    }
    
    // Step 4: Generate verification recommendation
    console.log("\n🎯 VERIFICATION STRATEGY");
    console.log("========================");
    
    if (workingFunctions >= 7) {
        console.log("✅ CONTRACT IS VIABLE - PROCEED WITH VERIFICATION");
        console.log("\n📋 Recommended next steps:");
        console.log("1. Extract exact compiler settings from CBOR metadata");
        console.log("2. Identify exact OpenZeppelin version used");
        console.log("3. Compile with Standard JSON using exact settings");
        console.log("4. Submit to BaseScan for verification");
        console.log("5. If BaseScan fails, try Sourcify");
    } else {
        console.log("❌ CONTRACT IS NOT VIABLE - RECOMMEND V2 DEPLOYMENT");
        console.log("\n📋 Fallback plan:");
        console.log("1. Deploy new verified V2 token immediately");
        console.log("2. Update all integrations to V2 address");
        console.log("3. Mark V1 as deprecated");
        console.log("4. Handle any V1 holders via airdrop");
    }
    
    console.log("\n⏰ Time remaining in 4-hour sprint - continue with chosen path");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
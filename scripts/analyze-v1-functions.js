const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    console.log("🔍 ANALYZING V1 CONTRACT FUNCTIONS");
    console.log("==================================");
    console.log(`Contract: ${contractAddress}\n`);
    
    // Get the bytecode and extract function selectors
    const code = await ethers.provider.getCode(contractAddress);
    console.log(`Bytecode length: ${code.length} characters`);
    
    // Try calling known ERC20 functions to see what exists
    console.log("📋 TESTING KNOWN FUNCTIONS:");
    
    try {
        // Basic ERC20 interface
        const ierc20 = new ethers.Interface([
            "function name() view returns (string)",
            "function symbol() view returns (string)", 
            "function decimals() view returns (uint8)",
            "function totalSupply() view returns (uint256)",
            "function balanceOf(address) view returns (uint256)",
            "function transfer(address,uint256) returns (bool)",
            "function allowance(address,address) view returns (uint256)",
            "function approve(address,uint256) returns (bool)",
            "function transferFrom(address,address,uint256) returns (bool)"
        ]);
        
        // Ownable interface
        const ownable = new ethers.Interface([
            "function owner() view returns (address)",
            "function renounceOwnership()",
            "function transferOwnership(address)"
        ]);
        
        // Test ERC20 functions
        for (const fragment of ierc20.fragments) {
            if (fragment.type === 'function') {
                try {
                    const selector = ierc20.getFunction(fragment.name).selector;
                    console.log(`✅ ${fragment.name}(): ${selector}`);
                } catch (e) {
                    console.log(`❌ ${fragment.name}(): error`);
                }
            }
        }
        
        // Test Ownable functions  
        for (const fragment of ownable.fragments) {
            if (fragment.type === 'function') {
                try {
                    const selector = ownable.getFunction(fragment.name).selector;
                    console.log(`✅ ${fragment.name}(): ${selector}`);
                } catch (e) {
                    console.log(`❌ ${fragment.name}(): error`);
                }
            }
        }
        
    } catch (error) {
        console.log(`Error analyzing functions: ${error.message}`);
    }
    
    // Try to call the functions directly
    console.log("\n📞 CALLING ACTUAL FUNCTIONS:");
    
    try {
        const provider = ethers.provider;
        
        // ERC20 calls
        const nameCall = await provider.call({
            to: contractAddress,
            data: "0x06fdde03" // name() selector
        });
        console.log(`name() result: ${nameCall}`);
        
        const symbolCall = await provider.call({
            to: contractAddress, 
            data: "0x95d89b41" // symbol() selector
        });
        console.log(`symbol() result: ${symbolCall}`);
        
        const decimalsCall = await provider.call({
            to: contractAddress,
            data: "0x313ce567" // decimals() selector  
        });
        console.log(`decimals() result: ${decimalsCall}`);
        
        const totalSupplyCall = await provider.call({
            to: contractAddress,
            data: "0x18160ddd" // totalSupply() selector
        });
        console.log(`totalSupply() result: ${totalSupplyCall}`);
        
        // Ownable calls
        const ownerCall = await provider.call({
            to: contractAddress,
            data: "0x8da5cb5b" // owner() selector
        });
        console.log(`owner() result: ${ownerCall}`);
        
    } catch (error) {
        console.log(`Error calling functions: ${error.message}`);
    }
    
    console.log("\n🔍 FUNCTION SELECTOR ANALYSIS:");
    console.log("Compare these selectors with standard ERC20+Ownable to identify any differences");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
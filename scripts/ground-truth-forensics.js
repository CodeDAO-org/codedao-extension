const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    console.log("🔍 GROUND TRUTH FORENSICS");
    console.log("=========================");
    console.log(`Contract: ${contractAddress}\n`);
    
    // Step 1: Extract function selectors from bytecode
    console.log("📋 STEP 1: FUNCTION SELECTORS (GROUND TRUTH)");
    console.log("============================================");
    
    const provider = ethers.provider;
    const code = await provider.getCode(contractAddress);
    
    // Common ERC20 + Ownable function selectors
    const knownSelectors = {
        "0x06fdde03": "name()",
        "0x95d89b41": "symbol()",
        "0x313ce567": "decimals()",
        "0x18160ddd": "totalSupply()",
        "0x70a08231": "balanceOf(address)",
        "0xa9059cbb": "transfer(address,uint256)",
        "0x8da5cb5b": "owner()",
        "0xf2fde38b": "transferOwnership(address)",
        "0x715018a6": "renounceOwnership()",
        "0xdd62ed3e": "allowance(address,address)",
        "0x095ea7b3": "approve(address,uint256)",
        "0x23b872dd": "transferFrom(address,address,uint256)"
    };
    
    // Test each selector against the contract
    console.log("Testing known ERC20/Ownable functions:");
    let detectedFunctions = [];
    
    for (const [selector, signature] of Object.entries(knownSelectors)) {
        try {
            // Try calling the function
            const result = await provider.call({
                to: contractAddress,
                data: selector
            });
            console.log(`✅ ${signature}: ${selector} (${result.slice(0, 20)}...)`);
            detectedFunctions.push({ selector, signature, works: true });
        } catch (error) {
            console.log(`❌ ${signature}: ${selector} (not found)`);
            detectedFunctions.push({ selector, signature, works: false });
        }
    }
    
    // Step 2: CBOR Metadata Analysis
    console.log("\n📦 STEP 2: CBOR METADATA DECODE");
    console.log("===============================");
    
    // Extract metadata from end of bytecode
    const metadataLengthHex = code.slice(-4);
    const metadataLength = parseInt(metadataLengthHex, 16);
    const metadataStart = code.length - 4 - metadataLength * 2;
    const rawMetadata = code.slice(metadataStart, -4);
    
    console.log(`📏 Metadata length: ${metadataLength} bytes`);
    console.log(`📦 Raw metadata hex: ${rawMetadata}`);
    
    // Look for solc version and other identifiers
    if (rawMetadata.includes("64736f6c63")) { // 'solc' in hex
        console.log("✅ Contains 'solc' identifier");
        
        // Try to extract version
        const solcIndex = rawMetadata.indexOf("64736f6c63");
        const versionHex = rawMetadata.slice(solcIndex + 12, solcIndex + 18); // Next 3 bytes after 'solc'
        
        try {
            const versionBytes = [];
            for (let i = 0; i < versionHex.length; i += 2) {
                versionBytes.push(parseInt(versionHex.substr(i, 2), 16));
            }
            console.log(`📋 Solc version bytes: ${versionBytes.join('.')}`);
            
            // Convert to version string
            if (versionBytes.length >= 3) {
                const version = `0.${versionBytes[0]}.${versionBytes[1]}`;
                console.log(`🎯 Detected Solc version: ${version}`);
            }
        } catch (e) {
            console.log("❌ Could not parse version bytes");
        }
    }
    
    // Step 3: Look for OpenZeppelin patterns
    console.log("\n🔍 STEP 3: OPENZEPPELIN DETECTION");
    console.log("==================================");
    
    // Common OZ bytecode patterns (this is heuristic)
    const ozPatterns = {
        "ERC20": "5f5f3e905f3e90565b",  // Common ERC20 pattern
        "Ownable": "5f6001905f3e90565b", // Common Ownable pattern
    };
    
    for (const [name, pattern] of Object.entries(ozPatterns)) {
        if (code.includes(pattern)) {
            console.log(`✅ Detected ${name} pattern: ${pattern}`);
        } else {
            console.log(`❌ No ${name} pattern found`);
        }
    }
    
    // Step 4: Bytecode size analysis
    console.log("\n📏 STEP 4: BYTECODE SIZE ANALYSIS");
    console.log("==================================");
    
    console.log(`📦 Total bytecode: ${code.length} chars`);
    console.log(`📦 Without metadata: ${code.length - metadataLength * 2 - 4} chars`);
    
    // Size hints for optimization
    if (code.length < 6000) {
        console.log("🎯 Size suggests: HIGH optimization (runs 10000+)");
    } else if (code.length < 8000) {
        console.log("🎯 Size suggests: MEDIUM optimization (runs 1000-10000)");
    } else if (code.length < 12000) {
        console.log("🎯 Size suggests: LOW optimization (runs 200-1000)");
    } else {
        console.log("🎯 Size suggests: NO optimization");
    }
    
    // Step 5: Summary for verification
    console.log("\n🎯 VERIFICATION RECONSTRUCTION GUIDE");
    console.log("====================================");
    
    const workingFunctions = detectedFunctions.filter(f => f.works);
    const missingFunctions = detectedFunctions.filter(f => !f.works);
    
    console.log("✅ Contract has these functions:");
    workingFunctions.forEach(f => console.log(`  - ${f.signature}`));
    
    if (missingFunctions.length > 0) {
        console.log("\n❌ Contract missing these standard functions:");
        missingFunctions.forEach(f => console.log(`  - ${f.signature}`));
    }
    
    // Determine contract type
    const hasERC20Core = workingFunctions.some(f => f.signature.includes("transfer("));
    const hasOwnable = workingFunctions.some(f => f.signature.includes("owner()"));
    
    if (hasERC20Core && hasOwnable) {
        console.log("\n🎯 CONTRACT TYPE: Standard ERC20 + Ownable");
        console.log("📋 Recommended source structure:");
        console.log("   - import ERC20 from @openzeppelin/contracts");
        console.log("   - import Ownable from @openzeppelin/contracts");
        console.log("   - constructor mints 100M tokens to msg.sender");
    } else {
        console.log("\n⚠️  CONTRACT TYPE: Non-standard or custom implementation");
    }
    
    console.log("\n🔬 NEXT STEPS:");
    console.log("1. Use exact solc version detected above");
    console.log("2. Try OpenZeppelin versions from deployment timeframe");
    console.log("3. Use optimization level suggested by bytecode size");
    console.log("4. Compare runtime bytecode excluding metadata");
    console.log("5. If close match, adjust metadata.bytecodeHash setting");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
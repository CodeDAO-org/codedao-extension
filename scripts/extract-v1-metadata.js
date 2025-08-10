const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    console.log("🔍 EXTRACTING V1 BYTECODE METADATA");
    console.log("==================================");
    console.log(`Contract: ${contractAddress}`);
    console.log(`Network: ${hre.network.name}\n`);
    
    // Get runtime bytecode
    const code = await ethers.provider.getCode(contractAddress);
    console.log(`Bytecode length: ${code.length} characters`);
    
    if (code === "0x") {
        console.log("❌ No bytecode found!");
        return;
    }
    
    // Extract CBOR metadata from the end of bytecode
    // Solidity embeds metadata as CBOR at the end: ...{metadata}0x{length}0x{cbor_tag}
    const bytecode = code.slice(2); // remove 0x
    
    // Look for CBOR metadata at the end
    // Format: ...metadata + length(2 bytes) + 0xa264 (CBOR tag for "solc")
    const cborTag = "a264"; // CBOR encoding for "solc"
    const cborIndex = bytecode.lastIndexOf(cborTag);
    
    if (cborIndex === -1) {
        console.log("❌ No CBOR metadata found in bytecode");
        return;
    }
    
    console.log(`📋 CBOR metadata found at position: ${cborIndex}`);
    
    // Extract metadata length (2 bytes before CBOR tag)
    const lengthStart = cborIndex - 4; // 2 bytes = 4 hex chars
    const lengthHex = bytecode.slice(lengthStart, cborIndex);
    const metadataLength = parseInt(lengthHex, 16) * 2; // convert to hex chars
    
    console.log(`📏 Metadata length: ${metadataLength} hex characters`);
    
    // Extract full metadata
    const metadataStart = bytecode.length - metadataLength - 4; // -4 for length bytes
    const metadata = bytecode.slice(metadataStart, bytecode.length - 4);
    
    console.log(`📦 Raw metadata: 0x${metadata}`);
    
    // Try to decode CBOR (basic parsing)
    try {
        // For now, let's extract what we can manually
        // Look for common patterns in the metadata
        
        console.log("\n🔍 ANALYZING METADATA PATTERNS:");
        
        // Look for solc version pattern
        if (metadata.includes("736f6c63")) { // "solc" in hex
            console.log("✅ Contains 'solc' identifier");
        }
        
        // Look for version patterns (0.8.x format)
        const versionPattern = /30\.[0-9]\.[0-9]+/g;
        const versionMatches = metadata.match(versionPattern);
        if (versionMatches) {
            console.log(`📝 Possible version patterns found: ${versionMatches}`);
        }
        
        // Look for optimizer settings
        if (metadata.includes("6f7074696d697a6572")) { // "optimizer" in hex
            console.log("✅ Contains 'optimizer' identifier");
        }
        
        console.log("\n🔧 MANUAL ANALYSIS REQUIRED:");
        console.log("Use online CBOR decoder with the metadata hex to extract:");
        console.log("- Exact solc version (e.g., '0.8.20')"); 
        console.log("- Optimizer enabled (true/false)");
        console.log("- Optimizer runs (e.g., 200)");
        console.log("- EVM version (if set)");
        
        console.log("\n🌐 CBOR Decoder: https://cbor.me/");
        console.log(`📋 Metadata to decode: ${metadata}`);
        
    } catch (error) {
        console.log(`❌ Error analyzing metadata: ${error.message}`);
    }
    
    // Also check if we can determine constructor args
    console.log("\n📋 CONSTRUCTOR ANALYSIS:");
    console.log("V1 appears to be ERC20 + Ownable with 100M supply");
    console.log("Likely constructor: constructor() { _mint(msg.sender, 100000000 * 10**18); }");
    console.log("Constructor args: (none - mints to deployer)");
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
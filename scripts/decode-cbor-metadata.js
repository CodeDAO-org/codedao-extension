const { ethers } = require("hardhat");

async function main() {
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    console.log("🔍 ENHANCED CBOR METADATA EXTRACTION");
    console.log("====================================");
    console.log(`Contract: ${contractAddress}\n`);
    
    // Get runtime bytecode
    const code = await ethers.provider.getCode(contractAddress);
    console.log(`Bytecode length: ${code.length} characters`);
    
    if (code === "0x") {
        console.log("❌ No bytecode found!");
        return;
    }
    
    const bytecode = code.slice(2); // remove 0x prefix
    
    // Extract metadata from end of bytecode
    // Format: {metadata}{length:2bytes}{0xa2}{0x64}{ipfs/swarm}
    
    // Look for the CBOR metadata length at the end
    // Last 4 chars should be the CBOR identifier
    const last4 = bytecode.slice(-4);
    console.log(`Last 4 bytes: 0x${last4}`);
    
    // Look for length prefix (2 bytes before the identifier)
    const lengthHex = bytecode.slice(-8, -4); 
    const metadataLength = parseInt(lengthHex, 16) * 2; // convert to hex chars
    console.log(`Metadata length: ${metadataLength} hex characters`);
    
    // Extract the metadata
    const metadataStart = bytecode.length - metadataLength - 4;
    const metadata = bytecode.slice(metadataStart, bytecode.length - 4);
    
    console.log(`\n📦 Raw CBOR metadata: 0x${metadata}`);
    
    // Try to decode specific parts manually
    console.log("\n🔍 MANUAL CBOR ANALYSIS:");
    
    // Look for solc version (we know it's 0.8.20)
    if (metadata.includes("64736f6c63")) {
        console.log("✅ Found 'solc' identifier");
        
        // Extract version bytes after solc
        const solcIndex = metadata.indexOf("64736f6c63");
        const versionStart = solcIndex + 10; // Skip "solc" + next byte
        const versionBytes = metadata.slice(versionStart, versionStart + 6);
        console.log(`Version bytes: ${versionBytes}`);
        
        // Parse version (format: 0x0008014 = 0.8.20)
        if (versionBytes.startsWith("0008")) {
            const major = parseInt(versionBytes.slice(2, 4), 16);
            const minor = parseInt(versionBytes.slice(4, 6), 16);
            console.log(`✅ Solc version: 0.8.${minor}`);
        }
    }
    
    // Look for optimizer settings
    console.log("\n🔧 LOOKING FOR OPTIMIZER SETTINGS:");
    
    // CBOR keys to look for:
    // "optimizer" = 6f7074696d697a6572
    if (metadata.includes("6f7074696d697a6572")) {
        console.log("✅ Found 'optimizer' key in metadata");
        
        // Try to extract the value after optimizer key
        const optimizerIndex = metadata.indexOf("6f7074696d697a6572");
        const afterOptimizer = metadata.slice(optimizerIndex + 16, optimizerIndex + 50);
        console.log(`Data after optimizer key: ${afterOptimizer}`);
        
        // Look for boolean values (f4=false, f5=true in CBOR)
        if (afterOptimizer.includes("f4")) {
            console.log("🔧 Optimizer: DISABLED (f4 = false)");
        } else if (afterOptimizer.includes("f5")) {
            console.log("🔧 Optimizer: ENABLED (f5 = true)");
        }
    }
    
    // Look for "runs" setting
    if (metadata.includes("72756e73")) { // "runs" in hex
        console.log("✅ Found 'runs' key in metadata");
        const runsIndex = metadata.indexOf("72756e73");
        const runsData = metadata.slice(runsIndex + 8, runsIndex + 16);
        console.log(`Runs data: ${runsData}`);
        
        // Try to parse as number
        const runsValue = parseInt(runsData, 16);
        if (runsValue > 0 && runsValue < 10000) {
            console.log(`🔧 Optimizer runs: ${runsValue}`);
        }
    }
    
    // Look for OpenZeppelin version info
    console.log("\n📚 LOOKING FOR OPENZEPPELIN INFO:");
    
    // Sometimes metadata contains source URLs or IPFS hashes
    // Look for common patterns: "ipfs://" = 697066733a2f2f
    if (metadata.includes("697066733a2f2f")) {
        console.log("✅ Found IPFS reference - may contain OZ version info");
    }
    
    // Look for github URLs: "github.com" = 6769746875622e636f6d
    if (metadata.includes("6769746875622e636f6d")) {
        console.log("✅ Found GitHub reference");
    }
    
    console.log("\n💡 RECOMMENDED NEXT STEPS:");
    console.log("1. Try compiling with optimizer DISABLED (bytecode suggests no optimization)");
    console.log("2. Test OpenZeppelin versions: 4.8.0, 4.8.1, 4.8.2, 4.8.3, 4.9.0");
    console.log("3. Use exact solc 0.8.20");
    console.log("4. Try EVM target: 'london' (default for 0.8.20 era)");
    
    console.log("\n🌐 For full CBOR decode, use: https://cbor.me/");
    console.log(`📋 Metadata: ${metadata}`);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
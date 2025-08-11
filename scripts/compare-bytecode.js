const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    console.log("🔍 BYTECODE COMPARISON ANALYSIS");
    console.log("===============================");
    
    // Get deployed bytecode
    const deployedBytecode = await ethers.provider.getCode(contractAddress);
    console.log(`📏 Deployed bytecode length: ${deployedBytecode.length} chars`);
    
    // Try to find any CodeDAOToken artifact - prioritize Enhanced version
    const possiblePaths = [
        "./artifacts/contracts/v1/CodeDAOTokenV1Enhanced.sol/CodeDAOToken.json",
        "./artifacts/contracts/v1/CodeDAOTokenV1OZ46.sol/CodeDAOToken.json",
        "./artifacts/contracts/v1/CodeDAOTokenV1OZ5.sol/CodeDAOToken.json",
        "./artifacts/contracts/v1/CodeDAOTokenV1Minimal.sol/CodeDAOToken.json",
        "./artifacts/contracts/v1/CodeDAOTokenV1Simple.sol/CodeDAOToken.json"
    ];
    
    let artifactPath = null;
    for (const path of possiblePaths) {
        if (fs.existsSync(path)) {
            artifactPath = path;
            console.log(`📦 Found artifact: ${path}`);
            break;
        }
    }
    
    if (artifactPath) {
        const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
        const compiledBytecode = artifact.bytecode;
        const compiledDeployedBytecode = artifact.deployedBytecode;
        
        console.log(`📏 Our compiled bytecode length: ${compiledBytecode.length} chars`);
        console.log(`📏 Our compiled deployed bytecode length: ${compiledDeployedBytecode.length} chars`);
        
        // Compare deployed bytecode (runtime) - this is what matters for verification
        const deployedRuntime = deployedBytecode;
        const ourRuntime = compiledDeployedBytecode;
        
        console.log("\n🔍 RUNTIME BYTECODE COMPARISON:");
        
        // Check if lengths are closer now
        const lengthDiff = Math.abs(deployedRuntime.length - ourRuntime.length);
        console.log(`📏 Length difference: ${lengthDiff} chars`);
        
        if (lengthDiff < 100) {
            console.log("✅ LENGTHS ARE VERY CLOSE! This looks promising.");
        } else if (lengthDiff < 500) {
            console.log("⚠️ Lengths are closer but still different");
        } else if (lengthDiff < 1000) {
            console.log("🔍 Getting closer - length difference under 1000");
        } else {
            console.log("❌ Lengths still very different");
        }
        
        // Remove metadata hash for comparison (last ~100 chars usually)
        const deployedWithoutMetadata = deployedRuntime.slice(0, -200); // Remove last 200 chars
        const oursWithoutMetadata = ourRuntime.slice(0, -200);
        
        console.log(`📏 Deployed (no metadata): ${deployedWithoutMetadata.length} chars`);
        console.log(`📏 Ours (no metadata): ${oursWithoutMetadata.length} chars`);
        
        if (deployedWithoutMetadata === oursWithoutMetadata) {
            console.log("✅ BYTECODE MATCHES (excluding metadata)!");
            console.log("🎉 WE FOUND THE RIGHT COMBINATION!");
            
            // Try verification immediately
            console.log("\n🚀 ATTEMPTING VERIFICATION...");
            const contractName = artifactPath.includes("Enhanced") ? 
                "contracts/v1/CodeDAOTokenV1Enhanced.sol:CodeDAOToken" :
                "contracts/v1/CodeDAOTokenV1OZ46.sol:CodeDAOToken";
            
            try {
                const { execSync } = require("child_process");
                execSync(`npx hardhat verify --network base ${contractAddress} --contract "${contractName}"`, { stdio: 'inherit' });
                console.log("✅ VERIFICATION SUCCESSFUL!");
            } catch (verifyError) {
                console.log("❌ Verification failed - may need metadata adjustment");
            }
            
        } else {
            console.log("❌ BYTECODE STILL DIFFERENT (excluding metadata)");
            
            // Show percentage match for runtime
            const minLen = Math.min(deployedWithoutMetadata.length, oursWithoutMetadata.length);
            let matches = 0;
            for (let i = 0; i < minLen; i++) {
                if (deployedWithoutMetadata[i] === oursWithoutMetadata[i]) {
                    matches++;
                } else {
                    break;
                }
            }
            
            const matchPercent = (matches / minLen * 100).toFixed(1);
            console.log(`📊 Runtime bytecode match: ${matchPercent}% (${matches}/${minLen} chars)`);
            
            if (matches < 100) {
                console.log("❌ Fundamental structural difference - different contract altogether");
            } else {
                console.log("🔍 Significant match - minor compiler/version differences");
            }
        }
        
    } else {
        console.log("❌ No compiled artifacts found. Available artifacts:");
        // List all artifacts
        const artifactsDir = "./artifacts/contracts/v1/";
        if (fs.existsSync(artifactsDir)) {
            const files = fs.readdirSync(artifactsDir);
            files.forEach(file => console.log(`  - ${file}`));
        }
    }
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
}); 
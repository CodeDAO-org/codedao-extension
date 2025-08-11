const { execSync } = require("child_process");
const fs = require("fs");

async function main() {
    const contractAddress = "0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0";
    
    console.log("🎯 AUTOMATED VERIFICATION MATRIX");
    console.log("================================");
    console.log("Testing combinations systematically...\n");
    
    // Get deployed bytecode once
    const { ethers } = require("hardhat");
    const deployedBytecode = await ethers.provider.getCode(contractAddress);
    const deployedLength = deployedBytecode.length;
    const deployedWithoutMetadata = deployedBytecode.slice(0, -200);
    
    console.log(`📏 Target: ${deployedLength} chars (${deployedWithoutMetadata.length} without metadata)`);
    
    // Test matrix
    const testCases = [
        // OZ 4.7.3 + different optimizer runs
        { oz: "4.7.3", runs: 200, evm: "paris" },
        { oz: "4.7.3", runs: 1000, evm: "paris" },
        { oz: "4.7.3", runs: 10000, evm: "paris" },
        { oz: "4.7.3", runs: 200, evm: "shanghai" },
        { oz: "4.7.3", runs: 1000, evm: "shanghai" },
        
        // OZ 4.8.0 tests
        { oz: "4.8.0", runs: 200, evm: "paris" },
        { oz: "4.8.0", runs: 1000, evm: "paris" },
        { oz: "4.8.0", runs: 200, evm: "shanghai" },
    ];
    
    let bestMatch = { diff: Infinity, settings: null };
    
    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];
        console.log(`\n🔍 Test ${i+1}/${testCases.length}: OZ ${test.oz}, ${test.runs} runs, ${test.evm} EVM`);
        
        try {
            // Update hardhat config
            const configContent = `
require("@nomicfoundation/hardhat-toolbox");
require("@nomicfoundation/hardhat-verify");
require("dotenv").config();

module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: ${test.runs}
      },
      evmVersion: "${test.evm}",
      viaIR: false
    }
  },
  sourcify: { enabled: true },
  networks: {
    base: {
      url: process.env.BASE_MAINNET_RPC || "https://mainnet.base.org",
      chainId: 8453,
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      gasPrice: 1000000000,
    }
  },
  etherscan: {
    apiKey: { base: process.env.BASESCAN_API_KEY },
  }
};`;
            
            fs.writeFileSync("hardhat.config.js", configContent);
            
            // Install OZ version
            console.log(`  📦 Installing OZ ${test.oz}...`);
            execSync(`npm install @openzeppelin/contracts@${test.oz}`, { stdio: 'pipe' });
            
            // Compile
            console.log(`  🔨 Compiling...`);
            execSync("npx hardhat compile --force", { stdio: 'pipe' });
            
            // Check bytecode
            const artifactPath = "./artifacts/contracts/v1/CodeDAOTokenV1OZ46.sol/CodeDAOToken.json";
            if (fs.existsSync(artifactPath)) {
                const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
                const ourBytecode = artifact.deployedBytecode;
                const ourLength = ourBytecode.length;
                const ourWithoutMetadata = ourBytecode.slice(0, -200);
                
                const lengthDiff = Math.abs(deployedLength - ourLength);
                const runtimeMatch = deployedWithoutMetadata === ourWithoutMetadata;
                
                console.log(`  📏 Length: ${ourLength} (diff: ${lengthDiff})`);
                
                if (runtimeMatch) {
                    console.log(`  ✅ RUNTIME BYTECODE MATCHES! (excluding metadata)`);
                    console.log(`  🎉 FOUND THE COMBINATION: OZ ${test.oz}, ${test.runs} runs, ${test.evm} EVM`);
                    
                    // Try immediate verification
                    console.log(`  🚀 Attempting verification...`);
                    try {
                        execSync(`npx hardhat verify --network base ${contractAddress} --contract "contracts/v1/CodeDAOTokenV1OZ46.sol:CodeDAOToken"`, { stdio: 'inherit' });
                        console.log(`  ✅ VERIFICATION SUCCESSFUL!`);
                        return;
                    } catch (verifyError) {
                        console.log(`  ❌ Verification failed, but runtime matches - metadata issue`);
                    }
                } else {
                    console.log(`  ❌ Runtime differs`);
                }
                
                if (lengthDiff < bestMatch.diff) {
                    bestMatch = { diff: lengthDiff, settings: test, length: ourLength };
                }
            }
            
        } catch (error) {
            console.log(`  ❌ Error: ${error.message.slice(0, 100)}...`);
        }
    }
    
    console.log(`\n📊 BEST MATCH: ${bestMatch.settings?.oz || 'none'} (diff: ${bestMatch.diff} chars)`);
    if (bestMatch.settings) {
        console.log(`🎯 Closest settings: OZ ${bestMatch.settings.oz}, ${bestMatch.settings.runs} runs, ${bestMatch.settings.evm} EVM`);
    }
}

main().catch(console.error); 
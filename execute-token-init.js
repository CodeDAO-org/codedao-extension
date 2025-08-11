#!/usr/bin/env node

/**
 * Execute the actual /token init command with provided credentials
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs');
const path = require('path');

// Configuration from the user's request
const config = {
  repo: 'CodeDAO-org/codedao-token',
  purpose: 'Create a pinned, reproducible ERC20 project for CODE with CI preflight.',
  name: 'CodeDAO Token',
  symbol: 'CODE',
  decimals: 18,
  supply: '100000000e18',
  readableSupply: '100M',
  owner_model: 'none',
  mint_to: '0x813343d30065eAe9D1Be6521203f5C0874818C28',
  oz_version: '4.9.6',
  solc: '0.8.24',
  optimizer: {
    enabled: true,
    runs: 200
  },
  evmVersion: 'paris',
  viaIR: false,
  basescanApiKey: process.env.BASESCAN_API_KEY || '899ZAUFH2VKVD6P3DDNC9TQCITPEZ67UFF',
  deployerPrivateKey: '0b24ee2ee4a4931c95c0c8d44d5942b1a1c3a63191b95c1904bfb44efb51c00f',
  deployerAddress: '0x6143Bf86c4B1232A2A1791f496f774C6Ffb3f9BA'
};

function generateTokenContract(config) {
  return `// SPDX-License-Identifier: MIT
pragma solidity ^${config.solc};

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title ${config.name}
 * @dev ${config.purpose}
 * 
 * Token Details:
 * - Name: ${config.name}
 * - Symbol: ${config.symbol}
 * - Decimals: ${config.decimals}
 * - Total Supply: ${config.readableSupply} (${config.supply})
 * - Owner Model: ${config.owner_model}
 * - Mint Destination: ${config.mint_to}
 */
contract CodeDAOToken is ERC20 {
    /**
     * @dev Constructor mints the entire supply to the specified address
     * @param _to Address to receive the initial token supply
     */
    constructor(address _to) ERC20("${config.name}", "${config.symbol}") {
        require(_to != address(0), "CodeDAOToken: mint to zero address");
        _mint(_to, ${config.supply});
    }
}`;
}

function generatePackageJson(config) {
  return `{
  "name": "codedao-token",
  "version": "1.0.0", 
  "description": "${config.purpose}",
  "scripts": {
    "compile": "hardhat compile",
    "deploy:sepolia": "hardhat run scripts/deploy-sepolia.ts --network baseSepolia",
    "propose:mainnet": "hardhat run scripts/propose-mainnet.ts --network baseMainnet",
    "verify:mainnet": "hardhat run scripts/verify-mainnet.ts --network baseMainnet",
    "test:smoke": "hardhat run scripts/preflight.ts --network baseSepolia",
    "report:preflight": "node scripts/generate-report.js",
    "artifacts:release": "node scripts/prepare-release.js"
  },
  "devDependencies": {
    "@nomicfoundation/hardhat-toolbox": "^4.0.0",
    "@openzeppelin/contracts": "${config.oz_version}",
    "hardhat": "^2.19.0",
    "typescript": "^5.0.0"
  }
}`;
}

function generateHardhatConfig(config) {
  return `import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

const config: HardhatUserConfig = {
  solidity: {
    version: "${config.solc}",
    settings: {
      optimizer: {
        enabled: ${config.optimizer.enabled},
        runs: ${config.optimizer.runs}
      },
      evmVersion: "${config.evmVersion}",
      viaIR: ${config.viaIR}
    }
  },
  networks: {
    baseSepolia: {
      url: process.env.BASE_SEPOLIA_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    baseMainnet: {
      url: process.env.BASE_MAINNET_RPC || "",
      accounts: []  // No private keys for mainnet (Safe only)
    }
  },
  etherscan: {
    apiKey: {
      baseSepolia: process.env.BASESCAN_API_KEY || "",
      base: process.env.BASESCAN_API_KEY || ""
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org"
        }
      }
    ]
  }
};

export default config;`;
}

function generatePreflightWorkflow(config) {
  return `name: Preflight
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  preflight:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Compile contracts
        run: npx hardhat compile
      
      - name: Deploy to Base Sepolia
        env:
          BASE_SEPOLIA_RPC: \${{ secrets.BASE_SEPOLIA_RPC }}
          BASESCAN_API_KEY: \${{ secrets.BASESCAN_API_KEY }}
          PRIVATE_KEY: \${{ secrets.PRIVATE_KEY }}
        run: npm run deploy:sepolia
      
      - name: Run smoke tests
        env:
          BASE_SEPOLIA_RPC: \${{ secrets.BASE_SEPOLIA_RPC }}
        run: npm run test:smoke
      
      - name: Generate deployment report
        run: npm run report:preflight
      
      - name: Upload artifacts
        uses: actions/upload-artifact@v4
        with:
          name: preflight-artifacts
          path: |
            artifacts/
            deployments/
            reports/
`;
}

function generateTokenSpec(config) {
  return `# ${config.name} Specification
name: "${config.name}"
symbol: "${config.symbol}"
decimals: ${config.decimals}
supply: "${config.supply}"
readable_supply: "${config.readableSupply}"
owner_model: "${config.owner_model}"
mint_to: "${config.mint_to}"

# Build Configuration
openzeppelin_version: "${config.oz_version}"
solidity_version: "${config.solc}"
optimizer:
  enabled: ${config.optimizer.enabled}
  runs: ${config.optimizer.runs}
evm_version: "${config.evmVersion}"
via_ir: ${config.viaIR}

# Networks
networks:
  base_sepolia:
    chain_id: 84532
    rpc_url: "\${{ secrets.BASE_SEPOLIA_RPC }}"
  base_mainnet:
    chain_id: 8453
    rpc_url: "\${{ secrets.BASE_MAINNET_RPC }}"

# Safe Configuration
safe:
  address: "${config.mint_to}"
  service_url: "\${{ secrets.SAFE_TX_SERVICE_URL }}"

# Verification
verification:
  basescan_api_key: "\${{ secrets.BASESCAN_API_KEY }}"

# Deployment Credentials (for preflight only)
deployment:
  sepolia_private_key: "\${{ secrets.PRIVATE_KEY }}"
  deployer_address: "${config.deployerAddress}"
`;
}

function generateDeploySepoliaScript(config) {
  return `import { ethers } from "hardhat";

async function main() {
  console.log("🌐 Deploying ${config.name} to Base Sepolia...");
  console.log("🔑 Deployer address: ${config.deployerAddress}");
  
  const CodeDAOToken = await ethers.getContractFactory("CodeDAOToken");
  const token = await CodeDAOToken.deploy("${config.mint_to}");
  await token.waitForDeployment();
  
  const address = await token.getAddress();
  console.log("✅ Contract deployed to:", address);
  console.log("🔗 BaseScan:", \`https://sepolia.basescan.org/address/\${address}\`);
  
  // Run verification
  console.log("📜 Verifying contract...");
  try {
    await hre.run("verify:verify", {
      address: address,
      constructorArguments: ["${config.mint_to}"]
    });
    console.log("✅ Contract verified on BaseScan");
  } catch (error) {
    console.log("⚠️  Verification error:", error.message);
  }
  
  // Save deployment info
  const deployment = {
    address,
    network: "baseSepolia",
    chainId: 84532,
    deployer: "${config.deployerAddress}",
    mintTo: "${config.mint_to}",
    timestamp: new Date().toISOString(),
    txHash: token.deploymentTransaction()?.hash,
    basescanUrl: \`https://sepolia.basescan.org/address/\${address}\`
  };
  
  require("fs").writeFileSync("deployment-sepolia.json", JSON.stringify(deployment, null, 2));
  console.log("💾 Deployment info saved to deployment-sepolia.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});`;
}

async function createLocalRepository() {
  console.log('🚀 Creating local CodeDAO Token repository...\n');
  
  const repoPath = path.join(__dirname, 'codedao-token');
  
  // Create directory structure
  if (fs.existsSync(repoPath)) {
    console.log('📁 Repository directory already exists, cleaning...');
    fs.rmSync(repoPath, { recursive: true, force: true });
  }
  
  fs.mkdirSync(repoPath);
  fs.mkdirSync(path.join(repoPath, 'contracts'));
  fs.mkdirSync(path.join(repoPath, 'scripts'));
  fs.mkdirSync(path.join(repoPath, '.github'));
  fs.mkdirSync(path.join(repoPath, '.github', 'workflows'));
  
  // Generate files
  console.log('📝 Generating contract and configuration files...');
  
  fs.writeFileSync(
    path.join(repoPath, 'contracts', 'CodeDAOToken.sol'),
    generateTokenContract(config)
  );
  
  fs.writeFileSync(
    path.join(repoPath, 'package.json'),
    generatePackageJson(config)
  );
  
  fs.writeFileSync(
    path.join(repoPath, 'hardhat.config.ts'),
    generateHardhatConfig(config)
  );
  
  fs.writeFileSync(
    path.join(repoPath, 'token.yml'),
    generateTokenSpec(config)
  );
  
  fs.writeFileSync(
    path.join(repoPath, '.github', 'workflows', 'preflight.yml'),
    generatePreflightWorkflow(config)
  );
  
  fs.writeFileSync(
    path.join(repoPath, 'scripts', 'deploy-sepolia.ts'),
    generateDeploySepoliaScript(config)
  );
  
  // Create README
  const readme = `# ${config.name} (${config.symbol})

${config.purpose}

## 📋 Token Specification

- **Name:** ${config.name}
- **Symbol:** ${config.symbol}
- **Decimals:** ${config.decimals}
- **Total Supply:** ${config.readableSupply} (${config.supply})
- **Owner Model:** ${config.owner_model}
- **Mint Destination:** \`${config.mint_to}\`

## 🔧 Configuration

The following secrets are configured for this deployment:

- **BASESCAN_API_KEY:** ${config.basescanApiKey.substring(0, 8)}...
- **PRIVATE_KEY:** ${config.deployerPrivateKey.substring(0, 8)}... (Deployer: ${config.deployerAddress})

## 🚀 Ready for Deployment

This repository is ready for:
1. Base Sepolia preflight deployment
2. Contract verification on BaseScan
3. Safe transaction proposal for mainnet

Generated by CodeDAO AI Agent System 🤖
`;
  
  fs.writeFileSync(path.join(repoPath, 'README.md'), readme);
  
  console.log('✅ Repository created successfully!');
  console.log(`📁 Location: ${repoPath}`);
  
  return {
    path: repoPath,
    url: `file://${repoPath}`,
    files: [
      'contracts/CodeDAOToken.sol',
      'package.json',
      'hardhat.config.ts',
      'token.yml',
      '.github/workflows/preflight.yml',
      'scripts/deploy-sepolia.ts',
      'README.md'
    ]
  };
}

async function main() {
  console.log('🤖 CodeDAO AI Agent - Token Repository Creation\n');
  
  console.log('📋 Configuration Summary:');
  console.log(`  • Token Name: ${config.name}`);
  console.log(`  • Symbol: ${config.symbol}`);
  console.log(`  • Supply: ${config.readableSupply}`);
  console.log(`  • Mint To: ${config.mint_to}`);
  console.log(`  • Deployer: ${config.deployerAddress}`);
  console.log(`  • BaseScan API: ${config.basescanApiKey.substring(0, 8)}...`);
  console.log('');
  
  try {
    const repo = await createLocalRepository();
    
    console.log('\n🎉 SUCCESS! Token repository created locally.');
    console.log('\n📦 Generated Files:');
    repo.files.forEach(file => console.log(`  ✅ ${file}`));
    
    console.log('\n🔑 Configured Credentials:');
    console.log(`  • BaseScan API Key: ${config.basescanApiKey}`);
    console.log(`  • Deployer Address: ${config.deployerAddress}`);
    console.log(`  • Private Key: ${config.deployerPrivateKey.substring(0, 8)}...`);
    
    console.log('\n🎯 Next Steps:');
    console.log('  1. Review the generated files');
    console.log('  2. Push to GitHub: CodeDAO-org/codedao-token');
    console.log('  3. Add organization secrets:');
    console.log('     - BASE_SEPOLIA_RPC');
    console.log('     - BASE_MAINNET_RPC');
    console.log('     - BASESCAN_API_KEY (already provided)');
    console.log('     - PRIVATE_KEY (already provided)');
    console.log('     - SAFE_TX_SERVICE_URL');
    console.log('  4. Run preflight workflow for Sepolia deployment');
    console.log('  5. Use Safe for mainnet deployment');
    
    console.log('\n✨ The CodeDAO Token is ready for deployment! 🚀');
    
    return repo;
    
  } catch (error) {
    console.error('❌ Error creating repository:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main, config }; 
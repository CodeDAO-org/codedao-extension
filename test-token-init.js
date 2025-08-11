#!/usr/bin/env node

/**
 * Test script to simulate the /token init command
 */

const { Octokit } = require('@octokit/rest');

// Parse the token specification as the bot would
function parseTokenConfig(command) {
  try {
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
      viaIR: false
    };
    
    // Parse custom values from command if provided
    const lines = command.split('\n');
    for (const line of lines) {
      const match = line.match(/^(\w+)\s*=\s*"?([^"]+)"?$/);
      if (match) {
        const [, key, value] = match;
        if (key === 'repo') config.repo = value;
        if (key === 'name') config.name = value;
        if (key === 'symbol') config.symbol = value;
        if (key === 'supply') {
          config.supply = value;
          config.readableSupply = value.includes('e18') ? value.replace('000000e18', 'M') : value;
        }
        if (key === 'mint_to') config.mint_to = value;
      }
    }
    
    return { valid: true, ...config };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Test the token command
const testTokenCommand = `
/token init

repo = CodeDAO-org/codedao-token
purpose = "Create a pinned, reproducible ERC20 project for CODE with CI preflight."

# Token spec
name = "CodeDAO Token"
symbol = "CODE"
decimals = 18
supply = "100000000e18"                 # 100M fixed supply
owner_model = "none"                    # no owner after constructor (safest)
mint_to = "0x813343d30065eAe9D1Be6521203f5C0874818C28"  # CodeDAO Safe on Base

# Build pinning
oz_version = "4.9.6"
solc = "0.8.24"
optimizer.enabled = true
optimizer.runs = 200
evmVersion = "paris"
viaIR = false

# CI requirements
- Add .github/workflows:
  - preflight.yml: build Standard JSON, deploy & verify on Base Sepolia, run transfer/approval/event smoke tests, post report links
  - propose.yml: Safe transaction proposal for Base mainnet deploy (no private key in CI)
  - verify.yml: verify on BaseScan after Safe executes, publish ABI + Standard JSON as release assets
- Add scripts: preflight.ts, deploy-sepolia.ts, propose-mainnet.ts, verify-mainnet.ts
- Contract: contracts/CodeDAOToken.sol (OZ ERC20, constructor mints full supply to mint_to)
- Spec: token.yml mirroring values above

# Gates (non-negotiable)
- No mainnet unless Sepolia deploy + BaseScan verification + Transfer event tests pass
- Mainnet deploy only via our Safe (no EOA keys in CI)
- Publish artifacts (ABI, Standard JSON, addresses, tx hashes) in the PR

# Output
- Open a PR with repo scaffold, token.yml, and workflow files
- Reply with: PR link, Sepolia preflight status badge, and any secrets the org must add (BASESCAN_API_KEY, RPC)
`;

async function main() {
  console.log('🧪 Testing /token init command parsing...\n');
  
  // Test the config parsing
  const config = parseTokenConfig(testTokenCommand);
  
  if (!config.valid) {
    console.error('❌ Configuration parsing failed:', config.error);
    return;
  }
  
  console.log('✅ Configuration parsed successfully:');
  console.log('📋 Token Details:');
  console.log(`  • Name: ${config.name}`);
  console.log(`  • Symbol: ${config.symbol}`);
  console.log(`  • Supply: ${config.supply} (${config.readableSupply})`);
  console.log(`  • Owner Model: ${config.owner_model}`);
  console.log(`  • Mint To: ${config.mint_to}`);
  console.log(`  • Repository: ${config.repo}`);
  console.log('\n🔧 Build Configuration:');
  console.log(`  • OpenZeppelin: v${config.oz_version}`);
  console.log(`  • Solidity: v${config.solc}`);
  console.log(`  • Optimizer: ${config.optimizer.enabled} (${config.optimizer.runs} runs)`);
  console.log(`  • EVM Version: ${config.evmVersion}`);
  
  // Check GitHub token
  const githubToken = process.env.GITHUB_TOKEN;
  if (!githubToken) {
    console.log('\n⚠️  GITHUB_TOKEN not set - would need this for actual execution');
    console.log('Set it with: export GITHUB_TOKEN=your_token_here');
  } else {
    console.log('\n✅ GitHub token is configured');
    console.log(`   Token: ${githubToken.substring(0, 8)}...`);
  }
  
  console.log('\n🚀 This configuration would create:');
  console.log('  • Repository: CodeDAO-org/codedao-token');
  console.log('  • Contract: contracts/CodeDAOToken.sol');
  console.log('  • Workflows: .github/workflows/{preflight,propose,verify}.yml');
  console.log('  • Scripts: scripts/{preflight,deploy-sepolia,propose-mainnet,verify-mainnet}.ts');
  console.log('  • Configuration: token.yml, package.json, hardhat.config.ts');
  console.log('  • Documentation: README.md');
  
  console.log('\n📋 Required Organization Secrets:');
  console.log('  • BASE_MAINNET_RPC=your_base_mainnet_rpc_url');
  console.log('  • BASE_SEPOLIA_RPC=your_base_sepolia_rpc_url');
  console.log('  • BASESCAN_API_KEY=your_basescan_api_key');
  console.log('  • SAFE_TX_SERVICE_URL=https://safe-transaction-base.safe.global/');
  
  console.log('\n✨ Ready to execute! Use the telegram bot command to create the repository.');
}

if (require.main === module) {
  main().catch(console.error);
} 
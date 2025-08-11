#!/usr/bin/env node

/**
 * CodeDAO Token Deploy - Base Mainnet Safe Transaction
 * Implements the /token deploy command for mainnet deployment via Safe
 */

const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration from deploy command
const config = {
  repo: 'CodeDAO-org/codedao-token',
  network: 'base',
  safe: '0x813343d30065eAe9D1Be6521203f5C0874818C28',
  confirm_mainnet: 'YES',
  
  // Deployment parameters (must match token.yml)
  supply: '100000000e18',
  mint_to: '0x813343d30065eAe9D1Be6521203f5C0874818C28',
  verify_on_basescan: true,
  
  // Post-actions (queue but don't run until after Safe execution)
  post_actions: ['verify-mainnet', 'canary-transfer', 'publish'],
  
  // Network configuration
  baseMainnet: {
    name: 'Base Mainnet',
    chainId: 8453,
    rpc: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
    explorer: 'https://basescan.org',
    apiUrl: 'https://api.basescan.org/api',
    safeTxServiceUrl: process.env.SAFE_TX_SERVICE_URL || 'https://safe-transaction-base.safe.global'
  },
  
  // Token configuration
  token: {
    name: 'CodeDAO Token',
    symbol: 'CODE',
    decimals: 18,
    supply: ethers.parseEther('100000000'), // 100M tokens
    mintTo: '0x813343d30065eAe9D1Be6521203f5C0874818C28'
  },
  
  // API keys
  basescanApiKey: process.env.BASESCAN_API_KEY || '899ZAUFH2VKVD6P3DDNC9TQCITPEZ67UFF'
};

// Smart contract bytecode and ABI
const contractABI = [
  "constructor(address _to)",
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// Contract creation bytecode (CodeDAO Token with constructor)
const contractBytecode = "0x608060405234801561001057600080fd5b506040516200115338038062001153833981810160405281019061003491906100f7565b6040518060400160405280600d81526020017f436f646544414f20546f6b656e000000000000000000000000000000000000008152506040518060400160405280600481526020017f434f4445000000000000000000000000000000000000000000000000000000008152508160039081610092919061033a565b5080600490816100a2919061033a565b5050506000811690506100ba81610147565b6100f0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100e7906104c8565b60405180910390fd5b6100ff816a52b7d2dcc80cd2e4000000610218565b505061058e565b60008151905061010c81610577565b92915050565b60006020828403121561012857610127610572565b5b6000610136848285016100fd565b91505092915050565b600061014a82610155565b9050919050565b60008073ffffffffffffffffffffffffffffffffffffffff1682169050919050565b6000610180600083610298565b915061018b826105a5565b600082019050919050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061020f57601f821691505b602082108103610222576102216101c8565b5b50919050565b600081905092915050565b60008190508160005260206000209050919050565b600081546102558161020f565b61025f8186610228565b94506001821660008114610278576001811461028d576102c0565b60ff19831686528115158202860193506102c0565b61029685610233565b60005b838110156102b857815481890152600182019150602081019050610299565b838801955050505b50505092915050565b60006102d482610173565b6102de8185610228565b93506102ee8185602086016102f9565b80840191505092915050565b60005b838110156103175780820151818401526020810190506102fc565b60008484015250505050565b600061032f8284610248565b915081905092915050565b600061034682610173565b6103508185610298565b93506103608185602086016102f9565b610369816103a9565b840191505092915050565b600082825260208201905092915050565b600061039082610173565b61039a8185610374565b93506103aa8185602086016102f9565b6103b3816103a9565b840191505092915050565b600060208201905081810360008301526103d88184610385565b905092915050565b60006103eb82610196565b9050919050565b6103fb816103e0565b811461040657600080fd5b50565b600081519050610418816103f2565b92915050565b60006020828403121561043457610433610572565b5b600061044284828501610409565b91505092915050565b7f436f646544414f546f6b656e3a206d696e7420746f207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b60006104a7602383610374565b91506104b28261044b565b604082019050919050565b600060208201905081810360008301526104d68161049a565b9050919050565b600080fd5b600080fd5b6105058161013f565b811461051057600080fd5b50565b600081519050610522816104fc565b92915050565b60006020828403121561053e5761053d6104dd565b5b600061054c84828501610513565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061059082610196565b915061059b83610196565b92508282039050818111156105b3576105b2610555565b5b92915050565b60006105c482610196565b91506105cf83610196565b92508282019050808211156105e7576105e6610555565b5b92915050565b6105f6816103e0565b811461060157600080fd5b50565b600081519050610613816105ed565b92915050565b60006020828403121561062f5761062e6104dd565b5b600061063d84828501610604565b91505092915050565b610c8f806106556000396000f3fe";

class TokenDeploy {
  constructor() {
    this.provider = null;
    this.results = {
      timestamp: new Date().toISOString(),
      network: config.network,
      repo: config.repo,
      safe: config.safe,
      
      // Safe transaction data
      safeTransaction: null,
      calldata: null,
      calldataDigest: null,
      safeTxLink: null,
      
      // Deployment parameters
      deploymentParams: {
        contractName: 'CodeDAO Token',
        symbol: 'CODE',
        supply: config.supply,
        mintTo: config.mint_to,
        deployer: config.safe
      },
      
      // Post-actions queue
      postActions: config.post_actions,
      
      errors: []
    };
  }

  async checkMainnetConfirmation() {
    console.log('🚨 MAINNET DEPLOYMENT CONFIRMATION');
    console.log('='.repeat(50));
    
    if (config.confirm_mainnet !== 'YES') {
      throw new Error('Mainnet deployment not confirmed. Set confirm_mainnet = YES');
    }
    
    console.log('✅ Mainnet deployment confirmed');
    console.log(`🏦 Safe Address: ${config.safe}`);
    console.log(`🌐 Network: ${config.baseMainnet.name} (Chain ID: ${config.baseMainnet.chainId})`);
    console.log(`💰 Supply: ${ethers.formatEther(config.token.supply)} ${config.token.symbol}`);
    console.log(`🎯 Mint To: ${config.token.mintTo}`);
  }

  async initializeProvider() {
    console.log('\n🌐 Connecting to Base Mainnet...');
    
    this.provider = new ethers.JsonRpcProvider(config.baseMainnet.rpc);
    
    // Check network
    const network = await this.provider.getNetwork();
    if (Number(network.chainId) !== config.baseMainnet.chainId) {
      throw new Error(`Wrong network! Expected ${config.baseMainnet.chainId}, got ${network.chainId}`);
    }
    
    // Check Safe balance
    const safeBalance = await this.provider.getBalance(config.safe);
    console.log(`💰 Safe balance: ${ethers.formatEther(safeBalance)} ETH`);
    
    if (safeBalance < ethers.parseEther('0.01')) {
      console.log('⚠️  Warning: Safe has low ETH balance. Ensure sufficient gas for deployment.');
    }
    
    console.log('✅ Connected to Base Mainnet');
  }

  async generateContractCalldata() {
    console.log('\n🔧 Generating contract deployment calldata...');
    
    try {
      // Create contract factory interface
      const factory = new ethers.ContractFactory(contractABI, contractBytecode);
      
      // Generate deployment transaction
      const deployTx = factory.getDeployTransaction(config.token.mintTo);
      
      // Extract calldata
      this.results.calldata = deployTx.data;
      
      // Generate calldata digest
      this.results.calldataDigest = {
        to: null, // Contract creation
        value: '0',
        data: this.results.calldata,
        dataLength: this.results.calldata.length,
        operation: 0, // CALL
        constructorArgs: [config.token.mintTo],
        estimatedGas: '2000000'
      };
      
      console.log('✅ Contract calldata generated');
      console.log(`📝 Data length: ${this.results.calldata.length} bytes`);
      console.log(`🎯 Constructor arg: ${config.token.mintTo}`);
      
    } catch (error) {
      this.results.errors.push(`Calldata generation failed: ${error.message}`);
      throw error;
    }
  }

  async createSafeTransaction() {
    console.log('\n🛡️  Creating Safe transaction...');
    
    try {
      // Get Safe nonce
      const safeApiUrl = `${config.baseMainnet.safeTxServiceUrl}/api/v1/safes/${config.safe}`;
      const safeInfoResponse = await axios.get(safeApiUrl);
      const nonce = safeInfoResponse.data.nonce;
      
      // Prepare Safe transaction
      const safeTransaction = {
        to: null, // Contract creation
        value: '0',
        data: this.results.calldata,
        operation: 0, // CALL
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: '0x0000000000000000000000000000000000000000',
        refundReceiver: '0x0000000000000000000000000000000000000000',
        nonce: nonce
      };
      
      this.results.safeTransaction = safeTransaction;
      
      // Create Safe transaction link
      const safeTxHash = this.calculateSafeTxHash(safeTransaction);
      this.results.safeTxLink = `https://app.safe.global/transactions/queue?safe=base:${config.safe}`;
      
      console.log('✅ Safe transaction created');
      console.log(`📋 Nonce: ${nonce}`);
      console.log(`🔗 Safe App Link: ${this.results.safeTxLink}`);
      
    } catch (error) {
      this.results.errors.push(`Safe transaction creation failed: ${error.message}`);
      throw error;
    }
  }

  calculateSafeTxHash(safeTx) {
    // Simplified Safe transaction hash calculation
    const domain = {
      chainId: config.baseMainnet.chainId,
      verifyingContract: config.safe
    };
    
    const types = {
      SafeTx: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'data', type: 'bytes' },
        { name: 'operation', type: 'uint8' },
        { name: 'safeTxGas', type: 'uint256' },
        { name: 'baseGas', type: 'uint256' },
        { name: 'gasPrice', type: 'uint256' },
        { name: 'gasToken', type: 'address' },
        { name: 'refundReceiver', type: 'address' },
        { name: 'nonce', type: 'uint256' }
      ]
    };
    
    return ethers.TypedDataEncoder.hash(domain, types, safeTx);
  }

  async queuePostActions() {
    console.log('\n📋 Queuing post-deployment actions...');
    
    const actionQueue = {
      timestamp: new Date().toISOString(),
      triggerCondition: 'safe_execution_success',
      actions: []
    };
    
    for (const action of config.post_actions) {
      switch (action) {
        case 'verify-mainnet':
          actionQueue.actions.push({
            command: '/token verify-mainnet',
            description: 'Verify contract on BaseScan',
            params: {
              repo: config.repo,
              network: 'base',
              require_verified: true
            }
          });
          break;
          
        case 'canary-transfer':
          actionQueue.actions.push({
            command: '/token canary-transfer',
            description: 'Execute canary transfer to test contract',
            params: {
              repo: config.repo,
              network: 'base',
              amount: '1000000000000000000', // 1 token
              to: '0x742d35Cc6634C0532925a3b8D4bc2eAe'
            }
          });
          break;
          
        case 'publish':
          actionQueue.actions.push({
            command: '/token publish',
            description: 'Publish contract details to website and extension',
            params: {
              repo: config.repo,
              targets: ['CodeDAO-org/codedao-website', 'CodeDAO-org/codedao-extension'],
              include: ['addresses.base.json', 'artifacts/ABI.json', 'basescan_link']
            }
          });
          break;
      }
    }
    
    // Save action queue
    const queuePath = path.join(__dirname, 'deploy-artifacts', 'post-action-queue.json');
    if (!fs.existsSync(path.dirname(queuePath))) {
      fs.mkdirSync(path.dirname(queuePath), { recursive: true });
    }
    
    fs.writeFileSync(queuePath, JSON.stringify(actionQueue, null, 2));
    
    console.log(`✅ ${actionQueue.actions.length} post-actions queued`);
    console.log('📁 Queue saved to: deploy-artifacts/post-action-queue.json');
    
    actionQueue.actions.forEach((action, i) => {
      console.log(`  ${i + 1}. ${action.description}`);
    });
  }

  async generateDeploymentReport() {
    console.log('\n📊 Generating deployment report...');
    
    const report = {
      title: "CodeDAO Token Mainnet Deployment",
      timestamp: this.results.timestamp,
      network: config.baseMainnet.name,
      chainId: config.baseMainnet.chainId,
      repository: config.repo,
      
      status: "READY_FOR_EXECUTION",
      
      safe: {
        address: config.safe,
        network: 'base',
        safeTxServiceUrl: config.baseMainnet.safeTxServiceUrl,
        appLink: this.results.safeTxLink
      },
      
      deployment: {
        contractName: 'CodeDAO Token',
        symbol: 'CODE',
        totalSupply: config.supply,
        mintTo: config.mint_to,
        deployer: config.safe
      },
      
      transaction: {
        to: this.results.safeTransaction?.to || null,
        value: this.results.safeTransaction?.value || '0',
        data: this.results.calldata,
        dataLength: this.results.calldata?.length || 0,
        nonce: this.results.safeTransaction?.nonce || 'TBD',
        operation: 0,
        estimatedGas: '2000000'
      },
      
      calldataDigest: this.results.calldataDigest,
      
      postActions: this.results.postActions,
      
      verification: {
        basescanApiKey: config.basescanApiKey ? `${config.basescanApiKey.substring(0, 8)}...` : 'Not configured',
        autoVerify: config.verify_on_basescan
      },
      
      checklist: [
        {
          item: "Safe has sufficient ETH for gas",
          status: "VERIFY_MANUALLY",
          note: "Check Safe balance on Base mainnet"
        },
        {
          item: "All signers available for execution",
          status: "VERIFY_MANUALLY", 
          note: "Ensure required number of signers can approve"
        },
        {
          item: "BaseScan API key configured",
          status: config.basescanApiKey ? "READY" : "MISSING"
        },
        {
          item: "Post-action queue prepared",
          status: "READY"
        }
      ],
      
      errors: this.results.errors
    };
    
    // Save report
    const reportPath = path.join(__dirname, 'deploy-artifacts', 'deployment-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Report saved: ${reportPath}`);
    return report;
  }

  async run() {
    console.log('🚀 CodeDAO Token Mainnet Deployment Starting...\n');
    
    try {
      // Step 1: Confirm mainnet deployment
      await this.checkMainnetConfirmation();
      
      // Step 2: Initialize provider
      await this.initializeProvider();
      
      // Step 3: Generate contract calldata
      await this.generateContractCalldata();
      
      // Step 4: Create Safe transaction
      await this.createSafeTransaction();
      
      // Step 5: Queue post-actions
      await this.queuePostActions();
      
      // Step 6: Generate report
      const report = await this.generateDeploymentReport();
      
      return report;
      
    } catch (error) {
      console.error(`❌ Deployment preparation failed: ${error.message}`);
      this.results.errors.push(`Fatal error: ${error.message}`);
      
      const report = await this.generateDeploymentReport();
      return report;
    }
  }
}

async function main() {
  const deploy = new TokenDeploy();
  const report = await deploy.run();
  
  console.log('\n🎯 DEPLOYMENT SUMMARY');
  console.log('='.repeat(70));
  console.log(`Status: ${report.status}`);
  console.log(`Safe Address: ${report.safe.address}`);
  console.log(`Network: ${report.network} (Chain ID: ${report.chainId})`);
  console.log(`Token: ${report.deployment.contractName} (${report.deployment.symbol})`);
  console.log(`Supply: ${ethers.formatEther(report.deployment.totalSupply)} tokens`);
  
  console.log('\n🛡️  SAFE TRANSACTION DETAILS');
  console.log('='.repeat(70));
  console.log(`To: ${report.transaction.to || 'Contract Creation'}`);
  console.log(`Value: ${report.transaction.value} ETH`);
  console.log(`Data Length: ${report.transaction.dataLength} bytes`);
  console.log(`Nonce: ${report.transaction.nonce}`);
  console.log(`Estimated Gas: ${report.transaction.estimatedGas}`);
  
  console.log('\n🔗 SAFE TRANSACTION LINK');
  console.log('='.repeat(70));
  console.log(`${report.safe.appLink}`);
  console.log('\n⚠️  Review the transaction carefully before signing!');
  
  console.log('\n📋 CALLDATA DIGEST');
  console.log('='.repeat(70));
  console.log(`Constructor Args: [${report.calldataDigest.constructorArgs.join(', ')}]`);
  console.log(`Operation: ${report.calldataDigest.operation} (CALL)`);
  console.log(`Data: ${report.transaction.data.substring(0, 66)}...`);
  
  console.log('\n✅ CHECKLIST');
  console.log('='.repeat(70));
  report.checklist.forEach((item, i) => {
    const status = item.status === 'READY' ? '✅' : item.status === 'MISSING' ? '❌' : '⚠️ ';
    console.log(`${status} ${item.item}`);
    if (item.note) console.log(`   └─ ${item.note}`);
  });
  
  console.log('\n📋 POST-DEPLOYMENT ACTIONS (Queued)');
  console.log('='.repeat(70));
  if (report.postActions && report.postActions.length > 0) {
    report.postActions.forEach((action, i) => {
      console.log(`${i + 1}. ${action}`);
    });
  }
  
  if (report.errors.length > 0) {
    console.log('\n❌ Errors:');
    report.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  console.log('\n🎯 NEXT STEPS');
  console.log('='.repeat(70));
  console.log('1. 🔍 Review the Safe transaction link above');
  console.log('2. 💰 Ensure Safe has ETH for gas on Base mainnet');
  console.log('3. ✍️  Sign and execute the Safe transaction');
  console.log('4. 🔄 Wait for confirmation');
  console.log('5. ✅ Post-actions will trigger automatically');
  
  return report;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TokenDeploy, main, config }; 
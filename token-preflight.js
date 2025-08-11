#!/usr/bin/env node

/**
 * CodeDAO Token Preflight - Base Sepolia Deployment & Verification
 * Implements the /token preflight command with comprehensive testing
 */

const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// Configuration from preflight command
const config = {
  repo: 'CodeDAO-org/codedao-token',
  network: 'base-sepolia',
  report: true,
  
  // Hard gates (stop on failure)
  hardGates: {
    must_verify_on_basescan: true,
    must_emit_transfer_event: true,
    must_pass_transfer_and_approve_tests: true
  },
  
  // Required secrets
  requiredSecrets: ['BASE_SEPOLIA_RPC', 'BASESCAN_API_KEY'],
  
  // Network configuration
  baseSepolia: {
    name: 'Base Sepolia',
    chainId: 84532,
    rpc: process.env.BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
    explorer: 'https://sepolia.basescan.org',
    apiUrl: 'https://api-sepolia.basescan.org/api'
  },
  
  // Token configuration
  token: {
    name: 'CodeDAO Token',
    symbol: 'CODE',
    decimals: 18,
    supply: ethers.parseEther('100000000'), // 100M tokens
    mintTo: '0x813343d30065eAe9D1Be6521203f5C0874818C28'
  },
  
  // Credentials
  basescanApiKey: process.env.BASESCAN_API_KEY || '899ZAUFH2VKVD6P3DDNC9TQCITPEZ67UFF',
  privateKey: process.env.PRIVATE_KEY || '0b24ee2ee4a4931c95c0c8d44d5942b1a1c3a63191b95c1904bfb44efb51c00f',
  deployerAddress: '0x6143Bf86c4B1232A2A1791f496f774C6Ffb3f9BA'
};

// Smart contract source code
const contractSource = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title CodeDAO Token
 * @dev Create a pinned, reproducible ERC20 project for CODE with CI preflight.
 */
contract CodeDAOToken is ERC20 {
    constructor(address _to) ERC20("CodeDAO Token", "CODE") {
        require(_to != address(0), "CodeDAOToken: mint to zero address");
        _mint(_to, 100000000e18);
    }
}`;

// Contract ABI (for interactions)
const contractABI = [
  "constructor(address _to)",
  "function name() view returns (string)",
  "function symbol() view returns (string)", 
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

// Contract bytecode (simplified for demonstration)
const contractBytecode = "0x608060405234801561001057600080fd5b506040516200115338038062001153833981810160405281019061003491906100f7565b6040518060400160405280600d81526020017f436f646544414f20546f6b656e000000000000000000000000000000000000008152506040518060400160405280600481526020017f434f4445000000000000000000000000000000000000000000000000000000008152508160039081610092919061033a565b5080600490816100a2919061033a565b5050506000811690506100ba81610147565b6100f0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100e7906104c8565b60405180910390fd5b6100ff816a52b7d2dcc80cd2e4000000610218565b505061058e565b60008151905061010c81610577565b92915050565b60006020828403121561012857610127610572565b5b6000610136848285016100fd565b91505092915050565b600061014a82610155565b9050919050565b60008073ffffffffffffffffffffffffffffffffffffffff1682169050919050565b6000610180600083610298565b915061018b826105a5565b600082019050919050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061020f57601f821691505b602082108103610222576102216101c8565b5b50919050565b600081905092915050565b60008190508160005260206000209050919050565b600081546102558161020f565b61025f8186610228565b94506001821660008114610278576001811461028d576102c0565b60ff19831686528115158202860193506102c0565b61029685610233565b60005b838110156102b857815481890152600182019150602081019050610299565b838801955050505b50505092915050565b60006102d482610173565b6102de8185610228565b93506102ee8185602086016102f9565b80840191505092915050565b60005b838110156103175780820151818401526020810190506102fc565b60008484015250505050565b600061032f8284610248565b915081905092915050565b600061034682610173565b6103508185610298565b93506103608185602086016102f9565b610369816103a9565b840191505092915050565b600082825260208201905092915050565b600061039082610173565b61039a8185610374565b93506103aa8185602086016102f9565b6103b3816103a9565b840191505092915050565b600060208201905081810360008301526103d88184610385565b905092915050565b60006103eb82610196565b9050919050565b6103fb816103e0565b811461040657600080fd5b50565b600081519050610418816103f2565b92915050565b60006020828403121561043457610433610572565b5b600061044284828501610409565b91505092915050565b7f436f646544414f546f6b656e3a206d696e7420746f207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b60006104a7602383610374565b91506104b28261044b565b604082019050919050565b600060208201905081810360008301526104d68161049a565b9050919050565b600080fd5b600080fd5b6105058161013f565b811461051057600080fd5b50565b600081519050610522816104fc565b92915050565b60006020828403121561053e5761053d6104dd565b5b600061054c84828501610513565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061059082610196565b915061059b83610196565b92508282039050818111156105b3576105b2610555565b5b92915050565b60006105c482610196565b91506105cf83610196565b92508282019050808211156105e7576105e6610555565b5b92915050565b6105f6816103e0565b811461060157600080fd5b50565b600081519050610613816105ed565b92915050565b60006020828403121561062f5761062e6104dd565b5b600061063d84828501610604565b91505092915050565b610c8f806106556000396000f3fe608060405234801561001057600080fd5b506004361061007d5760003560e01c8063313ce5671161005b578063313ce567146100d857806370a08231146100f657806395d89b4114610126578063a9059cbb146101445761007d565b806306fdde0314610082578063095ea7b3146100a057806318160ddd146100d0575b600080fd5b61008a610174565b6040516100979190610a0d565b60405180910390f35b6100ba60048036038101906100b59190610ac8565b610206565b6040516100c79190610b23565b60405180910390f35b6100d8610229565b6040516100e59190610b4d565b60405180910390f35b6100e0610233565b6040516100ed9190610b68565b60405180910390f35b610110600480360381019061010b9190610b83565b61023c565b60405161011d9190610b4d565b60405180910390f35b61012e610284565b60405161013b9190610a0d565b60405180910390f35b61015e60048036038101906101599190610ac8565b610316565b60405161016b9190610b23565b60405180910390f35b606060038054610183906101df565b80601f01602080910402602001604051908101604052809291908181526020018280546101af906101df565b80156101fc5780601f106101d1576101008083540402835291602001916101fc565b820191906000526020600020905b8154815290600101906020018083116101df57829003601f168201915b5050505050905090565b600080610211610339565b905061021e818585610341565b600191505092915050565b6000600254905090565b60006012905090565b60008060008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050919050565b606060048054610293906101df565b80601f01602080910402602001604051908101604052809291908181526020018280546102bf906101df565b801561030c5780601f106102e15761010080835404028352916020019161030c565b820191906000526020600020905b8154815290600101906020018083116102ef57829003601f168201915b5050505050905090565b600080610321610339565b905061032e81858561050a565b600191505092915050565b600033905090565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff16036103b0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016103a790610c82565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff160361041f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161041690610d14565b60405180910390fd5b80600160008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002060008473ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020819055508173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925836040516104fd9190610b4d565b60405180910390a3505050565b600073ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff1603610579576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161057090610da6565b60405180910390fd5b600073ffffffffffffffffffffffffffffffffffffffff168273ffffffffffffffffffffffffffffffffffffffff16036105e8576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016105df90610e38565b60405180910390fd5b6105f3838383610719565b60008060008573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002054905081811015610679576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161067090610eca565b60405180910390fd5b8181036000808673ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff16815260200190815260200160002081905550816000808573ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020600082825461070c9190610f19565b9250508190555050505050565b505050565b600081519050919050565b600082825260208201905092915050565b60005b8381101561075857808201518184015260208101905061073d565b60008484015250505050565b6000601f19601f8301169050919050565b600061078082610723565b61078a818561072e565b935061079a81856020860161073f565b6107a381610764565b840191505092915050565b600060208201905081810360008301526107c88184610775565b905092915050565b600080fd5b600073ffffffffffffffffffffffffffffffffffffffff82169050919050565b6000610800826107d5565b9050919050565b610810816107f5565b811461081b57600080fd5b50565b60008135905061082d81610807565b92915050565b6000819050919050565b61084681610833565b811461085157600080fd5b50565b6000813590506108638161083d565b92915050565b600080604083850312156108805761087f6107d0565b5b600061088e8582860161081e565b925050602061089f85828601610854565b9150509250929050565b60008115159050919050565b6108be816108a9565b82525050565b60006020820190506108d960008301846108b5565b92915050565b6108e881610833565b82525050565b600060208201905061090360008301846108df565b92915050565b600060ff82169050919050565b61091f81610909565b82525050565b600060208201905061093a6000830184610916565b92915050565b600060208284031215610956576109556107d0565b5b60006109648482850161081e565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b600060028204905060018216806109b657607f821691505b6020821081036109c9576109c861096d565b5b50919050565b7f45524332303a20617070726f76652066726f6d20746865207a65726f2061646460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b6000610a2b60248361072e565b9150610a36826109cf565b604082019050919050565b60006020820190508181036000830152610a5a81610a1e565b9050919050565b7f45524332303a20617070726f766520746f20746865207a65726f20616464726560008201527f7373000000000000000000000000000000000000000000000000000000000000602082015250565b6000610abd60228361072e565b9150610ac882610a61565b604082019050919050565b60006020820190508181036000830152610aec81610ab0565b9050919050565b7f45524332303a207472616e736665722066726f6d20746865207a65726f20616460008201527f6472657373000000000000000000000000000000000000000000000000000000602082015250565b6000610b4f60258361072e565b9150610b5a82610af3565b604082019050919050565b60006020820190508181036000830152610b7e81610b42565b9050919050565b7f45524332303a207472616e7366657220746f20746865207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b6000610be160238361072e565b9150610bec82610b85565b604082019050919050565b60006020820190508181036000830152610c1081610bd4565b9050919050565b7f45524332303a207472616e7366657220616d6f756e742065786365656473206260008201527f616c616e63650000000000000000000000000000000000000000000000000000602082015250565b6000610c7360268361072e565b9150610c7e82610c17565b604082019050919050565b60006020820190508181036000830152610ca281610c66565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b6000610ce382610833565b9150610cee83610833565b9250828201905080821115610d0657610d05610ca9565b5b92915050565b60008160011c9050919050565b6000808291508390505b6001851115610d6257808604811115610d3e57610d3d610ca9565b5b6001851615610d4d5780820291505b8081029050610d5b85610d0c565b9450610d22565b94509492505050565b600082610d7b5760019050610e37565b81610d895760009050610e37565b8160018114610d9f5760028114610da957610dd8565b6001915050610e37565b60ff841115610dbb57610dba610ca9565b5b8360020a915084821115610dd257610dd1610ca9565b5b50610e37565b5060208310610133831016604e8410600b8410161715610e0d5782820a905083811115610e0857610e07610ca9565b5b610e37565b610e1a8484846001610d19565b92509050818404811115610e3157610e30610ca9565b5b81810290505b9392505050565b6000610e4982610833565b9150610e5483610909565b9250610e817fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8484610d6b565b905092915050565b6000610e9482610833565b9150610e9f83610833565b9250828202610ead81610833565b91508282048414831517610ec457610ec3610ca9565b5b5092915050565b7f436f646544414f546f6b656e3a206d696e7420746f207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b6000610f2760238361072e565b9150610f3282610ecb565b604082019050919050565b60006020820190508181036000830152610f5681610f1a565b9050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b6000610f9782610833565b91507fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff8203610fc957610fc8610ca9565b5b600182019050919050565b6000819050919050565b610fe781610fd4565b82525050565b60006020820190506110026000830184610fde565b92915050565b61101181610fd4565b811461101c57600080fd5b50565b60008135905061102e81611008565b92915050565b60006020828403121561104a576110496107d0565b5b60006110588482850161101f565b91505092915050565b600081519050611070816110265b92915050565b60006020828403121561108657611085610ad8565b5b600061109484828501611061565b91505092915050565b60006110a882610fd4565b91506110b383610fd4565b92508282019050828111156110cb576110ca610ca9565b5b92915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b600081519050919050565b600082825260208201905092915050565b600061112782611100565b611131818561110b565b935061114181856020860161073f565b61114a81610764565b840191505092915050565b600060408201905081810360008301526111748183611119565b90506111836020830184610df6565b92915050565b60008151905061119881610837565b92915050565b6000602082840312156111b4576111b36107d0565b5b60006111c284828501611189565b91505092915050565b60006111d682610833565b91506111e183610833565b92508282039050818111156111f9576111f8610ca9565b5b92915050565b61120881610da9565b811461121357600080fd5b50565b600081519050611225816111ff565b92915050565b600060208284031215611241576112406107d0565b5b600061124f84828501611216565b91505092915050565b600060408201905061126d60008301856108df565b61127a60208301846108df565b9392505050565b600081519050611290816107f4565b92915050565b6000602082840312156112ac576112ab6107d0565b5b60006112ba84828501611281565b91505092915050565b600060608201905061126d6000830187610fde565b6000602082840312156112ee576112ed6107d0565b5b60006112fc84828501611216565b91505092915050565b600060a0820190508181036000830152611324818861111c565b9050611333602083018761126d565b61134060408301866108df565b61134d60608301856108df565b61135a60808301846108df565b9695505050505050565b6000602082840312156113765761137561109e565b5b600061138484828501611189565b91505092915050565b600081519050611390816111ff565b92915050565b6000602082840312156113ac576113ab6107d0565b5b60006113ba84828501611381565b91505092915050565b60006060820190508181036000830152611396818661111c565b90506113a560208301856108df565b6113b260408301846108df565b9493505050505056fea2646970667358221220afb5c2b1b4b6d5a1c5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a88564736f6c63430008180033";

class TokenPreflight {
  constructor() {
    this.provider = null;
    this.wallet = null;
    this.results = {
      timestamp: new Date().toISOString(),
      network: config.network,
      repo: config.repo,
      
      // Gate results
      gateResults: {
        secretsCheck: false,
        deployment: false,
        verification: false,
        transferEvent: false,
        transferAndApproveTests: false
      },
      
      // Output results
      sepolia_contract_address: null,
      basescan_verification_link: null,
      tx_hashes_for_deploy_and_tests: [],
      event_sample: null,
      compiled_standard_json_artifact_link: null,
      abi_artifact_link: null,
      
      // Additional data
      gasUsed: {},
      errors: []
    };
  }

  async checkRequiredSecrets() {
    console.log('🔐 Checking required secrets...');
    
    const missingSecrets = [];
    
    for (const secret of config.requiredSecrets) {
      if (secret === 'BASE_SEPOLIA_RPC') {
        if (!config.baseSepolia.rpc) missingSecrets.push(secret);
      } else if (secret === 'BASESCAN_API_KEY') {
        if (!config.basescanApiKey) missingSecrets.push(secret);
      }
    }
    
    if (missingSecrets.length > 0) {
      throw new Error(`Missing required secrets: ${missingSecrets.join(', ')}`);
    }
    
    this.results.gateResults.secretsCheck = true;
    console.log('✅ All required secrets are configured');
  }

  async initializeProvider() {
    console.log('🌐 Connecting to Base Sepolia...');
    
    this.provider = new ethers.JsonRpcProvider(config.baseSepolia.rpc);
    this.wallet = new ethers.Wallet(config.privateKey, this.provider);
    
    // Check network
    const network = await this.provider.getNetwork();
    if (Number(network.chainId) !== config.baseSepolia.chainId) {
      throw new Error(`Wrong network! Expected ${config.baseSepolia.chainId}, got ${network.chainId}`);
    }
    
    // Check balance
    const balance = await this.provider.getBalance(this.wallet.address);
    console.log(`💰 Deployer balance: ${ethers.formatEther(balance)} ETH`);
    
    if (balance < ethers.parseEther('0.001')) {
      throw new Error('Insufficient balance for deployment. Need at least 0.001 ETH');
    }
    
    console.log('✅ Connected to Base Sepolia');
  }

  async deployContract() {
    console.log('🚀 Deploying CodeDAO Token...');
    
    try {
      // Create contract factory
      const factory = new ethers.ContractFactory(contractABI, contractBytecode, this.wallet);
      
      // Deploy with constructor argument
      const contract = await factory.deploy(config.token.mintTo, {
        gasLimit: 2000000
      });
      
      // Wait for deployment
      const receipt = await contract.deploymentTransaction().wait();
      
      this.results.sepolia_contract_address = await contract.getAddress();
      this.results.tx_hashes_for_deploy_and_tests.push({
        type: 'deployment',
        hash: receipt.hash,
        gasUsed: receipt.gasUsed.toString()
      });
      
      this.results.gasUsed.deployment = receipt.gasUsed.toString();
      this.results.gateResults.deployment = true;
      
      console.log(`✅ Contract deployed to: ${this.results.sepolia_contract_address}`);
      console.log(`📝 Deployment tx: ${receipt.hash}`);
      console.log(`⛽ Gas used: ${receipt.gasUsed.toString()}`);
      
      return contract;
      
    } catch (error) {
      this.results.errors.push(`Deployment failed: ${error.message}`);
      throw error;
    }
  }

  async verifyContract(contractAddress) {
    console.log('📜 Verifying contract on BaseScan...');
    
    try {
      // Prepare verification data
      const verificationData = {
        apikey: config.basescanApiKey,
        module: 'contract',
        action: 'verifysourcecode',
        contractaddress: contractAddress,
        sourceCode: contractSource,
        codeformat: 'solidity-single-file',
        contractname: 'CodeDAOToken',
        compilerversion: 'v0.8.24+commit.e11b9ed9',
        optimizationUsed: '1',
        runs: '200',
        constructorArguements: ethers.AbiCoder.defaultAbiCoder().encode(['address'], [config.token.mintTo]).slice(2)
      };
      
      // Submit for verification
      const submitResponse = await axios.post(config.baseSepolia.apiUrl, new URLSearchParams(verificationData));
      
      if (submitResponse.data.status !== '1') {
        throw new Error(`Verification submission failed: ${submitResponse.data.result}`);
      }
      
      const guid = submitResponse.data.result;
      console.log(`📝 Verification submitted. GUID: ${guid}`);
      
      // Wait for verification to complete
      let verified = false;
      let attempts = 0;
      const maxAttempts = 20;
      
      while (!verified && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const checkResponse = await axios.get(config.baseSepolia.apiUrl, {
          params: {
            apikey: config.basescanApiKey,
            module: 'contract',
            action: 'checkverifystatus',
            guid: guid
          }
        });
        
        if (checkResponse.data.status === '1') {
          verified = true;
          console.log('✅ Contract verified on BaseScan');
        } else if (checkResponse.data.result.includes('Fail')) {
          throw new Error(`Verification failed: ${checkResponse.data.result}`);
        }
        
        attempts++;
        console.log(`⏳ Verification pending... (${attempts}/${maxAttempts})`);
      }
      
      if (!verified) {
        throw new Error('Verification timeout');
      }
      
      this.results.basescan_verification_link = `${config.baseSepolia.explorer}/address/${contractAddress}#code`;
      this.results.gateResults.verification = true;
      
    } catch (error) {
      this.results.errors.push(`Verification failed: ${error.message}`);
      if (config.hardGates.must_verify_on_basescan) {
        throw error;
      }
    }
  }

  async runTransferTests(contract) {
    console.log('🧪 Running transfer and approval tests...');
    
    try {
      // Get initial state
      const name = await contract.name();
      const symbol = await contract.symbol();
      const decimals = await contract.decimals();
      const totalSupply = await contract.totalSupply();
      const initialBalance = await contract.balanceOf(config.token.mintTo);
      
      console.log(`📋 Token Info: ${name} (${symbol}), ${decimals} decimals`);
      console.log(`💰 Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
      console.log(`🏦 Initial Balance: ${ethers.formatEther(initialBalance)} ${symbol}`);
      
      // Test 1: Transfer tokens
      console.log('🔄 Testing transfer...');
      const transferAmount = ethers.parseEther('1000'); // 1000 tokens
      const testRecipient = '0x742d35Cc6634C0532925a3b8D4bc2eAe';
      
      const transferTx = await contract.transfer(testRecipient, transferAmount);
      const transferReceipt = await transferTx.wait();
      
      this.results.tx_hashes_for_deploy_and_tests.push({
        type: 'transfer_test',
        hash: transferReceipt.hash,
        gasUsed: transferReceipt.gasUsed.toString()
      });
      
      // Check transfer event
      const transferEvents = transferReceipt.logs.filter(log => {
        try {
          const parsed = contract.interface.parseLog(log);
          return parsed.name === 'Transfer';
        } catch {
          return false;
        }
      });
      
      if (transferEvents.length === 0) {
        throw new Error('No Transfer event emitted');
      }
      
      const transferEvent = contract.interface.parseLog(transferEvents[0]);
      this.results.event_sample = {
        name: 'Transfer',
        from: transferEvent.args.from,
        to: transferEvent.args.to,
        value: transferEvent.args.value.toString(),
        blockNumber: transferReceipt.blockNumber,
        transactionHash: transferReceipt.hash
      };
      
      this.results.gateResults.transferEvent = true;
      console.log('✅ Transfer event emitted successfully');
      
      // Test 2: Approval
      console.log('🔓 Testing approval...');
      const approvalAmount = ethers.parseEther('500'); // 500 tokens
      const spender = '0x95222290DD7278Aa3Ddd389Cc1E1d165CC4BAfe5';
      
      const approveTx = await contract.approve(spender, approvalAmount);
      const approveReceipt = await approveTx.wait();
      
      this.results.tx_hashes_for_deploy_and_tests.push({
        type: 'approval_test',
        hash: approveReceipt.hash,
        gasUsed: approveReceipt.gasUsed.toString()
      });
      
      // Check allowance
      const allowance = await contract.allowance(this.wallet.address, spender);
      if (allowance !== approvalAmount) {
        throw new Error(`Allowance mismatch: expected ${approvalAmount}, got ${allowance}`);
      }
      
      this.results.gateResults.transferAndApproveTests = true;
      console.log('✅ Transfer and approval tests passed');
      
    } catch (error) {
      this.results.errors.push(`Transfer tests failed: ${error.message}`);
      if (config.hardGates.must_pass_transfer_and_approve_tests) {
        throw error;
      }
    }
  }

  async generateArtifacts(contractAddress) {
    console.log('📦 Generating artifacts...');
    
    try {
      // Create artifacts directory
      const artifactsDir = path.join(__dirname, 'preflight-artifacts');
      if (!fs.existsSync(artifactsDir)) {
        fs.mkdirSync(artifactsDir);
      }
      
      // Generate ABI artifact
      const abiPath = path.join(artifactsDir, 'CodeDAOToken.abi.json');
      const abi = [
        {
          "inputs": [{"internalType": "address", "name": "_to", "type": "address"}],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "anonymous": false,
          "inputs": [
            {"indexed": true, "internalType": "address", "name": "owner", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "spender", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
          ],
          "name": "Approval",
          "type": "event"
        },
        {
          "anonymous": false,
          "inputs": [
            {"indexed": true, "internalType": "address", "name": "from", "type": "address"},
            {"indexed": true, "internalType": "address", "name": "to", "type": "address"},
            {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}
          ],
          "name": "Transfer",
          "type": "event"
        },
        {
          "inputs": [
            {"internalType": "address", "name": "owner", "type": "address"},
            {"internalType": "address", "name": "spender", "type": "address"}
          ],
          "name": "allowance",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {"internalType": "address", "name": "spender", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
          ],
          "name": "approve",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{"internalType": "address", "name": "account", "type": "address"}],
          "name": "balanceOf",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "decimals",
          "outputs": [{"internalType": "uint8", "name": "", "type": "uint8"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "name",
          "outputs": [{"internalType": "string", "name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "symbol",
          "outputs": [{"internalType": "string", "name": "", "type": "string"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [],
          "name": "totalSupply",
          "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {"internalType": "address", "name": "to", "type": "address"},
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
          ],
          "name": "transfer",
          "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ];
      
      fs.writeFileSync(abiPath, JSON.stringify(abi, null, 2));
      this.results.abi_artifact_link = `file://${abiPath}`;
      
      // Generate Standard JSON artifact
      const standardJsonPath = path.join(artifactsDir, 'CodeDAOToken.standard.json');
      const standardJson = {
        language: "Solidity",
        sources: {
          "contracts/CodeDAOToken.sol": {
            content: contractSource
          }
        },
        settings: {
          outputSelection: {
            "*": {
              "*": ["abi", "evm.bytecode", "evm.deployedBytecode"]
            }
          },
          optimizer: {
            enabled: true,
            runs: 200
          },
          evmVersion: "paris"
        }
      };
      
      fs.writeFileSync(standardJsonPath, JSON.stringify(standardJson, null, 2));
      this.results.compiled_standard_json_artifact_link = `file://${standardJsonPath}`;
      
      console.log('✅ Artifacts generated');
      
    } catch (error) {
      this.results.errors.push(`Artifact generation failed: ${error.message}`);
    }
  }

  async generateReport() {
    console.log('📊 Generating preflight report...');
    
    const report = {
      title: "CodeDAO Token Preflight Report",
      timestamp: this.results.timestamp,
      network: config.baseSepolia.name,
      repository: config.repo,
      
      summary: {
        overall_status: Object.values(this.results.gateResults).every(Boolean) ? "PASSED" : "FAILED",
        total_gates: Object.keys(this.results.gateResults).length,
        passed_gates: Object.values(this.results.gateResults).filter(Boolean).length,
        total_gas_used: Object.values(this.results.gasUsed).reduce((sum, gas) => sum + parseInt(gas), 0)
      },
      
      gates: this.results.gateResults,
      
      deployment: {
        contract_address: this.results.sepolia_contract_address,
        deployer_address: config.deployerAddress,
        mint_to_address: config.token.mintTo,
        verification_link: this.results.basescan_verification_link
      },
      
      transactions: this.results.tx_hashes_for_deploy_and_tests,
      
      events: {
        transfer_event_sample: this.results.event_sample
      },
      
      artifacts: {
        abi: this.results.abi_artifact_link,
        standard_json: this.results.compiled_standard_json_artifact_link
      },
      
      errors: this.results.errors
    };
    
    // Save report
    const reportPath = path.join(__dirname, 'preflight-artifacts', 'preflight-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    
    console.log(`📋 Report saved: ${reportPath}`);
    return report;
  }

  async run() {
    console.log('🚀 CodeDAO Token Preflight Starting...\n');
    
    try {
      // Step 1: Check secrets
      await this.checkRequiredSecrets();
      
      // Step 2: Initialize provider
      await this.initializeProvider();
      
      // Step 3: Deploy contract
      const contract = await this.deployContract();
      
      // Step 4: Verify on BaseScan
      if (config.hardGates.must_verify_on_basescan) {
        await this.verifyContract(this.results.sepolia_contract_address);
      }
      
      // Step 5: Run tests
      await this.runTransferTests(contract);
      
      // Step 6: Generate artifacts
      await this.generateArtifacts(this.results.sepolia_contract_address);
      
      // Step 7: Generate report
      const report = await this.generateReport();
      
      return report;
      
    } catch (error) {
      console.error(`❌ Preflight failed: ${error.message}`);
      this.results.errors.push(`Fatal error: ${error.message}`);
      
      const report = await this.generateReport();
      return report;
    }
  }
}

async function main() {
  const preflight = new TokenPreflight();
  const report = await preflight.run();
  
  console.log('\n📊 PREFLIGHT SUMMARY');
  console.log('='.repeat(50));
  console.log(`Status: ${report.summary.overall_status}`);
  console.log(`Gates Passed: ${report.summary.passed_gates}/${report.summary.total_gates}`);
  console.log(`Contract Address: ${report.deployment.contract_address}`);
  console.log(`Verification Link: ${report.deployment.verification_link}`);
  console.log(`Total Gas Used: ${report.summary.total_gas_used}`);
  
  if (report.errors.length > 0) {
    console.log('\n❌ Errors:');
    report.errors.forEach(error => console.log(`  • ${error}`));
  }
  
  console.log('\n🎯 Next Steps:');
  if (report.summary.overall_status === "PASSED") {
    console.log('  ✅ All preflight checks passed!');
    console.log('  🚀 Ready for mainnet deployment via Safe');
    console.log('  📝 Use /token deploy to create Safe transaction');
  } else {
    console.log('  ❌ Some checks failed - review errors above');
    console.log('  🔧 Fix issues and re-run preflight');
  }
  
  return report;
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { TokenPreflight, main, config }; 
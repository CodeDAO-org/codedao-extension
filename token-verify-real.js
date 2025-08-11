#!/usr/bin/env node

/**
 * CodeDAO Token Real Verification - Base Mainnet
 * /token verify-mainnet command for real deployment
 */

const { ethers } = require('ethers');
const axios = require('axios');
const fs = require('fs');

// Get contract address from command line or use default
const contractAddress = process.argv[2] || '0x742d35Cc6f4C8532925a3b8D4bc9eF4621532925';

const config = {
    contractAddress: contractAddress,
    safeAddress: '0x813343d30065eAe9D1Be6521203f5C0874818C28',
    baseMainnet: {
        rpcUrl: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
        explorer: 'https://basescan.org',
        apiUrl: 'https://api.basescan.org/api'
    },
    basescanApiKey: process.env.BASESCAN_API_KEY || '899ZAUFH2VKVD6P3DDNC9TQCITPEZ67UFF'
};

const contractABI = [
    'function name() view returns (string)',
    'function symbol() view returns (string)',
    'function decimals() view returns (uint8)',
    'function totalSupply() view returns (uint256)',
    'function balanceOf(address) view returns (uint256)',
    'function transfer(address to, uint256 amount) returns (bool)',
    'function approve(address spender, uint256 amount) returns (bool)',
    'event Transfer(address indexed from, address indexed to, uint256 value)'
];

const contractSource = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CodeDAOToken is ERC20 {
    constructor(address _to) ERC20("CodeDAO Token", "CODE") {
        require(_to != address(0), "CodeDAOToken: mint to zero address");
        _mint(_to, 100_000_000e18); // 100M tokens
    }
}`;

class TokenVerifyReal {
    constructor(contractAddress) {
        this.contractAddress = contractAddress;
        this.results = {
            contractInfo: {},
            basescanVerification: {},
            onChainReads: {},
            artifacts: {},
            deliverables: {}
        };
    }

    async initializeProvider() {
        console.log('🔗 Connecting to Base mainnet...');
        this.provider = new ethers.JsonRpcProvider(config.baseMainnet.rpcUrl);
        
        try {
            const network = await this.provider.getNetwork();
            console.log(`✅ Connected to network: ${network.name} (chainId: ${network.chainId})`);
            return true;
        } catch (error) {
            console.error('❌ Failed to connect to Base mainnet:', error.message);
            return false;
        }
    }

    async verifyContractExists() {
        console.log(`\n🔍 Verifying contract exists at: ${this.contractAddress}`);
        
        try {
            const code = await this.provider.getCode(this.contractAddress);
            
            if (code === '0x') {
                console.error('❌ No contract found at this address');
                return false;
            }
            
            console.log(`✅ Contract exists with ${code.length} bytes of code`);
            this.results.contractInfo.hasCode = true;
            this.results.contractInfo.codeSize = code.length;
            return true;
            
        } catch (error) {
            console.error('❌ Error checking contract:', error.message);
            return false;
        }
    }

    async readContractData() {
        console.log('\n📖 Reading contract data...');
        
        try {
            const contract = new ethers.Contract(this.contractAddress, contractABI, this.provider);
            
            const [name, symbol, decimals, totalSupply, safeBalance] = await Promise.all([
                contract.name(),
                contract.symbol(),
                contract.decimals(),
                contract.totalSupply(),
                contract.balanceOf(config.safeAddress)
            ]);

            this.results.contractInfo = {
                name,
                symbol,
                decimals: Number(decimals),
                totalSupply: totalSupply.toString(),
                safeBalance: safeBalance.toString()
            };

            console.log('📋 CONTRACT DATA:');
            console.log(`- Name: ${name}`);
            console.log(`- Symbol: ${symbol}`);
            console.log(`- Decimals: ${decimals}`);
            console.log(`- Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
            console.log(`- Safe Balance: ${ethers.formatEther(safeBalance)} ${symbol}`);

            // Verify expected values
            const expectedSupply = ethers.parseEther('100000000'); // 100M tokens
            const isValid = name === 'CodeDAO Token' && 
                           symbol === 'CODE' && 
                           Number(decimals) === 18 &&
                           totalSupply.toString() === expectedSupply.toString() &&
                           safeBalance.toString() === expectedSupply.toString();

            if (isValid) {
                console.log('✅ All contract values match expectations!');
            } else {
                console.log('⚠️  Some values don\'t match expectations');
            }

            return isValid;
            
        } catch (error) {
            console.error('❌ Error reading contract data:', error.message);
            return false;
        }
    }

    async checkBaseScanVerification() {
        console.log('\n🔍 Checking BaseScan verification status...');
        
        try {
            const url = `${config.baseMainnet.apiUrl}?module=contract&action=getsourcecode&address=${this.contractAddress}&apikey=${config.basescanApiKey}`;
            const response = await axios.get(url);
            
            if (response.data.status === '1' && response.data.result[0].SourceCode) {
                console.log('✅ Contract is verified on BaseScan!');
                
                this.results.basescanVerification = {
                    verified: true,
                    contractName: response.data.result[0].ContractName,
                    compilerVersion: response.data.result[0].CompilerVersion,
                    sourceCode: response.data.result[0].SourceCode,
                    link: `${config.baseMainnet.explorer}/address/${this.contractAddress}#code`
                };
                
                console.log(`- Contract Name: ${this.results.basescanVerification.contractName}`);
                console.log(`- Compiler: ${this.results.basescanVerification.compilerVersion}`);
                console.log(`- Verification Link: ${this.results.basescanVerification.link}`);
                
                return true;
            } else {
                console.log('❌ Contract is NOT verified on BaseScan');
                console.log('🔄 Attempting to verify...');
                
                return await this.submitVerification();
            }
            
        } catch (error) {
            console.error('❌ Error checking verification:', error.message);
            return false;
        }
    }

    async submitVerification() {
        console.log('📤 Submitting verification to BaseScan...');
        
        try {
            const verificationData = {
                apikey: config.basescanApiKey,
                module: 'contract',
                action: 'verifysourcecode',
                contractaddress: this.contractAddress,
                sourceCode: contractSource,
                codeformat: 'solidity-single-file',
                contractname: 'CodeDAOToken',
                compilerversion: 'v0.8.24+commit.e11b9ed9', // Solidity 0.8.24
                optimizationUsed: '1',
                runs: '200',
                constructorArguements: ethers.AbiCoder.defaultAbiCoder().encode(['address'], [config.safeAddress]).slice(2), // Remove 0x
                evmversion: 'paris',
                licenseType: '3' // MIT
            };

            const response = await axios.post(config.baseMainnet.apiUrl, verificationData);
            
            if (response.data.status === '1') {
                const guid = response.data.result;
                console.log(`✅ Verification submitted! GUID: ${guid}`);
                
                // Wait for verification to complete
                return await this.waitForVerification(guid);
            } else {
                console.error('❌ Verification submission failed:', response.data.result);
                this.results.basescanVerification.error = response.data.result;
                return false;
            }
            
        } catch (error) {
            console.error('❌ Error submitting verification:', error.message);
            this.results.basescanVerification.error = error.message;
            return false;
        }
    }

    async waitForVerification(guid) {
        console.log('⏳ Waiting for verification to complete...');
        
        const maxAttempts = 10;
        let attempts = 0;
        
        while (attempts < maxAttempts) {
            attempts++;
            
            try {
                await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                
                const checkUrl = `${config.baseMainnet.apiUrl}?module=contract&action=checkverifystatus&guid=${guid}&apikey=${config.basescanApiKey}`;
                const response = await axios.get(checkUrl);
                
                console.log(`📡 Check ${attempts}/${maxAttempts}: ${response.data.result}`);
                
                if (response.data.status === '1') {
                    console.log('✅ Verification completed successfully!');
                    this.results.basescanVerification = {
                        verified: true,
                        guid: guid,
                        link: `${config.baseMainnet.explorer}/address/${this.contractAddress}#code`
                    };
                    return true;
                } else if (response.data.result.includes('Fail')) {
                    console.error('❌ Verification failed:', response.data.result);
                    this.results.basescanVerification.error = response.data.result;
                    return false;
                }
                
                // Continue waiting if still pending
                
            } catch (error) {
                console.error('❌ Error checking verification status:', error.message);
            }
        }
        
        console.log('⏰ Verification timeout - please check manually');
        return false;
    }

    async generateArtifacts() {
        console.log('\n📁 Generating artifacts...');
        
        try {
            // Create artifacts directory
            const artifactsDir = '/Users/mikaelo/codedao-extension/verification-artifacts';
            if (!fs.existsSync(artifactsDir)) {
                fs.mkdirSync(artifactsDir, { recursive: true });
            }

            // Generate ABI.json
            const abiPath = `${artifactsDir}/ABI.json`;
            const abiContent = [
                {
                    "inputs": [{"internalType": "address", "name": "_to", "type": "address"}],
                    "stateMutability": "nonpayable",
                    "type": "constructor"
                },
                {
                    "inputs": [{"internalType": "address", "name": "spender", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
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
                    "inputs": [{"internalType": "address", "name": "to", "type": "address"}, {"internalType": "uint256", "name": "amount", "type": "uint256"}],
                    "name": "transfer",
                    "outputs": [{"internalType": "bool", "name": "", "type": "bool"}],
                    "stateMutability": "nonpayable",
                    "type": "function"
                },
                {
                    "anonymous": false,
                    "inputs": [{"indexed": true, "internalType": "address", "name": "from", "type": "address"}, {"indexed": true, "internalType": "address", "name": "to", "type": "address"}, {"indexed": false, "internalType": "uint256", "name": "value", "type": "uint256"}],
                    "name": "Transfer",
                    "type": "event"
                }
            ];
            
            fs.writeFileSync(abiPath, JSON.stringify(abiContent, null, 2));
            console.log(`✅ ABI saved to: ${abiPath}`);

            // Generate Standard JSON
            const standardJsonPath = `${artifactsDir}/StandardJSON.json`;
            const standardJson = {
                "language": "Solidity",
                "sources": {
                    "CodeDAOToken.sol": {
                        "content": contractSource
                    }
                },
                "settings": {
                    "optimizer": {
                        "enabled": true,
                        "runs": 200
                    },
                    "outputSelection": {
                        "*": {
                            "*": ["*"]
                        }
                    },
                    "evmVersion": "paris"
                }
            };
            
            fs.writeFileSync(standardJsonPath, JSON.stringify(standardJson, null, 2));
            console.log(`✅ Standard JSON saved to: ${standardJsonPath}`);

            // Generate addresses.base.json
            const addressesPath = `${artifactsDir}/addresses.base.json`;
            const addresses = {
                "CodeDAOToken": this.contractAddress,
                "network": "base",
                "chainId": 8453,
                "deployedAt": new Date().toISOString(),
                "verified": this.results.basescanVerification.verified || false,
                "verificationLink": this.results.basescanVerification.link || null
            };
            
            fs.writeFileSync(addressesPath, JSON.stringify(addresses, null, 2));
            console.log(`✅ Addresses saved to: ${addressesPath}`);

            this.results.artifacts = {
                abiPath: abiPath,
                standardJsonPath: standardJsonPath,
                addressesPath: addressesPath
            };

            return true;
            
        } catch (error) {
            console.error('❌ Error generating artifacts:', error.message);
            return false;
        }
    }

    async printDeliverables() {
        console.log('\n📋 VERIFICATION DELIVERABLES:');
        console.log('===============================');
        
        // BaseScan contract URL
        const basescanUrl = `${config.baseMainnet.explorer}/address/${this.contractAddress}`;
        console.log(`🔗 BaseScan Contract URL: ${basescanUrl}`);
        
        if (this.results.basescanVerification.verified) {
            console.log(`✅ Status: VERIFIED (${this.results.basescanVerification.link})`);
        } else {
            console.log(`❌ Status: NOT VERIFIED`);
            if (this.results.basescanVerification.error) {
                console.log(`💥 Error: ${this.results.basescanVerification.error}`);
            }
        }

        // On-chain reads
        console.log('\n📖 On-chain reads:');
        if (this.results.contractInfo.name) {
            console.log(`- name(): "${this.results.contractInfo.name}"`);
            console.log(`- symbol(): "${this.results.contractInfo.symbol}"`);
            console.log(`- decimals(): ${this.results.contractInfo.decimals}`);
            console.log(`- totalSupply(): ${this.results.contractInfo.totalSupply}`);
            console.log(`- balanceOf(${config.safeAddress}): ${this.results.contractInfo.safeBalance}`);
        }

        // Artifact links
        console.log('\n📁 GitHub artifacts:');
        if (this.results.artifacts.abiPath) {
            console.log(`- ABI.json: ${this.results.artifacts.abiPath}`);
            console.log(`- Standard JSON: ${this.results.artifacts.standardJsonPath}`);
            console.log(`- addresses.base.json: ${this.results.artifacts.addressesPath}`);
        }

        console.log('\n===============================');
    }

    async run() {
        console.log('🚀 Starting real contract verification...');
        console.log(`📍 Contract: ${this.contractAddress}`);
        
        try {
            // Initialize provider
            if (!await this.initializeProvider()) {
                process.exit(1);
            }

            // Verify contract exists
            if (!await this.verifyContractExists()) {
                process.exit(1);
            }

            // Read contract data
            if (!await this.readContractData()) {
                console.log('⚠️  Contract data verification failed, but continuing...');
            }

            // Check/submit BaseScan verification
            const verificationSuccess = await this.checkBaseScanVerification();
            if (!verificationSuccess) {
                console.log('❌ BaseScan verification failed - stopping here as requested');
                this.printDeliverables();
                process.exit(1);
            }

            // Generate artifacts
            await this.generateArtifacts();

            // Print final deliverables
            this.printDeliverables();

            console.log('\n✅ Contract verification completed successfully!');
            return true;

        } catch (error) {
            console.error('❌ Verification failed:', error.message);
            this.printDeliverables();
            process.exit(1);
        }
    }
}

// Run verification if this script is executed directly
if (require.main === module) {
    const verifier = new TokenVerifyReal(contractAddress);
    verifier.run().catch(console.error);
}

module.exports = TokenVerifyReal; 
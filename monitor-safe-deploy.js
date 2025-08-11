const axios = require('axios');
const { ethers } = require('ethers');

const config = {
    safeAddress: '0x813343d30065eAe9D1Be6521203f5C0874818C28',
    safeTxServiceUrl: 'https://safe-transaction-base.safe.global',
    baseRpcUrl: process.env.BASE_MAINNET_RPC || 'https://mainnet.base.org',
    basescanApiKey: process.env.BASESCAN_API_KEY || '899ZAUFH2VKVD6P3DDNC9TQCITPEZ67UFF',
    basescanApiUrl: 'https://api.basescan.org/api'
};

class SafeDeploymentMonitor {
    constructor() {
        this.contractAddress = null;
        this.deployTxHash = null;
        this.lastCheckedNonce = null;
        this.provider = new ethers.JsonRpcProvider(config.baseRpcUrl);
    }

    async monitorSafeTransactions() {
        console.log('🔍 Monitoring Safe transactions for contract deployment...');
        console.log('📍 Safe Address:', config.safeAddress);
        
        try {
            // Get recent transactions from Safe Tx Service
            const url = `${config.safeTxServiceUrl}/api/v1/safes/${config.safeAddress}/multisig-transactions/`;
            const response = await axios.get(url, {
                params: {
                    limit: 10,
                    executed: true,
                    ordering: '-nonce'
                }
            });

            console.log(`📦 Found ${response.data.results.length} recent executed transactions`);

            for (const tx of response.data.results) {
                // Look for contract creation transactions (to: null or empty, value: 0)
                if ((tx.to === null || tx.to === '') && tx.value === '0' && tx.isExecuted) {
                    console.log(`\n🎯 Found potential contract creation transaction:`);
                    console.log(`- Nonce: ${tx.nonce}`);
                    console.log(`- Tx Hash: ${tx.transactionHash}`);
                    console.log(`- Execution Date: ${tx.executionDate}`);
                    console.log(`- Data Length: ${tx.data ? tx.data.length : 0} chars`);

                    // Check if this tx created a contract by looking at the receipt
                    if (tx.transactionHash) {
                        await this.checkTransactionReceipt(tx.transactionHash, tx.nonce);
                    }
                }
            }

            if (!this.contractAddress) {
                console.log('\n⏳ No contract deployment found yet. Will continue monitoring...');
                return false;
            }

            return true;

        } catch (error) {
            console.error('❌ Error monitoring Safe transactions:', error.message);
            return false;
        }
    }

    async checkTransactionReceipt(txHash, nonce) {
        try {
            console.log(`\n🔍 Checking transaction receipt for ${txHash}...`);
            
            const receipt = await this.provider.getTransactionReceipt(txHash);
            
            if (receipt && receipt.contractAddress) {
                console.log(`\n🎉 CONTRACT DEPLOYED!`);
                console.log(`📍 Contract Address: ${receipt.contractAddress}`);
                console.log(`📝 Deploy Tx Hash: ${txHash}`);
                console.log(`⛽ Gas Used: ${receipt.gasUsed.toString()}`);
                console.log(`🏷️  Safe Nonce: ${nonce}`);

                this.contractAddress = receipt.contractAddress;
                this.deployTxHash = txHash;

                // Verify it's our CodeDAO Token by checking the code
                await this.verifyContractCode(receipt.contractAddress);
                
                return true;
            }

        } catch (error) {
            console.error(`❌ Error checking receipt for ${txHash}:`, error.message);
        }
        
        return false;
    }

    async verifyContractCode(address) {
        try {
            const code = await this.provider.getCode(address);
            if (code && code !== '0x') {
                console.log(`✅ Contract has bytecode (${code.length} chars)`);
                
                // Try to call name() to verify it's our token
                try {
                    const contract = new ethers.Contract(address, [
                        'function name() view returns (string)',
                        'function symbol() view returns (string)',
                        'function totalSupply() view returns (uint256)',
                        'function balanceOf(address) view returns (uint256)'
                    ], this.provider);

                    const [name, symbol, totalSupply, safeBalance] = await Promise.all([
                        contract.name(),
                        contract.symbol(),
                        contract.totalSupply(),
                        contract.balanceOf(config.safeAddress)
                    ]);

                    console.log(`\n📋 CONTRACT VERIFICATION:`);
                    console.log(`- Name: ${name}`);
                    console.log(`- Symbol: ${symbol}`);
                    console.log(`- Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
                    console.log(`- Safe Balance: ${ethers.formatEther(safeBalance)} ${symbol}`);

                    if (name === 'CodeDAO Token' && symbol === 'CODE') {
                        console.log(`\n✅ CONFIRMED: This is our CodeDAO Token deployment!`);
                        return true;
                    } else {
                        console.log(`\n⚠️  WARNING: Contract name/symbol doesn't match expected values`);
                        return false;
                    }

                } catch (contractError) {
                    console.log(`⚠️  Could not read contract methods:`, contractError.message);
                    return false;
                }
            } else {
                console.log(`❌ No bytecode found at address ${address}`);
                return false;
            }
        } catch (error) {
            console.error(`❌ Error verifying contract code:`, error.message);
            return false;
        }
    }

    async triggerVerificationSequence() {
        if (!this.contractAddress) {
            console.log('❌ No contract address available for verification');
            return;
        }

        console.log(`\n🚀 TRIGGERING VERIFICATION SEQUENCE FOR: ${this.contractAddress}`);
        
        // Step 1: Verify on BaseScan
        console.log('\n1️⃣ Starting BaseScan verification...');
        await this.runTokenVerifyMainnet();
        
        // Step 2: Canary transfer (after verification)
        console.log('\n2️⃣ Running canary transfer...');
        await this.runTokenCanaryTransfer();
        
        // Step 3: Publish PRs
        console.log('\n3️⃣ Publishing to websites...');
        await this.runTokenPublish();
    }

    async runTokenVerifyMainnet() {
        try {
            console.log('🔍 Running /token verify-mainnet...');
            
            // Import and run the verification script
            const { spawn } = require('child_process');
            
            return new Promise((resolve, reject) => {
                const verify = spawn('node', [
                    '/Users/mikaelo/codedao-extension/token-verify-real.js',
                    this.contractAddress
                ], {
                    stdio: 'inherit',
                    cwd: '/Users/mikaelo/codedao-extension'
                });

                verify.on('close', (code) => {
                    if (code === 0) {
                        console.log('✅ Verification completed');
                        resolve();
                    } else {
                        console.log(`❌ Verification failed with code ${code}`);
                        reject(new Error(`Verification failed`));
                    }
                });
            });

        } catch (error) {
            console.error('❌ Verification error:', error.message);
            throw error;
        }
    }

    async runTokenCanaryTransfer() {
        try {
            console.log('🐦 Running /token canary-transfer...');
            
            const { spawn } = require('child_process');
            
            return new Promise((resolve, reject) => {
                const canary = spawn('node', [
                    '/Users/mikaelo/codedao-extension/token-canary-real.js',
                    this.contractAddress
                ], {
                    stdio: 'inherit',
                    cwd: '/Users/mikaelo/codedao-extension'
                });

                canary.on('close', (code) => {
                    if (code === 0) {
                        console.log('✅ Canary transfer completed');
                        resolve();
                    } else {
                        console.log(`❌ Canary transfer failed with code ${code}`);
                        resolve(); // Don't fail the whole process
                    }
                });
            });

        } catch (error) {
            console.error('❌ Canary transfer error:', error.message);
        }
    }

    async runTokenPublish() {
        try {
            console.log('📄 Running /token publish...');
            
            const { spawn } = require('child_process');
            
            return new Promise((resolve, reject) => {
                const publish = spawn('node', [
                    '/Users/mikaelo/codedao-extension/token-publish-real.js',
                    this.contractAddress
                ], {
                    stdio: 'inherit',
                    cwd: '/Users/mikaelo/codedao-extension'
                });

                publish.on('close', (code) => {
                    if (code === 0) {
                        console.log('✅ Publishing completed');
                        resolve();
                    } else {
                        console.log(`❌ Publishing failed with code ${code}`);
                        resolve(); // Don't fail the whole process
                    }
                });
            });

        } catch (error) {
            console.error('❌ Publishing error:', error.message);
        }
    }

    async startMonitoring() {
        console.log('🚀 Starting Safe deployment monitoring...');
        
        const maxAttempts = 60; // Monitor for 30 minutes (30s intervals)
        let attempts = 0;

        const checkInterval = setInterval(async () => {
            attempts++;
            console.log(`\n📡 Check #${attempts}/${maxAttempts} (${new Date().toISOString()})`);
            
            const deploymentFound = await this.monitorSafeTransactions();
            
            if (deploymentFound) {
                clearInterval(checkInterval);
                console.log('\n🎯 Deployment detected! Starting verification sequence...');
                await this.triggerVerificationSequence();
                console.log('\n🏁 Monitoring complete!');
            } else if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.log('\n⏰ Monitoring timeout reached. Please check manually.');
            }
        }, 30000); // Check every 30 seconds

        // Also do an immediate check
        const immediateCheck = await this.monitorSafeTransactions();
        if (immediateCheck) {
            clearInterval(checkInterval);
            console.log('\n🎯 Deployment already found! Starting verification sequence...');
            await this.triggerVerificationSequence();
            console.log('\n🏁 Monitoring complete!');
        }
    }
}

// Start monitoring if this script is run directly
if (require.main === module) {
    const monitor = new SafeDeploymentMonitor();
    monitor.startMonitoring().catch(console.error);
}

module.exports = SafeDeploymentMonitor; 
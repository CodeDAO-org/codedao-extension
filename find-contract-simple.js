const { ethers } = require('ethers');

async function findContractFromFactoryTx() {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const safeAddress = '0x813343d30065eAe9D1Be6521203f5C0874818C28';
    const factoryAddress = '0x0000000000FFe8B47B3e2130213B802212439497';
    
    console.log('🔍 Scanning for factory transactions from your Safe...');
    console.log('Safe Address:', safeAddress);
    console.log('Factory Address:', factoryAddress);
    
    const latestBlock = await provider.getBlockNumber();
    console.log('Latest block:', latestBlock);
    
    // Look for transactions from your Safe TO the factory
    for (let i = latestBlock; i > latestBlock - 500; i--) {
        try {
            const block = await provider.getBlock(i, true);
            if (!block || !block.transactions) continue;
            
            for (const tx of block.transactions) {
                // Check if transaction is FROM your Safe TO the factory
                if (tx.from && tx.from.toLowerCase() === safeAddress.toLowerCase() &&
                    tx.to && tx.to.toLowerCase() === factoryAddress.toLowerCase()) {
                    
                    console.log(`🎯 Found factory transaction: ${tx.hash}`);
                    console.log(`Block: ${i}`);
                    console.log(`Time: ${new Date(block.timestamp * 1000).toLocaleString()}`);
                    
                    // Get the transaction receipt to see what happened
                    const receipt = await provider.getTransactionReceipt(tx.hash);
                    if (receipt) {
                        console.log('Transaction Status:', receipt.status === 1 ? 'SUCCESS' : 'FAILED');
                        console.log('Gas Used:', receipt.gasUsed.toString());
                        console.log('Number of logs:', receipt.logs.length);
                        
                        // Check each log address to see if it's a contract
                        for (let j = 0; j < receipt.logs.length; j++) {
                            const log = receipt.logs[j];
                            console.log(`Log ${j}: ${log.address}`);
                            
                            // Skip the factory itself
                            if (log.address.toLowerCase() === factoryAddress.toLowerCase()) {
                                continue;
                            }
                            
                            // Check if this address has contract code
                            const code = await provider.getCode(log.address);
                            if (code && code !== '0x' && code.length > 100) {
                                console.log(`  📋 Contract found at: ${log.address}`);
                                console.log(`  📋 Bytecode length: ${code.length}`);
                                
                                // Try to read it as an ERC20 token
                                try {
                                    const contract = new ethers.Contract(log.address, [
                                        'function name() view returns (string)',
                                        'function symbol() view returns (string)',
                                        'function decimals() view returns (uint8)',
                                        'function totalSupply() view returns (uint256)',
                                        'function balanceOf(address) view returns (uint256)'
                                    ], provider);
                                    
                                    const [name, symbol, decimals, totalSupply, safeBalance] = await Promise.all([
                                        contract.name(),
                                        contract.symbol(),
                                        contract.decimals(),
                                        contract.totalSupply(),
                                        contract.balanceOf(safeAddress)
                                    ]);
                                    
                                    console.log(`  ✅ Token Details:`);
                                    console.log(`    Name: ${name}`);
                                    console.log(`    Symbol: ${symbol}`);
                                    console.log(`    Decimals: ${decimals}`);
                                    console.log(`    Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
                                    console.log(`    Safe Balance: ${ethers.formatEther(safeBalance)} ${symbol}`);
                                    
                                    // Check if this is our CodeDAO Token
                                    if (name === 'CodeDAO Token' && symbol === 'CODE') {
                                        console.log('🚀🚀🚀 FOUND YOUR CODEDAO TOKEN! 🚀🚀🚀');
                                        console.log('Contract Address:', log.address);
                                        console.log('Deploy Transaction:', tx.hash);
                                        
                                        return {
                                            contractAddress: log.address,
                                            deployTxHash: tx.hash,
                                            name,
                                            symbol,
                                            decimals,
                                            totalSupply: ethers.formatEther(totalSupply),
                                            safeBalance: ethers.formatEther(safeBalance)
                                        };
                                    } else {
                                        console.log(`    ❌ This is not CodeDAO Token (it's ${name}/${symbol})`);
                                    }
                                } catch (tokenError) {
                                    console.log(`  ❌ Not a valid ERC20 token: ${tokenError.message}`);
                                }
                            } else {
                                console.log(`  ⚪ No contract code at: ${log.address}`);
                            }
                        }
                        
                        console.log('---');
                    }
                }
            }
            
            if (i % 100 === 0) {
                console.log(`Scanned up to block ${i}...`);
            }
            
        } catch (e) {
            // Skip problematic blocks
            continue;
        }
    }
    
    console.log('❌ No factory transactions found in recent blocks');
    return null;
}

if (require.main === module) {
    findContractFromFactoryTx()
        .then(result => {
            if (result) {
                console.log('\n🎉 SUCCESS! Your token details:');
                console.log('Contract Address:', result.contractAddress);
                console.log('Deploy Tx Hash:', result.deployTxHash);
                console.log('Name:', result.name);
                console.log('Symbol:', result.symbol);
                console.log('Total Supply:', result.totalSupply, result.symbol);
                console.log('Safe Balance:', result.safeBalance, result.symbol);
            } else {
                console.log('\n❌ Token not found in recent transactions');
            }
        })
        .catch(console.error);
}

module.exports = findContractFromFactoryTx; 
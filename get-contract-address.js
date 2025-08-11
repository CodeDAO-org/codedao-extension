const { ethers } = require('ethers');

const txHash = '0xdf4714cf33b1968393526a22d9757c04ef1f780b6a8856f1c6a096d63008da1e';
const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');

async function getContractAddress() {
    try {
        console.log(`🔍 Getting transaction receipt for: ${txHash}`);
        
        const receipt = await provider.getTransactionReceipt(txHash);
        
        if (receipt) {
            console.log('\n📋 TRANSACTION RECEIPT:');
            console.log(`- Transaction Hash: ${receipt.hash}`);
            console.log(`- Block Number: ${receipt.blockNumber}`);
            console.log(`- Gas Used: ${receipt.gasUsed.toString()}`);
            console.log(`- Status: ${receipt.status === 1 ? 'Success' : 'Failed'}`);
            
            if (receipt.contractAddress) {
                console.log(`\n🎉 CONTRACT DEPLOYED!`);
                console.log(`📍 Contract Address: ${receipt.contractAddress}`);
                
                // Verify it's our token
                const contract = new ethers.Contract(receipt.contractAddress, [
                    'function name() view returns (string)',
                    'function symbol() view returns (string)',
                    'function totalSupply() view returns (uint256)',
                    'function balanceOf(address) view returns (uint256)'
                ], provider);
                
                const [name, symbol, totalSupply, safeBalance] = await Promise.all([
                    contract.name(),
                    contract.symbol(), 
                    contract.totalSupply(),
                    contract.balanceOf('0x813343d30065eAe9D1Be6521203f5C0874818C28')
                ]);
                
                console.log(`\n✅ TOKEN VERIFICATION:`);
                console.log(`- Name: ${name}`);
                console.log(`- Symbol: ${symbol}`);
                console.log(`- Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
                console.log(`- Safe Balance: ${ethers.formatEther(safeBalance)} ${symbol}`);
                
                return receipt.contractAddress;
            } else {
                console.log('❌ No contract address in receipt - this was not a contract creation');
                return null;
            }
        } else {
            console.log('❌ Transaction receipt not found');
            return null;
        }
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        return null;
    }
}

getContractAddress().then(address => {
    if (address) {
        console.log(`\n🚀 READY FOR VERIFICATION COMMANDS:`);
        console.log(`Contract Address: ${address}`);
        console.log(`\nNext steps:`);
        console.log(`1. /token verify-mainnet address = ${address}`);
        console.log(`2. /token canary-transfer address = ${address}`);
        console.log(`3. /token publish address = ${address}`);
    }
}).catch(console.error); 
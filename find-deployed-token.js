const { ethers } = require('ethers');

async function findDeployedToken() {
    const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    const safeAddress = '0x813343d30065eAe9D1Be6521203f5C0874818C28';
    const factoryAddress = '0x0000000000FFe8B47B3e2130213B802212439497';
    
    // The exact init code from our factory setup
    const initCode = '0x608060405234801561001057600080fd5b506040516200115338038062001153833981810160405281019061003491906100f7565b6040518060400160405280600d81526020017f436f646544414f20546f6b656e000000000000000000000000000000000000008152506040518060400160405280600481526020017f434f44450000000000000000000000000000000000000000000000000000008152508160039081610092919061033a565b5080600490816100a2919061033a565b5050506000811690506100ba81610147565b6100f0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100e7906104c8565b60405180910390fd5b6100ff816a52b7d2dcc80cd2e4000000610218565b505061058e565b60008151905061010c81610577565b92915050565b60006020828403121561012857610127610572565b5b6000610136848285016100fd565b91505092915050565b600061014a82610155565b9050919050565b60008073ffffffffffffffffffffffffffffffffffffffff1682169050919050565b6000610180600083610298565b915061018b826105a5565b600082019050919050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061020f57601f821691505b602082108103610222576102216101c8565b5b50919050565b600081905092915050565b60008190508160005260206000209050919050565b600081546102558161020f565b61025f8186610228565b94506001821660008114610278576001811461028d576102c0565b60ff19831686528115158202860193506102c0565b61029685610233565b60005b838110156102b857815481890152600082019150602081019050610299565b838801955050505b50505092915050565b60006102d482610173565b6102de8185610228565b93506102ee8185602086016102f9565b80840191505092915050565b60005b838110156103175780820151818401526020810190506102fc565b60008484015250505050565b600061032f8284610248565b915081905092915050565b600061034682610173565b6103508185610298565b93506103608185602086016102f9565b610369816103a9565b840191505092915050565b600082825260208201905092915050565b600061039082610173565b61039a8185610374565b93506103aa8185602086016102f9565b6103b3816103a9565b840191505092915050565b600060208201905081810360008301526103d88184610385565b905092915050565b60006103eb82610196565b9050919050565b6103fb816103e0565b811461040657600080fd5b50565b600081519050610418816103f2565b92915050565b60006020828403121561043457610433610572565b5b600061044284828501610409565b91505092915050565b7f436f646544414f546f6b656e3a206d696e7420746f207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b60006104a7602383610374565b91506104b28261044b565b604082019050919050565b600060208201905081810360008301526104d68161049a565b9050919050565b600080fd5b600080fd5b6105058161013f565b811461051057600080fd5b50565b600081519050610522816104fc565b92915050565b60006020828403121561053e5761053d6104dd565b5b600061054c84828501610513565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061059082610196565b915061059b83610196565b92508282039050818111156105b3576105b2610555565b5b92915050565b60006105c482610196565b91506105cf83610196565b92508282019050808211156105e7576105e6610555565b5b92915050565b6105f6816103e0565b811461060157600080fd5b50565b600081519050610613816105ed565b92915050565b60006020828403121561062f5761062e6104dd565b5b600061063d84828501610604565b91505092915050565b610c8f80610655000396000f3fe000000000000000000000000813343d30065eae9d1be6521203f5c0874818c28';
    const salt = '0x0000000000000000000000000000000000000000000000000000000000000001';
    
    console.log('🔍 Calculating predicted CREATE2 address...');
    console.log('Factory:', factoryAddress);
    console.log('Salt:', salt);
    console.log('Init code length:', initCode.length, 'chars');
    
    try {
        // Use ethers.js keccak256 for proper EVM-compatible hash
        const initCodeHash = ethers.keccak256(initCode);
        console.log('Init code hash (keccak256):', initCodeHash);
        
        // Use ethers.js CREATE2 calculation (which is correct for EVM)
        const predictedAddress = ethers.getCreate2Address(factoryAddress, salt, initCodeHash);
        console.log('Predicted address:', predictedAddress);
        
        // Check if contract exists
        const code = await provider.getCode(predictedAddress);
        if (code && code !== '0x') {
            console.log('🎉 CONTRACT EXISTS!');
            console.log('Contract bytecode length:', code.length);
            
            // Verify it's our token
            const contract = new ethers.Contract(predictedAddress, [
                'function name() view returns (string)',
                'function symbol() view returns (string)',
                'function decimals() view returns (uint8)',
                'function totalSupply() view returns (uint256)',
                'function balanceOf(address) view returns (uint256)'
            ], provider);
            
            try {
                const [name, symbol, decimals, totalSupply, safeBalance] = await Promise.all([
                    contract.name(),
                    contract.symbol(),
                    contract.decimals(),
                    contract.totalSupply(),
                    contract.balanceOf(safeAddress)
                ]);
                
                console.log('✅ TOKEN VERIFICATION:');
                console.log('Name:', name);
                console.log('Symbol:', symbol);
                console.log('Decimals:', decimals);
                console.log('Total Supply:', ethers.formatEther(totalSupply), symbol);
                console.log('Safe Balance:', ethers.formatEther(safeBalance), symbol);
                
                if (name === 'CodeDAO Token' && symbol === 'CODE') {
                    console.log('🚀🚀🚀 CODEDAO TOKEN FOUND! 🚀🚀🚀');
                    console.log('Contract Address:', predictedAddress);
                    
                    // Return for further processing
                    return predictedAddress;
                } else {
                    console.log('❌ Wrong token at this address');
                }
            } catch (e) {
                console.log('❌ Error reading contract:', e.message);
            }
        } else {
            console.log('❌ No contract at predicted address');
            
            // Since you have a balance, let's check the Safe's token balance directly
            console.log('🔍 Checking Safe for any ERC20 tokens...');
            
            // Get recent transactions and look for token transfers TO the Safe
            const latestBlock = await provider.getBlockNumber();
            console.log('Checking recent blocks for token transfers...');
            
            for (let i = latestBlock; i > latestBlock - 200; i--) {
                try {
                    const block = await provider.getBlock(i, true);
                    if (!block || !block.transactions) continue;
                    
                    for (const tx of block.transactions) {
                        if (tx.to && tx.to.toLowerCase() === factoryAddress.toLowerCase()) {
                            console.log(`Found factory tx: ${tx.hash} in block ${i}`);
                            
                            const receipt = await provider.getTransactionReceipt(tx.hash);
                            if (receipt && receipt.logs) {
                                for (const log of receipt.logs) {
                                    // Check if any log address is a contract with our token
                                    const code = await provider.getCode(log.address);
                                    if (code && code !== '0x' && log.address !== factoryAddress) {
                                        try {
                                            const contract = new ethers.Contract(log.address, [
                                                'function name() view returns (string)',
                                                'function symbol() view returns (string)',
                                                'function totalSupply() view returns (uint256)',
                                                'function balanceOf(address) view returns (uint256)'
                                            ], provider);
                                            
                                            const [name, symbol, totalSupply, safeBalance] = await Promise.all([
                                                contract.name(),
                                                contract.symbol(),
                                                contract.totalSupply(),
                                                contract.balanceOf(safeAddress)
                                            ]);
                                            
                                            if (name === 'CodeDAO Token' && symbol === 'CODE') {
                                                console.log('🚀🚀🚀 FOUND YOUR TOKEN IN LOGS! 🚀🚀🚀');
                                                console.log('Contract Address:', log.address);
                                                console.log('Deploy Tx Hash:', tx.hash);
                                                console.log('Total Supply:', ethers.formatEther(totalSupply), symbol);
                                                console.log('Safe Balance:', ethers.formatEther(safeBalance), symbol);
                                                return log.address;
                                            }
                                        } catch (e) {
                                            // Not a token contract
                                        }
                                    }
                                }
                            }
                        }
                    }
                    
                    if (i % 50 === 0) console.log(`Checked block ${i}...`);
                } catch (e) {
                    continue;
                }
            }
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
    }
    
    return null;
}

if (require.main === module) {
    findDeployedToken().catch(console.error);
}

module.exports = findDeployedToken; 
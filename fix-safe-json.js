const { ethers } = require('ethers');
const fs = require('fs');
const crypto = require('crypto');

// Configuration
const config = {
    safeAddress: '0x813343d30065eAe9D1Be6521203f5C0874818C28',
    chainId: '8453',
    name: 'CodeDAO Token',
    symbol: 'CODE'
};

// Contract bytecode from compilation (without constructor args)
const contractBytecode = "0x608060405234801561001057600080fd5b506040516200115338038062001153833981810160405281019061003491906100f7565b6040518060400160405280600d81526020017f436f646544414f20546f6b656e000000000000000000000000000000000000008152506040518060400160405280600481526020017f434f44450000000000000000000000000000000000000000000000000000008152508160039081610092919061033a565b5080600490816100a2919061033a565b5050506000811690506100ba81610147565b6100f0576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100e7906104c8565b60405180910390fd5b6100ff816a52b7d2dcc80cd2e4000000610218565b505061058e565b60008151905061010c81610577565b92915050565b60006020828403121561012857610127610572565b5b6000610136848285016100fd565b91505092915050565b600061014a82610155565b9050919050565b60008073ffffffffffffffffffffffffffffffffffffffff1682169050919050565b6000610180600083610298565b915061018b826105a5565b600082019050919050565b6000819050919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b6000600282049050600182168061020f57601f821691505b602082108103610222576102216101c8565b5b50919050565b600081905092915050565b60008190508160005260206000209050919050565b600081546102558161020f565b61025f8186610228565b94506001821660008114610278576001811461028d576002c0565b60ff19831686528115158202860193506102c0565b61029685610233565b60005b838110156102b857815481890152600182019150602081019050610299565b838801955050505b50505092915050565b60006102d482610173565b6102de8185610228565b93506102ee8185602086016102f9565b80840191505092915050565b60005b838110156103175780820151818401526020810190506102fc565b60008484015250505050565b600061032f8284610248565b915081905092915050565b600061034682610173565b6103508185610298565b93506103608185602086016102f9565b610369816103a9565b840191505092915050565b600082825260208201905092915050565b600061039082610173565b61039a8185610374565b93506103aa8185602086016102f9565b6103b3816103a9565b840191505092915050565b600060208201905081810360008301526103d88184610385565b905092915050565b60006103eb82610196565b9050919050565b6103fb816103e0565b811461040657600080fd5b50565b600081519050610418816103f2565b92915050565b60006020828403121561043457610433610572565b5b600061044284828501610409565b91505092915050565b7f436f646544414f546f6b656e3a206d696e7420746f207a65726f206164647260008201527f6573730000000000000000000000000000000000000000000000000000000000602082015250565b60006104a7602383610374565b91506104b28261044b565b604082019050919050565b600060208201905081810360008301526104d68161049a565b9050919050565b600080fd5b600080fd5b6105058161013f565b811461051057600080fd5b50565b600081519050610522816104fc565b92915050565b60006020828403121561053e5761053d6104dd565b5b600061054c84828501610513565b91505092915050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fd5b600061059082610196565b915061059b83610196565b92508282039050818111156105b3576105b2610555565b5b92915050565b60006105c482610196565b91506105cf83610196565b92508282019050808211156105e7576105e6610555565b5b92915050565b6105f6816103e0565b811461060157600080fd5b50565b600081519050610613816105ed565b92915050565b60006020828403121561062f5761062e6104dd565b5b600061063d84828501610604565b91505092915050565b610c8f80610655000396000f3fe";

// ABI for constructor
const constructorABI = [
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "_to",
                "type": "address"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "constructor"
    }
];

function generateCorrectSafeJSON() {
    console.log('🔧 Generating corrected Safe Transaction Builder JSON...');
    
    // ABI encode the constructor argument
    const abiCoder = new ethers.AbiCoder();
    const encodedConstructorArgs = abiCoder.encode(['address'], [config.safeAddress]);
    
    console.log('📝 Safe Address:', config.safeAddress);
    console.log('🔢 Encoded Constructor Args:', encodedConstructorArgs);
    
    // Remove 0x prefix from both bytecode and encoded args, then combine
    const bytecodeHex = contractBytecode.slice(2);
    const constructorArgsHex = encodedConstructorArgs.slice(2);
    const fullInitCode = '0x' + bytecodeHex + constructorArgsHex;
    
    console.log('📦 Full InitCode Length:', fullInitCode.length);
    console.log('📏 InitCode Byte Length:', (fullInitCode.length - 2) / 2);
    
    // Get last 40 hex chars (should be the Safe address in lowercase)
    const last40Chars = fullInitCode.slice(-40);
    console.log('🎯 Last 40 hex chars:', last40Chars);
    console.log('✅ Expected Safe addr (lowercase):', config.safeAddress.toLowerCase().slice(2));
    console.log('🔍 Address match:', last40Chars === config.safeAddress.toLowerCase().slice(2));
    
    // Calculate SHA256
    const initCodeBuffer = Buffer.from(fullInitCode.slice(2), 'hex');
    const sha256Hash = crypto.createHash('sha256').update(initCodeBuffer).digest('hex');
    console.log('🔐 SHA256 hash:', sha256Hash);
    
    // Generate the Safe Transaction Builder JSON
    const safeTransactionJSON = {
        "version": "1.0",
        "chainId": config.chainId,
        "createdAt": Date.now(),
        "meta": {
            "name": "CodeDAO Token Deploy",
            "description": `Deploy ${config.name} (${config.symbol}) with 100M supply to Safe`,
            "txBuilderVersion": "1.16.3",
            "createdFromSafeAddress": config.safeAddress,
            "createdFromOwnerAddress": "",
            "checksum": ""
        },
        "transactions": [
            {
                "to": "0x0000000000000000000000000000000000000000",
                "value": "0",
                "data": fullInitCode,
                "contractCreation": true,
                "operation": 0,
                "contractMethod": {
                    "inputs": [
                        {
                            "name": "_to",
                            "type": "address",
                            "internalType": "address"
                        }
                    ],
                    "name": "constructor",
                    "payable": false
                },
                "contractInputsValues": {
                    "_to": config.safeAddress
                }
            }
        ]
    };
    
    // Save to file
    const outputPath = '/Users/mikaelo/codedao-extension/safe/tx-code-token.json';
    
    // Create safe directory if it doesn't exist
    const fs = require('fs');
    const path = require('path');
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, JSON.stringify(safeTransactionJSON, null, 2));
    
    console.log('\n✅ Generated corrected Safe Transaction Builder JSON');
    console.log('📁 Saved to:', outputPath);
    
    // Display integrity info
    console.log('\n📋 INTEGRITY INFO:');
    console.log('- chainId:', config.chainId);
    console.log('- operation: 0 (contract creation)');
    console.log('- to: 0x0000000000000000000000000000000000000000');
    console.log('- value: 0');
    console.log('- constructor arg:', config.safeAddress);
    console.log('- initCode byte length:', (fullInitCode.length - 2) / 2);
    console.log('- sha256(initCode):', sha256Hash);
    console.log('- last 40 hex chars:', last40Chars);
    console.log('- address verification:', last40Chars === config.safeAddress.toLowerCase().slice(2) ? '✅ MATCH' : '❌ MISMATCH');
    
    return {
        json: safeTransactionJSON,
        integrity: {
            byteLength: (fullInitCode.length - 2) / 2,
            sha256: sha256Hash,
            last40Chars: last40Chars,
            addressMatch: last40Chars === config.safeAddress.toLowerCase().slice(2)
        }
    };
}

// Run the generation
const result = generateCorrectSafeJSON();
console.log('\n🚀 Ready for Safe import!'); 
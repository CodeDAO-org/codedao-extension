#!/usr/bin/env node

/**
 * 🎯 CodeDAO Epoch Builder - Manual Fast-Path
 * Generates cumulative Merkle trees for real claims
 */

const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { ethers } = require('ethers');
const fs = require('fs');

// Epoch 1 - Manual test data (150 CODE for testing)
// IMPORTANT: Using EOAs for browser MetaMask claims, not Safe address
const EPOCH_1_DATA = [
    {
        address: "0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9", // Deployer EOA - for browser testing
        cumulative: ethers.parseEther("100") // 100 CODE
    },
    {
        address: "0x813343d30065eAe9D1Be6521203f5C0874818C28", // Safe - for reference (can claim via Safe app)
        cumulative: ethers.parseEther("50") // 50 CODE
    }
];

function generateMerkleTree(epochData) {
    console.log('🌳 Generating Merkle tree for epoch...');
    
    // Create leaves: hash(address, cumulativeAmount)
    const leaves = epochData.map(({ address, cumulative }) => {
        return keccak256(
            ethers.solidityPacked(
                ['address', 'uint256'],
                [address, cumulative]
            )
        );
    });
    
    // Build tree
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    
    console.log(`📊 Generated tree with ${leaves.length} leaves`);
    console.log(`🌳 Root: ${root}`);
    
    // Generate proofs for each address
    const proofs = {};
    epochData.forEach(({ address, cumulative }, index) => {
        const leaf = leaves[index];
        const proof = tree.getHexProof(leaf);
        proofs[address] = {
            cumulative: cumulative.toString(),
            proof: proof
        };
        console.log(`✓ Proof for ${address}: ${proof.length} elements`);
    });
    
    return {
        root,
        totalAmount: epochData.reduce((sum, { cumulative }) => sum + cumulative, 0n).toString(),
        proofs,
        leaves: epochData.length
    };
}

function buildEpoch(epochId, epochData) {
    console.log(`🚀 Building Epoch ${epochId}...`);
    console.log(`📅 Timestamp: ${new Date().toISOString()}`);
    
    const merkleData = generateMerkleTree(epochData);
    
    const epoch = {
        epochId: epochId,
        timestamp: new Date().toISOString(),
        description: `Epoch ${epochId} - Manual Test Data`,
        merkleRoot: merkleData.root,
        totalAmount: merkleData.totalAmount,
        totalClaims: epochData.length,
        claims: {}
    };
    
    // Add claims data
    epochData.forEach(({ address, cumulative }) => {
        epoch.claims[address] = {
            cumulative: cumulative.toString(),
            proof: merkleData.proofs[address].proof
        };
    });
    
    return epoch;
}

function saveEpoch(epoch) {
    // Ensure epochs directory exists
    const epochsDir = './epochs';
    if (!fs.existsSync(epochsDir)) {
        fs.mkdirSync(epochsDir, { recursive: true });
    }
    
    // Save epoch file
    const filename = `epoch-${epoch.epochId.toString().padStart(4, '0')}.json`;
    const filepath = `${epochsDir}/${filename}`;
    
    fs.writeFileSync(filepath, JSON.stringify(epoch, null, 2));
    console.log(`💾 Saved epoch to: ${filepath}`);
    
    // Also save to public location for Claim Hub
    const publicPath = `./claim-data/${filename}`;
    const publicDir = './claim-data';
    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }
    fs.writeFileSync(publicPath, JSON.stringify(epoch, null, 2));
    console.log(`🌐 Saved public claim data to: ${publicPath}`);
    
    return filepath;
}

function generateSafeTransactionData(epoch) {
    console.log('\n🔐 Generating Safe Transaction Data...');
    
    const transactions = [
        {
            to: "0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C", // CODE Token
            value: "0",
            data: null,
            method: "transfer",
            parameters: {
                to: "0x36653EFf30fa88765Cf12199A009DdcB2cF724a0", // EpochDistributor
                amount: epoch.totalAmount
            },
            description: `Fund EpochDistributor with ${ethers.formatEther(epoch.totalAmount)} CODE`
        },
        {
            to: "0x36653EFf30fa88765Cf12199A009DdcB2cF724a0", // EpochDistributor
            value: "0", 
            data: null,
            method: "setRoot",
            parameters: {
                epochId: epoch.epochId,
                merkleRoot: epoch.merkleRoot,
                totalAmount: epoch.totalAmount
            },
            description: `Set Merkle root for Epoch ${epoch.epochId}`
        }
    ];
    
    console.log('📋 Safe Transactions:');
    transactions.forEach((tx, i) => {
        console.log(`${i + 1}. ${tx.description}`);
        console.log(`   To: ${tx.to}`);
        console.log(`   Method: ${tx.method}`);
        console.log(`   Parameters:`, tx.parameters);
    });
    
    // Save transaction data
    const txFile = `./epochs/epoch-${epoch.epochId}-safe-transactions.json`;
    fs.writeFileSync(txFile, JSON.stringify(transactions, null, 2));
    console.log(`💾 Saved Safe transactions to: ${txFile}`);
    
    return transactions;
}

async function main() {
    console.log('🎯 CodeDAO Epoch Builder - Manual Fast-Path');
    console.log('═══════════════════════════════════════════════');
    
    try {
        // Build Epoch 1
        const epoch1 = buildEpoch(1, EPOCH_1_DATA);
        const filepath = saveEpoch(epoch1);
        const transactions = generateSafeTransactionData(epoch1);
        
        console.log('\n✅ SUCCESS!');
        console.log('═══════════════════════════════════════════════');
        console.log(`📁 Epoch file: ${filepath}`);
        console.log(`🌳 Merkle root: ${epoch1.merkleRoot}`);
        console.log(`💰 Total amount: ${ethers.formatEther(epoch1.totalAmount)} CODE`);
        console.log(`👥 Total claims: ${epoch1.totalClaims}`);
        
        console.log('\n🔐 NEXT STEPS:');
        console.log('1. Fund EpochDistributor with CODE tokens via Safe');
        console.log('2. Set Merkle root via Safe (see generated transactions)');
        console.log('3. Update Claim Hub to use this epoch data');
        console.log('4. Test claims on Base mainnet');
        
        console.log('\n📋 CLAIM TEST DATA:');
        Object.entries(epoch1.claims).forEach(([address, data]) => {
            console.log(`${address}: ${ethers.formatEther(data.cumulative)} CODE`);
        });
        
    } catch (error) {
        console.error('❌ Error building epoch:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { buildEpoch, generateMerkleTree, saveEpoch }; 
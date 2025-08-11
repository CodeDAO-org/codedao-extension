const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { ethers } = require('ethers');
const fs = require('fs');

/**
 * CodeDAO Genesis Airdrop - 5M CODE (5% of supply)
 * 
 * Distribution:
 * - 35% Builders: Historic merged PRs (1,750,000 CODE)
 * - 20% Early LPs: First 30 days LPs (1,000,000 CODE)  
 * - 15% Governance: Early delegates/voters (750,000 CODE)
 * - 15% Partners: Key integrations (750,000 CODE)
 * - 10% Questers: Simple tasks (500,000 CODE)
 * - 5% Reserve: Appeals/retro (250,000 CODE)
 */

// Airdrop allocation buckets
const TOTAL_AIRDROP = ethers.parseEther('5000000'); // 5M CODE

const ALLOCATIONS = {
    builders: ethers.parseEther('1750000'),    // 35%
    earlyLPs: ethers.parseEther('1000000'),    // 20%
    governance: ethers.parseEther('750000'),   // 15%
    partners: ethers.parseEther('750000'),     // 15%
    questers: ethers.parseEther('500000'),     // 10%
    reserve: ethers.parseEther('250000')       // 5%
};

// Sample airdrop data (replace with real snapshot data)
const AIRDROP_DATA = [
    // Builders (historic PR contributors)
    { address: '0x813343d30065eAe9D1Be6521203f5C0874818C28', amount: ethers.parseEther('100000'), category: 'builders' },
    { address: '0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9', amount: ethers.parseEther('50000'), category: 'builders' },
    
    // Early LPs (time-weighted)
    { address: '0x1234567890123456789012345678901234567890', amount: ethers.parseEther('25000'), category: 'earlyLPs' },
    
    // Governance participants
    { address: '0x0987654321098765432109876543210987654321', amount: ethers.parseEther('15000'), category: 'governance' },
    
    // Partners
    { address: '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd', amount: ethers.parseEther('20000'), category: 'partners' },
    
    // Questers (simple tasks)
    { address: '0x1111111111111111111111111111111111111111', amount: ethers.parseEther('1000'), category: 'questers' },
    { address: '0x2222222222222222222222222222222222222222', amount: ethers.parseEther('1000'), category: 'questers' },
    { address: '0x3333333333333333333333333333333333333333', amount: ethers.parseEther('1000'), category: 'questers' },
];

function validateAirdropData(data) {
    console.log('🔍 Validating airdrop data...');
    
    const totalAllocated = data.reduce((sum, item) => sum + item.amount, 0n);
    console.log(`📊 Total allocated: ${ethers.formatEther(totalAllocated)} CODE`);
    console.log(`🎯 Target allocation: ${ethers.formatEther(TOTAL_AIRDROP)} CODE`);
    
    if (totalAllocated > TOTAL_AIRDROP) {
        throw new Error(`Over-allocated! ${ethers.formatEther(totalAllocated - TOTAL_AIRDROP)} CODE excess`);
    }
    
    // Check for duplicate addresses
    const addresses = new Set();
    const duplicates = [];
    
    for (const item of data) {
        if (addresses.has(item.address)) {
            duplicates.push(item.address);
        }
        addresses.add(item.address);
    }
    
    if (duplicates.length > 0) {
        throw new Error(`Duplicate addresses found: ${duplicates.join(', ')}`);
    }
    
    // Validate addresses
    for (const item of data) {
        if (!ethers.isAddress(item.address)) {
            throw new Error(`Invalid address: ${item.address}`);
        }
        if (item.amount <= 0) {
            throw new Error(`Invalid amount for ${item.address}: ${item.amount}`);
        }
    }
    
    console.log('✅ Airdrop data validation passed');
    return true;
}

function generateMerkleTree(data) {
    console.log('🌳 Generating Merkle tree...');
    
    // Create leaves: keccak256(abi.encodePacked(index, address, amount))
    const leaves = data.map((item, index) => {
        return ethers.solidityPackedKeccak256(
            ['uint256', 'address', 'uint256'],
            [index, item.address, item.amount]
        );
    });
    
    // Create Merkle tree
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    
    console.log(`🌿 Merkle root: ${root}`);
    console.log(`📄 Total leaves: ${leaves.length}`);
    
    // Generate proofs for each recipient
    const recipients = data.map((item, index) => {
        const leaf = leaves[index];
        const proof = tree.getHexProof(leaf);
        
        return {
            index,
            address: item.address,
            amount: item.amount.toString(),
            amountFormatted: ethers.formatEther(item.amount),
            category: item.category,
            proof
        };
    });
    
    return {
        merkleRoot: root,
        recipients,
        tree
    };
}

function generateClaimData(merkleData) {
    const claimData = {
        merkleRoot: merkleData.merkleRoot,
        totalRecipients: merkleData.recipients.length,
        totalAmount: TOTAL_AIRDROP.toString(),
        totalAmountFormatted: ethers.formatEther(TOTAL_AIRDROP),
        generatedAt: new Date().toISOString(),
        recipients: merkleData.recipients,
        summary: {
            builders: merkleData.recipients.filter(r => r.category === 'builders').length,
            earlyLPs: merkleData.recipients.filter(r => r.category === 'earlyLPs').length,
            governance: merkleData.recipients.filter(r => r.category === 'governance').length,
            partners: merkleData.recipients.filter(r => r.category === 'partners').length,
            questers: merkleData.recipients.filter(r => r.category === 'questers').length
        }
    };
    
    return claimData;
}

function verifyMerkleProof(recipients, merkleRoot) {
    console.log('🔐 Verifying Merkle proofs...');
    
    for (const recipient of recipients) {
        const leaf = ethers.solidityPackedKeccak256(
            ['uint256', 'address', 'uint256'],
            [recipient.index, recipient.address, recipient.amount]
        );
        
        // Recreate tree and verify
        const tree = new MerkleTree(
            recipients.map(r => ethers.solidityPackedKeccak256(
                ['uint256', 'address', 'uint256'],
                [r.index, r.address, r.amount]
            )),
            keccak256,
            { sortPairs: true }
        );
        
        const isValid = tree.verify(recipient.proof, leaf, merkleRoot);
        if (!isValid) {
            throw new Error(`Invalid proof for ${recipient.address}`);
        }
    }
    
    console.log('✅ All Merkle proofs verified');
}

async function main() {
    console.log('🎁 CodeDAO Genesis Airdrop - Merkle Tree Generation');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        // Validate input data
        validateAirdropData(AIRDROP_DATA);
        
        // Generate Merkle tree
        const merkleData = generateMerkleTree(AIRDROP_DATA);
        
        // Generate claim data
        const claimData = generateClaimData(merkleData);
        
        // Verify proofs
        verifyMerkleProof(claimData.recipients, claimData.merkleRoot);
        
        // Save outputs
        fs.writeFileSync('airdrop-claims.json', JSON.stringify(claimData, null, 2));
        fs.writeFileSync('merkle-root.txt', claimData.merkleRoot);
        
        // Generate summary
        console.log('\n📊 Airdrop Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log(`🌳 Merkle Root: ${claimData.merkleRoot}`);
        console.log(`👥 Total Recipients: ${claimData.totalRecipients}`);
        console.log(`💰 Total Amount: ${claimData.totalAmountFormatted} CODE`);
        console.log(`\n📈 Distribution by Category:`);
        console.log(`   🏗️ Builders: ${claimData.summary.builders}`);
        console.log(`   💧 Early LPs: ${claimData.summary.earlyLPs}`);
        console.log(`   🗳️ Governance: ${claimData.summary.governance}`);
        console.log(`   🤝 Partners: ${claimData.summary.partners}`);
        console.log(`   🎯 Questers: ${claimData.summary.questers}`);
        
        console.log('\n✅ Airdrop data generated successfully!');
        console.log('📁 Files created:');
        console.log('   • airdrop-claims.json (claim data with proofs)');
        console.log('   • merkle-root.txt (root hash for contract)');
        
        console.log('\n🔧 Next Steps:');
        console.log('1. Deploy MerkleDistributor with this root');
        console.log('2. Fund distributor with 5M CODE tokens');
        console.log('3. Deploy claim interface');
        console.log('4. Announce airdrop claim period');
        
    } catch (error) {
        console.error('❌ Airdrop generation failed:', error.message);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = {
    generateMerkleTree,
    validateAirdropData,
    AIRDROP_DATA,
    ALLOCATIONS
}; 
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');
const { ethers } = require('ethers');
const fs = require('fs');

/**
 * Cumulative Merkle Tree Generator for CodeDAO
 * 
 * Generates Merkle trees where each leaf contains lifetime cumulative earnings
 * Users can claim once for multiple epochs, preventing "missed week" issues
 */

// Load previous epoch data if exists
function loadPreviousEpochData() {
    try {
        if (fs.existsSync('cumulative-epochs.json')) {
            return JSON.parse(fs.readFileSync('cumulative-epochs.json', 'utf8'));
        }
    } catch (error) {
        console.log('No previous epoch data found, starting fresh');
    }
    
    return {
        epochs: [],
        cumulativeEarnings: {}
    };
}

// Sample epoch data - in production this comes from GitHub scoring
const EPOCH_DATA = {
    // Epoch 1 - Genesis Airdrop + First Builder Rewards
    1: {
        description: "Genesis Airdrop + Week 1 Builder Rewards",
        newEarnings: {
            // Genesis airdrop recipients
            '0x813343d30065eAe9D1Be6521203f5C0874818C28': ethers.parseEther('100000'), // Safe
            '0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9': ethers.parseEther('50000'),  // Deployer
            
            // First week builder rewards
            '0x1234567890123456789012345678901234567890': ethers.parseEther('5000'),   // Active contributor
            '0x0987654321098765432109876543210987654321': ethers.parseEther('3000'),   // Regular contributor
            '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': ethers.parseEther('2000'),   // New contributor
        }
    },
    
    // Epoch 2 - Week 2 Builder Rewards
    2: {
        description: "Week 2 Builder Rewards",
        newEarnings: {
            '0x1234567890123456789012345678901234567890': ethers.parseEther('4500'),   // Continued activity
            '0x0987654321098765432109876543210987654321': ethers.parseEther('3500'),   // Increased activity
            '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd': ethers.parseEther('1500'),   // Consistent
            '0x1111111111111111111111111111111111111111': ethers.parseEther('2500'),   // New contributor
        }
    }
};

/**
 * Generate cumulative epoch data
 */
function generateCumulativeEpoch(epochId, newEarnings, previousData) {
    console.log(`\n📊 Generating Epoch ${epochId}...`);
    
    // Start with previous cumulative earnings
    const cumulativeEarnings = { ...previousData.cumulativeEarnings };
    
    // Add new earnings to cumulative totals
    let totalNewEarnings = 0n;
    for (const [address, amount] of Object.entries(newEarnings)) {
        const previousAmount = BigInt(cumulativeEarnings[address] || '0');
        const newAmount = BigInt(amount);
        
        cumulativeEarnings[address] = (previousAmount + newAmount).toString();
        totalNewEarnings += newAmount;
        
        console.log(`  💰 ${address}: +${ethers.formatEther(amount)} CODE (total: ${ethers.formatEther(cumulativeEarnings[address])})`);
    }
    
    console.log(`📈 Total new earnings this epoch: ${ethers.formatEther(totalNewEarnings)} CODE`);
    
    return cumulativeEarnings;
}

/**
 * Generate Merkle tree from cumulative earnings
 */
function generateCumulativeMerkleTree(cumulativeEarnings, epochId) {
    console.log(`\n🌳 Generating Merkle tree for Epoch ${epochId}...`);
    
    // Convert to array format: [address, cumulativeAmount]
    const entries = Object.entries(cumulativeEarnings).map(([address, amount]) => ({
        address,
        cumulativeAmount: amount,
        cumulativeFormatted: ethers.formatEther(amount)
    })).filter(entry => BigInt(entry.cumulativeAmount) > 0);
    
    // Sort by address for deterministic tree
    entries.sort((a, b) => a.address.toLowerCase().localeCompare(b.address.toLowerCase()));
    
    // Create leaves: keccak256(abi.encodePacked(address, cumulativeAmount))
    const leaves = entries.map(entry => {
        return ethers.solidityPackedKeccak256(
            ['address', 'uint256'],
            [entry.address, entry.cumulativeAmount]
        );
    });
    
    // Create Merkle tree
    const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
    const root = tree.getHexRoot();
    
    console.log(`🌿 Merkle root: ${root}`);
    console.log(`📄 Total eligible addresses: ${leaves.length}`);
    
    // Generate proofs for each recipient
    const recipients = entries.map((entry, index) => {
        const leaf = leaves[index];
        const proof = tree.getHexProof(leaf);
        
        return {
            address: entry.address,
            cumulativeAmount: entry.cumulativeAmount,
            cumulativeFormatted: entry.cumulativeFormatted,
            proof
        };
    });
    
    return {
        epochId,
        merkleRoot: root,
        recipients,
        totalEligible: entries.length,
        tree
    };
}

/**
 * Verify all Merkle proofs
 */
function verifyMerkleProofs(merkleData) {
    console.log('\n🔐 Verifying Merkle proofs...');
    
    let verified = 0;
    for (const recipient of merkleData.recipients) {
        const leaf = ethers.solidityPackedKeccak256(
            ['address', 'uint256'],
            [recipient.address, recipient.cumulativeAmount]
        );
        
        const tree = new MerkleTree(
            merkleData.recipients.map(r => ethers.solidityPackedKeccak256(
                ['address', 'uint256'],
                [r.address, r.cumulativeAmount]
            )),
            keccak256,
            { sortPairs: true }
        );
        
        const isValid = tree.verify(recipient.proof, leaf, merkleData.merkleRoot);
        if (!isValid) {
            throw new Error(`Invalid proof for ${recipient.address}`);
        }
        verified++;
    }
    
    console.log(`✅ All ${verified} Merkle proofs verified successfully`);
}

/**
 * Generate epoch data for contract deployment
 */
function generateEpochDeploymentData(epochId, merkleData, description) {
    const totalCumulative = merkleData.recipients.reduce((sum, recipient) => {
        return sum + BigInt(recipient.cumulativeAmount);
    }, 0n);
    
    return {
        epochId,
        merkleRoot: merkleData.merkleRoot,
        totalAmount: totalCumulative.toString(),
        totalAmountFormatted: ethers.formatEther(totalCumulative),
        description,
        expiryDays: 90, // 90 day claim window
        recipients: merkleData.recipients
    };
}

/**
 * Main generation function
 */
async function generateCumulativeEpochs() {
    console.log('🎯 CodeDAO Cumulative Merkle Tree Generator');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    
    try {
        // Load previous data
        const previousData = loadPreviousEpochData();
        console.log(`📂 Loaded ${previousData.epochs.length} previous epochs`);
        
        const allEpochs = [...previousData.epochs];
        let cumulativeEarnings = { ...previousData.cumulativeEarnings };
        
        // Process each new epoch
        for (const [epochIdStr, epochData] of Object.entries(EPOCH_DATA)) {
            const epochId = parseInt(epochIdStr);
            
            // Skip if already processed
            if (allEpochs.find(e => e.epochId === epochId)) {
                console.log(`⏭️ Skipping Epoch ${epochId} (already processed)`);
                continue;
            }
            
            // Generate cumulative earnings for this epoch
            cumulativeEarnings = generateCumulativeEpoch(epochId, epochData.newEarnings, { cumulativeEarnings });
            
            // Generate Merkle tree
            const merkleData = generateCumulativeMerkleTree(cumulativeEarnings, epochId);
            
            // Verify proofs
            verifyMerkleProofs(merkleData);
            
            // Generate deployment data
            const deploymentData = generateEpochDeploymentData(epochId, merkleData, epochData.description);
            
            // Add to epochs list
            allEpochs.push(deploymentData);
            
            // Save individual epoch file
            const epochFilename = `epoch-${epochId}-claims.json`;
            fs.writeFileSync(epochFilename, JSON.stringify(deploymentData, null, 2));
            console.log(`💾 Saved: ${epochFilename}`);
        }
        
        // Save cumulative data
        const cumulativeData = {
            lastUpdated: new Date().toISOString(),
            totalEpochs: allEpochs.length,
            epochs: allEpochs,
            cumulativeEarnings
        };
        
        fs.writeFileSync('cumulative-epochs.json', JSON.stringify(cumulativeData, null, 2));
        
        // Generate summary
        console.log('\n📊 Generation Summary:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        
        for (const epoch of allEpochs) {
            console.log(`📅 Epoch ${epoch.epochId}: ${epoch.description}`);
            console.log(`   🌳 Root: ${epoch.merkleRoot}`);
            console.log(`   👥 Recipients: ${epoch.recipients.length}`);
            console.log(`   💰 Total: ${epoch.totalAmountFormatted} CODE`);
        }
        
        const grandTotal = Object.values(cumulativeEarnings).reduce((sum, amount) => {
            return sum + BigInt(amount);
        }, 0n);
        
        console.log(`\n💎 Grand Total Allocated: ${ethers.formatEther(grandTotal)} CODE`);
        console.log(`🏆 Total Unique Recipients: ${Object.keys(cumulativeEarnings).length}`);
        
        console.log('\n✅ Cumulative Merkle generation completed successfully!');
        console.log('\n📁 Files generated:');
        for (const epoch of allEpochs) {
            console.log(`   • epoch-${epoch.epochId}-claims.json`);
        }
        console.log('   • cumulative-epochs.json (master file)');
        
        console.log('\n🔧 Next Steps:');
        console.log('1. Deploy MerkleDistributorV2 with latest epoch root');
        console.log('2. Fund distributor with required CODE tokens');
        console.log('3. Set epoch root via setEpochRoot() function');
        console.log('4. Enable claims in Claim Hub interface');
        
        return cumulativeData;
        
    } catch (error) {
        console.error('❌ Generation failed:', error.message);
        process.exit(1);
    }
}

/**
 * CLI command handler
 */
if (require.main === module) {
    const command = process.argv[2];
    
    if (command === 'verify') {
        // Verify existing epoch data
        const epochId = process.argv[3];
        if (!epochId) {
            console.error('Usage: node generate-cumulative-merkle.js verify <epochId>');
            process.exit(1);
        }
        
        try {
            const epochData = JSON.parse(fs.readFileSync(`epoch-${epochId}-claims.json`, 'utf8'));
            console.log(`🔍 Verifying Epoch ${epochId}...`);
            
            // Recreate Merkle tree and verify
            const leaves = epochData.recipients.map(r => 
                ethers.solidityPackedKeccak256(['address', 'uint256'], [r.address, r.cumulativeAmount])
            );
            const tree = new MerkleTree(leaves, keccak256, { sortPairs: true });
            
            if (tree.getHexRoot() === epochData.merkleRoot) {
                console.log('✅ Epoch data is valid');
            } else {
                console.log('❌ Epoch data is corrupted');
            }
        } catch (error) {
            console.error('❌ Verification failed:', error.message);
        }
    } else {
        // Generate new epochs
        generateCumulativeEpochs();
    }
}

module.exports = {
    generateCumulativeEpochs,
    generateCumulativeMerkleTree,
    loadPreviousEpochData
}; 
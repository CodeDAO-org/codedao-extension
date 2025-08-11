const express = require('express');
const { ethers } = require('ethers');
const fs = require('fs');

const router = express.Router();

// Contract addresses (from deployed ecosystem)
const CONTRACTS = {
    codeToken: '0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C',
    stakingVault: '0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c',
    epochDistributor: '0x36653EFf30fa88765Cf12199A009DdcB2cF724a0',
    merkleDistributorV2: '', // To be deployed
    lpGauge: '' // To be deployed
};

// Provider setup
const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');

/**
 * @route GET /api/claims/eligibility/:address
 * @desc Get all claim eligibility for a user address
 */
router.get('/eligibility/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid address' });
        }

        const eligibility = await getClaimEligibility(address);
        
        res.json({
            success: true,
            address,
            eligibility,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error checking eligibility:', error);
        res.status(500).json({ 
            error: 'Failed to check eligibility',
            details: error.message 
        });
    }
});

/**
 * @route GET /api/claims/proofs/:address
 * @desc Get Merkle proofs for all claimable amounts
 */
router.get('/proofs/:address', async (req, res) => {
    try {
        const { address } = req.params;
        
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid address' });
        }

        const proofs = await getMerkleProofs(address);
        
        res.json({
            success: true,
            address,
            proofs,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting proofs:', error);
        res.status(500).json({ 
            error: 'Failed to get proofs',
            details: error.message 
        });
    }
});

/**
 * @route POST /api/claims/gasless
 * @desc Submit gasless claim request (relayed transaction)
 */
router.post('/gasless', async (req, res) => {
    try {
        const { address, cumulativeAmount, autoStake, merkleProof, signature } = req.body;
        
        if (!ethers.isAddress(address)) {
            return res.status(400).json({ error: 'Invalid address' });
        }

        // Verify signature for gasless claim
        const isValidSignature = await verifyGaslessSignature(address, cumulativeAmount, signature);
        if (!isValidSignature) {
            return res.status(400).json({ error: 'Invalid signature' });
        }

        // Check gasless eligibility
        const canClaim = await checkGaslessEligibility(address);
        if (!canClaim) {
            return res.status(400).json({ error: 'Not eligible for gasless claim' });
        }

        // Submit gasless claim (this would use a relayer service)
        const txHash = await submitGaslessClaim(address, cumulativeAmount, autoStake, merkleProof);
        
        res.json({
            success: true,
            txHash,
            message: 'Gasless claim submitted successfully'
        });
        
    } catch (error) {
        console.error('Error submitting gasless claim:', error);
        res.status(500).json({ 
            error: 'Failed to submit gasless claim',
            details: error.message 
        });
    }
});

/**
 * @route GET /api/claims/status/:txHash
 * @desc Get status of a claim transaction
 */
router.get('/status/:txHash', async (req, res) => {
    try {
        const { txHash } = req.params;
        
        const receipt = await provider.getTransactionReceipt(txHash);
        
        res.json({
            success: true,
            txHash,
            status: receipt ? 'confirmed' : 'pending',
            blockNumber: receipt?.blockNumber,
            gasUsed: receipt?.gasUsed?.toString()
        });
        
    } catch (error) {
        console.error('Error checking status:', error);
        res.status(500).json({ 
            error: 'Failed to check status',
            details: error.message 
        });
    }
});

/**
 * Get comprehensive claim eligibility for a user
 */
async function getClaimEligibility(address) {
    const eligibility = {
        airdrop: null,
        builderRewards: null,
        lpRewards: null,
        totalClaimable: '0'
    };

    try {
        // Check airdrop eligibility
        eligibility.airdrop = await getAirdropEligibility(address);
        
        // Check builder rewards eligibility
        eligibility.builderRewards = await getBuilderRewardsEligibility(address);
        
        // Check LP rewards eligibility
        eligibility.lpRewards = await getLPRewardsEligibility(address);
        
        // Calculate total claimable
        const totalClaimable = [
            eligibility.airdrop?.amount || '0',
            eligibility.builderRewards?.amount || '0', 
            eligibility.lpRewards?.amount || '0'
        ].reduce((sum, amount) => {
            return (BigInt(sum) + BigInt(amount)).toString();
        }, '0');
        
        eligibility.totalClaimable = totalClaimable;
        
    } catch (error) {
        console.error('Error getting eligibility:', error);
    }

    return eligibility;
}

/**
 * Get airdrop eligibility from static data
 */
async function getAirdropEligibility(address) {
    try {
        // Load airdrop claims data
        const airdropData = JSON.parse(fs.readFileSync('airdrop/airdrop-claims.json', 'utf8'));
        
        const recipient = airdropData.recipients.find(r => 
            r.address.toLowerCase() === address.toLowerCase()
        );
        
        if (!recipient) {
            return null;
        }
        
        return {
            amount: recipient.amount,
            amountFormatted: recipient.amountFormatted,
            category: recipient.category,
            proof: recipient.proof,
            eligible: true
        };
        
    } catch (error) {
        console.error('Error checking airdrop eligibility:', error);
        return null;
    }
}

/**
 * Get builder rewards eligibility (current epoch)
 */
async function getBuilderRewardsEligibility(address) {
    try {
        // This would query the latest epoch data
        // For now, return mock data
        return {
            currentEpoch: 1,
            cumulativeAmount: '0',
            thisEpochAmount: '0',
            contributionCount: 0,
            eligible: false
        };
        
    } catch (error) {
        console.error('Error checking builder rewards:', error);
        return null;
    }
}

/**
 * Get LP rewards eligibility
 */
async function getLPRewardsEligibility(address) {
    try {
        // This would query the LP gauge contract
        // For now, return mock data
        return {
            stakedAmount: '0',
            earnedRewards: '0',
            apy: '0',
            eligible: false
        };
        
    } catch (error) {
        console.error('Error checking LP rewards:', error);
        return null;
    }
}

/**
 * Get Merkle proofs for all claimable amounts
 */
async function getMerkleProofs(address) {
    const proofs = {
        airdrop: null,
        builderRewards: null
    };

    try {
        // Get airdrop proof
        const airdropEligibility = await getAirdropEligibility(address);
        if (airdropEligibility) {
            proofs.airdrop = {
                amount: airdropEligibility.amount,
                proof: airdropEligibility.proof
            };
        }

        // Get builder rewards proof (from latest epoch)
        const builderEligibility = await getBuilderRewardsEligibility(address);
        if (builderEligibility && builderEligibility.eligible) {
            proofs.builderRewards = {
                cumulativeAmount: builderEligibility.cumulativeAmount,
                proof: [] // Would be populated from epoch data
            };
        }

    } catch (error) {
        console.error('Error getting proofs:', error);
    }

    return proofs;
}

/**
 * Verify signature for gasless claims
 */
async function verifyGaslessSignature(address, cumulativeAmount, signature) {
    try {
        // Create message to verify
        const message = ethers.solidityPackedKeccak256(
            ['string', 'address', 'uint256'],
            ['CodeDAO Gasless Claim', address, cumulativeAmount]
        );
        
        // Recover signer from signature
        const recoveredAddress = ethers.verifyMessage(message, signature);
        
        return recoveredAddress.toLowerCase() === address.toLowerCase();
        
    } catch (error) {
        console.error('Error verifying signature:', error);
        return false;
    }
}

/**
 * Check if user is eligible for gasless claim
 */
async function checkGaslessEligibility(address) {
    try {
        // This would check the MerkleDistributorV2 contract
        // For now, return true for demo
        return true;
        
    } catch (error) {
        console.error('Error checking gasless eligibility:', error);
        return false;
    }
}

/**
 * Submit gasless claim via relayer
 */
async function submitGaslessClaim(address, cumulativeAmount, autoStake, merkleProof) {
    try {
        // This would use a relayer service like Gelato or custom relayer
        // For now, return mock transaction hash
        const mockTxHash = '0x' + Math.random().toString(16).substr(2, 64);
        
        console.log(`Gasless claim submitted for ${address}: ${mockTxHash}`);
        
        return mockTxHash;
        
    } catch (error) {
        console.error('Error submitting gasless claim:', error);
        throw error;
    }
}

/**
 * @route GET /api/claims/stats
 * @desc Get overall claim statistics
 */
router.get('/stats', async (req, res) => {
    try {
        const stats = {
            airdrop: {
                totalRecipients: 8,
                totalAmount: '5000000.0',
                claimedCount: 0,
                claimedAmount: '0'
            },
            builderRewards: {
                currentEpoch: 1,
                totalEpochs: 1,
                weeklyBudget: '175000.0',
                totalDistributed: '0'
            },
            gaslessClaims: {
                used: 0,
                total: 1000,
                remaining: 1000
            }
        };
        
        res.json({
            success: true,
            stats,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('Error getting stats:', error);
        res.status(500).json({ 
            error: 'Failed to get stats',
            details: error.message 
        });
    }
});

module.exports = router; 
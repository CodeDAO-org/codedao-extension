const express = require('express');
const { Webhooks } = require('@octokit/webhooks');
const { EAS, SchemaEncoder } = require('@ethereum-attestation-service/eas-sdk');
const { ethers } = require('ethers');

const app = express();
const webhooks = new Webhooks({
    secret: process.env.GITHUB_WEBHOOK_SECRET,
});

// Base network configuration
const PROVIDER = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
const SIGNER = new ethers.Wallet(process.env.ATTESTATION_PRIVATE_KEY, PROVIDER);

// EAS configuration on Base
const EAS_CONTRACT_ADDRESS = '0x4200000000000000000000000000000000000021'; // Base EAS
const eas = new EAS(EAS_CONTRACT_ADDRESS);
eas.connect(SIGNER);

// Our PR attestation schema
const PR_SCHEMA_UID = process.env.PR_SCHEMA_UID; // To be created
const schemaEncoder = new SchemaEncoder("string repo_name,uint256 pr_number,address author_addr,address merged_by,uint256 lines_added,uint256 lines_removed,uint256 files_changed,string[] labels,bool tests_passed,uint256 complexity_score,uint256 review_approvals,uint256 merged_timestamp");

// Allowlisted repositories
const ALLOWED_REPOS = [
    'codedao-org/codedao-extension',
    'codedao-org/codedao-contracts',
    // Add more as needed
];

// Quality scoring algorithm
function calculateQualityScore(prData) {
    let score = 100; // Base score for merged PR
    
    // Difficulty multiplier based on labels
    const difficultyMultiplier = getDifficultyMultiplier(prData.labels);
    score *= difficultyMultiplier;
    
    // Review factor (more reviews = higher score)
    const reviewFactor = Math.min(1.5, 1 + (prData.review_approvals * 0.1));
    score *= reviewFactor;
    
    // Test coverage factor
    const testFactor = prData.tests_passed ? 1.2 : 0.8;
    score *= testFactor;
    
    // Complexity factor (capped to prevent gaming)
    const complexityFactor = Math.min(2.0, 1 + (prData.files_changed * 0.05));
    score *= complexityFactor;
    
    // Author reputation (to be implemented)
    const reputationMultiplier = 1.0; // TODO: Implement reputation system
    score *= reputationMultiplier;
    
    return Math.floor(score);
}

function getDifficultyMultiplier(labels) {
    if (labels.includes('good-first-issue')) return 0.5;
    if (labels.includes('core') || labels.includes('critical')) return 2.0;
    if (labels.includes('feature')) return 1.3;
    if (labels.includes('bug')) return 1.1;
    return 1.0; // Default
}

// GitHub webhook handler for PR events
webhooks.on('pull_request.closed', async ({ payload }) => {
    if (!payload.pull_request.merged) {
        console.log('❌ PR not merged, skipping');
        return;
    }
    
    const repo = payload.repository.full_name;
    if (!ALLOWED_REPOS.includes(repo)) {
        console.log(`❌ Repo ${repo} not allowlisted, skipping`);
        return;
    }
    
    console.log(`🔄 Processing merged PR #${payload.pull_request.number} in ${repo}`);
    
    try {
        await createPRAttestation(payload);
    } catch (error) {
        console.error('❌ Failed to create attestation:', error);
    }
});

async function createPRAttestation(payload) {
    const pr = payload.pull_request;
    const repo = payload.repository;
    
    // TODO: Get GitHub user's wallet address (needs user registration system)
    const authorAddress = await getWalletAddress(pr.user.login);
    const mergedByAddress = await getWalletAddress(pr.merged_by?.login);
    
    if (!authorAddress) {
        console.log(`❌ No wallet address found for ${pr.user.login}`);
        return;
    }
    
    // Extract PR data
    const prData = {
        repo_name: repo.full_name,
        pr_number: pr.number,
        author_addr: authorAddress,
        merged_by: mergedByAddress || ethers.ZeroAddress,
        lines_added: pr.additions || 0,
        lines_removed: pr.deletions || 0,
        files_changed: pr.changed_files || 0,
        labels: pr.labels.map(label => label.name),
        tests_passed: await checkTestsPassed(pr),
        complexity_score: calculateComplexityScore(pr),
        review_approvals: await getReviewApprovals(pr),
        merged_timestamp: Math.floor(new Date(pr.merged_at).getTime() / 1000)
    };
    
    // Calculate quality score
    const qualityScore = calculateQualityScore(prData);
    console.log(`📊 Quality score for PR #${pr.number}: ${qualityScore}`);
    
    // Encode attestation data
    const encodedData = schemaEncoder.encodeData([
        { name: "repo_name", value: prData.repo_name, type: "string" },
        { name: "pr_number", value: prData.pr_number, type: "uint256" },
        { name: "author_addr", value: prData.author_addr, type: "address" },
        { name: "merged_by", value: prData.merged_by, type: "address" },
        { name: "lines_added", value: prData.lines_added, type: "uint256" },
        { name: "lines_removed", value: prData.lines_removed, type: "uint256" },
        { name: "files_changed", value: prData.files_changed, type: "uint256" },
        { name: "labels", value: prData.labels, type: "string[]" },
        { name: "tests_passed", value: prData.tests_passed, type: "bool" },
        { name: "complexity_score", value: prData.complexity_score, type: "uint256" },
        { name: "review_approvals", value: prData.review_approvals, type: "uint256" },
        { name: "merged_timestamp", value: prData.merged_timestamp, type: "uint256" },
    ]);
    
    // Create attestation on Base
    const tx = await eas.attest({
        schema: PR_SCHEMA_UID,
        data: {
            recipient: prData.author_addr,
            expirationTime: 0,
            revocable: true,
            data: encodedData,
        },
    });
    
    const receipt = await tx.wait();
    console.log(`✅ Attestation created: ${receipt.transactionHash}`);
    
    // Store quality score for epoch calculations
    await storeQualityScore(prData.author_addr, qualityScore, getCurrentEpoch());
}

// Helper functions (to be implemented)
async function getWalletAddress(githubUsername) {
    // TODO: Query user registration database
    // For now, return null - users need to register their wallet
    return null;
}

async function checkTestsPassed(pr) {
    // TODO: Check GitHub status checks
    return true; // Simplified for MVP
}

function calculateComplexityScore(pr) {
    // Simple complexity score based on files changed
    return Math.min(100, pr.changed_files * 10);
}

async function getReviewApprovals(pr) {
    // TODO: Query GitHub API for review approvals
    return 1; // Simplified for MVP
}

function getCurrentEpoch() {
    const epochStart = new Date('2024-01-01').getTime(); // Adjust start date
    const weeksSinceStart = Math.floor((Date.now() - epochStart) / (7 * 24 * 60 * 60 * 1000));
    return weeksSinceStart;
}

async function storeQualityScore(address, score, epoch) {
    // TODO: Store in database for epoch calculations
    console.log(`📈 Storing score: ${address} = ${score} points for epoch ${epoch}`);
}

// Express middleware
app.use(express.json());
app.use('/webhooks', webhooks.middleware);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 CodeDAO GitHub App listening on port ${PORT}`);
    console.log(`📡 Webhook endpoint: /webhooks`);
    console.log(`💾 Allowed repos: ${ALLOWED_REPOS.join(', ')}`);
});

module.exports = app; 
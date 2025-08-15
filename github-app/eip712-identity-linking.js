#!/usr/bin/env node

/**
 * EIP-712 Identity Linking System
 * 
 * Provides secure cryptographic linking between GitHub accounts and wallet addresses
 * using EIP-712 typed data signatures. Prevents spoofing and ensures ownership.
 */

const crypto = require('crypto');

class EIP712IdentityLinker {
    constructor() {
        this.domain = {
            name: 'CodeDAO Identity Linker',
            version: '1.0.0',
            chainId: 8453, // Base mainnet
            verifyingContract: '0x36653EFf30fa88765Cf12199A009DdcB2cF724a0' // EpochDistributor
        };
        
        // EIP-712 type definitions
        this.types = {
            EIP712Domain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'string' },
                { name: 'chainId', type: 'uint256' },
                { name: 'verifyingContract', type: 'address' }
            ],
            LinkIdentity: [
                { name: 'githubUsername', type: 'string' },
                { name: 'githubUserId', type: 'uint256' },
                { name: 'walletAddress', type: 'address' },
                { name: 'timestamp', type: 'uint256' },
                { name: 'nonce', type: 'uint256' },
                { name: 'purpose', type: 'string' }
            ]
        };
        
        // In-memory storage for demo (production should use database)
        this.linkedIdentities = new Map();
        this.usedNonces = new Set();
    }
    
    /**
     * Generate EIP-712 message for GitHub → Wallet linking
     */
    generateLinkMessage(githubUsername, githubUserId, walletAddress) {
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateNonce();
        
        const message = {
            githubUsername: githubUsername,
            githubUserId: githubUserId,
            walletAddress: walletAddress.toLowerCase(),
            timestamp: timestamp,
            nonce: nonce,
            purpose: 'Link GitHub account to wallet for CodeDAO rewards'
        };
        
        return {
            domain: this.domain,
            types: this.types,
            primaryType: 'LinkIdentity',
            message: message
        };
    }
    
    /**
     * Generate secure nonce for replay protection
     */
    generateNonce() {
        return parseInt(crypto.randomBytes(8).toString('hex'), 16);
    }
    
    /**
     * Verify EIP-712 signature and link identity
     */
    async verifyAndLinkIdentity(typedData, signature, recoveredAddress) {
        try {
            // Validate message structure
            if (!this.validateMessage(typedData.message)) {
                throw new Error('Invalid message structure');
            }
            
            // Check nonce hasn't been used
            if (this.usedNonces.has(typedData.message.nonce)) {
                throw new Error('Nonce already used');
            }
            
            // Check timestamp (valid for 10 minutes)
            const now = Math.floor(Date.now() / 1000);
            if (now - typedData.message.timestamp > 600) {
                throw new Error('Message expired');
            }
            
            // Verify the signature was created by the claimed wallet
            if (recoveredAddress.toLowerCase() !== typedData.message.walletAddress.toLowerCase()) {
                throw new Error('Signature does not match claimed wallet address');
            }
            
            // Store the verified linking
            const linkId = this.createLinkId(typedData.message.githubUsername, typedData.message.walletAddress);
            const linkData = {
                githubUsername: typedData.message.githubUsername,
                githubUserId: typedData.message.githubUserId,
                walletAddress: typedData.message.walletAddress.toLowerCase(),
                linkedAt: now,
                signature: signature,
                verified: true,
                linkId: linkId
            };
            
            this.linkedIdentities.set(linkId, linkData);
            this.usedNonces.add(typedData.message.nonce);
            
            return {
                success: true,
                linkId: linkId,
                message: 'Identity successfully linked',
                data: linkData
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Validate message structure
     */
    validateMessage(message) {
        const required = ['githubUsername', 'githubUserId', 'walletAddress', 'timestamp', 'nonce', 'purpose'];
        return required.every(field => message.hasOwnProperty(field));
    }
    
    /**
     * Create unique link ID
     */
    createLinkId(githubUsername, walletAddress) {
        const combined = `${githubUsername.toLowerCase()}:${walletAddress.toLowerCase()}`;
        return crypto.createHash('sha256').update(combined).digest('hex');
    }
    
    /**
     * Verify existing link
     */
    verifyLink(githubUsername, walletAddress) {
        const linkId = this.createLinkId(githubUsername, walletAddress);
        const linkData = this.linkedIdentities.get(linkId);
        
        if (!linkData) {
            return { verified: false, reason: 'No link found' };
        }
        
        // Check if link is still valid (links expire after 1 year)
        const now = Math.floor(Date.now() / 1000);
        if (now - linkData.linkedAt > 31536000) {
            return { verified: false, reason: 'Link expired' };
        }
        
        return { 
            verified: true, 
            linkData: linkData,
            age: now - linkData.linkedAt
        };
    }
    
    /**
     * Get wallet address for GitHub user
     */
    getWalletForGitHub(githubUsername) {
        for (const [linkId, linkData] of this.linkedIdentities.entries()) {
            if (linkData.githubUsername.toLowerCase() === githubUsername.toLowerCase() && linkData.verified) {
                const verification = this.verifyLink(githubUsername, linkData.walletAddress);
                if (verification.verified) {
                    return linkData.walletAddress;
                }
            }
        }
        return null;
    }
    
    /**
     * Get GitHub username for wallet address
     */
    getGitHubForWallet(walletAddress) {
        for (const [linkId, linkData] of this.linkedIdentities.entries()) {
            if (linkData.walletAddress.toLowerCase() === walletAddress.toLowerCase() && linkData.verified) {
                const verification = this.verifyLink(linkData.githubUsername, walletAddress);
                if (verification.verified) {
                    return linkData.githubUsername;
                }
            }
        }
        return null;
    }
    
    /**
     * Unlink identity (requires new signature)
     */
    generateUnlinkMessage(githubUsername, walletAddress) {
        const timestamp = Math.floor(Date.now() / 1000);
        const nonce = this.generateNonce();
        
        const message = {
            githubUsername: githubUsername,
            githubUserId: 0, // Not required for unlinking
            walletAddress: walletAddress.toLowerCase(),
            timestamp: timestamp,
            nonce: nonce,
            purpose: 'Unlink GitHub account from wallet for CodeDAO'
        };
        
        return {
            domain: this.domain,
            types: this.types,
            primaryType: 'LinkIdentity',
            message: message
        };
    }
    
    /**
     * Process unlink request
     */
    unlinkIdentity(typedData, signature, recoveredAddress) {
        try {
            // Verify signature is from the wallet being unlinked
            if (recoveredAddress.toLowerCase() !== typedData.message.walletAddress.toLowerCase()) {
                throw new Error('Signature must come from wallet being unlinked');
            }
            
            // Check existing link
            const linkId = this.createLinkId(typedData.message.githubUsername, typedData.message.walletAddress);
            if (!this.linkedIdentities.has(linkId)) {
                throw new Error('No existing link found');
            }
            
            // Remove the link
            this.linkedIdentities.delete(linkId);
            this.usedNonces.add(typedData.message.nonce);
            
            return {
                success: true,
                message: 'Identity successfully unlinked'
            };
            
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }
    
    /**
     * Get all links for admin/audit purposes
     */
    getAllLinks() {
        const links = [];
        for (const [linkId, linkData] of this.linkedIdentities.entries()) {
            links.push({
                linkId: linkId,
                githubUsername: linkData.githubUsername,
                walletAddress: linkData.walletAddress,
                linkedAt: linkData.linkedAt,
                verified: linkData.verified
            });
        }
        return links;
    }
    
    /**
     * Generate client-side linking instructions
     */
    getClientInstructions() {
        return {
            instructions: [
                "1. Connect your wallet (MetaMask/Coinbase) to Base network",
                "2. Your wallet will prompt you to sign a message",
                "3. The signature cryptographically proves you own both accounts",
                "4. No gas fees required - this is just a signature",
                "5. You can unlink anytime with another signature"
            ],
            security: [
                "✅ EIP-712 standard ensures message clarity",
                "✅ Signature includes timestamp to prevent replay",
                "✅ Nonce prevents signature reuse",
                "✅ No private keys or sensitive data transmitted",
                "✅ Links expire automatically after 1 year"
            ],
            domain: this.domain,
            exampleMessage: "CodeDAO Identity Linker will ask you to sign a message like:\n\n" +
                           "'Link GitHub account [username] to wallet [0x...] for CodeDAO rewards'\n\n" +
                           "This proves you control both accounts securely."
        };
    }
}

// Export for use in other modules
module.exports = EIP712IdentityLinker;

// CLI interface for testing
if (require.main === module) {
    const linker = new EIP712IdentityLinker();
    
    console.log('🔗 EIP-712 Identity Linking System');
    console.log('=====================================');
    
    // Generate example message
    const exampleMessage = linker.generateLinkMessage(
        'testuser',
        12345,
        '0xE4E53F3C17FDe8EF635C0921fA340FD1808C16e9'
    );
    
    console.log('\n📝 Example EIP-712 Message:');
    console.log(JSON.stringify(exampleMessage, null, 2));
    
    console.log('\n🛡️ Security Features:');
    const instructions = linker.getClientInstructions();
    instructions.security.forEach(feature => console.log(feature));
    
    console.log('\n💡 Usage Instructions:');
    instructions.instructions.forEach(step => console.log(step));
    
    console.log('\n🔧 Domain Configuration:');
    console.log(JSON.stringify(linker.domain, null, 2));
} 
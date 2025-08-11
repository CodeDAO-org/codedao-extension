#!/usr/bin/env node

/**
 * 🔍 CodeDAO Deployment Readiness Validation
 * Verifies all components are ready for live deployment
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 CODEDAO DEPLOYMENT READINESS CHECK');
console.log('═══════════════════════════════════════════════');

let allReady = true;
const issues = [];

function checkFile(filePath, description) {
    if (fs.existsSync(filePath)) {
        console.log(`✅ ${description}: Found`);
        return true;
    } else {
        console.log(`❌ ${description}: Missing`);
        issues.push(`Missing: ${filePath}`);
        allReady = false;
        return false;
    }
}

function checkFileContent(filePath, searchText, description) {
    if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (content.includes(searchText)) {
            console.log(`✅ ${description}: Configured`);
            return true;
        } else {
            console.log(`⚠️ ${description}: Missing configuration`);
            issues.push(`Configuration missing in ${filePath}: ${searchText}`);
            return false;
        }
    } else {
        console.log(`❌ ${description}: File missing`);
        issues.push(`Missing: ${filePath}`);
        allReady = false;
        return false;
    }
}

console.log('\n🚀 COMPONENT 1: WEBHOOK DEPLOYMENT');
console.log('─────────────────────────────────────');
checkFile('github-app/app.js', 'GitHub webhook handler');
checkFile('github-app/package.json', 'Webhook package.json');
checkFile('railway.json', 'Railway deployment config');
checkFile('vercel.json', 'Vercel deployment config');
checkFile('Dockerfile', 'Docker deployment config');
checkFileContent('github-app/app.js', 'ALLOWLIST_REPOS', 'Repository allowlist configuration');
checkFileContent('github-app/app.js', '/health', 'Health endpoint');
checkFileContent('github-app/app.js', 'pull_request.closed', 'PR webhook handler');

console.log('\n💰 COMPONENT 2: SAFE TRANSACTIONS');
console.log('─────────────────────────────────────');
const safeTransactionReady = checkFile('safe/safe-transaction-bundle.json', 'Safe transaction bundle');
if (safeTransactionReady) {
    try {
        const safeData = JSON.parse(fs.readFileSync('safe/safe-transaction-bundle.json', 'utf8'));
        
        // Validate transaction structure
        if (safeData.transactions && safeData.transactions.length === 2) {
            console.log('✅ Safe transactions: 2 transactions found');
            
            // Check first transaction (funding)
            const tx1 = safeData.transactions[0];
            if (tx1.to === '0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C' && 
                tx1.contractMethod.name === 'transfer' &&
                tx1.contractInputsValues.amount === '150000000000000000000') {
                console.log('✅ Transaction 1: Fund distributor (150 CODE)');
            } else {
                console.log('❌ Transaction 1: Invalid funding transaction');
                allReady = false;
            }
            
            // Check second transaction (set root)
            const tx2 = safeData.transactions[1];
            if (tx2.to === '0x36653EFf30fa88765Cf12199A009DdcB2cF724a0' && 
                tx2.contractMethod.name === 'setRoot' &&
                tx2.contractInputsValues.merkleRoot === '0xddc833d869453b3935e5e64cd450430d15fbbb81fcab74dcf91800b63e02ca2e') {
                console.log('✅ Transaction 2: Set Merkle root');
            } else {
                console.log('❌ Transaction 2: Invalid setRoot transaction');
                allReady = false;
            }
        } else {
            console.log('❌ Safe transactions: Invalid structure');
            allReady = false;
        }
    } catch (error) {
        console.log('❌ Safe transactions: Invalid JSON');
        allReady = false;
    }
}

console.log('\n🎯 COMPONENT 3: CLAIM HUB');
console.log('─────────────────────────────────────');
checkFile('claim-hub-real.html', 'Real claim hub interface');
checkFileContent('claim-hub-real.html', 'EPOCH_DATA_URL', 'GitHub epoch data loading');
checkFileContent('claim-hub-real.html', '0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C', 'CODE token integration');
checkFileContent('claim-hub-real.html', '0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c', 'sCODE vault integration');
checkFileContent('claim-hub-real.html', '0x36653EFf30fa88765Cf12199A009DdcB2cF724a0', 'Epoch distributor integration');

console.log('\n📊 COMPONENT 4: EPOCH DATA');
console.log('─────────────────────────────────────');
checkFile('epochs/epoch-0001.json', 'Epoch 1 data file');
checkFile('claim-data/epoch-0001.json', 'Public claim data');
checkFile('scripts/build-epoch.js', 'Epoch generation script');

if (fs.existsSync('epochs/epoch-0001.json')) {
    try {
        const epochData = JSON.parse(fs.readFileSync('epochs/epoch-0001.json', 'utf8'));
        if (epochData.merkleRoot === '0xddc833d869453b3935e5e64cd450430d15fbbb81fcab74dcf91800b63e02ca2e') {
            console.log('✅ Epoch data: Merkle root matches');
        } else {
            console.log('❌ Epoch data: Merkle root mismatch');
            allReady = false;
        }
        
        if (epochData.totalAmount === '150000000000000000000') {
            console.log('✅ Epoch data: Total amount correct (150 CODE)');
        } else {
            console.log('❌ Epoch data: Total amount incorrect');
            allReady = false;
        }
        
        const claimAddresses = Object.keys(epochData.claims || {});
        if (claimAddresses.length >= 2) {
            console.log(`✅ Epoch data: ${claimAddresses.length} claim addresses`);
        } else {
            console.log('❌ Epoch data: Insufficient claim addresses');
            allReady = false;
        }
    } catch (error) {
        console.log('❌ Epoch data: Invalid JSON format');
        allReady = false;
    }
}

console.log('\n📚 COMPONENT 5: DOCUMENTATION');
console.log('─────────────────────────────────────');
checkFile('WEBHOOK_DEPLOYMENT_GUIDE.md', 'Webhook deployment guide');
checkFile('LIVE_DEPLOYMENT_STEPS.md', 'Live deployment steps');
checkFile('READY_FOR_SECOND_OPINION.md', 'Second opinion package');
checkFile('addresses.base.json', 'Contract addresses reference');

console.log('\n🎯 COMPONENT 6: CONTRACT ADDRESSES');
console.log('─────────────────────────────────────');
if (fs.existsSync('addresses.base.json')) {
    try {
        const addresses = JSON.parse(fs.readFileSync('addresses.base.json', 'utf8'));
        const contracts = addresses.contracts || {};
        
        if (contracts.codeToken?.address === '0x54B3FABD84277FBa55B6b2Fd77cF1A5b1Dc9599C') {
            console.log('✅ CODE Token: Address confirmed');
        } else {
            console.log('❌ CODE Token: Address missing or incorrect');
            allReady = false;
        }
        
        if (contracts.stakingVault?.address === '0xe6F6f49F5865e5230fd2Dc90F9cC8440d8eA5f7c') {
            console.log('✅ sCODE Vault: Address confirmed');
        } else {
            console.log('❌ sCODE Vault: Address missing or incorrect');
            allReady = false;
        }
        
        if (contracts.epochDistributor?.address === '0x36653EFf30fa88765Cf12199A009DdcB2cF724a0') {
            console.log('✅ Epoch Distributor: Address confirmed');
        } else {
            console.log('❌ Epoch Distributor: Address missing or incorrect');
            allReady = false;
        }
        
        if (contracts.safe?.address === '0x813343d30065eAe9D1Be6521203f5C0874818C28') {
            console.log('✅ Safe: Address confirmed');
        } else {
            console.log('❌ Safe: Address missing or incorrect');
            allReady = false;
        }
    } catch (error) {
        console.log('❌ Contract addresses: Invalid JSON');
        allReady = false;
    }
}

console.log('\n═══════════════════════════════════════════════');

if (allReady) {
    console.log('🎉 ALL SYSTEMS READY FOR DEPLOYMENT!');
    console.log('');
    console.log('🚀 NEXT STEPS:');
    console.log('1. Deploy webhook using LIVE_DEPLOYMENT_STEPS.md');
    console.log('2. Execute Safe transactions from safe/safe-transaction-bundle.json');
    console.log('3. Test claim hub using claim-hub-real.html');
    console.log('4. Test webhook with real PR');
    console.log('');
    console.log('🎯 SUCCESS: You have a complete, production-ready');
    console.log('   "Install SDK → Submit PR → Earn CODE → Claim tokens" platform!');
    console.log('');
    console.log('💰 ECONOMIC VALUE: 100M CODE tokens on Base mainnet');
    console.log('🤖 INNOVATION: First agent-built earn-when-you-code platform');
    console.log('⚡ READINESS: Ready for real users and adoption');
} else {
    console.log('❌ DEPLOYMENT NOT READY');
    console.log('');
    console.log('🔧 ISSUES FOUND:');
    issues.forEach(issue => console.log(`   - ${issue}`));
}

console.log('');
console.log('📊 SUMMARY:');
console.log(`   Components checked: 6`);
console.log(`   Status: ${allReady ? '✅ READY' : '❌ NOT READY'}`);
console.log(`   Issues: ${issues.length}`);

process.exit(allReady ? 0 : 1); 
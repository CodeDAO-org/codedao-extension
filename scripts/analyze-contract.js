const { ethers } = require('ethers');

// Contract details
const TOKEN_ADDRESS = '0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0';
const BASE_RPC = 'https://mainnet.base.org';

// Basic ERC20 ABI - we'll probe with this first
const ERC20_ABI = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function decimals() view returns (uint8)",
    "function totalSupply() view returns (uint256)",
    "function balanceOf(address) view returns (uint256)"
];

// Extended ABI for ownership and minting detection
const EXTENDED_ABI = [
    ...ERC20_ABI,
    "function owner() view returns (address)",
    "function hasRole(bytes32,address) view returns (bool)",
    "function getRoleMemberCount(bytes32) view returns (uint256)",
    "function cap() view returns (uint256)",
    "function mint(address,uint256) returns (bool)",
    "function mint(address,uint256)",
    "function authorizedMinters(address) view returns (bool)",
    "function mintingRevoked() view returns (bool)",
    "function pause()",
    "function paused() view returns (bool)"
];

async function analyzeContract() {
    console.log('🔍 CODEDAO TOKEN FORENSIC ANALYSIS');
    console.log('=====================================');
    console.log(`Contract: ${TOKEN_ADDRESS}`);
    console.log(`Network: Base Mainnet`);
    console.log('');

    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    
    try {
        // 1. Get runtime bytecode
        console.log('1️⃣  BYTECODE ANALYSIS');
        console.log('─────────────────────');
        const bytecode = await provider.getCode(TOKEN_ADDRESS);
        console.log(`Bytecode length: ${bytecode.length} characters`);
        console.log(`Bytecode hash: ${ethers.keccak256(bytecode)}`);
        console.log('');

        // 2. Basic ERC20 queries
        console.log('2️⃣  ERC20 STANDARD QUERIES');
        console.log('─────────────────────────');
        const contract = new ethers.Contract(TOKEN_ADDRESS, ERC20_ABI, provider);
        
        const [name, symbol, decimals, totalSupply] = await Promise.all([
            contract.name().catch(() => 'UNKNOWN'),
            contract.symbol().catch(() => 'UNKNOWN'), 
            contract.decimals().catch(() => 18),
            contract.totalSupply().catch(() => '0')
        ]);

        console.log(`Name: ${name}`);
        console.log(`Symbol: ${symbol}`);
        console.log(`Decimals: ${decimals}`);
        console.log(`Total Supply: ${ethers.formatUnits(totalSupply, decimals)} ${symbol}`);
        console.log(`Total Supply (raw): ${totalSupply.toString()}`);
        console.log('');

        // 3. Ownership and role detection
        console.log('3️⃣  OWNERSHIP & ROLES DETECTION');
        console.log('─────────────────────────────');
        const extendedContract = new ethers.Contract(TOKEN_ADDRESS, EXTENDED_ABI, provider);
        
        // Check owner
        try {
            const owner = await extendedContract.owner();
            console.log(`✅ Owner: ${owner}`);
        } catch (e) {
            console.log('❌ No owner() function (not Ownable)');
        }

        // Check for role-based access (OpenZeppelin AccessControl)
        try {
            const MINTER_ROLE = ethers.keccak256(ethers.toUtf8Bytes("MINTER_ROLE"));
            const minterCount = await extendedContract.getRoleMemberCount(MINTER_ROLE);
            console.log(`✅ MINTER_ROLE members: ${minterCount}`);
        } catch (e) {
            console.log('❌ No AccessControl roles detected');
        }

        // Check for custom minting system
        try {
            const mintingRevoked = await extendedContract.mintingRevoked();
            console.log(`✅ Minting revoked: ${mintingRevoked}`);
        } catch (e) {
            console.log('❌ No custom minting revocation system');
        }

        try {
            // Try a test address for authorized minters
            const testAddr = '0x0000000000000000000000000000000000000000';
            const isAuthorized = await extendedContract.authorizedMinters(testAddr);
            console.log(`✅ Has authorizedMinters mapping (test: ${isAuthorized})`);
        } catch (e) {
            console.log('❌ No authorizedMinters mapping');
        }

        // Check if paused
        try {
            const paused = await extendedContract.paused();
            console.log(`✅ Contract paused: ${paused}`);
        } catch (e) {
            console.log('❌ No pausable functionality');
        }

        // Check for cap
        try {
            const cap = await extendedContract.cap();
            console.log(`✅ Supply cap: ${ethers.formatUnits(cap, decimals)} ${symbol}`);
        } catch (e) {
            console.log('❌ No supply cap detected');
        }

        console.log('');

        // 4. Mint function detection
        console.log('4️⃣  MINTING CAPABILITY ANALYSIS');
        console.log('─────────────────────────────');
        
        // Try to detect mint function signatures
        const mintSignatures = [
            'mint(address,uint256)',
            'mint(address,uint256,bytes)',
            'mintForContribution(address,uint256,uint256,string)'
        ];

        for (const sig of mintSignatures) {
            try {
                const fragment = ethers.Fragment.from(`function ${sig}`);
                const selector = ethers.dataSlice(ethers.id(fragment.format()), 0, 4);
                
                // Try to call with dummy data to see if function exists
                const calldata = ethers.concat([
                    selector,
                    ethers.AbiCoder.defaultAbiCoder().encode(['address', 'uint256'], [TOKEN_ADDRESS, 1])
                ]);
                
                try {
                    await provider.call({ to: TOKEN_ADDRESS, data: calldata });
                    console.log(`✅ Function exists: ${sig}`);
                } catch (error) {
                    if (error.message.includes('execution reverted')) {
                        console.log(`✅ Function exists (reverted): ${sig}`);
                    } else {
                        console.log(`❌ Function not found: ${sig}`);
                    }
                }
            } catch (e) {
                console.log(`❌ Invalid signature: ${sig}`);
            }
        }

        console.log('');

        // 5. Calculate minting requirements
        console.log('5️⃣  SUPPLY EXPANSION CALCULATION');
        console.log('──────────────────────────────');
        const targetSupply = ethers.parseUnits('1000000000', decimals); // 1B tokens
        const currentSupplyBN = BigInt(totalSupply.toString());
        const additionalTokens = targetSupply - currentSupplyBN;
        
        console.log(`Target Supply: ${ethers.formatUnits(targetSupply, decimals)} ${symbol}`);
        console.log(`Current Supply: ${ethers.formatUnits(currentSupplyBN, decimals)} ${symbol}`);
        console.log(`Additional needed: ${ethers.formatUnits(additionalTokens, decimals)} ${symbol}`);
        console.log(`Additional (raw): ${additionalTokens.toString()}`);
        console.log('');

        // 6. Summary and next steps
        console.log('6️⃣  SUMMARY & NEXT STEPS');
        console.log('───────────────────────');
        
        if (Number(currentSupplyBN) === 0) {
            console.log('⚠️  WARNING: Total supply is 0 - this may not be the correct contract');
        } else if (ethers.formatUnits(currentSupplyBN, decimals) === '100000000.0') {
            console.log('✅ Confirmed: Contract has expected 100M initial supply');
        } else {
            console.log(`⚠️  Unexpected supply: ${ethers.formatUnits(currentSupplyBN, decimals)} ${symbol}`);
        }

        console.log('');
        console.log('📋 VERIFICATION REQUIREMENTS:');
        console.log(`- Contract: ${TOKEN_ADDRESS}`);
        console.log(`- Network: Base (Chain ID: 8453)`);
        console.log(`- Compiler: Need to determine from build artifacts`);
        console.log(`- Constructor args: Need deployment transaction`);

    } catch (error) {
        console.error('❌ Analysis failed:', error.message);
    }
}

// Run analysis
analyzeContract().catch(console.error); 
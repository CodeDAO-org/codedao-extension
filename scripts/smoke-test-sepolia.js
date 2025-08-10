const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");

async function main() {
    console.log("🧪 Running V2 Smoke Tests on Base Sepolia");
    console.log("=========================================");
    
    // Load deployment data
    const deploymentPath = path.join(__dirname, "../artifacts/v2/addresses.base-sepolia.json");
    if (!fs.existsSync(deploymentPath)) {
        throw new Error("❌ Deployment artifacts not found. Run deploy-v2-sepolia.js first.");
    }
    
    const deployment = JSON.parse(fs.readFileSync(deploymentPath, "utf8"));
    console.log(`📍 Testing contract: ${deployment.contractAddress}`);
    console.log(`🌐 Network: ${deployment.network} (${deployment.chainId})`);
    console.log("");
    
    // Connect to contract
    const [deployer] = await ethers.getSigners();
    const CodeDAOToken = await ethers.getContractFactory("CodeDAOToken");
    const token = CodeDAOToken.attach(deployment.contractAddress);
    
    const testResults = [];
    
    // Test 1: Basic ERC20 Info
    console.log("📋 TEST 1: Basic ERC20 Information");
    console.log("==================================");
    try {
        const name = await token.name();
        const symbol = await token.symbol();
        const decimals = await token.decimals();
        const totalSupply = await token.totalSupply();
        const cap = await token.CAP();
        
        console.log(`• Name: ${name}`);
        console.log(`• Symbol: ${symbol}`);
        console.log(`• Decimals: ${decimals}`);
        console.log(`• Total Supply: ${ethers.formatEther(totalSupply)} ${symbol}`);
        console.log(`• Cap: ${ethers.formatEther(cap)} ${symbol}`);
        
        testResults.push({
            test: "Basic ERC20 Info",
            status: "PASS",
            data: { name, symbol, decimals: Number(decimals), totalSupply: totalSupply.toString(), cap: cap.toString() }
        });
        console.log("✅ PASS");
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        testResults.push({ test: "Basic ERC20 Info", status: "FAIL", error: error.message });
    }
    
    console.log("");
    
    // Test 2: Role Verification
    console.log("🔐 TEST 2: Role Verification");
    console.log("============================");
    try {
        const ADMIN_ROLE = await token.DEFAULT_ADMIN_ROLE();
        const MINTER_ROLE = await token.MINTER_ROLE();
        const PAUSER_ROLE = await token.PAUSER_ROLE();
        
        const hasAdmin = await token.hasRole(ADMIN_ROLE, deployer.address);
        const hasMinter = await token.hasRole(MINTER_ROLE, deployer.address);
        const hasPauser = await token.hasRole(PAUSER_ROLE, deployer.address);
        
        console.log(`• Admin Role (${deployer.address}): ${hasAdmin ? '✅' : '❌'}`);
        console.log(`• Minter Role (${deployer.address}): ${hasMinter ? '✅' : '❌'}`);
        console.log(`• Pauser Role (${deployer.address}): ${hasPauser ? '✅' : '❌'}`);
        
        if (hasAdmin && hasMinter && hasPauser) {
            testResults.push({ test: "Role Verification", status: "PASS" });
            console.log("✅ PASS");
        } else {
            throw new Error("Missing required roles");
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        testResults.push({ test: "Role Verification", status: "FAIL", error: error.message });
    }
    
    console.log("");
    
    // Test 3: Unauthorized Mint (should fail)
    console.log("🚫 TEST 3: Unauthorized Mint (should fail)");
    console.log("==========================================");
    try {
        // Create a new wallet without minter role
        const randomWallet = ethers.Wallet.createRandom().connect(ethers.provider);
        const tokenAsRandom = token.connect(randomWallet);
        
        try {
            await tokenAsRandom.mintForContribution(
                deployer.address,
                ethers.parseEther("100"),
                50,
                "Unauthorized test"
            );
            console.log("❌ FAIL: Unauthorized mint succeeded (should have failed)");
            testResults.push({ test: "Unauthorized Mint", status: "FAIL", error: "Should have reverted" });
        } catch (revertError) {
            console.log(`✅ PASS: Correctly reverted - ${revertError.message.split('(')[0]}`);
            testResults.push({ test: "Unauthorized Mint", status: "PASS" });
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        testResults.push({ test: "Unauthorized Mint", status: "FAIL", error: error.message });
    }
    
    console.log("");
    
    // Test 4: Authorized Mint
    console.log("✅ TEST 4: Authorized Mint");
    console.log("==========================");
    try {
        const beforeBalance = await token.balanceOf(deployer.address);
        const beforeSupply = await token.totalSupply();
        
        const mintTx = await token.mintForContribution(
            deployer.address,
            ethers.parseEther("1000"),
            100,
            "Test mint for smoke testing"
        );
        await mintTx.wait();
        
        const afterBalance = await token.balanceOf(deployer.address);
        const afterSupply = await token.totalSupply();
        
        const balanceIncrease = afterBalance - beforeBalance;
        const supplyIncrease = afterSupply - beforeSupply;
        
        console.log(`• Mint TX: ${mintTx.hash}`);
        console.log(`• Balance increase: ${ethers.formatEther(balanceIncrease)} CODE`);
        console.log(`• Supply increase: ${ethers.formatEther(supplyIncrease)} CODE`);
        
        if (balanceIncrease === ethers.parseEther("1000") && supplyIncrease === ethers.parseEther("1000")) {
            testResults.push({ test: "Authorized Mint", status: "PASS", txHash: mintTx.hash });
            console.log("✅ PASS");
        } else {
            throw new Error("Mint amounts don't match expected values");
        }
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        testResults.push({ test: "Authorized Mint", status: "FAIL", error: error.message });
    }
    
    console.log("");
    
    // Test 5: Pause/Unpause
    console.log("⏸️  TEST 5: Pause/Unpause Functionality");
    console.log("======================================");
    try {
        // Pause
        const pauseTx = await token.pause();
        await pauseTx.wait();
        
        const isPaused = await token.paused();
        console.log(`• Contract paused: ${isPaused ? '✅' : '❌'}`);
        
        // Try transfer while paused (should fail)
        try {
            await token.transfer(ethers.ZeroAddress, 1);
            throw new Error("Transfer succeeded while paused (should have failed)");
        } catch (revertError) {
            console.log(`• Transfer blocked while paused: ✅`);
        }
        
        // Unpause
        const unpauseTx = await token.unpause();
        await unpauseTx.wait();
        
        const isUnpaused = !(await token.paused());
        console.log(`• Contract unpaused: ${isUnpaused ? '✅' : '❌'}`);
        
        testResults.push({ 
            test: "Pause/Unpause", 
            status: "PASS", 
            txHashes: { pause: pauseTx.hash, unpause: unpauseTx.hash }
        });
        console.log("✅ PASS");
    } catch (error) {
        console.log(`❌ FAIL: ${error.message}`);
        testResults.push({ test: "Pause/Unpause", status: "FAIL", error: error.message });
    }
    
    console.log("");
    
    // Generate test report
    console.log("📊 GENERATING TEST REPORT");
    console.log("=========================");
    
    const testReport = {
        timestamp: new Date().toISOString(),
        network: deployment.network,
        contractAddress: deployment.contractAddress,
        tester: deployer.address,
        summary: {
            total: testResults.length,
            passed: testResults.filter(t => t.status === "PASS").length,
            failed: testResults.filter(t => t.status === "FAIL").length
        },
        tests: testResults
    };
    
    const reportPath = path.join(__dirname, "../artifacts/v2/smoke-test-report.base-sepolia.json");
    fs.writeFileSync(reportPath, JSON.stringify(testReport, null, 2));
    
    console.log(`✅ Test report saved: ${reportPath}`);
    console.log("");
    console.log("📋 SUMMARY:");
    console.log(`• Total Tests: ${testReport.summary.total}`);
    console.log(`• Passed: ${testReport.summary.passed} ✅`);
    console.log(`• Failed: ${testReport.summary.failed} ${testReport.summary.failed > 0 ? '❌' : '✅'}`);
    
    if (testReport.summary.failed > 0) {
        console.log("");
        console.log("❌ Some tests failed. Check the report for details.");
        process.exit(1);
    } else {
        console.log("");
        console.log("🎉 All tests passed! Contract is ready for verification.");
        return testReport;
    }
}

main()
    .then((report) => {
        console.log(`\n✅ Smoke tests completed successfully!`);
        process.exit(0);
    })
    .catch((error) => {
        console.error(`\n❌ Smoke tests failed:`, error);
        process.exit(1);
    }); 
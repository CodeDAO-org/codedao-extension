const fs = require('fs');

// Generate Standard JSON for BaseScan verification
function generateStandardJson() {
    const standardJson = {
        "language": "Solidity",
        "sources": {
            "contracts/CodeDAOToken.sol": {
                "content": `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CodeDAOToken {
    string public name = "CodeDAO Token";
    string public symbol = "CODE";
    uint8 public decimals = 18;
    uint256 public totalSupply = 100_000_000e18; // 100M tokens
    
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;
    
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approval(address indexed owner, address indexed spender, uint256 value);
    
    constructor() {
        balanceOf[0x813343d30065eAe9D1Be6521203f5C0874818C28] = totalSupply; // Mint to Safe
        emit Transfer(address(0), 0x813343d30065eAe9D1Be6521203f5C0874818C28, totalSupply);
    }
    
    function transfer(address to, uint256 value) external returns (bool) {
        require(balanceOf[msg.sender] >= value, "Insufficient balance");
        balanceOf[msg.sender] -= value;
        balanceOf[to] += value;
        emit Transfer(msg.sender, to, value);
        return true;
    }
    
    function approve(address spender, uint256 value) external returns (bool) {
        allowance[msg.sender][spender] = value;
        emit Approval(msg.sender, spender, value);
        return true;
    }
    
    function transferFrom(address from, address to, uint256 value) external returns (bool) {
        require(balanceOf[from] >= value, "Insufficient balance");
        require(allowance[from][msg.sender] >= value, "Insufficient allowance");
        
        balanceOf[from] -= value;
        balanceOf[to] += value;
        allowance[from][msg.sender] -= value;
        
        emit Transfer(from, to, value);
        return true;
    }
}`
            }
        },
        "settings": {
            "optimizer": {
                "enabled": true,
                "runs": 10000
            },
            "outputSelection": {
                "*": {
                    "*": ["*"]
                }
            },
            "evmVersion": "paris"
        }
    };
    
    console.log('\n🔧 **Standard JSON for BaseScan Verification:**\n');
    console.log('Copy this EXACT JSON to the "Standard-Json-Input" option:\n');
    console.log(JSON.stringify(standardJson, null, 2));
    
    // Save to file
    fs.writeFileSync('standard-json-verification.json', JSON.stringify(standardJson, null, 2));
    console.log('\n✅ Also saved to: standard-json-verification.json');
    
    console.log('\n📋 **Instructions:**');
    console.log('1. Go back to BaseScan verification');
    console.log('2. Choose "Standard-Json-Input" instead of "Solidity (Single file)"');
    console.log('3. Paste the JSON above');
    console.log('4. Contract Name: "contracts/CodeDAOToken.sol:CodeDAOToken"');
}

generateStandardJson(); 
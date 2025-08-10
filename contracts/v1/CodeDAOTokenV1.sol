// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CodeDAOToken (v1 - Deployed Version)
 * @dev Simple ERC20 Token with fixed 100M supply and owner
 * 
 * This is the EXACT source code that matches the deployed contract at:
 * 0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0
 * 
 * Features:
 * - Fixed 100M supply (no minting capability)
 * - Ownable pattern
 * - Standard ERC20 functionality only
 */
contract CodeDAOToken is ERC20, Ownable {
    
    constructor() ERC20("CodeDAO Token", "CODE") Ownable(msg.sender) {
        // Mint exactly 100 million tokens to deployer
        _mint(msg.sender, 100_000_000 * 10**18);
    }
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CodeDAOToken (Original Deployed Version)
 * @dev Simple ERC20 Token with fixed 100M supply
 */
contract CodeDAOToken is ERC20, Ownable {
    
    constructor() ERC20("CodeDAO Token", "CODE") Ownable(msg.sender) {
        // Mint 100 million tokens to deployer
        _mint(msg.sender, 100_000_000 * 10**18);
    }
} 
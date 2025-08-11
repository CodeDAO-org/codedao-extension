// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title CodeDAO Token
 * @dev Create a pinned, reproducible ERC20 project for CODE with CI preflight.
 * 
 * Token Details:
 * - Name: CodeDAO Token
 * - Symbol: CODE
 * - Decimals: 18
 * - Total Supply: 100M (100000000e18)
 * - Owner Model: none
 * - Mint Destination: 0x813343d30065eAe9D1Be6521203f5C0874818C28
 */
contract CodeDAOToken is ERC20 {
    /**
     * @dev Constructor mints the entire supply to the specified address
     * @param _to Address to receive the initial token supply
     */
    constructor(address _to) ERC20("CodeDAO Token", "CODE") {
        require(_to != address(0), "CodeDAOToken: mint to zero address");
        _mint(_to, 100000000e18);
    }
}
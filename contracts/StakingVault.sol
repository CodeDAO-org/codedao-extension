// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CodeDAOToken.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

/**
 * @title StakingVault (sCODE)
 * @notice Liquid staking: stake CODE → receive sCODE 1:1
 * @notice sCODE balance unlocks premium features in CodeDAO platform
 * @dev Also serves as governance token with delegation support
 */
contract StakingVault is ERC20, ERC20Permit, ERC20Votes {
    CodeDAOToken public immutable codeToken;
    
    event Stake(address indexed user, uint256 amount);
    event Unstake(address indexed user, uint256 amount);
    
    constructor(address _codeToken) 
        ERC20("Staked CodeDAO Token", "sCODE")
        ERC20Permit("Staked CodeDAO Token")
    {
        codeToken = CodeDAOToken(_codeToken);
    }
    
    /**
     * @notice Stake CODE tokens to receive sCODE 1:1
     */
    function stake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        
        // Transfer CODE from user to vault
        require(codeToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        
        // Mint sCODE 1:1
        _mint(msg.sender, amount);
        
        emit Stake(msg.sender, amount);
    }
    
    /**
     * @notice Unstake sCODE to receive CODE 1:1
     */
    function unstake(uint256 amount) external {
        require(amount > 0, "Amount must be > 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient sCODE");
        
        // Burn sCODE
        _burn(msg.sender, amount);
        
        // Transfer CODE back to user
        require(codeToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit Unstake(msg.sender, amount);
    }
    
    /**
     * @notice Get user's staking tier based on sCODE balance
     */
    function getUserTier(address user) external view returns (string memory) {
        uint256 balance = balanceOf(user);
        
        if (balance >= 250_000e18) return "Partner";
        if (balance >= 50_000e18) return "Pro"; 
        if (balance >= 10_000e18) return "Builder";
        return "Free";
    }
    
    /**
     * @notice Check if user qualifies for specific tier
     */
    function hasMinStake(address user, uint256 minAmount) external view returns (bool) {
        return balanceOf(user) >= minAmount;
    }

    // Required overrides for ERC20Votes
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._burn(account, amount);
    }
} 
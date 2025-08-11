// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CodeDAOToken 
 * @dev ERC20 Token for CodeDAO - Rewarding developers for coding contributions
 * 
 * KEY TOKENOMICS:
 * • Total Supply: 1,000,000,000 CODE (1 Billion tokens)
 * • Initial Supply: All tokens minted at deployment
 * • Minting: Can be revoked permanently by owner
 * • Pausable: For emergency situations
 * • Authorized Minters: System for controlled minting before revocation
 * 
 * DISTRIBUTION PLAN:
 * • 60% (600M) - Coding Rewards Pool (distributed over 5-10 years)
 * • 15% (150M) - Team & Development (3 year vesting)
 * • 10% (100M) - Community Treasury (DAO governance)
 * • 8% (80M) - Ecosystem Partnerships
 * • 4% (40M) - Liquidity Provision
 * • 3% (30M) - Marketing & Growth
 */
contract CodeDAOToken is ERC20, ERC20Pausable, Ownable {
    
    // =============================================================================
    // CONSTANTS
    // =============================================================================
    
    /// @dev Maximum possible supply: 1 billion tokens
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 10**18;
    
    // =============================================================================
    // STATE VARIABLES  
    // =============================================================================
    
    /// @dev Mapping of authorized minters
    mapping(address => bool) public authorizedMinters;
    
    /// @dev Whether minting has been permanently revoked
    bool public mintingRevoked;
    
    /// @dev Mapping to track contributions for each user
    mapping(address => uint256) public contributionCount;
    
    /// @dev Mapping to track total lines of code written by each user
    mapping(address => uint256) public totalLinesWritten;
    
    // =============================================================================
    // EVENTS
    // =============================================================================
    
    /// @dev Emitted when a minter is authorized
    event MinterAuthorized(address indexed minter);
    
    /// @dev Emitted when a minter is revoked
    event MinterRevoked(address indexed minter);
    
    /// @dev Emitted when minting is permanently revoked
    event MintingPermanentlyRevoked();
    
    /// @dev Emitted when tokens are minted for coding contributions
    event CodingReward(
        address indexed user, 
        uint256 amount, 
        uint256 linesWritten, 
        string reason
    );
    
    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================
    
    constructor() ERC20("CodeDAO Token", "CODE") Ownable(msg.sender) {
        // Mint all 1 billion tokens to the deployer
        // Owner will then distribute according to tokenomics plan
        _mint(msg.sender, MAX_SUPPLY);
        
        // Initially authorize the deployer as a minter
        authorizedMinters[msg.sender] = true;
        emit MinterAuthorized(msg.sender);
    }
    
    // =============================================================================
    // MINTING FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Authorizes an address to mint tokens
     * @param minter Address to authorize for minting
     */
    function authorizeMinter(address minter) external onlyOwner {
        require(!mintingRevoked, "Minting has been permanently revoked");
        authorizedMinters[minter] = true;
        emit MinterAuthorized(minter);
    }
    
    /**
     * @dev Revokes minting authorization from an address
     * @param minter Address to revoke minting authorization from
     */
    function revokeMinter(address minter) external onlyOwner {
        authorizedMinters[minter] = false;
        emit MinterRevoked(minter);
    }
    
    /**
     * @dev Permanently revokes all minting capabilities
     * This action cannot be undone and ensures fixed supply
     */
    function revokeMintingPermanently() external onlyOwner {
        mintingRevoked = true;
        emit MintingPermanentlyRevoked();
    }
    
    /**
     * @dev Mints tokens for coding contributions
     * @param user Address to receive the tokens
     * @param amount Amount of tokens to mint
     * @param linesWritten Number of lines of code written
     * @param reason Description of the contribution
     */
    function mintForContribution(
        address user,
        uint256 amount,
        uint256 linesWritten,
        string calldata reason
    ) external whenNotPaused {
        require(!mintingRevoked, "Minting has been permanently revoked");
        require(authorizedMinters[msg.sender], "Not authorized to mint");
        require(totalSupply() + amount <= MAX_SUPPLY, "Exceeds max supply");
        require(user != address(0), "Invalid user address");
        
        // Update user statistics
        contributionCount[user] += linesWritten;
        totalLinesWritten[user] += linesWritten;
        
        // Mint tokens
        _mint(user, amount);
        
        emit CodingReward(user, amount, linesWritten, reason);
    }
    
    // =============================================================================
    // VIEW FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Returns user's contribution statistics
     * @param user Address to query
     * @return balance Current token balance
     * @return contributions Total contribution count  
     * @return linesWritten Total lines of code written
     */
    function getUserStats(address user) external view returns (
        uint256 balance,
        uint256 contributions, 
        uint256 linesWritten
    ) {
        return (
            balanceOf(user),
            contributionCount[user],
            totalLinesWritten[user]
        );
    }
    
    // =============================================================================
    // ADMIN FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Pauses all token transfers
     * Only callable by owner in emergency situations
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpauses all token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // =============================================================================
    // INTERNAL OVERRIDES
    // =============================================================================
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable)
    {
        super._update(from, to, value);
    }
} 
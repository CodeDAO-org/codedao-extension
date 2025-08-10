// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Capped.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title CodeDAOToken V2 (Enhanced)
 * @dev ERC20 Token for CodeDAO with advanced features
 * 
 * KEY FEATURES:
 * • 1,000,000,000 CODE total supply cap (1 Billion tokens)
 * • Role-based access control (MINTER_ROLE, PAUSER_ROLE)
 * • Pausable transfers for emergency situations
 * • EIP-2612 Permit support for gasless approvals
 * • Mintable with permanent revocation capability
 * • Comprehensive contribution tracking
 * 
 * ROLES:
 * • DEFAULT_ADMIN_ROLE: Can manage all roles (Safe multisig)
 * • MINTER_ROLE: Can mint tokens for rewards
 * • PAUSER_ROLE: Can pause/unpause transfers
 * 
 * DEPLOYMENT STRATEGY:
 * • Deploy with 0 initial supply
 * • Mint to distribution contracts post-deployment
 * • Assign roles to appropriate addresses
 * • Optionally revoke minting permanently after distribution
 */
contract CodeDAOToken is ERC20, ERC20Pausable, ERC20Permit, ERC20Capped, AccessControl {
    
    // =============================================================================
    // ROLES
    // =============================================================================
    
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    
    // =============================================================================
    // STATE VARIABLES
    // =============================================================================
    
    /// @dev Whether minting has been permanently revoked
    bool public mintingRevoked;
    
    /// @dev Mapping to track contributions for each user
    mapping(address => uint256) public contributionCount;
    
    /// @dev Mapping to track total lines of code written by each user
    mapping(address => uint256) public totalLinesWritten;
    
    // =============================================================================
    // EVENTS
    // =============================================================================
    
    /// @dev Emitted when minting is permanently revoked
    event MintingPermanentlyRevoked();
    
    /// @dev Emitted when tokens are minted for coding contributions
    event CodingReward(
        address indexed user, 
        uint256 amount, 
        uint256 linesWritten, 
        string reason
    );
    
    /// @dev Emitted when batch minting occurs
    event BatchMint(
        address indexed minter,
        uint256 totalAmount,
        uint256 recipientCount
    );
    
    // =============================================================================
    // CONSTRUCTOR
    // =============================================================================
    
    /**
     * @dev Initializes the token with 1B cap and assigns admin role
     * @param admin Address to receive DEFAULT_ADMIN_ROLE (should be Safe multisig)
     */
    constructor(address admin) 
        ERC20("CodeDAO Token", "CODE") 
        ERC20Permit("CodeDAO Token")
        ERC20Capped(1_000_000_000 * 10**18) // 1 Billion tokens max
    {
        require(admin != address(0), "Admin cannot be zero address");
        
        // Grant admin role to the specified address (Safe multisig)
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        
        // Initially grant minter and pauser roles to admin
        // These can be delegated to specific contracts/addresses later
        _grantRole(MINTER_ROLE, admin);
        _grantRole(PAUSER_ROLE, admin);
        
        // Note: Deploy with 0 initial supply
        // Tokens will be minted post-deployment according to distribution plan
    }
    
    // =============================================================================
    // MINTING FUNCTIONS
    // =============================================================================
    
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
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(!mintingRevoked, "Minting has been permanently revoked");
        require(user != address(0), "Invalid user address");
        require(amount > 0, "Amount must be greater than 0");
        
        // Update user statistics
        contributionCount[user] += linesWritten;
        totalLinesWritten[user] += linesWritten;
        
        // Mint tokens (ERC20Capped will check cap automatically)
        _mint(user, amount);
        
        emit CodingReward(user, amount, linesWritten, reason);
    }
    
    /**
     * @dev Mints tokens to a specific address (for distribution, liquidity, etc.)
     * @param to Address to receive tokens
     * @param amount Amount to mint
     */
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(!mintingRevoked, "Minting has been permanently revoked");
        require(to != address(0), "Cannot mint to zero address");
        require(amount > 0, "Amount must be greater than 0");
        
        _mint(to, amount);
    }
    
    /**
     * @dev Batch mint to multiple recipients (gas efficient for airdrops)
     * @param recipients Array of addresses to receive tokens
     * @param amounts Array of amounts to mint to each recipient
     */
    function batchMint(
        address[] calldata recipients, 
        uint256[] calldata amounts
    ) external onlyRole(MINTER_ROLE) whenNotPaused {
        require(!mintingRevoked, "Minting has been permanently revoked");
        require(recipients.length == amounts.length, "Arrays length mismatch");
        require(recipients.length > 0, "No recipients provided");
        
        uint256 totalAmount = 0;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            require(recipients[i] != address(0), "Cannot mint to zero address");
            require(amounts[i] > 0, "Amount must be greater than 0");
            
            _mint(recipients[i], amounts[i]);
            totalAmount += amounts[i];
        }
        
        emit BatchMint(msg.sender, totalAmount, recipients.length);
    }
    
    /**
     * @dev Permanently revokes all minting capabilities
     * This action cannot be undone and ensures fixed supply
     * Only callable by DEFAULT_ADMIN_ROLE
     */
    function revokeMintingPermanently() external onlyRole(DEFAULT_ADMIN_ROLE) {
        mintingRevoked = true;
        emit MintingPermanentlyRevoked();
    }
    
    // =============================================================================
    // PAUSE FUNCTIONS
    // =============================================================================
    
    /**
     * @dev Pauses all token transfers
     * Only callable by PAUSER_ROLE in emergency situations
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }
    
    /**
     * @dev Unpauses all token transfers
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
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
    
    /**
     * @dev Returns current supply information
     * @return current Current total supply
     * @return maximum Maximum possible supply (cap)
     * @return remaining Remaining mintable supply
     */
    function getSupplyInfo() external view returns (
        uint256 current,
        uint256 maximum,
        uint256 remaining
    ) {
        current = totalSupply();
        maximum = cap();
        remaining = maximum - current;
        
        return (current, maximum, remaining);
    }
    
    /**
     * @dev Checks if minting is currently allowed
     * @return canMint True if minting is possible
     * @return reason Human-readable reason if minting is not allowed
     */
    function getMintingStatus() external view returns (
        bool canMint,
        string memory reason
    ) {
        if (mintingRevoked) {
            return (false, "Minting permanently revoked");
        }
        if (paused()) {
            return (false, "Contract is paused");
        }
        if (totalSupply() >= cap()) {
            return (false, "Supply cap reached");
        }
        
        return (true, "Minting allowed");
    }
    
    // =============================================================================
    // INTERNAL OVERRIDES
    // =============================================================================
    
    /**
     * @dev Override required by Solidity for multiple inheritance
     */
    function _update(address from, address to, uint256 value)
        internal
        override(ERC20, ERC20Pausable, ERC20Capped)
    {
        super._update(from, to, value);
    }
    
    /**
     * @dev Override required for AccessControl interface support
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CodeDAOToken.sol";
import "./StakingVault.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title MerkleDistributorV2 
 * @notice Cumulative Merkle distributor for airdrops + builder rewards
 * @dev Supports claim-to-stake, gasless claims, and multi-epoch aggregation
 */
contract MerkleDistributorV2 is Pausable, ReentrancyGuard, Ownable {
    CodeDAOToken public immutable token;
    StakingVault public immutable stakingVault;
    
    // Epoch tracking
    uint256 public currentEpoch;
    mapping(uint256 => bytes32) public epochRoots;
    mapping(uint256 => uint256) public epochTotals;
    mapping(uint256 => string) public epochDescriptions;
    mapping(uint256 => uint256) public epochExpiry;
    
    // Cumulative claims tracking
    mapping(address => uint256) public claimed;
    
    // Gasless relay
    address public relayer;
    mapping(address => bool) public hasClaimedGasless;
    uint256 public gaslessClaimCount;
    uint256 public constant MAX_GASLESS_CLAIMS = 1000;
    
    // Emergency controls
    address public rootGuardian;
    mapping(uint256 => uint256) public epochCaps;
    
    event EpochSet(uint256 indexed epochId, bytes32 merkleRoot, uint256 totalAmount, string description);
    event Claimed(address indexed user, uint256 amount, bool autoStaked, uint256 epochId);
    event GaslessClaimed(address indexed user, uint256 amount, address indexed relayer);
    event RelayerUpdated(address indexed oldRelayer, address indexed newRelayer);
    
    modifier onlyRelayer() {
        require(msg.sender == relayer, "Not relayer");
        _;
    }
    
    modifier onlyGuardian() {
        require(msg.sender == rootGuardian || msg.sender == owner(), "Not guardian");
        _;
    }
    
    constructor(
        address _token,
        address _stakingVault,
        address _rootGuardian
    ) {
        token = CodeDAOToken(_token);
        stakingVault = StakingVault(_stakingVault);
        rootGuardian = _rootGuardian;
    }
    
    /**
     * @notice Set Merkle root for new epoch (cumulative)
     * @param epochId Epoch number (must be sequential)
     * @param merkleRoot Root of Merkle tree with cumulative amounts
     * @param totalAmount Total tokens allocated for this epoch
     * @param description Human readable description
     * @param expiryDays Days until epoch expires (0 = no expiry)
     */
    function setEpochRoot(
        uint256 epochId,
        bytes32 merkleRoot,
        uint256 totalAmount,
        string calldata description,
        uint256 expiryDays
    ) external onlyOwner {
        require(epochId == currentEpoch + 1, "Must be sequential");
        require(merkleRoot != bytes32(0), "Invalid root");
        
        epochRoots[epochId] = merkleRoot;
        epochTotals[epochId] = totalAmount;
        epochDescriptions[epochId] = description;
        
        if (expiryDays > 0) {
            epochExpiry[epochId] = block.timestamp + (expiryDays * 1 days);
        }
        
        // Set conservative cap (150% of stated total)
        epochCaps[epochId] = (totalAmount * 150) / 100;
        
        currentEpoch = epochId;
        
        emit EpochSet(epochId, merkleRoot, totalAmount, description);
    }
    
    /**
     * @notice Claim tokens (with auto-stake option)
     * @param cumulativeAmount Total lifetime earnings for user
     * @param autoStake Whether to automatically stake claimed tokens
     * @param merkleProof Proof of inclusion in latest epoch
     */
    function claim(
        uint256 cumulativeAmount,
        bool autoStake,
        bytes32[] calldata merkleProof
    ) external nonReentrant whenNotPaused {
        _claim(msg.sender, cumulativeAmount, autoStake, merkleProof, false);
    }
    
    /**
     * @notice Gasless claim for first-time users (relayer pays gas)
     * @param user Address to claim for
     * @param cumulativeAmount Total lifetime earnings
     * @param autoStake Whether to auto-stake
     * @param merkleProof Merkle proof
     */
    function claimGasless(
        address user,
        uint256 cumulativeAmount,
        bool autoStake,
        bytes32[] calldata merkleProof
    ) external onlyRelayer nonReentrant whenNotPaused {
        require(!hasClaimedGasless[user], "Already used gasless");
        require(gaslessClaimCount < MAX_GASLESS_CLAIMS, "Gasless quota exceeded");
        
        hasClaimedGasless[user] = true;
        gaslessClaimCount++;
        
        uint256 amount = _claim(user, cumulativeAmount, autoStake, merkleProof, true);
        
        emit GaslessClaimed(user, amount, msg.sender);
    }
    
    /**
     * @notice Batch claim multiple users (for airdrops)
     */
    function claimBatch(
        address[] calldata users,
        uint256[] calldata cumulativeAmounts,
        bool autoStake,
        bytes32[][] calldata merkleProofs
    ) external nonReentrant whenNotPaused {
        require(users.length == cumulativeAmounts.length && users.length == merkleProofs.length, "Array mismatch");
        require(users.length <= 20, "Batch too large");
        
        for (uint256 i = 0; i < users.length; i++) {
            _claim(users[i], cumulativeAmounts[i], autoStake, merkleProofs[i], false);
        }
    }
    
    /**
     * @notice Internal claim logic
     */
    function _claim(
        address user,
        uint256 cumulativeAmount,
        bool autoStake,
        bytes32[] calldata merkleProof,
        bool isGasless
    ) internal returns (uint256 claimAmount) {
        // Check expiry
        if (epochExpiry[currentEpoch] > 0) {
            require(block.timestamp <= epochExpiry[currentEpoch], "Epoch expired");
        }
        
        // Calculate claimable amount
        uint256 alreadyClaimed = claimed[user];
        require(cumulativeAmount > alreadyClaimed, "Nothing to claim");
        
        claimAmount = cumulativeAmount - alreadyClaimed;
        
        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(user, cumulativeAmount));
        require(_verifyProof(merkleProof, epochRoots[currentEpoch], leaf), "Invalid proof");
        
        // Update claimed amount
        claimed[user] = cumulativeAmount;
        
        // Transfer or stake tokens
        if (autoStake) {
            // Approve staking vault and stake
            require(token.transfer(address(stakingVault), claimAmount), "Transfer failed");
            // Note: StakingVault needs to be updated to accept direct deposits
            // For now, we'll transfer to user and they can stake separately
            require(token.transfer(user, claimAmount), "Transfer failed");
        } else {
            require(token.transfer(user, claimAmount), "Transfer failed");
        }
        
        emit Claimed(user, claimAmount, autoStake, currentEpoch);
    }
    
    /**
     * @notice Get claimable amount for user
     */
    function getClaimableAmount(address user, uint256 cumulativeAmount) external view returns (uint256) {
        uint256 alreadyClaimed = claimed[user];
        if (cumulativeAmount <= alreadyClaimed) return 0;
        return cumulativeAmount - alreadyClaimed;
    }
    
    /**
     * @notice Check if user is eligible for gasless claim
     */
    function canClaimGasless(address user) external view returns (bool) {
        return !hasClaimedGasless[user] && gaslessClaimCount < MAX_GASLESS_CLAIMS;
    }
    
    /**
     * @notice Get epoch information
     */
    function getEpochInfo(uint256 epochId) external view returns (
        bytes32 root,
        uint256 total,
        string memory description,
        uint256 expiry,
        bool isActive
    ) {
        return (
            epochRoots[epochId],
            epochTotals[epochId],
            epochDescriptions[epochId],
            epochExpiry[epochId],
            epochId <= currentEpoch && (epochExpiry[epochId] == 0 || block.timestamp <= epochExpiry[epochId])
        );
    }
    
    /**
     * @notice Emergency pause by guardian
     */
    function emergencyPause() external onlyGuardian {
        _pause();
    }
    
    /**
     * @notice Resume after pause
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @notice Update relayer address
     */
    function setRelayer(address newRelayer) external onlyOwner {
        address oldRelayer = relayer;
        relayer = newRelayer;
        emit RelayerUpdated(oldRelayer, newRelayer);
    }
    
    /**
     * @notice Update root guardian
     */
    function setRootGuardian(address newGuardian) external onlyOwner {
        rootGuardian = newGuardian;
    }
    
    /**
     * @notice Emergency withdrawal (only after epoch expiry)
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(epochExpiry[currentEpoch] > 0 && block.timestamp > epochExpiry[currentEpoch], "Epoch not expired");
        require(token.transfer(owner(), amount), "Transfer failed");
    }
    
    /**
     * @notice Fund the contract
     */
    function fund(uint256 amount) external {
        require(token.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
    
    /**
     * @notice Verify Merkle proof
     */
    function _verifyProof(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        return computedHash == root;
    }
} 
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CodeDAOToken.sol";

/**
 * @title CodeEpochDistributor
 * @notice Distributes CODE rewards based on builder contributions (PRs, reviews, etc.)
 * @notice Uses Merkle claims for gas-efficient batch distribution
 */
contract CodeEpochDistributor {
    CodeDAOToken public immutable codeToken;
    address public owner;
    
    struct Epoch {
        bytes32 merkleRoot;
        uint256 totalRewards;
        uint256 startTime;
        uint256 endTime;
        bool finalized;
        mapping(address => bool) claimed;
    }
    
    mapping(uint256 => Epoch) public epochs;
    uint256 public currentEpoch;
    uint256 public constant EPOCH_DURATION = 7 days; // Weekly epochs
    
    event EpochFinalized(uint256 indexed epochId, bytes32 merkleRoot, uint256 totalRewards);
    event RewardClaimed(uint256 indexed epochId, address indexed user, uint256 amount);
    event EpochStarted(uint256 indexed epochId, uint256 startTime);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    constructor(address _codeToken) {
        codeToken = CodeDAOToken(_codeToken);
        owner = msg.sender;
        
        // Start first epoch
        startNewEpoch();
    }
    
    /**
     * @notice Start a new epoch for rewards distribution
     */
    function startNewEpoch() public {
        uint256 newEpochId = currentEpoch;
        
        epochs[newEpochId].startTime = block.timestamp;
        epochs[newEpochId].endTime = block.timestamp + EPOCH_DURATION;
        
        currentEpoch++;
        
        emit EpochStarted(newEpochId, block.timestamp);
    }
    
    /**
     * @notice Finalize an epoch with Merkle root and total rewards
     * @param epochId The epoch to finalize
     * @param merkleRoot Root of the Merkle tree containing (address, amount) pairs
     * @param totalRewards Total CODE to distribute this epoch
     */
    function finalizeEpoch(
        uint256 epochId,
        bytes32 merkleRoot, 
        uint256 totalRewards
    ) external onlyOwner {
        require(epochId < currentEpoch, "Epoch not started");
        require(!epochs[epochId].finalized, "Already finalized");
        require(block.timestamp >= epochs[epochId].endTime, "Epoch not ended");
        require(merkleRoot != bytes32(0), "Invalid merkle root");
        
        epochs[epochId].merkleRoot = merkleRoot;
        epochs[epochId].totalRewards = totalRewards;
        epochs[epochId].finalized = true;
        
        emit EpochFinalized(epochId, merkleRoot, totalRewards);
    }
    
    /**
     * @notice Claim rewards for a specific epoch using Merkle proof
     * @param epochId The epoch to claim from
     * @param amount The amount of CODE to claim
     * @param merkleProof Array of hashes proving inclusion in Merkle tree
     */
    function claimRewards(
        uint256 epochId,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        require(epochs[epochId].finalized, "Epoch not finalized");
        require(!epochs[epochId].claimed[msg.sender], "Already claimed");
        
        // Verify Merkle proof
        bytes32 leaf = keccak256(abi.encodePacked(msg.sender, amount));
        require(verifyMerkleProof(merkleProof, epochs[epochId].merkleRoot, leaf), "Invalid proof");
        
        // Mark as claimed and transfer tokens
        epochs[epochId].claimed[msg.sender] = true;
        require(codeToken.transfer(msg.sender, amount), "Transfer failed");
        
        emit RewardClaimed(epochId, msg.sender, amount);
    }
    
    /**
     * @notice Check if user has claimed rewards for an epoch
     */
    function hasClaimed(uint256 epochId, address user) external view returns (bool) {
        return epochs[epochId].claimed[user];
    }
    
    /**
     * @notice Get epoch info
     */
    function getEpochInfo(uint256 epochId) external view returns (
        bytes32 merkleRoot,
        uint256 totalRewards,
        uint256 startTime,
        uint256 endTime,
        bool finalized
    ) {
        Epoch storage epoch = epochs[epochId];
        return (
            epoch.merkleRoot,
            epoch.totalRewards,
            epoch.startTime,
            epoch.endTime,
            epoch.finalized
        );
    }
    
    /**
     * @notice Fund the contract with CODE tokens for distributions
     */
    function fundContract(uint256 amount) external {
        require(codeToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
    
    /**
     * @notice Emergency withdrawal by owner
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(codeToken.transfer(owner, amount), "Transfer failed");
    }
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    /**
     * @notice Verify Merkle proof
     */
    function verifyMerkleProof(
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
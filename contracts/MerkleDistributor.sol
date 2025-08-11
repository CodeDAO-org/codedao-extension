// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CodeDAOToken.sol";

/**
 * @title MerkleDistributor
 * @notice Distributes CODE tokens via Merkle tree claims (airdrops + rewards)
 * @dev Gas-efficient batch distribution with expiry and admin controls
 */
contract MerkleDistributor {
    CodeDAOToken public immutable token;
    bytes32 public immutable merkleRoot;
    string public description;
    uint256 public immutable expiry;
    address public immutable admin;
    
    // Packed array of claimed bitmasks (gas efficient)
    mapping(uint256 => uint256) private claimedBitMap;
    
    event Claimed(uint256 index, address account, uint256 amount);
    event EmergencyWithdraw(address admin, uint256 amount);
    
    constructor(
        address _token,
        bytes32 _merkleRoot,
        string memory _description,
        uint256 _expiry,
        address _admin
    ) {
        token = CodeDAOToken(_token);
        merkleRoot = _merkleRoot;
        description = _description;
        expiry = _expiry;
        admin = _admin;
    }
    
    /**
     * @notice Check if an index has been claimed
     */
    function isClaimed(uint256 index) public view returns (bool) {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord = claimedBitMap[claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }
    
    /**
     * @notice Mark an index as claimed
     */
    function _setClaimed(uint256 index) private {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        claimedBitMap[claimedWordIndex] = claimedBitMap[claimedWordIndex] | (1 << claimedBitIndex);
    }
    
    /**
     * @notice Claim tokens using Merkle proof
     * @param index Position in the Merkle tree
     * @param account Address claiming tokens
     * @param amount Amount of tokens to claim
     * @param merkleProof Array of hashes proving inclusion
     */
    function claim(
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        require(block.timestamp <= expiry, "Claim period expired");
        require(!isClaimed(index), "Already claimed");
        
        // Verify the merkle proof
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(verify(merkleProof, merkleRoot, node), "Invalid proof");
        
        // Mark as claimed and transfer
        _setClaimed(index);
        require(token.transfer(account, amount), "Transfer failed");
        
        emit Claimed(index, account, amount);
    }
    
    /**
     * @notice Batch claim for multiple users (gas optimization)
     */
    function claimMultiple(
        uint256[] calldata indices,
        address[] calldata accounts,
        uint256[] calldata amounts,
        bytes32[][] calldata merkleProofs
    ) external {
        require(block.timestamp <= expiry, "Claim period expired");
        require(indices.length == accounts.length && accounts.length == amounts.length && amounts.length == merkleProofs.length, "Array length mismatch");
        
        for (uint256 i = 0; i < indices.length; i++) {
            uint256 index = indices[i];
            address account = accounts[i];
            uint256 amount = amounts[i];
            bytes32[] calldata merkleProof = merkleProofs[i];
            
            if (!isClaimed(index)) {
                bytes32 node = keccak256(abi.encodePacked(index, account, amount));
                if (verify(merkleProof, merkleRoot, node)) {
                    _setClaimed(index);
                    require(token.transfer(account, amount), "Transfer failed");
                    emit Claimed(index, account, amount);
                }
            }
        }
    }
    
    /**
     * @notice Admin emergency withdrawal after expiry
     */
    function emergencyWithdraw() external {
        require(msg.sender == admin, "Only admin");
        require(block.timestamp > expiry, "Claim period not expired");
        
        uint256 balance = token.balanceOf(address(this));
        require(token.transfer(admin, balance), "Transfer failed");
        
        emit EmergencyWithdraw(admin, balance);
    }
    
    /**
     * @notice Get contract info
     */
    function getInfo() external view returns (
        address tokenAddress,
        bytes32 root,
        string memory desc,
        uint256 expiryTime,
        uint256 remainingBalance,
        bool isExpired
    ) {
        return (
            address(token),
            merkleRoot,
            description,
            expiry,
            token.balanceOf(address(this)),
            block.timestamp > expiry
        );
    }
    
    /**
     * @notice Verify Merkle proof
     */
    function verify(
        bytes32[] memory proof,
        bytes32 root,
        bytes32 leaf
    ) internal pure returns (bool) {
        bytes32 computedHash = leaf;
        
        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            
            if (computedHash <= proofElement) {
                // Hash(current computed hash + current element of the proof)
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                // Hash(current element of the proof + current computed hash)
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        
        // Check if the computed hash (root) is equal to the provided root
        return computedHash == root;
    }
} 
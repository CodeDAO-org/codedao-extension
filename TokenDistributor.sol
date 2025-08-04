// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CodeDAODistributor is ReentrancyGuard {
    
    IERC20 public immutable codeToken;
    address public immutable rewardsPool;
    
    // Same anti-gaming and reward logic as before
    mapping(bytes32 => bool) public usedCodeHashes;
    mapping(address => uint256) public lastClaimTime;
    uint256 public constant COOLDOWN_PERIOD = 1 hours;
    
    constructor(address _codeToken, address _rewardsPool) {
        codeToken = IERC20(_codeToken);
        rewardsPool = _rewardsPool;
    }
    
    function claimRewards(
        uint256 linesOfCode,
        uint256 functionsWritten,
        uint256 classesWritten,
        uint256 testsWritten,
        uint256 commentsWritten,
        bytes32 codeHash
    ) external nonReentrant {
        // Validation logic...
        require(!usedCodeHashes[codeHash], "Code already submitted");
        require(block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN_PERIOD, "Cooldown active");
        
        // Calculate reward
        uint256 reward = (linesOfCode * 0.1e18) + (functionsWritten * 0.05e18) + 
                         (classesWritten * 0.1e18) + (testsWritten * 0.2e18);
        
        // Update state
        usedCodeHashes[codeHash] = true;
        lastClaimTime[msg.sender] = block.timestamp;
        
        // Transfer from rewards pool to user (using transferFrom)
        require(codeToken.transferFrom(rewardsPool, msg.sender, reward), "Transfer failed");
    }
}

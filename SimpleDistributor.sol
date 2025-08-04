// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CodeDAODistributor is ReentrancyGuard {
    
    IERC20 public constant CODE_TOKEN = IERC20(0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0);
    address public constant REWARDS_POOL = 0x050C7f5aeD5881F3Ce0325638F51f854F680e96F;
    
    // Anti-gaming
    mapping(bytes32 => bool) public usedCodeHashes;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public dailyClaimed;
    mapping(address => uint256) public lastDayReset;
    
    uint256 public constant COOLDOWN = 1 hours;
    uint256 public constant DAILY_LIMIT = 50e18; // 50 CODE
    uint256 public constant BASE_RATE = 0.1e18;  // 0.1 CODE per line
    
    event RewardClaimed(address indexed user, uint256 amount, uint256 lines);
    
    function claimRewards(
        uint256 linesOfCode,
        uint256 functions,
        uint256 classes, 
        uint256 tests,
        bytes32 codeHash
    ) external nonReentrant {
        require(block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN, "Cooldown");
        require(!usedCodeHashes[codeHash], "Used hash");
        require(linesOfCode > 0, "No code");
        
        // Reset daily limit
        uint256 today = block.timestamp / 1 days;
        if (lastDayReset[msg.sender] != today) {
            dailyClaimed[msg.sender] = 0;
            lastDayReset[msg.sender] = today;
        }
        
        // Calculate reward
        uint256 reward = (linesOfCode * BASE_RATE) + 
                        (functions * 0.05e18) + 
                        (classes * 0.1e18) + 
                        (tests * 0.2e18);
                        
        require(dailyClaimed[msg.sender] + reward <= DAILY_LIMIT, "Daily limit");
        
        // Update state
        usedCodeHashes[codeHash] = true;
        lastClaimTime[msg.sender] = block.timestamp;
        dailyClaimed[msg.sender] += reward;
        
        // Transfer (requires prior approval)
        CODE_TOKEN.transferFrom(REWARDS_POOL, msg.sender, reward);
        
        emit RewardClaimed(msg.sender, reward, linesOfCode);
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CodeDAODistributor is ReentrancyGuard {
    
    IERC20 public constant CODE_TOKEN = IERC20(0x1F8b43F7aeD0D1b524Ec5b4930C19098E8D4fbD0);
    address public constant REWARDS_POOL = 0x050C7f5aeD5881F3Ce0325638F51f854F680e96F;
    
    // Anti-gaming protection
    mapping(bytes32 => bool) public usedCodeHashes;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public dailyClaimed;
    mapping(address => uint256) public lastDayReset;
    
    // Rate limits and rewards
    uint256 public constant COOLDOWN = 1 hours;
    uint256 public constant DAILY_LIMIT = 50e18; // 50 CODE per day
    uint256 public constant BASE_RATE = 0.1e18;  // 0.1 CODE per line
    uint256 public constant MIN_CLAIM = 1e18;    // 1 CODE minimum
    
    // Developer stats
    mapping(address => uint256) public totalLinesSubmitted;
    mapping(address => uint256) public totalRewardsEarned;
    mapping(address => uint256) public totalClaims;
    
    event RewardClaimed(
        address indexed user, 
        uint256 amount, 
        uint256 lines,
        uint256 functions,
        uint256 classes,
        uint256 tests
    );
    
    function claimRewards(
        uint256 linesOfCode,
        uint256 functions,
        uint256 classes, 
        uint256 tests,
        uint256 comments,
        bytes32 codeHash,
        string calldata sessionData
    ) external nonReentrant {
        require(block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN, "Cooldown active");
        require(!usedCodeHashes[codeHash], "Code hash already used");
        require(linesOfCode > 0, "Must have written code");
        
        // Reset daily limit if new day
        uint256 today = block.timestamp / 1 days;
        if (lastDayReset[msg.sender] != today) {
            dailyClaimed[msg.sender] = 0;
            lastDayReset[msg.sender] = today;
        }
        
        // Calculate total reward
        uint256 baseReward = linesOfCode * BASE_RATE;
        uint256 functionBonus = functions * 0.05e18;
        uint256 classBonus = classes * 0.1e18;
        uint256 testBonus = tests * 0.2e18;
        uint256 commentBonus = comments * 0.01e18;
        
        uint256 totalReward = baseReward + functionBonus + classBonus + testBonus + commentBonus;
        
        require(totalReward >= MIN_CLAIM, "Below minimum claim amount");
        require(dailyClaimed[msg.sender] + totalReward <= DAILY_LIMIT, "Daily limit exceeded");
        
        // Update anti-gaming state
        usedCodeHashes[codeHash] = true;
        lastClaimTime[msg.sender] = block.timestamp;
        dailyClaimed[msg.sender] += totalReward;
        
        // Update developer stats
        totalLinesSubmitted[msg.sender] += linesOfCode;
        totalRewardsEarned[msg.sender] += totalReward;
        totalClaims[msg.sender]++;
        
        // Transfer tokens from rewards pool to user
        // This requires prior approval: REWARDS_POOL approved this contract
        CODE_TOKEN.transferFrom(REWARDS_POOL, msg.sender, totalReward);
        
        emit RewardClaimed(msg.sender, totalReward, linesOfCode, functions, classes, tests);
    }
    
    // View functions
    function getNextClaimTime(address user) external view returns (uint256) {
        return lastClaimTime[user] + COOLDOWN;
    }
    
    function getDailyRemaining(address user) external view returns (uint256) {
        uint256 today = block.timestamp / 1 days;
        if (lastDayReset[user] != today) {
            return DAILY_LIMIT;
        }
        return DAILY_LIMIT - dailyClaimed[user];
    }
    
    function calculateReward(
        uint256 linesOfCode,
        uint256 functions,
        uint256 classes,
        uint256 tests,
        uint256 comments
    ) external pure returns (uint256) {
        return (linesOfCode * BASE_RATE) + 
               (functions * 0.05e18) + 
               (classes * 0.1e18) + 
               (tests * 0.2e18) + 
               (comments * 0.01e18);
    }
    
    function getDeveloperStats(address developer) external view returns (
        uint256 totalLines,
        uint256 totalRewards,
        uint256 claimCount
    ) {
        return (
            totalLinesSubmitted[developer],
            totalRewardsEarned[developer],
            totalClaims[developer]
        );
    }
}

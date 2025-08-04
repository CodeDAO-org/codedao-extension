// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract CodeDAOClaims is ERC20, Ownable, ReentrancyGuard {
    
    // Reward rates
    uint256 public baseRewardPerLine = 0.1 * 1e18;  // 0.1 CODE per line
    uint256 public functionBonus = 0.05 * 1e18;     // +0.05 CODE per function
    uint256 public classBonus = 0.1 * 1e18;         // +0.1 CODE per class
    uint256 public testBonus = 0.2 * 1e18;          // +0.2 CODE per test
    uint256 public commentBonus = 0.01 * 1e18;      // +0.01 CODE per comment
    
    // Anti-gaming protection
    mapping(bytes32 => bool) public usedCodeHashes;
    mapping(address => uint256) public userNonces;
    mapping(address => uint256) public lastClaimTime;
    mapping(address => uint256) public dailyClaimedAmount;
    mapping(address => uint256) public lastDailyReset;
    
    // Limits
    uint256 public constant COOLDOWN_PERIOD = 1 hours;
    uint256 public constant MAX_DAILY_CLAIM = 50 * 1e18;  // 50 CODE per day
    uint256 public constant MIN_CLAIM_AMOUNT = 1 * 1e18;  // 1 CODE minimum
    
    // Developer stats
    struct DeveloperStats {
        uint256 totalLinesSubmitted;
        uint256 totalRewardsEarned;
        uint256 codingStreakDays;
        uint256 lastActivityDate;
        uint256 totalClaims;
    }
    
    mapping(address => DeveloperStats) public developerStats;
    
    // Events
    event RewardClaimed(
        address indexed developer,
        uint256 linesOfCode,
        uint256 functions,
        uint256 classes,
        uint256 tests,
        uint256 comments,
        uint256 totalReward,
        bytes32 codeHash
    );
    
    constructor() ERC20("CodeDAO Token", "CODE") {
        // Mint initial supply to contract for rewards
        _mint(address(this), 60_000_000 * 1e18); // 60M for rewards
    }
    
    /**
     * @dev Main function - Users pay gas to claim their rewards
     */
    function claimRewards(
        uint256 linesOfCode,
        uint256 functionsWritten,
        uint256 classesWritten,
        uint256 testsWritten,
        uint256 commentsWritten,
        bytes32 codeHash,
        string calldata sessionData
    ) external nonReentrant {
        require(linesOfCode > 0, "Must have written code");
        require(!usedCodeHashes[codeHash], "Code already submitted");
        require(
            block.timestamp >= lastClaimTime[msg.sender] + COOLDOWN_PERIOD,
            "Cooldown period not met"
        );
        
        // Reset daily limits if needed
        if (block.timestamp >= lastDailyReset[msg.sender] + 1 days) {
            dailyClaimedAmount[msg.sender] = 0;
            lastDailyReset[msg.sender] = block.timestamp;
        }
        
        // Calculate rewards
        uint256 baseReward = linesOfCode * baseRewardPerLine;
        uint256 functionReward = functionsWritten * functionBonus;
        uint256 classReward = classesWritten * classBonus;
        uint256 testReward = testsWritten * testBonus;
        uint256 commentReward = commentsWritten * commentBonus;
        
        uint256 totalReward = baseReward + functionReward + classReward + testReward + commentReward;
        
        // Apply daily limits
        require(totalReward >= MIN_CLAIM_AMOUNT, "Below minimum claim");
        require(
            dailyClaimedAmount[msg.sender] + totalReward <= MAX_DAILY_CLAIM,
            "Daily limit exceeded"
        );
        
        // Update anti-gaming measures
        usedCodeHashes[codeHash] = true;
        userNonces[msg.sender]++;
        lastClaimTime[msg.sender] = block.timestamp;
        dailyClaimedAmount[msg.sender] += totalReward;
        
        // Update developer stats
        DeveloperStats storage dev = developerStats[msg.sender];
        dev.totalLinesSubmitted += linesOfCode;
        dev.totalRewardsEarned += totalReward;
        dev.totalClaims++;
        
        // Update streak
        uint256 today = block.timestamp / 1 days;
        if (dev.lastActivityDate == today - 1) {
            dev.codingStreakDays++;
        } else if (dev.lastActivityDate != today) {
            dev.codingStreakDays = 1;
        }
        dev.lastActivityDate = today;
        
        // Transfer reward (user paid gas for this transaction)
        _transfer(address(this), msg.sender, totalReward);
        
        emit RewardClaimed(
            msg.sender,
            linesOfCode,
            functionsWritten,
            classesWritten,
            testsWritten,
            commentsWritten,
            totalReward,
            codeHash
        );
    }
    
    /**
     * @dev Get current nonce for user (prevents replay attacks)
     */
    function getCurrentNonce(address user) external view returns (uint256) {
        return userNonces[user];
    }
    
    /**
     * @dev Calculate potential reward without claiming
     */
    function calculatePotentialReward(
        uint256 linesOfCode,
        uint256 functionsWritten,
        uint256 classesWritten,
        uint256 testsWritten,
        uint256 commentsWritten
    ) external view returns (uint256) {
        uint256 baseReward = linesOfCode * baseRewardPerLine;
        uint256 functionReward = functionsWritten * functionBonus;
        uint256 classReward = classesWritten * classBonus;
        uint256 testReward = testsWritten * testBonus;
        uint256 commentReward = commentsWritten * commentBonus;
        
        return baseReward + functionReward + classReward + testReward + commentReward;
    }
    
    /**
     * @dev Get developer statistics
     */
    function getDeveloperStats(address developer) external view returns (
        uint256 totalLines,
        uint256 totalRewards,
        uint256 streakDays,
        uint256 totalClaims,
        uint256 nextClaimTime
    ) {
        DeveloperStats memory stats = developerStats[developer];
        return (
            stats.totalLinesSubmitted,
            stats.totalRewardsEarned,
            stats.codingStreakDays,
            stats.totalClaims,
            lastClaimTime[developer] + COOLDOWN_PERIOD
        );
    }
}

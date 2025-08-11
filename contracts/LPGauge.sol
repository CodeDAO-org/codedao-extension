// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./CodeDAOToken.sol";

/**
 * @title LPGauge
 * @notice Rewards liquidity providers with CODE tokens
 * @dev Supports Aerodrome LP tokens with weekly emission schedules
 */
contract LPGauge {
    CodeDAOToken public immutable rewardToken;
    address public immutable lpToken; // Aerodrome LP token
    address public owner;
    
    uint256 public rewardRate; // CODE per second
    uint256 public lastUpdateTime;
    uint256 public rewardPerTokenStored;
    uint256 public totalSupply;
    
    mapping(address => uint256) public balanceOf;
    mapping(address => uint256) public userRewardPerTokenPaid;
    mapping(address => uint256) public rewards;
    
    event Staked(address indexed user, uint256 amount);
    event Withdrawn(address indexed user, uint256 amount);
    event RewardPaid(address indexed user, uint256 reward);
    event RewardRateUpdated(uint256 newRate, uint256 duration);
    
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }
    
    modifier updateReward(address account) {
        rewardPerTokenStored = rewardPerToken();
        lastUpdateTime = block.timestamp;
        
        if (account != address(0)) {
            rewards[account] = earned(account);
            userRewardPerTokenPaid[account] = rewardPerTokenStored;
        }
        _;
    }
    
    constructor(
        address _rewardToken,
        address _lpToken
    ) {
        rewardToken = CodeDAOToken(_rewardToken);
        lpToken = _lpToken;
        owner = msg.sender;
    }
    
    /**
     * @notice Calculate reward per token stored
     */
    function rewardPerToken() public view returns (uint256) {
        if (totalSupply == 0) {
            return rewardPerTokenStored;
        }
        
        return rewardPerTokenStored + 
            (((block.timestamp - lastUpdateTime) * rewardRate * 1e18) / totalSupply);
    }
    
    /**
     * @notice Calculate earned rewards for an account
     */
    function earned(address account) public view returns (uint256) {
        return ((balanceOf[account] * (rewardPerToken() - userRewardPerTokenPaid[account])) / 1e18) + rewards[account];
    }
    
    /**
     * @notice Stake LP tokens to earn rewards
     */
    function stake(uint256 amount) external updateReward(msg.sender) {
        require(amount > 0, "Cannot stake 0");
        
        // Transfer LP tokens from user
        (bool success, bytes memory data) = lpToken.call(
            abi.encodeWithSignature("transferFrom(address,address,uint256)", msg.sender, address(this), amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "LP transfer failed");
        
        totalSupply += amount;
        balanceOf[msg.sender] += amount;
        
        emit Staked(msg.sender, amount);
    }
    
    /**
     * @notice Withdraw staked LP tokens
     */
    function withdraw(uint256 amount) public updateReward(msg.sender) {
        require(amount > 0, "Cannot withdraw 0");
        require(balanceOf[msg.sender] >= amount, "Insufficient balance");
        
        totalSupply -= amount;
        balanceOf[msg.sender] -= amount;
        
        // Transfer LP tokens back to user
        (bool success, bytes memory data) = lpToken.call(
            abi.encodeWithSignature("transfer(address,uint256)", msg.sender, amount)
        );
        require(success && (data.length == 0 || abi.decode(data, (bool))), "LP transfer failed");
        
        emit Withdrawn(msg.sender, amount);
    }
    
    /**
     * @notice Claim earned rewards
     */
    function getReward() public updateReward(msg.sender) {
        uint256 reward = rewards[msg.sender];
        if (reward > 0) {
            rewards[msg.sender] = 0;
            require(rewardToken.transfer(msg.sender, reward), "Reward transfer failed");
            emit RewardPaid(msg.sender, reward);
        }
    }
    
    /**
     * @notice Exit: withdraw all LP tokens and claim rewards
     */
    function exit() external {
        withdraw(balanceOf[msg.sender]);
        getReward();
    }
    
    /**
     * @notice Set reward rate (owner only)
     * @param weeklyReward Total CODE to distribute this week
     */
    function setRewardRate(uint256 weeklyReward) external onlyOwner updateReward(address(0)) {
        uint256 duration = 7 days;
        rewardRate = weeklyReward / duration;
        lastUpdateTime = block.timestamp;
        
        emit RewardRateUpdated(rewardRate, duration);
    }
    
    /**
     * @notice Fund the gauge with reward tokens
     */
    function fund(uint256 amount) external {
        require(rewardToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");
    }
    
    /**
     * @notice Emergency withdrawal by owner
     */
    function emergencyWithdraw(uint256 amount) external onlyOwner {
        require(rewardToken.transfer(owner, amount), "Transfer failed");
    }
    
    /**
     * @notice Transfer ownership
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "Invalid address");
        owner = newOwner;
    }
    
    /**
     * @notice Get gauge info
     */
    function getGaugeInfo() external view returns (
        address lpTokenAddress,
        uint256 totalStaked,
        uint256 currentRewardRate,
        uint256 rewardPerTokenValue,
        uint256 lastUpdate
    ) {
        return (
            lpToken,
            totalSupply,
            rewardRate,
            rewardPerToken(),
            lastUpdateTime
        );
    }
    
    /**
     * @notice Get user info
     */
    function getUserInfo(address user) external view returns (
        uint256 stakedBalance,
        uint256 earnedRewards,
        uint256 rewardRate_
    ) {
        return (
            balanceOf[user],
            earned(user),
            balanceOf[user] > 0 ? (rewardRate * balanceOf[user]) / totalSupply : 0
        );
    }
} 
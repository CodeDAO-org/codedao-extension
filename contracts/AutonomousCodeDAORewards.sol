// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract AutonomousCodeDAORewards is AccessControl, Pausable, ReentrancyGuard {
    bytes32 public constant AI_AGENT_ROLE = keccak256("AI_AGENT_ROLE");
    bytes32 public constant EMERGENCY_ROLE = keccak256("EMERGENCY_ROLE");
    
    IERC20 public immutable codeToken;
    
    // AI Agent Structure
    struct AIAgent {
        address agentAddress;
        string agentType;
        uint256 reputation; // 0-1000
        uint256 totalDecisions;
        uint256 accurateDecisions;
        bool isActive;
        uint256 lastActivity;
    }
    
    // Decision Structure
    struct AgentDecision {
        address agent;
        address developer;
        uint256 recommendedReward;
        uint256 confidence; // 0-1000
        string reasoning;
        bytes32 contributionHash;
        uint256 timestamp;
    }
    
    // Consensus Result
    struct ConsensusResult {
        address developer;
        uint256 finalReward;
        uint256 consensusStrength;
        bool executed;
        bool requiresReview;
        uint256 timestamp;
        bytes32 contributionHash;
    }
    
    // Storage
    mapping(address => AIAgent) public aiAgents;
    mapping(bytes32 => AgentDecision[]) public contributionDecisions;
    mapping(bytes32 => ConsensusResult) public consensusResults;
    mapping(address => uint256) public developerReputations;
    mapping(address => uint256) public totalEarnings;
    
    // System Parameters
    uint256 public consensusThreshold = 750; // 75%
    uint256 public minimumAgents = 3;
    uint256 public maxRewardPerDay = 1000 ether;
    
    // Skill multipliers
    mapping(string => uint256) public skillMultipliers;
    
    // Events
    event AgentDecisionSubmitted(address indexed agent, bytes32 indexed contributionHash, address indexed developer);
    event ConsensusReached(bytes32 indexed contributionHash, address indexed developer, uint256 reward);
    event RewardExecuted(address indexed developer, uint256 amount, bytes32 contributionHash);
    event AgentReputationUpdated(address indexed agent, uint256 newReputation);
    
    constructor(address _tokenAddress) {
        codeToken = IERC20(_tokenAddress);
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EMERGENCY_ROLE, msg.sender);
        
        // Initialize skill multipliers
        skillMultipliers["rust"] = 1250;
        skillMultipliers["solidity"] = 1300;
        skillMultipliers["ai_ml"] = 1500;
        skillMultipliers["web3"] = 1400;
    }
    
    function registerAIAgent(
        address agentAddress,
        string memory agentType
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(!aiAgents[agentAddress].isActive, "Agent already registered");
        
        aiAgents[agentAddress] = AIAgent({
            agentAddress: agentAddress,
            agentType: agentType,
            reputation: 500,
            totalDecisions: 0,
            accurateDecisions: 0,
            isActive: true,
            lastActivity: block.timestamp
        });
        
        _grantRole(AI_AGENT_ROLE, agentAddress);
    }
    
    function submitDecision(
        address developer,
        uint256 recommendedReward,
        uint256 confidence,
        string memory reasoning,
        bytes32 contributionHash,
        string memory skillTags
    ) external onlyRole(AI_AGENT_ROLE) whenNotPaused {
        require(aiAgents[msg.sender].isActive, "Agent not active");
        require(confidence <= 1000, "Invalid confidence level");
        require(recommendedReward <= maxRewardPerDay, "Reward exceeds daily limit");
        
        // Apply skill multipliers
        uint256 adjustedReward = calculateSkillAdjustedReward(recommendedReward, skillTags);
        
        AgentDecision memory decision = AgentDecision({
            agent: msg.sender,
            developer: developer,
            recommendedReward: adjustedReward,
            confidence: confidence,
            reasoning: reasoning,
            contributionHash: contributionHash,
            timestamp: block.timestamp
        });
        
        contributionDecisions[contributionHash].push(decision);
        aiAgents[msg.sender].lastActivity = block.timestamp;
        aiAgents[msg.sender].totalDecisions++;
        
        emit AgentDecisionSubmitted(msg.sender, contributionHash, developer);
        
        if (contributionDecisions[contributionHash].length >= minimumAgents) {
            _evaluateConsensus(contributionHash);
        }
    }
    
    function calculateSkillAdjustedReward(
        uint256 baseReward,
        string memory skillTags
    ) internal view returns (uint256) {
        uint256 multiplier = 1000; // Base 100%
        
        // Simple skill detection - in practice, parse the skillTags string
        if (bytes(skillTags).length > 0) {
            multiplier = 1200; // 20% bonus for having skills
        }
        
        return (baseReward * multiplier) / 1000;
    }
    
    function _evaluateConsensus(bytes32 contributionHash) internal {
        AgentDecision[] memory decisions = contributionDecisions[contributionHash];
        require(decisions.length >= minimumAgents, "Not enough decisions");
        
        uint256 totalWeight = 0;
        uint256 weightedRewardSum = 0;
        uint256 totalConfidence = 0;
        
        for (uint i = 0; i < decisions.length; i++) {
            AIAgent memory agent = aiAgents[decisions[i].agent];
            uint256 weight = (agent.reputation * decisions[i].confidence) / 1000;
            
            totalWeight += weight;
            weightedRewardSum += decisions[i].recommendedReward * weight;
            totalConfidence += decisions[i].confidence;
        }
        
        uint256 consensusReward = weightedRewardSum / totalWeight;
        uint256 avgConfidence = totalConfidence / decisions.length;
        
        bool strongConsensus = avgConfidence >= consensusThreshold;
        bool requiresReview = !strongConsensus || _hasSignificantDisagreement(decisions);
        
        ConsensusResult memory result = ConsensusResult({
            developer: decisions[0].developer,
            finalReward: consensusReward,
            consensusStrength: avgConfidence,
            executed: false,
            requiresReview: requiresReview,
            timestamp: block.timestamp,
            contributionHash: contributionHash
        });
        
        consensusResults[contributionHash] = result;
        
        emit ConsensusReached(contributionHash, decisions[0].developer, consensusReward);
        
        if (strongConsensus && !requiresReview) {
            _executeReward(contributionHash);
        }
    }
    
    function _hasSignificantDisagreement(
        AgentDecision[] memory decisions
    ) internal pure returns (bool) {
        if (decisions.length < 2) return false;
        
        uint256 minReward = decisions[0].recommendedReward;
        uint256 maxReward = decisions[0].recommendedReward;
        
        for (uint i = 1; i < decisions.length; i++) {
            if (decisions[i].recommendedReward < minReward) {
                minReward = decisions[i].recommendedReward;
            }
            if (decisions[i].recommendedReward > maxReward) {
                maxReward = decisions[i].recommendedReward;
            }
        }
        
        return maxReward > (minReward * 150) / 100;
    }
    
    function _executeReward(bytes32 contributionHash) internal {
        ConsensusResult storage result = consensusResults[contributionHash];
        require(!result.executed, "Already executed");
        require(result.finalReward > 0, "No reward to distribute");
        
        result.executed = true;
        
        developerReputations[result.developer] += result.finalReward / 1 ether;
        totalEarnings[result.developer] += result.finalReward;
        
        // Transfer tokens to developer
        require(codeToken.transfer(result.developer, result.finalReward), "Token transfer failed");
        
        emit RewardExecuted(result.developer, result.finalReward, contributionHash);
        
        _updateAgentReputations(contributionHash);
    }
    
    function _updateAgentReputations(bytes32 contributionHash) internal {
        AgentDecision[] memory decisions = contributionDecisions[contributionHash];
        ConsensusResult memory result = consensusResults[contributionHash];
        
        for (uint i = 0; i < decisions.length; i++) {
            AIAgent storage agent = aiAgents[decisions[i].agent];
            
            uint256 deviation = decisions[i].recommendedReward > result.finalReward ?
                decisions[i].recommendedReward - result.finalReward :
                result.finalReward - decisions[i].recommendedReward;
            
            uint256 accuracy = deviation < result.finalReward / 10 ? 100 : 
                (100 * (result.finalReward - deviation)) / result.finalReward;
            
            if (accuracy > 80) {
                agent.accurateDecisions++;
                agent.reputation = agent.reputation < 950 ? agent.reputation + 10 : 1000;
            } else if (accuracy < 50) {
                agent.reputation = agent.reputation > 50 ? agent.reputation - 20 : 10;
            }
            
            emit AgentReputationUpdated(decisions[i].agent, agent.reputation);
        }
    }
    
    function adjustSystemParameters(
        uint256 newConsensusThreshold,
        uint256 newMaxRewardPerDay
    ) external onlyRole(AI_AGENT_ROLE) {
        if (newConsensusThreshold >= 500 && newConsensusThreshold <= 900) {
            consensusThreshold = newConsensusThreshold;
        }
        
        if (newMaxRewardPerDay >= 100 ether && newMaxRewardPerDay <= 10000 ether) {
            maxRewardPerDay = newMaxRewardPerDay;
        }
    }
    
    function updateSkillMultipliers(
        string[] memory skills,
        uint256[] memory multipliers
    ) external onlyRole(AI_AGENT_ROLE) {
        require(skills.length == multipliers.length, "Array length mismatch");
        
        for (uint i = 0; i < skills.length; i++) {
            require(multipliers[i] >= 500 && multipliers[i] <= 3000, "Invalid multiplier");
            skillMultipliers[skills[i]] = multipliers[i];
        }
    }
    
    function manualExecuteReward(bytes32 contributionHash) 
        external onlyRole(EMERGENCY_ROLE) {
        _executeReward(contributionHash);
    }
    
    function getContributionDecisions(bytes32 contributionHash) 
        external view returns (AgentDecision[] memory) {
        return contributionDecisions[contributionHash];
    }
    
    function getDeveloperStats(address developer) 
        external view returns (uint256 reputation, uint256 totalEarned) {
        return (developerReputations[developer], totalEarnings[developer]);
    }
    
    function pause() external onlyRole(EMERGENCY_ROLE) {
        _pause();
    }
    
    function unpause() external onlyRole(EMERGENCY_ROLE) {
        _unpause();
    }
}

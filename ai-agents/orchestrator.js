const { ethers } = require('ethers');
const crypto = require('crypto');

class AIAgentOrchestrator {
    constructor(config) {
        this.contractAddress = config.contractAddress;
        this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl);
        this.networkName = config.networkName;
        
        this.agents = {
            codeQuality: new CodeQualityAgent(),
            contributionImpact: new ContributionImpactAgent(),
            communityBehavior: new CommunityBehaviorAgent(),
            innovationDetection: new InnovationDetectionAgent()
        };
        
        this.agentStatus = {};
        this.totalDecisions = 0;
        this.lastActivity = Date.now();
    }

    async initialize() {
        console.log('🤖 Initializing AI Agent Orchestrator...');
        
        // Initialize all agents
        for (const [name, agent] of Object.entries(this.agents)) {
            try {
                await agent.initialize();
                this.agentStatus[name] = { status: 'active', lastActivity: Date.now() };
                console.log(`✅ ${name} agent initialized`);
            } catch (error) {
                console.error(`❌ Failed to initialize ${name} agent:`, error);
                this.agentStatus[name] = { status: 'error', error: error.message };
            }
        }
        
        console.log('✅ AI Agent Orchestrator ready');
    }

    async processContribution(contribution) {
        try {
            const contributionHash = this.generateContributionHash(contribution);
            
            console.log(`🔍 Processing contribution: ${contributionHash.substring(0, 10)}...`);
            
            // Run parallel AI analysis
            const decisions = await Promise.all([
                this.agents.codeQuality.analyze(contribution),
                this.agents.contributionImpact.evaluate(contribution),
                this.agents.communityBehavior.assess(contribution),
                this.agents.innovationDetection.detect(contribution)
            ]);
            
            this.totalDecisions += decisions.length;
            this.lastActivity = Date.now();
            
            // Log decisions for monitoring
            console.log('🤖 AI Agent Decisions:');
            decisions.forEach(decision => {
                console.log(`  ${decision.agentType}: ${decision.confidence.toFixed(2)} confidence, ${decision.recommendedReward.toFixed(2)} CODE`);
            });
            
            return {
                contributionHash,
                decisions,
                status: 'processed',
                timestamp: Date.now()
            };
            
        } catch (error) {
            console.error('Error processing contribution:', error);
            throw error;
        }
    }

    generateContributionHash(contribution) {
        const data = JSON.stringify({
            developer: contribution.developer,
            code: contribution.code,
            timestamp: contribution.timestamp,
            language: contribution.language
        });
        return crypto.createHash('sha256').update(data).digest('hex');
    }

    getAgentStatus() {
        return this.agentStatus;
    }

    getAgentCount() {
        return Object.keys(this.agents).length;
    }

    getTotalDecisions() {
        return this.totalDecisions;
    }

    getLastActivity() {
        return this.lastActivity;
    }

    performHealthCheck() {
        console.log('🔍 Performing agent health check...');
        
        for (const [name, agent] of Object.entries(this.agents)) {
            try {
                // Simple health check - could be enhanced
                if (agent.isHealthy && !agent.isHealthy()) {
                    this.agentStatus[name].status = 'unhealthy';
                } else {
                    this.agentStatus[name].status = 'active';
                    this.agentStatus[name].lastActivity = Date.now();
                }
            } catch (error) {
                this.agentStatus[name].status = 'error';
                this.agentStatus[name].error = error.message;
            }
        }
    }

    aggregateDailyMetrics() {
        console.log('📊 Aggregating daily metrics...');
        // Implementation for daily metrics aggregation
    }

    async shutdown() {
        console.log('🛑 Shutting down AI Agent Orchestrator...');
        
        for (const [name, agent] of Object.entries(this.agents)) {
            try {
                if (agent.shutdown) {
                    await agent.shutdown();
                }
            } catch (error) {
                console.error(`Error shutting down ${name} agent:`, error);
            }
        }
        
        console.log('✅ AI Agent Orchestrator shut down');
    }
}

// AI Agent Classes
class CodeQualityAgent {
    constructor() {
        this.agentType = 'code_quality';
        this.weights = {
            complexity: 0.25,
            readability: 0.25,
            testCoverage: 0.20,
            documentation: 0.15,
            performance: 0.15
        };
    }

    async initialize() {
        console.log('Initializing Code Quality Agent...');
    }

    async analyze(contribution) {
        const metrics = await this.calculateMetrics(contribution);
        const qualityScore = this.calculateQualityScore(metrics);
        const reward = this.calculateReward(metrics, contribution);
        
        return {
            agentType: this.agentType,
            developer: contribution.developer,
            recommendedReward: reward,
            confidence: qualityScore,
            reasoning: this.generateReasoning(metrics),
            skillTags: this.detectSkills(contribution),
            suggestions: this.generateSuggestions(metrics),
            metrics
        };
    }

    async calculateMetrics(contribution) {
        return {
            complexity: await this.analyzeComplexity(contribution.code),
            readability: await this.analyzeReadability(contribution.code),
            testCoverage: await this.analyzeTestCoverage(contribution),
            documentation: await this.analyzeDocumentation(contribution),
            performance: await this.analyzePerformance(contribution.code),
            linesOfCode: contribution.code.split('\n').length,
            languageDetected: this.detectLanguage(contribution.code)
        };
    }

    async analyzeComplexity(code) {
        const cyclomaticComplexity = this.calculateCyclomaticComplexity(code);
        const nestingDepth = this.calculateNestingDepth(code);
        const complexityScore = Math.max(0, 100 - (cyclomaticComplexity * 2 + nestingDepth * 5));
        return Math.min(100, complexityScore);
    }

    calculateCyclomaticComplexity(code) {
        const decisionPoints = (code.match(/\b(if|while|for|switch|catch|case)\b/g) || []).length;
        return decisionPoints + 1;
    }

    calculateNestingDepth(code) {
        let maxDepth = 0;
        let currentDepth = 0;
        
        for (const char of code) {
            if (char === '{' || char === '(') currentDepth++;
            if (char === '}' || char === ')') currentDepth--;
            maxDepth = Math.max(maxDepth, currentDepth);
        }
        
        return maxDepth;
    }

    async analyzeReadability(code) {
        const variableNaming = this.analyzeVariableNaming(code);
        const commentRatio = this.calculateCommentRatio(code);
        const formatting = this.analyzeFormatting(code);
        
        return (variableNaming + commentRatio + formatting) / 3;
    }

    analyzeVariableNaming(code) {
        const variables = code.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        const meaningfulVars = variables.filter(v => 
            v.length > 2 && 
            !/^[a-z]$/.test(v) && 
            !['tmp', 'temp', 'var', 'val'].includes(v.toLowerCase())
        );
        
        return variables.length > 0 ? (meaningfulVars.length / variables.length) * 100 : 50;
    }

    calculateCommentRatio(code) {
        const lines = code.split('\n');
        const commentLines = lines.filter(line => 
            line.trim().startsWith('//') || 
            line.trim().startsWith('/*') || 
            line.trim().startsWith('*') ||
            line.trim().startsWith('#')
        ).length;
        
        const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//')).length;
        return codeLines > 0 ? Math.min(100, (commentLines / codeLines) * 500) : 0;
    }

    analyzeFormatting(code) {
        const hasConsistentIndentation = this.checkIndentation(code);
        const hasProperSpacing = this.checkSpacing(code);
        
        return (hasConsistentIndentation + hasProperSpacing) / 2;
    }

    checkIndentation(code) {
        const lines = code.split('\n').filter(line => line.trim());
        if (lines.length === 0) return 100;
        
        const indentations = lines.map(line => {
            const match = line.match(/^[\s]*/);
            return match ? match[0].length : 0;
        });
        
        const consistent = indentations.every(indent => indent % 2 === 0 || indent % 4 === 0);
        return consistent ? 100 : 60;
    }

    checkSpacing(code) {
        const hasGoodSpacing = /\s[+\-*/=]\s/.test(code);
        return hasGoodSpacing ? 100 : 70;
    }

    async analyzeTestCoverage(contribution) {
        const hasTests = /\b(test|spec|describe|it|should|expect|assert)\b/i.test(contribution.code);
        const testFunctions = (contribution.code.match(/\b(test|it|should)\s*\(/g) || []).length;
        const regularFunctions = (contribution.code.match(/function\s+\w+/g) || []).length;
        
        if (hasTests && testFunctions > 0) {
            return Math.min(100, (testFunctions / Math.max(1, regularFunctions)) * 100);
        }
        
        return hasTests ? 50 : 20;
    }

    async analyzeDocumentation(contribution) {
        const hasJSDoc = /\/\*\*[\s\S]*?\*\//.test(contribution.code);
        const hasInlineComments = /\/\/.*/.test(contribution.code);
        
        let score = 0;
        if (hasJSDoc) score += 50;
        if (hasInlineComments) score += 30;
        
        return Math.min(100, score);
    }

    async analyzePerformance(code) {
        const hasOptimizations = this.detectOptimizations(code);
        const hasPerformanceAntipatterns = this.detectAntipatterns(code);
        
        let score = 70;
        if (hasOptimizations) score += 20;
        if (hasPerformanceAntipatterns) score -= 30;
        
        return Math.max(0, Math.min(100, score));
    }

    detectOptimizations(code) {
        const optimizations = [
            /\bcache\b/i,
            /\bmemo/i,
            /\boptimiz/i,
            /\basync\b/,
            /\bPromise\.all\b/
        ];
        
        return optimizations.some(pattern => pattern.test(code));
    }

    detectAntipatterns(code) {
        const antipatterns = [
            /for.*for.*for/s,
            /while.*while/s,
            /\beval\b/
        ];
        
        return antipatterns.some(pattern => pattern.test(code));
    }

    calculateQualityScore(metrics) {
        const weightedScore = 
            metrics.complexity * this.weights.complexity +
            metrics.readability * this.weights.readability +
            metrics.testCoverage * this.weights.testCoverage +
            metrics.documentation * this.weights.documentation +
            metrics.performance * this.weights.performance;
        
        return Math.min(1.0, weightedScore / 100);
    }

    calculateReward(metrics, contribution) {
        const baseReward = Math.min(10, metrics.linesOfCode * 0.1);
        const qualityMultiplier = this.calculateQualityScore(metrics);
        const languageMultiplier = this.getLanguageMultiplier(metrics.languageDetected);
        
        return baseReward * qualityMultiplier * languageMultiplier;
    }

    detectLanguage(code) {
        if (/\b(function|const|let|var)\b/.test(code)) return 'javascript';
        if (/\b(def|import|from)\b/.test(code)) return 'python';
        if (/\b(pub|fn|let mut)\b/.test(code)) return 'rust';
        if (/\b(contract|pragma|function)\b/.test(code)) return 'solidity';
        if (/\b(func|package|import)\b/.test(code)) return 'go';
        return 'unknown';
    }

    getLanguageMultiplier(language) {
        const multipliers = {
            'rust': 1.3,
            'solidity': 1.4,
            'go': 1.2,
            'javascript': 1.0,
            'python': 1.1,
            'unknown': 0.8
        };
        return multipliers[language] || 1.0;
    }

    detectSkills(contribution) {
        const skills = [];
        const code = contribution.code.toLowerCase();
        
        if (code.includes('react') || code.includes('jsx')) skills.push('react');
        if (code.includes('async') || code.includes('await')) skills.push('async_programming');
        if (code.includes('test') || code.includes('spec')) skills.push('testing');
        if (code.includes('contract') || code.includes('solidity')) skills.push('blockchain');
        if (code.includes('ml') || code.includes('tensorflow')) skills.push('machine_learning');
        
        return skills;
    }

    generateReasoning(metrics) {
        const reasons = [];
        
        if (metrics.complexity > 80) reasons.push("excellent code complexity management");
        if (metrics.readability > 80) reasons.push("highly readable and well-structured code");
        if (metrics.testCoverage > 70) reasons.push("good test coverage");
        if (metrics.documentation > 60) reasons.push("well-documented code");
        if (metrics.performance > 80) reasons.push("performance-optimized implementation");
        
        return reasons.length > 0 ? reasons.join(", ") : "standard code contribution";
    }

    generateSuggestions(metrics) {
        const suggestions = [];
        
        if (metrics.complexity < 60) suggestions.push("Consider reducing complexity with smaller functions");
        if (metrics.readability < 60) suggestions.push("Improve variable naming and add comments");
        if (metrics.testCoverage < 50) suggestions.push("Add unit tests for better reliability");
        if (metrics.documentation < 40) suggestions.push("Add JSDoc or inline documentation");
        if (metrics.performance < 60) suggestions.push("Review for potential performance optimizations");
        
        return suggestions;
    }

    isHealthy() {
        return true;
    }
}

class ContributionImpactAgent {
    constructor() {
        this.agentType = 'contribution_impact';
    }

    async initialize() {
        console.log('Initializing Contribution Impact Agent...');
    }

    async evaluate(contribution) {
        const impactMetrics = await this.calculateImpactMetrics(contribution);
        const impactScore = this.calculateImpactScore(impactMetrics);
        const reward = this.calculateReward(impactMetrics);
        
        return {
            agentType: this.agentType,
            developer: contribution.developer,
            recommendedReward: reward,
            confidence: impactScore,
            reasoning: this.generateReasoning(impactMetrics),
            skillTags: ['impact_analysis'],
            impactMetrics
        };
    }

    async calculateImpactMetrics(contribution) {
        return {
            projectPopularity: await this.assessProjectPopularity(contribution.project),
            featureImportance: await this.assessFeatureImportance(contribution),
            userBenefit: await this.assessUserBenefit(contribution),
            technicalDifficulty: await this.assessTechnicalDifficulty(contribution),
            innovationLevel: await this.assessInnovation(contribution)
        };
    }

    async assessProjectPopularity(project) {
        return Math.random() * 100; // Placeholder
    }

    async assessFeatureImportance(contribution) {
        const isBugFix = /fix|bug|error|issue/.test(contribution.description || '');
        const isNewFeature = /add|new|feature|implement/.test(contribution.description || '');
        const isCoreChange = /core|main|critical|important/.test(contribution.description || '');
        
        let score = 50;
        if (isBugFix) score += 20;
        if (isNewFeature) score += 30;
        if (isCoreChange) score += 25;
        
        return Math.min(100, score);
    }

    async assessUserBenefit(contribution) {
        const hasUserFacingChanges = /ui|ux|interface|user|frontend/.test(contribution.code.toLowerCase());
        const hasPerformanceImpact = /performance|speed|optimize|efficient/.test(contribution.code.toLowerCase());
        const hasSecurityImpact = /security|auth|permission|secure/.test(contribution.code.toLowerCase());
        
        let score = 40;
        if (hasUserFacingChanges) score += 30;
        if (hasPerformanceImpact) score += 25;
        if (hasSecurityImpact) score += 35;
        
        return Math.min(100, score);
    }

    async assessTechnicalDifficulty(contribution) {
        const hasComplexAlgorithms = /algorithm|sort|search|optimize|recursive/.test(contribution.code.toLowerCase());
        const hasSystemIntegration = /api|integration|service|database/.test(contribution.code.toLowerCase());
        const hasArchitecturalChanges = /architecture|pattern|design|structure/.test(contribution.code.toLowerCase());
        
        let score = 30;
        if (hasComplexAlgorithms) score += 35;
        if (hasSystemIntegration) score += 25;
        if (hasArchitecturalChanges) score += 30;
        
        return Math.min(100, score);
    }

    async assessInnovation(contribution) {
        const hasNovelApproach = /novel|innovative|creative|unique/.test(contribution.description || '');
        const usesCuttingEdgetech = /ai|ml|blockchain|quantum|webassembly/.test(contribution.code.toLowerCase());
        const solvesHardProblem = /solve|solution|problem|challenge/.test(contribution.description || '');
        
        let score = 20;
        if (hasNovelApproach) score += 40;
        if (usesCuttingEdgetech) score += 35;
        if (solvesHardProblem) score += 25;
        
        return Math.min(100, score);
    }

    calculateImpactScore(metrics) {
        const weights = {
            projectPopularity: 0.2,
            featureImportance: 0.25,
            userBenefit: 0.25,
            technicalDifficulty: 0.15,
            innovationLevel: 0.15
        };
        
        const weightedScore = 
            metrics.projectPopularity * weights.projectPopularity +
            metrics.featureImportance * weights.featureImportance +
            metrics.userBenefit * weights.userBenefit +
            metrics.technicalDifficulty * weights.technicalDifficulty +
            metrics.innovationLevel * weights.innovationLevel;
        
        return Math.min(1.0, weightedScore / 100);
    }

    calculateReward(metrics) {
        const baseReward = 5;
        const impactMultiplier = this.calculateImpactScore(metrics);
        return baseReward * impactMultiplier * 2;
    }

    generateReasoning(metrics) {
        const reasons = [];
        
        if (metrics.projectPopularity > 70) reasons.push("contribution to popular project");
        if (metrics.featureImportance > 70) reasons.push("important feature or bug fix");
        if (metrics.userBenefit > 70) reasons.push("high user benefit");
        if (metrics.technicalDifficulty > 70) reasons.push("technically challenging implementation");
        if (metrics.innovationLevel > 70) reasons.push("innovative solution");
        
        return reasons.length > 0 ? reasons.join(", ") : "standard impact contribution";
    }

    isHealthy() {
        return true;
    }
}

class CommunityBehaviorAgent {
    constructor() {
        this.agentType = 'community_behavior';
    }

    async initialize() {
        console.log('Initializing Community Behavior Agent...');
    }

    async assess(contribution) {
        const behaviorScore = 0.8; // Placeholder
        const reward = 2;
        
        return {
            agentType: this.agentType,
            developer: contribution.developer,
            recommendedReward: reward,
            confidence: behaviorScore,
            reasoning: "positive community engagement",
            skillTags: ['collaboration']
        };
    }

    isHealthy() {
        return true;
    }
}

class InnovationDetectionAgent {
    constructor() {
        this.agentType = 'innovation_detection';
    }

    async initialize() {
        console.log('Initializing Innovation Detection Agent...');
    }

    async detect(contribution) {
        const innovationScore = 0.6; // Placeholder
        const reward = 3;
        
        return {
            agentType: this.agentType,
            developer: contribution.developer,
            recommendedReward: reward,
            confidence: innovationScore,
            reasoning: "standard implementation approach",
            skillTags: ['problem_solving']
        };
    }

    isHealthy() {
        return true;
    }
}

module.exports = AIAgentOrchestrator;

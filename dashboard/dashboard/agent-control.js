// CodeDAO Agent Control Integration for Dashboard
// Allows users to submit tasks to AI agents and monitor execution

class AgentControlDashboard {
    constructor() {
        this.gatewayUrl = 'http://localhost:3001';
        this.wsUrl = 'ws://localhost:3002';
        this.activeTasks = new Map();
        this.connectedAgents = [];
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        if (this.isInitialized) return;
        
        console.log('🚀 Initializing Agent Control Dashboard...');
        
        try {
            // Create agent control panel
            this.createAgentControlPanel();
            
            // Load connected agents
            await this.loadConnectedAgents();
            
            // Setup task monitoring
            this.startTaskMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Agent Control Dashboard initialized');
            
        } catch (error) {
            console.error('❌ Failed to initialize Agent Control:', error);
        }
    }
    
    createAgentControlPanel() {
        // Find the AI agent panel and add control features
        const aiPanel = document.getElementById('ai-agent-panel');
        if (!aiPanel) {
            console.warn('AI Agent panel not found, creating new one');
            return;
        }
        
        // Add agent control section
        const controlSection = document.createElement('div');
        controlSection.id = 'agent-control-section';
        controlSection.className = 'agent-control-section';
        controlSection.innerHTML = `
            <div class="control-header">
                <h4>🎛️ Agent Control Center</h4>
                <div class="gateway-status" id="gateway-status">
                    <span class="status-dot"></span>
                    <span>Connecting...</span>
                </div>
            </div>
            
            <div class="connected-agents" id="connected-agents">
                <h5>Connected Agents</h5>
                <div class="agents-grid" id="agents-grid">
                    <div class="loading-agents">Loading agents...</div>
                </div>
            </div>
            
            <div class="task-submission">
                <h5>Submit Task to Agents</h5>
                <div class="task-form">
                    <select id="task-type" class="task-select">
                        <option value="">Select Task Type</option>
                        <option value="code-review">📝 Code Review</option>
                        <option value="smart-contract-audit">🛡️ Smart Contract Audit</option>
                        <option value="debugging">🐛 Debug Assistance</option>
                        <option value="documentation">📚 Generate Documentation</option>
                        <option value="deployment">🚀 Deploy Contract</option>
                        <option value="testing">🧪 Generate Tests</option>
                        <option value="optimization">⚡ Code Optimization</option>
                    </select>
                    
                    <textarea id="task-description" placeholder="Describe your task in detail..." rows="3"></textarea>
                    
                    <div class="task-options">
                        <select id="task-priority" class="priority-select">
                            <option value="normal">Normal Priority</option>
                            <option value="high">High Priority</option>
                            <option value="low">Low Priority</option>
                        </select>
                        
                        <button id="submit-task" class="submit-task-btn">
                            <span class="btn-text">Submit Task</span>
                            <span class="btn-spinner" style="display: none;">⏳</span>
                        </button>
                    </div>
                </div>
            </div>
            
            <div class="active-tasks" id="active-tasks">
                <h5>Active Tasks</h5>
                <div class="tasks-container" id="tasks-container">
                    <div class="no-tasks">No active tasks</div>
                </div>
            </div>
        `;
        
        aiPanel.appendChild(controlSection);
        
        // Setup event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Submit task button
        document.getElementById('submit-task').addEventListener('click', () => {
            this.submitTask();
        });
        
        // Task type change
        document.getElementById('task-type').addEventListener('change', (e) => {
            this.updateTaskForm(e.target.value);
        });
        
        // Enter key in description
        document.getElementById('task-description').addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                this.submitTask();
            }
        });
    }
    
    async loadConnectedAgents() {
        try {
            const response = await fetch(`${this.gatewayUrl}/api/agents/metrics`);
            if (!response.ok) {
                throw new Error('Failed to load agents');
            }
            
            const data = await response.json();
            this.connectedAgents = data.agentDetails || [];
            
            this.updateAgentsDisplay();
            this.updateGatewayStatus(true);
            
        } catch (error) {
            console.error('Failed to load agents:', error);
            this.updateGatewayStatus(false);
        }
    }
    
    updateAgentsDisplay() {
        const agentsGrid = document.getElementById('agents-grid');
        if (!agentsGrid) return;
        
        if (this.connectedAgents.length === 0) {
            agentsGrid.innerHTML = '<div class="no-agents">No agents connected</div>';
            return;
        }
        
        agentsGrid.innerHTML = this.connectedAgents.map(agent => `
            <div class="agent-card ${agent.status}">
                <div class="agent-info">
                    <div class="agent-name">${agent.agentId}</div>
                    <div class="agent-status">${agent.status}</div>
                </div>
                <div class="agent-stats">
                    <div class="stat">
                        <span class="stat-label">Active:</span>
                        <span class="stat-value">${agent.activeTasks}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Completed:</span>
                        <span class="stat-value">${agent.completedTasks}</span>
                    </div>
                </div>
                <div class="agent-capabilities">
                    ${agent.capabilities.slice(0, 3).map(cap => `
                        <span class="capability-tag">${cap}</span>
                    `).join('')}
                    ${agent.capabilities.length > 3 ? `<span class="capability-more">+${agent.capabilities.length - 3}</span>` : ''}
                </div>
            </div>
        `).join('');
    }
    
    updateGatewayStatus(connected) {
        const statusElement = document.getElementById('gateway-status');
        if (!statusElement) return;
        
        const statusDot = statusElement.querySelector('.status-dot');
        const statusText = statusElement.querySelector('span:last-child');
        
        if (connected) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = `Connected (${this.connectedAgents.length} agents)`;
        } else {
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Gateway Offline';
        }
    }
    
    updateTaskForm(taskType) {
        const description = document.getElementById('task-description');
        if (!description) return;
        
        const templates = {
            'code-review': 'Please review my smart contract code for security issues, gas optimization opportunities, and best practices. Focus on:\n- Access control patterns\n- Reentrancy vulnerabilities\n- Gas efficiency\n- Code quality',
            'smart-contract-audit': 'Perform a comprehensive security audit of my smart contract including:\n- Vulnerability assessment\n- Gas optimization analysis\n- Access control review\n- Test coverage recommendations',
            'debugging': 'I\'m experiencing an issue with my code. Please help me identify and fix the problem:\n- Error: [describe the error]\n- Expected behavior: [what should happen]\n- Current behavior: [what actually happens]',
            'documentation': 'Generate comprehensive documentation for my project including:\n- README with setup instructions\n- Function documentation\n- API reference\n- Usage examples',
            'deployment': 'Deploy my smart contract to Base mainnet with:\n- Pre-deployment security checks\n- Gas optimization\n- Contract verification\n- Deployment monitoring',
            'testing': 'Create comprehensive test suites covering:\n- Unit tests for all functions\n- Integration tests\n- Edge cases and error conditions\n- Gas usage tests',
            'optimization': 'Optimize my code for:\n- Gas efficiency (for smart contracts)\n- Performance improvements\n- Code structure and readability\n- Best practices implementation'
        };
        
        if (templates[taskType]) {
            description.placeholder = templates[taskType];
        }
    }
    
    async submitTask() {
        const taskType = document.getElementById('task-type').value;
        const description = document.getElementById('task-description').value;
        const priority = document.getElementById('task-priority').value;
        
        if (!taskType) {
            this.showNotification('Please select a task type', 'error');
            return;
        }
        
        if (!description.trim()) {
            this.showNotification('Please provide a task description', 'error');
            return;
        }
        
        const submitBtn = document.getElementById('submit-task');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnSpinner = submitBtn.querySelector('.btn-spinner');
        
        try {
            // Show loading state
            submitBtn.disabled = true;
            btnText.style.display = 'none';
            btnSpinner.style.display = 'inline';
            
            const taskData = {
                task: {
                    type: taskType,
                    description: description,
                    metadata: {
                        submittedBy: currentAccount || 'anonymous',
                        submittedAt: new Date().toISOString(),
                        projectContext: this.getProjectContext()
                    }
                },
                priority: priority,
                requiredCapabilities: [taskType]
            };
            
            const response = await fetch(`${this.gatewayUrl}/api/tasks/submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(taskData)
            });
            
            if (!response.ok) {
                throw new Error('Failed to submit task');
            }
            
            const result = await response.json();
            
            // Add to active tasks
            this.addActiveTask(result.taskId, taskData.task);
            
            // Clear form
            document.getElementById('task-description').value = '';
            document.getElementById('task-type').value = '';
            
            this.showNotification(`Task submitted successfully! Task ID: ${result.taskId}`, 'success');
            
            // Start monitoring this task
            this.monitorTask(result.taskId);
            
        } catch (error) {
            console.error('Failed to submit task:', error);
            this.showNotification('Failed to submit task. Please try again.', 'error');
            
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnSpinner.style.display = 'none';
        }
    }
    
    addActiveTask(taskId, task) {
        const taskInfo = {
            id: taskId,
            type: task.type,
            description: task.description,
            status: 'queued',
            progress: 0,
            submittedAt: new Date(),
            assignedAgent: null
        };
        
        this.activeTasks.set(taskId, taskInfo);
        this.updateActiveTasksDisplay();
    }
    
    updateActiveTasksDisplay() {
        const container = document.getElementById('tasks-container');
        if (!container) return;
        
        if (this.activeTasks.size === 0) {
            container.innerHTML = '<div class="no-tasks">No active tasks</div>';
            return;
        }
        
        container.innerHTML = Array.from(this.activeTasks.values()).map(task => `
            <div class="task-card" id="task-${task.id}">
                <div class="task-header">
                    <div class="task-type">${this.getTaskTypeIcon(task.type)} ${task.type.replace('-', ' ')}</div>
                    <div class="task-status status-${task.status}">${task.status}</div>
                </div>
                
                <div class="task-description">${task.description.substring(0, 100)}${task.description.length > 100 ? '...' : ''}</div>
                
                <div class="task-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${task.progress}%"></div>
                    </div>
                    <span class="progress-text">${task.progress}%</span>
                </div>
                
                <div class="task-footer">
                    <div class="task-info">
                        <span class="task-id">ID: ${task.id.substring(0, 8)}...</span>
                        ${task.assignedAgent ? `<span class="assigned-agent">Agent: ${task.assignedAgent}</span>` : ''}
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn" onclick="agentControl.viewTaskDetails('${task.id}')">
                            Details
                        </button>
                        ${task.status === 'queued' ? `
                            <button class="task-action-btn cancel" onclick="agentControl.cancelTask('${task.id}')">
                                Cancel
                            </button>
                        ` : ''}
                    </div>
                </div>
            </div>
        `).join('');
    }
    
    getTaskTypeIcon(type) {
        const icons = {
            'code-review': '📝',
            'smart-contract-audit': '🛡️',
            'debugging': '🐛',
            'documentation': '📚',
            'deployment': '🚀',
            'testing': '🧪',
            'optimization': '⚡'
        };
        return icons[type] || '📋';
    }
    
    async monitorTask(taskId) {
        const checkStatus = async () => {
            try {
                const response = await fetch(`${this.gatewayUrl}/api/tasks/${taskId}/status`);
                if (!response.ok) return;
                
                const status = await response.json();
                const task = this.activeTasks.get(taskId);
                
                if (task) {
                    task.status = status.status;
                    task.progress = status.progress || 0;
                    task.assignedAgent = status.assignedAgent;
                    
                    this.updateActiveTasksDisplay();
                    
                    // If task is completed or failed, stop monitoring
                    if (status.status === 'completed' || status.status === 'failed') {
                        this.handleTaskCompletion(taskId, status);
                        return;
                    }
                }
                
                // Continue monitoring if task is still active
                if (task && (task.status === 'queued' || task.status === 'executing')) {
                    setTimeout(checkStatus, 2000); // Check every 2 seconds
                }
                
            } catch (error) {
                console.error('Error monitoring task:', error);
            }
        };
        
        checkStatus();
    }
    
    handleTaskCompletion(taskId, status) {
        const task = this.activeTasks.get(taskId);
        if (!task) return;
        
        if (status.status === 'completed') {
            this.showNotification(`Task completed successfully! ${task.type} by ${status.assignedAgent}`, 'success');
            
            // Show results if available
            if (status.result) {
                this.showTaskResults(taskId, status.result);
            }
        } else if (status.status === 'failed') {
            this.showNotification(`Task failed: ${status.error || 'Unknown error'}`, 'error');
        }
        
        // Keep task in list for a while, then remove
        setTimeout(() => {
            this.activeTasks.delete(taskId);
            this.updateActiveTasksDisplay();
        }, 30000); // Remove after 30 seconds
    }
    
    showTaskResults(taskId, result) {
        // Create results modal
        const modal = document.createElement('div');
        modal.className = 'task-results-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>🎉 Task Results</h3>
                    <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="result-section">
                        <h4>Task Summary</h4>
                        <p>${result.summary || 'Task completed successfully'}</p>
                    </div>
                    
                    ${result.findings ? `
                        <div class="result-section">
                            <h4>Findings</h4>
                            <div class="findings-list">
                                ${result.findings.map(finding => `
                                    <div class="finding-item ${finding.severity}">
                                        <div class="finding-header">
                                            <span class="finding-type">${finding.type}</span>
                                            <span class="finding-severity">${finding.severity}</span>
                                        </div>
                                        <div class="finding-message">${finding.message}</div>
                                        ${finding.suggestion ? `<div class="finding-suggestion">💡 ${finding.suggestion}</div>` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${result.recommendations ? `
                        <div class="result-section">
                            <h4>Recommendations</h4>
                            <ul class="recommendations-list">
                                ${result.recommendations.map(rec => `<li>${rec}</li>`).join('')}
                            </ul>
                        </div>
                    ` : ''}
                    
                    ${result.contractAddress ? `
                        <div class="result-section">
                            <h4>Deployment Details</h4>
                            <div class="deployment-info">
                                <div class="info-item">
                                    <span class="info-label">Contract Address:</span>
                                    <span class="info-value">${result.contractAddress}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Transaction Hash:</span>
                                    <span class="info-value">${result.transactionHash}</span>
                                </div>
                                <div class="info-item">
                                    <span class="info-label">Gas Used:</span>
                                    <span class="info-value">${result.gasUsed}</span>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async viewTaskDetails(taskId) {
        const task = this.activeTasks.get(taskId);
        if (!task) return;
        
        // Show task details modal
        const modal = document.createElement('div');
        modal.className = 'task-details-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>📋 Task Details</h3>
                    <button class="close-modal" onclick="this.parentElement.parentElement.parentElement.remove()">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="detail-item">
                        <span class="detail-label">Task ID:</span>
                        <span class="detail-value">${task.id}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Type:</span>
                        <span class="detail-value">${task.type}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Status:</span>
                        <span class="detail-value status-${task.status}">${task.status}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Progress:</span>
                        <span class="detail-value">${task.progress}%</span>
                    </div>
                    ${task.assignedAgent ? `
                        <div class="detail-item">
                            <span class="detail-label">Assigned Agent:</span>
                            <span class="detail-value">${task.assignedAgent}</span>
                        </div>
                    ` : ''}
                    <div class="detail-item">
                        <span class="detail-label">Submitted:</span>
                        <span class="detail-value">${task.submittedAt.toLocaleString()}</span>
                    </div>
                    <div class="detail-item full-width">
                        <span class="detail-label">Description:</span>
                        <div class="detail-description">${task.description}</div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn-primary" onclick="this.parentElement.parentElement.parentElement.remove()">
                        Close
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    async cancelTask(taskId) {
        // In a full implementation, this would send a cancel request to the gateway
        this.activeTasks.delete(taskId);
        this.updateActiveTasksDisplay();
        this.showNotification('Task cancelled', 'info');
    }
    
    getProjectContext() {
        // Gather context about the current project
        return {
            walletConnected: currentAccount !== null,
            network: 'base-mainnet',
            tokenBalance: document.getElementById('tokenBalance')?.textContent || '0 CODE',
            dashboard: 'codedao-wallet-dashboard'
        };
    }
    
    startTaskMonitoring() {
        // Periodically refresh agent status
        setInterval(() => {
            this.loadConnectedAgents();
        }, 30000); // Every 30 seconds
    }
    
    showNotification(message, type = 'info') {
        // Use existing notification system or create a simple one
        if (window.showNotification) {
            window.showNotification(message);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
            
            // Simple notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                z-index: 10000;
                font-size: 14px;
                max-width: 300px;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 5000);
        }
    }
}

// Initialize agent control when dashboard loads
document.addEventListener('DOMContentLoaded', () => {
    // Wait for AI agent panel to be ready
    setTimeout(() => {
        window.agentControl = new AgentControlDashboard();
    }, 1000);
});

// Export for global access
window.AgentControlDashboard = AgentControlDashboard;

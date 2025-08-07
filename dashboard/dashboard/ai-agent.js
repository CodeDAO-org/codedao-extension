/* CodeDAO AI Agent Styles */

.ai-agent-panel {
    position: fixed;
    right: 20px;
    top: 50%;
    transform: translateY(-50%);
    width: 400px;
    max-height: 80vh;
    background: rgba(255, 255, 255, 0.15);
    backdrop-filter: blur(20px);
    border-radius: 20px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 20px;
    z-index: 1000;
    overflow-y: auto;
    transition: all 0.3s ease;
}

.ai-agent-panel:hover {
    transform: translateY(-50%) translateX(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
}

.agent-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.agent-status {
    display: flex;
    align-items: center;
    gap: 10px;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #6b7280;
    transition: all 0.3s ease;
}

.status-indicator.connected {
    background: #10b981;
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
    animation: pulse-green 2s infinite;
}

.status-indicator.error {
    background: #ef4444;
    animation: pulse-red 1s infinite;
}

@keyframes pulse-green {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.6; }
}

@keyframes pulse-red {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
}

#agent-name {
    color: white;
    font-weight: 600;
    font-size: 14px;
}

.agent-controls {
    display: flex;
    gap: 10px;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea, #764ba2);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 16px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
}

.btn-secondary {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: none;
    border-radius: 8px;
    padding: 8px 12px;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.btn-secondary:hover {
    background: rgba(255, 255, 255, 0.3);
}

/* Agent Capabilities */
.agent-capabilities {
    margin-bottom: 20px;
}

.agent-capabilities h4 {
    color: white;
    margin-bottom: 15px;
    font-size: 14px;
}

.capability-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.capability-card {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 10px;
    padding: 12px;
    text-align: center;
    cursor: pointer;
    transition: all 0.3s ease;
    border: 1px solid rgba(255, 255, 255, 0.1);
}

.capability-card:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.capability-card .icon {
    font-size: 20px;
    display: block;
    margin-bottom: 5px;
}

.capability-card span:last-child {
    color: white;
    font-size: 11px;
    font-weight: 500;
}

/* Chat Interface */
.agent-chat {
    margin-bottom: 20px;
}

.chat-messages {
    max-height: 300px;
    overflow-y: auto;
    margin-bottom: 15px;
    padding: 10px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 10px;
}

.chat-message {
    margin-bottom: 15px;
    display: flex;
}

.chat-message.user {
    justify-content: flex-end;
}

.chat-message.agent {
    justify-content: flex-start;
}

.message-content {
    max-width: 80%;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 12px 16px;
    position: relative;
}

.chat-message.user .message-content {
    background: linear-gradient(135deg, #667eea, #764ba2);
}

.message-text {
    color: white;
    font-size: 13px;
    line-height: 1.4;
    margin-bottom: 5px;
}

.message-time {
    color: rgba(255, 255, 255, 0.6);
    font-size: 10px;
    text-align: right;
}

.chat-input-container {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    padding: 15px;
}

#chat-input {
    width: 100%;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 10px;
    padding: 12px;
    color: white;
    font-size: 13px;
    resize: vertical;
    min-height: 40px;
    max-height: 120px;
    margin-bottom: 10px;
}

#chat-input::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

#chat-input:focus {
    outline: none;
    border-color: rgba(102, 126, 234, 0.5);
    box-shadow: 0 0 10px rgba(102, 126, 234, 0.2);
}

.chat-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
}

.chat-actions button {
    font-size: 11px;
    padding: 6px 12px;
}

/* Suggestions */
.agent-suggestions h4 {
    color: white;
    margin-bottom: 15px;
    font-size: 14px;
}

#suggestions-container {
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.suggestion-card {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 15px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    transition: all 0.3s ease;
}

.suggestion-card:hover {
    background: rgba(255, 255, 255, 0.15);
    transform: translateY(-2px);
}

.suggestion-content h5 {
    color: white;
    margin-bottom: 5px;
    font-size: 13px;
    font-weight: 600;
}

.suggestion-content p {
    color: rgba(255, 255, 255, 0.8);
    font-size: 11px;
    line-height: 1.4;
    margin-bottom: 10px;
}

.suggestion-action {
    background: linear-gradient(135deg, #10b981, #059669);
    color: white;
    border: none;
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.3s ease;
}

.suggestion-action:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
}

/* Code Sharing Modal */
.code-sharing-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
}

.modal-content {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 20px;
    padding: 30px;
    width: 90%;
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-header h3 {
    color: white;
    margin: 0;
}

.close-modal {
    background: none;
    border: none;
    color: white;
    font-size: 24px;
    cursor: pointer;
    padding: 0;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.close-modal:hover {
    background: rgba(255, 255, 255, 0.2);
}

.code-input-section {
    margin-bottom: 20px;
}

.code-input-section label {
    display: block;
    color: white;
    margin-bottom: 8px;
    font-weight: 600;
    font-size: 14px;
}

#code-language {
    width: 100%;
    padding: 10px;
    border-radius: 8px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.1);
    color: white;
    font-size: 14px;
}

#code-content {
    width: 100%;
    height: 200px;
    padding: 15px;
    border-radius: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    background: rgba(0, 0, 0, 0.3);
    color: white;
    font-family: 'Courier New', monospace;
    font-size: 13px;
    resize: vertical;
}

#code-content::placeholder {
    color: rgba(255, 255, 255, 0.6);
}

.analysis-options label {
    color: white;
    margin-bottom: 15px;
    font-weight: 600;
    font-size: 14px;
    display: block;
}

.option-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
}

.option-grid label {
    display: flex;
    align-items: center;
    gap: 8px;
    color: rgba(255, 255, 255, 0.9);
    font-weight: 400;
    font-size: 13px;
    margin: 0;
}

.option-grid input[type="checkbox"] {
    width: 16px;
    height: 16px;
}

.modal-footer {
    display: flex;
    gap: 15px;
    justify-content: flex-end;
    margin-top: 25px;
    padding-top: 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.2);
}

/* Mobile Responsive */
@media (max-width: 768px) {
    .ai-agent-panel {
        position: fixed;
        bottom: 20px;
        right: 20px;
        top: auto;
        transform: none;
        width: calc(100% - 40px);
        max-width: 350px;
        max-height: 60vh;
    }

    .ai-agent-panel:hover {
        transform: translateY(-5px);
    }

    .capability-grid {
        grid-template-columns: repeat(3, 1fr);
    }

    .capability-card {
        padding: 8px;
    }

    .capability-card .icon {
        font-size: 16px;
    }

    .capability-card span:last-child {
        font-size: 10px;
    }

    .modal-content {
        width: 95%;
        padding: 20px;
    }

    .option-grid {
        grid-template-columns: 1fr;
    }

    .modal-footer {
        flex-direction: column;
    }

    .modal-footer button {
        width: 100%;
    }
}

/* Animations */
@keyframes slideInRight {
    from {
        transform: translateX(100%) translateY(-50%);
        opacity: 0;
    }
    to {
        transform: translateX(0) translateY(-50%);
        opacity: 1;
    }
}

.ai-agent-panel {
    animation: slideInRight 0.5s ease-out;
}

/* Scrollbar Styling */
.chat-messages::-webkit-scrollbar,
.ai-agent-panel::-webkit-scrollbar,
.modal-content::-webkit-scrollbar {
    width: 6px;
}

.chat-messages::-webkit-scrollbar-track,
.ai-agent-panel::-webkit-scrollbar-track,
.modal-content::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb,
.ai-agent-panel::-webkit-scrollbar-thumb,
.modal-content::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover,
.ai-agent-panel::-webkit-scrollbar-thumb:hover,
.modal-content::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import './ChatBot.css';

const ChatBot = ({ user, token }) => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [chatbotStatus, setChatbotStatus] = useState('checking');
    const messagesEndRef = useRef(null);
    const messageIdCounter = useRef(0);

    const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

    // Sample suggestions for Hunter College
    const suggestions = [
        "What computer science programs does Hunter offer?",
        "Tell me about psychology majors at Hunter",
        "What are the admission requirements?",
        "How do I apply to Hunter College?",
        "What financial aid is available?"
    ];

    // Generate unique message ID
    const getUniqueId = useCallback((type) => {
        messageIdCounter.current += 1;
        return `${type}-${Date.now()}-${messageIdCounter.current}`;
    }, []);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const addMessage = useCallback((message) => {
        setMessages(prevMessages => {
            const newMessages = [...prevMessages, message];
            console.log(`Added ${message.type} message. Total: ${newMessages.length}`);
            return newMessages;
        });
    }, []);

    const checkChatbotStatus = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/chatbot/status`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();
            setChatbotStatus(data.pythonWorking ? 'online' : 'offline');

            const welcomeMessage = {
                id: getUniqueId('bot'),
                type: 'bot',
                content: data.pythonWorking
                    ? "Hi! I'm Hunter, your academic advisor. I can help you with information about Hunter College programs, admissions, and academic pathways. What would you like to know?"
                    : `⚠️ Chatbot is currently offline: ${data.message}`,
                timestamp: new Date()
            };

            setMessages([welcomeMessage]);
        } catch (error) {
            setChatbotStatus('offline');
            const errorMessage = {
                id: getUniqueId('bot'),
                type: 'bot',
                content: "❌ Unable to connect to chatbot service. Please try again later.",
                timestamp: new Date()
            };
            setMessages([errorMessage]);
        }
    };

    // Check chatbot status on component mount
    useEffect(() => {
        checkChatbotStatus();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const sendMessage = async (messageText = null) => {
        const message = messageText || inputMessage.trim();

        if (!message || loading) return;

        if (chatbotStatus === 'offline') {
            alert('Chatbot is currently offline. Please try again later.');
            return;
        }

        // Create user message
        const userMessage = {
            id: getUniqueId('user'),
            type: 'user',
            content: message,
            timestamp: new Date()
        };

        // Clear input and add user message
        setInputMessage('');
        addMessage(userMessage);
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/chatbot/ask`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ question: message })
            });

            const data = await response.json();

            const botMessage = {
                id: getUniqueId('bot'),
                type: 'bot',
                content: response.ok && data.success
                    ? data.answer
                    : `❌ Error: ${data.error || 'Failed to get response'}`,
                timestamp: new Date()
            };

            addMessage(botMessage);

        } catch (error) {
            const errorMessage = {
                id: getUniqueId('bot'),
                type: 'bot',
                content: "❌ Network error. Please check your connection and try again.",
                timestamp: new Date()
            };
            addMessage(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const handleSuggestionClick = (suggestion) => {
        sendMessage(suggestion);
    };

    const getStatusClass = () => {
        switch (chatbotStatus) {
            case 'online': return 'status-online';
            case 'offline': return 'status-offline';
            default: return 'status-checking';
        }
    };

    const isInputDisabled = chatbotStatus !== 'online' || loading;
    const isSendDisabled = !inputMessage.trim() || loading || chatbotStatus !== 'online';

    return (
        <div className="chatbot-container">
            {/* Chat Header */}
            <div className="chatbot-header">
                <div className={`status-indicator ${getStatusClass()}`}></div>
                <h3 className="chatbot-title">
                    Hunter Academic Advisor {chatbotStatus === 'checking' ? '(Connecting...)' : ''}
                </h3>
            </div>

            {/* Messages Area */}
            <div className="messages-area">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`message-wrapper ${message.type === 'user' ? 'message-wrapper-user' : 'message-wrapper-bot'}`}
                    >
                        <div className={`message-bubble ${message.type === 'user' ? 'message-bubble-user' : 'message-bubble-bot'}`}>
                            {message.content}
                            <div className={`message-timestamp ${message.type === 'user' ? 'message-timestamp-user' : 'message-timestamp-bot'}`}>
                                {message.timestamp.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </div>
                        </div>
                    </div>
                ))}

                {loading && (
                    <div className="loading-wrapper">
                        <div className="loading-bubble">
                            <div className="loading-dots">
                                <div className="loading-dot"></div>
                                <div className="loading-dot"></div>
                                <div className="loading-dot"></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Suggestions */}
                {messages.length === 1 && !loading && chatbotStatus === 'online' && (
                    <div className="suggestions-section">
                        <p className="suggestions-title">
                            Try asking about:
                        </p>
                        <div className="suggestions-list">
                            {suggestions.map((suggestion, index) => (
                                <button
                                    key={index}
                                    onClick={() => handleSuggestionClick(suggestion)}
                                    className="suggestion-button"
                                >
                                    {suggestion}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="input-area">
                <div className="input-wrapper">
                    <textarea
                        value={inputMessage}
                        onChange={(e) => setInputMessage(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={chatbotStatus === 'online' ?
                            "Ask about Hunter College programs, admissions, or academic pathways..." :
                            "Chatbot is offline..."
                        }
                        disabled={isInputDisabled}
                        className="message-textarea"
                        rows={1}
                    />
                    <button
                        onClick={() => sendMessage()}
                        disabled={isSendDisabled}
                        className={`send-button ${isSendDisabled ? 'send-button-disabled' : 'send-button-enabled'}`}
                    >
                        {loading ? '...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ChatBot;
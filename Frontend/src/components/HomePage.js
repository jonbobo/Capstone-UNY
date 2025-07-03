import React, { useState } from 'react';
import './HomePage.css';

function HomePage({ user, onLogout }) {
    const [showDropdown, setShowDropdown] = useState(false);
    const [selectedChat, setSelectedChat] = useState(null);
    const [recentChats, setRecentChats] = useState([
        { id: 1, title: 'Chat 1', timestamp: '2 hours ago' },
        { id: 2, title: 'Chat 2', timestamp: '1 day ago' },
        { id: 3, title: 'Chat 3', timestamp: '2 days ago' },
    ]);

    const handleNewChat = () => {
        const newChat = {
            id: Date.now(),
            title: 'New Chat',
            timestamp: 'Just now'
        };
        setRecentChats([newChat, ...recentChats]);
        setSelectedChat(newChat);
    };

    const handleChatSelect = (chat) => {
        setSelectedChat(chat);
    };

    const toggleDropdown = () => {
        setShowDropdown(!showDropdown);
    };

    // Close dropdown when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (showDropdown && !event.target.closest('.profile-section')) {
                setShowDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showDropdown]);

    return (
        <div className="homepage-container">
            {/* Sidebar */}
            <div className="sidebar">
                <button className="new-chat-btn" onClick={handleNewChat}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M8 1v14M1 8h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                    New Chat
                </button>

                <div className="recent-chats">
                    <h3 className="sidebar-section-title">Recent</h3>
                    {recentChats.map(chat => (
                        <div
                            key={chat.id}
                            className={`chat-item ${selectedChat?.id === chat.id ? 'active' : ''}`}
                            onClick={() => handleChatSelect(chat)}
                        >
                            <svg className="chat-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                <path d="M1 4.5C1 3.11929 2.11929 2 3.5 2H12.5C13.8807 2 15 3.11929 15 4.5V9.5C15 10.8807 13.8807 12 12.5 12H8.70711L5.35355 15.3536C5.15829 15.5488 4.84171 15.5488 4.64645 15.3536C4.5527 15.2598 4.5 15.1326 4.5 15V12H3.5C2.11929 12 1 10.8807 1 9.5V4.5Z" stroke="currentColor" strokeWidth="1.5" />
                            </svg>
                            <div className="chat-info">
                                <div className="chat-title">{chat.title}</div>
                                <div className="chat-timestamp">{chat.timestamp}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="main-content">
                {/* Top Bar */}
                <div className="top-bar">
                    <div className="top-bar-title">
                        {selectedChat ? selectedChat.title : 'UNY Compass'}
                    </div>

                    <div className="profile-section">
                        <button className="profile-btn" onClick={toggleDropdown}>
                            <div className="profile-circle">
                                {user?.username ? user.username.charAt(0).toUpperCase() : 'U'}
                            </div>
                        </button>

                        {showDropdown && (
                            <div className="profile-dropdown">
                                <div className="dropdown-header">
                                    <div className="user-info">
                                        <div className="user-name">{user?.username || 'User'}</div>
                                        <div className="user-email">{user?.email || 'user@example.com'}</div>
                                    </div>
                                </div>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item">
                                    <svg className="dropdown-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M8 1C11.866 1 15 4.13401 15 8C15 11.866 11.866 15 8 15C4.13401 15 1 11.866 1 8C1 4.13401 4.13401 1 8 1ZM8 2.5C4.96243 2.5 2.5 4.96243 2.5 8C2.5 11.0376 4.96243 13.5 8 13.5C11.0376 13.5 13.5 11.0376 13.5 8C13.5 4.96243 11.0376 2.5 8 2.5ZM8 9.5C8.41421 9.5 8.75 9.83579 8.75 10.25C8.75 10.6642 8.41421 11 8 11C7.58579 11 7.25 10.6642 7.25 10.25C7.25 9.83579 7.58579 9.5 8 9.5ZM8 5C8.41421 5 8.75 5.33579 8.75 5.75V8.25C8.75 8.66421 8.41421 9 8 9C7.58579 9 7.25 8.66421 7.25 8.25V5.75C7.25 5.33579 7.58579 5 8 5Z" fill="currentColor" />
                                    </svg>
                                    Help & FAQ
                                </button>
                                <button className="dropdown-item">
                                    <svg className="dropdown-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M13.5 8.5L13.5 2.5C13.5 2.22386 13.2761 2 13 2L3 2C2.72386 2 2.5 2.22386 2.5 2.5L2.5 13.5C2.5 13.7761 2.72386 14 3 14L8.5 14M11 11L14 14M14 14L14 10M14 14L10 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Settings
                                </button>
                                <div className="dropdown-divider"></div>
                                <button className="dropdown-item" onClick={onLogout}>
                                    <svg className="dropdown-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                                        <path d="M6 2L2 2C1.44772 2 1 2.44772 1 3L1 13C1 13.5523 1.44772 14 2 14L6 14M11 12L15 8M15 8L11 4M15 8L5 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    Log out
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="chat-area">
                    {selectedChat ? (
                        <div className="chat-content">
                            <p>Chat content for: {selectedChat.title}</p>
                            {/* Add your chat messages and input here */}
                        </div>
                    ) : (
                        <div className="welcome-screen">
                            <h1 className="welcome-title">Welcome to UNY Compass</h1>
                            <p className="welcome-subtitle">Start a conversation by creating a new chat</p>

                            <div className="suggestion-cards">
                                <div className="suggestion-card" onClick={handleNewChat}>
                                    <h3>💡 Examples</h3>
                                    <p>"Explain quantum computing in simple terms"</p>
                                </div>
                                <div className="suggestion-card" onClick={handleNewChat}>
                                    <h3>🚀 Capabilities</h3>
                                    <p>"Help me write a Python function"</p>
                                </div>
                                <div className="suggestion-card" onClick={handleNewChat}>
                                    <h3>⚠️ Limitations</h3>
                                    <p>"May occasionally generate incorrect information"</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default HomePage;
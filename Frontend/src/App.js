import React, { useState, useEffect } from 'react';
import './App.css';
import LoginForm from './components/LoginForm';
import RegisterForm from './components/RegisterForm';
import HomePage from './components/HomePage';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [currentView, setCurrentView] = useState('login');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    setCurrentView('login');
    setMessage('Logged out successfully');
  };

  return (
    <div className="app-container">
      {user ? (
        <HomePage user={user} onLogout={handleLogout} />
      ) : (
        <div className="auth-container">
          {currentView === 'login' ? (
            <LoginForm
              setCurrentView={setCurrentView}
              setMessage={setMessage}
              setToken={setToken}
              setUser={setUser}
              loading={loading}
              setLoading={setLoading}
            />
          ) : (
            <RegisterForm
              setCurrentView={setCurrentView}
              setMessage={setMessage}
              setToken={setToken}
              setUser={setUser}
              loading={loading}
              setLoading={setLoading}
            />
          )}
          {message && <div className="message-alert">{message}</div>}
        </div>
      )}
    </div>
  );
}

export default App;
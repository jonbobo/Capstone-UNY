// app.js - React Frontend Component (Root Level)
import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import './App.css';

// API points to the Express server running on port 3000
// Note: React dev server will run on a different port (3001, 3002, etc.)
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/auth';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage?.getItem('token') || null);
  const [currentView, setCurrentView] = useState('login');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Check if user is logged in on component mount
  useEffect(() => {
    if (token) {
      fetchProfile();
    }
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        // Token is invalid
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      setMessage('Error connecting to backend server. Check that Express server is running on port 3000.');
    }
  };

  const handleLogout = () => {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('token');
    }
    setToken(null);
    setUser(null);
    setCurrentView('login');
    setMessage('Logged out successfully');
  };

  // Login Component
  const LoginForm = () => {
    const [formData, setFormData] = useState({
      username: '',
      password: ''
    });

    const handleSubmit = async () => {
      if (!formData.username || !formData.password) {
        setMessage('Please fill in all fields');
        return;
      }

      setLoading(true);
      setMessage('');

      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('token', data.token);
          }
          setToken(data.token);
          setUser(data.user);
          setMessage('Login successful!');
          setFormData({ username: '', password: '' });
        } else {
          setMessage(data.error || 'Login failed');
        }
      } catch (error) {
        setMessage('Cannot connect to backend server. Ensure Express.js server is running on port 3000.');
        console.error('Login error:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    return (
      <div>
        <h2>Login to Hunter Academic Advisor</h2>
        <div>
          <div className="form-group">
            <label className="form-label">Username or Email:</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Enter username or email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password:</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Enter password"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.username || !formData.password}
            className="form-button login"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        <p className="form-link">
          Don't have an account?
          <button
            onClick={() => {
              setCurrentView('register');
              setMessage('');
            }}
            className="form-link-button"
          >
            Register here
          </button>
        </p>
      </div>
    );
  };

  // Register Component
  const RegisterForm = () => {
    const [formData, setFormData] = useState({
      username: '',
      email: '',
      password: ''
    });

    const handleSubmit = async () => {
      if (!formData.username || !formData.email || !formData.password) {
        setMessage('Please fill in all fields');
        return;
      }

      if (formData.password.length < 6) {
        setMessage('Password must be at least 6 characters long');
        return;
      }

      setLoading(true);
      setMessage('');

      try {
        const response = await fetch(`${API_BASE_URL}/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        const data = await response.json();

        if (response.ok) {
          if (typeof localStorage !== 'undefined') {
            localStorage.setItem('token', data.token);
          }
          setToken(data.token);
          setUser(data.user);
          setMessage('Registration successful! Welcome!');
          setFormData({ username: '', email: '', password: '' });
        } else {
          setMessage(data.error || 'Registration failed');
        }
      } catch (error) {
        setMessage('Cannot connect to backend server. Ensure Express.js server is running on port 3000.');
        console.error('Registration error:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleKeyPress = (e) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    return (
      <div>
        <h2>Create Account for Hunter Academic Advisor</h2>
        <div>
          <div className="form-group">
            <label className="form-label">Username:</label>
            <input
              type="text"
              className="form-input"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Choose a username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email:</label>
            <input
              type="email"
              className="form-input"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Enter your email"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password:</label>
            <input
              type="password"
              className="form-input"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onKeyPress={handleKeyPress}
              placeholder="Create a password (min 6 characters)"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.username || !formData.email || !formData.password}
            className="form-button register"
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
        <p className="form-link">
          Already have an account?
          <button
            onClick={() => {
              setCurrentView('login');
              setMessage('');
            }}
            className="form-link-button"
          >
            Login here
          </button>
        </p>
      </div>
    );
  };

  const getMessageClass = () => {
    return message.includes('Error') || message.includes('failed') || message.includes('Network')
      ? 'message-alert error'
      : 'message-alert success';
  };

  return (
    <div className={`app-wrapper ${user ? 'logged-in' : 'logged-out'}`}>
      {!user && (
        <h1 className="app-title">
          Hunter Academic Advisor
        </h1>
      )}

      {message && !user && (
        <div className={getMessageClass()}>
          {message}
        </div>
      )}

      {user ? (
        <HomePage user={user} onLogout={handleLogout} token={token} />
      ) : (
        currentView === 'login' ? <LoginForm /> : <RegisterForm />
      )}

      {!user && (
        <div className="setup-instructions">
          <strong>Setup Instructions:</strong>
          <br />1. Make sure PostgreSQL is running and configured in authentication/.env
          <br />2. Run backend: cd authentication && npm install && npm run dev
          <br />3. Backend should be running on http://localhost:3000
          <br />4. Python chatbot should be accessible from authentication server
        </div>
      )}
    </div>
  );
}

export default App;
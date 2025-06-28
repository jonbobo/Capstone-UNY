// app.js - React Frontend Component (Root Level)
import React, { useState, useEffect } from 'react';

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
        <h2>Login</h2>
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Username or Email:</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              onKeyPress={handleKeyPress}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
              placeholder="Enter username or email"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onKeyPress={handleKeyPress}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
              placeholder="Enter password"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.username || !formData.password}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: loading ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
        <p style={{ marginTop: '15px' }}>
          Don't have an account?
          <button
            onClick={() => {
              setCurrentView('register');
              setMessage('');
            }}
            style={{
              marginLeft: '5px',
              background: 'none',
              border: 'none',
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
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
        <h2>Create Account</h2>
        <div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Username:</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              onKeyPress={handleKeyPress}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
              placeholder="Choose a username"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Email:</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              onKeyPress={handleKeyPress}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
              placeholder="Enter your email"
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px' }}>Password:</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              onKeyPress={handleKeyPress}
              style={{ width: '100%', padding: '8px', fontSize: '14px' }}
              placeholder="Create a password (min 6 characters)"
            />
          </div>
          <button
            onClick={handleSubmit}
            disabled={loading || !formData.username || !formData.email || !formData.password}
            style={{
              padding: '10px 20px',
              fontSize: '14px',
              backgroundColor: loading ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </div>
        <p style={{ marginTop: '15px' }}>
          Already have an account?
          <button
            onClick={() => {
              setCurrentView('login');
              setMessage('');
            }}
            style={{
              marginLeft: '5px',
              background: 'none',
              border: 'none',
              color: '#007bff',
              textDecoration: 'underline',
              cursor: 'pointer'
            }}
          >
            Login here
          </button>
        </p>
      </div>
    );
  };

  // Profile Component
  const Profile = () => {
    const [editMode, setEditMode] = useState(false);
    const [editEmail, setEditEmail] = useState(user?.email || '');
    const [passwordData, setPasswordData] = useState({
      currentPassword: '',
      newPassword: ''
    });

    const handleUpdateProfile = async () => {
      if (!editEmail) {
        setMessage('Email is required');
        return;
      }

      setLoading(true);
      setMessage('');

      try {
        const response = await fetch(`${API_BASE_URL}/profile`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ email: editEmail })
        });

        const data = await response.json();

        if (response.ok) {
          setUser(data.user);
          setEditMode(false);
          setMessage('Profile updated successfully!');
        } else {
          setMessage(data.error || 'Update failed');
        }
      } catch (error) {
        setMessage('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const handleChangePassword = async () => {
      if (!passwordData.currentPassword || !passwordData.newPassword) {
        setMessage('Please fill in both password fields');
        return;
      }

      if (passwordData.newPassword.length < 6) {
        setMessage('New password must be at least 6 characters long');
        return;
      }

      setLoading(true);
      setMessage('');

      try {
        const response = await fetch(`${API_BASE_URL}/password`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(passwordData)
        });

        const data = await response.json();

        if (response.ok) {
          setPasswordData({ currentPassword: '', newPassword: '' });
          setMessage('Password changed successfully!');
        } else {
          setMessage(data.error || 'Password change failed');
        }
      } catch (error) {
        setMessage('Network error. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <div>
        <h2>Welcome, {user.username}!</h2>

        <div style={{
          marginBottom: '30px',
          padding: '15px',
          border: '1px solid #ddd',
          borderRadius: '5px',
          backgroundColor: '#f9f9f9'
        }}>
          <h3>Your Profile</h3>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Username:</strong> {user.username}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Member since:</strong> {new Date(user.created_at).toLocaleDateString()}</p>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Update Email</h3>
          {editMode ? (
            <div>
              <input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                style={{ padding: '8px', marginRight: '10px', width: '200px' }}
                placeholder="Enter new email"
              />
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                style={{
                  padding: '8px 15px',
                  marginRight: '5px',
                  backgroundColor: '#28a745',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                {loading ? 'Updating...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setEditEmail(user.email);
                }}
                style={{
                  padding: '8px 15px',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditMode(true)}
              style={{
                padding: '8px 15px',
                backgroundColor: '#007bff',
                color: 'white',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Edit Email
            </button>
          )}
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3>Change Password</h3>
          <div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>Current Password:</label>
              <input
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                style={{ padding: '8px', width: '200px' }}
                placeholder="Enter current password"
              />
            </div>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>New Password:</label>
              <input
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                style={{ padding: '8px', width: '200px' }}
                placeholder="Enter new password"
              />
            </div>
            <button
              onClick={handleChangePassword}
              disabled={loading || !passwordData.currentPassword || !passwordData.newPassword}
              style={{
                padding: '8px 15px',
                backgroundColor: '#ffc107',
                color: 'black',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>

        <div>
          <button
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#dc3545',
              color: 'white',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Logout
          </button>
        </div>
      </div>
    );
  };

  return (
    <div style={{
      padding: '30px',
      maxWidth: '500px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
        Authentication Demo
      </h1>

      {message && (
        <div style={{
          padding: '15px',
          marginBottom: '20px',
          backgroundColor: message.includes('Error') || message.includes('failed') || message.includes('Network') ? '#f8d7da' : '#d4edda',
          border: `1px solid ${message.includes('Error') || message.includes('failed') || message.includes('Network') ? '#f5c6cb' : '#c3e6cb'}`,
          borderRadius: '5px',
          color: message.includes('Error') || message.includes('failed') || message.includes('Network') ? '#721c24' : '#155724'
        }}>
          {message}
        </div>
      )}

      {user ? (
        <Profile />
      ) : (
        currentView === 'login' ? <LoginForm /> : <RegisterForm />
      )}

      <div style={{
        marginTop: '40px',
        padding: '15px',
        backgroundColor: '#f8f9fa',
        borderRadius: '5px',
        fontSize: '12px',
        color: '#6c757d'
      }}>
        <strong>Setup Instructions:</strong>
        <br />1. Make sure PostgreSQL is running and configured in authentication/.env
        <br />2. Run backend: cd authentication && npm install && npm run dev
        <br />3. Backend should be running on http://localhost:3000
      </div>
    </div>
  );
}

export default App;
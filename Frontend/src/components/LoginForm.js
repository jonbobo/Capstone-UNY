import React, { useState } from 'react';
import './AuthForms.css';

function LoginForm({ setCurrentView, setMessage, setToken, setUser, loading, setLoading }) {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Replace with your actual API endpoint
            const response = await fetch('http://localhost:3000/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (response.ok) {
                // Save token and user data
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                setToken(data.token);
                setUser(data.user);
                setMessage('Login successful!');
            } else {
                setMessage(data.message || 'Login failed');
            }
        } catch (error) {
            setMessage('Error connecting to server');
            console.error('Login error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2 className="auth-title">Welcome back</h2>
                <p className="auth-subtitle">Please sign in to continue</p>

                <div className="form-group">
                    <label htmlFor="username">Username or Email</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter your username or email"
                        required
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Enter your password"
                        required
                        className="form-input"
                    />
                </div>

                <div className="form-options">
                    <label className="remember-me">
                        <input type="checkbox" />
                        <span>Remember me</span>
                    </label>
                    <a href="#" className="forgot-password">Forgot password?</a>
                </div>

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign in'}
                </button>

                <div className="auth-switch">
                    <span>Don't have an account? </span>
                    <button
                        type="button"
                        onClick={() => setCurrentView('register')}
                        className="switch-btn"
                    >
                        Sign up
                    </button>
                </div>
            </form>
        </div>
    );
}

export default LoginForm;
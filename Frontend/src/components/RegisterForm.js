import React, { useState } from 'react';
import './AuthForms.css';

function RegisterForm({ setCurrentView, setMessage, setToken, setUser, loading, setLoading }) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
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

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setMessage('Passwords do not match');
            setLoading(false);
            return;
        }

        try {
            // Replace with your actual API endpoint
            const response = await fetch('http://localhost:3001/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (response.ok) {
                // Auto-login after successful registration
                localStorage.setItem('token', data.token);
                localStorage.setItem('user', JSON.stringify(data.user));

                setToken(data.token);
                setUser(data.user);
                setMessage('Registration successful!');
            } else {
                setMessage(data.message || 'Registration failed');
            }
        } catch (error) {
            setMessage('Error connecting to server');
            console.error('Registration error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-form-container">
            <form className="auth-form" onSubmit={handleSubmit}>
                <h2 className="auth-title">Create an account</h2>
                <p className="auth-subtitle">Join us to get started</p>

                <div className="form-group">
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="Enter your name"
                        required
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Enter your email"
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
                        placeholder="Create a password"
                        required
                        minLength="6"
                        className="form-input"
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="confirmPassword">Confirm Password</label>
                    <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        required
                        className="form-input"
                    />
                </div>

                <div className="terms-checkbox">
                    <label>
                        <input type="checkbox" required />
                        <span>I agree to the Terms of Service and Privacy Policy</span>
                    </label>
                </div>

                <button
                    type="submit"
                    className="submit-btn"
                    disabled={loading}
                >
                    {loading ? 'Creating account...' : 'Sign up'}
                </button>

                <div className="auth-switch">
                    <span>Already have an account? </span>
                    <button
                        type="button"
                        onClick={() => setCurrentView('login')}
                        className="switch-btn"
                    >
                        Sign in
                    </button>
                </div>
            </form>
        </div>
    );
}

export default RegisterForm;
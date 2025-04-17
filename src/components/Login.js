import React, { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import './Login.css';

export default function Login({ onLogin }) {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    // Temporary hardcoded credentials
    if (email === 'rahul.saini@zentrades.pro' && password === 'Rahul@830') {
      setError('');
      localStorage.setItem('token', 'dummy-token');
      onLogin();
    } else {
      setError('Invalid email or password.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Logo */}
        <img
          src="https://zentrades.pro/wp-content/uploads/2024/04/ZenTrades-scaled.webp"               /* or your hosted logo URL */
          alt="Company Logo"
          className="login-logo"
        />

        <h2>Admin Panel Login</h2>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <Mail className="icon" />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="input-group">
            <Lock className="icon" />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <div className="error-message">{error}</div>}

          <button type="submit" className="login-button">
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

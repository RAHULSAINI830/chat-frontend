// src/components/PublicRegister.js
import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../api';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Briefcase } from 'lucide-react';
import './PublicRegister.css';

const PublicRegister = () => {
  const [name, setName]           = useState('');
  const [email, setEmail]         = useState('');
  const [companyName, setCompany] = useState('');
  const [error, setError]         = useState('');
  const navigate                  = useNavigate();

  const handleRegister = async e => {
    e.preventDefault();
    if (!name || !email || !companyName) {
      setError('All fields are required.');
      return;
    }
    try {
      const { data: user } = await axios.post(
        `${API}/api/create-user`,
        { name, email, companyName }
      );
      const sessionPath = new URL(user.link).pathname;
      navigate(sessionPath);
    } catch (err) {
      console.error(err);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="pr-register-container">
      <div className="pr-register-card">
        <h2 className="pr-register-title">Welcome—join the chat</h2>
        {error && <p className="pr-form-error">{error}</p>}
        <form onSubmit={handleRegister} className="pr-register-form">
          <div className="pr-form-group">
            <label htmlFor="pr-name" className="pr-form-label">Name</label>
            <div className="pr-input-icon-wrapper">
              <User size={16} className="pr-input-icon" />
              <input
                id="pr-name"
                className="pr-input-field"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          </div>

          <div className="pr-form-group">
            <label htmlFor="pr-email" className="pr-form-label">Email</label>
            <div className="pr-input-icon-wrapper">
              <Mail size={16} className="pr-input-icon" />
              <input
                id="pr-email"
                type="email"
                className="pr-input-field"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="pr-form-group">
            <label htmlFor="pr-company" className="pr-form-label">Company/User Name</label>
            <div className="pr-input-icon-wrapper">
              <Briefcase size={16} className="pr-input-icon" />
              <input
                id="pr-company"
                className="pr-input-field"
                value={companyName}
                onChange={e => setCompany(e.target.value)}
                placeholder="Your company"
                required
              />
            </div>
          </div>

          <button type="submit" className="pr-register-button">
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicRegister;

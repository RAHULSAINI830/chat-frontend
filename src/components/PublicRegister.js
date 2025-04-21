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
    <div className="public-register">
      <div className="register-card">
        <h2>Welcome—join the chat</h2>
        {error && <p className="form-error">{error}</p>}

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <div className="input-icon-wrapper">
              <User size={16} className="input-icon" />
              <input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Your name"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <div className="input-icon-wrapper">
              <Mail size={16} className="input-icon" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="company">Company Name</label>
            <div className="input-icon-wrapper">
              <Briefcase size={16} className="input-icon" />
              <input
                id="company"
                value={companyName}
                onChange={e => setCompany(e.target.value)}
                placeholder="Your company"
                required
              />
            </div>
          </div>

          <button type="submit" className="register-button">
            Join Chat
          </button>
        </form>
      </div>
    </div>
  );
};

export default PublicRegister;

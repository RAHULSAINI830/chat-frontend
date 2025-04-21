import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../api';
import { useNavigate } from 'react-router-dom';
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
      // Redirect straight into their chat session:
      const sessionPath = new URL(user.link).pathname; // “/chat/…”
      navigate(sessionPath);
    } catch (err) {
      console.error(err);
      setError('Registration failed. Please try again.');
    }
  };

  return (
    <div className="public-register">
      <h2>Welcome—join the chat</h2>
      {error && <p className="form-error">{error}</p>}
      <form onSubmit={handleRegister} className="register-form">
        <div className="form-group">
          <label>Name</label>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Email</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>Company Name</label>
          <input
            value={companyName}
            onChange={e => setCompany(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="register-button">
          Join Chat
        </button>
      </form>
    </div>
  );
};

export default PublicRegister;

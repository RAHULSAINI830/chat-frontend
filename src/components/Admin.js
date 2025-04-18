// src/components/Admin.js
import React, { useState } from 'react';
import axios from 'axios';
import { API } from '../api';

const Admin = () => {
  const [sessionId, setSessionId] = useState('');

  const createChatSession = async () => {
    try {
      const res = await axios.post(`${API}/api/create-chat`);
      setSessionId(res.data.sessionId);
    } catch (error) {
      console.error('Failed to create chat session', error);
    }
  };

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <button onClick={createChatSession}>Create Chat Session</button>
      {sessionId && (
        <div>
          <p>Share this link with your users:</p>
          <a href={`http://localhost:3000/chat/${sessionId}`}>
            http://localhost:3000/chat/{sessionId}
          </a>
        </div>
      )}
    </div>
  );
};

export default Admin;

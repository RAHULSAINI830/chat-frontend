// src/components/AdminPanel.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import io from 'socket.io-client';
import { API } from '../api';
import {
  Image as ImageIcon,
  Mic,
  MicOff
} from 'lucide-react';
import './AdminPanel.css';

const socket = io(API);

/* ChatComponent – right‑hand pane with external avatars on opposite side */
const ChatComponent = ({ sessionId, user }) => {
  const [messages, setMessages]   = useState([]);
  const [input, setInput]         = useState('');
  const [file, setFile]           = useState(null);
  const [fileType, setFileType]   = useState('');
  const [previewURL, setPreview]  = useState('');
  const [recording, setRecording] = useState(false);
  const mediaRecRef               = useRef(null);
  const chunksRef                 = useRef([]);
  const endRef                    = useRef(null);

  const fmtTime = ts =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const fmtDate = ts => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month:   'short',
      day:     'numeric',
      year:    'numeric'
    });
  };

  useEffect(() => {
    if (!sessionId) return;
    socket.emit('joinSession', sessionId);

    axios
      .get(`${API}/api/messages/${sessionId}`)
      .then(res => setMessages(res.data))
      .catch(console.error);

    const handleMsg = m => {
      if (m.sessionId === sessionId) {
        const msg = {
          ...m,
          createdAt: m.createdAt || new Date().toISOString()
        };
        setMessages(prev => [...prev, msg]);
      }
    };

    socket.on('chatMessage', handleMsg);
    return () => socket.off('chatMessage', handleMsg);
  }, [sessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRecRef.current = mr;
      chunksRef.current = [];

      mr.ondataavailable = e => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 100 * 1024) {
          alert('Recording exceeds 100 KB — please record a shorter clip.');
          return;
        }
        setFile(blob);
        setFileType(blob.type);
        setPreview(URL.createObjectURL(blob));
      };

      mr.start();
      setRecording(true);
    } catch (err) {
      console.error('Microphone error or permission denied:', err);
    }
  };

  const stopRecording = () => {
    mediaRecRef.current?.stop();
    mediaRecRef.current?.stream.getTracks().forEach(t => t.stop());
    setRecording(false);
  };

  const pickFile = (e, prefix) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith(prefix) || f.size > 100 * 1024) {
      alert(`Choose a ${prefix.startsWith('image') ? 'image' : 'audio'} under 100 KB`);
      return;
    }
    setFile(f);
    setFileType(f.type);
    setPreview(URL.createObjectURL(f));
  };

  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    let fileUrl = '';
    if (file) {
      try {
        const fd = new FormData();
        fd.append(
          'file',
          file instanceof File
            ? file
            : new File([file], 'voice.webm', { type: fileType })
        );
        const { data } = await axios.post(`${API}/api/upload`, fd);
        fileUrl = data.fileUrl;
      } catch (err) {
        console.error('Upload failed:', err);
        return;
      }
    }

    socket.emit('chatMessage', {
      sessionId,
      sender: 'Admin',
      text: input.trim(),
      fileUrl,
      fileType
    });

    setInput('');
    setFile(null);
    setFileType('');
    setPreview('');
  };

  const renderMessages = () => {
    const items = [];
    let lastDate = null;

    messages.forEach((m, i) => {
      const msgDate = new Date(m.createdAt).toDateString();
      if (msgDate !== lastDate) {
        items.push(
          <div key={`sep-${i}`} className="date-separator">
            {fmtDate(m.createdAt)}
          </div>
        );
        lastDate = msgDate;
      }

      const isAudio = m.fileUrl && m.fileType.startsWith('audio/');
      const adminAvatar = 'https://cdn3.iconfinder.com/data/icons/avatars-flat/33/man_5-512.png';
      const userAvatar  = 'https://cdn-icons-png.flaticon.com/512/8599/8599138.png';

      if (m.sender === 'Admin') {
        items.push(
          <div key={i} className="chat-message-wrapper admin">
            <div className={`chat-message admin ${isAudio ? 'audio-msg' : ''}`}>
              {m.fileUrl && m.fileType.startsWith('image/') && (
                <img src={m.fileUrl} alt="upload" className="uploaded-image" />
              )}
              {isAudio && <audio controls src={m.fileUrl} className="uploaded-audio" />}
              {m.text && <span className="message-text">{m.text}</span>}
              <span className="msg-time">{fmtTime(m.createdAt)}</span>
            </div>
            <img src={adminAvatar} alt="Admin" className="message-avatar" />
          </div>
        );
      } else {
        items.push(
          <div key={i} className="chat-message-wrapper user">
            <img src={userAvatar} alt={user.name} className="message-avatar" />
            <div className={`chat-message user ${isAudio ? 'audio-msg' : ''}`}>
              {m.fileUrl && m.fileType.startsWith('image/') && (
                <img src={m.fileUrl} alt="upload" className="uploaded-image" />
              )}
              {isAudio && <audio controls src={m.fileUrl} className="uploaded-audio" />}
              {m.text && <span className="message-text">{m.text}</span>}
              <span className="msg-time">{fmtTime(m.createdAt)}</span>
            </div>
          </div>
        );
      }
    });

    return items.length ? items : <p className="empty-msg">No messages yet.</p>;
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <img
          src={`https://api.dicebear.com/7.x/identicon/svg?seed=${user.email}`}
          alt={user.name}
          className="chat-avatar"
        />
        <div>
          <strong>{user.name}</strong><br />
          <small>{sessionId}</small>
        </div>
      </div>

      <div className="chat-messages">
        {renderMessages()}
        <div ref={endRef} />
      </div>

      {previewURL && (
        <div className="preview-wrapper">
          {fileType.startsWith('image/') ? (
            <img src={previewURL} alt="preview" />
          ) : (
            <audio controls src={previewURL} />
          )}
          <button onClick={() => { setFile(null); setPreview(''); }}>✕</button>
        </div>
      )}

      <form onSubmit={handleSend} className="chat-form">
        <label htmlFor="imgPick" className="attach-btn" title="Attach image">
          <ImageIcon size={20} />
        </label>
        <input
          id="imgPick"
          type="file"
          accept="image/*"
          hidden
          onChange={e => pickFile(e, 'image/')}
        />

        <label htmlFor="audPick" className="attach-btn" title="Attach audio file">
          <MicOff size={20} />
        </label>
        <input
          id="audPick"
          type="file"
          accept="audio/*"
          hidden
          onChange={e => pickFile(e, 'audio/')}
        />

        <button
          type="button"
          className={`attach-btn ${recording ? 'recording' : ''}`}
          title={recording ? 'Stop recording' : 'Record audio'}
          onClick={recording ? stopRecording : startRecording}
        >
          <Mic size={20} />
        </button>

        <input
          className="chat-input"
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
        />

        <button className="chat-send-button">Send</button>
      </form>
    </div>
  );
};

/* SettingsPanel – sidebar modal */
const SettingsPanel = ({ onClose, refreshUsers }) => {
  const [activeTab, setActiveTab]     = useState('create');
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [companyName, setCompanyName] = useState('');
  const [users, setUsers]             = useState([]);
  const [error, setError]             = useState('');

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get(`${API}/api/users`);
      setUsers(data);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  const handleDeleteUser = async id => {
    if (!window.confirm('Delete this user?')) return;
    try {
      await axios.delete(`${API}/api/users/${id}`);
      fetchUsers();
      refreshUsers();
    } catch (err) {
      console.error('Delete user error:', err);
      alert('Could not delete user.');
    }
  };

  const handleCreateUser = async e => {
    e.preventDefault();
    if (!name || !email || !companyName) {
      setError('All fields are required.');
      return;
    }
    try {
      await axios.post(`${API}/api/create-user`, {
        name, email, companyName
      });
      setName(''); setEmail(''); setCompanyName('');
      setError('');
      setActiveTab('list');
      await fetchUsers();
      refreshUsers();
    } catch (err) {
      console.error('Create user error:', err);
      setError('Error creating user.');
    }
  };

  useEffect(() => { if (activeTab === 'list') fetchUsers(); }, [activeTab]);

  return (
    <div className="settings-panel">
      <div className="settings-tabs">
        <button
          className={`tab-button ${activeTab === 'create' ? 'active' : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Create User
        </button>
        <button
          className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          User List
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'create' && (
          <form className="user-form" onSubmit={handleCreateUser}>
            {error && <p className="form-error">{error}</p>}
            <div className="form-group">
              <label>Name:</label>
              <input
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Email:</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Company Name:</label>
              <input
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                required
              />
            </div>
            <button className="create-user-button">Create</button>
          </form>
        )}
        {activeTab === 'list' && (
          <table className="user-table">
            <thead>
              <tr>
                <th>Name</th><th>Email</th><th>Company</th><th>Link</th><th>Action</th>
              </tr>
            </thead>
            <tbody>
              {users.length ? (
                users.map(u => (
                  <tr key={u._id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.companyName}</td>
                    <td>
                      <a href={u.link} target="_blank" rel="noopener noreferrer">
                        {u.link}
                      </a>
                    </td>
                    <td>
                      <button
                        className="delete-user-button"
                        onClick={() => handleDeleteUser(u._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center' }}>
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      <button className="close-settings-button" onClick={onClose}>
        Close Settings
      </button>
    </div>
  );
};

/* AdminPanel – root component with Logout button */
const AdminPanel = ({ onLogout }) => {
  const [users, setUsers]       = useState([]);
  const [selected, setSelected] = useState(null);
  const [showSettings, setShow] = useState(false);
  const navigate                = useNavigate();

  const loadUsers = async () => {
    try {
      const { data } = await axios.get(`${API}/api/users`);
      setUsers(data);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="admin-panel">
      <div className="admin-container">
        <aside className="admin-sidebar">
          <div className="logo-container">
            <img
              src="https://zentrades.pro/wp-content/uploads/2024/04/ZenFire-Black.svg"
              alt="Logo"
              className="logo-image"
            />
          </div>

          <div className="user-list">
            {users.length ? (
              users.map(u => {
                const active    = selected?._id === u._id;
                const sessionId = u.link.split('/').pop();
                return (
                  <div
                    key={u._id}
                    className={`session-card ${active ? 'selected' : ''}`}
                    onClick={() => {
                      setSelected({ ...u, sessionId });
                      setShow(false);
                    }}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/identicon/svg?seed=${u.email}`}
                      alt={u.name}
                      className="avatar-sm"
                    />
                    <div>
                      <p className="session-id">{u.name}</p>
                      <small className="session-description">{u.email}</small>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="no-session">No users created yet.</p>
            )}
          </div>

          <button className="settings-button" onClick={() => setShow(true)}>
            Settings
          </button>
          <button className="logout-button" onClick={onLogout}>
            Logout
          </button>
        </aside>

        <main className="admin-main">
          {showSettings ? (
            <SettingsPanel
              onClose={() => setShow(false)}
              refreshUsers={loadUsers}
            />
          ) : selected ? (
            <ChatComponent sessionId={selected.sessionId} user={selected} />
          ) : (
            <div className="no-chat-selected" style={{ flexDirection: 'column' }}>
              <img
                src="https://img.freepik.com/free-vector/feedback-loop-concept-illustration_114360-21826.jpg?w=360"
                alt="Select a user"
                className="empty-illustration"
              />
              <p style={{ marginTop: 16, color: '#666' }}>
                Select a user from the left panel.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;

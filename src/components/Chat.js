// src/components/Chat.js
import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import io from 'socket.io-client';
import axios from 'axios';
import { API } from '../api';
import { Image as ImageIcon, Mic, MicOff } from 'lucide-react';
import './Chat.css';

const socket = io(API, { transports: ['websocket'] });

export default function Chat() {
  const { sessionId } = useParams();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // media & recording state
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState('');
  const [previewURL, setPreview] = useState('');
  const [recording, setRec] = useState(false);
  const mediaRef = useRef(null);
  const chunksRef = useRef([]);
  const endRef = useRef(null);

  // time / date formatters
  const fmt = ts =>
    new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const fmtDate = ts => {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // load history + subscribe
  useEffect(() => {
    if (!sessionId) return;
    socket.emit('joinSession', sessionId);

    // request notification permission once
    if ('Notification' in window && Notification.permission !== 'granted') {
      Notification.requestPermission();
    }

    axios
      .get(`${API}/api/messages/${sessionId}`)
      .then(res => setMessages(res.data))
      .catch(console.error);

    const onMsg = m => {
      if (m.sessionId === sessionId) {
        const msg = { ...m, createdAt: m.createdAt || new Date().toISOString() };
        setMessages(ms => [...ms, msg]);

        // desktop notification for messages not sent by this user
        if (
          'Notification' in window &&
          Notification.permission === 'granted' &&
          m.sender !== 'User'
        ) {
          new Notification(`New message from ${m.sender}`, {
            body: m.text?.slice(0, 100) || 'Sent an attachment',
            icon: m.fileType.startsWith('image/') ? m.fileUrl : undefined,
          });
        }
      }
    };

    socket.on('chatMessage', onMsg);
    return () => socket.off('chatMessage', onMsg);
  }, [sessionId]);

  // auto-scroll
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // pick file
  const pick = (e, prefix) => {
    const f = e.target.files?.[0];
    if (!f || !f.type.startsWith(prefix) || f.size > 100 * 1024) {
      alert(`Choose a ${prefix.startsWith('image') ? 'image' : 'audio'} under 100 KB`);
      return;
    }
    setFile(f);
    setFileType(f.type);
    setPreview(URL.createObjectURL(f));
  };

  // record audio
  const startRec = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      mediaRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = e => e.data.size && chunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 100 * 1024) {
          alert('Recording exceeds 100 KB');
          return;
        }
        setFile(blob);
        setFileType(blob.type);
        setPreview(URL.createObjectURL(blob));
      };
      mr.start();
      setRec(true);
    } catch {
      alert('Microphone permission denied.');
    }
  };
  const stopRec = () => {
    mediaRef.current?.stop();
    mediaRef.current?.stream.getTracks().forEach(t => t.stop());
    setRec(false);
  };

  // send message
  const handleSend = async e => {
    e.preventDefault();
    if (!input.trim() && !file) return;

    let fileUrl = '';
    if (file) {
      const fd = new FormData();
      fd.append(
        'file',
        file instanceof File ? file : new File([file], 'voice.webm', { type: fileType })
      );
      try {
        const res = await axios.post(`${API}/api/upload`, fd);
        fileUrl = res.data.fileUrl;
      } catch {
        return alert('Upload failed.');
      }
    }

    socket.emit('chatMessage', {
      sessionId,
      sender: 'User',
      text: input.trim(),
      fileUrl,
      fileType,
    });

    setInput('');
    setFile(null);
    setFileType('');
    setPreview('');
  };

  // render with avatars outside bubbles
  const renderMessages = () => {
    const elems = [];
    let lastDate = null;

    messages.forEach((m, i) => {
      const day = new Date(m.createdAt).toDateString();
      if (day !== lastDate) {
        elems.push(
          <div key={`sep-${i}`} className="user-chat-date-separator">
            {fmtDate(m.createdAt)}
          </div>
        );
        lastDate = day;
      }

      const isAudio = m.fileUrl && m.fileType.startsWith('audio/');

      if (m.sender === 'User') {
        // user: bubble then avatar
        elems.push(
          <div key={i} className="user-chat-flex-end user-chat-message">
            <div className="user-chat-msg-content">
              {m.fileUrl && m.fileType.startsWith('image/') && (
                <img src={m.fileUrl} alt="upload" className="user-chat-uploaded-image" />
              )}
              {isAudio && (
                <audio controls src={m.fileUrl} className="user-chat-uploaded-audio" />
              )}
              {m.text && <span className="user-chat-message-text">{m.text}</span>}
              <span className="user-chat-msg-time">{fmt(m.createdAt)}</span>
            </div>
            <img
              src="https://cdn-icons-png.flaticon.com/512/8599/8599138.png"
              alt="You"
              className="user-chat-msg-avatar"
            />
          </div>
        );
      } else {
        // admin: avatar then bubble
        elems.push(
          <div key={i} className="user-chat-flex-start user-chat-message">
            <img
              src="https://cdn3.iconfinder.com/data/icons/avatars-flat/33/man_5-512.png"
              alt="Admin"
              className="user-chat-msg-avatar"
            />
            <div className="user-chat-msg-content">
              {m.fileUrl && m.fileType.startsWith('image/') && (
                <img src={m.fileUrl} alt="upload" className="user-chat-uploaded-image" />
              )}
              {isAudio && (
                <audio controls src={m.fileUrl} className="user-chat-uploaded-audio" />
              )}
              {m.text && <span className="user-chat-message-text">{m.text}</span>}
              <span className="user-chat-msg-time">{fmt(m.createdAt)}</span>
            </div>
          </div>
        );
      }
    });

    return elems.length ? elems : <p className="user-chat-empty-msg">No messages yet.</p>;
  };

  return (
    <div className="user-chat-container">
      <header className="user-chat-header">
        <img
          src="https://cdn3.iconfinder.com/data/icons/avatars-flat/33/man_5-512.png"
          alt="You"
          className="user-chat-avatar"
        />
        <h2>Chat Session</h2>
      </header>

      <div className="user-chat-messages">
        {renderMessages()}
        <div ref={endRef} />
      </div>

      {previewURL && (
        <div className="user-chat-preview-wrapper">
          {fileType.startsWith('image/') ? (
            <img src={previewURL} alt="preview" className="user-chat-preview-image" />
          ) : (
            <audio controls src={previewURL} className="user-chat-preview-audio" />
          )}
          <button
            className="user-chat-preview-remove"
            onClick={() => {
              setFile(null);
              setPreview('');
            }}
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSend} className="user-chat-form">
        <label htmlFor="imgPick" className="user-chat-attach-btn">
          <ImageIcon size={20} />
        </label>
        <input
          id="imgPick"
          type="file"
          accept="image/*"
          hidden
          onChange={e => pick(e, 'image/')}
        />

        <label htmlFor="audPick" className="user-chat-attach-btn">
          <MicOff size={20} />
        </label>
        <input
          id="audPick"
          type="file"
          accept="audio/*"
          hidden
          onChange={e => pick(e, 'audio/')}
        />

        <button
          type="button"
          className={`user-chat-attach-btn ${recording ? 'user-chat-recording' : ''}`}
          onClick={recording ? stopRec : startRec}
        >
          <Mic size={20} />
        </button>

        <input
          className="user-chat-input"
          placeholder="Type a message…"
          value={input}
          onChange={e => setInput(e.target.value)}
        />

        <button type="submit" className="user-chat-send-button">
          Send
        </button>
      </form>
    </div>
  );
}

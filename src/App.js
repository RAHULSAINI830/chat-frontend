import React, { useState } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';
import AdminPanel from './components/AdminPanel';
import Chat       from './components/Chat';
import Login      from './components/Login';
import PublicRegister from './components/PublicRegister';

export default function App() {
  // 1. Read the token synchronously from localStorage on first render:
  const [isAuth, setIsAuth] = useState(() => Boolean(localStorage.getItem('token')));

  const handleLogin = () => {
    // after successful login, store token and mark auth
    localStorage.setItem('token', 'dummy‑token');
    setIsAuth(true);
  };

  const handleLogout = () => {
    // clear token and mark not-auth
    localStorage.removeItem('token');
    setIsAuth(false);
  };

  return (
    <Router>
      <Routes>
        {/* Login page */}
        <Route
          path="/login"
          element={
            isAuth
              ? <Navigate to="/" replace />
              : <Login onLogin={handleLogin} />
          }
        />

        {/* Admin panel is protected */}
        <Route
          path="/"
          element={
            isAuth
              ? <AdminPanel onLogout={handleLogout} />
              : <Navigate to="/login" replace />
          }
        />

        {/* Public self‑registration page */}
        <Route path="/register" element={<PublicRegister />} />

        {/* Public chat for users */}
        <Route path="/chat/:sessionId" element={<Chat />} />
      </Routes>
    </Router>
  );
}

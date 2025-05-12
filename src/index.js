import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
// ← import your API base URL
import { API } from './api';

const VAPID_PUBLIC_KEY = process.env.REACT_APP_VAPID_PUBLIC_KEY;

async function registerServiceWorkerAndSubscribe() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn('Push messaging is not supported');
    return;
  }

  try {
    // 1️⃣ Register the SW
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('ServiceWorker registered:', registration);

    // 2️⃣ Request Notification permission
    let permission = Notification.permission;
    if (permission !== 'granted') {
      permission = await Notification.requestPermission();
    }
    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    // 3️⃣ Subscribe to Push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: VAPID_PUBLIC_KEY
    });
    console.log('Push Subscription:', subscription);

    // 4️⃣ Send subscription to backend
    await fetch(`${API}/api/save-subscription`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription)
    });
    console.log('Subscription sent to server');
  } catch (err) {
    console.error('Error during SW registration or push subscription', err);
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// kick off service-worker + push setup after initial load
window.addEventListener('load', registerServiceWorkerAndSubscribe);

// If you want to start measuring performance in your app...
reportWebVitals();

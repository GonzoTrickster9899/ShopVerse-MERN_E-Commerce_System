import React, { useState, useEffect } from 'react';

// ===== TOAST SYSTEM =====
let toastId = 0;
const toastListeners = [];
export const toast = {
  _listeners: toastListeners,
  success: (msg) => { toastId++; toastListeners.forEach(fn => fn({ id: toastId, type: 'success', message: msg })); },
  error: (msg) => { toastId++; toastListeners.forEach(fn => fn({ id: toastId, type: 'error', message: msg })); },
  info: (msg) => { toastId++; toastListeners.forEach(fn => fn({ id: toastId, type: 'info', message: msg })); },
};

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);
  useEffect(() => {
    const handler = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 3000);
    };
    toast._listeners.push(handler);
    return () => { const i = toast._listeners.indexOf(handler); if (i > -1) toast._listeners.splice(i, 1); };
  }, []);
  return (
    <div className="toast-container">
      {toasts.map(t => <div key={t.id} className={`toast toast-${t.type}`}>{t.message}</div>)}
    </div>
  );
}

// ===== UTILITY COMPONENTS =====
export const formatPrice = (price) => `₱${(price || 0).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;

export function Stars({ rating, size = 14 }) {
  return (
    <div className="stars" style={{ fontSize: size }}>
      {[1,2,3,4,5].map(i => <span key={i} style={{ color: i <= rating ? '#ffc107' : '#444' }}>★</span>)}
    </div>
  );
}

export function Spinner() { return <div className="spinner"></div>; }

export function EmptyState({ icon = '📦', title, message, action }) {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      <p>{message}</p>
      {action}
    </div>
  );
}

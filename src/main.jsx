import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// Storage shim — replaces Claude's window.storage with localStorage
window.storage = {
  async get(key) {
    const val = localStorage.getItem(key);
    if (val === null) throw new Error('Key not found');
    return { key, value: val };
  },
  async set(key, value) {
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    return { key, value };
  },
  async delete(key) {
    localStorage.removeItem(key);
    return { key, deleted: true };
  },
  async list(prefix = '') {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k.startsWith(prefix)) keys.push(k);
    }
    return { keys };
  }
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

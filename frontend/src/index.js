import React from 'react';
import ReactDOM from 'react-dom/client';
// Ativar interceptador de fetch PRIMEIRO
import './fetchInterceptor';
import './index.css';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Registrar Service Worker para PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(`${process.env.PUBLIC_URL || ''}/service-worker.js`)
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });
  });
}

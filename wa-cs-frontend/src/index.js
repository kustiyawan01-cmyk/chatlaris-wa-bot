import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// --- GLOBAL FETCH INTERCEPTOR UNTUK KEAMANAN (JWT) ---
const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (!config) config = {};
  if (!config.headers) config.headers = {};
  
  const token = localStorage.getItem('token');
  if (token) {
    // Hindari modifikasi FormData content-type
    if (!(config.body instanceof FormData)) {
      if(!config.headers['Content-Type']) config.headers['Content-Type'] = 'application/json';
    }
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await originalFetch(resource, config);
  
  if (response.status === 401 && resource !== '/api/login') {
    // Sesi berakhir / tidak valid, paksa logout
    if (localStorage.getItem('token')) {
      localStorage.removeItem('token');
      window.location.reload();
    }
  }
  return response;
};
// -----------------------------------------------------

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

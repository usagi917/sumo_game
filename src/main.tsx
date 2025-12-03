import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Import retro styling system
import './styles/fonts.css';
import './styles/retro.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

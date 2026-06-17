import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './style.css';

// Bundle the reading fonts so they're available offline and on every site
// (content script injects @font-face referencing these via web_accessible).
import '@fontsource/lexend/400.css';
import '@fontsource/lexend/700.css';
import '@fontsource/atkinson-hyperlegible/400.css';
import '@fontsource/atkinson-hyperlegible/700.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

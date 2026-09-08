import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { MailProvider } from './context/MailContext.jsx';
import { AssistantProvider } from './context/AssistantContext.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <MailProvider>
          <AssistantProvider>
            <App />
          </AssistantProvider>
        </MailProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
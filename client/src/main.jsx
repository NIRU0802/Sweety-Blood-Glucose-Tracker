import React from 'react';
import ReactDOM from 'react-dom/client';
import { Toaster } from 'react-hot-toast'; // renders the small pop-up messages
import App from './App.jsx';
import { AuthProvider } from './AuthContext.jsx';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <App />
      {/* Placed here (not inside a page) so toasts survive page changes like login -> dashboard */}
      <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
    </AuthProvider>
  </React.StrictMode>
);
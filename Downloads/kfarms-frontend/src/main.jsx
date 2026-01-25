import './index.css'
import App from './App.jsx'
import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth.jsx'

// test logs
const rootElement = document.getElementById("root");

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>              
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
)

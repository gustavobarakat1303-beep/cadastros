import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import App from './App.jsx'
import MetaPixelTracker from './components/MetaPixelTracker.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <MetaPixelTracker />
      <App />
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1f2937', color: '#f9fafb' },
          duration: 4000,
        }}
      />
    </BrowserRouter>
  </React.StrictMode>,
)

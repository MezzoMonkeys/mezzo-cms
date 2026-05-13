import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Toaster } from 'react-hot-toast'
import './index.css'
import App from './App'

const root = document.getElementById('root')
if (!root) throw new Error('Root element not found')

createRoot(root).render(
  <StrictMode>
    <App />
    <Toaster
      position="bottom-right"
      toastOptions={{
        style: {
          background: '#1c1c1c',
          color: '#f7f7f7',
          borderRadius: '8px',
          fontSize: '14px',
        },
        success: {
          iconTheme: { primary: '#f4bf00', secondary: '#1c1c1c' },
        },
      }}
    />
  </StrictMode>,
)

import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { AuthProvider } from './auth.jsx'
import './index.css'

// sin StrictMode: en desarrollo duplicaba cada peticion a n8n y nos comiamos
// la cuota de lecturas por minuto de Google Sheets
createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>,
)

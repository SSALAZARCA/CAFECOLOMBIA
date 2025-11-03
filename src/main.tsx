import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// Importar funciones de prueba en desarrollo
if (import.meta.env.DEV) {
  import('./tests/phytosanitaryAgentTest');
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

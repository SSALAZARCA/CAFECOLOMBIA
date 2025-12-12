import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

<<<<<<< HEAD
// TODO: Restaurar después de que funcione la versión mínima
// Importar funciones de prueba en desarrollo
/*
if (import.meta.env.DEV) {
=======
// Toggle global emergency mode via query or localStorage in dev
(function initEmergencyToggle() {
  try {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('emergency');
    if (fromQuery === '1' || fromQuery === '0') {
      localStorage.setItem('emergency_mode', fromQuery);
      // remove param to avoid reload loops
      params.delete('emergency');
      const url = location.origin + location.pathname + (params.toString() ? `?${params.toString()}` : '') + location.hash;
      history.replaceState(null, '', url);
    }
  } catch {}
})();

// Importar funciones de prueba en desarrollo SOLO si se pasa ?diag=1
const enableDiag = new URLSearchParams(location.search).has('diag');
if (import.meta.env.DEV && enableDiag) {
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
  import('./tests/phytosanitaryAgentTest');
  import('./utils/moduleDiagnostic').then((mod) => {
    try { (mod as any).runModuleDiagnostic?.(); } catch (e) { console.warn('ModuleDiagnostic init failed', e); }
  });
}
*/

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

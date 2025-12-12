import React, { useEffect, useRef, useState } from 'react';

interface Props {
  children: React.ReactNode;
  timeoutMs?: number;
}

/**
 * StartupGuard muestra un fallback visible si, tras un breve tiempo,
 * el contenedor no tiene contenido ni tamaño (pantalla en blanco).
 */
export default function StartupGuard({ children, timeoutMs = 2000 }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [showFallback, setShowFallback] = useState(false);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const el = containerRef.current;
      const hasContent = !!el && !!el.textContent && el.textContent.trim().length > 0;
      const hasSize = !!el && el.offsetHeight > 0;
      setChecked(true);
      if (!hasContent && !hasSize) {
        setShowFallback(true);
      }
    }, timeoutMs);

    const onRestored = () => {
      // Si la conexión vuelve, intentar ocultar el fallback y revalidar
      setShowFallback(false);
      setChecked(false);
    };
    window.addEventListener('connection-restored', onRestored);

    return () => {
      clearTimeout(timer);
      window.removeEventListener('connection-restored', onRestored);
    };
  }, [timeoutMs]);

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  const connection: any = (navigator as any)?.connection || (navigator as any)?.mozConnection || (navigator as any)?.webkitConnection;
  const effectiveType: string | undefined = connection?.effectiveType;

  const handleReload = () => {
    location.reload();
  };

  const handleGoHome = () => {
    try {
      history.replaceState(null, '', '/');
      location.href = '/';
    } catch {
      location.href = '/';
    }
  };

  return (
    <div ref={containerRef} className="min-h-screen relative">
      {children}

      {showFallback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/95">
          <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow">
            <div className="mb-3 text-center">
              <h2 className="text-lg font-semibold text-gray-900">La aplicación no cargó contenido</h2>
              <p className="mt-1 text-sm text-gray-600">
                Detectamos una pantalla en blanco. Puedes recargar o volver al inicio.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <button onClick={handleReload} className="rounded bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700">
                Recargar
              </button>
              <button onClick={handleGoHome} className="rounded bg-gray-100 px-3 py-2 text-gray-900 hover:bg-gray-200">
                Ir al inicio
              </button>
            </div>

            <div className="mt-4 rounded bg-gray-50 p-3 text-xs text-gray-700">
              <div><strong>Online:</strong> {String(isOnline)}</div>
              {effectiveType && <div><strong>Conexión:</strong> {effectiveType}</div>}
              <div><strong>VITE_API_URL:</strong> {(import.meta as any).env?.VITE_API_URL || 'no definido'}</div>
              <div><strong>VITE_API_BASE_URL:</strong> {(import.meta as any).env?.VITE_API_BASE_URL || 'no definido'}</div>
              <div><strong>Diagnóstico:</strong> {(checked ? 'verificado' : 'pendiente')}</div>
            </div>

            <div className="mt-3 text-xs text-gray-500">
              Si el problema persiste: cierra otras pestañas del dev server, haz un refresh duro (Ctrl+Shift+R) o reinicia el cliente en el puerto 5177.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
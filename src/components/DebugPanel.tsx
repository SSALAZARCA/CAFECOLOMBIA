import React, { useEffect, useState } from 'react';
import { getModuleDiagState, clearModuleDiagErrors } from '@/utils/moduleDiagnostic';

function useDiag() {
  const [state, setState] = useState<any>(getModuleDiagState());
  useEffect(() => {
    const id = setInterval(() => {
      setState(getModuleDiagState());
    }, 1000);
    return () => clearInterval(id);
  }, []);
  return state;
}

export default function DebugPanel() {
  const diag = useDiag();
  const [expanded, setExpanded] = useState(true);

  const networkCount = (diag.networkErrors || []).length;
  const recentErr = diag.networkErrors?.slice(-5) || [];

  return (
    <div className="fixed bottom-2 right-2 z-50 w-full max-w-lg">
      <div className="rounded-lg border border-gray-200 bg-white shadow">
        <div className="flex items-center justify-between p-3">
          <div className="text-sm font-semibold">Diagnóstico</div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-1 rounded ${diag.online ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{diag.online ? 'Online' : 'Offline'}</span>
            <button onClick={() => setExpanded(!expanded)} className="text-xs text-gray-600 hover:text-gray-800">{expanded ? 'Ocultar' : 'Mostrar'}</button>
          </div>
        </div>
        {expanded && (
          <div className="p-3 text-xs text-gray-800 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded bg-gray-50 p-2">
                <div><strong>Errores de red:</strong> {networkCount}</div>
                {recentErr.length > 0 && (
                  <ul className="mt-1 list-disc pl-4">
                    {recentErr.map((e: any, idx: number) => (
                      <li key={idx}>{e.type}: {String(e.message).slice(0, 80)}</li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded bg-gray-50 p-2">
                <div><strong>Env:</strong></div>
                <div>API_URL: {diag.env?.VITE_API_URL || 'no definido'}</div>
                <div>API_BASE_URL: {diag.env?.VITE_API_BASE_URL || 'no definido'}</div>
                <div>DEV: {String(diag.env?.DEV)}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button onClick={() => location.reload()} className="rounded bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700">Recargar</button>
              <button onClick={() => clearModuleDiagErrors()} className="rounded bg-gray-100 px-3 py-2 text-gray-900 hover:bg-gray-200">Limpiar errores</button>
              <button onClick={() => { localStorage.setItem('emergency_mode', '1'); location.reload(); }} className="rounded bg-orange-100 px-3 py-2 text-orange-900 hover:bg-orange-200">Modo Emergencia</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React from 'react';
import DebugPanel from '@/components/DebugPanel';

interface BasicTileProps {
  title: string;
  children: React.ReactNode;
}

function BasicTile({ title, children }: BasicTileProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-sm font-semibold text-gray-800">{title}</h3>
      <div className="text-sm text-gray-700">
        {children}
      </div>
    </div>
  );
}

function getLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setLocal<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

export default function EmergencyFallback() {
  const farmInfo = getLocal('emergency_farm', { nombre: 'Mi Finca', ubicacion: 'N/A', hectareas: 1 });
  const insumos = getLocal('emergency_insumos', [
    { nombre: 'Fertilizante A', cantidad: 10, unidad: 'kg' },
    { nombre: 'Fungicida B', cantidad: 2, unidad: 'L' },
  ]);
  const settings = getLocal('emergency_settings', { idioma: 'es', tema: 'claro' });

  const addInsumo = () => {
    const nuevo = { nombre: `Insumo ${insumos.length + 1}`, cantidad: 1, unidad: 'unidad' };
    const actualizado = [...insumos, nuevo];
    setLocal('emergency_insumos', actualizado);
    location.reload();
  };

  const toggleTema = () => {
    const nuevo = settings.tema === 'claro' ? 'oscuro' : 'claro';
    setLocal('emergency_settings', { ...settings, tema: nuevo });
    document.documentElement.classList.toggle('dark', nuevo === 'oscuro');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white p-4 shadow-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <h1 className="text-lg font-semibold">Modo Emergencia - CaféColombia</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => location.reload()} className="rounded bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700">Recargar</button>
            <button onClick={toggleTema} className="rounded bg-gray-100 px-3 py-2 text-gray-900 hover:bg-gray-200">Tema: {settings.tema}</button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-4 grid grid-cols-1 gap-4 md:grid-cols-3">
        <BasicTile title="Gestión de Finca">
          <div><strong>Nombre:</strong> {farmInfo.nombre}</div>
          <div><strong>Ubicación:</strong> {farmInfo.ubicacion}</div>
          <div><strong>Hectáreas:</strong> {farmInfo.hectareas}</div>
        </BasicTile>

        <BasicTile title="Control de Insumos">
          <ul className="list-disc pl-4">
            {insumos.map((i: any, idx: number) => (
              <li key={idx}>{i.nombre} — {i.cantidad} {i.unidad}</li>
            ))}
          </ul>
          <button onClick={addInsumo} className="mt-2 rounded bg-emerald-600 px-3 py-2 text-white hover:bg-emerald-700">Agregar Insumo</button>
        </BasicTile>

        <BasicTile title="Configuración Básica">
          <div><strong>Idioma:</strong> {settings.idioma}</div>
          <div><strong>Tema:</strong> {settings.tema}</div>
        </BasicTile>

        <BasicTile title="Estado">
          <div><strong>Online:</strong> {String(navigator.onLine)}</div>
          <div><strong>VITE_API_URL:</strong> {(import.meta as any).env?.VITE_API_URL || 'no definido'}</div>
          <div><strong>Última actualización:</strong> {new Date().toLocaleString()}</div>
        </BasicTile>
      </main>

      {/* Debug visible */}
      <DebugPanel />
    </div>
  );
}

import React, { useEffect, useState } from 'react';

interface BasicStats {
  lots: number;
  inventoryItems: number;
  pendingTasks: number;
}

function readBasicStats(): BasicStats {
  try {
    const lots = JSON.parse(localStorage.getItem('lots') || '[]');
    const inventory = JSON.parse(localStorage.getItem('inventory') || '[]');
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    return {
      lots: Array.isArray(lots) ? lots.length : 0,
      inventoryItems: Array.isArray(inventory) ? inventory.length : 0,
      pendingTasks: Array.isArray(tasks) ? tasks.filter((t: any) => t?.status !== 'Completada').length : 0,
    };
  } catch {
    return { lots: 0, inventoryItems: 0, pendingTasks: 0 };
  }
}

export default function HomeFallback() {
  const [stats, setStats] = useState<BasicStats>({ lots: 0, inventoryItems: 0, pendingTasks: 0 });

  useEffect(() => {
    setStats(readBasicStats());
  }, []);

  const quickAdd = (key: string, item: any) => {
    try {
      const arr = JSON.parse(localStorage.getItem(key) || '[]');
      arr.push({ ...item, id: Date.now().toString(), createdAt: new Date().toISOString() });
      localStorage.setItem(key, JSON.stringify(arr));
      setStats(readBasicStats());
    } catch { }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h1 className="text-xl font-bold text-gray-900">Inicio básico</h1>
          <p className="text-sm text-gray-600">Cargando versión ligera por problemas de red</p>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="p-3 bg-gray-50 rounded"><p className="text-xs text-gray-500">Lotes</p><p className="text-lg font-semibold">{stats.lots}</p></div>
            <div className="p-3 bg-gray-50 rounded"><p className="text-xs text-gray-500">Insumos</p><p className="text-lg font-semibold">{stats.inventoryItems}</p></div>
            <div className="p-3 bg-gray-50 rounded"><p className="text-xs text-gray-500">Tareas</p><p className="text-lg font-semibold">{stats.pendingTasks}</p></div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button className="p-3 border rounded hover:bg-emerald-50" onClick={() => quickAdd('harvests', { quantity: 0 })}>Registrar cosecha</button>
            <button className="p-3 border rounded hover:bg-emerald-50" onClick={() => quickAdd('inventory', { inputId: 'insumo', quantity: 1, unit: 'kg' })}>Agregar insumo</button>
            <button className="p-3 border rounded hover:bg-emerald-50" onClick={() => quickAdd('tasks', { title: 'Nueva tarea', status: 'Pendiente', dueDate: new Date().toISOString() })}>Crear tarea</button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-sm font-semibold text-gray-900 mb-2">Estado</h2>
          <p className="text-xs text-gray-600">Online: {String(navigator.onLine)}</p>
          <p className="text-xs text-gray-600">API: {(import.meta as any).env?.VITE_API_URL || 'no definido'}</p>
          <div className="mt-3 flex gap-2">
            <button className="px-3 py-1 text-xs border rounded" onClick={() => location.reload()}>Reintentar carga completa</button>
            <button className="px-3 py-1 text-xs border rounded" onClick={() => localStorage.setItem('emergency_mode', '1')}>Activar modo emergencia</button>
          </div>
        </div>
      </div>
    </div>
  );
}

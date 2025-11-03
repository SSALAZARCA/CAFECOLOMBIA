import React from 'react';
import { Calendar, User, Activity, Sprout, Scissors, Bug, Coffee, Droplets } from 'lucide-react';

interface HistorialEntry {
  id: string;
  fecha: string;
  tipo: 'siembra' | 'poda' | 'fertilizacion' | 'fumigacion' | 'cosecha' | 'mantenimiento' | 'observacion';
  descripcion: string;
  usuario?: string;
  detalles?: string;
}

interface LoteHistorialProps {
  loteId: string;
  historial: HistorialEntry[];
}

export const LoteHistorial: React.FC<LoteHistorialProps> = ({ loteId, historial }) => {
  const getActivityIcon = (tipo: string) => {
    switch (tipo) {
      case 'siembra':
        return <Sprout className="w-4 h-4" />;
      case 'poda':
        return <Scissors className="w-4 h-4" />;
      case 'fertilizacion':
        return <Droplets className="w-4 h-4" />;
      case 'fumigacion':
        return <Bug className="w-4 h-4" />;
      case 'cosecha':
        return <Coffee className="w-4 h-4" />;
      case 'mantenimiento':
        return <Activity className="w-4 h-4" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColor = (tipo: string) => {
    switch (tipo) {
      case 'siembra':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'poda':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'fertilizacion':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'fumigacion':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'cosecha':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'mantenimiento':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getActivityLabel = (tipo: string) => {
    switch (tipo) {
      case 'siembra':
        return 'Siembra';
      case 'poda':
        return 'Poda';
      case 'fertilizacion':
        return 'Fertilización';
      case 'fumigacion':
        return 'Fumigación';
      case 'cosecha':
        return 'Cosecha';
      case 'mantenimiento':
        return 'Mantenimiento';
      case 'observacion':
        return 'Observación';
      default:
        return 'Actividad';
    }
  };

  // Ordenar historial por fecha (más reciente primero)
  const sortedHistorial = [...historial].sort((a, b) => 
    new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  if (historial.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay actividades registradas</p>
        <p className="text-sm text-gray-400 mt-2">
          Las actividades aparecerán aquí cuando se registren
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-gray-900 flex items-center gap-2">
        <Calendar className="w-4 h-4" />
        Historial de Actividades
      </h3>

      <div className="space-y-3">
        {sortedHistorial.map((entry, index) => (
          <div
            key={entry.id}
            className="relative flex gap-4 p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow"
          >
            {/* Timeline line */}
            {index < sortedHistorial.length - 1 && (
              <div className="absolute left-6 top-12 w-0.5 h-8 bg-gray-200" />
            )}

            {/* Activity icon */}
            <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getActivityColor(entry.tipo)}`}>
              {getActivityIcon(entry.tipo)}
            </div>

            {/* Activity content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900">
                    {getActivityLabel(entry.tipo)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(entry.fecha).toLocaleDateString('es-CO', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                {entry.usuario && (
                  <div className="flex items-center gap-1 text-xs text-gray-500">
                    <User className="w-3 h-3" />
                    {entry.usuario}
                  </div>
                )}
              </div>

              <p className="text-sm text-gray-700 mb-2">
                {entry.descripcion}
              </p>

              {entry.detalles && (
                <div className="bg-gray-50 rounded-md p-3 text-xs text-gray-600">
                  <p className="font-medium mb-1">Detalles:</p>
                  <p>{entry.detalles}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Estadísticas del historial */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-3">Resumen de Actividades</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {['siembra', 'poda', 'fertilizacion', 'cosecha'].map((tipo) => {
            const count = historial.filter(h => h.tipo === tipo).length;
            return (
              <div key={tipo} className="text-center">
                <div className={`w-8 h-8 rounded-full mx-auto mb-1 flex items-center justify-center ${getActivityColor(tipo)}`}>
                  {getActivityIcon(tipo)}
                </div>
                <p className="font-medium text-gray-900">{count}</p>
                <p className="text-xs text-gray-500">{getActivityLabel(tipo)}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
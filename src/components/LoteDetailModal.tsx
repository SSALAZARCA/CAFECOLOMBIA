import React, { useState } from 'react';
import { X, MapPin, Calendar, TreePine, Ruler, Mountain, Compass, Layers, FileText, BarChart3, Activity } from 'lucide-react';
import { LatLngExpression } from 'leaflet';
import { LoteHistorial } from './LoteHistorial';
import { LoteEstadisticas } from './LoteEstadisticas';

interface Lote {
  id: string;
  nombre: string;
  variedad: string;
  fechaSiembra: string;
  area: number;
  numeroArboles: number;
  estado: 'crecimiento' | 'produccion' | 'zoca' | 'renovacion';
  coordenadas?: LatLngExpression[];
  densidad?: number;
  altitud?: number;
  pendiente?: string;
  exposicion?: string;
  tipoSuelo?: string;
  observaciones?: string;
}

interface LoteDetailModalProps {
  lote: Lote | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (lote: Lote) => void;
  onGeoreference?: (loteId: string) => void;
}

export const LoteDetailModal: React.FC<LoteDetailModalProps> = ({
  lote,
  isOpen,
  onClose,
  onEdit,
  onGeoreference,
}) => {
  const [activeTab, setActiveTab] = useState<'info' | 'historial' | 'estadisticas'>('info');

  if (!isOpen || !lote) return null;

  // Datos mock para historial
  const historialMock = [
    {
      id: '1',
      fecha: '2024-01-15T10:30:00',
      tipo: 'siembra' as const,
      descripcion: 'Siembra inicial del lote con variedad ' + lote.variedad,
      usuario: 'Juan Pérez',
      detalles: 'Se plantaron ' + lote.numeroArboles + ' árboles con una densidad de ' + (lote.densidad || 5000) + ' árboles por hectárea'
    },
    {
      id: '2',
      fecha: '2024-03-10T14:20:00',
      tipo: 'fertilizacion' as const,
      descripcion: 'Aplicación de fertilizante orgánico',
      usuario: 'María García',
      detalles: 'Fertilizante orgánico aplicado en toda el área del lote'
    },
    {
      id: '3',
      fecha: '2024-06-05T08:15:00',
      tipo: 'poda' as const,
      descripcion: 'Poda de formación y mantenimiento',
      usuario: 'Carlos López',
      detalles: 'Poda realizada para mejorar la estructura de los árboles y aumentar la productividad'
    }
  ];

  // Datos mock para estadísticas de producción
  const produccionMock = [
    {
      año: 2023,
      cosechaKg: 1200,
      precioPromedio: 8500,
      calidad: 'especial' as const,
      observaciones: 'Excelente calidad de grano'
    },
    {
      año: 2022,
      cosechaKg: 980,
      precioPromedio: 7800,
      calidad: 'comercial' as const,
      observaciones: 'Año con menor precipitación'
    },
    {
      año: 2021,
      cosechaKg: 1350,
      precioPromedio: 9200,
      calidad: 'premium' as const,
      observaciones: 'Mejor cosecha registrada'
    }
  ];

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'crecimiento':
        return 'bg-blue-100 text-blue-800';
      case 'produccion':
        return 'bg-green-100 text-green-800';
      case 'zoca':
        return 'bg-yellow-100 text-yellow-800';
      case 'renovacion':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoText = (estado: string) => {
    switch (estado) {
      case 'crecimiento':
        return 'En Crecimiento';
      case 'produccion':
        return 'En Producción';
      case 'zoca':
        return 'Zoca';
      case 'renovacion':
        return 'Renovación';
      default:
        return estado;
    }
  };

  const hasCoordinates = lote.coordenadas && lote.coordenadas.length > 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{lote.nombre}</h2>
            <p className="text-sm text-gray-500">Variedad: {lote.variedad}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Navigation */}
        <div className="border-b">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('info')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'info'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Información
              </div>
            </button>
            <button
              onClick={() => setActiveTab('historial')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'historial'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Historial
              </div>
            </button>
            <button
              onClick={() => setActiveTab('estadisticas')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'estadisticas'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Estadísticas
              </div>
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === 'info' && (
            <div className="space-y-6">
              {/* Estado y Georreferenciación */}
              <div className="flex items-center justify-between">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getEstadoColor(lote.estado)}`}>
                  {getEstadoText(lote.estado)}
                </span>
                
                <div className="flex items-center gap-2">
                  {hasCoordinates ? (
                    <span className="text-xs text-green-600 bg-green-100 px-3 py-1 rounded-full flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      Georreferenciado
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                        Sin coordenadas
                      </span>
                      {onGeoreference && (
                        <button
                          onClick={() => onGeoreference(lote.id)}
                          className="text-xs bg-green-600 text-white px-3 py-1 rounded-full hover:bg-green-700 transition-colors flex items-center gap-1"
                        >
                          <MapPin className="w-3 h-3" />
                          Georreferenciar
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Información Básica */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <TreePine className="w-4 h-4" />
                    Información del Cultivo
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Fecha de Siembra</p>
                        <p className="font-medium">{new Date(lote.fechaSiembra).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <Ruler className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Área</p>
                        <p className="font-medium">{lote.area} hectáreas</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <TreePine className="w-4 h-4 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Número de Árboles</p>
                        <p className="font-medium">{lote.numeroArboles.toLocaleString()}</p>
                      </div>
                    </div>

                    {lote.densidad && (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-400 rounded-full" />
                        <div>
                          <p className="text-sm text-gray-500">Densidad</p>
                          <p className="font-medium">{lote.densidad} árboles/ha</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Mountain className="w-4 h-4" />
                    Características del Terreno
                  </h3>
                  
                  <div className="space-y-3">
                    {lote.altitud && (
                      <div className="flex items-center gap-3">
                        <Mountain className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Altitud</p>
                          <p className="font-medium">{lote.altitud} msnm</p>
                        </div>
                      </div>
                    )}

                    {lote.pendiente && (
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-gray-400 rounded-full" />
                        <div>
                          <p className="text-sm text-gray-500">Pendiente</p>
                          <p className="font-medium">{lote.pendiente}</p>
                        </div>
                      </div>
                    )}

                    {lote.exposicion && (
                      <div className="flex items-center gap-3">
                        <Compass className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Exposición</p>
                          <p className="font-medium">{lote.exposicion}</p>
                        </div>
                      </div>
                    )}

                    {lote.tipoSuelo && (
                      <div className="flex items-center gap-3">
                        <Layers className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Tipo de Suelo</p>
                          <p className="font-medium">{lote.tipoSuelo}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              {lote.observaciones && (
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Observaciones
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700">{lote.observaciones}</p>
                  </div>
                </div>
              )}

              {/* Estadísticas Calculadas */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="font-medium text-blue-900 mb-3">Estadísticas Calculadas</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-blue-600">Densidad Real</p>
                    <p className="font-medium text-blue-900">
                      {Math.round(lote.numeroArboles / lote.area)} árboles/ha
                    </p>
                  </div>
                  <div>
                    <p className="text-blue-600">Edad del Cultivo</p>
                    <p className="font-medium text-blue-900">
                      {Math.floor((Date.now() - new Date(lote.fechaSiembra).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} años
                    </p>
                  </div>
                  {hasCoordinates && (
                    <div>
                      <p className="text-blue-600">Coordenadas</p>
                      <p className="font-medium text-blue-900">
                        {lote.coordenadas!.length} puntos
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'historial' && (
            <LoteHistorial actividades={historialMock} />
          )}

          {activeTab === 'estadisticas' && (
            <LoteEstadisticas 
              lote={lote} 
              produccion={produccionMock} 
            />
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cerrar
          </button>
          {onEdit && (
            <button
              onClick={() => onEdit(lote)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Editar Lote
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
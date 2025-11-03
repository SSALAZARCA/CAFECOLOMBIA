import React from 'react';
import { BarChart3, TrendingUp, Coffee, Calendar, Target, Award } from 'lucide-react';

interface ProduccionData {
  año: number;
  cosechaKg: number;
  precioPromedio: number;
  calidad: 'premium' | 'especial' | 'comercial';
  observaciones?: string;
}

interface LoteEstadisticasProps {
  loteId: string;
  area: number;
  numeroArboles: number;
  fechaSiembra: string;
  produccion: ProduccionData[];
}

export const LoteEstadisticas: React.FC<LoteEstadisticasProps> = ({
  loteId,
  area,
  numeroArboles,
  fechaSiembra,
  produccion
}) => {
  // Calcular estadísticas
  const edadLote = Math.floor((Date.now() - new Date(fechaSiembra).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  const densidadReal = Math.round(numeroArboles / area);
  
  const totalProduccion = produccion.reduce((sum, p) => sum + p.cosechaKg, 0);
  const promedioAnual = produccion.length > 0 ? totalProduccion / produccion.length : 0;
  const productividadHa = area > 0 ? promedioAnual / area : 0;
  const productividadArbol = numeroArboles > 0 ? promedioAnual / numeroArboles : 0;

  const mejorAño = produccion.reduce((best, current) => 
    current.cosechaKg > best.cosechaKg ? current : best, 
    produccion[0] || { año: 0, cosechaKg: 0, precioPromedio: 0, calidad: 'comercial' as const }
  );

  const ingresoTotal = produccion.reduce((sum, p) => sum + (p.cosechaKg * p.precioPromedio), 0);
  const ingresoPromedio = produccion.length > 0 ? ingresoTotal / produccion.length : 0;

  const getCalidadColor = (calidad: string) => {
    switch (calidad) {
      case 'premium':
        return 'bg-yellow-100 text-yellow-800';
      case 'especial':
        return 'bg-green-100 text-green-800';
      case 'comercial':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCalidadLabel = (calidad: string) => {
    switch (calidad) {
      case 'premium':
        return 'Premium';
      case 'especial':
        return 'Especial';
      case 'comercial':
        return 'Comercial';
      default:
        return calidad;
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="font-medium text-gray-900 flex items-center gap-2">
        <BarChart3 className="w-4 h-4" />
        Estadísticas de Producción
      </h3>

      {/* Métricas Principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Edad del Lote</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{edadLote}</p>
          <p className="text-xs text-blue-600">años</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Densidad</span>
          </div>
          <p className="text-2xl font-bold text-green-900">{densidadReal}</p>
          <p className="text-xs text-green-600">árboles/ha</p>
        </div>

        <div className="bg-amber-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Coffee className="w-4 h-4 text-amber-600" />
            <span className="text-sm font-medium text-amber-900">Promedio Anual</span>
          </div>
          <p className="text-2xl font-bold text-amber-900">{promedioAnual.toFixed(0)}</p>
          <p className="text-xs text-amber-600">kg/año</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Productividad</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{productividadHa.toFixed(0)}</p>
          <p className="text-xs text-purple-600">kg/ha/año</p>
        </div>
      </div>

      {/* Estadísticas Detalladas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Productividad */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Indicadores de Productividad</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Kg por hectárea/año</span>
              <span className="font-medium">{productividadHa.toFixed(0)} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Kg por árbol/año</span>
              <span className="font-medium">{productividadArbol.toFixed(2)} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Total producido</span>
              <span className="font-medium">{totalProduccion.toFixed(0)} kg</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Años productivos</span>
              <span className="font-medium">{produccion.length} años</span>
            </div>
          </div>
        </div>

        {/* Ingresos */}
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">Análisis Económico</h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ingreso total</span>
              <span className="font-medium">${ingresoTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ingreso promedio/año</span>
              <span className="font-medium">${ingresoPromedio.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Ingreso por hectárea</span>
              <span className="font-medium">${(ingresoPromedio / area).toLocaleString()}</span>
            </div>
            {mejorAño.año > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mejor año</span>
                <span className="font-medium">{mejorAño.año} ({mejorAño.cosechaKg} kg)</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Historial de Producción */}
      {produccion.length > 0 && (
        <div className="bg-white border rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <Award className="w-4 h-4" />
            Historial de Cosechas
          </h4>
          <div className="space-y-3">
            {produccion.map((prod, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{prod.año}</p>
                    <p className="text-xs text-gray-500">Año</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">{prod.cosechaKg} kg</p>
                    <p className="text-xs text-gray-500">Cosecha</p>
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900">${prod.precioPromedio.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">Precio/kg</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCalidadColor(prod.calidad)}`}>
                    {getCalidadLabel(prod.calidad)}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${(prod.cosechaKg * prod.precioPromedio).toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje si no hay datos de producción */}
      {produccion.length === 0 && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No hay datos de producción registrados</p>
          <p className="text-sm text-gray-400 mt-2">
            Los datos de cosecha aparecerán aquí cuando se registren
          </p>
        </div>
      )}
    </div>
  );
};
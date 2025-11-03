import { useState } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  TrendingDown, 
  TrendingUp,
  Package,
  DollarSign,
  BarChart3,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface DashboardBodegaProps {
  insumos: any[];
}

export default function DashboardBodega({ insumos }: DashboardBodegaProps) {
  const [selectedPeriod, setSelectedPeriod] = useState('30');

  // Cálculos de estadísticas
  const totalValue = insumos.reduce((sum, insumo) => sum + insumo.totalCost, 0);
  const lowStockItems = insumos.filter(insumo => insumo.stockStatus === 'BAJO' || insumo.stockStatus === 'AGOTADO');
  const expiringItems = insumos.filter(insumo => insumo.daysToExpiry <= 30);
  const expiredItems = insumos.filter(insumo => insumo.daysToExpiry < 0);
  
  // Estadísticas por tipo
  const typeStats = insumos.reduce((acc, insumo) => {
    if (!acc[insumo.type]) {
      acc[insumo.type] = { count: 0, value: 0 };
    }
    acc[insumo.type].count++;
    acc[insumo.type].value += insumo.totalCost;
    return acc;
  }, {} as Record<string, { count: number; value: number }>);

  // Alertas críticas
  const criticalAlerts = [
    ...expiredItems.map(item => ({
      id: `expired-${item.id}`,
      type: 'VENCIDO',
      severity: 'high',
      message: `${item.name} ha vencido`,
      date: item.expiryDate,
      item: item.name
    })),
    ...expiringItems.filter(item => item.daysToExpiry <= 7).map(item => ({
      id: `expiring-${item.id}`,
      type: 'POR_VENCER',
      severity: 'medium',
      message: `${item.name} vence en ${item.daysToExpiry} días`,
      date: item.expiryDate,
      item: item.name
    })),
    ...lowStockItems.map(item => ({
      id: `stock-${item.id}`,
      type: 'STOCK_BAJO',
      severity: item.stockStatus === 'AGOTADO' ? 'high' : 'medium',
      message: `${item.name} tiene stock ${item.stockStatus.toLowerCase()}`,
      quantity: item.quantity,
      item: item.name
    }))
  ];

  const getAlertIcon = (severity: string) => {
    switch (severity) {
      case 'high':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'medium':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
  };

  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'high':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'medium':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-green-50 border-green-200 text-green-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen Ejecutivo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Insumos</p>
              <p className="text-2xl font-bold text-gray-900">{insumos.length}</p>
              <p className="text-xs text-gray-500 mt-1">Productos activos</p>
            </div>
            <Package className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor Total</p>
              <p className="text-2xl font-bold text-gray-900">
                ${totalValue.toLocaleString()}
              </p>
              <p className="text-xs text-green-600 mt-1 flex items-center">
                <TrendingUp className="w-3 h-3 mr-1" />
                Inventario valorizado
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Alertas Críticas</p>
              <p className="text-2xl font-bold text-red-600">{criticalAlerts.filter(a => a.severity === 'high').length}</p>
              <p className="text-xs text-red-600 mt-1">Requieren atención</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Stock Bajo</p>
              <p className="text-2xl font-bold text-orange-600">{lowStockItems.length}</p>
              <p className="text-xs text-orange-600 mt-1">Necesitan reposición</p>
            </div>
            <TrendingDown className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Alertas Críticas */}
      {criticalAlerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Alertas Críticas ({criticalAlerts.length})
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {criticalAlerts.slice(0, 5).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border flex items-start gap-3 ${getAlertColor(alert.severity)}`}
                >
                  {getAlertIcon(alert.severity)}
                  <div className="flex-1">
                    <p className="font-medium">{alert.message}</p>
                    <p className="text-sm opacity-75 mt-1">
                      {alert.type === 'STOCK_BAJO' && `Cantidad actual: ${alert.quantity}`}
                      {(alert.type === 'VENCIDO' || alert.type === 'POR_VENCER') && 
                        `Fecha: ${new Date(alert.date).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    alert.severity === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {alert.type.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {criticalAlerts.length > 5 && (
                <div className="text-center pt-2">
                  <button 
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    onClick={() => alert('Funcionalidad de ver todas las alertas - próximamente')}
                  >
                    Ver todas las alertas ({criticalAlerts.length - 5} más)
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Distribución por Tipo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              Distribución por Tipo
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {Object.entries(typeStats).map(([type, stats]) => {
                const percentage = (stats.value / totalValue) * 100;
                return (
                  <div key={type} className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-700">
                        {type.replace('_', ' ')}
                      </span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900">
                          {stats.count} items
                        </span>
                        <div className="text-xs text-gray-500">
                          ${stats.value.toLocaleString()}
                        </div>
                      </div>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500">
                      {percentage.toFixed(1)}% del valor total
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Próximos Vencimientos */}
        <div className="bg-white rounded-lg shadow-sm border">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-500" />
              Próximos Vencimientos
            </h3>
          </div>
          <div className="p-6">
            <div className="space-y-3">
              {insumos
                .filter(insumo => insumo.daysToExpiry > 0 && insumo.daysToExpiry <= 90)
                .sort((a, b) => a.daysToExpiry - b.daysToExpiry)
                .slice(0, 6)
                .map((insumo) => (
                  <div key={insumo.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{insumo.name}</p>
                      <p className="text-sm text-gray-600">{insumo.brand}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-semibold ${
                        insumo.daysToExpiry <= 7 ? 'text-red-600' :
                        insumo.daysToExpiry <= 30 ? 'text-orange-600' : 'text-gray-600'
                      }`}>
                        {insumo.daysToExpiry} días
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(insumo.expiryDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              {insumos.filter(insumo => insumo.daysToExpiry > 0 && insumo.daysToExpiry <= 90).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                  <p>No hay productos próximos a vencer</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recomendaciones de Gestión</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lowStockItems.length > 0 && (
              <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <h4 className="font-medium text-orange-800 mb-2">Reposición de Stock</h4>
                <p className="text-sm text-orange-700">
                  {lowStockItems.length} productos necesitan reposición urgente.
                </p>
                <button 
                  className="mt-2 text-orange-600 hover:text-orange-800 text-sm font-medium"
                  onClick={() => alert('Lista de reposición - funcionalidad próximamente')}
                >
                  Ver lista de reposición →
                </button>
              </div>
            )}
            
            {expiringItems.length > 0 && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <h4 className="font-medium text-yellow-800 mb-2">Uso Prioritario</h4>
                <p className="text-sm text-yellow-700">
                  {expiringItems.length} productos deben usarse pronto para evitar pérdidas.
                </p>
                <button 
                  className="mt-2 text-yellow-600 hover:text-yellow-800 text-sm font-medium"
                  onClick={() => alert('Planificar aplicaciones - funcionalidad próximamente')}
                >
                  Planificar aplicaciones →
                </button>
              </div>
            )}
            
            {criticalAlerts.length === 0 && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <h4 className="font-medium text-green-800 mb-2">Estado Óptimo</h4>
                <p className="text-sm text-green-700">
                  El inventario está en buen estado. Continúa con el monitoreo regular.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
import { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Calendar, 
  Clock, 
  CheckCircle, 
  XCircle,
  MapPin,
  Leaf,
  Info
} from 'lucide-react';

interface GracePeriodAlert {
  id: string;
  loteId: string;
  loteName: string;
  insumoName: string;
  applicationDate: string;
  harvestSafeDate: string;
  gracePeriodDays: number;
  daysRemaining: number;
  status: 'SAFE' | 'WARNING' | 'DANGER' | 'EXPIRED';
  responsiblePerson: string;
}

interface GracePeriodAlertsProps {
  usageRecords?: any[];
}

// Mock data para demostración
const mockGracePeriodAlerts: GracePeriodAlert[] = [
  {
    id: '1',
    loteId: '1',
    loteName: 'Lote A - Caturra',
    insumoName: 'Roundup (Glifosato)',
    applicationDate: '2024-01-15',
    harvestSafeDate: '2024-02-05',
    gracePeriodDays: 21,
    daysRemaining: 5,
    status: 'WARNING',
    responsiblePerson: 'Juan Pérez'
  },
  {
    id: '2',
    loteId: '2',
    loteName: 'Lote B - Colombia',
    insumoName: 'Fungicida Sistémico',
    applicationDate: '2024-01-20',
    harvestSafeDate: '2024-02-03',
    gracePeriodDays: 14,
    daysRemaining: -2,
    status: 'EXPIRED',
    responsiblePerson: 'María García'
  },
  {
    id: '3',
    loteId: '3',
    loteName: 'Lote C - Castillo',
    insumoName: 'Insecticida Orgánico',
    applicationDate: '2024-01-25',
    harvestSafeDate: '2024-02-01',
    gracePeriodDays: 7,
    daysRemaining: 15,
    status: 'SAFE',
    responsiblePerson: 'Carlos López'
  },
  {
    id: '4',
    loteId: '1',
    loteName: 'Lote A - Caturra',
    insumoName: 'Herbicida Selectivo',
    applicationDate: '2024-01-28',
    harvestSafeDate: '2024-02-11',
    gracePeriodDays: 14,
    daysRemaining: 2,
    status: 'DANGER',
    responsiblePerson: 'Juan Pérez'
  }
];

export default function GracePeriodAlerts({ usageRecords = [] }: GracePeriodAlertsProps) {
  const [alerts, setAlerts] = useState<GracePeriodAlert[]>(mockGracePeriodAlerts);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedLote, setSelectedLote] = useState<string>('ALL');

  // Calcular estadísticas
  const safeCount = alerts.filter(alert => alert.status === 'SAFE').length;
  const warningCount = alerts.filter(alert => alert.status === 'WARNING').length;
  const dangerCount = alerts.filter(alert => alert.status === 'DANGER').length;
  const expiredCount = alerts.filter(alert => alert.status === 'EXPIRED').length;

  // Filtrar alertas
  const filteredAlerts = alerts.filter(alert => {
    const statusMatch = selectedStatus === 'ALL' || alert.status === selectedStatus;
    const loteMatch = selectedLote === 'ALL' || alert.loteId === selectedLote;
    return statusMatch && loteMatch;
  });

  // Obtener lotes únicos
  const uniqueLotes = Array.from(new Set(alerts.map(alert => ({ id: alert.loteId, name: alert.loteName }))))
    .reduce((acc, current) => {
      const existing = acc.find(item => item.id === current.id);
      if (!existing) {
        acc.push(current);
      }
      return acc;
    }, [] as { id: string; name: string }[]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SAFE':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'WARNING':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'DANGER':
        return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'EXPIRED':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Info className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SAFE':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'WARNING':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      case 'DANGER':
        return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'EXPIRED':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SAFE':
        return 'bg-green-100 text-green-800';
      case 'WARNING':
        return 'bg-yellow-100 text-yellow-800';
      case 'DANGER':
        return 'bg-orange-100 text-orange-800';
      case 'EXPIRED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SAFE':
        return 'Seguro';
      case 'WARNING':
        return 'Precaución';
      case 'DANGER':
        return 'Peligro';
      case 'EXPIRED':
        return 'Vencido';
      default:
        return 'Desconocido';
    }
  };

  return (
    <div className="space-y-6">
      {/* Resumen de Estados */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Seguros</p>
              <p className="text-2xl font-bold text-green-600">{safeCount}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Precaución</p>
              <p className="text-2xl font-bold text-yellow-600">{warningCount}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Peligro</p>
              <p className="text-2xl font-bold text-orange-600">{dangerCount}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vencidos</p>
              <p className="text-2xl font-bold text-red-600">{expiredCount}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado de Carencia
            </label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="ALL">Todos los estados</option>
              <option value="EXPIRED">Vencidos</option>
              <option value="DANGER">Peligro</option>
              <option value="WARNING">Precaución</option>
              <option value="SAFE">Seguros</option>
            </select>
          </div>

          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Lote
            </label>
            <select
              value={selectedLote}
              onChange={(e) => setSelectedLote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
            >
              <option value="ALL">Todos los lotes</option>
              {uniqueLotes.map(lote => (
                <option key={lote.id} value={lote.id}>{lote.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Lista de Alertas */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-amber-600" />
            Períodos de Carencia Activos ({filteredAlerts.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`p-6 border-l-4 ${
                alert.status === 'EXPIRED' ? 'border-red-500' :
                alert.status === 'DANGER' ? 'border-orange-500' :
                alert.status === 'WARNING' ? 'border-yellow-500' : 'border-green-500'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(alert.status)}
                    <h4 className="text-lg font-medium text-gray-900">{alert.insumoName}</h4>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadge(alert.status)}`}>
                      {getStatusText(alert.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      <span>{alert.loteName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>Aplicado: {new Date(alert.applicationDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Leaf className="w-4 h-4" />
                      <span>Cosecha segura: {new Date(alert.harvestSafeDate).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      <span>
                        {alert.daysRemaining > 0 
                          ? `${alert.daysRemaining} días restantes`
                          : alert.daysRemaining === 0
                          ? 'Hoy es seguro cosechar'
                          : `Vencido hace ${Math.abs(alert.daysRemaining)} días`
                        }
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 text-sm text-gray-500">
                    <span>Responsable: {alert.responsiblePerson}</span>
                    <span className="mx-2">•</span>
                    <span>Período de carencia: {alert.gracePeriodDays} días</span>
                  </div>
                </div>

                <div className="ml-4">
                  {alert.status === 'EXPIRED' && (
                    <div className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-xs font-medium">
                      ¡PROHIBIDO COSECHAR!
                    </div>
                  )}
                  {alert.status === 'DANGER' && (
                    <div className="bg-orange-100 text-orange-800 px-3 py-1 rounded-full text-xs font-medium">
                      ESPERAR {alert.daysRemaining} DÍAS
                    </div>
                  )}
                  {alert.status === 'WARNING' && (
                    <div className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-medium">
                      PRÓXIMO A VENCER
                    </div>
                  )}
                  {alert.status === 'SAFE' && (
                    <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-medium">
                      SEGURO COSECHAR
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hay alertas de carencia</h3>
            <p className="mt-1 text-sm text-gray-500">
              No se encontraron períodos de carencia con los filtros seleccionados.
            </p>
          </div>
        )}
      </div>

      {/* Información de Cumplimiento BPA */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="w-6 h-6 text-blue-600 mt-1" />
          <div>
            <h4 className="text-lg font-medium text-blue-900 mb-2">
              Cumplimiento de Buenas Prácticas Agrícolas (BPA)
            </h4>
            <div className="text-sm text-blue-800 space-y-2">
              <p>
                • <strong>Período de Carencia:</strong> Tiempo mínimo que debe transcurrir entre la aplicación 
                del insumo y la cosecha para garantizar la seguridad alimentaria.
              </p>
              <p>
                • <strong>Prohibición de Cosecha:</strong> Durante el período de carencia, está estrictamente 
                prohibido cosechar los frutos del lote tratado.
              </p>
              <p>
                • <strong>Trazabilidad:</strong> Todos los registros de aplicación deben mantenerse para 
                auditorías de certificación y cumplimiento normativo.
              </p>
              <p>
                • <strong>Responsabilidad:</strong> El incumplimiento de los períodos de carencia puede 
                resultar en pérdida de certificaciones y sanciones legales.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
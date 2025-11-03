import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Bug, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Eye, 
  X,
  CheckCircle,
  Clock
} from 'lucide-react';

interface PestAlert {
  id: number;
  pestType: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  lotName: string;
  farmName: string;
  affectedArea: number;
  createdAt: string;
  description: string;
  status?: 'ACTIVE' | 'CONTROLLED' | 'RESOLVED';
  plantsAffected?: number;
  plantsInspected?: number;
}

interface PestAlertsProps {
  isOpen: boolean;
  onClose: () => void;
}

const PestAlerts: React.FC<PestAlertsProps> = ({ isOpen, onClose }) => {
  const [alerts, setAlerts] = useState<PestAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedAlert, setSelectedAlert] = useState<PestAlert | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAlerts();
    }
  }, [isOpen]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/pests/alerts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.data.alerts || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'text-red-600 bg-red-100 border-red-200';
      case 'HIGH': return 'text-orange-600 bg-orange-100 border-orange-200';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'LOW': return 'text-green-600 bg-green-100 border-green-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'Crítico';
      case 'HIGH': return 'Alto';
      case 'MEDIUM': return 'Medio';
      case 'LOW': return 'Bajo';
      default: return severity;
    }
  };

  const getPestTypeText = (pestType: string) => {
    switch (pestType) {
      case 'BROCA': return 'Broca del Café';
      case 'ROYA': return 'Roya del Café';
      case 'MINADOR': return 'Minador de la Hoja';
      case 'COCHINILLA': return 'Cochinilla';
      case 'NEMATODOS': return 'Nematodos';
      default: return pestType;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-red-600 bg-red-100';
      case 'CONTROLLED': return 'text-yellow-600 bg-yellow-100';
      case 'RESOLVED': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'Activa';
      case 'CONTROLLED': return 'Controlada';
      case 'RESOLVED': return 'Resuelta';
      default: return 'Sin estado';
    }
  };

  const getUrgencyLevel = (severity: string, createdAt: string) => {
    const daysSinceCreated = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
    
    if (severity === 'CRITICAL' && daysSinceCreated > 1) return 'Acción inmediata requerida';
    if (severity === 'HIGH' && daysSinceCreated > 3) return 'Acción urgente requerida';
    if (severity === 'MEDIUM' && daysSinceCreated > 7) return 'Requiere atención';
    
    return null;
  };

  const getRecommendations = (pestType: string, severity: string) => {
    const recommendations: any = {
      'BROCA': {
        'CRITICAL': ['Control químico inmediato', 'Recolección intensiva de frutos', 'Evaluación de renovación'],
        'HIGH': ['Aplicación de control biológico', 'Intensificar monitoreo', 'Control cultural'],
        'MEDIUM': ['Monitoreo semanal', 'Control biológico preventivo', 'Manejo de sombra'],
        'LOW': ['Monitoreo quincenal', 'Recolección de frutos caídos', 'Poda sanitaria']
      },
      'ROYA': {
        'CRITICAL': ['Aplicación de fungicidas sistémicos', 'Poda drástica', 'Mejora nutricional'],
        'HIGH': ['Fungicidas preventivos', 'Control de humedad', 'Fertilización foliar'],
        'MEDIUM': ['Monitoreo de hojas', 'Mejora de ventilación', 'Nutrición balanceada'],
        'LOW': ['Monitoreo preventivo', 'Manejo de sombra', 'Prácticas culturales']
      }
    };

    return recommendations[pestType]?.[severity] || ['Consultar con técnico especializado'];
  };

  const filteredAlerts = alerts.filter(alert => {
    if (selectedSeverity === 'all') return true;
    return alert.severity === selectedSeverity;
  });

  const criticalAlerts = alerts.filter(alert => alert.severity === 'CRITICAL').length;
  const highAlerts = alerts.filter(alert => alert.severity === 'HIGH').length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Sistema de Alertas de Plagas
              </h2>
              <p className="text-sm text-gray-600">
                {criticalAlerts} alertas críticas • {highAlerts} alertas altas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Filtros */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-700">Filtrar por severidad:</span>
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Todas' },
                { value: 'CRITICAL', label: 'Críticas' },
                { value: 'HIGH', label: 'Altas' },
                { value: 'MEDIUM', label: 'Medias' },
                { value: 'LOW', label: 'Bajas' }
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setSelectedSeverity(option.value)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    selectedSeverity === option.value
                      ? 'bg-amber-100 text-amber-700 border border-amber-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Lista de Alertas */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12">
              <Bug className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No hay alertas para mostrar</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {filteredAlerts.map((alert) => {
                const urgency = getUrgencyLevel(alert.severity, alert.createdAt);
                const infestationRate = alert.plantsAffected && alert.plantsInspected 
                  ? ((alert.plantsAffected / alert.plantsInspected) * 100).toFixed(1)
                  : null;

                return (
                  <div
                    key={alert.id}
                    className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
                      alert.severity === 'CRITICAL' ? 'border-red-200 bg-red-50' :
                      alert.severity === 'HIGH' ? 'border-orange-200 bg-orange-50' :
                      'border-gray-200 bg-white'
                    }`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(alert.severity)}`}>
                            {getSeverityText(alert.severity)}
                          </div>
                          {alert.status && (
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(alert.status)}`}>
                              {getStatusText(alert.status)}
                            </div>
                          )}
                          {urgency && (
                            <div className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700 border border-red-200 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {urgency}
                            </div>
                          )}
                        </div>

                        <h4 className="font-semibold text-gray-900 mb-1">
                          {getPestTypeText(alert.pestType)}
                        </h4>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {alert.farmName} - {alert.lotName}
                          </span>
                          <span>{alert.affectedArea} ha afectadas</span>
                          {infestationRate && (
                            <span className="font-medium text-red-600">
                              {infestationRate}% infestación
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-700 mb-3">
                          {alert.description}
                        </p>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(alert.createdAt).toLocaleDateString('es-ES', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                          <button 
                            className="text-amber-600 hover:text-amber-700 text-sm font-medium flex items-center gap-1"
                            onClick={() => setSelectedAlert(alert)}
                          >
                            <Eye className="h-3 w-3" />
                            Ver detalles
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal de Detalles */}
        {selectedAlert && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Detalles de la Alerta
                </h3>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de Plaga
                    </label>
                    <p className="text-sm text-gray-900">{getPestTypeText(selectedAlert.pestType)}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Severidad
                    </label>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium border ${getSeverityColor(selectedAlert.severity)}`}>
                      {getSeverityText(selectedAlert.severity)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <p className="text-sm text-gray-900">{selectedAlert.farmName} - {selectedAlert.lotName}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <p className="text-sm text-gray-900">{selectedAlert.description}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Área Afectada
                    </label>
                    <p className="text-sm text-gray-900">{selectedAlert.affectedArea} hectáreas</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Detección
                    </label>
                    <p className="text-sm text-gray-900">
                      {new Date(selectedAlert.createdAt).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recomendaciones de Tratamiento
                  </label>
                  <ul className="space-y-1">
                    {getRecommendations(selectedAlert.pestType, selectedAlert.severity).map((rec, index) => (
                      <li key={index} className="text-sm text-gray-900 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                        {rec}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedAlert(null)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cerrar
                  </button>
                  <button 
                    className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                    onClick={() => {
                      alert('Programar tratamiento - funcionalidad próximamente');
                      setSelectedAlert(null);
                    }}
                  >
                    Programar Tratamiento
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PestAlerts;
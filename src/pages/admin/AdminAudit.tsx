import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  Shield, 
  Search, 
  Filter, 
  Eye, 
  Download,
  RefreshCw,
  Calendar,
  User,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Database,
  Settings,
  Lock,
  Unlock,
  FileText,
  Monitor
} from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  action: string;
  resource: string;
  resourceId: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  ipAddress: string;
  userAgent: string;
  status: 'success' | 'failed' | 'unauthorized' | 'forbidden';
  statusCode: number;
  requestData?: any;
  responseData?: any;
  errorMessage?: string;
  duration: number;
  timestamp: string;
  sessionId: string;
  location?: {
    country: string;
    city: string;
    region: string;
  };
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  tags: string[];
}

interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'password_change' | 'permission_change' | 'data_access' | 'suspicious_activity';
  severity: 'info' | 'warning' | 'error' | 'critical';
  userId?: string;
  userName?: string;
  description: string;
  details: any;
  ipAddress: string;
  timestamp: string;
  resolved: boolean;
  resolvedBy?: string;
  resolvedAt?: string;
  notes?: string;
}

export default function AdminAudit() {
  const { useAuthenticatedFetch } = useAdminStore();
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'logs' | 'security'>('logs');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterRisk, setFilterRisk] = useState<string>('all');
  const [filterDateRange, setFilterDateRange] = useState<string>('today');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<SecurityEvent | null>(null);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const [logsResponse, eventsResponse] = await Promise.all([
        useAuthenticatedFetch(`/admin/audit/logs?dateRange=${filterDateRange}`),
        useAuthenticatedFetch(`/admin/audit/security-events?dateRange=${filterDateRange}`)
      ]);

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        setAuditLogs(logsData.logs || []);
      }

      if (eventsResponse.ok) {
        const eventsData = await eventsResponse.json();
        setSecurityEvents(eventsData.events || []);
      }
    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [filterDateRange]);

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = 
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.endpoint.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesStatus = filterStatus === 'all' || log.status === filterStatus;
    const matchesRisk = filterRisk === 'all' || log.riskLevel === filterRisk;
    
    return matchesSearch && matchesAction && matchesStatus && matchesRisk;
  });

  const filteredEvents = securityEvents.filter(event => {
    const matchesSearch = 
      event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (event.userName && event.userName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  });

  const resolveSecurityEvent = async (eventId: string) => {
    const notes = prompt('Ingrese notas sobre la resolución:');
    if (!notes) return;

    try {
      const response = await useAuthenticatedFetch(`/admin/audit/security-events/${eventId}/resolve`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      
      if (response.ok) {
        setSecurityEvents(events => events.map(event => 
          event.id === eventId 
            ? { 
                ...event, 
                resolved: true, 
                resolvedAt: new Date().toISOString(),
                notes 
              } 
            : event
        ));
        toast.success('Evento de seguridad resuelto');
      } else {
        toast.error('Error al resolver evento');
      }
    } catch (error) {
      console.error('Error resolving security event:', error);
      toast.error('Error de conexión');
    }
  };

  const exportAuditData = async (type: 'logs' | 'security', format: 'csv' | 'json') => {
    try {
      const response = await useAuthenticatedFetch(`/admin/audit/export?type=${type}&format=${format}&dateRange=${filterDateRange}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-${type}-${filterDateRange}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Datos de auditoría exportados en formato ${format.toUpperCase()}`);
      } else {
        toast.error('Error al exportar datos');
      }
    } catch (error) {
      console.error('Error exporting audit data:', error);
      toast.error('Error de conexión');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'unauthorized': return 'bg-yellow-100 text-yellow-800';
      case 'forbidden': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4" />;
      case 'failed': return <XCircle className="h-4 w-4" />;
      case 'unauthorized': return <Lock className="h-4 w-4" />;
      case 'forbidden': return <Shield className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'info': return 'bg-blue-100 text-blue-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'bg-blue-100 text-blue-800';
      case 'POST': return 'bg-green-100 text-green-800';
      case 'PUT': return 'bg-yellow-100 text-yellow-800';
      case 'DELETE': return 'bg-red-100 text-red-800';
      case 'PATCH': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Auditoría y Seguridad
          </h1>
          <p className="text-gray-600 mt-1">
            Monitoreo de actividades y eventos de seguridad del sistema
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchAuditData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <button 
            onClick={() => exportAuditData(activeTab, 'csv')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            CSV
          </button>
          <button 
            onClick={() => exportAuditData(activeTab, 'json')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" />
            JSON
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('logs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'logs'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Activity className="h-4 w-4 inline mr-2" />
            Logs de Auditoría ({auditLogs.length})
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Eventos de Seguridad ({securityEvents.filter(e => !e.resolved).length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder={activeTab === 'logs' ? "Buscar en logs..." : "Buscar eventos..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          
          {activeTab === 'logs' && (
            <>
              <select
                value={filterAction}
                onChange={(e) => setFilterAction(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todas las acciones</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
                <option value="create">Crear</option>
                <option value="update">Actualizar</option>
                <option value="delete">Eliminar</option>
                <option value="view">Ver</option>
              </select>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todos los estados</option>
                <option value="success">Exitoso</option>
                <option value="failed">Fallido</option>
                <option value="unauthorized">No autorizado</option>
                <option value="forbidden">Prohibido</option>
              </select>
              <select
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              >
                <option value="all">Todos los riesgos</option>
                <option value="low">Bajo</option>
                <option value="medium">Medio</option>
                <option value="high">Alto</option>
                <option value="critical">Crítico</option>
              </select>
            </>
          )}
          
          <select
            value={filterDateRange}
            onChange={(e) => setFilterDateRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="today">Hoy</option>
            <option value="week">Última semana</option>
            <option value="month">Último mes</option>
            <option value="quarter">Último trimestre</option>
            <option value="year">Último año</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'logs' ? (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Recurso
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Método
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Riesgo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                          <User className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{log.userName}</div>
                          <div className="text-sm text-gray-500">{log.userRole}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.action}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.resource}</div>
                      <div className="text-sm text-gray-500">{log.endpoint}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(log.method)}`}>
                        {log.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(log.status)}`}>
                        {getStatusIcon(log.status)}
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(log.riskLevel)}`}>
                        {log.riskLevel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvents.map((event) => (
            <div key={event.id} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(event.severity)}`}>
                      {event.severity}
                    </span>
                    <span className="text-sm text-gray-500">{event.type}</span>
                    <span className="text-sm text-gray-500">
                      {new Date(event.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">{event.description}</h3>
                  {event.userName && (
                    <p className="text-sm text-gray-600 mb-2">Usuario: {event.userName}</p>
                  )}
                  <p className="text-sm text-gray-600">IP: {event.ipAddress}</p>
                  {event.resolved && (
                    <div className="mt-2 p-2 bg-green-50 rounded">
                      <p className="text-sm text-green-800">
                        Resuelto el {new Date(event.resolvedAt!).toLocaleString()}
                        {event.resolvedBy && ` por ${event.resolvedBy}`}
                      </p>
                      {event.notes && (
                        <p className="text-sm text-green-700 mt-1">Notas: {event.notes}</p>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="text-blue-600 hover:text-blue-900"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  {!event.resolved && (
                    <button
                      onClick={() => resolveSecurityEvent(event.id)}
                      className="text-green-600 hover:text-green-900"
                    >
                      <CheckCircle className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Log Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detalles del Log de Auditoría</h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Usuario</label>
                  <div className="text-sm text-gray-900">{selectedLog.userName}</div>
                  <div className="text-sm text-gray-500">{selectedLog.userEmail}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Acción</label>
                  <div className="text-sm text-gray-900">{selectedLog.action}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Recurso</label>
                  <div className="text-sm text-gray-900">{selectedLog.resource}</div>
                  <div className="text-sm text-gray-500">ID: {selectedLog.resourceId}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Endpoint</label>
                  <div className="text-sm text-gray-900">{selectedLog.endpoint}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Método</label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getMethodColor(selectedLog.method)}`}>
                    {selectedLog.method}
                  </span>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Estado</label>
                  <div>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedLog.status)}`}>
                      {getStatusIcon(selectedLog.status)}
                      {selectedLog.status}
                    </span>
                    <span className="ml-2 text-sm text-gray-500">({selectedLog.statusCode})</span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Nivel de Riesgo</label>
                  <div>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRiskColor(selectedLog.riskLevel)}`}>
                      {selectedLog.riskLevel}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <div className="text-sm text-gray-900">{selectedLog.ipAddress}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Duración</label>
                  <div className="text-sm text-gray-900">{selectedLog.duration}ms</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <div className="text-sm text-gray-900">
                    {new Date(selectedLog.timestamp).toLocaleString()}
                  </div>
                </div>
                {selectedLog.location && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Ubicación</label>
                    <div className="text-sm text-gray-900">
                      {selectedLog.location.city}, {selectedLog.location.region}, {selectedLog.location.country}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {selectedLog.tags.length > 0 && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">Tags</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {selectedLog.tags.map((tag, index) => (
                    <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedLog.errorMessage && (
              <div className="mt-4">
                <label className="text-sm font-medium text-gray-500">Error</label>
                <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                  {selectedLog.errorMessage}
                </div>
              </div>
            )}

            <div className="mt-4">
              <label className="text-sm font-medium text-gray-500">User Agent</label>
              <div className="text-sm text-gray-900 break-all">{selectedLog.userAgent}</div>
            </div>
          </div>
        </div>
      )}

      {/* Security Event Details Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Detalles del Evento de Seguridad</h2>
              <button
                onClick={() => setSelectedEvent(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Tipo</label>
                <div className="text-sm text-gray-900">{selectedEvent.type}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Severidad</label>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(selectedEvent.severity)}`}>
                  {selectedEvent.severity}
                </span>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Descripción</label>
                <div className="text-sm text-gray-900">{selectedEvent.description}</div>
              </div>
              {selectedEvent.userName && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Usuario</label>
                  <div className="text-sm text-gray-900">{selectedEvent.userName}</div>
                </div>
              )}
              <div>
                <label className="text-sm font-medium text-gray-500">IP Address</label>
                <div className="text-sm text-gray-900">{selectedEvent.ipAddress}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Timestamp</label>
                <div className="text-sm text-gray-900">
                  {new Date(selectedEvent.timestamp).toLocaleString()}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Detalles</label>
                <pre className="text-sm text-gray-900 bg-gray-50 p-2 rounded overflow-auto">
                  {JSON.stringify(selectedEvent.details, null, 2)}
                </pre>
              </div>
              {selectedEvent.resolved && (
                <div>
                  <label className="text-sm font-medium text-gray-500">Resolución</label>
                  <div className="text-sm text-green-800 bg-green-50 p-2 rounded">
                    Resuelto el {new Date(selectedEvent.resolvedAt!).toLocaleString()}
                    {selectedEvent.resolvedBy && ` por ${selectedEvent.resolvedBy}`}
                    {selectedEvent.notes && (
                      <div className="mt-1">Notas: {selectedEvent.notes}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
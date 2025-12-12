import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '@/stores/adminStore';
import {
  Plus,
  Users,
  Coffee,
  CreditCard,
  AlertTriangle,
  Activity,
  TrendingUp,
  Shield,
  Database,
  Settings,
  Download,
  Upload,
  RefreshCw,
  Bell,
  Search,
  BarChart3
} from 'lucide-react';

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
  badge?: string;
}

interface SystemAlert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  timestamp: string;
}

const QuickActionsPanel: React.FC = () => {
  const navigate = useNavigate();
  const { useAuthenticatedFetch } = useAdminStore();
  const [loadingStats, setLoadingStats] = useState<boolean>(true);
  const [systemAlerts, setSystemAlerts] = useState<SystemAlert[]>([]);

  const quickActions: QuickAction[] = [
    {
      id: 'new-user',
      title: 'Nuevo Usuario',
      description: 'Crear cuenta de usuario',
      icon: Users,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => navigate('/admin/users/new')
    },
    {
      id: 'new-grower',
      title: 'Nuevo Caficultor',
      description: 'Registrar caficultor',
      icon: Coffee,
      color: 'bg-green-500 hover:bg-green-600',
      action: () => navigate('/admin/coffee-growers/new')
    },
    {
      id: 'process-payment',
      title: 'Procesar Pago',
      description: 'Gestionar pagos pendientes',
      icon: CreditCard,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => navigate('/admin/payments'),
      badge: '12'
    },
    {
      id: 'system-health',
      title: 'Estado del Sistema',
      description: 'Monitoreo en tiempo real',
      icon: Activity,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      action: () => navigate('/admin/system-health')
    },
    {
      id: 'analytics',
      title: 'Analíticas',
      description: 'Reportes y estadísticas',
      icon: BarChart3,
      color: 'bg-indigo-500 hover:bg-indigo-600',
      action: () => navigate('/admin/analytics')
    },
    {
      id: 'backup',
      title: 'Backup',
      description: 'Respaldo de datos',
      icon: Database,
      color: 'bg-amber-500 hover:bg-amber-600',
      action: () => console.log('Iniciando backup...')
    }
  ];

  const [systemStats, setSystemStats] = useState<
    { label: string; value: string; change?: string; positive?: boolean }[]
  >([]);

  const formatNumber = (n: number) => new Intl.NumberFormat('es-CO').format(n);
  const formatCurrency = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(n);

  const loadData = async () => {
    try {
      setLoadingStats(true);
      const [metricsRes, healthRes, activityRes] = await Promise.all([
        useAuthenticatedFetch('/admin/dashboard/metrics'),
        useAuthenticatedFetch('/admin/dashboard/health'),
        useAuthenticatedFetch('/admin/dashboard/activity')
      ]);

      const metricsJson = await metricsRes.json();
      const healthJson = await healthRes.json();
      const activityJson = await activityRes.json();

      const metrics = metricsJson?.data || {};
      const health = healthJson?.data || {};

      setSystemStats([
        {
          label: 'Usuarios Activos',
          value: metrics?.users ? formatNumber(metrics.users.active || 0) : '0',
          positive: true,
          change: metrics?.users ? `${formatNumber(metrics.users.growth_rate || 0)}` : undefined
        },
        {
          label: 'Pagos Completados',
          value: metrics?.payments ? formatNumber(metrics.payments.successful || 0) : '0',
          positive: true,
          change: metrics?.payments ? `${formatNumber(metrics.payments.total || 0)} totales` : undefined
        },
        {
          label: 'Ingresos del Mes',
          value: metrics?.payments ? formatCurrency(metrics.payments.revenue_this_month || 0) : '$0',
          positive: true,
          change: metrics?.payments ? `${formatNumber(metrics.payments.revenue_growth || 0)} crecimiento` : undefined
        },
        {
          label: 'Eventos de Auditoría Hoy',
          value: metrics?.system ? formatNumber(metrics.system.audit_logs_today || 0) : '0',
          positive: true
        }
      ]);

      const recent = Array.isArray(activityJson?.data) ? activityJson.data.slice(0, 3) : [];
      setSystemAlerts(
        recent.map((item: any, idx: number) => ({
          id: String(item.id ?? idx),
          type: 'info',
          message: `${item.action ?? 'actividad'}: ${item.description ?? ''}`.trim(),
          timestamp: new Date(item.created_at ?? Date.now()).toLocaleString('es-CO')
        }))
      );
    } catch (e) {
      // En caso de error, mantener valores vacíos y mostrar un alerta genérica
      setSystemAlerts([{
        id: 'fallback',
        type: 'warning',
        message: 'No se pudieron cargar las métricas. Verifique la conexión del backend.',
        timestamp: new Date().toLocaleString('es-CO')
      }]);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadData();
    // Recarga periódica cada 60s
    const id = setInterval(loadData, 60_000);
    return () => clearInterval(id);
  }, []);

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />;
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'info':
        return <Bell className="h-4 w-4 text-blue-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getAlertBgColor = (type: string) => {
    switch (type) {
      case 'warning':
        return 'bg-amber-50 border-amber-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'info':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Acciones Rápidas */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
          <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Ver todas
          </button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.action}
                className={`relative p-4 rounded-lg text-white transition-all duration-200 transform hover:scale-105 ${action.color}`}
              >
                {action.badge && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
                <div className="flex flex-col items-center space-y-2">
                  <IconComponent className="h-6 w-6" />
                  <div className="text-center">
                    <div className="text-sm font-medium">{action.title}</div>
                    <div className="text-xs opacity-90">{action.description}</div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Estadísticas del Sistema y Alertas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Estadísticas Rápidas */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Estado del Sistema</h3>
            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors" onClick={loadData} aria-label="Actualizar métricas">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
          
          {loadingStats ? (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse h-20" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {systemStats.map((stat, index) => (
                <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-sm text-gray-600">{stat.label}</div>
                  {stat.change && (
                    <div className={`text-xs font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                      {stat.change}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Alertas del Sistema */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Alertas Recientes</h3>
            <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">
              Ver todas
            </button>
          </div>
          
          <div className="space-y-3">
            {systemAlerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-3 rounded-lg border ${getAlertBgColor(alert.type)}`}
              >
                <div className="flex items-start space-x-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">{alert.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{alert.timestamp}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Herramientas de Administración */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Herramientas de Administración</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/admin/export')}
            className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Exportar Datos</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/import')}
            className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Upload className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Importar Datos</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/settings')}
            className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Settings className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Configuración</span>
          </button>
          
          <button
            onClick={() => navigate('/admin/security')}
            className="flex items-center space-x-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Shield className="h-5 w-5 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">Seguridad</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel;
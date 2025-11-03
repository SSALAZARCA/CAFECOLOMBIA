import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  FileText,
  PieChart,
  LineChart,
  Activity,
  Target,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface RevenueData {
  period: string;
  revenue: number;
  subscriptions: number;
  newUsers: number;
  churn: number;
}

interface PaymentAnalytics {
  totalRevenue: number;
  monthlyRevenue: number;
  averageOrderValue: number;
  successRate: number;
  failureRate: number;
  refundRate: number;
  topPaymentMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
}

interface SubscriptionAnalytics {
  totalSubscriptions: number;
  activeSubscriptions: number;
  cancelledSubscriptions: number;
  trialSubscriptions: number;
  churnRate: number;
  growthRate: number;
  averageLifetime: number;
  planDistribution: Array<{
    planName: string;
    count: number;
    revenue: number;
    percentage: number;
  }>;
}

interface UserAnalytics {
  totalUsers: number;
  newUsersThisMonth: number;
  activeUsers: number;
  userGrowthRate: number;
  usersByCountry: Array<{
    country: string;
    count: number;
    percentage: number;
  }>;
  usersByPlan: Array<{
    plan: string;
    count: number;
    percentage: number;
  }>;
}

interface ReportsAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
}

const ReportsAnalytics: React.FC<ReportsAnalyticsProps> = ({ isOpen, onClose }) => {
  const { useAuthenticatedFetch } = useAdminStore();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [dateRange, setDateRange] = useState('30d');
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [paymentAnalytics, setPaymentAnalytics] = useState<PaymentAnalytics | null>(null);
  const [subscriptionAnalytics, setSubscriptionAnalytics] = useState<SubscriptionAnalytics | null>(null);
  const [userAnalytics, setUserAnalytics] = useState<UserAnalytics | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchAnalytics();
    }
  }, [isOpen, dateRange]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [revenueResponse, paymentResponse, subscriptionResponse, userResponse] = await Promise.all([
        useAuthenticatedFetch(`/admin/analytics/revenue?period=${dateRange}`),
        useAuthenticatedFetch(`/admin/analytics/payments?period=${dateRange}`),
        useAuthenticatedFetch(`/admin/analytics/subscriptions?period=${dateRange}`),
        useAuthenticatedFetch(`/admin/analytics/users?period=${dateRange}`)
      ]);

      if (revenueResponse.success) {
        setRevenueData(revenueResponse.data);
      }
      if (paymentResponse.success) {
        setPaymentAnalytics(paymentResponse.data);
      }
      if (subscriptionResponse.success) {
        setSubscriptionAnalytics(subscriptionResponse.data);
      }
      if (userResponse.success) {
        setUserAnalytics(userResponse.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Error al cargar las analíticas');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/reports/export`, {
        method: 'POST',
        body: JSON.stringify({
          type,
          period: dateRange,
          format: 'xlsx'
        })
      });

      if (response.success) {
        // Create download link
        const blob = new Blob([response.data], { 
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${type}_report_${dateRange}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast.success('Reporte exportado exitosamente');
      } else {
        toast.error('Error al exportar el reporte');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Error al exportar el reporte');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-7xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reportes y Analíticas
            </h2>
            <p className="text-gray-600 text-sm mt-1">
              Análisis detallado del rendimiento del negocio
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="1y">Último año</option>
            </select>
            <button
              onClick={fetchAnalytics}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XCircle className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Resumen', icon: Activity },
              { id: 'revenue', name: 'Ingresos', icon: DollarSign },
              { id: 'subscriptions', name: 'Suscripciones', icon: Target },
              { id: 'users', name: 'Usuarios', icon: Users },
              { id: 'payments', name: 'Pagos', icon: CheckCircle }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-emerald-100">Ingresos Totales</p>
                      <p className="text-2xl font-bold">
                        {paymentAnalytics ? formatCurrency(paymentAnalytics.totalRevenue) : '-'}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-emerald-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100">Suscripciones Activas</p>
                      <p className="text-2xl font-bold">
                        {subscriptionAnalytics ? subscriptionAnalytics.activeSubscriptions.toLocaleString() : '-'}
                      </p>
                    </div>
                    <Target className="h-8 w-8 text-blue-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100">Usuarios Totales</p>
                      <p className="text-2xl font-bold">
                        {userAnalytics ? userAnalytics.totalUsers.toLocaleString() : '-'}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-purple-200" />
                  </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100">Tasa de Éxito</p>
                      <p className="text-2xl font-bold">
                        {paymentAnalytics ? formatPercentage(paymentAnalytics.successRate) : '-'}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-orange-200" />
                  </div>
                </div>
              </div>

              {/* Charts Placeholder */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Ingresos por Período</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <LineChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Gráfico de ingresos</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Planes</h3>
                  <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
                    <div className="text-center">
                      <PieChart className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-500">Gráfico de distribución</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'revenue' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Análisis de Ingresos</h3>
                <button
                  onClick={() => exportReport('revenue')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
              </div>
              
              {paymentAnalytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Ingresos Mensuales</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(paymentAnalytics.monthlyRevenue)}
                    </p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Valor Promedio de Orden</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatCurrency(paymentAnalytics.averageOrderValue)}
                    </p>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-sm font-medium text-gray-500 mb-2">Tasa de Reembolso</h4>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatPercentage(paymentAnalytics.refundRate)}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Análisis de Suscripciones</h3>
                <button
                  onClick={() => exportReport('subscriptions')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
              </div>
              
              {subscriptionAnalytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Total Suscripciones</h4>
                      <p className="text-2xl font-bold text-gray-900">
                        {subscriptionAnalytics.totalSubscriptions.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tasa de Churn</h4>
                      <p className="text-2xl font-bold text-red-600">
                        {formatPercentage(subscriptionAnalytics.churnRate)}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tasa de Crecimiento</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPercentage(subscriptionAnalytics.growthRate)}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Vida Promedio</h4>
                      <p className="text-2xl font-bold text-gray-900">
                        {subscriptionAnalytics.averageLifetime} días
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Plan</h4>
                    <div className="space-y-3">
                      {subscriptionAnalytics.planDistribution.map((plan, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{plan.planName}</span>
                              <span className="text-sm text-gray-500">{formatPercentage(plan.percentage)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-emerald-600 h-2 rounded-full" 
                                style={{ width: `${plan.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-sm font-medium text-gray-900">{plan.count} usuarios</div>
                            <div className="text-sm text-gray-500">{formatCurrency(plan.revenue)}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Análisis de Usuarios</h3>
                <button
                  onClick={() => exportReport('users')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
              </div>
              
              {userAnalytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Nuevos Usuarios (Este Mes)</h4>
                      <p className="text-2xl font-bold text-gray-900">
                        {userAnalytics.newUsersThisMonth.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Usuarios Activos</h4>
                      <p className="text-2xl font-bold text-gray-900">
                        {userAnalytics.activeUsers.toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tasa de Crecimiento</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPercentage(userAnalytics.userGrowthRate)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Análisis de Pagos</h3>
                <button
                  onClick={() => exportReport('payments')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Download className="h-4 w-4" />
                  Exportar
                </button>
              </div>
              
              {paymentAnalytics && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tasa de Éxito</h4>
                      <p className="text-2xl font-bold text-green-600">
                        {formatPercentage(paymentAnalytics.successRate)}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tasa de Fallo</h4>
                      <p className="text-2xl font-bold text-red-600">
                        {formatPercentage(paymentAnalytics.failureRate)}
                      </p>
                    </div>
                    
                    <div className="bg-white border border-gray-200 rounded-lg p-6">
                      <h4 className="text-sm font-medium text-gray-500 mb-2">Tasa de Reembolso</h4>
                      <p className="text-2xl font-bold text-orange-600">
                        {formatPercentage(paymentAnalytics.refundRate)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago Más Utilizados</h4>
                    <div className="space-y-3">
                      {paymentAnalytics.topPaymentMethods.map((method, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-900">{method.method}</span>
                              <span className="text-sm text-gray-500">{formatPercentage(method.percentage)}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${method.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="ml-4 text-right">
                            <div className="text-sm font-medium text-gray-900">{method.count} transacciones</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;
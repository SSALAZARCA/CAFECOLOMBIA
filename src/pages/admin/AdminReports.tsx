import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar,
  Filter,
  RefreshCw,
  Users,
  DollarSign,
  Package,
  Coffee,
  PieChart,
  LineChart,
  Activity,
  FileText,
  Settings,
  Eye
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  PieChart as RechartsPieChart,
  Cell,
  Pie,
  AreaChart,
  Area
} from 'recharts';
import { toast } from 'sonner';
import ReportsAnalytics from '../../components/admin/ReportsAnalytics';

interface ReportData {
  userGrowth: Array<{ month: string; users: number; growth: number }>;
  revenueAnalysis: Array<{ month: string; revenue: number; subscriptions: number }>;
  subscriptionDistribution: Array<{ plan: string; count: number; revenue: number }>;
  paymentMethods: Array<{ method: string; count: number; percentage: number }>;
  coffeeGrowerStats: Array<{ region: string; growers: number; farms: number }>;
  topPerformingPlans: Array<{ plan: string; subscribers: number; revenue: number; churnRate: number }>;
  monthlyMetrics: {
    totalUsers: number;
    activeSubscriptions: number;
    totalRevenue: number;
    churnRate: number;
    averageRevenuePerUser: number;
    conversionRate: number;
  };
  trends: {
    userGrowthRate: number;
    revenueGrowthRate: number;
    subscriptionGrowthRate: number;
    churnTrend: number;
  };
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

export default function AdminReports() {
  const { useAuthenticatedFetch } = useAdminStore();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('12months');
  const [selectedReport, setSelectedReport] = useState('overview');
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch(`/admin/reports?period=${selectedPeriod}&type=${selectedReport}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      } else {
        toast.error('Error al cargar reportes');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [selectedPeriod, selectedReport]);

  const exportReport = async (format: 'pdf' | 'excel') => {
    try {
      const response = await useAuthenticatedFetch(`/admin/reports/export?format=${format}&period=${selectedPeriod}&type=${selectedReport}`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte-${selectedReport}-${selectedPeriod}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Reporte exportado en formato ${format.toUpperCase()}`);
      } else {
        toast.error('Error al exportar reporte');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Error de conexión');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!reportData) {
    return (
      <div className="text-center py-12">
        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay datos de reportes disponibles</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Reportes y Analíticas
          </h1>
          <p className="text-gray-600 mt-1">
            Análisis detallado del rendimiento del negocio
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchReportData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <button 
            onClick={() => setShowAdvancedAnalytics(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Activity className="h-4 w-4" />
            Analíticas Avanzadas
          </button>
          <button 
            onClick={() => exportReport('excel')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Excel
          </button>
          <button 
            onClick={() => exportReport('pdf')}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Download className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <select
            value={selectedReport}
            onChange={(e) => setSelectedReport(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="overview">Vista General</option>
            <option value="users">Análisis de Usuarios</option>
            <option value="revenue">Análisis de Ingresos</option>
            <option value="subscriptions">Análisis de Suscripciones</option>
            <option value="coffee-growers">Análisis de Caficultores</option>
            <option value="payments">Análisis de Pagos</option>
          </select>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="1month">Último mes</option>
            <option value="3months">Últimos 3 meses</option>
            <option value="6months">Últimos 6 meses</option>
            <option value="12months">Último año</option>
            <option value="all">Todo el tiempo</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.monthlyMetrics.totalUsers.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Total Usuarios</div>
              <div className={`text-sm flex items-center gap-1 mt-1 ${
                reportData.trends.userGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {reportData.trends.userGrowthRate >= 0 ? '+' : ''}{reportData.trends.userGrowthRate.toFixed(1)}%
              </div>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${reportData.monthlyMetrics.totalRevenue.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Ingresos Totales</div>
              <div className={`text-sm flex items-center gap-1 mt-1 ${
                reportData.trends.revenueGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {reportData.trends.revenueGrowthRate >= 0 ? '+' : ''}{reportData.trends.revenueGrowthRate.toFixed(1)}%
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {reportData.monthlyMetrics.activeSubscriptions.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500">Suscripciones Activas</div>
              <div className={`text-sm flex items-center gap-1 mt-1 ${
                reportData.trends.subscriptionGrowthRate >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                <TrendingUp className="h-3 w-3" />
                {reportData.trends.subscriptionGrowthRate >= 0 ? '+' : ''}{reportData.trends.subscriptionGrowthRate.toFixed(1)}%
              </div>
            </div>
            <Package className="h-8 w-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                ${reportData.monthlyMetrics.averageRevenuePerUser.toFixed(0)}
              </div>
              <div className="text-sm text-gray-500">ARPU</div>
              <div className="text-sm text-gray-500 mt-1">
                Tasa conversión: {reportData.monthlyMetrics.conversionRate.toFixed(1)}%
              </div>
            </div>
            <Activity className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento de Usuarios</h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={reportData.userGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="users" 
                stroke="#10b981" 
                fill="#10b981" 
                fillOpacity={0.3}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Analysis Chart */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Análisis de Ingresos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.revenueAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="revenue" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Subscription Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Planes</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={reportData.subscriptionDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ plan, percentage }) => `${plan} (${percentage}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {reportData.subscriptionDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Methods */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Métodos de Pago</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={reportData.paymentMethods} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="method" type="category" />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Coffee Grower Stats */}
      <div className="bg-white p-6 rounded-lg border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Estadísticas de Caficultores por Región</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={reportData.coffeeGrowerStats}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="region" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="growers" fill="#10b981" name="Caficultores" />
            <Bar dataKey="farms" fill="#3b82f6" name="Fincas" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Top Performing Plans */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Planes de Mayor Rendimiento</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Plan
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Suscriptores
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ingresos
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tasa de Abandono
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rendimiento
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {reportData.topPerformingPlans.map((plan, index) => (
                <tr key={plan.plan} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <Coffee className="h-5 w-5 text-emerald-600 mr-2" />
                      <div className="text-sm font-medium text-gray-900">{plan.plan}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{plan.subscribers.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">${plan.revenue.toLocaleString()}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm ${plan.churnRate < 5 ? 'text-green-600' : plan.churnRate < 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {plan.churnRate.toFixed(1)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                        <div 
                          className="bg-emerald-600 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, (plan.revenue / Math.max(...reportData.topPerformingPlans.map(p => p.revenue))) * 100)}%` }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600">#{index + 1}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Advanced Analytics Modal */}
      {showAdvancedAnalytics && (
        <ReportsAnalytics
          isOpen={showAdvancedAnalytics}
          onClose={() => setShowAdvancedAnalytics(false)}
        />
      )}
    </div>
  );
}
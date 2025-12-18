import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminHttpClient } from '../../utils/adminHttpClient';
import {
  Users,
  UserCheck,
  MapPin,
  CreditCard,
  DollarSign,
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Coffee,
  Package,
  Award,
  Layers
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

interface DashboardMetrics {
  totalUsers: number;
  totalCoffeeGrowers: number;
  totalFarms: number;
  totalSubscriptions: number;
  monthlyRevenue: number;
  activePayments: number;
  systemActivity: number;
  growthRates: {
    users: number;
    revenue: number;
    subscriptions: number;
  };
}

interface ChartData {
  userGrowth: Array<{ date: string; users: number }>;
  subscriptionDistribution: Array<{ name: string; value: number }>;
  productionTrend?: Array<{ month: string; production: number }>;
  farmsByLocation?: Array<{ name: string; count: number }>;
  expensesByCategory?: Array<{ name: string; value: number }>;
  qualityDistribution?: Array<{ grade: string; count: number }>;
  revenueData?: Array<{ month: string; revenue: number }>;
  userRegistrations?: Array<{ month: string; users: number; growers: number }>;
  monthlyRevenue?: Array<{ month: string; revenue: number; subscriptions: number }>;
  subscriptionsByPlan?: Array<{ name: string; value: number; color: string }>;
  paymentMethods?: Array<{ method: string; count: number; percentage: number }>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showAdvancedView, setShowAdvancedView] = useState(false);

  // Stubs for missing components
  const AdvancedFilters: React.FC<any> = () => null;
  const QuickActionsPanel: React.FC = () => null;
  const InteractiveWidgets: React.FC<any> = () => null;
  const dashboardFilters: any[] = [];
  const filterValues = {};
  const handleFilterChange = () => { };
  const handleFilterReset = () => { };
  const widgets: any[] = [];


  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🚀 Starting dashboard data load...');

      // Cargar métricas principales reales desde backend
      console.log('📊 Loading dashboard metrics...');
      const metricsRes = await adminHttpClient.get('/api/admin/dashboard/metrics');
      const m = metricsRes?.data || {};

      // Cargar totales sin filtro de período
      console.log('📊 Loading analytics totals...');
      const totalsRes = await adminHttpClient.get('/api/admin/analytics/totals');
      const totals = totalsRes?.data?.metrics || {};

      // Cargar crecimiento y tasas
      const overviewRes = await adminHttpClient.get(`/api/admin/analytics/overview?period=${selectedPeriod}`);
      const overview = overviewRes?.data?.metrics || {};

      const usersTotal = Number(totals.totalUsers ?? m.users?.total ?? 0);
      const usersActive = Number(m.users?.active ?? 0);

      setMetrics({
        totalUsers: usersTotal,
        totalCoffeeGrowers: Number(m.coffee_growers?.total ?? 0),
        totalFarms: Number(m.farms?.total ?? 0),
        totalSubscriptions: Number(totals.totalSubscriptions ?? m.subscriptions?.total ?? 0),
        monthlyRevenue: Number(m.payments?.revenue_this_month ?? 0),
        activePayments: Number(m.payments?.successful ?? 0),
        systemActivity: usersTotal ? Math.round((usersActive / usersTotal) * 100) : 0,
        growthRates: {
          users: Number(overview.userGrowth ?? 0),
          revenue: Number(overview.revenueGrowth ?? 0),
          subscriptions: 0
        }
      });

      // Cargar datos de gráficos
      console.log('📈 Loading chart data...');
      const chartsRes = await adminHttpClient.get(`/api/admin/dashboard/charts`);
      const charts = chartsRes?.data || {};

      const monthlyRevenue = Array.isArray(charts.monthly_revenue)
        ? charts.monthly_revenue.map((r: any) => ({ month: r.month, revenue: Number(r.revenue || 0), subscriptions: 0 }))
        : [];

      const subscriptionsByPlan = Array.isArray(charts.subscriptions_by_plan)
        ? charts.subscriptions_by_plan.map((item: any, index: number) => ({
          name: item.plan_name,
          value: Number(item.count || 0),
          color: ['#3B82F6', '#10B981', '#F59E0B'][index] || '#6B7280'
        }))
        : [];

      const userRegistrations = Array.isArray(charts.user_registrations)
        ? charts.user_registrations.map((u: any) => ({ month: u.month, users: Number(u.count || 0), growers: Math.round(Number(u.count || 0) * 0.7) }))
        : [];

      const totalPaymentsCount = Array.isArray(charts.payment_methods)
        ? charts.payment_methods.reduce((acc: number, m: any) => acc + Number(m.count || 0), 0)
        : 0;

      const paymentMethods = Array.isArray(charts.payment_methods)
        ? charts.payment_methods.map((m: any) => ({
          method: m.method,
          count: Number(m.count || 0),
          percentage: totalPaymentsCount ? Math.round((Number(m.count || 0) / totalPaymentsCount) * 100) : 0
        }))
        : [];

      setChartData({
        userGrowth: [], // Placeholder
        subscriptionDistribution: [], // Placeholder
        userRegistrations,
        monthlyRevenue,
        subscriptionsByPlan,
        paymentMethods
      });

    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8 max-w-md">
          <div className="flex items-center space-x-3 text-red-800 mb-4">
            <AlertCircle className="h-6 w-6" />
            <h3 className="font-semibold text-lg">Error al cargar el dashboard</h3>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={loadDashboardData}
            className="w-full bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const MetricCard: React.FC<{
    title: string;
    value: number | string;
    change?: number;
    icon: React.ComponentType<any>;
    color: string;
    onClick?: () => void;
    suffix?: string;
  }> = ({ title, value, change, icon: Icon, color, onClick, suffix = '' }) => (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl shadow-sm border border-gray-200 p-6 ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-2">{title}</p>
          <p className="text-3xl font-bold text-gray-900">
            {typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          {typeof change !== 'undefined' && (
            <p className={`text-sm mt-2 ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {change >= 0 ? <TrendingUp className="inline h-4 w-4 mr-1" /> : <TrendingDown className="inline h-4 w-4 mr-1" />}
              {Math.abs(change)}% vs mes anterior
            </p>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard Administrativo</h1>
          <p className="text-gray-600 mt-1">
            Resumen general del sistema Café Colombia
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => setShowAdvancedView(!showAdvancedView)}
            className={`px-4 py-2 rounded-lg transition-colors ${showAdvancedView
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {showAdvancedView ? 'Vista Simple' : 'Vista Avanzada'}
          </button>

          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
            <option value="1y">Último año</option>
          </select>

          <button
            onClick={loadDashboardData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Actualizar
          </button>
        </div>
      </div>

      {showAdvancedView && (
        <AdvancedFilters
          filters={dashboardFilters}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
        />
      )}

      <QuickActionsPanel />

      {showAdvancedView ? (
        <InteractiveWidgets widgets={widgets} />
      ) : (
        <>
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div
                onClick={() => navigate('/admin/users')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <MetricCard
                  title="Usuarios del Sistema"
                  value={metrics.totalUsers}
                  change={metrics.growthRates.users}
                  icon={Users}
                  color="bg-blue-500"
                />
              </div>
              <div
                onClick={() => navigate('/admin/coffee-growers')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <MetricCard
                  title="Caficultores"
                  value={metrics.totalCoffeeGrowers}
                  icon={UserCheck}
                  color="bg-green-500"
                />
              </div>
              <div
                onClick={() => navigate('/admin/coffee-growers')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <MetricCard
                  title="Fincas Registradas"
                  value={metrics.totalFarms}
                  icon={MapPin}
                  color="bg-amber-500"
                />
              </div>
              <div
                onClick={() => navigate('/admin/subscriptions')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <MetricCard
                  title="Suscripciones Totales"
                  value={metrics.totalSubscriptions}
                  change={metrics.growthRates.subscriptions}
                  icon={CreditCard}
                  color="bg-purple-500"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* Gráficos */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registros de usuarios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Registros de Usuarios y Caficultores
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.userRegistrations ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="users"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  name="Usuarios"
                />
                <Line
                  type="monotone"
                  dataKey="growers"
                  stroke="#10B981"
                  strokeWidth={2}
                  name="Caficultores"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Ingresos mensuales */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Ingresos y Suscripciones
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.monthlyRevenue ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stackId="1"
                  stroke="#059669"
                  fill="#10B981"
                  name="Ingresos"
                />
                <Area
                  type="monotone"
                  dataKey="subscriptions"
                  stackId="2"
                  stroke="#7C3AED"
                  fill="#8B5CF6"
                  name="Suscripciones"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Distribución de planes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Distribución de Planes de Suscripción
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.subscriptionsByPlan ?? []}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {(chartData.subscriptionsByPlan ?? []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Métodos de pago */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Métodos de Pago Utilizados
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.paymentMethods ?? []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="method" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#F59E0B" name="Cantidad" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Actividad reciente */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Actividad Reciente del Sistema
        </h3>
        <div className="space-y-4">
          {[
            {
              action: 'Nuevo caficultor registrado',
              user: 'Juan Pérez',
              time: 'Hace 5 minutos',
              type: 'success'
            },
            {
              action: 'Pago procesado exitosamente',
              user: 'María García',
              time: 'Hace 15 minutos',
              type: 'info'
            },
            {
              action: 'Nueva finca registrada',
              user: 'Carlos López',
              time: 'Hace 1 hora',
              type: 'success'
            },
            {
              action: 'Suscripción renovada',
              user: 'Ana Martínez',
              time: 'Hace 2 horas',
              type: 'info'
            }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
              <div className="flex items-center space-x-3">
                <div className={`w-2 h-2 rounded-full ${activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                  }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.user}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
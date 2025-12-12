import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminHttpClient } from '../../utils/adminHttpClient';
import {
  Users,
  UserCheck,
  MapPin,
<<<<<<< HEAD
  Settings,
  TrendingUp,
  Activity,
  AlertCircle,
  Coffee,
  DollarSign,
  Package,
  Award,
  Layers
=======
  CreditCard,
  DollarSign,
  Activity,
  Calendar,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  AlertTriangle
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
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
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  users: number;
  admins: number;
  workers: number;
  newUsersThisMonth: number;
  farms: number;
  lots: number;
  totalCultivatedArea: number;
  totalProduction: number;
  monthlyProduction: number;
  monthlyExpenses: number;
  averageQuality: number;
  microlots: number;
  configurations: number;
}

interface ChartData {
  userGrowth: Array<{ date: string; users: number }>;
  subscriptionDistribution: Array<{ name: string; value: number }>;
  productionTrend?: Array<{ month: string; production: number }>;
  farmsByLocation?: Array<{ name: string; count: number }>;
  expensesByCategory?: Array<{ name: string; value: number }>;
  qualityDistribution?: Array<{ grade: string; count: number }>;
  revenueData: Array<{ month: string; revenue: number }>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
<<<<<<< HEAD
  const [stats, setStats] = useState<DashboardStats | null>(null);
=======
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
<<<<<<< HEAD

      const statsData = await adminHttpClient.get('/api/admin/dashboard/stats');
      setStats(statsData);

      const charts = await adminHttpClient.get('/api/admin/dashboard/charts?period=30d');
      setChartData(charts);

    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar el dashboard');
=======
      
      console.log('🚀 Starting dashboard data load...');
      
      // Cargar métricas principales reales desde backend
      console.log('📊 Loading dashboard metrics...');
      const metricsRes = await adminHttpClient.get('/api/admin/dashboard/metrics');
      const m = metricsRes?.data || {};
      console.log('✅ Dashboard metrics loaded:', m);

      // Cargar totales sin filtro de período
      console.log('📊 Loading analytics totals...');
      const totalsRes = await adminHttpClient.get('/api/admin/analytics/totals');
      const totals = totalsRes?.data?.metrics || {};
      console.log('✅ Analytics totals loaded:', totals);

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
      console.log('✅ Chart data loaded:', charts);

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
        userRegistrations,
        monthlyRevenue,
        subscriptionsByPlan,
        paymentMethods
      });
      
      console.log('🎉 Dashboard data loaded successfully!');
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
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
    icon: React.ComponentType<any>;
    color: string;
    onClick?: () => void;
    suffix?: string;
  }> = ({ title, value, icon: Icon, color, onClick, suffix = '' }) => (
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
        </div>
<<<<<<< HEAD
        <div className={`p-4 rounded-full ${color}`}>
          <Icon className="h-8 w-8 text-white" />
=======
        <div className={`p-3 rounded-full ${color}`}>
          <Users className="h-6 w-6 text-white" />
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
        </div>
      </div>
    </div>
  );

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

  return (
<<<<<<< HEAD
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
              <p className="text-gray-600 mt-2">
                Sistema Café Colombia - Métricas en Tiempo Real
              </p>
=======
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
            className={`px-4 py-2 rounded-lg transition-colors ${
              showAdvancedView 
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

      {/* Filtros Avanzados */}
      {showAdvancedView && (
        <AdvancedFilters
          filters={dashboardFilters}
          values={filterValues}
          onChange={handleFilterChange}
          onReset={handleFilterReset}
        />
      )}

      {/* Quick Actions Panel */}
      <QuickActionsPanel />

      {/* Widgets Interactivos o Métricas Simples */}
      {showAdvancedView ? (
        <InteractiveWidgets widgets={widgets} />
      ) : (
        <>
          {/* Métricas principales */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div 
                onClick={() => navigate('/admin/users')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <MetricCard
                  title="Usuarios del Sistema"
                  value={metrics.totalUsers.toLocaleString()}
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
                  value={metrics.totalCoffeeGrowers.toLocaleString()}
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
                  value={metrics.totalFarms.toLocaleString()}
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
                  value={metrics.totalSubscriptions.toLocaleString()}
                  change={metrics.growthRates.subscriptions}
                  icon={CreditCard}
                  color="bg-purple-500"
                />
              </div>
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
            </div>
            <button
              onClick={loadDashboardData}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Activity className="h-5 w-5" />
              <span>Actualizar</span>
            </button>
          </div>
        </div>

        {/* Métricas Principales */}
        {stats && (
          <>
            {/* Fila 1: Usuarios */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Usuarios del Sistema"
                value={stats.users}
                icon={Users}
                color="bg-blue-500"
                onClick={() => navigate('/admin/users')}
              />
              <MetricCard
                title="Administradores"
                value={stats.admins}
                icon={UserCheck}
                color="bg-green-500"
              />
              <MetricCard
                title="Caficultores/Trabajadores"
                value={stats.workers}
                icon={Coffee}
                color="bg-amber-600"
              />
              <MetricCard
                title="Nuevos Usuarios (30d)"
                value={stats.newUsersThisMonth}
                icon={TrendingUp}
                color="bg-purple-500"
              />
            </div>

            {/* Fila 2: Fincas y Producción */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Fincas Registradas"
                value={stats.farms}
                icon={MapPin}
                color="bg-emerald-500"
                onClick={() => navigate('/admin/coffee-growers')}
              />
              <MetricCard
                title="Lotes Activos"
                value={stats.lots}
                icon={Layers}
                color="bg-teal-500"
              />
              <MetricCard
                title="Área Cultivada"
                value={stats.totalCultivatedArea.toFixed(1)}
                icon={MapPin}
                color="bg-lime-600"
                suffix=" ha"
              />
              <MetricCard
                title="Producción Total"
                value={stats.totalProduction.toFixed(0)}
                icon={Package}
                color="bg-orange-500"
                suffix=" kg"
              />
            </div>

            {/* Fila 3: Calidad y Finanzas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Producción del Mes"
                value={stats.monthlyProduction.toFixed(0)}
                icon={TrendingUp}
                color="bg-indigo-500"
                suffix=" kg"
              />
              <MetricCard
                title="Gastos del Mes"
                value={`$${stats.monthlyExpenses.toLocaleString()}`}
                icon={DollarSign}
                color="bg-red-500"
              />
              <MetricCard
                title="Calidad Promedio SCA"
                value={stats.averageQuality > 0 ? stats.averageQuality.toFixed(1) : 'N/A'}
                icon={Award}
                color="bg-yellow-500"
              />
              <MetricCard
                title="Microlotes Activos"
                value={stats.microlots}
                icon={Package}
                color="bg-pink-500"
              />
            </div>
          </>
        )}

        {/* Gráficos */}
        {chartData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Crecimiento de Usuarios */}
            {chartData.userGrowth && chartData.userGrowth.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                  Crecimiento de Usuarios
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData.userGrowth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      stroke="#3B82F6"
                      strokeWidth={3}
                      name="Usuarios"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Producción Mensual */}
            {chartData.productionTrend && chartData.productionTrend.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Tendencia de Producción (kg)
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.productionTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="production" fill="#10B981" name="Producción (kg)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Distribución por Rol */}
            {chartData.subscriptionDistribution && chartData.subscriptionDistribution.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Distribución de Usuarios por Rol
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.subscriptionDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.subscriptionDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Fincas por Ubicación */}
            {chartData.farmsByLocation && chartData.farmsByLocation.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Fincas por Ubicación
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.farmsByLocation} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={100} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#F59E0B" name="Fincas" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Gastos por Categoría */}
            {chartData.expensesByCategory && chartData.expensesByCategory.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Gastos del Mes por Categoría
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={chartData.expensesByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${value.toLocaleString()}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData.expensesByCategory.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Distribución de Calidad */}
            {chartData.qualityDistribution && chartData.qualityDistribution.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Distribución de Calidad SCA
                </h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.qualityDistribution}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="grade" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#8B5CF6" name="Cantidad" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

<<<<<<< HEAD
        {/* Información del Sistema */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <Activity className="h-6 w-6 text-blue-600 mt-1" />
            <div>
              <h4 className="font-semibold text-blue-900 mb-1">
                Dashboard con 13 Métricas en Tiempo Real
              </h4>
              <p className="text-blue-800 text-sm">
                Todos los datos provienen de la base de datos. Incluye métricas de usuarios, fincas,
                producción, calidad y finanzas. Última actualización: {new Date().toLocaleString('es-ES')}
              </p>
=======
      {/* Gráficos */}
      {chartData && Array.isArray(chartData.subscriptionsByPlan) && Array.isArray(chartData.monthlyRevenue) && Array.isArray(chartData.userRegistrations) && (
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
                  data={chartData.subscriptionsByPlan}
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
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-500' : 'bg-blue-500'
                }`}></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{activity.user}</p>
                </div>
              </div>
              <span className="text-xs text-gray-500">{activity.time}</span>
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
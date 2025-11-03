import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import { adminHttpClient } from '../../utils/adminHttpClient';
import AdminApiTest from '../../components/admin/AdminApiTest';
import QuickActionsPanel from '../../components/admin/QuickActionsPanel';
import RealTimeNotifications from '../../components/admin/RealTimeNotifications';
import InteractiveWidgets from '../../components/admin/InteractiveWidgets';
import AdvancedFilters, { FilterOption, FilterValue } from '../../components/admin/AdvancedFilters';
import { useWidgetData } from '../../components/admin/InteractiveWidgets';
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
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  userRegistrations: Array<{ month: string; users: number; growers: number }>;
  monthlyRevenue: Array<{ month: string; revenue: number; subscriptions: number }>;
  subscriptionsByPlan: Array<{ name: string; value: number; color: string }>;
  paymentMethods: Array<{ method: string; count: number; percentage: number }>;
}

const AdminDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAdminStore();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [showApiTest, setShowApiTest] = useState(false);
  
  // Estados para filtros avanzados
  const [filterValues, setFilterValues] = useState<FilterValue>({});
  const [showAdvancedView, setShowAdvancedView] = useState(false);
  
  const { dashboardMetrics, fetchDashboardMetrics } = useAdminStore();
  const { widgets } = useWidgetData();

  // Configuración de filtros para el dashboard
  const dashboardFilters: FilterOption[] = [
    {
      key: 'period',
      label: 'Período',
      type: 'select',
      options: [
        { value: '7d', label: 'Últimos 7 días' },
        { value: '30d', label: 'Últimos 30 días' },
        { value: '90d', label: 'Últimos 90 días' },
        { value: '1y', label: 'Último año' }
      ]
    },
    {
      key: 'dateRange',
      label: 'Rango de Fechas',
      type: 'dateRange'
    },
    {
      key: 'userType',
      label: 'Tipo de Usuario',
      type: 'multiSelect',
      options: [
        { value: 'admin', label: 'Administradores' },
        { value: 'grower', label: 'Caficultores' },
        { value: 'buyer', label: 'Compradores' }
      ]
    },
    {
      key: 'region',
      label: 'Región',
      type: 'select',
      options: [
        { value: 'huila', label: 'Huila' },
        { value: 'nariño', label: 'Nariño' },
        { value: 'cauca', label: 'Cauca' },
        { value: 'tolima', label: 'Tolima' }
      ]
    }
  ];

  // Manejo de filtros
  const handleFilterChange = (values: FilterValue) => {
    setFilterValues(values);
    // Aplicar filtros a los datos
    if (values.period && values.period !== selectedPeriod) {
      setSelectedPeriod(values.period);
    }
  };

  const handleFilterReset = () => {
    setFilterValues({});
    setSelectedPeriod('30d');
  };
  
  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);
  
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🚀 Starting dashboard data load...');
      
      // Cargar métricas principales
      console.log('📊 Loading dashboard stats...');
      const metricsData = await adminHttpClient.get('/api/admin/dashboard/stats');
      console.log('✅ Dashboard stats loaded:', metricsData);
      
      setMetrics({
        totalUsers: metricsData.users,
        totalCoffeeGrowers: metricsData.users * 0.7, // Estimación
        totalFarms: metricsData.users * 0.5, // Estimación
        totalSubscriptions: metricsData.admins * 10, // Estimación
        monthlyRevenue: 15000,
        activePayments: 25,
        systemActivity: 85,
        growthRates: {
          users: 12.5,
          revenue: 8.3,
          subscriptions: 15.2
        }
      });
      
      // Cargar datos de gráficos
      console.log('📈 Loading chart data...');
      const chartData = await adminHttpClient.get(`/admin/dashboard/charts?period=${selectedPeriod}`);
      console.log('✅ Chart data loaded:', chartData);
      
      setChartData({
        userRegistrations: [
          { month: 'Oct', users: 10, growers: 8 },
          { month: 'Nov', users: 25, growers: 20 }
        ],
        monthlyRevenue: chartData.revenueData,
        subscriptionsByPlan: chartData.subscriptionDistribution.map((item: any, index: number) => ({
          name: item.name,
          value: item.value,
          color: ['#3B82F6', '#10B981', '#F59E0B'][index] || '#6B7280'
        })),
        paymentMethods: [
          { method: 'Tarjeta', count: 45, percentage: 60 },
          { method: 'Transferencia', count: 25, percentage: 33 },
          { method: 'Efectivo', count: 5, percentage: 7 }
        ]
      });
      
      console.log('🎉 Dashboard data loaded successfully!');
      
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando dashboard...</p>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Error al cargar el dashboard</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          onClick={loadDashboardData}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }
  
  const MetricCard: React.FC<{
    title: string;
    value: string | number;
    change?: number;
    icon: React.ComponentType<any>;
    color: string;
  }> = ({ title, value, change, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-2">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center mt-2 text-sm ${
              change >= 0 ? 'text-green-600' : 'text-red-600'
            }`}>
              {change >= 0 ? (
                <TrendingUp className="h-4 w-4 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 mr-1" />
              )}
              <span>{Math.abs(change)}%</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
  
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
                  title="Suscripciones Activas"
                  value={metrics.totalSubscriptions.toLocaleString()}
                  change={metrics.growthRates.subscriptions}
                  icon={CreditCard}
                  color="bg-purple-500"
                />
              </div>
            </div>
          )}

          {/* Métricas financieras */}
          {metrics && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div 
                onClick={() => navigate('/admin/payments')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <MetricCard
                  title="Ingresos Mensuales"
                  value={`$${metrics.monthlyRevenue.toLocaleString()}`}
                  change={metrics.growthRates.revenue}
                  icon={DollarSign}
                  color="bg-emerald-500"
                />
              </div>
              <div 
                onClick={() => navigate('/admin/payments')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <MetricCard
                  title="Pagos Activos"
                  value={metrics.activePayments.toLocaleString()}
                  icon={Activity}
                  color="bg-indigo-500"
                />
              </div>
              <div 
                onClick={() => navigate('/admin/analytics')}
                className="cursor-pointer transform hover:scale-105 transition-transform"
              >
                <MetricCard
                  title="Actividad del Sistema"
                  value={`${metrics.systemActivity}%`}
                  icon={Calendar}
                  color="bg-rose-500"
                />
              </div>
            </div>
          )}
        </>
      )}

      {/* API Test Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <button
          onClick={() => setShowApiTest(!showApiTest)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Pruebas de Integración API
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              Verificar conectividad y funcionalidad del backend
            </p>
          </div>
          {showApiTest ? (
            <ChevronUp className="h-5 w-5 text-gray-500" />
          ) : (
            <ChevronDown className="h-5 w-5 text-gray-500" />
          )}
        </button>
        
        {showApiTest && (
          <div className="border-t border-gray-200 p-4">
            <AdminApiTest />
          </div>
        )}
      </div>

      {/* Gráficos */}
      {chartData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Registros de usuarios */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Registros de Usuarios y Caficultores
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.userRegistrations}>
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
              <AreaChart data={chartData.monthlyRevenue}>
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
                  {chartData.subscriptionsByPlan.map((entry, index) => (
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
              <BarChart data={chartData.paymentMethods}>
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
            </div>
          ))}
        </div>
      </div>

      {/* Componente de notificaciones en tiempo real */}
      <RealTimeNotifications />
    </div>
  );
};

export default AdminDashboard;
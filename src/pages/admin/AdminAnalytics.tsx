import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { adminHttpClient } from '../../utils/adminHttpClient';
import {
  TrendingUp,
  TrendingDown,
  Users,
  MapPin,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Activity,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart
} from 'recharts';

interface AnalyticsData {
  userGrowth: Array<{
    date: string;
    totalUsers: number;
    newUsers: number;
    activeUsers: number;
  }>;
  revenueAnalytics: Array<{
    month: string;
    revenue: number;
    subscriptions: number;
    averageRevenue: number;
  }>;
  geographicDistribution: Array<{
    region: string;
    users: number;
    farms: number;
    percentage: number;
  }>;
  subscriptionTrends: Array<{
    plan: string;
    count: number;
    revenue: number;
    growth: number;
  }>;
  userBehavior: {
    averageSessionTime: number;
    bounceRate: number;
    pageViews: number;
    conversionRate: number;
  };
  topFeatures: Array<{
    feature: string;
    usage: number;
    satisfaction: number;
  }>;
}

const AdminAnalytics: React.FC = () => {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState('30d');
  const [selectedMetric, setSelectedMetric] = useState('users');

  useEffect(() => {
    loadAnalyticsData();
  }, [selectedPeriod]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await adminHttpClient.get(`/admin/analytics?period=${selectedPeriod}`);
      setAnalyticsData(data);
      
    } catch (error) {
      console.error('Error loading analytics data:', error);
      setError(error instanceof Error ? error.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const exportAnalytics = async (format: 'csv' | 'pdf') => {
    try {
      const response = await adminHttpClient.get(
        `/admin/analytics/export?format=${format}&period=${selectedPeriod}`,
        { responseType: 'blob' }
      );
      
      const url = window.URL.createObjectURL(new Blob([response]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-${selectedPeriod}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting analytics:', error);
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando analíticas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-800">
          <Activity className="h-5 w-5" />
          <span className="font-medium">Error al cargar analíticas</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
        <button
          onClick={loadAnalyticsData}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analíticas Avanzadas</h1>
          <p className="text-gray-600 mt-1">
            Análisis detallado del comportamiento y métricas del sistema
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
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
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => exportAnalytics('csv')}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>CSV</span>
            </button>
            <button
              onClick={() => exportAnalytics('pdf')}
              className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>PDF</span>
            </button>
          </div>
          
          <button
            onClick={loadAnalyticsData}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Métricas de comportamiento */}
      {analyticsData?.userBehavior && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tiempo de Sesión Promedio</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {Math.round(analyticsData.userBehavior.averageSessionTime / 60)}m
                </p>
              </div>
              <div className="p-3 rounded-full bg-blue-500">
                <Activity className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Rebote</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analyticsData.userBehavior.bounceRate}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-yellow-500">
                <TrendingDown className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Páginas Vistas</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analyticsData.userBehavior.pageViews.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-full bg-green-500">
                <BarChart3 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tasa de Conversión</p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {analyticsData.userBehavior.conversionRate}%
                </p>
              </div>
              <div className="p-3 rounded-full bg-purple-500">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crecimiento de usuarios */}
        {analyticsData?.userGrowth && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Crecimiento de Usuarios</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analyticsData.userGrowth}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="totalUsers"
                  fill="#3B82F6"
                  fillOpacity={0.3}
                  stroke="#3B82F6"
                  name="Total Usuarios"
                />
                <Bar dataKey="newUsers" fill="#10B981" name="Nuevos Usuarios" />
                <Line
                  type="monotone"
                  dataKey="activeUsers"
                  stroke="#F59E0B"
                  strokeWidth={2}
                  name="Usuarios Activos"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Analíticas de ingresos */}
        {analyticsData?.revenueAnalytics && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Analíticas de Ingresos</h3>
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={analyticsData.revenueAnalytics}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="revenue" fill="#10B981" name="Ingresos" />
                <Line
                  type="monotone"
                  dataKey="averageRevenue"
                  stroke="#EF4444"
                  strokeWidth={2}
                  name="Ingreso Promedio"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Distribución geográfica y tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución geográfica */}
        {analyticsData?.geographicDistribution && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución Geográfica</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={analyticsData.geographicDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ region, percentage }) => `${region} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="users"
                >
                  {analyticsData.geographicDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Tendencias de suscripciones */}
        {analyticsData?.subscriptionTrends && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tendencias de Suscripciones</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.subscriptionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="plan" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" name="Cantidad" />
                <Bar dataKey="revenue" fill="#10B981" name="Ingresos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Características más utilizadas */}
      {analyticsData?.topFeatures && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Características Más Utilizadas</h3>
          <div className="space-y-4">
            {analyticsData.topFeatures.map((feature, index) => (
              <div key={feature.feature} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{feature.feature}</h4>
                    <p className="text-sm text-gray-600">Uso: {feature.usage}%</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    Satisfacción: {feature.satisfaction}%
                  </p>
                  <div className="w-24 bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{ width: `${feature.satisfaction}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAnalytics;
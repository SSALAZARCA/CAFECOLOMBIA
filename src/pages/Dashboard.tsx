import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/apiClient';
import {
  Coffee,
  TrendingUp,
  MapPin,
  Calendar,
  Droplets,
  Thermometer,
  Leaf,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Package,
  Bell,
  Settings
} from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../hooks/useAuth';

interface DashboardData {
  user: {
    name: string;
    email: string;
    farmName: string;
  };
  farm: {
    totalArea: number;
    coffeeArea: number;
    location: string;
    altitude: number;
    address?: string;
  };
  production: {
    currentSeason: number;
    lastSeason: number;
    trend: 'up' | 'down' | 'stable';
  };
  weather: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'success';
    message: string;
    date: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    completed: boolean;
  }>;
}

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');

    if (!token || !userStr) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      const role = userData?.tipo_usuario || userData?.role;
      // Redirección eliminada para permitir ver el dashboard principal
      // if (coffeeGrowerRoles.includes(role)) {
      //   navigate('/finca', { replace: true });
      //   return;
      // }
    } catch (e) {
      console.error('Error checking role:', e);
    }

    // Cargar datos del dashboard
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      // Use standardized apiClient
      const response = await apiClient.get('/dashboard');

      if (response && (response.success || response.data)) {
        // Adapt response structure
        const data = response.data || response;
        setDashboardData(data);
      } else {
        console.error('API Error: Response invalid', response);
        setDashboardData(null);
      }
    } catch (error) {
      console.error("Error loading dashboard data", error);
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dashboardData) {
      console.log('📊 Dashboard Data State:', dashboardData);
    }
  }, [dashboardData]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      </Layout>
    );
  }

  if (!dashboardData || !dashboardData.user) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900">Error cargando datos</h2>
            <p className="text-gray-600">No se pudieron cargar los datos del dashboard. Recargue la página.</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        {/* Bienvenida */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenido, {dashboardData.user.name}
          </h2>
          <p className="text-gray-600">
            {dashboardData.user.farmName} - {dashboardData.farm.address ? `${dashboardData.farm.address}, ` : ''}{dashboardData.farm.location}
          </p>
        </div>

        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <Coffee className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Producción Actual</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.production.currentSeason.toLocaleString()} kg
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <MapPin className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Área Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.farm.totalArea} ha
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Thermometer className="h-6 w-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Temperatura</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.weather.temperature}°C
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Droplets className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Humedad</p>
                <p className="text-2xl font-bold text-gray-900">
                  {dashboardData.weather.humidity}%
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alertas */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Alertas Recientes</h3>
            </div>
            <div className="p-6">
              {dashboardData.alerts.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-start">
                      <div className={`p-1 rounded-full ${alert.type === 'warning' ? 'bg-yellow-100' :
                        alert.type === 'info' ? 'bg-blue-100' : 'bg-green-100'
                        }`}>
                        {alert.type === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : alert.type === 'info' ? (
                          <Bell className="h-4 w-4 text-blue-600" />
                        ) : (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {alert.message}
                        </p>
                        <p className="text-xs text-gray-500">{alert.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay alertas recientes</p>
              )}
            </div>
          </div>

          {/* Tareas Pendientes */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h3 className="text-lg font-medium text-gray-900">Tareas Pendientes</h3>
            </div>
            <div className="p-6">
              {dashboardData.tasks.length > 0 ? (
                <div className="space-y-4">
                  {dashboardData.tasks.filter(task => !task.completed).map((task) => (
                    <div key={task.id} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${task.priority === 'high' ? 'bg-red-500' :
                          task.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                          }`}></div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-900">
                            {task.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            Vence: {task.dueDate}
                          </p>
                        </div>
                      </div>
                      <Clock className="h-4 w-4 text-gray-400" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No hay tareas pendientes</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Settings,
  LogOut,
  Menu,
  X
} from 'lucide-react';

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
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar autenticación
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
      navigate('/login');
      return;
    }

    // Cargar datos del dashboard
    loadDashboardData();
  }, [navigate]);

  const loadDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        // Datos de ejemplo si no hay API
        setDashboardData({
          user: {
            name: 'Juan Pérez',
            email: 'juan@email.com',
            farmName: 'Finca El Paraíso'
          },
          farm: {
            totalArea: 5.5,
            coffeeArea: 4.2,
            location: 'Huila, Pitalito',
            altitude: 1650
          },
          production: {
            currentSeason: 2800,
            lastSeason: 2650,
            trend: 'up'
          },
          weather: {
            temperature: 22,
            humidity: 75,
            rainfall: 120
          },
          alerts: [
            {
              id: '1',
              type: 'warning',
              message: 'Riesgo de roya detectado en lote 3',
              date: '2024-01-15'
            },
            {
              id: '2',
              type: 'info',
              message: 'Próxima fertilización programada',
              date: '2024-01-20'
            }
          ],
          tasks: [
            {
              id: '1',
              title: 'Aplicar fungicida preventivo',
              dueDate: '2024-01-18',
              priority: 'high',
              completed: false
            },
            {
              id: '2',
              title: 'Revisar sistema de riego',
              dueDate: '2024-01-22',
              priority: 'medium',
              completed: false
            }
          ]
        });
      }
    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', path: '/dashboard', active: true },
    { icon: Coffee, label: 'Mi Finca', path: '/finca' },
    { icon: Package, label: 'Insumos', path: '/insumos' },
    { icon: Leaf, label: 'MIP', path: '/mip' },
    { icon: TrendingUp, label: 'Análisis de Mercado', path: '/analisis-mercado' },
    { icon: AlertTriangle, label: 'Alertas IA', path: '/alertas-ia' },
    { icon: Settings, label: 'Configuración', path: '/settings' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Error cargando datos</h2>
          <p className="text-gray-600">No se pudieron cargar los datos del dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar móvil */}
      <div className={`fixed inset-0 z-50 lg:hidden ${sidebarOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)}></div>
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white">
          <div className="flex h-16 items-center justify-between px-4 border-b">
            <div className="flex items-center">
              <Coffee className="h-8 w-8 text-green-600" />
              <span className="ml-2 text-lg font-semibold">Café Colombia</span>
            </div>
            <button onClick={() => setSidebarOpen(false)}>
              <X className="h-6 w-6" />
            </button>
          </div>
          <nav className="flex-1 px-4 py-4">
            {menuItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md mb-1 ${
                  item.active
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* Sidebar desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex h-16 items-center px-4 border-b">
            <Coffee className="h-8 w-8 text-green-600" />
            <span className="ml-2 text-lg font-semibold">Café Colombia</span>
          </div>
          <nav className="flex-1 px-4 py-4">
            {menuItems.map((item) => (
              <a
                key={item.path}
                href={item.path}
                className={`flex items-center px-4 py-2 text-sm font-medium rounded-md mb-1 ${
                  item.active
                    ? 'bg-green-100 text-green-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <item.icon className="mr-3 h-5 w-5" />
                {item.label}
              </a>
            ))}
          </nav>
          <div className="border-t p-4">
            <button
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-md"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <div className="flex items-center">
                <button
                  className="lg:hidden"
                  onClick={() => setSidebarOpen(true)}
                >
                  <Menu className="h-6 w-6" />
                </button>
                <h1 className="ml-4 lg:ml-0 text-xl font-semibold text-gray-900">
                  Dashboard
                </h1>
              </div>
              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-400 hover:text-gray-500">
                  <Bell className="h-6 w-6" />
                </button>
                <div className="flex items-center">
                  <div className="h-8 w-8 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {dashboardData.user.name.charAt(0)}
                    </span>
                  </div>
                  <span className="ml-2 text-sm font-medium text-gray-700 hidden sm:block">
                    {dashboardData.user.name}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Contenido del dashboard */}
        <main className="p-4 sm:p-6 lg:p-8">
          {/* Bienvenida */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900">
              Bienvenido, {dashboardData.user.name}
            </h2>
            <p className="text-gray-600">
              {dashboardData.user.farmName} - {dashboardData.farm.location}
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

          {/* Alertas y Tareas */}
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
                        <div className={`p-1 rounded-full ${
                          alert.type === 'warning' ? 'bg-yellow-100' :
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
                          <div className={`w-3 h-3 rounded-full ${
                            task.priority === 'high' ? 'bg-red-500' :
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
        </main>
      </div>
    </div>
  );
};

export default Dashboard;
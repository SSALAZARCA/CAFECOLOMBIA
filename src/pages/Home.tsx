import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Coffee, 
  MapPin, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Calendar,
  Thermometer,
  Loader2
} from 'lucide-react';
import { offlineDB } from '@/utils/offlineDB';
import { toast } from 'sonner';

interface DashboardStats {
  totalLots: number;
  activeLots: number;
  monthlyProduction: number;
  totalInventory: number;
  pendingTasks: number;
  completedTasks: number;
}

interface DashboardData {
  stats: DashboardStats;
  recentTasks: any[];
  alerts: any[];
  recentHarvests: any[];
  loading: boolean;
}

export default function Home() {
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    stats: {
      totalLots: 0,
      activeLots: 0,
      monthlyProduction: 0,
      totalInventory: 0,
      pendingTasks: 0,
      completedTasks: 0
    },
    recentTasks: [],
    alerts: [],
    recentHarvests: [],
    loading: true
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true }));

      // Cargar estadísticas
      const [lots, tasks, inventory, harvests, pestMonitoring] = await Promise.all([
        offlineDB.lots.toArray(),
        offlineDB.tasks.toArray(),
        offlineDB.inventory.toArray(),
        offlineDB.harvests.toArray(),
        offlineDB.pestMonitoring.toArray()
      ]);

      // Calcular estadísticas
      const activeLots = lots.filter(lot => lot.status === 'Producción').length;
      const pendingTasks = tasks.filter(task => task.status === 'Pendiente').length;
      const completedTasks = tasks.filter(task => task.status === 'Completada').length;
      
      // Calcular producción del mes actual
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const monthlyHarvests = harvests.filter(harvest => {
        const harvestDate = new Date(harvest.date);
        return harvestDate.getMonth() === currentMonth && harvestDate.getFullYear() === currentYear;
      });
      const monthlyProduction = monthlyHarvests.reduce((total, harvest) => total + harvest.quantity, 0);

      // Generar alertas basadas en datos reales
      const alerts = [];
      
      // Alertas de inventario bajo
      const lowStockItems = inventory.filter(item => item.quantity < 10);
      lowStockItems.forEach(item => {
        alerts.push({
          id: `stock-${item.id}`,
          tipo: 'insumo',
          mensaje: `Stock bajo de ${item.inputId}: ${item.quantity} ${item.unit}`,
          nivel: 'warning'
        });
      });

      // Alertas de plagas
      const highSeverityPests = pestMonitoring.filter(pest => pest.severity === 'Alto');
      highSeverityPests.forEach(pest => {
        alerts.push({
          id: `pest-${pest.id}`,
          tipo: 'plaga',
          mensaje: `${pest.pestType} detectada con severidad alta en lote ${pest.lotId}`,
          nivel: 'error'
        });
      });

      // Alertas de tareas vencidas
      const overdueTasks = tasks.filter(task => {
        const dueDate = new Date(task.dueDate);
        const today = new Date();
        return dueDate < today && task.status !== 'Completada';
      });
      overdueTasks.forEach(task => {
        alerts.push({
          id: `task-${task.id}`,
          tipo: 'tarea',
          mensaje: `Tarea vencida: ${task.title}`,
          nivel: 'warning'
        });
      });

      // Tareas recientes (próximas 7 días)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      const recentTasks = tasks
        .filter(task => {
          const dueDate = new Date(task.dueDate);
          return dueDate <= nextWeek && task.status !== 'Completada';
        })
        .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
        .slice(0, 5);

      setDashboardData({
        stats: {
          totalLots: lots.length,
          activeLots,
          monthlyProduction: Math.round(monthlyProduction / 1000 * 100) / 100, // Convertir a toneladas
          totalInventory: inventory.length,
          pendingTasks,
          completedTasks
        },
        recentTasks,
        alerts: alerts.slice(0, 5), // Mostrar solo las 5 alertas más importantes
        recentHarvests: monthlyHarvests.slice(0, 3),
        loading: false
      });

    } catch (error) {
      console.error('Error cargando datos del dashboard:', error);
      setDashboardData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleRegistrarCosecha = async () => {
    try {
      // Crear una nueva cosecha con datos básicos
      const newHarvest = {
        id: Date.now().toString(),
        lotId: '1', // Lote por defecto
        date: new Date().toISOString(),
        quantity: 0,
        qualityGrade: 'A',
        notes: 'Cosecha registrada desde acceso rápido',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await offlineDB.harvests.add(newHarvest);
      toast.success('Cosecha registrada exitosamente');
      loadDashboardData(); // Recargar datos
      navigate('/finca'); // Navegar a gestión de finca para editar detalles
    } catch (error) {
      console.error('Error registrando cosecha:', error);
      toast.error('Error al registrar cosecha');
    }
  };

  const handleAgregarInsumo = () => {
    navigate('/insumos');
    toast.info('Navegando a Control de Insumos');
  };

  const handleCrearReporte = async () => {
    try {
      // Generar un reporte básico con los datos actuales
      const reportData = {
        fecha: new Date().toLocaleDateString('es-CO'),
        totalLotes: dashboardData.stats.totalLots,
        lotesActivos: dashboardData.stats.activeLots,
        produccionMes: dashboardData.stats.monthlyProduction,
        inventarioTotal: dashboardData.stats.totalInventory,
        tareasPendientes: dashboardData.stats.pendingTasks,
        alertasActivas: dashboardData.alerts.length
      };

      // Simular descarga de reporte
      const reportContent = `
REPORTE FINCA EL PARAÍSO
Fecha: ${reportData.fecha}

ESTADÍSTICAS GENERALES:
- Total de lotes: ${reportData.totalLotes}
- Lotes activos: ${reportData.lotesActivos}
- Producción del mes: ${reportData.produccionMes} toneladas
- Productos en inventario: ${reportData.inventarioTotal}
- Tareas pendientes: ${reportData.tareasPendientes}
- Alertas activas: ${reportData.alertasActivas}

ALERTAS RECIENTES:
${dashboardData.alerts.map(alert => `- ${alert.mensaje}`).join('\n')}

TAREAS PRÓXIMAS:
${dashboardData.recentTasks.map(task => `- ${task.title} (${new Date(task.dueDate).toLocaleDateString()})`).join('\n')}
      `;

      // Crear y descargar archivo
      const blob = new Blob([reportContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-finca-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast.success('Reporte generado y descargado exitosamente');
    } catch (error) {
      console.error('Error generando reporte:', error);
      toast.error('Error al generar reporte');
    }
  };

  if (dashboardData.loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Cargando dashboard...</span>
        </div>
      </Layout>
    );
  }

  const estadisticas = [
    { 
      titulo: "Lotes Activos", 
      valor: dashboardData.stats.activeLots.toString(), 
      icon: MapPin, 
      color: "bg-blue-500",
      descripcion: "lotes en producción"
    },
    { 
      titulo: "Producción Mes", 
      valor: `${dashboardData.stats.monthlyProduction}`, 
      icon: Coffee, 
      color: "bg-amber-500",
      descripcion: "toneladas de café"
    },
    { 
      titulo: "Insumos", 
      valor: dashboardData.stats.totalInventory.toString(), 
      icon: Package, 
      color: "bg-green-500",
      descripcion: "productos disponibles"
    },
    { 
      titulo: "Tareas Pendientes", 
      valor: dashboardData.stats.pendingTasks.toString(), 
      icon: TrendingUp, 
      color: "bg-purple-500",
      descripcion: "por completar"
    }
  ];
  return (
    <Layout>
      <div className="space-y-6">
        {/* Header de la finca */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Finca El Paraíso</h1>
              <p className="text-gray-600 flex items-center mt-1">
                <MapPin className="h-4 w-4 mr-1" />
                Huila, Colombia • 15 hectáreas • {dashboardData.stats.totalLots} lotes registrados
              </p>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Thermometer className="h-4 w-4" />
              <span>24°C</span>
              <Calendar className="h-4 w-4 ml-4" />
              <span>{new Date().toLocaleDateString('es-CO')}</span>
            </div>
          </div>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {estadisticas.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center">
                  <div className={`${stat.color} p-3 rounded-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">{stat.titulo}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.valor}</p>
                    <p className="text-xs text-gray-500">{stat.descripcion}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Tareas pendientes */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Tareas Pendientes</h3>
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div className="space-y-3">
              {dashboardData.recentTasks.length > 0 ? (
                dashboardData.recentTasks.map((tarea) => (
                  <div key={tarea.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{tarea.title}</p>
                      <p className="text-sm text-gray-600">{new Date(tarea.dueDate).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      tarea.priority === 'Alta' ? 'bg-red-100 text-red-800' :
                      tarea.priority === 'Media' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {tarea.priority}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <p>¡No hay tareas pendientes!</p>
                </div>
              )}
            </div>
          </div>

          {/* Alertas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Alertas</h3>
              <AlertTriangle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="space-y-3">
              {dashboardData.alerts.length > 0 ? (
                dashboardData.alerts.map((alerta) => (
                  <div key={alerta.id} className={`p-3 rounded-lg border-l-4 ${
                    alerta.nivel === 'warning' ? 'bg-yellow-50 border-yellow-400' :
                    alerta.nivel === 'info' ? 'bg-blue-50 border-blue-400' :
                    'bg-red-50 border-red-400'
                  }`}>
                    <div className="flex items-start">
                      <AlertTriangle className={`h-5 w-5 mt-0.5 mr-3 ${
                        alerta.nivel === 'warning' ? 'text-yellow-600' :
                        alerta.nivel === 'info' ? 'text-blue-600' :
                        'text-red-600'
                      }`} />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{alerta.mensaje}</p>
                        <p className="text-xs text-gray-500 mt-1 capitalize">{alerta.tipo}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-400" />
                  <p>¡No hay alertas activas!</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Accesos rápidos */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Accesos Rápidos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/finca"
              className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-colors"
            >
              <div className="bg-blue-500 p-3 rounded-lg mb-2">
                <MapPin className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Gestión de Finca</span>
            </Link>

            <Link
              to="/analisis-mercado"
              className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-colors"
            >
              <div className="bg-emerald-500 p-3 rounded-lg mb-2">
                <TrendingUp className="h-6 w-6 text-white" />
              </div>
              <span className="text-sm font-medium text-gray-700">Análisis de Mercado</span>
            </Link>
            
            {[
              { titulo: "Registrar Cosecha", icon: Coffee, color: "bg-amber-500", action: handleRegistrarCosecha },
              { titulo: "Agregar Insumo", icon: Package, color: "bg-green-500", action: handleAgregarInsumo },
              { titulo: "Crear Reporte", icon: TrendingUp, color: "bg-purple-500", action: handleCrearReporte },
            ].map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={index}
                  onClick={item.action}
                  className="flex flex-col items-center p-4 rounded-lg border-2 border-dashed border-gray-300 hover:border-amber-400 hover:bg-amber-50 transition-colors"
                >
                  <div className={`${item.color} p-3 rounded-lg mb-2`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{item.titulo}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </Layout>
  );
}
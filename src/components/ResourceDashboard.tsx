import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import {
  Droplets,
  Leaf,
  Bug,
  TrendingUp,
  TrendingDown,
  DollarSign,
  TreePine,
  Target,
  Calendar,
  AlertTriangle
} from 'lucide-react';

interface ResourceDashboardProps {
  data: {
    water: any;
    fertilizer: any;
    pesticide: any;
    economic: any;
    sustainability: any;
  };
}

const ResourceDashboard: React.FC<ResourceDashboardProps> = ({ data }) => {
  // Datos para gráficos de consumo mensual
  const monthlyConsumptionData = [
    { month: 'Ene', water: 12000, fertilizer: 650, pesticide: 18, cost: 4200 },
    { month: 'Feb', water: 13500, fertilizer: 720, pesticide: 22, cost: 4800 },
    { month: 'Mar', water: 15000, fertilizer: 800, pesticide: 25, cost: 5200 },
    { month: 'Abr', water: 14200, fertilizer: 750, pesticide: 20, cost: 4900 },
    { month: 'May', water: 13800, fertilizer: 680, pesticide: 19, cost: 4600 },
    { month: 'Jun', water: 12500, fertilizer: 620, pesticide: 16, cost: 4100 }
  ];

  // Datos para distribución de costos
  const costDistributionData = [
    { name: 'Agua', value: 1200, color: '#3B82F6' },
    { name: 'Fertilizantes', value: 2800, color: '#10B981' },
    { name: 'Pesticidas', value: 1500, color: '#F59E0B' },
    { name: 'Mano de obra', value: 2200, color: '#8B5CF6' },
    { name: 'Energía', value: 800, color: '#EF4444' }
  ];

  // Datos para eficiencia por zona
  const zoneEfficiencyData = [
    { zone: 'Zona A', efficiency: 85, target: 90 },
    { zone: 'Zona B', efficiency: 78, target: 90 },
    { zone: 'Zona C', efficiency: 92, target: 90 },
    { zone: 'Zona D', efficiency: 88, target: 90 },
    { zone: 'Zona E', efficiency: 76, target: 90 }
  ];

  // Datos para tendencias de sostenibilidad
  const sustainabilityTrendData = [
    { month: 'Ene', carbon: 2.8, water: 18.5, biodiversity: 65 },
    { month: 'Feb', carbon: 2.6, water: 17.8, biodiversity: 68 },
    { month: 'Mar', carbon: 2.4, water: 17.2, biodiversity: 70 },
    { month: 'Abr', carbon: 2.3, water: 16.8, biodiversity: 72 },
    { month: 'May', carbon: 2.1, water: 16.2, biodiversity: 74 },
    { month: 'Jun', carbon: 2.0, water: 15.8, biodiversity: 76 }
  ];

  // Calcular métricas de resumen
  const calculateSummaryMetrics = () => {
    const currentMonth = monthlyConsumptionData[monthlyConsumptionData.length - 1];
    const previousMonth = monthlyConsumptionData[monthlyConsumptionData.length - 2];
    
    return {
      waterChange: ((currentMonth.water - previousMonth.water) / previousMonth.water * 100).toFixed(1),
      fertilizerChange: ((currentMonth.fertilizer - previousMonth.fertilizer) / previousMonth.fertilizer * 100).toFixed(1),
      pesticideChange: ((currentMonth.pesticide - previousMonth.pesticide) / previousMonth.pesticide * 100).toFixed(1),
      costChange: ((currentMonth.cost - previousMonth.cost) / previousMonth.cost * 100).toFixed(1)
    };
  };

  const summaryMetrics = calculateSummaryMetrics();

  // Renderizar tarjeta de métrica
  const renderMetricCard = (
    title: string,
    value: string | number,
    change: number,
    icon: React.ReactNode,
    color: string = 'blue'
  ) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            <div className="flex items-center mt-1">
              {change > 0 ? (
                <TrendingUp className="h-4 w-4 text-red-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-green-500 mr-1" />
              )}
              <span className={`text-sm ${change > 0 ? 'text-red-500' : 'text-green-500'}`}>
                {Math.abs(change)}%
              </span>
            </div>
          </div>
          <div className={`p-3 rounded-full bg-${color}-100`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Métricas de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderMetricCard(
          'Consumo de Agua',
          '12,500 L',
          parseFloat(summaryMetrics.waterChange),
          <Droplets className="h-6 w-6 text-blue-600" />,
          'blue'
        )}
        {renderMetricCard(
          'Uso de Fertilizantes',
          '620 kg',
          parseFloat(summaryMetrics.fertilizerChange),
          <Leaf className="h-6 w-6 text-green-600" />,
          'green'
        )}
        {renderMetricCard(
          'Aplicación de Pesticidas',
          '16 kg',
          parseFloat(summaryMetrics.pesticideChange),
          <Bug className="h-6 w-6 text-orange-600" />,
          'orange'
        )}
        {renderMetricCard(
          'Costo Total',
          '$4,100',
          parseFloat(summaryMetrics.costChange),
          <DollarSign className="h-6 w-6 text-green-600" />,
          'green'
        )}
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Consumo mensual */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Consumo Mensual de Recursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyConsumptionData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="water" fill="#3B82F6" name="Agua (L)" />
                <Bar dataKey="fertilizer" fill="#10B981" name="Fertilizantes (kg)" />
                <Bar dataKey="pesticide" fill="#F59E0B" name="Pesticidas (kg)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Distribución de costos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Distribución de Costos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={costDistributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {costDistributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value}`, 'Costo']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Eficiencia por zona y tendencias */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eficiencia por zona */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Eficiencia por Zona
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {zoneEfficiencyData.map((zone, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{zone.zone}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{zone.efficiency}%</span>
                      {zone.efficiency >= zone.target ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          Meta alcanzada
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                          Mejorar
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Progress value={zone.efficiency} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tendencias de sostenibilidad */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TreePine className="h-5 w-5" />
              Tendencias de Sostenibilidad
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={sustainabilityTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="carbon" 
                  stroke="#EF4444" 
                  strokeWidth={2}
                  name="Huella de Carbono (kg CO₂/kg)"
                />
                <Line 
                  type="monotone" 
                  dataKey="water" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Huella Hídrica (L/kg)"
                />
                <Line 
                  type="monotone" 
                  dataKey="biodiversity" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Índice Biodiversidad"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas y recomendaciones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alertas de recursos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Alertas de Recursos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 border border-yellow-200 rounded-lg bg-yellow-50">
                <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                <div>
                  <p className="font-medium text-yellow-800">Consumo de agua elevado</p>
                  <p className="text-sm text-yellow-700">Zona B supera el objetivo en 15%</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 p-3 border border-orange-200 rounded-lg bg-orange-50">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-800">Aplicación de fertilizantes</p>
                  <p className="text-sm text-orange-700">Programar aplicación en 3 días</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border border-blue-200 rounded-lg bg-blue-50">
                <Calendar className="h-5 w-5 text-blue-500 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800">Mantenimiento preventivo</p>
                  <p className="text-sm text-blue-700">Revisar sistema de riego Zona A</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Próximas acciones */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Próximas Acciones Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-green-500 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium">Optimizar riego nocturno</p>
                  <p className="text-sm text-gray-600">Ahorro estimado: 20% agua</p>
                </div>
                <Badge variant="outline">Hoy</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium">Aplicar fertilizante orgánico</p>
                  <p className="text-sm text-gray-600">Zona C - Etapa de floración</p>
                </div>
                <Badge variant="outline">3 días</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium">Monitoreo de plagas</p>
                  <p className="text-sm text-gray-600">Inspección semanal programada</p>
                </div>
                <Badge variant="outline">5 días</Badge>
              </div>

              <div className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-2 h-2 bg-purple-500 rounded-full" />
                <div className="flex-1">
                  <p className="font-medium">Análisis de suelo</p>
                  <p className="text-sm text-gray-600">Evaluación trimestral</p>
                </div>
                <Badge variant="outline">1 semana</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comparación con objetivos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Progreso hacia Objetivos Anuales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="mb-2">
                <Droplets className="h-8 w-8 text-blue-500 mx-auto" />
              </div>
              <h4 className="font-medium mb-2">Reducción de Agua</h4>
              <div className="text-2xl font-bold text-blue-600 mb-1">18%</div>
              <Progress value={72} className="h-2 mb-2" />
              <p className="text-sm text-gray-600">Meta: 25%</p>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <Leaf className="h-8 w-8 text-green-500 mx-auto" />
              </div>
              <h4 className="font-medium mb-2">Eficiencia Fertilizantes</h4>
              <div className="text-2xl font-bold text-green-600 mb-1">85%</div>
              <Progress value={85} className="h-2 mb-2" />
              <p className="text-sm text-gray-600">Meta: 90%</p>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <Bug className="h-8 w-8 text-orange-500 mx-auto" />
              </div>
              <h4 className="font-medium mb-2">Reducción Pesticidas</h4>
              <div className="text-2xl font-bold text-orange-600 mb-1">22%</div>
              <Progress value={73} className="h-2 mb-2" />
              <p className="text-sm text-gray-600">Meta: 30%</p>
            </div>

            <div className="text-center">
              <div className="mb-2">
                <TreePine className="h-8 w-8 text-green-500 mx-auto" />
              </div>
              <h4 className="font-medium mb-2">Sostenibilidad</h4>
              <div className="text-2xl font-bold text-green-600 mb-1">76</div>
              <Progress value={76} className="h-2 mb-2" />
              <p className="text-sm text-gray-600">Meta: 85</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResourceDashboard;

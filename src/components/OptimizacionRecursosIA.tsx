import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { Alert, AlertDescription } from './ui/alert';
import ResourceDashboard from './ResourceDashboard';
import { 
  Droplets, 
  Leaf, 
  Bug, 
  TrendingUp, 
  TrendingDown,
  DollarSign,
  TreePine,
  AlertTriangle,
  CheckCircle,
  Clock,
  BarChart3,
  Settings,
  Download,
  RefreshCw,
  Target,
  Award,
  Lightbulb
} from 'lucide-react';
import { toast } from 'sonner';
import {
  WaterOptimizationData,
  FertilizerOptimizationData,
  PesticideOptimizationData,
  EconomicAnalysis,
  SustainabilityMetrics
} from '../types/resourceOptimization';
import { OptimizationRecommendation } from '../types/aiServices';
import { waterOptimizationService } from '../services/waterOptimizationService';
import { fertilizerOptimizationService } from '../services/fertilizerOptimizationService';
import { pesticideOptimizationService } from '../services/pesticideOptimizationService';
import { economicOptimizationService } from '../services/economicOptimizationService';
import { sustainabilityMetricsService } from '../services/sustainabilityMetricsService';

interface OptimizationData {
  water: WaterOptimizationData | null;
  fertilizer: FertilizerOptimizationData | null;
  pesticide: PesticideOptimizationData | null;
  economic: EconomicAnalysis | null;
  sustainability: SustainabilityMetrics | null;
}

const OptimizacionRecursosIA: React.FC = () => {
  const [optimizationData, setOptimizationData] = useState<OptimizationData>({
    water: null,
    fertilizer: null,
    pesticide: null,
    economic: null,
    sustainability: null
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [farmArea] = useState(5.2); // Área de la finca en hectáreas
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Función para manejar cambios de tab de forma segura
  const handleTabChange = (tabId: string) => {
    try {
      const validTabs = ['overview', 'dashboard', 'water', 'fertilizer', 'pesticide', 'sustainability'];
      if (validTabs.includes(tabId)) {
        setActiveTab(tabId);
      } else {
        console.warn(`Tab inválido: ${tabId}`);
        setActiveTab('overview'); // Fallback a overview
      }
    } catch (err) {
      console.error('Error al cambiar tab:', err);
      setActiveTab('overview');
    }
  };

  // Cargar datos de optimización
  const loadOptimizationData = useCallback(async () => {
    setLoading(true);
    setError(null); // Limpiar errores previos
    try {
      // Simular datos actuales de la finca
      const currentData = {
        waterUsage: 15000, // Litros
        fertilizerUsage: 800, // kg
        pesticideUsage: 25, // kg
        energyConsumption: 2500, // kWh
        farmArea
      };

      // Cargar datos de cada servicio
      const [waterData, fertilizerData, pesticideData, economicData, sustainabilityData] = 
        await Promise.all([
          waterOptimizationService.optimizeWaterUsage(
            currentData.waterUsage,
            farmArea,
            'flowering',
            { temperature: 22, humidity: 75, precipitation: 120 }
          ),
          fertilizerOptimizationService.optimizeFertilizerUsage(
            farmArea,
            { nitrogen: 45, phosphorus: 25, potassium: 35, pH: 6.2, organicMatter: 3.5 },
            'flowering'
          ),
          pesticideOptimizationService.optimizePesticideUsage(
            farmArea,
            [
              { type: 'fungal', severity: 'medium', affected_area: 15 },
              { type: 'insect', severity: 'low', affected_area: 8 }
            ]
          ),
          economicOptimizationService.getEconomicAnalysis(
            currentData,
            farmArea
          ),
          sustainabilityMetricsService.calculateSustainabilityMetrics(
            currentData.waterUsage,
            currentData.fertilizerUsage,
            currentData.pesticideUsage,
            currentData.energyConsumption,
            farmArea
          )
        ]);

      setOptimizationData({
        water: waterData,
        fertilizer: fertilizerData,
        pesticide: pesticideData,
        economic: economicData,
        sustainability: sustainabilityData
      });

      setLastUpdate(new Date());
      toast.success('Datos de optimización actualizados correctamente');
    } catch (error) {
      console.error('Error loading optimization data:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setError(`Error al cargar datos: ${errorMessage}`);
      toast.error('Error al cargar los datos de optimización. Mostrando datos de ejemplo.');
      
      // Datos de fallback en caso de error
      setOptimizationData({
        water: {
          currentUsage: 15000,
          optimizedUsage: 12000,
          savings: { amount: 3000, percentage: 20 },
          efficiency: { overall: 'Buena', improvement: 15 },
          recommendations: [
            {
              id: 'water-1',
              category: 'water',
              priority: 'high',
              action: 'Instalar sistema de riego por goteo',
              description: 'Reducir consumo de agua en 20%',
              impact: 'high',
              cost: 500,
              timeframe: '2 semanas',
              savings: 200
            }
          ],
          schedule: [],
          qualityMetrics: { pH: 6.5, salinity: 0.3, temperature: 22 }
        },
        fertilizer: {
          currentUsage: { nitrogen: 45, phosphorus: 25, potassium: 35 },
          optimizedUsage: { nitrogen: 40, phosphorus: 22, potassium: 32 },
          soilAnalysis: { nitrogen: 45, phosphorus: 25, potassium: 35, pH: 6.2, organicMatter: 3.5 },
          recommendations: [
            {
              id: 'fert-1',
              category: 'fertilizer',
              priority: 'medium',
              action: 'Reducir nitrógeno en 10%',
              description: 'Optimizar aplicación de fertilizantes',
              impact: 'medium',
              cost: 100,
              timeframe: '1 semana',
              savings: 50
            }
          ],
          applicationSchedule: [],
          efficiency: 75
        },
        pesticide: {
          currentUsage: 25,
          optimizedUsage: 18,
          threatAnalysis: [
            { type: 'fungal', severity: 'medium', affected_area: 15 },
            { type: 'insect', severity: 'low', affected_area: 8 }
          ],
          recommendations: [
            {
              id: 'pest-1',
              category: 'pesticide',
              priority: 'high',
              action: 'Implementar control biológico',
              description: 'Reducir uso de pesticidas químicos',
              impact: 'high',
              cost: 200,
              timeframe: '3 semanas',
              savings: 150
            }
          ],
          applicationPlan: [],
          riskAssessment: { overall: 'medium', factors: [] }
        },
        economic: {
          currentCosts: {
            water: 300,
            fertilizer: 400,
            pesticide: 250,
            labor: 800,
            energy: 200,
            total: 1950
          },
          optimizedCosts: {
            water: 240,
            fertilizer: 350,
            pesticide: 180,
            labor: 750,
            energy: 180,
            total: 1700
          },
          savings: {
            water: 60,
            fertilizer: 50,
            pesticide: 70,
            labor: 50,
            energy: 20,
            total: 250
          },
          roi: 25,
          paybackPeriod: 6,
          recommendations: []
        },
        sustainability: {
          overallScore: 75,
          carbonFootprint: {
            current: 1200,
            optimized: 950,
            reduction: 250,
            reductionTarget: 300
          },
          waterFootprint: {
            current: 15000,
            optimized: 12000,
            efficiency: 80
          },
          biodiversityImpact: {
            score: 70,
            factors: ['Uso de pesticidas', 'Diversidad de cultivos'],
            improvements: ['Implementar corredores biológicos']
          },
          certificationStatus: {
            currentCertifications: ['organic'],
            availableCertifications: ['rainforest', 'fair_trade'],
            requirements: []
          },
          recommendations: [
            {
              id: 'sust-1',
              category: 'environmental',
              priority: 'medium',
              action: 'Implementar compostaje',
              description: 'Mejorar sostenibilidad ambiental',
              impact: 'medium',
              cost: 150,
              timeframe: '4 semanas',
              savings: 100
            }
          ]
        }
      });
    } finally {
      setLoading(false);
    }
  }, [farmArea]);

  // Cargar datos al montar el componente
  useEffect(() => {
    loadOptimizationData();
  }, [loadOptimizationData]);

  // Obtener todas las recomendaciones prioritarias
  const getPriorityRecommendations = (): OptimizationRecommendation[] => {
    const recommendations: OptimizationRecommendation[] = [];
    
    if (optimizationData.water?.recommendations) {
      recommendations.push(...optimizationData.water.recommendations.filter(r => r.priority === 'high'));
    }
    if (optimizationData.fertilizer?.recommendations) {
      recommendations.push(...optimizationData.fertilizer.recommendations.filter(r => r.priority === 'high'));
    }
    if (optimizationData.pesticide?.recommendations) {
      recommendations.push(...optimizationData.pesticide.recommendations.filter(r => r.priority === 'high'));
    }
    if (optimizationData.sustainability?.recommendations) {
      recommendations.push(...optimizationData.sustainability.recommendations.filter(r => r.priority === 'high'));
    }

    return recommendations.slice(0, 5); // Top 5 recomendaciones
  };

  // Calcular ahorros totales potenciales
  const getTotalSavings = () => {
    if (!optimizationData.economic || !optimizationData.economic.currentCosts || !optimizationData.economic.optimizedCosts) {
      return { cost: 0, percentage: 0 };
    }
    
    const currentCost = optimizationData.economic.currentCosts.total || 0;
    const optimizedCost = optimizationData.economic.optimizedCosts.total || 0;
    const savings = currentCost - optimizedCost;
    const percentage = currentCost > 0 ? (savings / currentCost) * 100 : 0;
    
    return { cost: savings, percentage };
  };

  // Renderizar tarjeta de resumen
  const renderSummaryCard = (
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
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm ${change > 0 ? 'text-green-500' : 'text-red-500'}`}>
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

  // Renderizar vista general
  const renderOverview = () => {
    const savings = getTotalSavings();
    const priorityRecommendations = getPriorityRecommendations();

    return (
      <div className="space-y-6">
        {/* Métricas principales */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {renderSummaryCard(
            'Ahorro Potencial',
            `$${savings.cost.toLocaleString()}`,
            savings.percentage,
            <DollarSign className="h-6 w-6 text-green-600" />,
            'green'
          )}
          {renderSummaryCard(
            'Puntuación Sostenibilidad',
            `${optimizationData.sustainability?.overallScore || 0}/100`,
            5.2,
            <TreePine className="h-6 w-6 text-green-600" />,
            'green'
          )}
          {renderSummaryCard(
            'Eficiencia Hídrica',
            optimizationData.water?.efficiency?.overall || 'N/A',
            optimizationData.water?.efficiency?.improvement || 0,
            <Droplets className="h-6 w-6 text-blue-600" />,
            'blue'
          )}
          {renderSummaryCard(
            'Reducción CO₂',
            `${optimizationData.sustainability?.carbonFootprint.reductionTarget || 0} kg`,
            12.5,
            <Leaf className="h-6 w-6 text-green-600" />,
            'green'
          )}
        </div>

        {/* Recomendaciones prioritarias */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              Recomendaciones Prioritarias
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {priorityRecommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-4 border rounded-lg">
                  <div className="flex-shrink-0">
                    {rec.category === 'water' && <Droplets className="h-5 w-5 text-blue-500" />}
                    {rec.category === 'fertilizer' && <Leaf className="h-5 w-5 text-green-500" />}
                    {rec.category === 'pesticide' && <Bug className="h-5 w-5 text-orange-500" />}
                    {rec.category === 'carbon' && <TreePine className="h-5 w-5 text-green-500" />}
                    {rec.category === 'environmental' && <Leaf className="h-5 w-5 text-green-500" />}
                    {rec.category === 'general' && <Target className="h-5 w-5 text-purple-500" />}
                    {rec.category === 'certification' && <Award className="h-5 w-5 text-yellow-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{rec.action}</h4>
                      <Badge variant={rec.priority === 'high' ? 'destructive' : 'secondary'}>
                        {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{rec.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>💰 ${(rec.implementation?.totalCost || 0).toLocaleString()}</span>
                      <span>⏱️ {rec.implementation?.totalDuration || 0} meses</span>
                      <span>📈 {rec.impact?.costSaving || rec.impact?.productionIncrease || 0}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Análisis económico */}
        {optimizationData.economic && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Análisis Económico
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h4 className="font-medium mb-2">Costos Actuales</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Agua:</span>
                      <span>${(optimizationData.economic?.currentCosts?.water || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fertilizantes:</span>
                      <span>${(optimizationData.economic?.currentCosts?.fertilizer || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pesticidas:</span>
                      <span>${(optimizationData.economic?.currentCosts?.pesticide || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>${(optimizationData.economic?.currentCosts?.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Costos Optimizados</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Agua:</span>
                      <span className="text-green-600">${(optimizationData.economic?.optimizedCosts?.water || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Fertilizantes:</span>
                      <span className="text-green-600">${(optimizationData.economic?.optimizedCosts?.fertilizer || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pesticidas:</span>
                      <span className="text-green-600">${(optimizationData.economic?.optimizedCosts?.pesticide || 0).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span className="text-green-600">${(optimizationData.economic?.optimizedCosts?.total || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">ROI Proyectado</h4>
                  <div className="space-y-2">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {optimizationData.economic?.roiAnalysis?.roi || 0}%
                      </div>
                      <div className="text-sm text-gray-600">ROI Anual</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-medium">
                        {optimizationData.economic?.roiAnalysis?.paybackPeriod || 0} meses
                      </div>
                      <div className="text-sm text-gray-600">Período de Retorno</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  // Renderizar vista de agua
  const renderWaterOptimization = () => {
    if (!optimizationData.water) return <div>Cargando datos de agua...</div>;

    const currentUsage = optimizationData.water.currentUsage || 0;
    const recommendedUsage = optimizationData.water.recommendedUsage || 0;
    const irrigationSchedule = optimizationData.water.irrigationSchedule || [];
    const recommendations = optimizationData.water.recommendations || [];

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Droplets className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Consumo Actual</p>
                  <p className="text-2xl font-bold">{currentUsage.toLocaleString()} L</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Consumo Óptimo</p>
                  <p className="text-2xl font-bold text-green-600">{recommendedUsage.toLocaleString()} L</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <TrendingDown className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Ahorro Potencial</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {currentUsage > 0 ? ((currentUsage - recommendedUsage) / currentUsage * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Programa de Riego Optimizado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {irrigationSchedule.map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{schedule?.time || 'N/A'}</p>
                      <p className="text-sm text-gray-600">Zona: {schedule?.zone || 'N/A'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{schedule?.duration || 0} min</p>
                    <p className="text-sm text-gray-600">{schedule?.volume || 0} L</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recomendaciones de Agua</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recommendations.map((rec, index) => (
                <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                  <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{rec?.action || 'Acción no especificada'}</p>
                    <p className="text-sm text-gray-600">{rec?.description || 'Sin descripción'}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={rec?.priority === 'high' ? 'destructive' : 'secondary'}>
                        {rec?.priority === 'high' ? 'Alta' : rec?.priority === 'medium' ? 'Media' : 'Baja'}
                      </Badge>
                      <span className="text-xs text-gray-500">{rec?.impact?.costSaving || rec?.impact?.productionIncrease || 'Impacto no especificado'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar vista de fertilizantes
  const renderFertilizerOptimization = () => {
    if (!optimizationData.fertilizer) return <div>Cargando datos de fertilizantes...</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Leaf className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Uso Actual</p>
                  <p className="text-2xl font-bold">{optimizationData.fertilizer.currentApplication?.total || 0} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Aplicación Óptima</p>
                  <p className="text-2xl font-bold text-green-600">{optimizationData.fertilizer.recommendedApplication?.total || 0} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Eficiencia</p>
                  <p className="text-2xl font-bold text-blue-600">{optimizationData.fertilizer.efficiency?.overall || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Análisis Nutricional</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="font-medium mb-3">Nitrógeno (N)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Actual:</span>
                    <span>{optimizationData.fertilizer.currentApplication?.nitrogen || 0} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Recomendado:</span>
                    <span className="text-green-600">{optimizationData.fertilizer.recommendedApplication?.nitrogen || 0} kg</span>
                  </div>
                  <Progress 
                    value={((optimizationData.fertilizer.recommendedApplication?.nitrogen || 0) / Math.max(optimizationData.fertilizer.currentApplication?.nitrogen || 1, 1)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Fósforo (P)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Actual:</span>
                    <span>{optimizationData.fertilizer.currentApplication?.phosphorus || 0} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Recomendado:</span>
                    <span className="text-green-600">{optimizationData.fertilizer.recommendedApplication?.phosphorus || 0} kg</span>
                  </div>
                  <Progress 
                    value={((optimizationData.fertilizer.recommendedApplication?.phosphorus || 0) / Math.max(optimizationData.fertilizer.currentApplication?.phosphorus || 1, 1)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Potasio (K)</h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Actual:</span>
                    <span>{optimizationData.fertilizer.currentApplication?.potassium || 0} kg</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Recomendado:</span>
                    <span className="text-green-600">{optimizationData.fertilizer.recommendedApplication?.potassium || 0} kg</span>
                  </div>
                  <Progress 
                    value={((optimizationData.fertilizer.recommendedApplication?.potassium || 0) / Math.max(optimizationData.fertilizer.currentApplication?.potassium || 1, 1)) * 100} 
                    className="h-2"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cronograma de Fertilización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(optimizationData.fertilizer.applicationSchedule || []).map((schedule, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium">{schedule.date}</p>
                      <p className="text-sm text-gray-600">{schedule.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{schedule.amount} kg</p>
                    <p className="text-sm text-gray-600">{schedule.method}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar vista de pesticidas
  const renderPesticideOptimization = () => {
    if (!optimizationData.pesticide) return <div>Cargando datos de pesticidas...</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Bug className="h-8 w-8 text-orange-500" />
                <div>
                  <p className="text-sm text-gray-600">Uso Actual</p>
                  <p className="text-2xl font-bold">{optimizationData.pesticide.currentUsage} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Target className="h-8 w-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Uso Optimizado</p>
                  <p className="text-2xl font-bold text-green-600">{optimizationData.pesticide.recommendedUsage} kg</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Eficiencia</p>
                  <p className="text-2xl font-bold text-blue-600">{optimizationData.pesticide.efficiency?.overall || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Análisis de Amenazas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(optimizationData.pesticide.threatAnalysis || []).map((threat, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      threat.severity === 'high' ? 'bg-red-500' :
                      threat.severity === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div>
                      <p className="font-medium capitalize">{threat.type}</p>
                      <p className="text-sm text-gray-600">Área afectada: {threat.affected_area}%</p>
                    </div>
                  </div>
                  <Badge variant={
                    threat.severity === 'high' ? 'destructive' :
                    threat.severity === 'medium' ? 'default' : 'secondary'
                  }>
                    {threat.severity === 'high' ? 'Alta' : 
                     threat.severity === 'medium' ? 'Media' : 'Baja'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan de Aplicación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {(optimizationData.pesticide.applicationPlan || []).map((plan, index) => (
                <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-orange-500" />
                    <div>
                      <p className="font-medium">{plan.date}</p>
                      <p className="text-sm text-gray-600">{plan.product}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{plan.dosage}</p>
                    <p className="text-sm text-gray-600">{plan.method}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizar vista de sostenibilidad
  const renderSustainability = () => {
    if (!optimizationData.sustainability) return <div>Cargando datos de sostenibilidad...</div>;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <TreePine className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Puntuación General</p>
                <p className="text-2xl font-bold text-green-600">{optimizationData.sustainability.overallScore}/100</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Leaf className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Huella de Carbono</p>
                <p className="text-2xl font-bold">{optimizationData.sustainability.carbonFootprint?.emissionsPerKgCoffee || 0}</p>
                <p className="text-xs text-gray-500">kg CO₂/kg café</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Droplets className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Huella Hídrica</p>
                <p className="text-2xl font-bold">{optimizationData.sustainability.waterFootprint?.waterPerKgCoffee || 0}</p>
                <p className="text-xs text-gray-500">L/kg café</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Bug className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-gray-600">Biodiversidad</p>
                <p className="text-2xl font-bold">{optimizationData.sustainability.biodiversityMetrics?.biodiversityIndex || 0}/100</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Objetivos de Sostenibilidad</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Neutralidad de Carbono</span>
                    <span className="text-sm text-gray-600">
                      {optimizationData.sustainability.sustainabilityGoals?.carbonNeutralTarget?.currentProgress || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={optimizationData.sustainability.sustainabilityGoals?.carbonNeutralTarget?.currentProgress || 0} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Meta: {optimizationData.sustainability.sustainabilityGoals?.carbonNeutralTarget?.targetYear || 'N/A'}
                  </p>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Reducción de Agua</span>
                    <span className="text-sm text-gray-600">
                      {optimizationData.sustainability.sustainabilityGoals?.waterReduction?.currentProgress || 0}%
                    </span>
                  </div>
                  <Progress 
                    value={optimizationData.sustainability.sustainabilityGoals?.waterReduction?.currentProgress || 0} 
                    className="h-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Meta: {optimizationData.sustainability.sustainabilityGoals?.waterReduction?.targetReduction || 0}% reducción
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estado de Certificaciones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium mb-2">Certificaciones Actuales</h4>
                  <div className="flex flex-wrap gap-2">
                    {(optimizationData.sustainability.certificationStatus?.currentCertifications || []).map((cert, index) => (
                      <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                        {cert.toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">En Proceso</h4>
                  <div className="flex flex-wrap gap-2">
                    {(optimizationData.sustainability.certificationStatus?.inProgress || []).map((cert, index) => (
                      <Badge key={index} variant="secondary" className="bg-yellow-100 text-yellow-800">
                        {cert.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-2">Elegibles</h4>
                  <div className="flex flex-wrap gap-2">
                    {(optimizationData.sustainability.certificationStatus?.eligible || []).map((cert, index) => (
                      <Badge key={index} variant="outline">
                        {cert.replace('_', ' ').toUpperCase()}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Desglose de Huella de Carbono</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {Object.entries(optimizationData.sustainability.carbonFootprint?.breakdown || {}).map(([category, value]) => (
                <div key={category} className="text-center">
                  <p className="text-2xl font-bold text-gray-700">{value}</p>
                  <p className="text-sm text-gray-600 capitalize">{category}</p>
                  <p className="text-xs text-gray-500">kg CO₂</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  // Renderizado principal con manejo de errores
  try {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Mostrar error si existe pero continuar con datos de fallback */}
        {error && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              {error} - Mostrando datos de ejemplo.
            </AlertDescription>
          </Alert>
        )}

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Optimización de Recursos IA</h1>
            <p className="text-gray-600 mt-1">
              Sistema inteligente para optimizar el uso de agua, fertilizantes y pesticidas
            </p>
            {lastUpdate && (
              <p className="text-sm text-gray-500 mt-1">
                Última actualización: {lastUpdate.toLocaleString()}
              </p>
            )}
          </div>
        <div className="flex gap-2">
          <Button
            onClick={loadOptimizationData}
            disabled={loading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Tabs de navegación */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resumen
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="water" className="flex items-center gap-2">
            <Droplets className="h-4 w-4" />
            Agua
          </TabsTrigger>
          <TabsTrigger value="fertilizer" className="flex items-center gap-2">
            <Leaf className="h-4 w-4" />
            Fertilizantes
          </TabsTrigger>
          <TabsTrigger value="pesticide" className="flex items-center gap-2">
            <Bug className="h-4 w-4" />
            Pesticidas
          </TabsTrigger>
          <TabsTrigger value="sustainability" className="flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Sostenibilidad
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          {renderOverview()}
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <ResourceDashboard data={optimizationData} />
        </TabsContent>

        <TabsContent value="water" className="mt-6">
          {renderWaterOptimization()}
        </TabsContent>

        <TabsContent value="fertilizer" className="mt-6">
          {renderFertilizerOptimization()}
        </TabsContent>

        <TabsContent value="pesticide" className="mt-6">
          {renderPesticideOptimization()}
        </TabsContent>

        <TabsContent value="sustainability" className="mt-6">
          {renderSustainability()}
        </TabsContent>
      </Tabs>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
            <span>Cargando datos de optimización...</span>
          </div>
        </div>
      )}
    </div>
  );
  } catch (renderError) {
    console.error('Error crítico en el renderizado:', renderError);
    return (
      <div className="p-6">
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            Error crítico en la aplicación. Por favor, recarga la página.
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={() => window.location.reload()}>
            Recargar Página
          </Button>
        </div>
      </div>
    );
  }
};

export default OptimizacionRecursosIA;

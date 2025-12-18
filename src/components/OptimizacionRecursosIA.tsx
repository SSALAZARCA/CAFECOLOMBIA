import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, Activity,
  Droplets, Sprout, AlertTriangle, ArrowRight,
  Leaf, Info
} from 'lucide-react';
import { economicOptimizationService } from '../services/economicOptimizationService';
import { waterOptimizationService } from '../services/waterOptimizationService';
import { EconomicAnalysis, EconomicRecommendation, WaterOptimizationData } from '../types/resourceOptimization';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

const OptimizacionRecursosIA: React.FC = () => {
  const navigate = useNavigate();
  const [showPlanModal, setShowPlanModal] = useState(false);

  // Economic State
  const [analysis, setAnalysis] = useState<EconomicAnalysis | null>(null);
  const [loading, setLoading] = useState(true);

  // Water State
  const [waterAnalysis, setWaterAnalysis] = useState<WaterOptimizationData | null>(null);
  const [loadingWater, setLoadingWater] = useState(false);

  const [activeTab, setActiveTab] = useState<'overview' | 'water' | 'fertilizer' | 'pesticide'>('overview');

  useEffect(() => {
    loadAnalysis();
  }, []);

  useEffect(() => {
    if (activeTab === 'water' && !waterAnalysis) {
      loadWaterAnalysis();
    }
  }, [activeTab]);

  const loadAnalysis = async () => {
    setLoading(true);
    try {
      // Usar un área promedio de finca para cálculos por hectárea si se requiere
      const data = await economicOptimizationService.getEconomicAnalysis({}, 5);
      setAnalysis(data);
    } catch (error) {
      console.error("Error cargando análisis económico:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadWaterAnalysis = async () => {
    setLoadingWater(true);
    try {
      // En un caso real, pasaríamos datos de sensores aquí.
      // Por ahora pasamos objeto vacío para que el servicio use datos 'reales' (fallback/historial)
      const data = await waterOptimizationService.optimizeWaterUsage({});
      setWaterAnalysis(data);
    } catch (error) {
      console.error("Error cargando análisis de agua:", error);
    } finally {
      setLoadingWater(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <Activity className="w-8 h-8 text-indigo-600 animate-spin mr-3" />
        <span className="text-gray-600 font-medium">Analizando datos financieros de la finca...</span>
      </div>
    );
  }

  if (!analysis) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(val);
  };

  const chartData = [
    {
      name: 'Agua/Riego',
      Actual: analysis.currentCosts.water,
      Optimizado: analysis.optimizedCosts.water,
    },
    {
      name: 'Fertilizantes',
      Actual: analysis.currentCosts.fertilizer,
      Optimizado: analysis.optimizedCosts.fertilizer,
    },
    {
      name: 'Pesticidas',
      Actual: analysis.currentCosts.pesticide,
      Optimizado: analysis.optimizedCosts.pesticide,
    }
  ];

  const savingsProjected = analysis.currentCosts.total - analysis.optimizedCosts.total;
  const savingsPercent = analysis.currentCosts.total > 0 ? (savingsProjected / analysis.currentCosts.total) * 100 : 0;

  // Modal Component for Implementation Plan
  const ImplementationPlanModal = () => (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Plan de Implementación</h3>
            <p className="text-sm text-gray-500">Cronograma sugerido para mejores resultados</p>
          </div>
          <button
            onClick={() => setShowPlanModal(false)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            ✕
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <div className="space-y-6">
            {analysis.recommendations.map((rec, idx) => (
              <div key={idx} className="relative pl-8 border-l-2 border-indigo-100 last:border-0">
                <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 border-white ${rec.priority === 'high' ? 'bg-red-500' :
                  rec.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}></div>
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 block">
                    {rec.timeframe === 'short-term' ? 'Esta Semana' : rec.timeframe === 'medium-term' ? 'Este Mes' : 'Largo Plazo'}
                  </span>
                  <h4 className="text-base font-bold text-gray-900">{rec.action}</h4>
                  <p className="text-sm text-gray-600 mt-1 mb-2">
                    {rec.risks[0]}
                  </p>
                  <div className="flex gap-3 text-xs">
                    <span className="px-2 py-1 bg-gray-100 rounded text-gray-700">Inv: {formatCurrency(rec.investment)}</span>
                    <span className="px-2 py-1 bg-green-50 text-green-700 font-medium">Retorno: {formatCurrency(rec.expectedReturn)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
          <button
            onClick={() => setShowPlanModal(false)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 relative">
      {showPlanModal && <ImplementationPlanModal />}

      {/* Header & KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Costo Actual */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute right-0 top-0 h-full w-1 bg-gray-200 group-hover:bg-gray-400 transition" />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Costo Operativo Actual</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(analysis.currentCosts.total)}</h3>
            </div>
            <div className="p-2 bg-gray-100 rounded-lg">
              <DollarSign className="w-5 h-5 text-gray-600" />
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <span>Ciclo actual (6 meses)</span>
          </div>
        </div>

        {/* Ahorro Proyectado */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute right-0 top-0 h-full w-1 bg-green-500 group-hover:bg-green-600 transition" />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Ahorro Potencial</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(savingsProjected)}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg">
              <TrendingDown className="w-5 h-5 text-green-600" />
            </div>
          </div>
          <div className="flex items-center text-xs mt-2">
            <span className="font-bold text-green-700 bg-green-100 px-2 py-0.5 rounded-full mr-2">
              -{savingsPercent.toFixed(1)}%
            </span>
            <span className="text-gray-500">vs. Costos actuales</span>
          </div>
        </div>

        {/* ROI Estimado */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className="absolute right-0 top-0 h-full w-1 bg-indigo-500 group-hover:bg-indigo-600 transition" />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">ROI de Optimización</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1">{analysis.roiAnalysis.roi.toFixed(1)}%</h3>
            </div>
            <div className="p-2 bg-indigo-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <span>Recuperación estimada: {Math.ceil(analysis.roiAnalysis.paybackPeriod)} meses</span>
          </div>
        </div>

        {/* Nivel de Riesgo */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition">
          <div className={`absolute right-0 top-0 h-full w-1 transition ${analysis.roiAnalysis.riskLevel === 'low' ? 'bg-green-500' :
            analysis.roiAnalysis.riskLevel === 'medium' ? 'bg-yellow-500' : 'bg-red-500'
            }`} />
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nivel de Riesgo</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-1 capitalize">
                {analysis.roiAnalysis.riskLevel === 'low' ? 'Bajo' :
                  analysis.roiAnalysis.riskLevel === 'medium' ? 'Medio' : 'Alto'}
              </h3>
            </div>
            <div className={`p-2 rounded-lg ${analysis.roiAnalysis.riskLevel === 'low' ? 'bg-green-50' :
              analysis.roiAnalysis.riskLevel === 'medium' ? 'bg-yellow-50' : 'bg-red-50'
              }`}>
              <AlertTriangle className={`w-5 h-5 ${analysis.roiAnalysis.riskLevel === 'low' ? 'text-green-600' :
                analysis.roiAnalysis.riskLevel === 'medium' ? 'text-yellow-600' : 'text-red-600'
                }`} />
            </div>
          </div>
          <div className="flex items-center text-xs text-gray-500 mt-2">
            <span>Evaluación financiera automática</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-gray-900">Análisis Comparativo de Costos</h3>

            <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >General</button>
              <button
                onClick={() => setActiveTab('water')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === 'water' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >Riego</button>
              <button
                onClick={() => setActiveTab('fertilizer')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === 'fertilizer' ? 'bg-white text-green-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >Fertilizantes</button>
              <button
                onClick={() => setActiveTab('pesticide')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition ${activeTab === 'pesticide' ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >Pesticidas</button>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              {activeTab === 'overview' ? (
                <BarChart data={chartData} barGap={10} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="Actual" fill="#9ca3af" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Optimizado" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              ) : analysis.currentCosts[activeTab] === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-6 bg-gray-50 rounded-lg border border-dashed border-gray-300">
                  <AlertTriangle className="w-8 h-8 text-yellow-500 mb-2" />
                  <h4 className="text-sm font-semibold text-gray-800">Sin Datos de {activeTab === 'water' ? 'Riego' : activeTab === 'fertilizer' ? 'Fertilizantes' : 'Pesticidas'}</h4>
                  <p className="text-xs text-gray-500 mt-1 max-w-xs">
                    No se encontraron registros de gastos en <code>offlineDB</code> para esta categoría.
                  </p>
                  <button
                    onClick={() => navigate('/insumos')}
                    className="mt-3 px-3 py-1.5 bg-white border border-gray-300 rounded text-xs text-gray-700 hover:bg-gray-50 font-medium shadow-sm transition"
                  >
                    + Registrar Gasto
                  </button>
                </div>
              ) : (
                <BarChart
                  data={[
                    {
                      name: activeTab === 'water' ? 'Riego' : activeTab === 'fertilizer' ? 'Fertilizantes' : 'Pesticidas',
                      Actual: analysis.currentCosts[activeTab],
                      Optimizado: analysis.optimizedCosts[activeTab],
                    }
                  ]}
                  barGap={10}
                  barSize={60}
                >
                  <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val / 1000}k`} />
                  <Tooltip
                    cursor={{ fill: '#f3f4f6' }}
                    formatter={(value: number) => [formatCurrency(value), '']}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="Actual" fill="#9ca3af" name="Costo Actual" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Optimizado" fill={activeTab === 'water' ? '#3b82f6' : activeTab === 'fertilizer' ? '#10b981' : '#f59e0b'} name="Costo Optimizado" radius={[4, 4, 0, 0]} />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-gray-500 mt-4">
            Comparativa basada en registros históricos reales de `offlineDB`. Los costos optimizados incluyen mejoras en eficiencia y eliminación de desperdicios.
          </p>
        </div>

        {/* Recommendations Feed */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            {activeTab === 'water' ? (
              <Droplets className="w-5 h-5 text-blue-600 mr-2" />
            ) : (
              <Leaf className="w-5 h-5 text-green-600 mr-2" />
            )}
            {activeTab === 'water' ? 'Recomendaciones de Riego' : 'Acciones Económicas'}
          </h3>

          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {activeTab === 'water' ? (
              loadingWater ? (
                <div className="flex justify-center p-4">
                  <Activity className="w-6 h-6 text-blue-500 animate-spin" />
                </div>
              ) : waterAnalysis && waterAnalysis.recommendations.length > 0 ? (
                waterAnalysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 border border-blue-100 rounded-lg hover:bg-blue-50 transition">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-2 ${rec.priority === 'critical' || rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                          rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                        Prioridad {rec.priority === 'critical' ? 'Crítica' : rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                      <span className="text-[10px] text-gray-400">{rec.method}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 leading-tight mb-1">
                      {rec.amount > 0 ? `Riego: ${rec.amount} L/m²` : 'Suspender Riego'}
                    </h4>
                    <p className="text-xs text-gray-500 mb-2">{rec.reasoning}</p>
                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs text-gray-500">
                        Horario: <span className="font-medium text-gray-800">{rec.timing}</span>
                      </div>
                      <div className="text-xs">
                        {rec.expectedSavings > 0 && (
                          <span className="font-bold text-green-600">Ahorro: {formatCurrency(rec.expectedSavings)}</span>
                        )}
                      </div>
                    </div>
                    {/* Strict Reality Button: If Missing Data */}
                    {rec.priority === 'critical' && rec.amount === 0 && (
                      <button
                        onClick={() => navigate('/insumos')} // Or appropriate route for sensor data
                        className="mt-2 w-full text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700"
                      >
                        Registrar Humedad
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center p-4 text-gray-500 text-sm">
                  No hay recomendaciones de riego activas.
                </div>
              )
            ) : (
              // Existing Economic Recommendations Logic
              analysis.recommendations.length > 0 ? (
                analysis.recommendations.map((rec, idx) => (
                  <div key={idx} className="p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition">
                    <div className="flex justify-between items-start">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full mb-2 ${rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                        Prioridad {rec.priority === 'high' ? 'Alta' : rec.priority === 'medium' ? 'Media' : 'Baja'}
                      </span>
                      <span className="text-[10px] text-gray-400">{rec.category}</span>
                    </div>
                    <h4 className="text-sm font-semibold text-gray-800 leading-tight mb-1">{rec.action}</h4>
                    <p className="text-xs text-gray-500 mb-2">{rec.risks[0]}</p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                      <div className="text-xs">
                        <span className="text-gray-400">Inv: </span>
                        <span className="font-medium text-gray-700">{formatCurrency(rec.investment)}</span>
                      </div>
                      <div className="text-xs">
                        <span className="text-gray-400">Retorno: </span>
                        <span className="font-bold text-green-600">{formatCurrency(rec.expectedReturn)}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : analysis.currentCosts.total === 0 ? (
                // ... Case No Data (same as before)
                <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400">
                  <Info className="w-8 h-8 mb-2 opacity-50 text-indigo-300" />
                  <p className="text-sm font-medium text-gray-600">No hay datos suficientes</p>
                  <p className="text-xs mt-1 max-w-[200px] text-gray-500">
                    Registre gastos y cosechas para generar un plan de implementación personalizado.
                  </p>
                  <button
                    onClick={() => navigate('/insumos')}
                    className="mt-3 text-xs text-indigo-600 border border-indigo-200 px-3 py-1 rounded-full hover:bg-indigo-50 transition"
                  >
                    Ir a Insumos
                  </button>
                </div>
              ) : (
                // ... Case Optimized (same as before)
                <div className="flex flex-col items-center justify-center h-40 text-center text-gray-400">
                  <Leaf className="w-8 h-8 mb-2 text-green-500" />
                  <p className="text-sm font-medium text-gray-800">¡Todo Optimizado!</p>
                  <p className="text-xs mt-1 text-gray-500">Sus costos y eficiencia están en niveles óptimos. No se requieren acciones correctivas por ahora.</p>
                </div>
              )
            )}
          </div>

          {activeTab !== 'water' && analysis.recommendations.length > 0 ? (
            <button
              onClick={() => setShowPlanModal(true)}
              className="w-full mt-4 text-xs font-semibold text-indigo-600 bg-indigo-50 py-2 rounded-lg hover:bg-indigo-100 transition flex items-center justify-center"
            >
              Ver Plan de Implementación <ArrowRight className="w-3 h-3 ml-1" />
            </button>
          ) : activeTab !== 'water' && analysis.currentCosts.total === 0 ? (
            <button
              className="w-full mt-4 text-xs font-semibold text-gray-400 bg-gray-100 py-2 rounded-lg cursor-not-allowed flex items-center justify-center"
              disabled
            >
              Sin datos para plan <Info className="w-3 h-3 ml-1" />
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default OptimizacionRecursosIA;
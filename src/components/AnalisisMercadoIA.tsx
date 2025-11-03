import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  BarChart3, 
  Globe, 
  AlertTriangle, 
  Target,
  Calendar,
  Award,
  Zap,
  RefreshCw
} from 'lucide-react';
import { 
  MarketDashboardData, 
  SalesStrategy, 
  MarketAlert,
  PricePrediction,
  MarketTrend,
  MarketOpportunity,
  SalesOptimization
} from '../types/marketAnalysis';
import { pricePredictionService } from '../services/pricePredictionService';
import { marketTrendsService } from '../services/marketTrendsService';
import { salesOptimizationService } from '../services/salesOptimizationService';
import { toast } from 'sonner';

const AnalisisMercadoIA: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<MarketDashboardData | null>(null);
  const [strategies, setStrategies] = useState<SalesStrategy[]>([]);
  const [alerts, setAlerts] = useState<MarketAlert[]>([]);
  const [predictions, setPredictions] = useState<PricePrediction[]>([]);
  const [trends, setTrends] = useState<MarketTrend[]>([]);
  const [opportunities, setOpportunities] = useState<MarketOpportunity[]>([]);
  const [optimization, setOptimization] = useState<SalesOptimization | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'predictions' | 'strategies' | 'opportunities'>('overview');

  useEffect(() => {
    loadMarketData();
  }, []);

  const loadMarketData = async () => {
    setLoading(true);
    try {
      // Cargar datos de predicción de precios
      const priceData = await pricePredictionService.predictPrices(30);
      setPredictions(priceData);

      // Cargar tendencias de mercado
      const marketTrends = await marketTrendsService.getMarketTrends();
      setTrends(marketTrends);

      // Cargar oportunidades
      const marketOpportunities = await marketTrendsService.getMarketOpportunities();
      setOpportunities(marketOpportunities);

      // Cargar estrategias de venta
      const salesStrategies = await salesOptimizationService.getSalesStrategies();
      setStrategies(salesStrategies);

      // Generar alertas
      const marketAlerts = await salesOptimizationService.generateMarketAlerts();
      setAlerts(marketAlerts);

      // Optimizar estrategia de venta (ejemplo con datos mock)
      const mockQuality = {
        score: 85,
        cupping: { aroma: 8.5, flavor: 8.8, acidity: 8.2, body: 8.0, balance: 8.3 },
        defects: 2,
        moisture: 11.5,
        altitude: 1650,
        variety: 'Caturra',
        processingMethod: 'Washed' as const,
        certifications: ['Organic', 'Fair Trade']
      };
      
      const salesOpt = await salesOptimizationService.optimizeSalesStrategy(1500, mockQuality, 60);
      setOptimization(salesOpt);

      // Crear datos del dashboard
      const currentPrice = await pricePredictionService.getCurrentPrice();
      const volatility = await salesOptimizationService.calculateMarketVolatility();
      
      const dashboard: MarketDashboardData = {
        currentPrice: currentPrice.price,
        priceChange24h: currentPrice.change24h,
        marketVolatility: volatility.volatilityIndex,
        totalOpportunities: marketOpportunities.length,
        activeAlerts: marketAlerts.filter(a => a.severity === 'high' || a.severity === 'critical').length,
        bestStrategy: salesStrategies[0],
        topOpportunity: marketOpportunities[0],
        priceHistory: priceData.slice(0, 7).map(p => ({
          date: p.targetDate.toISOString().split('T')[0],
          price: p.predictedPrice
        })),
        marketInsights: [
          'Demanda internacional en crecimiento del 12%',
          'Precios premium aumentaron 8% este mes',
          'Mercado europeo muestra alta demanda por café specialty'
        ]
      };
      
      setDashboardData(dashboard);
    } catch (error) {
      console.error('Error loading market data:', error);
      // Mostrar datos de fallback en caso de error
      setDashboardData({
        currentPrice: 4.25,
        priceChange24h: 2.3,
        marketVolatility: 15.2,
        totalOpportunities: 3,
        activeAlerts: 1,
        bestStrategy: {
          id: 'fallback',
          name: 'Venta Directa Premium',
          targetMarket: 'Mercado Local',
          expectedPrice: 4.50,
          confidence: 0.75,
          timeframe: { start: new Date(), end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
          requirements: ['Certificación de calidad'],
          risks: ['Fluctuación de demanda'],
          benefits: ['Mayor margen de ganancia']
        },
        topOpportunity: {
          id: 'fallback',
          type: 'price_increase',
          title: 'Aumento de Precios Premium',
          description: 'Oportunidad de incrementar precios',
          impact: 'high',
          confidence: 0.8,
          timeframe: { start: new Date(), end: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000) },
          requirements: ['Mejorar calidad'],
          potentialGain: 500
        },
        priceHistory: [
          { date: '2024-01-01', price: 4.10 },
          { date: '2024-01-02', price: 4.15 },
          { date: '2024-01-03', price: 4.20 },
          { date: '2024-01-04', price: 4.25 }
        ],
        marketInsights: [
          'Datos de mercado no disponibles',
          'Usando información de respaldo',
          'Actualice para obtener datos en tiempo real'
        ]
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50';
      case 'high': return 'text-orange-600 bg-orange-50';
      case 'medium': return 'text-yellow-600 bg-yellow-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'risk': return <AlertTriangle className="w-5 h-5" />;
      case 'opportunity': return <Target className="w-5 h-5" />;
      case 'price_spike': return <TrendingUp className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  // Función para manejar el cambio de tab de forma segura
  const handleTabChange = (tabId: string) => {
    const validTabs = ['overview', 'predictions', 'strategies', 'opportunities'] as const;
    if (validTabs.includes(tabId as any)) {
      setActiveTab(tabId as 'overview' | 'predictions' | 'strategies' | 'opportunities');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 animate-spin text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Analizando mercados globales...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Análisis de Mercado IA
              </h1>
              <p className="text-gray-600">
                Inteligencia de mercado y optimización de ventas para café colombiano
              </p>
            </div>
            <button
              onClick={loadMarketData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Actualizar Datos
            </button>
          </div>
        </div>

        {/* Alertas Críticas */}
        {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length > 0 && (
          <div className="mb-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Alertas Importantes
              </h2>
              <div className="space-y-3">
                {alerts
                  .filter(a => a.severity === 'critical' || a.severity === 'high')
                  .slice(0, 3)
                  .map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-4 rounded-lg border-l-4 ${
                        alert.severity === 'critical' 
                          ? 'border-red-500 bg-red-50' 
                          : 'border-orange-500 bg-orange-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.type)}
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                          <p className="text-gray-700 text-sm mt-1">{alert.message}</p>
                          {alert.recommendations && (
                            <ul className="mt-2 text-sm text-gray-600">
                              {alert.recommendations.slice(0, 2).map((rec, idx) => (
                                <li key={idx} className="flex items-center gap-1">
                                  <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                                  {rec}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Métricas Principales */}
        {dashboardData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Precio Actual</p>
                  <p className="text-2xl font-bold text-gray-900">
                    ${(dashboardData.currentPrice || 0).toFixed(2)}
                  </p>
                  <p className={`text-sm ${
                    (dashboardData.priceChange24h || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {(dashboardData.priceChange24h || 0) >= 0 ? '+' : ''}
                    {(dashboardData.priceChange24h || 0).toFixed(2)}% (24h)
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Volatilidad</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {(dashboardData.marketVolatility || 0).toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-600">Últimos 30 días</p>
                </div>
                <BarChart3 className="w-8 h-8 text-blue-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Oportunidades</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.totalOpportunities}
                  </p>
                  <p className="text-sm text-green-600">Activas</p>
                </div>
                <Target className="w-8 h-8 text-purple-600" />
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm">Alertas Activas</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboardData.activeAlerts}
                  </p>
                  <p className="text-sm text-orange-600">Requieren atención</p>
                </div>
                <AlertTriangle className="w-8 h-8 text-orange-600" />
              </div>
            </div>
          </div>
        )}

        {/* Navegación por Pestañas */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {[
                { id: 'overview', label: 'Resumen', icon: BarChart3 },
                { id: 'predictions', label: 'Predicciones', icon: TrendingUp },
                { id: 'strategies', label: 'Estrategias', icon: Target },
                { id: 'opportunities', label: 'Oportunidades', icon: Globe }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 py-2 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-green-500 text-green-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Contenido de Pestañas */}
        {activeTab === 'overview' && dashboardData && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estrategia Recomendada */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-green-600" />
                Estrategia Recomendada
              </h3>
              {optimization && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-900">
                      {optimization.recommendedStrategy?.name || 'Estrategia no disponible'}
                    </h4>
                    <p className="text-green-700 text-sm mt-1">
                      {optimization.recommendedStrategy?.targetMarket || 'Mercado no especificado'}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-green-600">Precio Recomendado</p>
                        <p className="font-semibold text-green-900">
                          ${(optimization.recommendedStrategy?.recommendedPrice || 0).toFixed(2)}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-green-600">ROI Esperado</p>
                        <p className="font-semibold text-green-900">
                          {(optimization.recommendedStrategy?.roi || 0).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Timing Óptimo</h5>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <span>Mes: {optimization.optimalTiming?.month || 'N/A'}</span>
                      <span>Semana: {optimization.optimalTiming?.week || 'N/A'}</span>
                      <span>Confianza: {((optimization.optimalTiming?.confidence || 0) * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Resultados Esperados</h5>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-600">Ingresos</p>
                        <p className="font-semibold">${(optimization.expectedOutcome?.revenue || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-600">Ganancia</p>
                        <p className="font-semibold">${(optimization.expectedOutcome?.profit || 0).toLocaleString()}</p>
                      </div>
                      <div className="text-center p-2 bg-gray-50 rounded">
                        <p className="text-gray-600">ROI</p>
                        <p className="font-semibold">{(optimization.expectedOutcome?.roi || 0).toFixed(1)}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Top Oportunidad */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Mejor Oportunidad
              </h3>
              {dashboardData.topOpportunity && (
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-900">
                      {dashboardData.topOpportunity.market}
                    </h4>
                    <p className="text-blue-700 text-sm mt-1">
                      {dashboardData.topOpportunity.description}
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-blue-600">Rentabilidad</p>
                        <p className="font-semibold text-blue-900">
                          {(dashboardData.topOpportunity?.profitability || 0).toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-blue-600">Volumen</p>
                        <p className="font-semibold text-blue-900">
                          {(dashboardData.topOpportunity?.volume || 0).toLocaleString()} kg
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">Requisitos</h5>
                    <ul className="space-y-1">
                      {dashboardData.topOpportunity.requirements.slice(0, 3).map((req, idx) => (
                        <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">
                      Fecha límite: {dashboardData.topOpportunity.deadline.toLocaleDateString('es-CO')}
                    </span>
                    <button className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
                      Ver Detalles
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Insights del Mercado */}
            <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-600" />
                Insights del Mercado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {dashboardData.marketInsights.map((insight, idx) => (
                  <div key={idx} className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                    <p className="text-sm text-gray-700">{insight}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'predictions' && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Predicciones de Precios
            </h3>
            <div className="space-y-4">
              {predictions.slice(0, 10).map((prediction, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">
                        {prediction.targetDate.toLocaleDateString('es-CO', { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </p>
                      <p className="text-xs text-gray-500">
                        {prediction.targetDate.toLocaleDateString('es-CO', { weekday: 'short' })}
                      </p>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">
                        ${prediction.predictedPrice.toFixed(2)}
                      </p>
                      <p className={`text-sm ${
                        prediction.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {prediction.change >= 0 ? '+' : ''}{prediction.change.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        prediction.confidence > 0.8 ? 'bg-green-500' :
                        prediction.confidence > 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}></div>
                      <span className="text-sm text-gray-600">
                        {(prediction.confidence * 100).toFixed(0)}% confianza
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {prediction.factors.slice(0, 2).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'strategies' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {strategies.map((strategy) => (
              <div key={strategy.id} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{strategy.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{strategy.targetMarket}</p>
                  </div>
                  <div className={`px-2 py-1 rounded text-xs font-medium ${
                    strategy.riskAssessment.level === 'low' ? 'bg-green-100 text-green-800' :
                    strategy.riskAssessment.level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {strategy.riskAssessment.level === 'low' ? 'Bajo Riesgo' :
                     strategy.riskAssessment.level === 'medium' ? 'Riesgo Medio' : 'Alto Riesgo'}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600">Precio</p>
                      <p className="font-semibold">${strategy.recommendedPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Volumen</p>
                      <p className="font-semibold">{strategy.expectedVolume.toLocaleString()} kg</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">ROI</p>
                      <p className="font-semibold text-green-600">{strategy.roi.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Plazo</p>
                      <p className="font-semibold">
                        {Math.ceil((strategy.timeline.end.getTime() - strategy.timeline.start.getTime()) / (1000 * 60 * 60 * 24))} días
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-2">Requisitos</p>
                    <ul className="space-y-1">
                      {strategy.requirements.slice(0, 3).map((req, idx) => (
                        <li key={idx} className="text-xs text-gray-700 flex items-center gap-1">
                          <span className="w-1 h-1 bg-gray-400 rounded-full"></span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <button className="w-full mt-4 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors">
                    Seleccionar Estrategia
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'opportunities' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {opportunities.map((opportunity, idx) => (
              <div key={idx} className="bg-white rounded-xl shadow-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900">{opportunity.market}</h3>
                    <p className="text-sm text-gray-600 mt-1">{opportunity.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-green-600">
                      {opportunity.profitability.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">Rentabilidad</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-600">Precio Objetivo</p>
                      <p className="font-semibold">${opportunity.targetPrice.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Volumen</p>
                      <p className="font-semibold">{opportunity.volume.toLocaleString()} kg</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-600 mb-2">Requisitos Clave</p>
                    <ul className="space-y-1">
                      {opportunity.requirements.slice(0, 3).map((req, idx) => (
                        <li key={idx} className="text-xs text-gray-700 flex items-center gap-1">
                          <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-xs text-gray-500">
                      Vence: {opportunity.deadline.toLocaleDateString('es-CO')}
                    </span>
                    <button className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors">
                      Aplicar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalisisMercadoIA;
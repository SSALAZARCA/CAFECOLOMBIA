import React, { useState, useEffect } from 'react';
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
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Globe, 
  Calendar,
  Target,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import { pricePredictionService } from '../services/pricePredictionService';
import { marketTrendsService } from '../services/marketTrendsService';
import { salesOptimizationService } from '../services/salesOptimizationService';

interface ChartData {
  priceHistory: Array<{ date: string; price: number; volume: number }>;
  marketTrends: Array<{ market: string; growth: number; share: number }>;
  profitabilityByStrategy: Array<{ strategy: string; roi: number; risk: number }>;
  seasonalData: Array<{ month: string; demand: number; price: number; optimal: number }>;
  competitorAnalysis: Array<{ competitor: string; price: number; quality: number; market_share: number }>;
}

const MarketDashboard: React.FC = () => {
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, [selectedTimeframe]);

  const loadChartData = async () => {
    setLoading(true);
    try {
      // Generar datos históricos de precios
      const days = selectedTimeframe === '7d' ? 7 : selectedTimeframe === '30d' ? 30 : selectedTimeframe === '90d' ? 90 : 365;
      const priceHistory = [];
      const baseDate = new Date();
      
      for (let i = days; i >= 0; i--) {
        const date = new Date(baseDate.getTime() - i * 24 * 60 * 60 * 1000);
        const price = 4.5 + Math.sin(i * 0.1) * 0.5 + Math.random() * 0.3;
        const volume = 1000 + Math.random() * 500;
        
        priceHistory.push({
          date: date.toLocaleDateString('es-CO', { month: 'short', day: 'numeric' }),
          price: Number(price.toFixed(2)),
          volume: Math.round(volume)
        });
      }

      // Datos de tendencias de mercado
      const marketTrends = [
        { market: 'Europa', growth: 12.5, share: 35 },
        { market: 'América del Norte', growth: 8.3, share: 28 },
        { market: 'Asia', growth: 18.7, share: 22 },
        { market: 'América Latina', growth: 5.2, share: 15 }
      ];

      // Rentabilidad por estrategia
      const strategies = await salesOptimizationService.getSalesStrategies();
      const profitabilityByStrategy = strategies.map(strategy => ({
        strategy: strategy.name.replace('Estrategia ', ''),
        roi: strategy.roi,
        risk: strategy.riskAssessment.level === 'low' ? 20 : 
              strategy.riskAssessment.level === 'medium' ? 50 : 80
      }));

      // Datos estacionales
      const seasonalData = [
        { month: 'Ene', demand: 85, price: 4.8, optimal: 90 },
        { month: 'Feb', demand: 88, price: 4.9, optimal: 85 },
        { month: 'Mar', demand: 75, price: 4.3, optimal: 70 },
        { month: 'Abr', demand: 70, price: 4.1, optimal: 65 },
        { month: 'May', demand: 68, price: 4.0, optimal: 60 },
        { month: 'Jun', demand: 72, price: 4.2, optimal: 65 },
        { month: 'Jul', demand: 78, price: 4.4, optimal: 75 },
        { month: 'Ago', demand: 82, price: 4.6, optimal: 80 },
        { month: 'Sep', demand: 90, price: 5.0, optimal: 95 },
        { month: 'Oct', demand: 95, price: 5.2, optimal: 100 },
        { month: 'Nov', demand: 92, price: 5.1, optimal: 95 },
        { month: 'Dic', demand: 88, price: 4.9, optimal: 90 }
      ];

      // Análisis de competidores
      const competitorAnalysis = [
        { competitor: 'Café Premium A', price: 5.8, quality: 88, market_share: 25 },
        { competitor: 'Café Premium B', price: 5.2, quality: 85, market_share: 20 },
        { competitor: 'Café Comercial A', price: 4.1, quality: 75, market_share: 30 },
        { competitor: 'Café Comercial B', price: 3.9, quality: 72, market_share: 15 },
        { competitor: 'Tu Café', price: 4.8, quality: 86, market_share: 10 }
      ];

      setChartData({
        priceHistory,
        marketTrends,
        profitabilityByStrategy,
        seasonalData,
        competitorAnalysis
      });
    } catch (error) {
      console.error('Error loading chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

  if (loading || !chartData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 animate-pulse text-green-600 mx-auto mb-4" />
              <p className="text-gray-600">Generando análisis de mercado...</p>
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
                Dashboard de Mercado
              </h1>
              <p className="text-gray-600">
                Análisis visual de tendencias, precios y oportunidades
              </p>
            </div>
            
            {/* Selector de tiempo */}
            <div className="flex items-center gap-2">
              {(['7d', '30d', '90d', '1y'] as const).map((timeframe) => (
                <button
                  key={timeframe}
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className={`px-3 py-1 text-sm rounded-lg transition-colors ${
                    selectedTimeframe === timeframe
                      ? 'bg-green-600 text-white'
                      : 'bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {timeframe}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Gráficos Principales */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Evolución de Precios */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Evolución de Precios
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="w-4 h-4" />
                USD por libra
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData.priceHistory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={['dataMin - 0.1', 'dataMax + 0.1']} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'price' ? `$${value}` : value,
                    name === 'price' ? 'Precio' : 'Volumen'
                  ]}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#10B981" 
                  fill="#10B981" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Participación de Mercado */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                Mercados Globales
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <PieChartIcon className="w-4 h-4" />
                Participación
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData.marketTrends}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ market, share }) => `${market}: ${share}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="share"
                >
                  {chartData.marketTrends.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${value}%`, 'Participación']} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráficos Secundarios */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* ROI por Estrategia */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-600" />
                ROI por Estrategia
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData.profitabilityByStrategy}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="strategy" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'roi' ? `${value}%` : `${value}%`,
                    name === 'roi' ? 'ROI' : 'Riesgo'
                  ]}
                />
                <Bar dataKey="roi" fill="#8B5CF6" />
                <Bar dataKey="risk" fill="#EF4444" fillOpacity={0.6} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Análisis Estacional */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-orange-600" />
                Análisis Estacional
              </h3>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData.seasonalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="demand" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Demanda (%)"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="price" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Precio ($)"
                />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="optimal" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Óptimo (%)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Análisis de Competidores */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-red-600" />
              Análisis Competitivo
            </h3>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Competidor</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Precio</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Calidad</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Participación</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Posición</th>
                </tr>
              </thead>
              <tbody>
                {chartData.competitorAnalysis.map((competitor, idx) => (
                  <tr key={idx} className={`border-b border-gray-100 ${
                    competitor.competitor === 'Tu Café' ? 'bg-green-50' : 'hover:bg-gray-50'
                  }`}>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {competitor.competitor === 'Tu Café' && (
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        )}
                        <span className={competitor.competitor === 'Tu Café' ? 'font-semibold text-green-900' : ''}>
                          {competitor.competitor}
                        </span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <span className="font-medium">${competitor.price.toFixed(2)}</span>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <span className="font-medium">{competitor.quality}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          competitor.quality >= 85 ? 'bg-green-500' :
                          competitor.quality >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      <div className="flex items-center justify-center">
                        <div className="w-20 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${competitor.market_share * 2}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-sm font-medium">{competitor.market_share}%</span>
                      </div>
                    </td>
                    <td className="text-center py-3 px-4">
                      {competitor.quality >= 85 && competitor.price >= 5.0 ? (
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">Premium</span>
                      ) : competitor.quality >= 80 ? (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">Specialty</span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">Comercial</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Métricas Clave */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Precio Promedio</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(chartData.priceHistory.reduce((sum, item) => sum + item.price, 0) / chartData.priceHistory.length).toFixed(2)}
                </p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  +5.2% vs mes anterior
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Volatilidad</p>
                <p className="text-2xl font-bold text-gray-900">12.3%</p>
                <p className="text-sm text-yellow-600">Moderada</p>
              </div>
              <BarChart3 className="w-8 h-8 text-yellow-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Mejor Mercado</p>
                <p className="text-2xl font-bold text-gray-900">Asia</p>
                <p className="text-sm text-blue-600">+18.7% crecimiento</p>
              </div>
              <Globe className="w-8 h-8 text-blue-600" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Posición Competitiva</p>
                <p className="text-2xl font-bold text-gray-900">#3</p>
                <p className="text-sm text-purple-600">En calidad-precio</p>
              </div>
              <Target className="w-8 h-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketDashboard;
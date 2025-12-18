import React, { useState, useEffect } from 'react';
import { Brain, Activity, TrendingUp, AlertTriangle, Bell, BarChart3, Eye, Zap, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import AlertasTempranasIA from '../components/AlertasTempranasIA';
import AdvancedAnalytics from '../components/AdvancedAnalytics';
import { predictiveAnalyticsService } from '../services/predictiveAnalyticsService';
import { enhancedWeatherService } from '../services/enhancedWeatherService';
import { offlineDB } from '../utils/offlineDB';
import { PredictionAnalysis } from '../types/earlyWarning';

type AlertasIAView = 'overview' | 'early-warning' | 'risk-dashboard' | 'analytics';

const AlertasIA: React.FC = () => {
  const [selectedView, setSelectedView] = useState<AlertasIAView>('overview');
  const [stats, setStats] = useState({
    activeAlerts: 0,
    riskLevel: 'Bajo',
    predictionsCount: 0,
    aiAccuracy: 'N/A' // To be calculated if possible, or removed if strictly simulated
  });
  const [recentAlerts, setRecentAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRealData();
  }, []);

  const loadRealData = async () => {
    setLoading(true);
    try {
      // 1. Obtener clima y predicciones reales
      const weatherAnalysis = await enhancedWeatherService.getWeatherAnalysis();
      const forecast = await enhancedWeatherService.generateForecastFromAPI(7);
      const predictions = await predictiveAnalyticsService.analyzePestRisk(weatherAnalysis.current, forecast);

      // 2. Calcular estadísticas reales
      const activeRisks = predictions.filter(p => p.prediction.riskLevel === 'high' || p.prediction.riskLevel === 'critical');
      const mediumRisks = predictions.filter(p => p.prediction.riskLevel === 'medium');

      const totalAlerts = activeRisks.length + mediumRisks.length;

      // Determinar Riesgo Promedio Global
      let globalRisk = 'Bajo';
      if (activeRisks.length > 0) globalRisk = 'Alto';
      else if (mediumRisks.length > 0) globalRisk = 'Medio';

      // 3. Obtener Historial Real para "Alertas Recientes" (simulando que las predicciones son alertas por ahora, 
      //    o mezclando con monitoreos reales recientes)
      const mappedAlerts = predictions
        .filter(p => p.prediction.riskLevel !== 'low')
        .map((p, index) => ({
          id: p.pestType + index,
          type: p.pestType.charAt(0).toUpperCase() + p.pestType.slice(1),
          risk: p.prediction.riskLevel === 'critical' ? 'Crítico' : p.prediction.riskLevel === 'high' ? 'Alto' : 'Medio',
          location: 'Toda la Finca', // Por ahora es global
          time: 'Ahora', // Es tiempo real
          color: p.prediction.riskLevel === 'critical' ? 'red' : p.prediction.riskLevel === 'high' ? 'orange' : 'yellow'
        }));

      setStats({
        activeAlerts: totalAlerts,
        riskLevel: globalRisk,
        predictionsCount: predictions.length,
        aiAccuracy: '95%' // Placeholder conservador o calcular basado en historial vs prediccion
      });

      setRecentAlerts(mappedAlerts);

    } catch (error) {
      console.error("Error loading real AI data:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Brain className="h-8 w-8 text-indigo-600" />
                    Alertas Inteligentes
                  </h1>
                  <p className="text-gray-600 mt-1">Sistema predictivo basado en datos reales de tu finca</p>
                </div>

                <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
                  <button
                    onClick={() => setSelectedView('overview')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'overview'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <Eye className="h-4 w-4" />
                    Resumen
                  </button>
                  <button
                    onClick={() => setSelectedView('early-warning')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'early-warning'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <Bell className="h-4 w-4" />
                    Alertas
                  </button>
                  <button
                    onClick={() => setSelectedView('analytics')}
                    className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'analytics'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <BarChart3 className="h-4 w-4" />
                    Análisis
                  </button>
                </div>
              </div>
            </div>
          </div>

          {selectedView === 'overview' && (
            <>
              {/* Estadísticas Generales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Amenazas Detectadas</p>
                      <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.activeAlerts}</p>
                    </div>
                    <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <span className="text-sm text-gray-500">Basado en clima real</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Nivel de Riesgo Global</p>
                      <p className={`text-2xl font-bold ${stats.riskLevel === 'Alto' ? 'text-red-600' : stats.riskLevel === 'Medio' ? 'text-orange-600' : 'text-green-600'}`}>
                        {loading ? '...' : stats.riskLevel}
                      </p>
                    </div>
                    <div className={`h-12 w-12 rounded-lg flex items-center justify-center ${stats.riskLevel === 'Alto' ? 'bg-red-100' : stats.riskLevel === 'Medio' ? 'bg-orange-100' : 'bg-green-100'}`}>
                      <Activity className={`h-6 w-6 ${stats.riskLevel === 'Alto' ? 'text-red-600' : stats.riskLevel === 'Medio' ? 'text-orange-600' : 'text-green-600'}`} />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-600">Pronóstico a 7 días</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Modelos Activos</p>
                      <p className="text-2xl font-bold text-blue-600">{loading ? '...' : stats.predictionsCount}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Brain className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-blue-600">Integrado con Open-Meteo</span>
                  </div>
                </div>

                {/* Removed fake Accuracy card, replaced with Last Update */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Última Actualización</p>
                      <p className="text-lg font-bold text-gray-900">{new Date().toLocaleTimeString()}</p>
                    </div>
                    <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                      <RefreshCw className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-green-600">Tiempo Real</span>
                  </div>
                </div>
              </div>

              {/* Acciones Rápidas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setSelectedView('early-warning')}
                    className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Bell className="h-4 w-4" />
                    Ver Detalles de Alertas
                  </button>

                  <button
                    onClick={() => setSelectedView('analytics')}
                    className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Ver Análisis Avanzado
                  </button>
                </div>
              </div>

              {/* Resumen de Alertas Recientes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Alertas Activas (Calculadas Ahora)</h3>
                  <button
                    onClick={() => setSelectedView('early-warning')}
                    className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                  >
                    Ver todas
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-4">Calculando riesgos...</div>
                ) : recentAlerts.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No hay alertas de riesgo alto detectadas en este momento.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentAlerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`p-3 rounded-lg border-l-4 ${alert.color === 'red'
                          ? 'bg-red-50 border-red-400'
                          : alert.color === 'orange'
                            ? 'bg-orange-50 border-orange-400'
                            : 'bg-yellow-50 border-yellow-400'
                          }`}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-900">{alert.type}</p>
                            <p className="text-sm text-gray-600">{alert.location}</p>
                            <p className="text-xs text-gray-500 mt-1">{alert.time}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${alert.color === 'red'
                              ? 'bg-red-100 text-red-800'
                              : alert.color === 'orange'
                                ? 'bg-orange-100 text-orange-800'
                                : 'bg-yellow-100 text-yellow-800'
                              }`}
                          >
                            {alert.risk}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {selectedView === 'early-warning' && (
            <AlertasTempranasIA />
          )}

          {selectedView === 'analytics' && (
            <AdvancedAnalytics />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AlertasIA;
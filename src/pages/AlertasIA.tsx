import React, { useState } from 'react';
import { Brain, Activity, TrendingUp, AlertTriangle, Bell, BarChart3, Eye, Zap } from 'lucide-react';
import Layout from '../components/Layout';
import AlertasTempranasIA from '../components/AlertasTempranasIA';
import RiskAssessmentDashboard from '../components/RiskAssessmentDashboard';

type AlertasIAView = 'overview' | 'early-warning' | 'risk-dashboard' | 'analytics';

const AlertasIA: React.FC = () => {
  const [selectedView, setSelectedView] = useState<AlertasIAView>('overview');

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
                <p className="text-gray-600 mt-1">Sistema predictivo de alertas tempranas con IA</p>
              </div>
              
              <div className="flex flex-wrap gap-2 mt-4 sm:mt-0">
                <button
                  onClick={() => setSelectedView('overview')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedView === 'overview'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Eye className="h-4 w-4" />
                  Resumen
                </button>
                <button
                  onClick={() => setSelectedView('early-warning')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedView === 'early-warning'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Bell className="h-4 w-4" />
                  Alertas Tempranas
                </button>
                <button
                  onClick={() => setSelectedView('risk-dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedView === 'risk-dashboard'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <Activity className="h-4 w-4" />
                  Dashboard de Riesgo
                </button>
                <button
                  onClick={() => setSelectedView('analytics')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                    selectedView === 'analytics'
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Análisis Predictivo
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
                    <p className="text-sm font-medium text-gray-600">Alertas Activas</p>
                    <p className="text-2xl font-bold text-gray-900">12</p>
                  </div>
                  <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600">-15% vs semana anterior</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Riesgo Promedio</p>
                    <p className="text-2xl font-bold text-orange-600">Medio</p>
                  </div>
                  <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Activity className="h-6 w-6 text-orange-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-gray-600">Basado en condiciones actuales</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Predicciones</p>
                    <p className="text-2xl font-bold text-blue-600">8</p>
                  </div>
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <Brain className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-blue-600">Próximos 7 días</span>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Precisión IA</p>
                    <p className="text-2xl font-bold text-green-600">94.2%</p>
                  </div>
                  <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Zap className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <span className="text-sm text-green-600">Últimas 30 predicciones</span>
                </div>
              </div>
            </div>

            {/* Acciones Rápidas */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <button
                  onClick={() => setSelectedView('early-warning')}
                  className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 justify-center"
                >
                  <Bell className="h-4 w-4" />
                  Ver Alertas Tempranas
                </button>
                
                <button
                  onClick={() => setSelectedView('risk-dashboard')}
                  className="bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2 justify-center"
                >
                  <Activity className="h-4 w-4" />
                  Dashboard de Riesgo
                </button>
                
                <button
                  onClick={() => setSelectedView('analytics')}
                  className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 justify-center"
                >
                  <BarChart3 className="h-4 w-4" />
                  Análisis Predictivo
                </button>
                
                <button
                  className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 justify-center"
                >
                  <Zap className="h-4 w-4" />
                  Configurar Alertas
                </button>
              </div>
            </div>

            {/* Resumen de Alertas Recientes */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Alertas Recientes</h3>
                <button
                  onClick={() => setSelectedView('early-warning')}
                  className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
                >
                  Ver todas
                </button>
              </div>
              
              <div className="space-y-3">
                {[
                  {
                    id: 1,
                    type: 'Broca del Café',
                    risk: 'Alto',
                    location: 'Lote A-1',
                    time: '2 horas',
                    color: 'orange'
                  },
                  {
                    id: 2,
                    type: 'Roya del Café',
                    risk: 'Medio',
                    location: 'Lote B-3',
                    time: '4 horas',
                    color: 'yellow'
                  },
                  {
                    id: 3,
                    type: 'Condiciones Climáticas',
                    risk: 'Bajo',
                    location: 'Toda la finca',
                    time: '6 horas',
                    color: 'green'
                  }
                ].map((alert) => (
                  <div
                    key={alert.id}
                    className={`p-3 rounded-lg border-l-4 ${
                      alert.color === 'orange'
                        ? 'bg-orange-50 border-orange-400'
                        : alert.color === 'yellow'
                        ? 'bg-yellow-50 border-yellow-400'
                        : 'bg-green-50 border-green-400'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{alert.type}</p>
                        <p className="text-sm text-gray-600">{alert.location}</p>
                        <p className="text-xs text-gray-500 mt-1">Hace {alert.time}</p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          alert.color === 'orange'
                            ? 'bg-orange-100 text-orange-800'
                            : alert.color === 'yellow'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {alert.risk}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {selectedView === 'early-warning' && (
          <AlertasTempranasIA />
        )}

        {selectedView === 'risk-dashboard' && (
          <RiskAssessmentDashboard />
        )}

        {selectedView === 'analytics' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Análisis Predictivo Avanzado</h2>
            <div className="text-center py-12">
              <Brain className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Análisis Predictivo</h3>
              <p className="text-gray-600 mb-4">
                Esta sección incluirá análisis avanzados de tendencias, patrones estacionales y predicciones a largo plazo.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Análisis de Tendencias</h4>
                  <p className="text-sm text-gray-600">Patrones históricos y proyecciones futuras</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Modelos Predictivos</h4>
                  <p className="text-sm text-gray-600">Algoritmos de machine learning especializados</p>
                </div>
              </div>
            </div>
          </div>
        )}
        </div>
      </div>
    </Layout>
  );
};

export default AlertasIA;
import React, { useState, useEffect } from 'react';
import { Bug, AlertTriangle, TrendingUp, MapPin, Calendar, Bell, Plus, BarChart3, Settings, Camera, Calculator, Leaf, Loader2, Eye, Brain, Activity } from 'lucide-react';
import { offlineDB, ensureOfflineDBReady } from '@/utils/offlineDB';
import { toast } from 'sonner';
import Layout from '../components/Layout';
import PestMonitoringForm from '../components/PestMonitoringForm';
import PestAlerts from '../components/PestAlerts';
import PestAnalytics from '../components/PestAnalytics';
import TreatmentManagement from '../components/TreatmentManagement';
import PestHeatMap from '../components/PestHeatMap';
import ThresholdCalculator from '../components/ThresholdCalculator';
import CoffeeSpecificPests from '../components/CoffeeSpecificPests';
import SmartAlerts from '../components/SmartAlerts';
import PhotoCapture from '../components/PhotoCapture';
import { DiagnosticoPorFoto } from '../components/DiagnosticoPorFoto';
import AlertasTempranasIA from '../components/AlertasTempranasIA';
import RiskDashboard from '../components/RiskDashboard';

interface PestStats {
  total: number;
  bySeverity: {
    CRITICAL: number;
    HIGH: number;
    MEDIUM: number;
    LOW: number;
  };
  byPestType: Array<{
    pestType: string;
    count: number;
  }>;
  totalAffectedArea: number;
  trend: number;
}

interface PestAlert {
  id: number;
  lotName: string;
  pestType: string;
  severity: string;
  message: string;
  createdAt: string;
}


const MIP: React.FC = () => {
  const [pestStats, setPestStats] = useState<PestStats | null>(null);
  const [pestAlerts, setPestAlerts] = useState<PestAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [showMonitoringForm, setShowMonitoringForm] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [showTreatments, setShowTreatments] = useState(false);
  const [showHeatMap, setShowHeatMap] = useState(false);
  const [showThresholds, setShowThresholds] = useState(false);
  const [showCoffeeSpecific, setShowCoffeeSpecific] = useState(false);
  const [showSmartAlerts, setShowSmartAlerts] = useState(false);
  const [showPhotoCapture, setShowPhotoCapture] = useState(false);
  const [editingMonitoring, setEditingMonitoring] = useState<any>(null);
  const [selectedView, setSelectedView] = useState<'dashboard' | 'heatmap' | 'analytics' | 'thresholds' | 'coffee' | 'alerts' | 'photos' | 'diagnosis' | 'risk-dashboard' | 'early-warning'>('dashboard');
  const [showDiagnosisModal, setShowDiagnosisModal] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        await ensureOfflineDBReady();
      } catch (err) {
        console.warn('[MIP] DB no disponible, usando fallback:', err);
      } finally {
        await fetchPestData();
      }
    })();
  }, []);

  useEffect(() => {
    // selectedView state change handler
  }, [selectedView]);



  const fetchPestData = async () => {
    try {
      setLoading(true);

      // Obtener datos de monitoreo de plagas de la base de datos offline
      const pestMonitoringFromDB = await offlineDB.pestMonitoring.toArray();
      const lotsFromDB = await offlineDB.lots.toArray();

      // Calcular estadísticas
      const stats: PestStats = {
        total: pestMonitoringFromDB.length,
        bySeverity: {
          CRITICAL: pestMonitoringFromDB.filter(p => p.severity === 'CRITICAL').length,
          HIGH: pestMonitoringFromDB.filter(p => p.severity === 'HIGH').length,
          MEDIUM: pestMonitoringFromDB.filter(p => p.severity === 'MEDIUM').length,
          LOW: pestMonitoringFromDB.filter(p => p.severity === 'LOW').length,
        },
        byPestType: [],
        totalAffectedArea: pestMonitoringFromDB.reduce((sum, p) => sum + (p.affectedArea || 0), 0),
        trend: 0
      };

      // Agrupar por tipo de plaga
      const pestTypeCounts: { [key: string]: number } = {};
      pestMonitoringFromDB.forEach(p => {
        pestTypeCounts[p.pestType] = (pestTypeCounts[p.pestType] || 0) + 1;
      });

      stats.byPestType = Object.entries(pestTypeCounts).map(([pestType, count]) => ({
        pestType,
        count
      }));

      // Generar alertas basadas en severidad alta y crítica
      const alerts: PestAlert[] = pestMonitoringFromDB
        .filter(p => p.severity === 'HIGH' || p.severity === 'CRITICAL')
        .map(p => {
          const lot = lotsFromDB.find(l => l.id?.toString() === p.lotId);
          return {
            id: p.id!,
            lotName: lot?.name || `Lote ${p.lotId}`,
            pestType: p.pestType,
            severity: p.severity,
            message: `${getPestTypeText(p.pestType)} detectada con severidad ${p.severity.toLowerCase()}`,
            createdAt: p.observationDate || new Date().toISOString()
          };
        });

      setPestStats(stats);
      setPestAlerts(alerts);
    } catch (error) {
      console.error('Error fetching pest data:', error);
      if (import.meta.env.DEV) {
        // Fallback de desarrollo para visualizar UI
        const fallbackStats: PestStats = {
          total: 3,
          bySeverity: { CRITICAL: 1, HIGH: 1, MEDIUM: 1, LOW: 0 },
          byPestType: [
            { pestType: 'ROYA', count: 1 },
            { pestType: 'BROCA', count: 1 },
            { pestType: 'COCHINILLA', count: 1 }
          ],
          totalAffectedArea: 2.5,
          trend: 5
        };
        const fallbackAlerts: PestAlert[] = [
          { id: 1, lotName: 'Lote Principal', pestType: 'ROYA', severity: 'CRITICAL', message: 'Roya detectada con severidad crítica', createdAt: new Date().toISOString() },
          { id: 2, lotName: 'Lote 2', pestType: 'BROCA', severity: 'HIGH', message: 'Broca con alta incidencia', createdAt: new Date().toISOString() }
        ];
        setPestStats(fallbackStats);
        setPestAlerts(fallbackAlerts);
        toast.info('Modo offline: mostrando datos de ejemplo');
      } else {
        toast.error('Error al cargar datos de monitoreo de plagas');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMonitoring = async (monitoringData: any) => {
    try {
      // Agregar a la base de datos offline
      await offlineDB.pestMonitoring.add({
        lotId: monitoringData.lotId,
        pestType: monitoringData.pestType,
        severity: monitoringData.severity,
        affectedArea: monitoringData.affectedArea,
        observationDate: monitoringData.detectionDate || new Date().toISOString(),
        symptoms: monitoringData.symptoms,
        location: monitoringData.location,
        weatherConditions: monitoringData.weatherConditions,
        photos: monitoringData.photos ? JSON.stringify(monitoringData.photos) : null,
        recommendedActions: monitoringData.recommendedActions,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      await fetchPestData();
      setShowMonitoringForm(false);
      toast.success('Monitoreo de plagas registrado exitosamente');
    } catch (error) {
      console.error('Error creating monitoring:', error);
      toast.error('Error al registrar el monitoreo de plagas');
    }
  };

  const handleUpdateMonitoring = async (id: number, monitoringData: any) => {
    try {
      // Actualizar en la base de datos offline
      await offlineDB.pestMonitoring.update(id, {
        ...monitoringData,
        photos: monitoringData.photos ? JSON.stringify(monitoringData.photos) : null,
        updatedAt: new Date().toISOString()
      });

      await fetchPestData();
      setShowMonitoringForm(false);
      setEditingMonitoring(null);
      toast.success('Monitoreo de plagas actualizado exitosamente');
    } catch (error) {
      console.error('Error updating monitoring:', error);
      toast.error('Error al actualizar el monitoreo de plagas');
    }
  };

  const criticalAlerts = pestAlerts.filter(alert => alert.severity === 'CRITICAL').length;
  const highAlerts = pestAlerts.filter(alert => alert.severity === 'HIGH').length;

  const getPestTypeText = (pestType: string) => {
    switch (pestType) {
      case 'BROCA': return 'Broca del Café';
      case 'ROYA': return 'Roya del Café';
      case 'MINADOR': return 'Minador de la Hoja';
      case 'COCHINILLA': return 'Cochinilla';
      case 'NEMATODOS': return 'Nematodos';
      default: return pestType;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-amber-600" />
          <p className="text-gray-600">Cargando datos de monitoreo de plagas...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Manejo Integrado de Plagas</h1>
                <p className="text-gray-600 mt-1">Control fitosanitario para cultivos de café</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedView('dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'dashboard'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <Bug className="h-4 w-4" />
                  Dashboard
                </button>
                <button
                  onClick={() => setSelectedView('heatmap')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'heatmap'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <MapPin className="h-4 w-4" />
                  Mapa de Calor
                </button>
                <button
                  onClick={() => setSelectedView('analytics')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'analytics'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <BarChart3 className="h-4 w-4" />
                  Análisis
                </button>
                <button
                  onClick={() => setSelectedView('thresholds')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'thresholds'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <Calculator className="h-4 w-4" />
                  Umbrales
                </button>
                <button
                  onClick={() => setSelectedView('coffee')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'coffee'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <Leaf className="h-4 w-4" />
                  Café
                </button>
                <button
                  onClick={() => setSelectedView('alerts')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'alerts'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <Bell className="h-4 w-4" />
                  Alertas
                </button>
                <button
                  onClick={() => setSelectedView('photos')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'photos'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <Camera className="h-4 w-4" />
                  Fotos
                </button>
                <button
                  onClick={() => setSelectedView('diagnosis')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'diagnosis'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <Eye className="h-4 w-4" />
                  Diagnóstico IA
                </button>
                <button
                  onClick={() => setSelectedView('early-warning')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'early-warning'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <Brain className="h-4 w-4" />
                  Alertas IA
                </button>
                <button
                  onClick={() => setSelectedView('risk-dashboard')}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${selectedView === 'risk-dashboard'
                    ? 'bg-amber-600 text-white'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  <Activity className="h-4 w-4" />
                  Dashboard Riesgo
                </button>
              </div>
            </div>
          </div>

          {selectedView === 'dashboard' && (
            <>
              {/* Estadísticas Generales */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Total Monitoreos</p>
                      <p className="text-2xl font-bold text-gray-900">{pestStats?.total || 0}</p>
                    </div>
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Bug className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="mt-4 flex items-center">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">+{pestStats?.trend || 0}% vs mes anterior</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Área Afectada</p>
                      <p className="text-2xl font-bold text-gray-900">{pestStats?.totalAffectedArea?.toFixed(1) || 0} ha</p>
                    </div>
                    <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-orange-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-600">Del total de la finca</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Alertas Críticas</p>
                      <p className="text-2xl font-bold text-red-600">{pestStats?.bySeverity?.CRITICAL || 0}</p>
                    </div>
                    <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                      <AlertTriangle className="h-6 w-6 text-red-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-red-600">Requieren acción inmediata</span>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tendencia</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {pestStats?.bySeverity?.HIGH && pestStats?.bySeverity?.CRITICAL
                          ? ((pestStats.bySeverity.HIGH + pestStats.bySeverity.CRITICAL) / pestStats.total * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items_center justify-center">
                      <TrendingUp className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <span className="text-sm text-gray-600">Infestación alta/crítica</span>
                  </div>
                </div>
              </div>

              {/* Acciones Rápidas */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
                  <button
                    onClick={() => setShowMonitoringForm(true)}
                    className="bg-amber-600 text-white px-4 py-3 rounded-lg hover:bg-amber-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Plus className="h-4 w-4" />
                    Nuevo Monitoreo
                  </button>

                  <button
                    onClick={() => setSelectedView('diagnosis')}
                    className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Eye className="h-4 w-4" />
                    Diagnóstico IA
                  </button>

                  <button
                    onClick={() => setSelectedView('early-warning')}
                    className="bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Brain className="h-4 w-4" />
                    Alertas IA
                  </button>

                  <button
                    onClick={() => setSelectedView('risk-dashboard')}
                    className="bg-cyan-600 text-white px-4 py-3 rounded-lg hover:bg-cyan-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Activity className="h-4 w-4" />
                    Dashboard Riesgo
                  </button>

                  <button
                    onClick={() => setShowAlertsModal(true)}
                    className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Bell className="h-4 w-4" />
                    Ver Alertas ({criticalAlerts + highAlerts})
                  </button>

                  <button
                    onClick={() => setShowTreatments(true)}
                    className="bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <Settings className="h-4 w-4" />
                    Gestionar Tratamientos
                  </button>

                  <button
                    onClick={() => setSelectedView('analytics')}
                    className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <BarChart3 className="h-4 w-4" />
                    Ver Análisis
                  </button>
                </div>
              </div>

              {/* Distribución por Severidad y Plagas Más Frecuentes */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Distribución por Severidad */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución por Severidad</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'CRITICAL', label: 'Crítico', color: 'bg-red-500', textColor: 'text-red-600' },
                      { key: 'HIGH', label: 'Alto', color: 'bg-orange-500', textColor: 'text-orange-600' },
                      { key: 'MEDIUM', label: 'Medio', color: 'bg-yellow-500', textColor: 'text-yellow-600' },
                      { key: 'LOW', label: 'Bajo', color: 'bg-green-500', textColor: 'text-green-600' }
                    ].map(({ key, label, color, textColor }) => {
                      const count = pestStats?.bySeverity?.[key as keyof typeof pestStats.bySeverity] || 0;
                      const percentage = pestStats?.total ? (count / pestStats.total) * 100 : 0;

                      return (
                        <div key={key} className="flex items-center justify_between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${color}`} />
                            <span className="text-sm font-medium text-gray-700">{label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${color}`}
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className={`text-sm font-medium ${textColor} w-8 text-right`}>
                              {count}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Plagas Más Frecuentes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Plagas Más Frecuentes</h3>
                  <div className="space-y-4">
                    {pestStats?.byPestType?.slice(0, 5).map((pest, index) => {
                      const percentage = pestStats?.total ? (pest.count / pestStats.total) * 100 : 0;

                      return (
                        <div key={pest.pestType} className="flex items-center justify_between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500 w-4">#{index + 1}</span>
                            <span className="text-sm font-medium text-gray-700">
                              {getPestTypeText(pest.pestType)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="h-2 rounded-full bg-amber-500"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-amber-600 w-8 text-right">
                              {pest.count}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {(!pestStats?.byPestType || pestStats.byPestType.length === 0) && (
                      <div className="text-center py-4 text-gray-500">
                        No hay datos de plagas disponibles
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Alertas Recientes */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Alertas Recientes</h3>
                  <button
                    onClick={() => setShowAlertsModal(true)}
                    className="text-amber-600 hover:text-amber-700 text-sm font-medium"
                  >
                    Ver todas
                  </button>
                </div>

                <div className="space-y-3">
                  {pestAlerts.slice(0, 5).map((alert) => (
                    <div
                      key={alert.id}
                      className={`p-3 rounded-lg border-l-4 ${alert.severity === 'CRITICAL'
                        ? 'bg-red-50 border-red-400'
                        : alert.severity === 'HIGH'
                          ? 'bg-orange-50 border-orange-400'
                          : 'bg-yellow-50 border-yellow-400'
                        }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-900">{alert.lotName}</p>
                          <p className="text-sm text-gray-600">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {getPestTypeText(alert.pestType)} • {new Date(alert.createdAt).toLocaleDateString('es-ES')}
                          </p>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-medium ${alert.severity === 'CRITICAL'
                            ? 'bg-red-100 text-red-800'
                            : alert.severity === 'HIGH'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-yellow-100 text-yellow-800'
                            }`}
                        >
                          {alert.severity === 'CRITICAL' ? 'Crítico' :
                            alert.severity === 'HIGH' ? 'Alto' : 'Medio'}
                        </span>
                      </div>
                    </div>
                  ))}

                  {pestAlerts.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      No hay alertas recientes
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {selectedView === 'heatmap' && (
            <PestHeatMap />
          )}

          {selectedView === 'analytics' && (
            <PestAnalytics />
          )}

          {selectedView === 'thresholds' && (
            <ThresholdCalculator />
          )}

          {selectedView === 'coffee' && (
            <CoffeeSpecificPests />
          )}

          {selectedView === 'alerts' && (
            <SmartAlerts farmId="farm-001" />
          )}

          {selectedView === 'photos' && (
            <PhotoCapture />
          )}

          {selectedView === 'diagnosis' && (
            <DiagnosticoPorFoto />
          )}

          {selectedView === 'early-warning' && (
            <AlertasTempranasIA />
          )}

          {selectedView === 'risk-dashboard' && (
            <div className="p-6">
              <RiskDashboard />
            </div>
          )}

          {/* Modales */}
          {showMonitoringForm && (
            <PestMonitoringForm
              isOpen={showMonitoringForm}
              onSubmit={editingMonitoring ?
                (data) => handleUpdateMonitoring(editingMonitoring.id, data) :
                handleCreateMonitoring
              }
              onClose={() => {
                setShowMonitoringForm(false);
                setEditingMonitoring(null);
              }}
              editData={editingMonitoring}
            />
          )}

          {showAlertsModal && (
            <PestAlerts
              isOpen={showAlertsModal}
              onClose={() => setShowAlertsModal(false)}
            />
          )}

          {showTreatments && (
            <TreatmentManagement
              onClose={() => setShowTreatments(false)}
            />
          )}
        </div>
      </div>
    </Layout>
  );
};

export default MIP;
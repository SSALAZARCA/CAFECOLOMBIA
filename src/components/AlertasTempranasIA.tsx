import React, { useState, useEffect, useCallback } from 'react';
import { 
  AlertTriangle, 
  TrendingUp, 
  Cloud, 
  Thermometer, 
  Droplets, 
  Wind,
  Calendar,
  Target,
  Brain,
  RefreshCw,
  Settings,
  Bell,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3
} from 'lucide-react';
import { 
  EarlyWarningAlert, 
  RiskPrediction, 
  PestType, 
  RiskLevel,
  WeatherConditions,
  PredictionAnalysis 
} from '../types/earlyWarning';
import { predictiveAnalyticsService } from '../services/predictiveAnalyticsService';
import { enhancedWeatherService } from '../services/enhancedWeatherService';
import { toast } from 'sonner';

interface AlertasTempranasIAProps {
  onAlertClick?: (alert: EarlyWarningAlert) => void;
  showOnlyActive?: boolean;
  maxAlerts?: number;
}

const AlertasTempranasIA: React.FC<AlertasTempranasIAProps> = ({
  onAlertClick,
  showOnlyActive = true,
  maxAlerts = 10
}) => {
  const [alerts, setAlerts] = useState<EarlyWarningAlert[]>([]);
  const [predictions, setPredictions] = useState<PredictionAnalysis[]>([]);
  const [currentWeather, setCurrentWeather] = useState<WeatherConditions | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPestTypes, setSelectedPestTypes] = useState<PestType[]>(['roya', 'broca', 'minador', 'cochinilla']);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState<RiskLevel | 'all'>('all');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadEarlyWarningData = useCallback(async () => {
    try {
      setLoading(true);
      
      // Obtener análisis meteorológico
      const weatherAnalysis = await enhancedWeatherService.getWeatherAnalysis();
      setCurrentWeather(weatherAnalysis.current);
      
      // Obtener pronóstico
      const forecast = await enhancedWeatherService.getForecast(7);
      
      // Realizar análisis predictivo
      const predictiveAnalyses = await predictiveAnalyticsService.analyzePestRisk(
        weatherAnalysis.current,
        forecast,
        selectedPestTypes
      );
      setPredictions(predictiveAnalyses);
      
      // Generar alertas basadas en las predicciones
      const generatedAlerts = generateAlertsFromPredictions(predictiveAnalyses);
      setAlerts(generatedAlerts);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading early warning data:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedPestTypes]);

  // Cargar datos iniciales y configurar auto-refresh
  useEffect(() => {
    loadEarlyWarningData();

    if (autoRefresh) {
      const interval = setInterval(loadEarlyWarningData, 300000); // 5 minutos
      return () => clearInterval(interval);
    }
  }, [loadEarlyWarningData, autoRefresh]);

  const generateAlertsFromPredictions = (analyses: PredictionAnalysis[]): EarlyWarningAlert[] => {
    const generatedAlerts: EarlyWarningAlert[] = [];
    
    analyses.forEach(analysis => {
      const { prediction } = analysis;
      
      // Solo generar alertas para riesgos medium, high y critical
      if (prediction.riskLevel !== 'low') {
        const alert: EarlyWarningAlert = {
          id: `alert_${prediction.pestType}_${Date.now()}`,
          pestType: prediction.pestType,
          riskLevel: prediction.riskLevel,
          title: `Alerta de ${prediction.pestType.charAt(0).toUpperCase() + prediction.pestType.slice(1)}`,
          description: `Riesgo ${getRiskLevelText(prediction.riskLevel)} detectado para ${prediction.pestType} con ${(prediction.probability * 100).toFixed(1)}% de probabilidad`,
          probability: prediction.probability,
          confidence: prediction.confidence,
          timeframe: prediction.timeframe,
          affectedAreas: ['Toda la finca'], // Mock data
          recommendations: {
            immediate: prediction.recommendations.slice(0, 2),
            preventive: prediction.recommendations.slice(2, 4),
            monitoring: ['Monitoreo diario', 'Registro de síntomas']
          },
          weatherTriggers: currentWeather!,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        generatedAlerts.push(alert);
      }
    });
    
    return generatedAlerts;
  };

  const getRiskLevelText = (level: RiskLevel): string => {
    const levels = {
      low: 'Bajo',
      medium: 'Medio',
      high: 'Alto',
      critical: 'Crítico'
    };
    return levels[level];
  };

  const getRiskLevelColor = (level: RiskLevel): string => {
    const colors = {
      low: 'text-green-600 bg-green-50 border-green-200',
      medium: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      high: 'text-orange-600 bg-orange-50 border-orange-200',
      critical: 'text-red-600 bg-red-50 border-red-200'
    };
    return colors[level];
  };

  const getPestTypeIcon = (pestType: PestType) => {
    const icons = {
      roya: '🍄',
      broca: '🐛',
      minador: '🦗',
      cochinilla: '🐜',
      nematodos: '🪱',
      antracnosis: '🍄',
      mancha_foliar: '🍃',
      ojo_gallo: '👁️'
    };
    return icons[pestType] || '🐛';
  };

  const formatTimeframe = (timeframe: { start: Date; peak: Date; end: Date }) => {
    const now = new Date();
    const daysToStart = Math.ceil((timeframe.start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const daysToPeak = Math.ceil((timeframe.peak.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysToStart <= 0) {
      return `Pico en ${daysToPeak} días`;
    }
    return `Inicio en ${daysToStart} días, pico en ${daysToPeak} días`;
  };

  const filteredAlerts = alerts.filter(alert => {
    if (showOnlyActive && !alert.isActive) return false;
    if (selectedRiskLevel !== 'all' && alert.riskLevel !== selectedRiskLevel) return false;
    return true;
  }).slice(0, maxAlerts);

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, acknowledgedAt: new Date() }
        : alert
    ));
  };

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === alertId 
        ? { ...alert, isActive: false, resolvedAt: new Date() }
        : alert
    ));
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center space-x-2">
          <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
          <span className="text-gray-600">Analizando condiciones y generando alertas...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con controles */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Brain className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Alertas Tempranas IA</h2>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={loadEarlyWarningData}
              className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Actualizar</span>
            </button>
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center space-x-1 px-3 py-1 text-sm rounded-md ${
                autoRefresh 
                  ? 'bg-green-50 text-green-600 hover:bg-green-100' 
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Bell className="h-4 w-4" />
              <span>{autoRefresh ? 'Auto' : 'Manual'}</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Plagas:</label>
            <select
              multiple
              value={selectedPestTypes}
              onChange={(e) => setSelectedPestTypes(Array.from(e.target.selectedOptions, option => option.value as PestType))}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="roya">Roya</option>
              <option value="broca">Broca</option>
              <option value="minador">Minador</option>
              <option value="cochinilla">Cochinilla</option>
              <option value="nematodos">Nematodos</option>
              <option value="antracnosis">Antracnosis</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700">Riesgo:</label>
            <select
              value={selectedRiskLevel}
              onChange={(e) => setSelectedRiskLevel(e.target.value as RiskLevel | 'all')}
              className="text-sm border border-gray-300 rounded-md px-2 py-1"
            >
              <option value="all">Todos</option>
              <option value="medium">Medio</option>
              <option value="high">Alto</option>
              <option value="critical">Crítico</option>
            </select>
          </div>
        </div>

        {/* Información meteorológica actual */}
        {currentWeather && (
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-1">
                <Thermometer className="h-4 w-4 text-red-500" />
                <span>{currentWeather.temperature.toFixed(1)}°C</span>
              </div>
              <div className="flex items-center space-x-1">
                <Droplets className="h-4 w-4 text-blue-500" />
                <span>{currentWeather.humidity.toFixed(0)}%</span>
              </div>
              <div className="flex items-center space-x-1">
                <Cloud className="h-4 w-4 text-gray-500" />
                <span>{currentWeather.rainfall.toFixed(1)}mm</span>
              </div>
              <div className="flex items-center space-x-1">
                <Wind className="h-4 w-4 text-green-500" />
                <span>{currentWeather.windSpeed.toFixed(1)} km/h</span>
              </div>
              <div className="flex items-center space-x-1 text-gray-500">
                <Clock className="h-4 w-4" />
                <span>Actualizado: {lastUpdate.toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lista de alertas */}
      <div className="space-y-4">
        {filteredAlerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay alertas activas</h3>
            <p className="text-gray-600">Las condiciones actuales no indican riesgos significativos de plagas.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`bg-white rounded-lg shadow-sm border-l-4 border border-gray-200 p-6 cursor-pointer hover:shadow-md transition-shadow ${
                alert.riskLevel === 'critical' ? 'border-l-red-500' :
                alert.riskLevel === 'high' ? 'border-l-orange-500' :
                alert.riskLevel === 'medium' ? 'border-l-yellow-500' : 'border-l-green-500'
              }`}
              onClick={() => onAlertClick?.(alert)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-2xl">{getPestTypeIcon(alert.pestType)}</span>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{alert.title}</h3>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getRiskLevelColor(alert.riskLevel)}`}>
                          {getRiskLevelText(alert.riskLevel)}
                        </span>
                        <span className="text-sm text-gray-500">
                          {(alert.probability * 100).toFixed(1)}% probabilidad
                        </span>
                        <span className="text-sm text-gray-500">
                          {(alert.confidence * 100).toFixed(0)}% confianza
                        </span>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-700 mb-3">{alert.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Cronología
                      </h4>
                      <p className="text-sm text-gray-600">{formatTimeframe(alert.timeframe)}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2 flex items-center">
                        <Target className="h-4 w-4 mr-1" />
                        Áreas Afectadas
                      </h4>
                      <p className="text-sm text-gray-600">{alert.affectedAreas.join(', ')}</p>
                    </div>
                  </div>

                  {/* Recomendaciones */}
                  <div className="space-y-3">
                    {alert.recommendations.immediate.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-red-700 mb-1">Acciones Inmediatas:</h4>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          {alert.recommendations.immediate.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {alert.recommendations.preventive.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-yellow-700 mb-1">Medidas Preventivas:</h4>
                        <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                          {alert.recommendations.preventive.map((rec, index) => (
                            <li key={index}>{rec}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>

                {/* Acciones */}
                <div className="flex flex-col space-y-2 ml-4">
                  {!alert.acknowledgedAt && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        acknowledgeAlert(alert.id);
                      }}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Reconocer</span>
                    </button>
                  )}
                  
                  {alert.isActive && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resolveAlert(alert.id);
                      }}
                      className="flex items-center space-x-1 px-3 py-1 text-sm bg-green-50 text-green-600 rounded-md hover:bg-green-100"
                    >
                      <XCircle className="h-4 w-4" />
                      <span>Resolver</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Estado de la alerta */}
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center space-x-4">
                  <span>Creada: {alert.createdAt.toLocaleString()}</span>
                  {alert.acknowledgedAt && (
                    <span className="text-blue-600">Reconocida: {alert.acknowledgedAt.toLocaleString()}</span>
                  )}
                  {alert.resolvedAt && (
                    <span className="text-green-600">Resuelta: {alert.resolvedAt.toLocaleString()}</span>
                  )}
                </div>
                <div className="flex items-center space-x-1">
                  <BarChart3 className="h-3 w-3" />
                  <span>ID: {alert.id.slice(-8)}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Resumen de predicciones */}
      {predictions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
            Resumen de Análisis Predictivo
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {predictions.map((analysis) => (
              <div key={analysis.pestType} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl mb-1">{getPestTypeIcon(analysis.pestType)}</div>
                <div className="text-sm font-medium text-gray-900 capitalize">{analysis.pestType}</div>
                <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getRiskLevelColor(analysis.prediction.riskLevel)}`}>
                  {getRiskLevelText(analysis.prediction.riskLevel)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {(analysis.prediction.probability * 100).toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlertasTempranasIA;
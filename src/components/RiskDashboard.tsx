import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    AlertTriangle,
    TrendingUp,
    MapPin,
    Calendar,
    Wind,
    Droplets,
    Thermometer,
    Shield,
    Activity,
    ArrowRight
} from 'lucide-react';
import { offlineDB } from '@/utils/offlineDB';
import { enhancedWeatherService } from '@/services/enhancedWeatherService';
import { predictiveAnalyticsService } from '@/services/predictiveAnalyticsService';
import { WeatherConditions } from '@/types/earlyWarning';

interface RiskMetric {
    id: string;
    name: string;
    score: number; // 0-100
    trend: 'up' | 'down' | 'stable';
    status: 'low' | 'medium' | 'high' | 'critical';
    lastUpdated: string;
}

interface RiskFactor {
    category: string;
    factors: {
        name: string;
        risk: 'low' | 'medium' | 'high';
        description: string;
    }[];
}

const RiskDashboard: React.FC = () => {
    const [metrics, setMetrics] = useState<RiskMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [weatherData, setWeatherData] = useState<WeatherConditions | null>(null);
    const [recommendation, setRecommendation] = useState<string>('');

    useEffect(() => {
        const loadRealRiskData = async () => {
            try {
                setLoading(true);

                // 1. Obtener datos reales de plagas de la BD Offline
                const pestMonitorings = await offlineDB.pestMonitoring.toArray();

                // Calcular Presión de Plagas Real
                let pestPressureScore = 0;
                if (pestMonitorings.length > 0) {
                    const criticalCount = pestMonitorings.filter(p => p.severity === 'CRITICAL').length;
                    const highCount = pestMonitorings.filter(p => p.severity === 'HIGH').length;
                    const mediumCount = pestMonitorings.filter(p => p.severity === 'MEDIUM').length;

                    const weightedSum = (criticalCount * 30) + (highCount * 15) + (mediumCount * 5);
                    pestPressureScore = Math.min(100, Math.round((weightedSum / Math.max(1, pestMonitorings.length)) * 10));
                    if (pestMonitorings.length < 5 && criticalCount > 0) pestPressureScore = Math.max(pestPressureScore, 80);
                }

                // 1.5. Configurar Ubicación basada en Lotes para el Clima
                const lots = await offlineDB.lots.toArray();
                let farmLat = 0;
                let farmLon = 0;
                let validCoordsCount = 0;

                lots.forEach(lot => {
                    if (lot.coordinates) {
                        // Formato esperado "lat, lon" o similar
                        const parts = lot.coordinates.split(',').map(s => parseFloat(s.trim()));
                        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                            farmLat += parts[0];
                            farmLon += parts[1];
                            validCoordsCount++;
                        }
                    }
                });

                if (validCoordsCount > 0) {
                    // Centroide simple
                    const avgLat = farmLat / validCoordsCount;
                    const avgLon = farmLon / validCoordsCount;
                    // Establecer ubicación en el servicio
                    enhancedWeatherService.setLocation(avgLat, avgLon);
                    console.log(`Clima obtenido para ubicación de lotes: ${avgLat}, ${avgLon}`);
                } else {
                    console.log("No se encontraron coordenadas en los lotes, usando ubicación por defecto o GPS.");
                }

                // 2. Obtener datos climáticos del servicio (Con la ubicación ya configurada o por defecto)
                const weatherAnalysis = await enhancedWeatherService.getWeatherAnalysis();
                setWeatherData(weatherAnalysis.current);

                // Riesgo Climático basado en alertas y condiciones actuales
                let weatherRiskScore = 0;
                if (weatherAnalysis.alerts.length > 0) {
                    const criticalWeather = weatherAnalysis.alerts.filter(a => a.severity === 'critical').length;
                    weatherRiskScore = Math.min(100, 40 + (criticalWeather * 30));
                } else {
                    // Base risk derived from overall factors
                    weatherRiskScore = Math.round(weatherAnalysis.pestRiskFactors.overall * 100);
                }

                // 3. Obtener Riesgo via Predictive Analytics
                // Usamos datos dummy si no hay históricos suficientes
                const prediction = await predictiveAnalyticsService.analyzePestRisk(weatherAnalysis.current, []);
                const maxPredictionProbability = prediction.reduce((max, p) => Math.max(max, p.prediction.probability), 0);
                const diseasesRiskScore = Math.round(maxPredictionProbability * 100);

                // 4. Vulnerabilidad de Cultivo (Mock realistico basado en datos de finca)
                // Idealmente leeríamos la edad del cultivo, variedad, etc.
                const vulnerabilityScore = 40; // Valor base medio

                // Construir métricas finales
                const newMetrics: RiskMetric[] = [
                    {
                        id: '1',
                        name: 'Riesgo Climático',
                        score: weatherRiskScore,
                        trend: weatherRiskScore > 50 ? 'up' : 'stable',
                        status: getStatusFromScore(weatherRiskScore),
                        lastUpdated: new Date().toISOString()
                    },
                    {
                        id: '2',
                        name: 'Presión de Plagas',
                        score: pestPressureScore,
                        trend: pestPressureScore > 20 ? 'up' : 'stable',
                        status: getStatusFromScore(pestPressureScore),
                        lastUpdated: new Date().toISOString()
                    },
                    {
                        id: '3',
                        name: 'Vulnerabilidad Cultivo',
                        score: vulnerabilityScore,
                        trend: 'stable',
                        status: 'medium',
                        lastUpdated: new Date().toISOString()
                    },
                    {
                        id: '4',
                        name: 'Riesgo Enfermedades',
                        score: diseasesRiskScore,
                        trend: diseasesRiskScore > 60 ? 'up' : 'down',
                        status: getStatusFromScore(diseasesRiskScore),
                        lastUpdated: new Date().toISOString()
                    }
                ];

                setMetrics(newMetrics);

                // Generar recomendación contextual
                if (pestPressureScore > 70) {
                    setRecommendation('¡Alerta Crítica! La presión de plagas es muy alta. Inicie control químico inmediato en focos detectados.');
                } else if (weatherRiskScore > 70) {
                    setRecommendation('Condiciones climáticas extremas detectadas. Priorice la protección del cultivo y el drenaje.');
                } else if (diseasesRiskScore > 60) {
                    setRecommendation('Alto riesgo de enfermedades fúngicas debido al clima. Considere aplicaciones preventivas.');
                } else {
                    setRecommendation('Condiciones estables. Continúe con el monitoreo rutinario semanal.');
                }

            } catch (err) {
                console.error("Error loading risk data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadRealRiskData();
    }, []);

    const getStatusFromScore = (score: number) => {
        if (score >= 80) return 'critical';
        if (score >= 60) return 'high';
        if (score >= 40) return 'medium';
        return 'low';
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'critical': return 'text-red-600 bg-red-50 border-red-200';
            case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
            case 'low': return 'text-green-600 bg-green-50 border-green-200';
            default: return 'text-gray-600 bg-gray-50 border-gray-200';
        }
    };

    const getProgressColor = (score: number) => {
        if (score >= 80) return 'bg-red-500';
        if (score >= 60) return 'bg-orange-500';
        if (score >= 40) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Cargando análisis de riesgos en tiempo real...</div>;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Dashboard de Riesgos Integrados</h2>
                    <p className="text-gray-600">Monitoreo en tiempo real basado en datos de campo y clima</p>
                </div>
                <div className="flex bg-blue-50 px-4 py-2 rounded-lg text-blue-700 items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    <span className="font-semibold">Protección Activa</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {metrics.map((metric) => (
                    <Card key={metric.id} className="border-l-4" style={{ borderLeftColor: metric.score >= 80 ? '#ef4444' : metric.score >= 60 ? '#f97316' : metric.score >= 40 ? '#eab308' : '#22c55e' }}>
                        <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-2">
                                <span className="text-sm font-medium text-gray-600">{metric.name}</span>
                                <Activity className={`w-4 h-4 ${metric.trend === 'up' ? 'text-red-500' : 'text-green-500'}`} />
                            </div>
                            <div className="flex items-end justify-between mb-2">
                                <span className="text-3xl font-bold text-gray-900">{metric.score}%</span>
                                <Badge variant="outline" className={getStatusColor(metric.status)}>
                                    {metric.status.toUpperCase()}
                                </Badge>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div
                                    className={`h-1.5 rounded-full ${getProgressColor(metric.score)}`}
                                    style={{ width: `${metric.score}%` }}
                                ></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="w-5 h-5 text-gray-500" />
                            Mapa de Vulnerabilidad
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="h-64 flex items-center justify-center bg-gray-50 rounded-md border border-dashed border-gray-300 m-4">
                        <div className="text-center text-gray-500">
                            <MapPin className="w-10 h-10 mx-auto mb-2 opacity-50" />
                            <p>Visualización geoespacial requiere conexión a internet para cargar mapas.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-gray-500" />
                            Factores Climáticos (Tiempo Real)
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {weatherData ? (
                                <>
                                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
                                        <div className="flex items-center gap-3">
                                            <Thermometer className="w-5 h-5 text-red-500" />
                                            <div>
                                                <p className="font-medium text-gray-900">Temperatura</p>
                                                <p className="text-xs text-gray-600">Actual: {weatherData.temperature.toFixed(1)}°C</p>
                                            </div>
                                        </div>
                                        <Badge className={weatherData.temperature > 30 ? "bg-red-200 text-red-800" : "bg-green-200 text-green-800"}>
                                            {weatherData.temperature > 30 ? 'Alta' : 'Normal'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-3">
                                            <Droplets className="w-5 h-5 text-blue-500" />
                                            <div>
                                                <p className="font-medium text-gray-900">Humedad</p>
                                                <p className="text-xs text-gray-600">Actual: {weatherData.humidity.toFixed(1)}%</p>
                                            </div>
                                        </div>
                                        <Badge className={weatherData.humidity > 80 ? "bg-orange-200 text-orange-800" : "bg-green-200 text-green-800"}>
                                            {weatherData.humidity > 80 ? 'Alta' : 'Normal'}
                                        </Badge>
                                    </div>

                                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                                        <div className="flex items-center gap-3">
                                            <Wind className="w-5 h-5 text-gray-500" />
                                            <div>
                                                <p className="font-medium text-gray-900">Viento</p>
                                                <p className="text-xs text-gray-600">{weatherData.windSpeed.toFixed(1)} km/h</p>
                                            </div>
                                        </div>
                                        <Badge variant="outline">Normal</Badge>
                                    </div>
                                </>
                            ) : (
                                <p className="text-center text-gray-500">Cargando datos climáticos...</p>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold mb-2">Recomendación Inteligente</h3>
                        <p className="text-indigo-100">{recommendation}</p>
                    </div>
                    <Button variant="secondary" className="shrink-0">
                        Ver Detalles <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default RiskDashboard;

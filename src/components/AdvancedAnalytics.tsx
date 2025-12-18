import React, { useState, useEffect } from 'react';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, ComposedChart, Bar
} from 'recharts';
import { Download, Calendar, Filter, Activity } from 'lucide-react';
import jsPDF from 'jspdf';
import { offlineDB } from '../utils/offlineDB';
import { enhancedWeatherService } from '../services/enhancedWeatherService';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const AdvancedAnalytics: React.FC = () => {
    const [temporalData, setTemporalData] = useState<any[]>([]);
    const [distributionData, setDistributionData] = useState<any[]>([]);
    const [applicationWindow, setApplicationWindow] = useState<any[]>([]);
    const [heatmapData, setHeatmapData] = useState<any[]>([]);
    const [correlationData, setCorrelationData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasValidLocation, setHasValidLocation] = useState(false);

    useEffect(() => {
        loadAnalyticsData();
    }, []);

    const loadAnalyticsData = async () => {
        setLoading(true);
        try {
            // -- Cargar Pronóstico para Ventana de Aplicación (Independiente de si hay historial de plagas) --
            const forecast = await enhancedWeatherService.generateForecastFromAPI(4); // 3-4 días

            const windowData = forecast.slice(0, 3).map(day => {
                const rain = day.rainfall || 0;
                const wind = day.windSpeed || 0;

                let status = 'good';
                let label = 'Óptimo';

                if (rain >= 5 || wind >= 15) {
                    status = 'bad';
                    label = 'No Recomendado';
                } else if (rain >= 1 || wind >= 10) {
                    status = 'fair';
                    label = 'Precaución';
                }

                return {
                    date: day.forecastDate.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric' }),
                    status,
                    label,
                    rain: rain.toFixed(1),
                    wind: wind.toFixed(1)
                };
            });
            setApplicationWindow(windowData);

            // 1. Cargar datos históricos reales de monitoreos y Lotes para ubicación
            const pestMonitorings = await offlineDB.pestMonitoring.toArray();
            const lots = await offlineDB.lots.toArray();

            // Calcular Centroide de la Finca (Promedio de coordenadas de todos los lotes)
            // Esto asegura que si el usuario            // Calcular Centroide de la Finca (Promedio de coordenadas de todos los lotes)
            let lat: number | null = null;
            let lon: number | null = null;

            let validCoordsCount = 0;
            let latSum = 0;
            let lonSum = 0;

            lots.forEach(lot => {
                if (lot.coordinates) {
                    const parts = lot.coordinates.split(',');
                    if (parts.length === 2) {
                        const lLat = parseFloat(parts[0]);
                        const lLon = parseFloat(parts[1]);
                        if (!isNaN(lLat) && !isNaN(lLon)) {
                            latSum += lLat;
                            lonSum += lLon;
                            validCoordsCount++;
                        }
                    }
                }
            });

            setHasValidLocation(validCoordsCount > 0);

            if (validCoordsCount > 0) {
                lat = latSum / validCoordsCount;
                lon = lonSum / validCoordsCount;
                console.log(`📍 Clima calculado para centroide de la finca: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
            } else {
                console.warn("⚠️ No se encontraron coordenadas válidas en los lotes. No se puede obtener clima histórico.");
            }

            // -- PRE-PROCESAMIENTO: Calcular Estadísticas Mensuales --
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

            // Cargar Histórico de Lluvias REAL solo si tenemos ubicación
            let weatherHistory: { date: string; rainfall: number }[] = [];

            if (lat !== null && lon !== null) {
                weatherHistory = await enhancedWeatherService.getHistoricalWeather(lat, lon, sixMonthsAgo, new Date());
            }

            // Agrupar lluvia por mes
            const rainByMonth = new Map<string, number>();
            weatherHistory.forEach(day => {
                const [y, m, d] = day.date.split('-').map(Number);
                const key = `${m}/${y}`;
                const current = rainByMonth.get(key) || 0;
                rainByMonth.set(key, current + day.rainfall);
            });

            const monthlyStats = new Map<string, { count: number; totalSeverity: number }>();

            pestMonitorings.forEach(m => {
                const date = new Date(m.observationDate);
                if (date >= sixMonthsAgo) {
                    const key = `${date.getMonth() + 1}/${date.getFullYear()}`; // Formato M/YYYY
                    const current = monthlyStats.get(key) || { count: 0, totalSeverity: 0 };

                    let severityVal = 1;
                    if (m.severity === 'MEDIUM' || m.severity === 'warning') severityVal = 2;
                    if (m.severity === 'HIGH' || m.severity === 'risk') severityVal = 3;
                    if (m.severity === 'CRITICAL' || m.severity === 'critical') severityVal = 4;

                    monthlyStats.set(key, {
                        count: current.count + 1,
                        totalSeverity: current.totalSeverity + severityVal
                    });
                }
            });

            // -- Procesar Datos Temporales (Tendencia Mensual) --
            const tempChartData = Array.from(monthlyStats.entries()).map(([name, data]) => ({
                name,
                riesgoPromedio: (data.totalSeverity / data.count).toFixed(2),
                detecciones: data.count
            }));
            setTemporalData(tempChartData);

            // -- Procesar Correlación (Lluvia REAL vs Detecciones) --
            // Primero aseguramos que existan keys para los meses con lluvia aunque no tengan plagas (para contexto)
            rainByMonth.forEach((rain, key) => {
                if (!monthlyStats.has(key)) {
                    monthlyStats.set(key, { count: 0, totalSeverity: 0 });
                }
            });

            const correlationProcessed = Array.from(monthlyStats.entries()).map(([dateStr, stat], index) => {
                const realRain = rainByMonth.get(dateStr) || 0;

                return {
                    date: dateStr,
                    detections: stat.count,
                    rain: Math.round(realRain) // Lluvia acumulada mensual real
                };
            }).sort((a, b) => {
                const [mA, yA] = a.date.split('/').map(Number);
                const [mB, yB] = b.date.split('/').map(Number);
                return new Date(yA, mA - 1).getTime() - new Date(yB, mB - 1).getTime();
            });

            if (correlationProcessed.length > 0) {
                setCorrelationData(correlationProcessed);
            } else {
                setCorrelationData([]);
            }

            // -- Procesar Mapa de Calor (Riesgo por Lote) --
            const lotStats = new Map<string, { count: number; totalSeverity: number }>();
            pestMonitorings.forEach(m => {
                const lote = m.lotId || 'Sin Lote'; // Fixed property name
                const current = lotStats.get(lote) || { count: 0, totalSeverity: 0 };

                let severityVal = 1;
                if (m.severity === 'MEDIUM' || m.severity === 'warning') severityVal = 2;
                if (m.severity === 'HIGH' || m.severity === 'risk') severityVal = 3;
                if (m.severity === 'CRITICAL' || m.severity === 'critical') severityVal = 4;

                lotStats.set(lote, {
                    count: current.count + 1,
                    totalSeverity: current.totalSeverity + severityVal
                });
            });

            const heatMapProcessed = Array.from(lotStats.entries()).map(([loteId, stat]) => {
                const avg = stat.totalSeverity / stat.count;
                let riskLevel = 'Low';
                if (avg > 3.5) riskLevel = 'Critical';
                else if (avg > 2.5) riskLevel = 'High';
                else if (avg > 1.5) riskLevel = 'Medium';

                return { loteId, detections: stat.count, riskLevel, avgSeverity: avg };
            }).sort((a, b) => b.avgSeverity - a.avgSeverity);

            setHeatmapData(heatMapProcessed);

            // -- Preparar Datos de Distribución (Pie Chart) --
            // Agrupar por severidad actual (o predicciones recientes si no hay monitoreos)
            // Para este ejemplo usaremos los monitoreos recientes como "Estado Actual de la Finca"
            const severityCounts = { Low: 0, Medium: 0, High: 0, Critical: 0 };

            pestMonitorings.forEach(m => {
                // Solo considerar monitoreos recientes (último mes)
                const oneMonthAgo = new Date();
                oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
                if (new Date(m.observationDate) >= oneMonthAgo) {
                    if (m.severity === 'vulnerable' || m.severity === 'LOW' || m.severity === 'low') severityCounts.Low++;
                    else if (m.severity === 'warning' || m.severity === 'MEDIUM' || m.severity === 'medium') severityCounts.Medium++;
                    else if (m.severity === 'risk' || m.severity === 'HIGH' || m.severity === 'high') severityCounts.High++;
                    else if (m.severity === 'critical' || m.severity === 'CRITICAL') severityCounts.Critical++;
                }
            });

            let distData = [
                { name: 'Bajo', value: severityCounts.Low, color: '#22c55e' },
                { name: 'Medio', value: severityCounts.Medium, color: '#f97316' },
                { name: 'Alto', value: severityCounts.High, color: '#ef4444' },
                { name: 'Crítico', value: severityCounts.Critical, color: '#dc2626' },
            ].filter(d => d.value > 0);

            setDistributionData(distData);

        } catch (error) {
            console.error("Error loading analytics:", error);
        } finally {
            setLoading(false);
        }
    };

    const generatePDFReport = () => {
        const doc = new jsPDF();

        // Título
        doc.setFontSize(20);
        doc.setTextColor(40, 40, 40);
        doc.text("Reporte de Riesgos Fitosanitarios", 20, 20);

        // Fecha
        doc.setFontSize(10);
        doc.text(`Generado el: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 20, 30);

        // Línea separadora
        doc.setLineWidth(0.5);
        doc.line(20, 35, 190, 35);

        // Resumen
        doc.setFontSize(14);
        doc.text("Resumen Ejecutivo", 20, 45);
        doc.setFontSize(10);

        const summaryText = `Este reporte presenta el estado actual de riesgos fitosanitarios para la finca. ` +
            `Se han analizado ${temporalData.reduce((acc, curr) => acc + curr.detecciones, 0)} puntos de datos históricos ` +
            `y las condiciones climáticas actuales.`;

        const splitText = doc.splitTextToSize(summaryText, 170);
        doc.text(splitText, 20, 55);

        // Tabla simulada de datos (Solo texto simple por ahora)
        let yPos = 80;
        doc.setFontSize(12);
        doc.text("Detalle de Tendencias (Últimos 6 meses)", 20, yPos);
        yPos += 10;

        temporalData.forEach(d => {
            doc.setFontSize(10);
            doc.text(`${d.name}: Riesgo Promedio ${d.riesgoPromedio} - Detecciones: ${d.detecciones}`, 30, yPos);
            yPos += 7;
        });

        // Pie de página
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text("Generado por Sistema de Gestión Cafetera - Módulo IA", 20, 280);

        doc.save("reporte_riesgos_cafe.pdf");
    };

    if (loading) return <div className="text-center p-10">Cargando datos analíticos...</div>;

    return (
        <div className="space-y-6">
            {/* Header de la sección */}
            <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div>
                    <h2 className="text-lg font-bold text-gray-900">Análisis Histórico y Proyecciones</h2>
                    <p className="text-sm text-gray-500">Basado en tus registros de monitoreo y clima local</p>
                </div>
                <button
                    onClick={generatePDFReport}
                    className="mt-3 sm:mt-0 flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                    <Download className="w-4 h-4" />
                    Descargar Reporte PDF
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Gráfico de Tendencia */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        Tendencia de Riesgo (Últimos 6 meses)
                    </h3>
                    <div className="h-64 w-full">
                        {temporalData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={temporalData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis domain={[0, 4]} label={{ value: 'Nivel Riesgo', angle: -90, position: 'insideLeft' }} />
                                    <Tooltip />
                                    <Legend />
                                    <Line type="monotone" dataKey="riesgoPromedio" name="Severidad Promedio" stroke="#8884d8" activeDot={{ r: 8 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg bg-gray-50">
                                <Calendar className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm font-medium">No hay historial de tendencias</p>
                                <p className="text-xs text-gray-400 mt-1 max-w-[200px] text-center">Registra monitoreos de plagas para ver su evolución en el tiempo.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Gráfico de Distribución */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <Filter className="w-4 h-4 text-orange-500" />
                        Distribución de Alertas Actuales
                    </h3>
                    <div className="h-64 w-full flex justify-center">
                        {distributionData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={distributionData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {distributionData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full w-full flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-lg bg-gray-50">
                                <Filter className="w-8 h-8 mb-2 opacity-50" />
                                <p className="text-sm font-medium">Sin datos de distribución</p>
                                <p className="text-xs text-gray-400 mt-1 max-w-[200px] text-center">No hay alertas activas ni monitoreos recientes para analizar.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Ventana de Aplicación (Semáforo) */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                <h3 className="text-md font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    Ventana de Aplicación Sugerida (Próximos 3 días)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {applicationWindow.map((day, idx) => (
                        <div key={idx} className={`p-4 rounded-lg border flex flex-col items-center text-center ${day.status === 'good' ? 'bg-green-50 border-green-200' :
                            day.status === 'fair' ? 'bg-yellow-50 border-yellow-200' :
                                'bg-red-50 border-red-200'
                            }`}>
                            <p className="font-bold text-gray-900 mb-1">{day.date}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-bold mb-2 ${day.status === 'good' ? 'bg-green-200 text-green-800' :
                                day.status === 'fair' ? 'bg-yellow-200 text-yellow-800' :
                                    'bg-red-200 text-red-800'
                                }`}>
                                {day.label}
                            </span>
                            <div className="text-xs text-gray-600 space-y-1">
                                <p>Lluvia: {day.rain}mm</p>
                                <p>Viento: {day.wind}km/h</p>
                            </div>
                        </div>
                    ))}
                    {applicationWindow.length === 0 && (
                        <div className="col-span-3 text-center text-gray-400 py-4">
                            Cargando pronóstico para aplicaciones...
                        </div>
                    )}
                </div>
                <p className="text-xs text-center text-gray-400 mt-3">
                    * Recomendación basada en pronóstico de lluvia y viento local. Siempre verifique visualmente antes de aplicar.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Mapa de Calor por Lote */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-md font-semibold text-gray-800 mb-4">
                        Mapa de Calor de Riesgo
                    </h3>
                    {heatmapData.length > 0 ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                            {heatmapData.map((lot, idx) => (
                                <div key={idx} className={`aspect-square rounded-lg flex flex-col items-center justify-center p-2 text-center border ${lot.riskLevel === 'High' || lot.riskLevel === 'Critical' ? 'bg-red-100 border-red-300 text-red-800' :
                                    lot.riskLevel === 'Medium' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                                        'bg-green-100 border-green-300 text-green-800'
                                    }`}>
                                    <span className="font-bold text-sm">{lot.loteId}</span>
                                    <span className="text-xs mt-1">{lot.detections} obs.</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="h-40 flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-100 rounded-lg">
                            Sin datos suficientes por lote
                        </div>
                    )}
                </div>

                {/* Correlación (Placeholder Inteligente) */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <h3 className="text-md font-semibold text-gray-800 mb-4">
                        Correlación Clima vs Plagas
                    </h3>
                    {correlationData.length > 0 ? (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart
                                    data={correlationData}
                                    margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                                >
                                    <XAxis dataKey="date" />
                                    <YAxis yAxisId="left" label={{ value: 'Detecciones', angle: -90, position: 'insideLeft' }} />
                                    <YAxis yAxisId="right" orientation="right" label={{ value: 'Lluvia (mm)', angle: 90, position: 'insideRight' }} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="detections" fill="#8884d8" name="Detecciones" />
                                    <Line yAxisId="right" type="monotone" dataKey="rain" stroke="#82ca9d" name="Lluvia (mm)" />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-4 border-2 border-dashed border-gray-100 rounded-lg bg-gray-50">
                            {!hasValidLocation ? (
                                <>
                                    <Activity className="h-10 w-10 text-orange-400 mb-2" />
                                    <p className="text-gray-900 font-medium">Ubicación No Detectada</p>
                                    <p className="text-sm text-gray-500 mt-2 max-w-[250px]">
                                        No se encontraron coordenadas en sus lotes. Por favor registre o actualice la ubicación de sus lotes para ver el clima local.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <Activity className="h-10 w-10 text-indigo-300 mb-2" />
                                    <p className="text-gray-900 font-medium">Sin Datos Recientes</p>
                                    <p className="text-sm text-gray-500 mt-2">
                                        No hay registros de monitoreo o clima en el periodo seleccionado para generar correlaciones.
                                    </p>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg text-sm text-blue-800">
                <strong>Nota:</strong> Estos análisis mejoran automáticamente a medida que registras más monitoreos en el módulo de "Sanidad Vegetal".
            </div>
        </div >
    );
};

export default AdvancedAnalytics;

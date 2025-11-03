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
import { TrendingUp, BarChart3, PieChart as PieChartIcon, Calendar } from 'lucide-react';

interface PestAnalyticsProps {
  farmId?: number;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];

const PestAnalytics: React.FC<PestAnalyticsProps> = ({ farmId, dateRange }) => {
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedChart, setSelectedChart] = useState<'trends' | 'severity' | 'pests' | 'timeline'>('trends');

  useEffect(() => {
    fetchAnalyticsData();
  }, [farmId, dateRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Construir query parameters
      const params = new URLSearchParams();
      if (farmId) params.append('farmId', farmId.toString());
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

      const [statsResponse, monitoringResponse] = await Promise.all([
        fetch(`/api/pests/stats?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/pests?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statsResponse.ok && monitoringResponse.ok) {
        const statsData = await statsResponse.json();
        const monitoringData = await monitoringResponse.json();
        
        setAnalyticsData({
          stats: statsData.data || {},
          monitoring: monitoringData.data?.monitoring || []
        });
      }
    } catch (error) {
      console.error('Error fetching analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processTimelineData = () => {
    if (!analyticsData?.monitoring) return [];

    const timelineMap = new Map();
    
    analyticsData.monitoring.forEach((item: any) => {
      const date = new Date(item.createdAt).toISOString().split('T')[0];
      if (!timelineMap.has(date)) {
        timelineMap.set(date, {
          date,
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0,
          affectedArea: 0
        });
      }
      
      const dayData = timelineMap.get(date);
      dayData.total += 1;
      dayData[item.severity.toLowerCase()] += 1;
      dayData.affectedArea += item.affectedArea;
    });

    return Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  };

  const processPestTypeData = () => {
    if (!analyticsData?.stats?.byPestType) return [];

    return analyticsData.stats.byPestType.map((item: any) => ({
      name: getPestTypeText(item.pestType),
      value: item.count,
      percentage: ((item.count / analyticsData.stats.total) * 100).toFixed(1)
    }));
  };

  const processSeverityData = () => {
    if (!analyticsData?.stats?.bySeverity) return [];

    return Object.entries(analyticsData.stats.bySeverity).map(([severity, count]) => ({
      name: getSeverityText(severity),
      value: count as number,
      color: getSeverityColor(severity)
    }));
  };

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

  const getSeverityText = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'Crítico';
      case 'HIGH': return 'Alto';
      case 'MEDIUM': return 'Medio';
      case 'LOW': return 'Bajo';
      default: return severity;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return '#ef4444';
      case 'HIGH': return '#f97316';
      case 'MEDIUM': return '#eab308';
      case 'LOW': return '#22c55e';
      default: return '#6b7280';
    }
  };

  const timelineData = processTimelineData();
  const pestTypeData = processPestTypeData();
  const severityData = processSeverityData();

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Análisis de Plagas
          </h3>
          <div className="flex gap-2">
            {[
              { key: 'trends', label: 'Tendencias', icon: TrendingUp },
              { key: 'severity', label: 'Severidad', icon: PieChartIcon },
              { key: 'pests', label: 'Por Tipo', icon: BarChart3 },
              { key: 'timeline', label: 'Línea de Tiempo', icon: Calendar }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setSelectedChart(key as any)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors flex items-center gap-1 ${
                  selectedChart === key
                    ? 'bg-amber-100 text-amber-700 border border-amber-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Icon className="h-3 w-3" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6">
        {selectedChart === 'trends' && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                  formatter={(value, name) => [value, name === 'total' ? 'Total Monitoreos' : name]}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.6}
                  name="Total Monitoreos"
                />
                <Area
                  type="monotone"
                  dataKey="affectedArea"
                  stackId="2"
                  stroke="#ef4444"
                  fill="#ef4444"
                  fillOpacity={0.6}
                  name="Área Afectada (ha)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedChart === 'severity' && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={severityData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percentage }) => `${name}: ${value} (${((value / analyticsData.stats.total) * 100).toFixed(1)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {severityData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedChart === 'pests' && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pestTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [value, 'Cantidad de Monitoreos']}
                />
                <Bar dataKey="value" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {selectedChart === 'timeline' && (
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString('es-ES')}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="critical"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Crítico"
                />
                <Line
                  type="monotone"
                  dataKey="high"
                  stroke="#f97316"
                  strokeWidth={2}
                  name="Alto"
                />
                <Line
                  type="monotone"
                  dataKey="medium"
                  stroke="#eab308"
                  strokeWidth={2}
                  name="Medio"
                />
                <Line
                  type="monotone"
                  dataKey="low"
                  stroke="#22c55e"
                  strokeWidth={2}
                  name="Bajo"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Resumen de Datos */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.stats?.total || 0}
              </p>
              <p className="text-sm text-gray-600">Total Monitoreos</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">
                {analyticsData?.stats?.bySeverity?.CRITICAL || 0}
              </p>
              <p className="text-sm text-gray-600">Alertas Críticas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">
                {analyticsData?.stats?.bySeverity?.HIGH || 0}
              </p>
              <p className="text-sm text-gray-600">Alertas Altas</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analyticsData?.stats?.totalAffectedArea?.toFixed(1) || 0} ha
              </p>
              <p className="text-sm text-gray-600">Área Afectada</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestAnalytics;
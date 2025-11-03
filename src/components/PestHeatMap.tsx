import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, Popup } from 'react-leaflet';
import { FeatureCollection, Feature, Polygon } from 'geojson';
import { AlertTriangle, Bug, TrendingUp, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface PestData {
  lotId: number;
  lotName: string;
  area: number;
  totalMonitoring: number;
  criticalAlerts: number;
  highAlerts: number;
  averageSeverity: number;
  dominantPest: string;
  lastMonitoring: string;
  infestationLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface PestHeatMapProps {
  farmId?: number;
  selectedPestType?: string;
  dateRange?: {
    startDate: string;
    endDate: string;
  };
}

const PestHeatMap: React.FC<PestHeatMapProps> = ({ farmId, selectedPestType, dateRange }) => {
  const [lots, setLots] = useState<any[]>([]);
  const [pestData, setPestData] = useState<PestData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLot, setSelectedLot] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, [farmId, selectedPestType, dateRange]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Construir parámetros de consulta
      const params = new URLSearchParams();
      if (farmId) params.append('farmId', farmId.toString());
      if (selectedPestType) params.append('pestType', selectedPestType);
      if (dateRange?.startDate) params.append('startDate', dateRange.startDate);
      if (dateRange?.endDate) params.append('endDate', dateRange.endDate);

      const [lotsResponse, pestStatsResponse] = await Promise.all([
        fetch('/api/lots', {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/pests/heatmap?${params.toString()}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (lotsResponse.ok && pestStatsResponse.ok) {
        const lotsData = await lotsResponse.json();
        const pestStatsData = await pestStatsResponse.json();
        
        setLots(lotsData.data || []);
        setPestData(pestStatsData.data || []);
      }
    } catch (error) {
      console.error('Error fetching heat map data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getInfestationColor = (level: string, opacity: number = 0.7) => {
    switch (level) {
      case 'CRITICAL': return `rgba(239, 68, 68, ${opacity})`;
      case 'HIGH': return `rgba(249, 115, 22, ${opacity})`;
      case 'MEDIUM': return `rgba(234, 179, 8, ${opacity})`;
      case 'LOW': return `rgba(34, 197, 94, ${opacity})`;
      default: return `rgba(156, 163, 175, ${opacity})`;
    }
  };

  const getInfestationLevel = (pestInfo: PestData): string => {
    if (!pestInfo) return 'NO_DATA';
    
    const criticalRatio = pestInfo.criticalAlerts / Math.max(pestInfo.totalMonitoring, 1);
    const highRatio = pestInfo.highAlerts / Math.max(pestInfo.totalMonitoring, 1);
    
    if (criticalRatio > 0.3 || pestInfo.averageSeverity >= 4) return 'CRITICAL';
    if (criticalRatio > 0.1 || highRatio > 0.3 || pestInfo.averageSeverity >= 3) return 'HIGH';
    if (highRatio > 0.1 || pestInfo.averageSeverity >= 2) return 'MEDIUM';
    return 'LOW';
  };

  const createGeoJSONFeature = (lot: any): Feature<Polygon> => {
    const pestInfo = pestData.find(p => p.lotId === lot.id);
    const infestationLevel = pestInfo ? getInfestationLevel(pestInfo) : 'NO_DATA';
    
    return {
      type: 'Feature',
      properties: {
        id: lot.id,
        name: lot.name,
        area: lot.area,
        infestationLevel,
        pestInfo
      },
      geometry: lot.coordinates ? JSON.parse(lot.coordinates) : {
        type: 'Polygon',
        coordinates: [[
          [-75.5, 4.5],
          [-75.4, 4.5],
          [-75.4, 4.6],
          [-75.5, 4.6],
          [-75.5, 4.5]
        ]]
      }
    };
  };

  const geoJSONData: FeatureCollection<Polygon> = {
    type: 'FeatureCollection',
    features: lots.map(createGeoJSONFeature)
  };

  const onEachFeature = (feature: any, layer: any) => {
    const { properties } = feature;
    const pestInfo = properties.pestInfo;

    layer.setStyle({
      fillColor: getInfestationColor(properties.infestationLevel),
      weight: 2,
      opacity: 1,
      color: '#ffffff',
      dashArray: '',
      fillOpacity: 0.7
    });

    layer.on({
      mouseover: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 3,
          color: '#333',
          fillOpacity: 0.9
        });
      },
      mouseout: (e: any) => {
        const layer = e.target;
        layer.setStyle({
          weight: 2,
          color: '#ffffff',
          fillOpacity: 0.7
        });
      },
      click: (e: any) => {
        setSelectedLot({ ...properties, pestInfo });
      }
    });

    // Popup con información del lote
    const popupContent = `
      <div class="p-2">
        <h3 class="font-semibold text-gray-900">${properties.name}</h3>
        <p class="text-sm text-gray-600">Área: ${properties.area} ha</p>
        ${pestInfo ? `
          <div class="mt-2 space-y-1">
            <p class="text-sm"><span class="font-medium">Monitoreos:</span> ${pestInfo.totalMonitoring}</p>
            <p class="text-sm"><span class="font-medium">Alertas críticas:</span> ${pestInfo.criticalAlerts}</p>
            <p class="text-sm"><span class="font-medium">Alertas altas:</span> ${pestInfo.highAlerts}</p>
            <p class="text-sm"><span class="font-medium">Plaga dominante:</span> ${getPestTypeText(pestInfo.dominantPest)}</p>
            <p class="text-sm"><span class="font-medium">Último monitoreo:</span> ${new Date(pestInfo.lastMonitoring).toLocaleDateString('es-ES')}</p>
          </div>
        ` : '<p class="text-sm text-gray-500 mt-2">Sin datos de monitoreo</p>'}
      </div>
    `;

    layer.bindPopup(popupContent);
  };

  const getPestTypeText = (pestType: string) => {
    switch (pestType) {
      case 'BROCA': return 'Broca del Café';
      case 'ROYA': return 'Roya del Café';
      case 'MINADOR': return 'Minador de la Hoja';
      case 'COCHINILLA': return 'Cochinilla';
      case 'NEMATODOS': return 'Nematodos';
      default: return pestType || 'N/A';
    }
  };

  const getInfestationText = (level: string) => {
    switch (level) {
      case 'CRITICAL': return 'Crítico';
      case 'HIGH': return 'Alto';
      case 'MEDIUM': return 'Medio';
      case 'LOW': return 'Bajo';
      default: return 'Sin datos';
    }
  };

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
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Mapa de Calor - Niveles de Infestación
          </h3>
          
          {/* Leyenda */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-gray-600">Nivel de infestación:</span>
              {[
                { level: 'LOW', label: 'Bajo' },
                { level: 'MEDIUM', label: 'Medio' },
                { level: 'HIGH', label: 'Alto' },
                { level: 'CRITICAL', label: 'Crítico' }
              ].map(({ level, label }) => (
                <div key={level} className="flex items-center gap-1">
                  <div
                    className="w-4 h-4 rounded border border-gray-300"
                    style={{ backgroundColor: getInfestationColor(level) }}
                  />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa */}
          <div className="lg:col-span-2">
            <div className="h-96 rounded-lg overflow-hidden border border-gray-200">
              <MapContainer
                center={[4.5, -75.5]}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {geoJSONData.features.length > 0 && (
                  <GeoJSON
                    data={geoJSONData}
                    onEachFeature={onEachFeature}
                  />
                )}
              </MapContainer>
            </div>
          </div>

          {/* Panel de información */}
          <div className="space-y-4">
            {selectedLot ? (
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {selectedLot.name}
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Área:</span>
                    <span className="text-sm font-medium">{selectedLot.area} ha</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Nivel de infestación:</span>
                    <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                      selectedLot.infestationLevel === 'CRITICAL' ? 'bg-red-100 text-red-800' :
                      selectedLot.infestationLevel === 'HIGH' ? 'bg-orange-100 text-orange-800' :
                      selectedLot.infestationLevel === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {getInfestationText(selectedLot.infestationLevel)}
                    </span>
                  </div>

                  {selectedLot.pestInfo && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Total monitoreos:</span>
                        <span className="text-sm font-medium">{selectedLot.pestInfo.totalMonitoring}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Alertas críticas:</span>
                        <span className="text-sm font-medium text-red-600">{selectedLot.pestInfo.criticalAlerts}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Alertas altas:</span>
                        <span className="text-sm font-medium text-orange-600">{selectedLot.pestInfo.highAlerts}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Plaga dominante:</span>
                        <span className="text-sm font-medium">{getPestTypeText(selectedLot.pestInfo.dominantPest)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Último monitoreo:</span>
                        <span className="text-sm font-medium">
                          {new Date(selectedLot.pestInfo.lastMonitoring).toLocaleDateString('es-ES')}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-4 text-center">
                <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600">
                  Haz clic en un lote del mapa para ver información detallada
                </p>
              </div>
            )}

            {/* Resumen general */}
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <Bug className="h-4 w-4" />
                Resumen General
              </h4>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total lotes:</span>
                  <span className="font-medium">{lots.length}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Lotes con datos:</span>
                  <span className="font-medium">{pestData.length}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nivel crítico:</span>
                  <span className="font-medium text-red-600">
                    {pestData.filter(p => getInfestationLevel(p) === 'CRITICAL').length}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Nivel alto:</span>
                  <span className="font-medium text-orange-600">
                    {pestData.filter(p => getInfestationLevel(p) === 'HIGH').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PestHeatMap;
import { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Polygon, Polyline, useMapEvents, LayersControl } from "react-leaflet";
import { LatLngExpression, LatLng } from "leaflet";
import { MapPin, RotateCcw, Check, X, Layers, Info } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { FallbackTileLayer, TILE_LAYER_CONFIGS } from './FallbackTileLayer';

// Fix para los iconos de Leaflet en Vite
import L from "leaflet";

let DefaultIcon = L.divIcon({
  html: `<div style="background-color: #10b981; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface TerrainInfo {
  area: number;
  perimeter: number;
  centroid: LatLngExpression;
  estimatedAltitude: number;
  estimatedSlope: number;
  exposition: 'norte' | 'sur' | 'este' | 'oeste' | 'noreste' | 'noroeste' | 'sureste' | 'suroeste';
}

interface LoteDrawingMapProps {
  onPolygonComplete: (coordinates: LatLngExpression[], terrainInfo: TerrainInfo) => void;
  onPolygonChange?: (coordinates: LatLngExpression[], terrainInfo: TerrainInfo) => void;
  center?: LatLngExpression;
  zoom?: number;
  height?: string;
  initialPolygon?: LatLngExpression[];
  initialArea?: number;
}

// Función para calcular el área de un polígono usando la fórmula de Shoelace
function calculatePolygonArea(coordinates: LatLngExpression[]): number {
  if (coordinates.length < 3) return 0;
  
  let area = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const xi = Array.isArray(coordinates[i]) ? coordinates[i][1] : (coordinates[i] as any).lng;
    const yi = Array.isArray(coordinates[i]) ? coordinates[i][0] : (coordinates[i] as any).lat;
    const xj = Array.isArray(coordinates[j]) ? coordinates[j][1] : (coordinates[j] as any).lng;
    const yj = Array.isArray(coordinates[j]) ? coordinates[j][0] : (coordinates[j] as any).lat;
    
    area += xi * yj;
    area -= xj * yi;
  }
  
  area = Math.abs(area) / 2;
  
  // Convertir de grados cuadrados a hectáreas (aproximación)
  // 1 grado cuadrado ≈ 12,100 km² en el ecuador
  // 1 hectárea = 0.01 km²
  const hectares = area * 12100 * 100; // Conversión aproximada
  
  return hectares;
}

// Función para calcular el perímetro del polígono
function calculatePolygonPerimeter(coordinates: LatLngExpression[]): number {
  if (coordinates.length < 2) return 0;
  
  let perimeter = 0;
  const n = coordinates.length;
  
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const coord1 = Array.isArray(coordinates[i]) 
      ? { lat: coordinates[i][0], lng: coordinates[i][1] }
      : coordinates[i] as any;
    const coord2 = Array.isArray(coordinates[j]) 
      ? { lat: coordinates[j][0], lng: coordinates[j][1] }
      : coordinates[j] as any;
    
    // Fórmula de Haversine para calcular distancia entre dos puntos
    const R = 6371000; // Radio de la Tierra en metros
    const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
    const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    
    perimeter += distance;
  }
  
  return perimeter; // en metros
}

// Función para calcular el centroide del polígono
function calculatePolygonCentroid(coordinates: LatLngExpression[]): LatLngExpression {
  if (coordinates.length === 0) return [0, 0];
  
  let latSum = 0;
  let lngSum = 0;
  
  coordinates.forEach(coord => {
    const lat = Array.isArray(coord) ? coord[0] : (coord as any).lat;
    const lng = Array.isArray(coord) ? coord[1] : (coord as any).lng;
    latSum += lat;
    lngSum += lng;
  });
  
  return [latSum / coordinates.length, lngSum / coordinates.length];
}

// Función para estimar la altitud basada en coordenadas (aproximación para Colombia)
function estimateAltitude(coordinates: LatLngExpression[]): number {
  if (coordinates.length === 0) return 1500;
  
  const centroid = calculatePolygonCentroid(coordinates);
  const lat = Array.isArray(centroid) ? centroid[0] : (centroid as any).lat;
  const lng = Array.isArray(centroid) ? centroid[1] : (centroid as any).lng;
  
  // Estimación mejorada basada en la topografía de Colombia
  // Zona cafetera típica: 1200-2000 msnm
  let baseAltitude = 1500;
  
  // Ajuste por latitud (más al sur = mayor altitud en promedio)
  const latFactor = (lat - 1.0) * 200; // Cada grado de latitud añade ~200m
  
  // Ajuste por longitud (cordilleras)
  const lngFactor = Math.abs(lng + 75.5) * 100; // Distancia de la cordillera central
  
  const estimatedAlt = Math.round(baseAltitude + latFactor + lngFactor);
  const finalAltitude = Math.max(800, Math.min(2500, estimatedAlt));
  
  console.log('🏔️ Cálculo de altitud:', {
    centroid: { lat, lng },
    baseAltitude,
    latFactor,
    lngFactor,
    estimatedAlt,
    finalAltitude
  });
  
  return finalAltitude;
}

// Función para estimar la pendiente del terreno
function estimateSlope(coordinates: LatLngExpression[]): number {
  if (coordinates.length < 3) return 5; // Pendiente por defecto
  
  // Simular variación de altitud en el polígono
  const altitudes = coordinates.map((coord, index) => {
    const lat = Array.isArray(coord) ? coord[0] : (coord as any).lat;
    const lng = Array.isArray(coord) ? coord[1] : (coord as any).lng;
    
    // Variación simulada basada en posición
    return 1500 + (lat * 100) + (lng * 50) + (index * 10);
  });
  
  const maxAlt = Math.max(...altitudes);
  const minAlt = Math.min(...altitudes);
  const elevationDiff = maxAlt - minAlt;
  
  // Calcular distancia horizontal máxima
  const perimeter = calculatePolygonPerimeter(coordinates);
  const maxDistance = perimeter / 2; // Aproximación
  
  // Calcular pendiente como porcentaje
  const slope = maxDistance > 0 ? (elevationDiff / maxDistance) * 100 : 5;
  const finalSlope = Math.min(100, Math.max(0, Math.round(slope)));
  
  console.log('📐 Cálculo de pendiente:', {
    altitudes,
    maxAlt,
    minAlt,
    elevationDiff,
    perimeter,
    maxDistance,
    slope,
    finalSlope
  });
  
  return finalSlope;
}

// Función para determinar la exposición/orientación del terreno
function calculateExposition(coordinates: LatLngExpression[]): 'norte' | 'sur' | 'este' | 'oeste' | 'noreste' | 'noroeste' | 'sureste' | 'suroeste' {
  if (coordinates.length < 3) return 'norte';
  
  const centroid = calculatePolygonCentroid(coordinates);
  const centroidLat = Array.isArray(centroid) ? centroid[0] : (centroid as any).lat;
  const centroidLng = Array.isArray(centroid) ? centroid[1] : (centroid as any).lng;
  
  // Encontrar el punto más alto y más bajo para determinar orientación de la pendiente
  let maxLat = -90, minLat = 90, maxLng = -180, minLng = 180;
  
  coordinates.forEach(coord => {
    const lat = Array.isArray(coord) ? coord[0] : (coord as any).lat;
    const lng = Array.isArray(coord) ? coord[1] : (coord as any).lng;
    
    if (lat > maxLat) maxLat = lat;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lng < minLng) minLng = lng;
  });
  
  // Determinar orientación principal basada en la extensión del polígono
  const latRange = maxLat - minLat;
  const lngRange = maxLng - minLng;
  
  if (latRange > lngRange) {
    return centroidLat > (maxLat + minLat) / 2 ? 'sur' : 'norte';
  } else {
    return centroidLng > (maxLng + minLng) / 2 ? 'este' : 'oeste';
  }
}

// Función principal para calcular toda la información del terreno
function calculateTerrainInfo(coordinates: LatLngExpression[]): TerrainInfo {
  const terrainInfo = {
    area: calculatePolygonArea(coordinates),
    perimeter: calculatePolygonPerimeter(coordinates),
    centroid: calculatePolygonCentroid(coordinates),
    estimatedAltitude: estimateAltitude(coordinates),
    estimatedSlope: estimateSlope(coordinates),
    exposition: calculateExposition(coordinates)
  };
  
  // Log de depuración
  console.log('🗺️ Información del terreno calculada:', terrainInfo);
  console.log('📍 Coordenadas:', coordinates);
  console.log('🏔️ Altitud estimada:', terrainInfo.estimatedAltitude);
  console.log('📐 Pendiente estimada:', terrainInfo.estimatedSlope);
  console.log('🧭 Exposición:', terrainInfo.exposition);
  
  return terrainInfo;
}

interface MapEventHandlerProps {
  isDrawing: boolean;
  drawingPoints: LatLng[];
  onPointAdd: (point: LatLng) => void;
  onPolygonComplete: () => void;
}

function MapEventHandler({ isDrawing, drawingPoints, onPointAdd, onPolygonComplete }: MapEventHandlerProps) {
  const map = useMapEvents({
    click(e) {
      if (isDrawing) {
        onPointAdd(e.latlng);
      }
    },
    dblclick(e) {
      e.originalEvent.preventDefault();
      if (isDrawing && drawingPoints.length >= 3) {
        onPolygonComplete();
      }
    },
  });

  return null;
}

export default function LoteDrawingMap({
  onPolygonComplete,
  onPolygonChange,
  center = [2.9273, -75.2819], // Coordenadas de Huila, Colombia
  zoom = 16,
  height = "400px",
  initialPolygon = [],
  initialArea = 0
}: LoteDrawingMapProps) {
  const mapRef = useRef<L.Map>(null);
  const [drawingPoints, setDrawingPoints] = useState<LatLng[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [completedPolygon, setCompletedPolygon] = useState<LatLngExpression[]>(initialPolygon);
  const [currentArea, setCurrentArea] = useState<number>(initialArea);

  // Inicializar con polígono existente si se proporciona
  useEffect(() => {
    if (initialPolygon.length > 0) {
      const area = calculatePolygonArea(initialPolygon);
      setCurrentArea(area);
      setCompletedPolygon(initialPolygon);
    }
  }, [initialPolygon]);

  // Actualizar área cuando cambian los puntos de dibujo
  useEffect(() => {
    if (drawingPoints.length >= 3) {
      const terrainInfo = calculateTerrainInfo(drawingPoints);
      setCurrentArea(terrainInfo.area);
      onPolygonChange?.(drawingPoints, terrainInfo);
    }
  }, [drawingPoints, onPolygonChange]);

  const handlePointAdd = (point: LatLng) => {
    setDrawingPoints(prev => [...prev, point]);
  };

  const handlePolygonComplete = () => {
    if (drawingPoints.length >= 3) {
      const terrainInfo = calculateTerrainInfo(drawingPoints);
      console.log('✅ Polígono completado, enviando datos:', {
        coordinates: drawingPoints,
        terrainInfo
      });
      
      setCompletedPolygon([...drawingPoints]);
      setCurrentArea(terrainInfo.area);
      setIsDrawing(false);
      setDrawingPoints([]);
      onPolygonComplete(drawingPoints, terrainInfo);
    }
  };

  const startDrawing = () => {
    setIsDrawing(true);
    setDrawingPoints([]);
    setCompletedPolygon([]);
    setCurrentArea(0);
  };

  const cancelDrawing = () => {
    setIsDrawing(false);
    setDrawingPoints([]);
  };

  const clearPolygon = () => {
    setCompletedPolygon([]);
    setDrawingPoints([]);
    setCurrentArea(0);
    setIsDrawing(false);
  };

  return (
    <div className="relative w-full" style={{ height }}>
      {/* Controles */}
      <div className="absolute top-4 left-4 z-[1000] flex flex-col gap-2">
        {!isDrawing && completedPolygon.length === 0 && (
          <button
            onClick={startDrawing}
            className="bg-green-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-green-700 transition-colors flex items-center gap-2 text-sm"
          >
            <MapPin className="w-4 h-4" />
            Dibujar Polígono
          </button>
        )}

        {isDrawing && (
          <div className="flex flex-col gap-2">
            <button
              onClick={handlePolygonComplete}
              disabled={drawingPoints.length < 3}
              className="bg-blue-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
            >
              <Check className="w-4 h-4" />
              Completar ({drawingPoints.length} puntos)
            </button>
            <button
              onClick={cancelDrawing}
              className="bg-red-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        )}

        {!isDrawing && completedPolygon.length > 0 && (
          <button
            onClick={clearPolygon}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg shadow-lg hover:bg-gray-700 transition-colors flex items-center gap-2 text-sm"
          >
            <RotateCcw className="w-4 h-4" />
            Limpiar
          </button>
          )}
      </div>

      {/* Información del terreno */}
      {(currentArea > 0 || drawingPoints.length >= 3) && (
        <div className="absolute top-4 right-4 z-[1000] bg-white rounded-lg shadow-lg p-3 border max-w-xs">
          <div className="text-sm">
            <div className="flex items-center gap-2 mb-2">
              <Info className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-gray-900">Información del Lote</span>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Área:</span>
                <span className="text-green-600 font-bold">
                  {currentArea.toFixed(2)} ha
                </span>
              </div>
              
              {drawingPoints.length >= 3 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Perímetro:</span>
                    <span className="text-blue-600 font-medium">
                      {(calculatePolygonPerimeter(drawingPoints) / 1000).toFixed(2)} km
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Altitud est.:</span>
                    <span className="text-purple-600 font-medium">
                      {estimateAltitude(drawingPoints).toFixed(0)} m
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Pendiente:</span>
                    <span className="text-orange-600 font-medium">
                      {estimateSlope(drawingPoints).toFixed(1)}%
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-600">Exposición:</span>
                    <span className="text-indigo-600 font-medium capitalize">
                      {calculateExposition(drawingPoints)}
                    </span>
                  </div>
                </>
              )}
              
              {drawingPoints.length > 0 && (
                <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
                  {drawingPoints.length} puntos dibujados
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Instrucciones */}
      {isDrawing && (
        <div className="absolute bottom-4 left-4 right-4 z-[1000] bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="text-sm text-blue-800">
            <div className="font-medium mb-1">Instrucciones:</div>
            <ul className="text-xs space-y-1">
              <li>• Haz clic en el mapa para agregar puntos</li>
              <li>• Necesitas mínimo 3 puntos para formar un polígono</li>
              <li>• Doble clic o botón "Completar" para finalizar</li>
              <li>• El área se calcula automáticamente</li>
            </ul>
          </div>
        </div>
      )}

      {/* Mapa */}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: "100%", width: "100%" }}
        ref={mapRef}
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer name="Mapa Satelital" checked>
            <FallbackTileLayer
              primaryLayer={TILE_LAYER_CONFIGS.ARCGIS_SATELLITE}
              fallbackLayer={TILE_LAYER_CONFIGS.GOOGLE_SATELLITE}
              onFallbackActivated={(reason) => {
                console.warn('🗺️ Fallback activado para mapa satelital:', reason);
              }}
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Mapa de Calles">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Mapa Topográfico">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
          </LayersControl.BaseLayer>
        </LayersControl>

        <MapEventHandler
          isDrawing={isDrawing}
          drawingPoints={drawingPoints}
          onPointAdd={handlePointAdd}
          onPolygonComplete={handlePolygonComplete}
        />

        {/* Polígono completado */}
        {completedPolygon.length > 0 && (
          <Polygon
            positions={completedPolygon}
            pathOptions={{
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.3,
              weight: 2,
            }}
          />
        )}

        {/* Líneas de dibujo temporal */}
        {drawingPoints.length > 1 && (
          <Polyline
            positions={drawingPoints}
            pathOptions={{
              color: "#3b82f6",
              weight: 2,
              dashArray: "5, 5",
            }}
          />
        )}

        {/* Línea de cierre temporal */}
        {drawingPoints.length >= 3 && (
          <Polyline
            positions={[drawingPoints[drawingPoints.length - 1], drawingPoints[0]]}
            pathOptions={{
              color: "#3b82f6",
              weight: 2,
              dashArray: "5, 5",
              opacity: 0.5,
            }}
          />
        )}
      </MapContainer>
    </div>
  );
}
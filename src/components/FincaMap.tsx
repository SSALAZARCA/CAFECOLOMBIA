import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMapEvents } from 'react-leaflet';
import { LatLngExpression, LatLng } from 'leaflet';
import { MapPin, Edit, Trash2, Eye } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { FallbackTileLayer, TILE_LAYER_CONFIGS } from './FallbackTileLayer';

// Fix para los iconos de Leaflet en Vite
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.divIcon({
  html: `<div style="background-color: #10b981; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
  iconSize: [25, 25],
  iconAnchor: [12, 12],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface Lote {
  id: string;
  nombre: string;
  variedad: string;
  area: number;
  estado: 'crecimiento' | 'produccion' | 'zoca' | 'renovacion';
  coordenadas?: LatLngExpression[];
}

interface FincaMapProps {
  lotes: Lote[];
  onLoteClick?: (lote: Lote) => void;
  onEditLote?: (lote: Lote) => void;
  onDeleteLote?: (lote: Lote) => void;
  editingLote?: string | null;
  onPolygonComplete?: (loteId: string, coordinates: LatLngExpression[]) => void;
  center?: LatLngExpression;
  zoom?: number;
  height?: string;
}

// Componente para manejar eventos del mapa
function MapEventHandler({ 
  editingLote, 
  onPolygonComplete 
}: { 
  editingLote: string | null;
  onPolygonComplete?: (loteId: string, coordinates: LatLngExpression[]) => void;
}) {
  const [drawingPoints, setDrawingPoints] = useState<LatLng[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const map = useMapEvents({
    click(e) {
      if (editingLote && isDrawing) {
        const newPoints = [...drawingPoints, e.latlng];
        setDrawingPoints(newPoints);
      }
    },
    dblclick(e) {
      if (editingLote && drawingPoints.length >= 3) {
        const coordinates = drawingPoints.map(point => [point.lat, point.lng] as LatLngExpression);
        onPolygonComplete?.(editingLote, coordinates);
        setDrawingPoints([]);
        setIsDrawing(false);
      }
    },
  });

  useEffect(() => {
    if (editingLote) {
      setIsDrawing(true);
      setDrawingPoints([]);
    } else {
      setIsDrawing(false);
      setDrawingPoints([]);
    }
  }, [editingLote]);

  return null;
}

const getEstadoColor = (estado: string): string => {
  switch (estado) {
    case 'produccion': return '#10b981'; // green-500
    case 'crecimiento': return '#3b82f6'; // blue-500
    case 'zoca': return '#f59e0b'; // amber-500
    case 'renovacion': return '#ef4444'; // red-500
    default: return '#6b7280'; // gray-500
  }
};

export default function FincaMap({
  lotes,
  onLoteClick,
  onEditLote,
  onDeleteLote,
  editingLote,
  onPolygonComplete,
  center = [2.9273, -75.2819], // Coordenadas de Huila, Colombia
  zoom = 15,
  height = '400px'
}: FincaMapProps) {
  const mapRef = useRef<L.Map>(null);

  // Calcular el centro del mapa basado en los lotes con coordenadas
  const calculateMapCenter = (): LatLngExpression => {
    const lotesWithCoords = lotes.filter(lote => lote.coordenadas && lote.coordenadas.length > 0);
    
    if (lotesWithCoords.length === 0) {
      return center;
    }

    let totalLat = 0;
    let totalLng = 0;
    let pointCount = 0;

    lotesWithCoords.forEach(lote => {
      if (lote.coordenadas) {
        lote.coordenadas.forEach(coord => {
          if (Array.isArray(coord) && coord.length >= 2) {
            totalLat += coord[0] as number;
            totalLng += coord[1] as number;
            pointCount++;
          }
        });
      }
    });

    if (pointCount > 0) {
      return [totalLat / pointCount, totalLng / pointCount];
    }

    return center;
  };

  const mapCenter = calculateMapCenter();

  return (
    <div className="relative">
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height, width: '100%' }}
        className="rounded-lg"
        ref={mapRef}
      >
        <FallbackTileLayer
          primaryLayer={TILE_LAYER_CONFIGS.OPENSTREETMAP}
          fallbackLayer={TILE_LAYER_CONFIGS.CARTO_VOYAGER}
          onFallbackActivated={(reason) => {
            console.warn('🗺️ Fallback activado para FincaMap:', reason);
          }}
        />

        <MapEventHandler 
          editingLote={editingLote}
          onPolygonComplete={onPolygonComplete}
        />

        {/* Renderizar polígonos de lotes */}
        {lotes.map((lote) => {
          if (!lote.coordenadas || lote.coordenadas.length < 3) {
            return null;
          }

          const color = getEstadoColor(lote.estado);
          
          return (
            <Polygon
              key={lote.id}
              positions={lote.coordenadas}
              pathOptions={{
                color: color,
                fillColor: color,
                fillOpacity: 0.3,
                weight: 2,
              }}
              eventHandlers={{
                click: () => onLoteClick?.(lote),
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">{lote.nombre}</h3>
                    <span 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <p><span className="font-medium">Variedad:</span> {lote.variedad}</p>
                    <p><span className="font-medium">Área:</span> {lote.area} ha</p>
                    <p><span className="font-medium">Estado:</span> {lote.estado}</p>
                  </div>

                  <div className="flex gap-2 mt-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onLoteClick?.(lote);
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                    >
                      <Eye className="w-3 h-3" />
                      Ver
                    </button>
                    
                    {onEditLote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditLote(lote);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-amber-100 text-amber-700 rounded hover:bg-amber-200 transition-colors"
                      >
                        <Edit className="w-3 h-3" />
                        Editar
                      </button>
                    )}
                    
                    {onDeleteLote && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteLote(lote);
                        }}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                        Eliminar
                      </button>
                    )}
                  </div>
                </div>
              </Popup>
            </Polygon>
          );
        })}
      </MapContainer>

      {/* Leyenda */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg border z-[1000]">
        <h4 className="text-sm font-semibold text-gray-900 mb-2">Estados de Lotes</h4>
        <div className="space-y-1">
          {[
            { estado: 'produccion', label: 'Producción', color: '#10b981' },
            { estado: 'crecimiento', label: 'Crecimiento', color: '#3b82f6' },
            { estado: 'zoca', label: 'Zoca', color: '#f59e0b' },
            { estado: 'renovacion', label: 'Renovación', color: '#ef4444' },
          ].map(({ estado, label, color }) => (
            <div key={estado} className="flex items-center gap-2 text-xs">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Instrucciones para dibujar */}
      {editingLote && (
        <div className="absolute bottom-4 left-4 bg-blue-50 border border-blue-200 p-3 rounded-lg shadow-lg z-[1000] max-w-xs">
          <div className="flex items-start gap-2">
            <MapPin className="w-4 h-4 text-blue-600 mt-0.5" />
            <div>
              <h4 className="text-sm font-semibold text-blue-900">Dibujando Lote</h4>
              <p className="text-xs text-blue-700 mt-1">
                Haz clic para agregar puntos. Doble clic para finalizar el polígono.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
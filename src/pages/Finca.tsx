import { useState, useEffect } from 'react';
import { Plus, MapPin, Coffee, Sprout, BarChart3, Edit, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { LatLngExpression } from 'leaflet';
import Layout from '../components/Layout';
import CreateLoteForm from '../components/CreateLoteForm';
import FincaMap from '../components/FincaMap';
import { LoteDetailModal } from '../components/LoteDetailModal';
import { offlineDB } from '@/utils/offlineDB';

interface Lote {
  id: string;
  nombre: string;
  variedad: string;
  area: number;
  estado: 'crecimiento' | 'produccion' | 'zoca' | 'renovacion';
  fechaSiembra: string;
  numeroArboles: number;
  densidad: number;
  altitud?: number;
  pendiente?: number;
  exposicion?: string;
  tipoSuelo?: string;
  observaciones?: string;
  coordenadas?: LatLngExpression[];
}

export default function Finca() {
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLote, setEditingLote] = useState<string | null>(null);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);

  // Función de prueba global para abrir el formulario
  (window as any).testOpenCreateForm = () => {
    console.log('🧪 Abriendo formulario de creación de lote...');
    setShowCreateForm(true);
  };

  // Función de prueba completa
  (window as any).testCompleteFormFlow = () => {
    console.log('🧪 Iniciando prueba completa del formulario...');
    setShowCreateForm(true);
    
    // Simular llenar el formulario después de un breve delay
    setTimeout(() => {
      console.log('🧪 Formulario abierto, ahora usar el botón "Llenar Campos" en el paso 4');
      console.log('🧪 Instrucciones:');
      console.log('1. Navegar a los pasos 1, 2, 3 haciendo clic en "Siguiente"');
      console.log('2. En el paso 4, hacer clic en "🧪 Llenar Campos"');
      console.log('3. Hacer clic en "Crear Lote"');
      console.log('4. Verificar si aparecen logs de éxito o error');
    }, 1000);
  };

  // Función para simular el handleCreateLote directamente
  (window as any).testCreateLoteDirectly = () => {
    console.log('🧪 Probando handleCreateLote directamente...');
    const testData = {
      nombre: 'Lote de Prueba Directa',
      variedad: 'Caturra',
      fechaSiembra: '2024-01-15',
      area: 2.5,
      numeroArboles: 12500,
      densidad: 5000,
      estado: 'crecimiento' as const,
    };
    
    console.log('🧪 Datos de prueba:', testData);
    handleCreateLote(testData);
  };

  // Cargar datos de la base de datos offline
  useEffect(() => {
    loadLotes();
  }, []);

  const loadLotes = async () => {
    try {
      setLoading(true);
      const lotsFromDB = await offlineDB.lots.toArray();
      
      // Convertir los datos de la DB al formato esperado por el componente
      const lotesFormateados = lotsFromDB.map(lot => {
        let coordenadas: LatLngExpression[] | undefined = undefined;
        
        // Manejo seguro del parsing de coordenadas
        if (lot.coordinates) {
          try {
            // Verificar que sea una cadena válida antes de parsear
            if (typeof lot.coordinates === 'string' && lot.coordinates.trim().length > 0) {
              const parsed = JSON.parse(lot.coordinates);
              // Verificar que el resultado sea un array válido
              if (Array.isArray(parsed)) {
                coordenadas = parsed;
              }
            }
          } catch (error) {
            console.warn(`Error parsing coordinates for lot ${lot.name}:`, error);
            // Continuar sin coordenadas en lugar de fallar
            coordenadas = undefined;
          }
        }

        return {
          id: lot.id!.toString(),
          nombre: lot.name,
          variedad: lot.variety,
          area: lot.area,
          estado: lot.status.toLowerCase() as 'crecimiento' | 'produccion' | 'zoca' | 'renovacion',
          fechaSiembra: lot.plantingDate,
          numeroArboles: lot.treeCount,
          densidad: lot.density,
          altitud: lot.altitude,
          pendiente: lot.slope,
          exposicion: lot.exposure,
          tipoSuelo: lot.soilType,
          observaciones: lot.notes,
          coordenadas,
        };
      });

      setLotes(lotesFormateados);
    } catch (error) {
      console.error('Error cargando lotes:', error);
      
      // Datos de fallback para modo offline/desarrollo
      const lotesFallback: Lote[] = [
        {
          id: 'fallback-1',
          nombre: 'Lote Principal',
          variedad: 'Caturra',
          area: 2.5,
          estado: 'produccion',
          fechaSiembra: '2020-03-15',
          numeroArboles: 2500,
          densidad: 1000,
          altitud: 1650,
          pendiente: 15,
          exposicion: 'norte',
          tipoSuelo: 'Franco arcilloso',
          observaciones: 'Lote de ejemplo para modo offline',
          coordenadas: undefined
        }
      ];
      
      // En modo desarrollo, usar datos de fallback
      if (import.meta.env.DEV) {
        console.log('🔄 [Finca] Usando datos de fallback en modo desarrollo');
        setLotes(lotesFallback);
        toast.info('Funcionando en modo offline', {
          description: 'Mostrando datos de ejemplo'
        });
      } else {
        toast.error('Error al cargar los lotes');
        setLotes([]); // Array vacío en producción
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLote = async (loteData: any) => {
    try {
      // Crear el lote en la base de datos
      const newLotId = await offlineDB.lots.add({
        name: loteData.nombre,
        variety: loteData.variedad,
        area: loteData.area,
        status: loteData.estado.charAt(0).toUpperCase() + loteData.estado.slice(1),
        plantingDate: loteData.fechaSiembra,
        treeCount: loteData.numeroArboles,
        density: loteData.densidad,
        altitude: loteData.altitud,
        slope: loteData.pendiente,
        exposure: loteData.exposicion,
        soilType: loteData.tipoSuelo,
        notes: loteData.observaciones,
        coordinates: loteData.coordenadas ? JSON.stringify(loteData.coordenadas) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      // Recargar la lista de lotes
      await loadLotes();
      
      // Mostrar notificación de éxito
      toast.success('Lote creado exitosamente', {
        description: `${loteData.nombre} ha sido agregado a tu finca`,
      });

      console.log('Nuevo lote creado con ID:', newLotId);
    } catch (error) {
      console.error('Error creando lote:', error);
      toast.error('Error al crear el lote');
    }
  };

  const handleLoteClick = (lote: Lote) => {
    setSelectedLote(lote);
    console.log('Lote seleccionado:', lote);
  };

  const handleEditLote = (lote: Lote) => {
    setEditingLote(lote.id);
    toast.info('Modo de edición activado', {
      description: `Haz clic en el mapa para redefinir las coordenadas de ${lote.nombre}`,
    });
  };

  const handleDeleteLote = async (lote: Lote) => {
    if (confirm(`¿Estás seguro de que deseas eliminar el lote "${lote.nombre}"?`)) {
      try {
        await offlineDB.lots.delete(parseInt(lote.id));
        await loadLotes(); // Recargar la lista
        toast.success('Lote eliminado', {
          description: `${lote.nombre} ha sido eliminado de tu finca`,
        });
      } catch (error) {
        console.error('Error eliminando lote:', error);
        toast.error('Error al eliminar el lote');
      }
    }
  };

  const handlePolygonComplete = async (loteId: string, coordinates: LatLngExpression[]) => {
    try {
      // Actualizar las coordenadas en la base de datos
      await offlineDB.lots.update(parseInt(loteId), {
        coordinates: JSON.stringify(coordinates),
        updatedAt: new Date()
      });

      // Recargar la lista de lotes
      await loadLotes();
      
      const lote = lotes.find(l => l.id === loteId);
      if (lote) {
        toast.success('Coordenadas actualizadas', {
          description: `Las coordenadas de ${lote.nombre} han sido actualizadas`,
        });
      }
      
      setEditingLote(null);
    } catch (error) {
      console.error('Error actualizando coordenadas:', error);
      toast.error('Error al actualizar las coordenadas');
    }
  };

  const startGeoreferencing = (loteId: string) => {
    setEditingLote(loteId);
    const lote = lotes.find(l => l.id === loteId);
    if (lote) {
      toast.info('Georreferenciación iniciada', {
        description: `Dibuja el polígono para ${lote.nombre} en el mapa`,
      });
    }
  };

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'produccion': return 'bg-green-100 text-green-800';
      case 'crecimiento': return 'bg-blue-100 text-blue-800';
      case 'zoca': return 'bg-yellow-100 text-yellow-800';
      case 'renovacion': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'produccion': return <Coffee className="w-4 h-4" />;
      case 'crecimiento': return <Sprout className="w-4 h-4" />;
      case 'zoca': return <BarChart3 className="w-4 h-4" />;
      case 'renovacion': return <MapPin className="w-4 h-4" />;
      default: return <Coffee className="w-4 h-4" />;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-green-600" />
          <span className="ml-2 text-gray-600">Cargando gestión de finca...</span>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Finca</h1>
            <p className="text-gray-600 mt-2">
              Administra los lotes de tu finca cafetera
            </p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Crear Nuevo Lote
          </button>
        </div>

        {/* Estadísticas Generales */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Lotes</p>
                <p className="text-2xl font-bold text-gray-900">{lotes.length}</p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <MapPin className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Área Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lotes.reduce((sum, lote) => sum + lote.area, 0).toFixed(1)} ha
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <BarChart3 className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Producción</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lotes.filter(l => l.estado === 'produccion').length}
                </p>
              </div>
              <div className="bg-amber-100 p-3 rounded-full">
                <Coffee className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Árboles</p>
                <p className="text-2xl font-bold text-gray-900">
                  {lotes.reduce((sum, lote) => sum + (lote.numeroArboles || 0), 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-emerald-100 p-3 rounded-full">
                <Sprout className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Mapa de la Finca */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Mapa de la Finca</h2>
              <p className="text-gray-600 text-sm mt-1">Vista general de todos los lotes</p>
            </div>
            <div className="p-6">
              <FincaMap
                lotes={lotes}
                onLoteClick={handleLoteClick}
                onEditLote={handleEditLote}
                onDeleteLote={handleDeleteLote}
                editingLote={editingLote}
                onPolygonComplete={handlePolygonComplete}
                height="320px"
              />
            </div>
          </div>

          {/* Lista de Lotes */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold text-gray-900">Lotes de la Finca</h2>
              <p className="text-gray-600 text-sm mt-1">Información detallada de cada lote</p>
            </div>
            <div className="p-6">
              {loading ? (
                <div className="space-y-4">
                  {[1, 2].map((i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-20 bg-gray-200 rounded-lg"></div>
                    </div>
                  ))}
                </div>
              ) : lotes.length === 0 ? (
                <div className="text-center py-8">
                  <Coffee className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay lotes registrados</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Crea tu primer lote para comenzar
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {lotes.map((lote) => (
                    <div
                      key={lote.id}
                      className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedLote(lote)}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{lote.nombre || 'Sin nombre'}</h3>
                          <p className="text-sm text-gray-600">Variedad: {lote.variedad || 'No especificada'}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getEstadoColor(lote.estado || 'crecimiento')}`}>
                          {getEstadoIcon(lote.estado || 'crecimiento')}
                          {(lote.estado || 'crecimiento').charAt(0).toUpperCase() + (lote.estado || 'crecimiento').slice(1)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-gray-500">Área</p>
                          <p className="font-medium">{lote.area || 0} ha</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Árboles</p>
                          <p className="font-medium">{(lote.numeroArboles || 0).toLocaleString()}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Siembra</p>
                          <p className="font-medium">
                            {lote.fechaSiembra ? new Date(lote.fechaSiembra).toLocaleDateString() : 'No definida'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {lote.coordenadas && lote.coordenadas.length > 0 ? (
                            <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              Georreferenciado
                            </span>
                          ) : (
                            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                              Sin coordenadas
                            </span>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedLote(lote);
                            }}
                            className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {!lote.coordenadas || lote.coordenadas.length === 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                startGeoreferencing(lote.id);
                              }}
                              className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                              title="Georreferenciar"
                            >
                              <MapPin className="w-4 h-4" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleEditLote(lote);
                              }}
                              className="p-1 text-amber-600 hover:bg-amber-100 rounded transition-colors"
                              title="Editar coordenadas"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Formulario de creación de lotes */}
        <CreateLoteForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleCreateLote}
        />

        <LoteDetailModal
          lote={selectedLote}
          isOpen={!!selectedLote}
          onClose={() => setSelectedLote(null)}
          onEdit={(lote) => {
            setSelectedLote(null);
            handleEditLote(lote);
          }}
          onGeoreference={(loteId) => {
            setSelectedLote(null);
            startGeoreferencing(loteId);
          }}
        />
      </div>
    </Layout>
  );
}
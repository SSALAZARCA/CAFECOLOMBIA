import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  MapPin, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Coffee,
  Thermometer,
  Droplets,
  Mountain,
  Calendar,
  Download,
  Upload,
  Map
} from 'lucide-react';
import { toast } from 'sonner';
import FarmModal from '../../components/admin/FarmModal';

interface Farm {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
  address: string;
  city: string;
  department: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  area: number;
  altitude: number;
  coffeeVarieties: string[];
  plantingDate: string;
  harvestSeason: string;
  certifications: string[];
  soilType: string;
  irrigationSystem: string;
  averageTemperature: number;
  averageRainfall: number;
  productionCapacity: number;
  lastProduction: number;
  status: 'active' | 'inactive' | 'maintenance';
  createdAt: string;
  updatedAt: string;
}

export default function AdminFarms() {
  const { useAuthenticatedFetch } = useAdminStore();
  const [farms, setFarms] = useState<Farm[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterVariety, setFilterVariety] = useState<string>('all');
  const [selectedFarms, setSelectedFarms] = useState<string[]>([]);
  const [showFarmModal, setShowFarmModal] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);
  const [showMapView, setShowMapView] = useState(false);

  const fetchFarms = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/farms');
      if (response.ok) {
        const data = await response.json();
        setFarms(data.farms || []);
      } else {
        toast.error('Error al cargar fincas');
      }
    } catch (error) {
      console.error('Error fetching farms:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFarms();
  }, []);

  const filteredFarms = farms.filter(farm => {
    const matchesSearch = 
      farm.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.ownerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      farm.city.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || farm.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || farm.department === filterDepartment;
    const matchesVariety = filterVariety === 'all' || farm.coffeeVarieties.includes(filterVariety);
    
    return matchesSearch && matchesStatus && matchesDepartment && matchesVariety;
  });

  const handleDeleteFarm = async (farmId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar esta finca?')) return;
    
    try {
      const response = await useAuthenticatedFetch(`/admin/farms/${farmId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setFarms(farms.filter(farm => farm.id !== farmId));
        toast.success('Finca eliminada exitosamente');
      } else {
        toast.error('Error al eliminar finca');
      }
    } catch (error) {
      console.error('Error deleting farm:', error);
      toast.error('Error de conexión');
    }
  };

  const handleFarmSave = async (farmData: Partial<Farm>) => {
    try {
      const url = editingFarm 
        ? `/api/admin/farms/${editingFarm.id}`
        : '/api/admin/farms';
      
      const method = editingFarm ? 'PUT' : 'POST';
      
      const response = await authenticatedFetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(farmData)
      });

      if (response.ok) {
        const savedFarm = await response.json();
        
        if (editingFarm) {
          setFarms(farms.map(f => f.id === editingFarm.id ? savedFarm : f));
          toast.success('Finca actualizada exitosamente');
        } else {
          setFarms([...farms, savedFarm]);
          toast.success('Finca creada exitosamente');
        }
        
        setShowFarmModal(false);
        setEditingFarm(null);
      } else {
        toast.error('Error al guardar la finca');
      }
    } catch (error) {
      console.error('Error saving farm:', error);
      toast.error('Error al guardar la finca');
    }
  };

  const handleEditFarm = (farm: Farm) => {
    setEditingFarm(farm);
    setShowFarmModal(true);
  };

  const handleNewFarm = () => {
    setEditingFarm(null);
    setShowFarmModal(true);
  };

  const handleCloseModal = () => {
    setShowFarmModal(false);
    setEditingFarm(null);
  };

  const handleStatusChange = async (farmId: string, newStatus: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/farms/${farmId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setFarms(farms.map(farm => 
          farm.id === farmId ? { ...farm, status: newStatus as any } : farm
        ));
        toast.success('Estado actualizado exitosamente');
      } else {
        toast.error('Error al actualizar estado');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error de conexión');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activa';
      case 'inactive': return 'Inactiva';
      case 'maintenance': return 'Mantenimiento';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="h-6 w-6" />
            Gestión de Fincas
          </h1>
          <p className="text-gray-600 mt-1">
            Administra las fincas cafeteras registradas en el sistema
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowMapView(!showMapView)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Map className="h-4 w-4" />
            {showMapView ? 'Vista Lista' : 'Vista Mapa'}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            Importar
          </button>
          <button 
            onClick={handleNewFarm}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nueva Finca
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar fincas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activa</option>
            <option value="inactive">Inactiva</option>
            <option value="maintenance">Mantenimiento</option>
          </select>
          <select
            value={filterDepartment}
            onChange={(e) => setFilterDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todos los departamentos</option>
            <option value="Antioquia">Antioquia</option>
            <option value="Caldas">Caldas</option>
            <option value="Quindío">Quindío</option>
            <option value="Risaralda">Risaralda</option>
            <option value="Huila">Huila</option>
            <option value="Nariño">Nariño</option>
            <option value="Tolima">Tolima</option>
            <option value="Cauca">Cauca</option>
          </select>
          <select
            value={filterVariety}
            onChange={(e) => setFilterVariety(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todas las variedades</option>
            <option value="Caturra">Caturra</option>
            <option value="Colombia">Colombia</option>
            <option value="Castillo">Castillo</option>
            <option value="Típica">Típica</option>
            <option value="Borbón">Borbón</option>
            <option value="Geisha">Geisha</option>
          </select>
        </div>
      </div>

      {showMapView ? (
        /* Map View */
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <Map className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Vista de mapa en desarrollo</p>
              <p className="text-sm text-gray-400">Aquí se mostrará la ubicación de las fincas</p>
            </div>
          </div>
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedFarms.length === filteredFarms.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedFarms(filteredFarms.map(f => f.id));
                        } else {
                          setSelectedFarms([]);
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Finca
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Propietario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Área
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variedades
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Producción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFarms.map((farm) => (
                  <tr key={farm.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedFarms.includes(farm.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFarms([...selectedFarms, farm.id]);
                          } else {
                            setSelectedFarms(selectedFarms.filter(id => id !== farm.id));
                          }
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                          <Coffee className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{farm.name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <Mountain className="h-3 w-3 mr-1" />
                            {farm.altitude}m
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{farm.ownerName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                        <div>
                          <div>{farm.city}</div>
                          <div className="text-xs text-gray-500">{farm.department}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{farm.area} ha</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {farm.coffeeVarieties.slice(0, 2).map((variety, index) => (
                          <span
                            key={index}
                            className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800"
                          >
                            {variety}
                          </span>
                        ))}
                        {farm.coffeeVarieties.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{farm.coffeeVarieties.length - 2}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{farm.lastProduction.toLocaleString()} kg</div>
                        <div className="text-xs text-gray-500">
                          Cap: {farm.productionCapacity.toLocaleString()} kg
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(farm.status)}`}>
                        {getStatusText(farm.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleEditFarm(farm)}
                          className="text-emerald-600 hover:text-emerald-900"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFarm(farm.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{farms.length}</div>
          <div className="text-sm text-gray-500">Total fincas</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {farms.filter(f => f.status === 'active').length}
          </div>
          <div className="text-sm text-gray-500">Fincas activas</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {farms.reduce((sum, f) => sum + f.area, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Hectáreas totales</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {farms.reduce((sum, f) => sum + f.lastProduction, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Producción total (kg)</div>
        </div>
      </div>

      {/* Farm Modal */}
      <FarmModal
        isOpen={showFarmModal}
        onClose={handleCloseModal}
        farm={editingFarm}
        onSave={handleFarmSave}
      />
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { 
  Coffee, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  MapPin,
  Phone,
  Mail,
  Calendar,
  Download,
  Upload,
  MoreVertical,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import CoffeeGrowerModal from '../../components/admin/CoffeeGrowerModal';
import ExportImportModal from '../../components/admin/ExportImportModal';
import BulkActionsBar from '../../components/admin/BulkActionsBar';

interface CoffeeGrower {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  documentType: 'cedula' | 'passport' | 'nit';
  documentNumber: string;
  address: string;
  city: string;
  department: string;
  country: string;
  farmCount: number;
  totalHectares: number;
  certifications: string[];
  registrationDate: string;
  status: 'active' | 'inactive' | 'pending_verification';
  rating: number;
  totalProduction: number;
  lastActivity: string;
}

export default function AdminCoffeeGrowers() {
  const { useAuthenticatedFetch } = useAdminStore();
  const [growers, setGrowers] = useState<CoffeeGrower[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [selectedGrowers, setSelectedGrowers] = useState<string[]>([]);
  const [showGrowerModal, setShowGrowerModal] = useState(false);
  const [editingGrower, setEditingGrower] = useState<CoffeeGrower | null>(null);
  const [exportImportModalOpen, setExportImportModalOpen] = useState(false);
  const [exportImportMode, setExportImportMode] = useState<'export' | 'import'>('export');

  const fetchGrowers = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/coffee-growers');
      if (response.ok) {
        const data = await response.json();
        setGrowers(data.growers || []);
      } else {
        toast.error('Error al cargar caficultores');
      }
    } catch (error) {
      console.error('Error fetching growers:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowers();
  }, []);

  const filteredGrowers = growers.filter(grower => {
    const matchesSearch = 
      grower.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grower.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grower.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      grower.documentNumber.includes(searchTerm);
    
    const matchesStatus = filterStatus === 'all' || grower.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || grower.department === filterDepartment;
    
    return matchesSearch && matchesStatus && matchesDepartment;
  });

  const handleDeleteGrower = async (growerId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este cafetalero?')) return;
    
    try {
      const response = await useAuthenticatedFetch(`/admin/coffee-growers/${growerId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setGrowers(growers.filter(grower => grower.id !== growerId));
        toast.success('Cafetalero eliminado exitosamente');
      } else {
        toast.error('Error al eliminar cafetalero');
      }
    } catch (error) {
      console.error('Error deleting grower:', error);
      toast.error('Error de conexión');
    }
  };

  const handleStatusChange = async (growerId: string, newStatus: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/coffee-growers/${growerId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setGrowers(growers.map(grower => 
          grower.id === growerId ? { ...grower, status: newStatus as any } : grower
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

  const handleGrowerSave = (savedGrower: CoffeeGrower) => {
    if (editingGrower) {
      // Actualizar cafetalero existente
      setGrowers(growers.map(grower => 
        grower.id === savedGrower.id ? savedGrower : grower
      ));
    } else {
      // Agregar nuevo cafetalero
      setGrowers([...growers, savedGrower]);
    }
    setEditingGrower(null);
  };

  const handleEditGrower = (grower: CoffeeGrower) => {
    setEditingGrower(grower);
    setShowGrowerModal(true);
  };

  const handleNewGrower = () => {
    setEditingGrower(null);
    setShowGrowerModal(true);
  };

  const handleCloseModal = () => {
    setShowGrowerModal(false);
    setEditingGrower(null);
  };

  const handleExport = () => {
    setExportImportMode('export');
    setExportImportModalOpen(true);
  };

  const handleImport = () => {
    setExportImportMode('import');
    setExportImportModalOpen(true);
  };

  const handleBulkAction = async (action: string, growerIds: string[]) => {
    try {
      switch (action) {
        case 'approve':
          await Promise.all(growerIds.map(id => handleStatusChange(id, 'active')));
          toast.success(`${growerIds.length} caficultores aprobados`);
          break;
        case 'archive':
          await Promise.all(growerIds.map(id => handleStatusChange(id, 'inactive')));
          toast.success(`${growerIds.length} caficultores archivados`);
          break;
        case 'delete':
          await Promise.all(growerIds.map(id => handleDeleteGrower(id)));
          toast.success(`${growerIds.length} caficultores eliminados`);
          break;
        case 'export':
          handleExport();
          break;
      }
      setSelectedGrowers([]);
    } catch (error) {
      toast.error('Error al realizar la acción en lote');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'pending_verification': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'pending_verification': return 'Pendiente verificación';
      default: return status;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
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
            <Coffee className="h-6 w-6" />
            Gestión de Caficultores
          </h1>
          <p className="text-gray-600 mt-1">
            Administra los perfiles de caficultores registrados
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Exportar
          </button>
          <button 
            onClick={handleImport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Upload className="h-4 w-4" />
            Importar
          </button>
          <button 
            onClick={handleNewGrower}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo Cafetalero
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
                placeholder="Buscar caficultores..."
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
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="pending_verification">Pendiente verificación</option>
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
        </div>
      </div>

      {/* Growers Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedGrowers.length === filteredGrowers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedGrowers(filteredGrowers.map(g => g.id));
                      } else {
                        setSelectedGrowers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Cafetalero
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ubicación
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Fincas
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Producción
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Calificación
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
              {filteredGrowers.map((grower) => (
                <tr key={grower.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedGrowers.includes(grower.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedGrowers([...selectedGrowers, grower.id]);
                        } else {
                          setSelectedGrowers(selectedGrowers.filter(id => id !== grower.id));
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <Coffee className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {grower.firstName} {grower.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{grower.email}</div>
                        <div className="text-xs text-gray-400">{grower.documentNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-900">
                      <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                      <div>
                        <div>{grower.city}</div>
                        <div className="text-xs text-gray-500">{grower.department}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      <div>{grower.farmCount} fincas</div>
                      <div className="text-xs text-gray-500">{grower.totalHectares} ha</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {grower.totalProduction.toLocaleString()} kg/año
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {renderStars(grower.rating)}
                      <span className="ml-2 text-sm text-gray-600">({grower.rating})</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(grower.status)}`}>
                      {getStatusText(grower.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditGrower(grower)}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button className="text-blue-600 hover:text-blue-900">
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteGrower(grower.id)}
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

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-gray-900">{growers.length}</div>
          <div className="text-sm text-gray-500">Total caficultores</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {growers.filter(g => g.status === 'active').length}
          </div>
          <div className="text-sm text-gray-500">Activos</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {growers.reduce((sum, g) => sum + g.farmCount, 0)}
          </div>
          <div className="text-sm text-gray-500">Total fincas</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {growers.reduce((sum, g) => sum + g.totalHectares, 0).toLocaleString()}
          </div>
          <div className="text-sm text-gray-500">Hectáreas totales</div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedGrowers.length > 0 && (
        <BulkActionsBar
          selectedItems={selectedGrowers}
          onClearSelection={() => setSelectedGrowers([])}
          entityType="farms"
          onBulkAction={handleBulkAction}
        />
      )}

      {/* CoffeeGrowerModal */}
      <CoffeeGrowerModal
        isOpen={showGrowerModal}
        onClose={handleCloseModal}
        grower={editingGrower}
        onSave={handleGrowerSave}
      />

      {/* Export/Import Modal */}
      <ExportImportModal
        isOpen={exportImportModalOpen}
        onClose={() => setExportImportModalOpen(false)}
        mode={exportImportMode}
        entityType="farms"
        selectedIds={selectedGrowers}
      />
    </div>
  );
}
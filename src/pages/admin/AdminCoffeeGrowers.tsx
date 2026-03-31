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

  const mapBackendGrowerToUI = (g: any): CoffeeGrower => {
    const fullName: string = g.full_name || '';
    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ');
    return {
      id: String(g.id),
      userId: String(g.user_id || g.id),
      firstName: firstName || g.first_name || '',
      lastName: lastName || g.last_name || '',
      email: g.email || '',
      phone: g.phone || '',
      documentType: (g.identification_type || 'cedula') as any,
      documentNumber: g.identification_number || '',
      address: g.address || '',
      city: g.municipality || '',
      department: g.department || '',
      country: 'Colombia',
      farmCount: g.farms_count ?? 0,
      totalHectares: g.total_area ?? 0,
      certifications: g.certification_type ? [g.certification_type] : [],
      registrationDate: g.created_at || '',
      status: (g.status || 'active') as any,
      rating: g.quality_score ?? 0,
      totalProduction: g.annual_production ?? 0,
      lastActivity: g.updated_at || g.created_at || ''
    };
  };

  const fetchGrowers = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/coffee-growers');
      if (response.ok) {
        const payload = await response.json();
        const list = payload?.data?.data || payload?.data || [];
        const mapped = Array.isArray(list) ? list.map(mapBackendGrowerToUI) : [];
        setGrowers(mapped);
      } else {
        const err = await response.json().catch(() => ({}));
        toast.error(err?.message || 'Error al cargar caficultores');
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
      (grower.firstName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grower.lastName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grower.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (grower.documentNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
    
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
        const err = await response.json().catch(() => ({}));
        toast.error(err?.message || 'Error al eliminar cafetalero');
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
        const err = await response.json().catch(() => ({}));
        toast.error(err?.message || 'Error al actualizar estado');
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
      <Star key={i} className={`h-4 w-4 ${i < Math.round(rating) ? 'text-amber-500' : 'text-gray-300'}`} />
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
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, email o documento"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Estado</label>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="mt-1 block w-48 border border-gray-300 rounded-lg py-2 px-3"
            >
              <option value="all">Todos</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
              <option value="pending_verification">Pendiente verificación</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Departamento</label>
            <select
              value={filterDepartment}
              onChange={e => setFilterDepartment(e.target.value)}
              className="mt-1 block w-56 border border-gray-300 rounded-lg py-2 px-3"
            >
              <option value="all">Todos</option>
              <option value="Antioquia">Antioquia</option>
              <option value="Caldas">Caldas</option>
              <option value="Quindío">Quindío</option>
              <option value="Risaralda">Risaralda</option>
              <option value="Huila">Huila</option>
              <option value="Nariño">Nariño</option>
              <option value="Tolima">Tolima</option>
              <option value="Cauca">Cauca</option>
              <option value="Valle del Cauca">Valle del Cauca</option>
              <option value="Cundinamarca">Cundinamarca</option>
            </select>
          </div>
        </div>
      </div>

      {/* Growers List */}
      <div className="bg-white rounded-lg border border-gray-200">
        {selectedGrowers.length > 0 && (
          <BulkActionsBar
            selectedItems={selectedGrowers}
            onClearSelection={() => setSelectedGrowers([])}
            entityType="growers"
            onBulkAction={handleBulkAction}
          />
        )}

        <div className="divide-y divide-gray-200">
          {filteredGrowers.map(grower => (
            <div key={grower.id} className="p-4 flex items-center justify-between border-b last:border-0 hover:bg-gray-50 transition-colors">
              <div className="flex items-center gap-4">
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
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 h-4 w-4"
                />
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Coffee className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900">{grower.firstName} {grower.lastName}</h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(grower.status)}`}>{getStatusText(grower.status)}</span>
                  </div>
                  <div className="text-sm text-gray-600 flex items-center gap-3 mt-1">
                    <span className="flex items-center gap-1"><Mail className="h-4 w-4" /> {grower.email}</span>
                    <span className="flex items-center gap-1"><Phone className="h-4 w-4" /> {grower.phone}</span>
                    <span className="flex items-center gap-1"><MapPin className="h-4 w-4" /> {grower.city}, {grower.department}</span>
                    <span className="flex items-center gap-1"><Calendar className="h-4 w-4" /> Reg: {new Date(grower.registrationDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                  {renderStars(Math.round(grower.rating || 0))}
                </div>
                <div className="text-sm text-gray-600">
                  {grower.farmCount} fincas · {grower.totalHectares} ha · {grower.totalProduction} kg/año
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEditGrower(grower)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Edit className="h-4 w-4" /> Editar
                  </button>
                  <button
                    onClick={() => handleDeleteGrower(grower.id)}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Trash2 className="h-4 w-4" /> Eliminar
                  </button>
                  <button
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" /> Ver Perfil
                  </button>
                  <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {filteredGrowers.length === 0 && (
            <div className="p-6 text-center text-gray-500">No hay caficultores para mostrar</div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showGrowerModal && (
        <CoffeeGrowerModal 
          isOpen={showGrowerModal} 
          onClose={handleCloseModal}
          grower={editingGrower}
          onSave={handleGrowerSave}
        />
      )}

      {exportImportModalOpen && (
        <ExportImportModal 
          isOpen={exportImportModalOpen}
          mode={exportImportMode}
          entityType="growers"
          selectedIds={selectedGrowers}
          onClose={() => setExportImportModalOpen(false)}
        />
      )}
    </div>
  );
}
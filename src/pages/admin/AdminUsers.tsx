import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { adminHttpClient } from '../../utils/adminHttpClient';
import UserModal from '../../components/admin/UserModal';
import ExportImportModal from '../../components/admin/ExportImportModal';
import BulkActionsBar from '../../components/admin/BulkActionsBar';
import {
  Users,
  Search,
  Filter,
  Plus,
  Edit,
  Trash2,
  UserCheck,
  UserX,
  Download,
  Upload,
  MoreHorizontal
} from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'user' | 'coffee_grower';
  status: 'active' | 'inactive' | 'suspended';
  lastLogin: string;
  createdAt: string;
  phone?: string;
  location?: string;
}

export default function AdminUsers() {
  const { useAuthenticatedFetch } = useAdminStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [exportImportModalOpen, setExportImportModalOpen] = useState(false);
  const [exportImportMode, setExportImportMode] = useState<'export' | 'import'>('export');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      } else {
        toast.error('Error al cargar usuarios');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${user.firstName} ${user.lastName}`.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este usuario?')) return;
    
    try {
      const response = await useAuthenticatedFetch(`/admin/users/${userId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setUsers(users.filter(user => user.id !== userId));
        toast.success('Usuario eliminado exitosamente');
      } else {
        toast.error('Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Error de conexión');
    }
  };

  const handleStatusChange = async (userId: string, newStatus: string) => {
    try {
      const response = await useAuthenticatedFetch(`/admin/users/${userId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (response.ok) {
        setUsers(users.map(user => 
          user.id === userId ? { ...user, status: newStatus as any } : user
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

  const handleUserSave = (savedUser: User) => {
    if (editingUser) {
      // Actualizar usuario existente
      setUsers(users.map(user => 
        user.id === savedUser.id ? savedUser : user
      ));
    } else {
      // Agregar nuevo usuario
      setUsers([...users, savedUser]);
    }
    setEditingUser(null);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserModalOpen(true);
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setUserModalOpen(true);
  };

  const handleCloseModal = () => {
    setUserModalOpen(false);
    setEditingUser(null);
  };

  const handleExport = () => {
    setExportImportMode('export');
    setExportImportModalOpen(true);
  };

  const handleImport = () => {
    setExportImportMode('import');
    setExportImportModalOpen(true);
  };

  const handleBulkAction = async (action: string, userIds: string[]) => {
    try {
      switch (action) {
        case 'activate':
          await Promise.all(userIds.map(id => handleStatusChange(id, 'active')));
          toast.success(`${userIds.length} usuarios activados`);
          break;
        case 'deactivate':
          await Promise.all(userIds.map(id => handleStatusChange(id, 'inactive')));
          toast.success(`${userIds.length} usuarios desactivados`);
          break;
        case 'delete':
          await Promise.all(userIds.map(id => handleDeleteUser(id)));
          toast.success(`${userIds.length} usuarios eliminados`);
          break;
        case 'export':
          handleExport();
          break;
      }
      setSelectedUsers([]);
    } catch (error) {
      toast.error('Error al realizar la acción en lote');
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'coffee_grower': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            <Users className="h-6 w-6" />
            Gestión de Usuarios
          </h1>
          <p className="text-gray-600 mt-1">
            Administra usuarios del sistema y sus permisos
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
            onClick={handleNewUser}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo Usuario
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
                placeholder="Buscar usuarios..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todos los roles</option>
            <option value="admin">Administrador</option>
            <option value="coffee_grower">Cafetalero</option>
            <option value="user">Usuario</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
          >
            <option value="all">Todos los estados</option>
            <option value="active">Activo</option>
            <option value="inactive">Inactivo</option>
            <option value="suspended">Suspendido</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedUsers(filteredUsers.map(u => u.id));
                      } else {
                        setSelectedUsers([]);
                      }
                    }}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Usuario
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Último acceso
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedUsers.includes(user.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedUsers([...selectedUsers, user.id]);
                        } else {
                          setSelectedUsers(selectedUsers.filter(id => id !== user.id));
                        }
                      }}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                        <span className="text-emerald-600 font-medium">
                          {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.firstName} {user.lastName}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                      {user.role === 'admin' ? 'Administrador' : 
                       user.role === 'coffee_grower' ? 'Cafetalero' : 'Usuario'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                      {user.status === 'active' ? 'Activo' : 
                       user.status === 'inactive' ? 'Inactivo' : 'Suspendido'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(user.lastLogin).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEditUser(user)}
                        className="text-emerald-600 hover:text-emerald-900"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleStatusChange(user.id, user.status === 'active' ? 'inactive' : 'active')}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        {user.status === 'active' ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(user.id)}
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
          <div className="text-2xl font-bold text-gray-900">{users.length}</div>
          <div className="text-sm text-gray-500">Total usuarios</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-green-600">
            {users.filter(u => u.status === 'active').length}
          </div>
          <div className="text-sm text-gray-500">Usuarios activos</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === 'coffee_grower').length}
          </div>
          <div className="text-sm text-gray-500">Cafetaleros</div>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <div className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === 'admin').length}
          </div>
          <div className="text-sm text-gray-500">Administradores</div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedUsers.length > 0 && (
        <BulkActionsBar
          selectedItems={selectedUsers}
          onClearSelection={() => setSelectedUsers([])}
          entityType="users"
          onBulkAction={handleBulkAction}
        />
      )}

      {/* UserModal */}
      <UserModal
        isOpen={userModalOpen}
        onClose={handleCloseModal}
        user={editingUser}
        onSave={handleUserSave}
      />

      {/* Export/Import Modal */}
      <ExportImportModal
        isOpen={exportImportModalOpen}
        onClose={() => setExportImportModalOpen(false)}
        mode={exportImportMode}
        entityType="users"
        selectedIds={selectedUsers}
      />
    </div>
  );
}
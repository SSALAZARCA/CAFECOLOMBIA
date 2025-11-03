import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../stores/adminStore';
import { adminHttpClient } from '../../utils/adminHttpClient';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  Key,
  Bell,
  Eye,
  EyeOff,
  Save,
  Upload,
  Camera,
  Edit3,
  Check,
  X,
  AlertTriangle
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminProfileData {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  avatar?: string;
  role: string;
  department?: string;
  location?: string;
  bio?: string;
  createdAt: string;
  lastLogin: string;
  twoFactorEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  loginAlerts: boolean;
}

interface SecuritySettings {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const AdminProfile: React.FC = () => {
  const [profile, setProfile] = useState<AdminProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState<Partial<AdminProfileData>>({});
  const [securityData, setSecurityData] = useState<SecuritySettings>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const { user } = useAdminStore();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await adminHttpClient.get('/admin/profile');
      setProfile(data);
      setFormData(data);
    } catch (error) {
      console.error('Error loading profile:', error);
      toast.error('Error al cargar el perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const updatedProfile = await adminHttpClient.put('/admin/profile', formData);
      setProfile(updatedProfile);
      setEditMode(false);
      toast.success('Perfil actualizado correctamente');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error al actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (securityData.newPassword !== securityData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (securityData.newPassword.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    try {
      setSaving(true);
      await adminHttpClient.put('/admin/profile/password', {
        currentPassword: securityData.currentPassword,
        newPassword: securityData.newPassword
      });
      
      setSecurityData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
      toast.success('Contraseña actualizada correctamente');
    } catch (error) {
      console.error('Error changing password:', error);
      toast.error('Error al cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  const handleToggle2FA = async () => {
    try {
      const newStatus = !profile?.twoFactorEnabled;
      await adminHttpClient.put('/admin/profile/2fa', { enabled: newStatus });
      
      if (profile) {
        setProfile({ ...profile, twoFactorEnabled: newStatus });
        setFormData({ ...formData, twoFactorEnabled: newStatus });
      }
      
      toast.success(
        newStatus 
          ? 'Autenticación de dos factores activada' 
          : 'Autenticación de dos factores desactivada'
      );
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      toast.error('Error al cambiar la configuración de 2FA');
    }
  };

  const handleNotificationChange = async (type: string, value: boolean) => {
    try {
      await adminHttpClient.put('/admin/profile/notifications', {
        [type]: value
      });
      
      if (profile) {
        setProfile({ ...profile, [type]: value });
        setFormData({ ...formData, [type]: value });
      }
      
      toast.success('Configuración de notificaciones actualizada');
    } catch (error) {
      console.error('Error updating notifications:', error);
      toast.error('Error al actualizar las notificaciones');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('El archivo debe ser menor a 5MB');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('avatar', file);
      
      const response = await adminHttpClient.post('/admin/profile/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (profile) {
        setProfile({ ...profile, avatar: response.avatarUrl });
      }
      
      toast.success('Avatar actualizado correctamente');
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast.error('Error al subir el avatar');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando perfil...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2 text-red-800">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Error al cargar el perfil</span>
        </div>
        <button
          onClick={loadProfile}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600 mt-1">
            Gestiona tu información personal y configuración de seguridad
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Información Personal
          </button>
          <button
            onClick={() => setActiveTab('security')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'security'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Seguridad
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'notifications'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Notificaciones
          </button>
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-6 mb-8">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                  {profile.avatar ? (
                    <img
                      src={profile.avatar}
                      alt="Avatar"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                  <Camera className="w-4 h-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  {profile.firstName} {profile.lastName}
                </h3>
                <p className="text-gray-600">{profile.role}</p>
                <p className="text-sm text-gray-500">
                  Miembro desde {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Profile Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.firstName || ''}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={!editMode}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apellido
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.lastName || ''}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={!editMode}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    value={formData.email || ''}
                    disabled
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editMode}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Departamento
                </label>
                <input
                  type="text"
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  disabled={!editMode}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.location || ''}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    disabled={!editMode}
                    className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Biografía
              </label>
              <textarea
                value={formData.bio || ''}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                disabled={!editMode}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50"
                placeholder="Cuéntanos un poco sobre ti..."
              />
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 mt-8">
              {editMode ? (
                <>
                  <button
                    onClick={() => {
                      setEditMode(false);
                      setFormData(profile);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Guardar</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditMode(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Edit3 className="h-4 w-4" />
                  <span>Editar Perfil</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="space-y-6">
          {/* 2FA Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Autenticación de Dos Factores</h3>
                <p className="text-gray-600 mt-1">
                  Agrega una capa extra de seguridad a tu cuenta
                </p>
              </div>
              <button
                onClick={handleToggle2FA}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profile.twoFactorEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.twoFactorEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Password Change */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Cambiar Contraseña</h3>
                <p className="text-gray-600 mt-1">
                  Actualiza tu contraseña regularmente para mantener tu cuenta segura
                </p>
              </div>
              <button
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <Key className="h-4 w-4" />
                <span>Cambiar Contraseña</span>
              </button>
            </div>

            {showPasswordForm && (
              <div className="space-y-4 mt-6 pt-6 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={securityData.currentPassword}
                      onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={securityData.newPassword}
                      onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={securityData.confirmPassword}
                      onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 pr-10 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => {
                      setShowPasswordForm(false);
                      setSecurityData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
                  >
                    {saving ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    <span>Actualizar Contraseña</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Notifications Tab */}
      {activeTab === 'notifications' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Configuración de Notificaciones</h3>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Notificaciones por Email</h4>
                <p className="text-gray-600 text-sm">Recibe notificaciones importantes por correo electrónico</p>
              </div>
              <button
                onClick={() => handleNotificationChange('emailNotifications', !profile.emailNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profile.emailNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.emailNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Notificaciones SMS</h4>
                <p className="text-gray-600 text-sm">Recibe alertas críticas por mensaje de texto</p>
              </div>
              <button
                onClick={() => handleNotificationChange('smsNotifications', !profile.smsNotifications)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profile.smsNotifications ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.smsNotifications ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-gray-900">Alertas de Inicio de Sesión</h4>
                <p className="text-gray-600 text-sm">Notificaciones cuando alguien accede a tu cuenta</p>
              </div>
              <button
                onClick={() => handleNotificationChange('loginAlerts', !profile.loginAlerts)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  profile.loginAlerts ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    profile.loginAlerts ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProfile;
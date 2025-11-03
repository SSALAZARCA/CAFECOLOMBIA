import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  Shield, 
  Lock, 
  Key, 
  Eye, 
  EyeOff,
  Save,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Settings,
  Users,
  Clock,
  Smartphone,
  Mail,
  Globe,
  Database,
  Server,
  FileText,
  Download
} from 'lucide-react';
import { toast } from 'sonner';

interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    maxAge: number;
    preventReuse: number;
  };
  sessionManagement: {
    maxSessionDuration: number;
    idleTimeout: number;
    maxConcurrentSessions: number;
    requireReauthentication: boolean;
  };
  twoFactorAuth: {
    enabled: boolean;
    required: boolean;
    methods: string[];
    backupCodes: boolean;
  };
  loginSecurity: {
    maxFailedAttempts: number;
    lockoutDuration: number;
    enableCaptcha: boolean;
    enableIpWhitelist: boolean;
    allowedIps: string[];
  };
  dataProtection: {
    encryptionEnabled: boolean;
    backupEncryption: boolean;
    dataRetentionDays: number;
    anonymizeData: boolean;
  };
  auditSettings: {
    logLevel: 'basic' | 'detailed' | 'verbose';
    retentionDays: number;
    realTimeAlerts: boolean;
    emailNotifications: boolean;
    notificationEmail: string;
  };
  apiSecurity: {
    rateLimitEnabled: boolean;
    requestsPerMinute: number;
    requireApiKey: boolean;
    enableCors: boolean;
    allowedOrigins: string[];
  };
}

interface SecurityRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export default function AdminSecurity() {
  const { useAuthenticatedFetch } = useAdminStore();
  const [settings, setSettings] = useState<SecuritySettings | null>(null);
  const [roles, setRoles] = useState<SecurityRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'roles' | 'monitoring'>('settings');
  const [showApiKey, setShowApiKey] = useState(false);
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] });
  const [showRoleModal, setShowRoleModal] = useState(false);

  const availablePermissions = [
    'admin.dashboard.view',
    'admin.users.view',
    'admin.users.create',
    'admin.users.edit',
    'admin.users.delete',
    'admin.coffee-growers.view',
    'admin.coffee-growers.create',
    'admin.coffee-growers.edit',
    'admin.coffee-growers.delete',
    'admin.farms.view',
    'admin.farms.create',
    'admin.farms.edit',
    'admin.farms.delete',
    'admin.subscription-plans.view',
    'admin.subscription-plans.create',
    'admin.subscription-plans.edit',
    'admin.subscription-plans.delete',
    'admin.subscriptions.view',
    'admin.subscriptions.manage',
    'admin.payments.view',
    'admin.payments.refund',
    'admin.reports.view',
    'admin.reports.export',
    'admin.audit.view',
    'admin.security.view',
    'admin.security.edit',
    'admin.settings.view',
    'admin.settings.edit'
  ];

  const fetchSecurityData = async () => {
    try {
      setLoading(true);
      const [settingsResponse, rolesResponse] = await Promise.all([
        useAuthenticatedFetch('/admin/security/settings'),
        useAuthenticatedFetch('/admin/security/roles')
      ]);

      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        setSettings(settingsData.settings);
      }

      if (rolesResponse.ok) {
        const rolesData = await rolesResponse.json();
        setRoles(rolesData.roles || []);
      }
    } catch (error) {
      console.error('Error fetching security data:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      const response = await useAuthenticatedFetch('/admin/security/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Configuración de seguridad guardada');
      } else {
        toast.error('Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const createRole = async () => {
    if (!newRole.name.trim()) {
      toast.error('El nombre del rol es requerido');
      return;
    }

    try {
      const response = await useAuthenticatedFetch('/admin/security/roles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRole)
      });

      if (response.ok) {
        const data = await response.json();
        setRoles([...roles, data.role]);
        setNewRole({ name: '', description: '', permissions: [] });
        setShowRoleModal(false);
        toast.success('Rol creado exitosamente');
      } else {
        toast.error('Error al crear rol');
      }
    } catch (error) {
      console.error('Error creating role:', error);
      toast.error('Error de conexión');
    }
  };

  const deleteRole = async (roleId: string) => {
    const role = roles.find(r => r.id === roleId);
    if (!role) return;

    if (role.isSystem) {
      toast.error('No se pueden eliminar roles del sistema');
      return;
    }

    if (!confirm(`¿Estás seguro de que quieres eliminar el rol "${role.name}"?`)) return;

    try {
      const response = await useAuthenticatedFetch(`/admin/security/roles/${roleId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setRoles(roles.filter(r => r.id !== roleId));
        toast.success('Rol eliminado exitosamente');
      } else {
        toast.error('Error al eliminar rol');
      }
    } catch (error) {
      console.error('Error deleting role:', error);
      toast.error('Error de conexión');
    }
  };

  const generateApiKey = async () => {
    try {
      const response = await useAuthenticatedFetch('/admin/security/api-key/generate', {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Nueva API Key generada');
        // Mostrar la nueva API key de forma segura
        alert(`Nueva API Key: ${data.apiKey}\n\nGuarda esta clave de forma segura. No se mostrará nuevamente.`);
      } else {
        toast.error('Error al generar API Key');
      }
    } catch (error) {
      console.error('Error generating API key:', error);
      toast.error('Error de conexión');
    }
  };

  const exportSecurityReport = async () => {
    try {
      const response = await useAuthenticatedFetch('/admin/security/report/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `security-report-${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Reporte de seguridad exportado');
      } else {
        toast.error('Error al exportar reporte');
      }
    } catch (error) {
      console.error('Error exporting security report:', error);
      toast.error('Error de conexión');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No se pudieron cargar las configuraciones de seguridad</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Shield className="h-6 w-6" />
            Configuración de Seguridad
          </h1>
          <p className="text-gray-600 mt-1">
            Gestiona las políticas de seguridad y permisos del sistema
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchSecurityData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <button 
            onClick={exportSecurityReport}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Reporte
          </button>
          <button 
            onClick={saveSettings}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            Configuraciones
          </button>
          <button
            onClick={() => setActiveTab('roles')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'roles'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Roles y Permisos
          </button>
          <button
            onClick={() => setActiveTab('monitoring')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'monitoring'
                ? 'border-emerald-500 text-emerald-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Eye className="h-4 w-4 inline mr-2" />
            Monitoreo
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          {/* Password Policy */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Política de Contraseñas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Longitud mínima
                </label>
                <input
                  type="number"
                  value={settings.passwordPolicy.minLength}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: {
                      ...settings.passwordPolicy,
                      minLength: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Días hasta expiración
                </label>
                <input
                  type="number"
                  value={settings.passwordPolicy.maxAge}
                  onChange={(e) => setSettings({
                    ...settings,
                    passwordPolicy: {
                      ...settings.passwordPolicy,
                      maxAge: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { key: 'requireUppercase', label: 'Requerir mayúsculas' },
                { key: 'requireLowercase', label: 'Requerir minúsculas' },
                { key: 'requireNumbers', label: 'Requerir números' },
                { key: 'requireSpecialChars', label: 'Requerir caracteres especiales' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy[key as keyof typeof settings.passwordPolicy] as boolean}
                    onChange={(e) => setSettings({
                      ...settings,
                      passwordPolicy: {
                        ...settings.passwordPolicy,
                        [key]: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Session Management */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Gestión de Sesiones
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración máxima (horas)
                </label>
                <input
                  type="number"
                  value={settings.sessionManagement.maxSessionDuration}
                  onChange={(e) => setSettings({
                    ...settings,
                    sessionManagement: {
                      ...settings.sessionManagement,
                      maxSessionDuration: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Timeout de inactividad (minutos)
                </label>
                <input
                  type="number"
                  value={settings.sessionManagement.idleTimeout}
                  onChange={(e) => setSettings({
                    ...settings,
                    sessionManagement: {
                      ...settings.sessionManagement,
                      idleTimeout: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sesiones concurrentes máximas
                </label>
                <input
                  type="number"
                  value={settings.sessionManagement.maxConcurrentSessions}
                  onChange={(e) => setSettings({
                    ...settings,
                    sessionManagement: {
                      ...settings.sessionManagement,
                      maxConcurrentSessions: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
          </div>

          {/* Two Factor Authentication */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              Autenticación de Dos Factores
            </h3>
            <div className="space-y-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth.enabled}
                  onChange={(e) => setSettings({
                    ...settings,
                    twoFactorAuth: {
                      ...settings.twoFactorAuth,
                      enabled: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">Habilitar 2FA</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.twoFactorAuth.required}
                  onChange={(e) => setSettings({
                    ...settings,
                    twoFactorAuth: {
                      ...settings.twoFactorAuth,
                      required: e.target.checked
                    }
                  })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">Requerir 2FA para todos los usuarios</span>
              </label>
            </div>
          </div>

          {/* API Security */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Server className="h-5 w-5" />
              Seguridad de API
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Límite de requests por minuto
                </label>
                <input
                  type="number"
                  value={settings.apiSecurity.requestsPerMinute}
                  onChange={(e) => setSettings({
                    ...settings,
                    apiSecurity: {
                      ...settings.apiSecurity,
                      requestsPerMinute: parseInt(e.target.value)
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">API Key actual</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-mono text-gray-500">
                    {showApiKey ? 'sk_live_1234567890abcdef' : '••••••••••••••••'}
                  </span>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  <button
                    onClick={generateApiKey}
                    className="text-emerald-600 hover:text-emerald-700"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              {[
                { key: 'rateLimitEnabled', label: 'Habilitar límite de velocidad' },
                { key: 'requireApiKey', label: 'Requerir API Key' },
                { key: 'enableCors', label: 'Habilitar CORS' }
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={settings.apiSecurity[key as keyof typeof settings.apiSecurity] as boolean}
                    onChange={(e) => setSettings({
                      ...settings,
                      apiSecurity: {
                        ...settings.apiSecurity,
                        [key]: e.target.checked
                      }
                    })}
                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">{label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'roles' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900">Roles y Permisos</h3>
            <button
              onClick={() => setShowRoleModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
            >
              <Users className="h-4 w-4" />
              Nuevo Rol
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <div key={role.id} className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-medium text-gray-900">{role.name}</h4>
                    <p className="text-sm text-gray-500">{role.description}</p>
                  </div>
                  {!role.isSystem && (
                    <button
                      onClick={() => deleteRole(role.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </button>
                  )}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  {role.userCount} usuario(s)
                </div>
                <div className="text-sm text-gray-600">
                  {role.permissions.length} permiso(s)
                </div>
                {role.isSystem && (
                  <div className="mt-2">
                    <span className="inline-flex px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                      Sistema
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'monitoring' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-green-600">98.5%</div>
                  <div className="text-sm text-gray-500">Disponibilidad del sistema</div>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-yellow-600">3</div>
                  <div className="text-sm text-gray-500">Alertas activas</div>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-2xl font-bold text-blue-600">156</div>
                  <div className="text-sm text-gray-500">Sesiones activas</div>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Monitoreo</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nivel de logging
                </label>
                <select
                  value={settings.auditSettings.logLevel}
                  onChange={(e) => setSettings({
                    ...settings,
                    auditSettings: {
                      ...settings.auditSettings,
                      logLevel: e.target.value as 'basic' | 'detailed' | 'verbose'
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="basic">Básico</option>
                  <option value="detailed">Detallado</option>
                  <option value="verbose">Verboso</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email para notificaciones
                </label>
                <input
                  type="email"
                  value={settings.auditSettings.notificationEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    auditSettings: {
                      ...settings.auditSettings,
                      notificationEmail: e.target.value
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="space-y-2">
                {[
                  { key: 'realTimeAlerts', label: 'Alertas en tiempo real' },
                  { key: 'emailNotifications', label: 'Notificaciones por email' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={settings.auditSettings[key as keyof typeof settings.auditSettings] as boolean}
                      onChange={(e) => setSettings({
                        ...settings,
                        auditSettings: {
                          ...settings.auditSettings,
                          [key]: e.target.checked
                        }
                      })}
                      className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Role Modal */}
      {showRoleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Crear Nuevo Rol</h2>
              <button
                onClick={() => setShowRoleModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <AlertTriangle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del rol
                </label>
                <input
                  type="text"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción
                </label>
                <textarea
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Permisos
                </label>
                <div className="max-h-64 overflow-y-auto border border-gray-300 rounded-lg p-3">
                  {availablePermissions.map((permission) => (
                    <label key={permission} className="flex items-center mb-2">
                      <input
                        type="checkbox"
                        checked={newRole.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRole({
                              ...newRole,
                              permissions: [...newRole.permissions, permission]
                            });
                          } else {
                            setNewRole({
                              ...newRole,
                              permissions: newRole.permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                        className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="ml-2 text-sm text-gray-700">{permission}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => setShowRoleModal(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={createRole}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Crear Rol
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
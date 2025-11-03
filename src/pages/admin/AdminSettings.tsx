import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import WompiConfigurationPanel from '@/components/admin/WompiConfigurationPanel';
import { 
  Settings, 
  Save, 
  RefreshCw,
  Globe,
  Mail,
  Bell,
  Database,
  Server,
  Shield,
  Palette,
  Upload,
  Download,
  AlertTriangle,
  CheckCircle,
  Info,
  Eye,
  EyeOff,
  Copy,
  ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';

interface SystemSettings {
  general: {
    siteName: string;
    siteDescription: string;
    siteUrl: string;
    adminEmail: string;
    supportEmail: string;
    timezone: string;
    language: string;
    currency: string;
    dateFormat: string;
    timeFormat: string;
  };
  email: {
    provider: 'smtp' | 'sendgrid' | 'mailgun';
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPassword: string;
    smtpSecure: boolean;
    fromEmail: string;
    fromName: string;
    replyToEmail: string;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
    pushEnabled: boolean;
    slackWebhook: string;
    discordWebhook: string;
    telegramBotToken: string;
    telegramChatId: string;
  };
  storage: {
    provider: 'local' | 's3' | 'cloudinary';
    maxFileSize: number;
    allowedFileTypes: string[];
    s3Bucket: string;
    s3Region: string;
    s3AccessKey: string;
    s3SecretKey: string;
    cloudinaryCloudName: string;
    cloudinaryApiKey: string;
    cloudinaryApiSecret: string;
  };
  payment: {
    wompiPublicKey: string;
    wompiPrivateKey: string;
    wompiEnvironment: 'test' | 'production';
    wompiWebhookSecret: string;
    currency: string;
    taxRate: number;
    enableTestMode: boolean;
  };
  security: {
    enableHttps: boolean;
    enableCors: boolean;
    corsOrigins: string[];
    enableRateLimit: boolean;
    rateLimitWindow: number;
    rateLimitMax: number;
    enableIpWhitelist: boolean;
    whitelistedIps: string[];
  };
  backup: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    retention: number;
    s3Backup: boolean;
    s3BackupBucket: string;
    emailNotifications: boolean;
    notificationEmail: string;
  };
  maintenance: {
    enabled: boolean;
    message: string;
    allowedIps: string[];
    estimatedDuration: string;
  };
}

export default function AdminSettings() {
  const { useAuthenticatedFetch, currentAdmin } = useAdminStore();
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'email' | 'notifications' | 'storage' | 'payment' | 'security' | 'backup' | 'maintenance'>('payment');
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [testingConnection, setTestingConnection] = useState<Record<string, boolean>>({});

  const fetchSettings = async () => {
    try {
      console.log('🔧 DEBUG AdminSettings - Iniciando fetchSettings');
      console.log('🔧 DEBUG AdminSettings - Usuario actual:', currentAdmin);
      console.log('🔧 DEBUG AdminSettings - Es super admin:', currentAdmin?.is_super_admin);
      console.log('🔧 DEBUG AdminSettings - Rol:', currentAdmin?.role);
      console.log('🔧 DEBUG AdminSettings - Estado loading:', loading);
      
      setLoading(true);
      
      // Cambiar la URL del endpoint para incluir /api
      const response = await useAuthenticatedFetch('/api/admin/settings');
      console.log('🔧 DEBUG AdminSettings - Respuesta recibida:', response);
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('🔧 DEBUG AdminSettings - Datos extraídos:', data);
      
      // El backend devuelve directamente los datos agrupados
      const settingsData = data;
      console.log('🔧 DEBUG AdminSettings - Configuraciones formateadas:', settingsData);
        
      if (!settingsData) {
        console.error('❌ No hay datos de configuración en la respuesta');
        toast.error('No se encontraron configuraciones');
        return;
      }

      // Convertir configuraciones del backend al formato del frontend
      console.log('🔧 Datos de configuración:', settingsData);
      
      const formattedSettings: SystemSettings = {
        general: {
          siteName: settingsData.general?.site_name?.value || '',
          siteDescription: settingsData.general?.site_description?.value || '',
          siteUrl: settingsData.general?.site_url?.value || '',
          adminEmail: settingsData.general?.admin_email?.value || '',
          supportEmail: settingsData.general?.support_email?.value || '',
          timezone: settingsData.general?.timezone?.value || 'America/Bogota',
          language: settingsData.general?.language?.value || 'es',
          currency: settingsData.general?.currency?.value || 'COP',
          dateFormat: settingsData.general?.date_format?.value || 'DD/MM/YYYY',
          timeFormat: settingsData.general?.time_format?.value || '24h'
        },
        email: {
          provider: settingsData.email?.provider?.value || 'smtp',
          smtpHost: settingsData.email?.smtp_host?.value || '',
          smtpPort: parseInt(settingsData.email?.smtp_port?.value) || 587,
          smtpUser: settingsData.email?.smtp_user?.value || '',
          smtpPassword: settingsData.email?.smtp_password?.value || '',
          smtpSecure: settingsData.email?.smtp_secure?.value === 'true',
          fromEmail: settingsData.email?.from_email?.value || '',
          fromName: settingsData.email?.from_name?.value || '',
          replyToEmail: settingsData.email?.reply_to_email?.value || ''
        },
        notifications: {
          emailEnabled: settingsData.notifications?.email_enabled?.value === 'true',
          smsEnabled: settingsData.notifications?.sms_enabled?.value === 'true',
          pushEnabled: settingsData.notifications?.push_enabled?.value === 'true',
          slackWebhook: settingsData.notifications?.slack_webhook?.value || '',
          discordWebhook: settingsData.notifications?.discord_webhook?.value || '',
          telegramBotToken: settingsData.notifications?.telegram_bot_token?.value || '',
          telegramChatId: settingsData.notifications?.telegram_chat_id?.value || ''
        },
        storage: {
          provider: settingsData.storage?.provider?.value || 'local',
          maxFileSize: parseInt(settingsData.storage?.max_file_size?.value) || 10,
          allowedFileTypes: settingsData.storage?.allowed_file_types?.value ? JSON.parse(settingsData.storage.allowed_file_types.value) : ['jpg', 'jpeg', 'png', 'pdf'],
          s3Bucket: settingsData.storage?.s3_bucket?.value || '',
          s3Region: settingsData.storage?.s3_region?.value || '',
          s3AccessKey: settingsData.storage?.s3_access_key?.value || '',
          s3SecretKey: settingsData.storage?.s3_secret_key?.value || '',
          cloudinaryCloudName: settingsData.storage?.cloudinary_cloud_name?.value || '',
          cloudinaryApiKey: settingsData.storage?.cloudinary_api_key?.value || '',
          cloudinaryApiSecret: settingsData.storage?.cloudinary_api_secret?.value || ''
        },
        payment: {
          wompiPublicKey: settingsData.payment?.wompi_public_key?.value || '',
          wompiPrivateKey: settingsData.payment?.wompi_private_key?.value || '',
          wompiEnvironment: settingsData.payment?.wompi_environment?.value || 'test',
          wompiWebhookSecret: settingsData.payment?.wompi_webhook_secret?.value || '',
          currency: settingsData.payment?.wompi_currency?.value || 'COP',
          taxRate: parseFloat(settingsData.payment?.wompi_tax_rate?.value) || 0,
          enableTestMode: settingsData.payment?.enable_test_mode?.value === 'true'
        },
        security: {
          enableHttps: settingsData.security?.enable_https?.value === 'true',
          enableCors: settingsData.security?.enable_cors?.value === 'true',
          corsOrigins: settingsData.security?.cors_origins?.value ? JSON.parse(settingsData.security.cors_origins.value) : [],
          enableRateLimit: settingsData.security?.enable_rate_limit?.value === 'true',
          rateLimitWindow: parseInt(settingsData.security?.rate_limit_window?.value) || 15,
          rateLimitMax: parseInt(settingsData.security?.rate_limit_max?.value) || 100,
          enableIpWhitelist: settingsData.security?.enable_ip_whitelist?.value === 'true',
          whitelistedIps: settingsData.security?.whitelisted_ips?.value ? JSON.parse(settingsData.security.whitelisted_ips.value) : []
        },
        backup: {
          enabled: settingsData.backup?.enabled?.value === 'true',
          frequency: settingsData.backup?.frequency?.value || 'daily',
          retention: parseInt(settingsData.backup?.retention?.value) || 30,
          s3Backup: settingsData.backup?.s3_backup?.value === 'true',
          s3BackupBucket: settingsData.backup?.s3_backup_bucket?.value || '',
          emailNotifications: settingsData.backup?.email_notifications?.value === 'true',
          notificationEmail: settingsData.backup?.notification_email?.value || ''
        },
        maintenance: {
          enabled: settingsData.maintenance?.enabled?.value === 'true',
          message: settingsData.maintenance?.message?.value || '',
          allowedIps: settingsData.maintenance?.allowed_ips?.value ? JSON.parse(settingsData.maintenance.allowed_ips.value) : [],
          estimatedDuration: settingsData.maintenance?.estimated_duration?.value || ''
        }
      };
      
      console.log('✅ Configuraciones formateadas:', formattedSettings);
      setSettings(formattedSettings);
    } catch (error) {
      console.error('💥 Error fetching settings:', error);
      toast.error('Error de conexión');
    } finally {
      console.log('🏁 Finalizando fetchSettings, loading = false');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🔄 useEffect ejecutándose, llamando fetchSettings...');
    fetchSettings();
  }, []);

  const saveSettings = async () => {
    if (!settings) return;

    try {
      setSaving(true);
      
      // Convertir configuraciones al formato del backend
      const settingsArray = [];
      
      // General settings
      Object.entries(settings.general).forEach(([key, value]) => {
        settingsArray.push({
          category: 'general',
          key: key,
          value: String(value)
        });
      });
      
      // Email settings
      Object.entries(settings.email).forEach(([key, value]) => {
        settingsArray.push({
          category: 'email',
          key: key,
          value: String(value)
        });
      });
      
      // Notifications settings
      Object.entries(settings.notifications).forEach(([key, value]) => {
        settingsArray.push({
          category: 'notifications',
          key: key,
          value: String(value)
        });
      });
      
      // Storage settings
      Object.entries(settings.storage).forEach(([key, value]) => {
        settingsArray.push({
          category: 'storage',
          key: key,
          value: Array.isArray(value) ? JSON.stringify(value) : String(value)
        });
      });
      
      // Payment settings
      Object.entries(settings.payment).forEach(([key, value]) => {
        settingsArray.push({
          category: 'payment',
          key: key,
          value: String(value)
        });
      });
      
      // Security settings
      Object.entries(settings.security).forEach(([key, value]) => {
        settingsArray.push({
          category: 'security',
          key: key,
          value: Array.isArray(value) ? JSON.stringify(value) : String(value)
        });
      });
      
      // Backup settings
      Object.entries(settings.backup).forEach(([key, value]) => {
        settingsArray.push({
          category: 'backup',
          key: key,
          value: String(value)
        });
      });
      
      // Maintenance settings
      Object.entries(settings.maintenance).forEach(([key, value]) => {
        settingsArray.push({
          category: 'maintenance',
          key: key,
          value: Array.isArray(value) ? JSON.stringify(value) : String(value)
        });
      });
      
      const response = await useAuthenticatedFetch('/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: settingsArray })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(result.message || 'Configuraciones guardadas exitosamente');
        } else {
          toast.error(result.message || 'Error al guardar configuraciones');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al guardar configuraciones');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const testEmailConnection = async () => {
    if (!settings) return;

    try {
      setTestingConnection({ ...testingConnection, email: true });
      const response = await useAuthenticatedFetch('/admin/settings/test/email', {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          toast.success(result.message || 'Conexión de email exitosa');
        } else {
          toast.error(result.message || 'Error en la conexión de email');
        }
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error en la conexión de email');
      }
    } catch (error) {
      console.error('Error testing email:', error);
      toast.error('Error de conexión');
    } finally {
      setTestingConnection({ ...testingConnection, email: false });
    }
  };

  const testStorageConnection = async () => {
    if (!settings) return;

    try {
      setTestingConnection({ ...testingConnection, storage: true });
      const response = await useAuthenticatedFetch('/admin/settings/test-storage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.storage)
      });

      if (response.ok) {
        toast.success('Conexión de almacenamiento exitosa');
      } else {
        toast.error('Error en la conexión de almacenamiento');
      }
    } catch (error) {
      console.error('Error testing storage:', error);
      toast.error('Error de conexión');
    } finally {
      setTestingConnection({ ...testingConnection, storage: false });
    }
  };

  const testPaymentConnection = async () => {
    if (!settings) return;

    try {
      setTestingConnection({ ...testingConnection, payment: true });
      const response = await useAuthenticatedFetch('/admin/settings/test-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings.payment)
      });

      if (response.ok) {
        toast.success('Conexión de pagos exitosa');
      } else {
        toast.error('Error en la conexión de pagos');
      }
    } catch (error) {
      console.error('Error testing payment:', error);
      toast.error('Error de conexión');
    } finally {
      setTestingConnection({ ...testingConnection, payment: false });
    }
  };

  const exportSettings = async () => {
    try {
      const response = await useAuthenticatedFetch('/admin/settings/export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settings-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Configuraciones exportadas');
      } else {
        toast.error('Error al exportar configuraciones');
      }
    } catch (error) {
      console.error('Error exporting settings:', error);
      toast.error('Error de conexión');
    }
  };

  const importSettings = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await useAuthenticatedFetch('/admin/settings/import', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        toast.success('Configuraciones importadas exitosamente');
      } else {
        toast.error('Error al importar configuraciones');
      }
    } catch (error) {
      console.error('Error importing settings:', error);
      toast.error('Error de conexión');
    }
  };

  const togglePassword = (field: string) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  // Verificar que settings no sea null antes de renderizar
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">No se pudieron cargar las configuraciones</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="h-6 w-6" />
              Configuración del Sistema
            </h1>
            <p className="text-gray-600 mt-1">
              Gestiona las configuraciones generales del sistema
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={fetchSettings}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4" />
              Actualizar
            </button>
            <button 
              onClick={exportSettings}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Download className="h-4 w-4" />
              Exportar
            </button>
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
              <Upload className="h-4 w-4" />
              Importar
              <input
                type="file"
                accept=".json"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) importSettings(file);
                }}
                className="hidden"
              />
            </label>
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
          <nav className="-mb-px flex space-x-8 overflow-x-auto">
            {[
              { key: 'general', label: 'General', icon: Settings },
              { key: 'email', label: 'Email', icon: Mail },
              { key: 'notifications', label: 'Notificaciones', icon: Bell },
              { key: 'storage', label: 'Almacenamiento', icon: Database },
              { key: 'payment', label: 'Pagos', icon: Server },
              { key: 'security', label: 'Seguridad', icon: Shield },
              { key: 'backup', label: 'Respaldos', icon: Download },
              { key: 'maintenance', label: 'Mantenimiento', icon: AlertTriangle }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === key
                    ? 'border-emerald-500 text-emerald-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4 inline mr-2" />
                {label}
              </button>
            ))}
          </nav>
        </div>
  
        {/* Content */}
        {activeTab === 'general' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración General</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del sitio
                </label>
                <input
                  type="text"
                  value={settings.general.siteName}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, siteName: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL del sitio
                </label>
                <input
                  type="url"
                  value={settings.general.siteUrl}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, siteUrl: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción del sitio
                </label>
                <textarea
                  value={settings.general.siteDescription}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, siteDescription: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email del administrador
                </label>
                <input
                  type="email"
                  value={settings.general.adminEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, adminEmail: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de soporte
                </label>
                <input
                  type="email"
                  value={settings.general.supportEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, supportEmail: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona horaria
                </label>
                <select
                  value={settings.general.timezone}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, timezone: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="America/Bogota">América/Bogotá</option>
                  <option value="America/New_York">América/Nueva York</option>
                  <option value="Europe/Madrid">Europa/Madrid</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idioma
                </label>
                <select
                  value={settings.general.language}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, language: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="es">Español</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda
                </label>
                <select
                  value={settings.general.currency}
                  onChange={(e) => setSettings({
                    ...settings,
                    general: { ...settings.general, currency: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="COP">Peso Colombiano (COP)</option>
                  <option value="USD">Dólar Americano (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
            </div>
          </div>
        )}
  
        {activeTab === 'email' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Configuración de Email</h3>
              <button
                onClick={testEmailConnection}
                disabled={testingConnection.email}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {testingConnection.email ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                Probar Conexión
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Proveedor
                </label>
                <select
                  value={settings.email.provider}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, provider: e.target.value as 'smtp' | 'sendgrid' | 'mailgun' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                >
                  <option value="smtp">SMTP</option>
                  <option value="sendgrid">SendGrid</option>
                  <option value="mailgun">Mailgun</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Host SMTP
                </label>
                <input
                  type="text"
                  value={settings.email.smtpHost}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, smtpHost: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Puerto SMTP
                </label>
                <input
                  type="number"
                  value={settings.email.smtpPort}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, smtpPort: parseInt(e.target.value) }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Usuario SMTP
                </label>
                <input
                  type="text"
                  value={settings.email.smtpUser}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, smtpUser: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contraseña SMTP
                </label>
                <div className="relative">
                  <input
                    type={showPasswords.smtpPassword ? 'text' : 'password'}
                    value={settings.email.smtpPassword}
                    onChange={(e) => setSettings({
                      ...settings,
                      email: { ...settings.email, smtpPassword: e.target.value }
                    })}
                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => togglePassword('smtpPassword')}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords.smtpPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email remitente
                </label>
                <input
                  type="email"
                  value={settings.email.fromEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, fromEmail: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre remitente
                </label>
                <input
                  type="text"
                  value={settings.email.fromName}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, fromName: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email de respuesta
                </label>
                <input
                  type="email"
                  value={settings.email.replyToEmail}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, replyToEmail: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.email.smtpSecure}
                  onChange={(e) => setSettings({
                    ...settings,
                    email: { ...settings.email, smtpSecure: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">Usar conexión segura (SSL/TLS)</span>
              </label>
            </div>
          </div>
        )}
  
        {activeTab === 'payment' && (
          <>
            {console.log('🔧 DEBUG AdminSettings - Renderizando pestaña de pagos...')}
            <WompiConfigurationPanel 
              paymentSettings={settings.payment}
              onSettingsChange={(newPaymentSettings) => {
                setSettings({
                  ...settings,
                  payment: newPaymentSettings
                });
              }}
            />
          </>
        )}
  
        {activeTab === 'maintenance' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Modo de Mantenimiento</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-sm font-medium text-yellow-800">
                    {settings.maintenance.enabled ? 'Modo de mantenimiento ACTIVO' : 'Modo de mantenimiento INACTIVO'}
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.maintenance.enabled}
                    onChange={(e) => setSettings({
                      ...settings,
                      maintenance: { ...settings.maintenance, enabled: e.target.checked }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mensaje de mantenimiento
                </label>
                <textarea
                  value={settings.maintenance.message}
                  onChange={(e) => setSettings({
                    ...settings,
                    maintenance: { ...settings.maintenance, message: e.target.value }
                  })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="El sitio está en mantenimiento. Volveremos pronto."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duración estimada
                </label>
                <input
                  type="text"
                  value={settings.maintenance.estimatedDuration}
                  onChange={(e) => setSettings({
                    ...settings,
                    maintenance: { ...settings.maintenance, estimatedDuration: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="2 horas"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  IPs permitidas (una por línea)
                </label>
                <textarea
                  value={settings.maintenance.allowedIps.join('\n')}
                  onChange={(e) => setSettings({
                    ...settings,
                    maintenance: { 
                      ...settings.maintenance, 
                      allowedIps: e.target.value.split('\n').filter(ip => ip.trim()) 
                    }
                  })}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  placeholder="192.168.1.1&#10;10.0.0.1"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
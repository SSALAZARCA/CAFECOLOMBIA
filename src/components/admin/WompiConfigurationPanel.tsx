import { useState, useEffect } from 'react';
import { useAdminStore } from '@/stores/adminStore';
import { 
  CreditCard, 
  Save, 
  RefreshCw,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  CheckCircle,
  AlertTriangle,
  Info,
  Settings,
  Globe,
  Shield,
  Webhook,
  TestTube,
  DollarSign
} from 'lucide-react';
import { toast } from 'sonner';

interface WompiConfig {
  publicKey: string;
  privateKey: string;
  environment: 'test' | 'production';
  webhookSecret: string;
  webhookUrl: string;
  currency: string;
  taxRate: number;
  enableTestMode: boolean;
  acceptedPaymentMethods: {
    creditCard: boolean;
    debitCard: boolean;
    pse: boolean;
    bancolombia: boolean;
    nequi: boolean;
    daviplata: boolean;
  };
  webhookEvents: {
    transactionUpdated: boolean;
    paymentLinkUpdated: boolean;
    merchantUpdated: boolean;
  };
  retryConfig: {
    maxRetries: number;
    retryDelay: number;
    exponentialBackoff: boolean;
  };
}

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

interface WompiConfigurationPanelProps {
  paymentSettings: {
    wompiPublicKey: string;
    wompiPrivateKey: string;
    wompiEnvironment: string;
    wompiWebhookSecret: string;
    currency: string;
    taxRate: number;
    enableTestMode: boolean;
  };
  onSettingsChange: (newSettings: any) => void;
}

export default function WompiConfigurationPanel({ paymentSettings, onSettingsChange }: WompiConfigurationPanelProps) {
  const { useAuthenticatedFetch } = useAdminStore();
  const [config, setConfig] = useState<WompiConfig>({
    publicKey: paymentSettings.wompiPublicKey || '',
    privateKey: paymentSettings.wompiPrivateKey || '',
    environment: paymentSettings.wompiEnvironment === 'production' ? 'production' : 'test',
    webhookSecret: paymentSettings.wompiWebhookSecret || '',
    webhookUrl: '',
    currency: paymentSettings.currency || 'COP',
    taxRate: paymentSettings.taxRate || 19,
    enableTestMode: paymentSettings.enableTestMode !== false,
    acceptedPaymentMethods: {
      creditCard: true,
      debitCard: true,
      pse: true,
      bancolombia: false,
      nequi: false,
      daviplata: false
    },
    webhookEvents: {
      transactionUpdated: true,
      paymentLinkUpdated: true,
      merchantUpdated: false
    },
    retryConfig: {
      maxRetries: 3,
      retryDelay: 1000,
      exponentialBackoff: true
    }
  });
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState<Record<string, boolean>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});

  // Actualizar config cuando cambien las props
  useEffect(() => {
    setConfig(prev => ({
      ...prev,
      publicKey: paymentSettings.wompiPublicKey || '',
      privateKey: paymentSettings.wompiPrivateKey || '',
      environment: paymentSettings.wompiEnvironment === 'production' ? 'production' : 'test',
      webhookSecret: paymentSettings.wompiWebhookSecret || '',
      currency: paymentSettings.currency || 'COP',
      taxRate: paymentSettings.taxRate || 19,
      enableTestMode: paymentSettings.enableTestMode !== false,
    }));
  }, [paymentSettings]);

  // Notificar cambios al componente padre
  const updateConfig = (newConfig: Partial<WompiConfig>) => {
    const updatedConfig = { ...config, ...newConfig };
    setConfig(updatedConfig);
    
    // Convertir de vuelta al formato del componente padre
    onSettingsChange({
      wompiPublicKey: updatedConfig.publicKey,
      wompiPrivateKey: updatedConfig.privateKey,
      wompiEnvironment: updatedConfig.environment,
      wompiWebhookSecret: updatedConfig.webhookSecret,
      currency: updatedConfig.currency,
      taxRate: updatedConfig.taxRate,
      enableTestMode: updatedConfig.enableTestMode,
    });
  };

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const response = await useAuthenticatedFetch('/admin/settings/payment');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Mapear configuraciones de la base de datos al formato del componente
          const settings = data.data;
          setConfig({
            ...config,
            publicKey: settings.wompi_public_key || '',
            privateKey: settings.wompi_private_key || '',
            environment: settings.wompi_environment === 'production' ? 'production' : 'test',
            webhookSecret: settings.wompi_webhook_secret || '',
            webhookUrl: settings.wompi_webhook_url || '',
            currency: settings.wompi_currency || 'COP',
            taxRate: parseFloat(settings.wompi_tax_rate || '19'),
            enableTestMode: settings.wompi_environment !== 'production'
          });
        }
      } else {
        toast.error('Error al cargar configuración de Wompi');
      }
    } catch (error) {
      console.error('Error fetching Wompi config:', error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, []);

  const saveConfig = async () => {
    try {
      setSaving(true);
      
      // Mapear configuración del componente al formato de la base de datos
      const settings = {
        payment: {
          wompi_public_key: { value: config.publicKey, description: 'Clave pública de Wompi' },
          wompi_private_key: { value: config.privateKey, description: 'Clave privada de Wompi', is_encrypted: true },
          wompi_environment: { value: config.environment === 'production' ? 'production' : 'sandbox', description: 'Entorno de Wompi' },
          wompi_webhook_secret: { value: config.webhookSecret, description: 'Secreto del webhook de Wompi', is_encrypted: true },
          wompi_webhook_url: { value: config.webhookUrl, description: 'URL del webhook de Wompi' },
          wompi_currency: { value: config.currency, description: 'Moneda por defecto' },
          wompi_tax_rate: { value: config.taxRate.toString(), description: 'Tasa de impuesto (%)' }
        }
      };

      const response = await useAuthenticatedFetch('/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings })
      });

      if (response.ok) {
        toast.success('Configuración de Wompi guardada exitosamente');
      } else {
        const errorData = await response.json();
        toast.error(errorData.message || 'Error al guardar configuración');
      }
    } catch (error) {
      console.error('Error saving Wompi config:', error);
      toast.error('Error de conexión');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting({ ...testing, connection: true });
      const response = await useAuthenticatedFetch('/admin/settings/test/wompi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const result = await response.json();
      setTestResults({ ...testResults, connection: result });
      
      if (result.success) {
        toast.success('Conexión con Wompi exitosa');
      } else {
        toast.error(`Error de conexión: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      toast.error('Error al probar conexión');
    } finally {
      setTesting({ ...testing, connection: false });
    }
  };

  const testWebhook = async () => {
    try {
      setTesting({ ...testing, webhook: true });
      const response = await useAuthenticatedFetch('/admin/wompi/test-webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          webhookUrl: config.webhookUrl,
          webhookSecret: config.webhookSecret
        })
      });

      const result = await response.json();
      setTestResults({ ...testResults, webhook: result });
      
      if (result.success) {
        toast.success('Webhook configurado correctamente');
      } else {
        toast.error(`Error en webhook: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast.error('Error al probar webhook');
    } finally {
      setTesting({ ...testing, webhook: false });
    }
  };

  const testPayment = async () => {
    try {
      setTesting({ ...testing, payment: true });
      const response = await useAuthenticatedFetch('/admin/payments/wompi/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 1000, // $10 COP para prueba
          currency: config.currency,
          environment: config.environment
        })
      });

      const result = await response.json();
      setTestResults({ ...testResults, payment: result });
      
      if (result.success) {
        toast.success('Pago de prueba creado exitosamente');
      } else {
        toast.error(`Error en pago de prueba: ${result.message}`);
      }
    } catch (error) {
      console.error('Error testing payment:', error);
      toast.error('Error al probar pago');
    } finally {
      setTesting({ ...testing, payment: false });
    }
  };

  const generateWebhookSecret = () => {
    const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    updateConfig({ webhookSecret: secret });
    toast.success('Secreto de webhook generado');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado al portapapeles');
  };

  const toggleSecret = (field: string) => {
    setShowSecrets({ ...showSecrets, [field]: !showSecrets[field] });
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
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Configuración de Wompi
          </h2>
          <p className="text-gray-600 mt-1">
            Configura la integración con el gateway de pagos Wompi
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchConfig}
            className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            <RefreshCw className="h-4 w-4" />
            Actualizar
          </button>
          <button 
            onClick={saveConfig}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* API Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configuración de API
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clave Pública
            </label>
            <div className="relative">
              <input
                type="text"
                value={config.publicKey}
                onChange={(e) => updateConfig({ publicKey: e.target.value })}
                placeholder="pub_test_..."
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(config.publicKey)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Copy className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Clave Privada
            </label>
            <div className="relative">
              <input
                type={showSecrets.privateKey ? 'text' : 'password'}
                value={config.privateKey}
                onChange={(e) => updateConfig({ privateKey: e.target.value })}
                placeholder="prv_test_..."
                className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                <button
                  type="button"
                  onClick={() => copyToClipboard(config.privateKey)}
                  className="pr-2"
                >
                  <Copy className="h-4 w-4 text-gray-400" />
                </button>
                <button
                  type="button"
                  onClick={() => toggleSecret('privateKey')}
                  className="pr-3"
                >
                  {showSecrets.privateKey ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Entorno
            </label>
            <select
              value={config.environment}
              onChange={(e) => updateConfig({ environment: e.target.value as 'test' | 'production' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="test">Pruebas (Sandbox)</option>
              <option value="production">Producción</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Moneda
            </label>
            <select
              value={config.currency}
              onChange={(e) => updateConfig({ currency: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="COP">Peso Colombiano (COP)</option>
              <option value="USD">Dólar Americano (USD)</option>
            </select>
          </div>
        </div>
        <div className="mt-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={config.enableTestMode}
              onChange={(e) => updateConfig({ enableTestMode: e.target.checked })}
              className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="ml-2 text-sm text-gray-700">Habilitar modo de prueba</span>
          </label>
        </div>
      </div>

      {/* Webhook Configuration */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Webhook className="h-5 w-5" />
          Configuración de Webhooks
        </h3>
        <div className="grid grid-cols-1 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL del Webhook
            </label>
            <div className="relative">
              <input
                type="url"
                value={config.webhookUrl}
                onChange={(e) => updateConfig({ webhookUrl: e.target.value })}
                placeholder="https://tu-dominio.com/api/webhooks/wompi"
                className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <button
                type="button"
                onClick={() => copyToClipboard(config.webhookUrl)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <Copy className="h-4 w-4 text-gray-400" />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Secreto del Webhook
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showSecrets.webhookSecret ? 'text' : 'password'}
                  value={config.webhookSecret}
                  onChange={(e) => updateConfig({ webhookSecret: e.target.value })}
                  placeholder="Secreto para validar webhooks"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => toggleSecret('webhookSecret')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showSecrets.webhookSecret ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>
              <button
                onClick={generateWebhookSecret}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Generar
              </button>
            </div>
          </div>
        </div>

        {/* Webhook Events */}
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Eventos del Webhook</h4>
          <div className="space-y-2">
            {Object.entries(config.webhookEvents).map(([event, enabled]) => (
              <label key={event} className="flex items-center">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(e) => updateConfig({
                    ...config,
                    webhookEvents: { ...config.webhookEvents, [event]: e.target.checked }
                  })}
                  className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="ml-2 text-sm text-gray-700">
                  {event === 'transactionUpdated' && 'Actualización de transacciones'}
                  {event === 'paymentLinkUpdated' && 'Actualización de enlaces de pago'}
                  {event === 'merchantUpdated' && 'Actualización de comerciante'}
                </span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Métodos de Pago Aceptados
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Object.entries(config.acceptedPaymentMethods).map(([method, enabled]) => (
            <label key={method} className="flex items-center">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => updateConfig({
                  ...config,
                  acceptedPaymentMethods: { ...config.acceptedPaymentMethods, [method]: e.target.checked }
                })}
                className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="ml-2 text-sm text-gray-700">
                {method === 'creditCard' && 'Tarjeta de Crédito'}
                {method === 'debitCard' && 'Tarjeta Débito'}
                {method === 'pse' && 'PSE'}
                {method === 'bancolombia' && 'Bancolombia'}
                {method === 'nequi' && 'Nequi'}
                {method === 'daviplata' && 'Daviplata'}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Test Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Pruebas de Configuración
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <button
              onClick={testConnection}
              disabled={testing.connection}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {testing.connection ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Globe className="h-4 w-4" />
              )}
              Probar Conexión
            </button>
            {testResults.connection && (
              <div className={`mt-2 p-2 rounded text-xs ${
                testResults.connection.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.connection.message}
              </div>
            )}
          </div>
          <div>
            <button
              onClick={testWebhook}
              disabled={testing.webhook}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {testing.webhook ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Webhook className="h-4 w-4" />
              )}
              Probar Webhook
            </button>
            {testResults.webhook && (
              <div className={`mt-2 p-2 rounded text-xs ${
                testResults.webhook.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.webhook.message}
              </div>
            )}
          </div>
          <div>
            <button
              onClick={testPayment}
              disabled={testing.payment}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
            >
              {testing.payment ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <CreditCard className="h-4 w-4" />
              )}
              Probar Pago
            </button>
            {testResults.payment && (
              <div className={`mt-2 p-2 rounded text-xs ${
                testResults.payment.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {testResults.payment.message}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Documentation */}
      <div className="bg-blue-50 rounded-lg p-4">
        <div className="flex items-start">
          <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-2" />
          <div>
            <h4 className="text-sm font-medium text-blue-900">Documentación de Wompi</h4>
            <p className="text-sm text-blue-700 mt-1">
              Para obtener tus claves de API y configurar webhooks, visita el panel de Wompi.
            </p>
            <div className="mt-2 space-x-4">
              <a
                href="https://comercios.wompi.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
              >
                Panel de Comercios
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
              <a
                href="https://docs.wompi.co/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center"
              >
                Documentación API
                <ExternalLink className="h-3 w-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
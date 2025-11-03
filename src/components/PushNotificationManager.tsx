import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Settings, Check, X, AlertCircle, Info } from 'lucide-react';
import { pushNotificationService, NotificationPreferences } from '../services/pushNotificationService';
import { notificationService } from '../services/notificationService';

interface PushNotificationManagerProps {
  className?: string;
  showSettings?: boolean;
  onPermissionChange?: (granted: boolean) => void;
}

interface NotificationStatus {
  isSupported: boolean;
  isSubscribed: boolean;
  hasPermission: boolean;
  token: string | null;
}

export const PushNotificationManager: React.FC<PushNotificationManagerProps> = ({
  className = '',
  showSettings = true,
  onPermissionChange
}) => {
  const [status, setStatus] = useState<NotificationStatus>({
    isSupported: false,
    isSubscribed: false,
    hasPermission: false,
    token: null
  });
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    initializeStatus();
  }, []);

  const initializeStatus = async () => {
    try {
      const stats = await pushNotificationService.getSubscriptionStats();
      const currentPreferences = pushNotificationService.getPreferences();
      
      setStatus({
        isSupported: 'serviceWorker' in navigator && 'PushManager' in window,
        isSubscribed: stats.isSubscribed,
        hasPermission: Notification.permission === 'granted',
        token: stats.token
      });
      
      setPreferences(currentPreferences);
    } catch (error) {
      console.error('Failed to initialize notification status:', error);
      setError('Error al cargar el estado de las notificaciones');
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = await pushNotificationService.subscribe();
      
      if (token) {
        setStatus(prev => ({
          ...prev,
          isSubscribed: true,
          hasPermission: true,
          token
        }));
        setSuccess('¡Notificaciones activadas correctamente!');
        onPermissionChange?.(true);
      } else {
        setError('No se pudo activar las notificaciones. Verifica los permisos del navegador.');
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      setError('Error al activar las notificaciones push');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const success = await pushNotificationService.unsubscribe();
      
      if (success) {
        setStatus(prev => ({
          ...prev,
          isSubscribed: false,
          token: null
        }));
        setSuccess('Notificaciones desactivadas');
        onPermissionChange?.(false);
      } else {
        setError('Error al desactivar las notificaciones');
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      setError('Error al desactivar las notificaciones push');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreferenceChange = async (key: keyof NotificationPreferences, value: boolean) => {
    if (!preferences) return;

    const newPreferences = { ...preferences, [key]: value };
    setPreferences(newPreferences);

    try {
      await pushNotificationService.updatePreferences({ [key]: value });
      setSuccess('Preferencias actualizadas');
    } catch (error) {
      console.error('Failed to update preferences:', error);
      setError('Error al actualizar las preferencias');
      // Revertir cambio en caso de error
      setPreferences(preferences);
    }
  };

  const handleTestNotification = async () => {
    if (!status.isSubscribed) return;

    try {
      await pushNotificationService.sendTestNotification({
        title: 'Notificación de Prueba',
        body: 'Esta es una notificación de prueba del sistema CaféColombia',
        data: {
          agentType: 'phytosanitary',
          priority: 'normal'
        }
      });
      setSuccess('Notificación de prueba enviada');
    } catch (error) {
      console.error('Failed to send test notification:', error);
      setError('Error al enviar la notificación de prueba');
    }
  };

  const clearMessages = () => {
    setError(null);
    setSuccess(null);
  };

  if (!status.isSupported) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800">
            Las notificaciones push no están soportadas en este navegador
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            {status.isSubscribed ? (
              <Bell className="h-5 w-5 text-green-600 mr-2" />
            ) : (
              <BellOff className="h-5 w-5 text-gray-400 mr-2" />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              Notificaciones Push
            </h3>
          </div>
          {showSettings && (
            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <Settings className="h-4 w-4" />
            </button>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mt-1">
          {status.isSubscribed 
            ? 'Recibe notificaciones de análisis de IA y alertas importantes'
            : 'Activa las notificaciones para recibir alertas en tiempo real'
          }
        </p>
      </div>

      {/* Messages */}
      {(error || success) && (
        <div className="p-4 border-b border-gray-200">
          {error && (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-md p-3 mb-2">
              <div className="flex items-center">
                <X className="h-4 w-4 text-red-600 mr-2" />
                <span className="text-red-800 text-sm">{error}</span>
              </div>
              <button onClick={clearMessages} className="text-red-600 hover:text-red-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
          
          {success && (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-md p-3">
              <div className="flex items-center">
                <Check className="h-4 w-4 text-green-600 mr-2" />
                <span className="text-green-800 text-sm">{success}</span>
              </div>
              <button onClick={clearMessages} className="text-green-600 hover:text-green-800">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Main Controls */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              Estado: {status.isSubscribed ? 'Activado' : 'Desactivado'}
            </p>
            <p className="text-xs text-gray-500">
              Permisos: {status.hasPermission ? 'Concedidos' : 'No concedidos'}
            </p>
          </div>
          
          <div className="flex space-x-2">
            {status.isSubscribed ? (
              <>
                <button
                  onClick={handleTestNotification}
                  className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                >
                  Probar
                </button>
                <button
                  onClick={handleUnsubscribe}
                  disabled={isLoading}
                  className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Desactivando...' : 'Desactivar'}
                </button>
              </>
            ) : (
              <button
                onClick={handleSubscribe}
                disabled={isLoading}
                className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Activando...' : 'Activar Notificaciones'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Preferences Panel */}
      {showPreferences && preferences && (
        <div className="border-t border-gray-200 p-4">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            Preferencias de Notificación
          </h4>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Análisis Fitosanitario</label>
                <p className="text-xs text-gray-500">Detección de plagas y enfermedades</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.phytosanitary}
                  onChange={(e) => handlePreferenceChange('phytosanitary', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Análisis Predictivo</label>
                <p className="text-xs text-gray-500">Predicciones de plagas y clima</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.predictive}
                  onChange={(e) => handlePreferenceChange('predictive', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Asistente Virtual</label>
                <p className="text-xs text-gray-500">Respuestas a consultas</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.rag_assistant}
                  onChange={(e) => handlePreferenceChange('rag_assistant', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Optimización</label>
                <p className="text-xs text-gray-500">Recomendaciones de mejora</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.optimization}
                  onChange={(e) => handlePreferenceChange('optimization', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Alertas Críticas</label>
                <p className="text-xs text-gray-500">Notificaciones de alta prioridad</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.critical}
                  onChange={(e) => handlePreferenceChange('critical', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm text-gray-700">Sistema</label>
                <p className="text-xs text-gray-500">Actualizaciones y mantenimiento</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.system}
                  onChange={(e) => handlePreferenceChange('system', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Token Info (for debugging) */}
      {status.token && process.env.NODE_ENV === 'development' && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <details>
            <summary className="text-xs text-gray-500 cursor-pointer">
              Token de Suscripción (Debug)
            </summary>
            <p className="text-xs text-gray-400 mt-2 break-all font-mono">
              {status.token}
            </p>
          </details>
        </div>
      )}
    </div>
  );
};

export default PushNotificationManager;
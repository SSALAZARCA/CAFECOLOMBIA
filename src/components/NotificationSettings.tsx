import React, { useState, useEffect } from 'react';
import { Bell, Smartphone, Globe, Shield, RefreshCw, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { usePushNotifications } from '../hooks/usePushNotifications';
import PushNotificationManager from './PushNotificationManager';

interface NotificationSettingsProps {
  className?: string;
  showAdvanced?: boolean;
}

export const NotificationSettings: React.FC<NotificationSettingsProps> = ({
  className = '',
  showAdvanced = false
}) => {
  const { state, actions } = usePushNotifications();
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    loadStats();
  }, [state.lastUpdate]);

  const loadStats = async () => {
    try {
      // Cargar estadísticas de notificaciones desde la base de datos
      const notificationStats = await actions.refreshStatus();
      // Aquí podrías cargar más estadísticas si es necesario
    } catch (error) {
      console.error('Failed to load notification stats:', error);
    }
  };

  const getStatusIcon = () => {
    if (!state.isSupported) {
      return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
    if (state.isSubscribed && state.hasPermission) {
      return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
    return <Info className="h-5 w-5 text-yellow-500" />;
  };

  const getStatusText = () => {
    if (!state.isSupported) {
      return 'No soportado en este navegador';
    }
    if (state.isSubscribed && state.hasPermission) {
      return 'Configurado correctamente';
    }
    if (state.hasPermission && !state.isSubscribed) {
      return 'Permisos concedidos, no suscrito';
    }
    if (!state.hasPermission) {
      return 'Permisos no concedidos';
    }
    return 'Estado desconocido';
  };

  const getBrowserInfo = () => {
    const userAgent = navigator.userAgent;
    let browser = 'Desconocido';
    
    if (userAgent.includes('Chrome')) browser = 'Chrome';
    else if (userAgent.includes('Firefox')) browser = 'Firefox';
    else if (userAgent.includes('Safari')) browser = 'Safari';
    else if (userAgent.includes('Edge')) browser = 'Edge';
    
    return {
      name: browser,
      supportsServiceWorker: 'serviceWorker' in navigator,
      supportsPushManager: 'PushManager' in window,
      supportsNotifications: 'Notification' in window,
      isSecureContext: window.isSecureContext
    };
  };

  const browserInfo = getBrowserInfo();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <Bell className="h-6 w-6 text-gray-600 mr-3" />
            <h2 className="text-xl font-semibold text-gray-900">
              Configuración de Notificaciones
            </h2>
          </div>
          <button
            onClick={actions.refreshStatus}
            disabled={state.isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${state.isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center space-x-3 mb-4">
          {getStatusIcon()}
          <span className="text-sm text-gray-600">{getStatusText()}</span>
        </div>

        {state.error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{state.error}</span>
              <button
                onClick={actions.clearError}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        <p className="text-sm text-gray-600">
          Las notificaciones push te permiten recibir alertas importantes sobre el análisis de IA, 
          detección de plagas, predicciones y recomendaciones de optimización, incluso cuando la 
          aplicación no está abierta.
        </p>
      </div>

      {/* Push Notification Manager */}
      <PushNotificationManager 
        showSettings={true}
        onPermissionChange={(granted) => {
          if (granted) {
            actions.refreshStatus();
          }
        }}
      />

      {/* Browser Compatibility */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
          <Globe className="h-5 w-5 mr-2" />
          Compatibilidad del Navegador
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Navegador:</span>
              <span className="text-sm font-medium">{browserInfo.name}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Service Worker:</span>
              <span className={`text-sm font-medium ${browserInfo.supportsServiceWorker ? 'text-green-600' : 'text-red-600'}`}>
                {browserInfo.supportsServiceWorker ? 'Soportado' : 'No soportado'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Push Manager:</span>
              <span className={`text-sm font-medium ${browserInfo.supportsPushManager ? 'text-green-600' : 'text-red-600'}`}>
                {browserInfo.supportsPushManager ? 'Soportado' : 'No soportado'}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Notificaciones:</span>
              <span className={`text-sm font-medium ${browserInfo.supportsNotifications ? 'text-green-600' : 'text-red-600'}`}>
                {browserInfo.supportsNotifications ? 'Soportado' : 'No soportado'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Contexto Seguro:</span>
              <span className={`text-sm font-medium ${browserInfo.isSecureContext ? 'text-green-600' : 'text-red-600'}`}>
                {browserInfo.isSecureContext ? 'HTTPS' : 'HTTP'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Estado de Permisos:</span>
              <span className={`text-sm font-medium ${
                Notification.permission === 'granted' ? 'text-green-600' : 
                Notification.permission === 'denied' ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {Notification.permission === 'granted' ? 'Concedidos' : 
                 Notification.permission === 'denied' ? 'Denegados' : 'Pendientes'}
              </span>
            </div>
          </div>
        </div>

        {!browserInfo.isSecureContext && (
          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-md p-3">
            <div className="flex items-center">
              <Shield className="h-4 w-4 text-yellow-600 mr-2" />
              <span className="text-yellow-800 text-sm">
                Las notificaciones push requieren HTTPS para funcionar correctamente.
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Advanced Settings */}
      {showAdvanced && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Smartphone className="h-5 w-5 mr-2" />
            Configuración Avanzada
          </h3>

          <div className="space-y-4">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-left p-3 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  Detalles Técnicos
                </span>
                <span className="text-gray-400">
                  {showDetails ? '−' : '+'}
                </span>
              </div>
            </button>

            {showDetails && (
              <div className="bg-gray-50 rounded-md p-4 space-y-2">
                <div className="text-xs text-gray-600 space-y-1">
                  <div><strong>Suscripción:</strong> {state.isSubscribed ? 'Activa' : 'Inactiva'}</div>
                  <div><strong>Token:</strong> {state.token ? `${state.token.substring(0, 20)}...` : 'No disponible'}</div>
                  <div><strong>Última actualización:</strong> {state.lastUpdate?.toLocaleString() || 'Nunca'}</div>
                  <div><strong>User Agent:</strong> {navigator.userAgent}</div>
                </div>
              </div>
            )}

            <div className="flex space-x-3">
              <button
                onClick={actions.sendTestNotification}
                disabled={!state.isSubscribed || state.isLoading}
                className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enviar Notificación de Prueba
              </button>

              <button
                onClick={actions.refreshStatus}
                disabled={state.isLoading}
                className="px-4 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Actualizar Estado
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Help Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-3">
          ¿Necesitas ayuda?
        </h3>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Si no recibes notificaciones:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Verifica que los permisos estén concedidos en tu navegador</li>
            <li>Asegúrate de que las notificaciones no estén bloqueadas en el sistema</li>
            <li>Comprueba que la aplicación esté ejecutándose en HTTPS</li>
            <li>Intenta desactivar y volver a activar las notificaciones</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;
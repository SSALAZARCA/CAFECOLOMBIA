import React, { useState } from 'react';
import { 
  Settings, 
  Download, 
  Trash2, 
  Bell, 
  BellOff, 
  Wifi, 
  WifiOff,
  RefreshCw,
  Database,
  Smartphone,
  Monitor,
  HardDrive,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { usePWA } from '../../hooks/usePWA';
import { formatBytes } from '../../utils/formatters';

interface PWASettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWASettings({ isOpen, onClose }: PWASettingsProps) {
  const { status, actions } = usePWA();
  const [isClearing, setIsClearing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleClearCache = async () => {
    setIsClearing(true);
    try {
      await actions.clearCache();
      alert('Cache limpiado exitosamente');
    } catch (error) {
      alert('Error al limpiar cache');
    } finally {
      setIsClearing(false);
    }
  };

  const handleClearOfflineData = async () => {
    if (confirm('¿Estás seguro de que quieres eliminar todos los datos offline? Esta acción no se puede deshacer.')) {
      setIsClearing(true);
      try {
        await actions.clearOfflineData();
        alert('Datos offline eliminados exitosamente');
      } catch (error) {
        alert('Error al eliminar datos offline');
      } finally {
        setIsClearing(false);
      }
    }
  };

  const handleForceSync = async () => {
    setIsSyncing(true);
    try {
      await actions.forceSync();
      alert('Sincronización completada');
    } catch (error) {
      alert('Error en la sincronización');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRequestNotifications = async () => {
    try {
      await actions.requestNotificationPermission();
    } catch (error) {
      alert('Error al solicitar permisos de notificación');
    }
  };

  const formatLastSync = (timestamp: number | null) => {
    if (!timestamp) return 'Nunca';
    const date = new Date(timestamp);
    return date.toLocaleString('es-ES');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">
                Configuración PWA
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Status Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                {status.isOnline ? (
                  <Wifi className="w-5 h-5 text-green-500" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {status.isOnline ? 'En línea' : 'Sin conexión'}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Calidad: {status.connectionQuality}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Database className="w-5 h-5 text-blue-500" />
                <span className="font-medium">Cache</span>
              </div>
              <p className="text-sm text-gray-600">
                {formatBytes(status.cacheSize)}
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <RefreshCw className="w-5 h-5 text-orange-500" />
                <span className="font-medium">Sincronización</span>
              </div>
              <p className="text-sm text-gray-600">
                {status.pendingSyncCount} elementos pendientes
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <span className="font-medium">Última sync</span>
              </div>
              <p className="text-sm text-gray-600">
                {formatLastSync(status.lastSyncTime)}
              </p>
            </div>
          </div>

          {/* Installation Status */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Estado de Instalación
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                {status.isInstalled ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-700 font-medium">
                      App instalada
                    </span>
                  </>
                ) : status.canInstall ? (
                  <>
                    <Download className="w-5 h-5 text-blue-500" />
                    <span className="text-blue-700 font-medium">
                      Disponible para instalar
                    </span>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-gray-500" />
                    <span className="text-gray-700 font-medium">
                      No disponible para instalar
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Plataforma: {status.platform}
              </p>
            </div>
          </div>

          {/* Notifications */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Notificaciones
            </h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {status.notificationPermission === 'granted' ? (
                    <Bell className="w-5 h-5 text-green-500" />
                  ) : (
                    <BellOff className="w-5 h-5 text-gray-500" />
                  )}
                  <span className="font-medium">
                    Estado: {status.notificationPermission === 'granted' ? 'Activadas' : 'Desactivadas'}
                  </span>
                </div>
                {status.notificationPermission !== 'granted' && (
                  <button
                    onClick={handleRequestNotifications}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    Activar
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">
              Acciones
            </h3>

            {/* Force Sync */}
            <button
              onClick={handleForceSync}
              disabled={isSyncing || !status.isOnline}
              className="w-full flex items-center gap-3 p-3 bg-blue-50 hover:bg-blue-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>
                {isSyncing ? 'Sincronizando...' : 'Forzar Sincronización'}
              </span>
            </button>

            {/* Clear Cache */}
            <button
              onClick={handleClearCache}
              disabled={isClearing}
              className="w-full flex items-center gap-3 p-3 bg-orange-50 hover:bg-orange-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors"
            >
              <HardDrive className="w-5 h-5" />
              <span>
                {isClearing ? 'Limpiando...' : 'Limpiar Cache'}
              </span>
            </button>

            {/* Clear Offline Data */}
            <button
              onClick={handleClearOfflineData}
              disabled={isClearing}
              className="w-full flex items-center gap-3 p-3 bg-red-50 hover:bg-red-100 disabled:bg-gray-100 disabled:text-gray-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span>
                {isClearing ? 'Eliminando...' : 'Eliminar Datos Offline'}
              </span>
            </button>
          </div>

          {/* Close Button */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
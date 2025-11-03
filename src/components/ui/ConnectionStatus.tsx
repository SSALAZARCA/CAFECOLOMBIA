import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { syncManager, SyncProgress } from '../../utils/syncManager';

interface ConnectionStatusProps {
  showDetails?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ 
  showDetails = false, 
  className = '' 
}) => {
  const { 
    isOnline, 
    isConnecting, 
    connectionQuality, 
    pendingSyncCount, 
    lastOnline,
    checkConnection,
    forcSync 
  } = useOnlineStatus();

  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);
  const [showSyncDetails, setShowSyncDetails] = useState(false);
  const [isManualSync, setIsManualSync] = useState(false);

  useEffect(() => {
    const unsubscribe = syncManager.onSyncProgress((progress) => {
      setSyncProgress(progress);
      if (progress.percentage === 100) {
        setTimeout(() => setSyncProgress(null), 2000);
      }
    });

    return unsubscribe;
  }, []);

  const handleManualSync = async () => {
    if (!isOnline || isManualSync) return;
    
    setIsManualSync(true);
    try {
      await forcSync();
    } catch (error) {
      console.error('Manual sync failed:', error);
    } finally {
      setIsManualSync(false);
    }
  };

  const handleCheckConnection = async () => {
    await checkConnection();
  };

  const getStatusIcon = () => {
    if (isConnecting || isManualSync) {
      return <RefreshCw className="w-4 h-4 animate-spin" />;
    }
    
    if (!isOnline) {
      return <WifiOff className="w-4 h-4" />;
    }
    
    switch (connectionQuality) {
      case 'good':
        return <Wifi className="w-4 h-4" />;
      case 'poor':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusColor = () => {
    if (isConnecting || isManualSync) {
      return 'text-blue-500';
    }
    
    if (!isOnline) {
      return 'text-red-500';
    }
    
    switch (connectionQuality) {
      case 'good':
        return 'text-green-500';
      case 'poor':
        return 'text-yellow-500';
      default:
        return 'text-red-500';
    }
  };

  const getStatusText = () => {
    if (isConnecting) return 'Conectando...';
    if (isManualSync) return 'Sincronizando...';
    if (!isOnline) return 'Sin conexión';
    
    switch (connectionQuality) {
      case 'good':
        return 'Conectado';
      case 'poor':
        return 'Conexión lenta';
      default:
        return 'Sin conexión';
    }
  };

  const formatLastOnline = (date: Date | null) => {
    if (!date) return 'Nunca';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    return `Hace ${days}d`;
  };

  if (!showDetails) {
    // Vista compacta para la barra de estado
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`${getStatusColor()}`}>
          {getStatusIcon()}
        </div>
        {pendingSyncCount > 0 && (
          <div className="flex items-center space-x-1 text-orange-500">
            <Clock className="w-3 h-3" />
            <span className="text-xs">{pendingSyncCount}</span>
          </div>
        )}
      </div>
    );
  }

  // Vista detallada
  return (
    <div className={`bg-white rounded-lg shadow-sm border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className={`${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <div>
            <h3 className="font-medium text-gray-900">{getStatusText()}</h3>
            <p className="text-sm text-gray-500">
              Última conexión: {formatLastOnline(lastOnline)}
            </p>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <button
            onClick={handleCheckConnection}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            title="Verificar conexión"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          
          {isOnline && pendingSyncCount > 0 && (
            <button
              onClick={handleManualSync}
              disabled={isManualSync}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
            >
              {isManualSync ? 'Sincronizando...' : 'Sincronizar'}
            </button>
          )}
        </div>
      </div>

      {/* Información de sincronización */}
      {pendingSyncCount > 0 && (
        <div className="mb-3 p-3 bg-orange-50 rounded-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-orange-500" />
              <span className="text-sm text-orange-700">
                {pendingSyncCount} elemento{pendingSyncCount !== 1 ? 's' : ''} pendiente{pendingSyncCount !== 1 ? 's' : ''} de sincronizar
              </span>
            </div>
            <button
              onClick={() => setShowSyncDetails(!showSyncDetails)}
              className="text-xs text-orange-600 hover:text-orange-800"
            >
              {showSyncDetails ? 'Ocultar' : 'Ver detalles'}
            </button>
          </div>
          
          {showSyncDetails && (
            <div className="mt-2 text-xs text-orange-600">
              Los datos se sincronizarán automáticamente cuando se restaure la conexión.
            </div>
          )}
        </div>
      )}

      {/* Progreso de sincronización */}
      {syncProgress && (
        <div className="mb-3 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center space-x-2 mb-2">
            <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
            <span className="text-sm text-blue-700">Sincronizando datos...</span>
          </div>
          
          <div className="w-full bg-blue-200 rounded-full h-2 mb-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${syncProgress.percentage}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-blue-600">
            <span>{syncProgress.current}</span>
            <span>{syncProgress.completed}/{syncProgress.total}</span>
          </div>
        </div>
      )}

      {/* Estado de conexión detallado */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-gray-500">Estado:</span>
          <span className={`ml-2 font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>
        
        <div>
          <span className="text-gray-500">Calidad:</span>
          <span className={`ml-2 font-medium ${getStatusColor()}`}>
            {connectionQuality === 'good' ? 'Buena' : 
             connectionQuality === 'poor' ? 'Lenta' : 'Sin conexión'}
          </span>
        </div>
      </div>

      {/* Consejos para modo offline */}
      {!isOnline && (
        <div className="mt-3 p-3 bg-gray-50 rounded-md">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5" />
            <div className="text-xs text-gray-600">
              <p className="font-medium mb-1">Trabajando sin conexión</p>
              <p>Puedes seguir usando la aplicación. Los datos se sincronizarán automáticamente cuando recuperes la conexión.</p>
            </div>
          </div>
        </div>
      )}

      {/* Indicador de sincronización exitosa */}
      {isOnline && pendingSyncCount === 0 && (
        <div className="mt-3 flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="text-sm">Todos los datos están sincronizados</span>
        </div>
      )}
    </div>
  );
};
import React from 'react';
import { AlertCircle, CheckCircle, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { useBackendConnection } from '../services/backendConnectionService';
import { cn } from '../lib/utils';

interface BackendConnectionStatusProps {
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const BackendConnectionStatus: React.FC<BackendConnectionStatusProps> = ({
  className,
  showDetails = false,
  compact = false
}) => {
  const { isConnected, lastChecked, retryCount, error, checkHealth, isAvailable } = useBackendConnection();

  const getStatusColor = () => {
    if (isConnected) return 'text-green-600';
    if (retryCount > 0) return 'text-red-600';
    return 'text-yellow-600';
  };

  const getStatusIcon = () => {
    if (isConnected) return <CheckCircle className="w-4 h-4" />;
    if (retryCount > 0) return <AlertCircle className="w-4 h-4" />;
    return <RefreshCw className="w-4 h-4 animate-spin" />;
  };

  const getStatusText = () => {
    if (isConnected) return 'Conectado';
    if (retryCount > 0) return `Error (${retryCount} intentos)`;
    return 'Conectando...';
  };

  const handleRetry = () => {
    checkHealth();
  };

  if (compact) {
    return (
      <div className={cn(
        "flex items-center gap-2 px-2 py-1 rounded-md text-sm",
        getStatusColor(),
        className
      )}>
        {getStatusIcon()}
        <span>{getStatusText()}</span>
      </div>
    );
  }

  return (
    <div className={cn(
      "flex items-center justify-between p-3 rounded-lg border",
      isConnected ? "bg-green-50 border-green-200" : "bg-red-50 border-red-200",
      className
    )}>
      <div className="flex items-center gap-3">
        <div className={cn("flex items-center gap-2", getStatusColor())}>
          {getStatusIcon()}
          <span className="font-medium">{getStatusText()}</span>
        </div>
        
        {showDetails && (
          <div className="text-sm text-gray-600">
            <div>Última verificación: {lastChecked.toLocaleTimeString()}</div>
            {error && (
              <div className="text-red-600 mt-1">
                Error: {error}
              </div>
            )}
          </div>
        )}
      </div>

      {!isConnected && (
        <button
          onClick={handleRetry}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Reintentar
        </button>
      )}
    </div>
  );
};

// Componente para mostrar en la barra de estado
export const BackendStatusIndicator: React.FC = () => {
  const { isConnected, retryCount } = useBackendConnection();

  return (
    <div className="flex items-center gap-1 text-xs">
      {isConnected ? (
        <>
          <Wifi className="w-3 h-3 text-green-600" />
          <span className="text-green-600">Online</span>
        </>
      ) : (
        <>
          <WifiOff className="w-3 h-3 text-red-600" />
          <span className="text-red-600">
            Offline {retryCount > 0 && `(${retryCount})`}
          </span>
        </>
      )}
    </div>
  );
};

export default BackendConnectionStatus;
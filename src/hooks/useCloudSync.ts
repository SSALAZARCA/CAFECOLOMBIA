import { useState, useEffect, useCallback, useRef } from 'react';
import { cloudSyncService, SyncStatus, CloudSyncResult } from '../services/cloudSync';

export interface UseCloudSyncOptions {
  autoSync?: boolean;
  syncInterval?: number; // en milisegundos
  retryAttempts?: number;
  onSyncComplete?: (result: CloudSyncResult) => void;
  onSyncError?: (error: Error) => void;
  onStatusChange?: (status: SyncStatus) => void;
}

export interface UseCloudSyncReturn {
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  isOnline: boolean;
  isSyncing: boolean;
  syncProgress: number;
  pendingItems: number;
  error: string | null;
  syncNow: () => Promise<void>;
  pauseSync: () => void;
  resumeSync: () => void;
  clearError: () => void;
  getSyncStats: () => SyncStats;
}

export interface SyncStats {
  totalSynced: number;
  totalFailed: number;
  imagesUploaded: number;
  analysisResultsSynced: number;
  notificationsSynced: number;
  lastSuccessfulSync: Date | null;
  averageSyncTime: number;
}

export const useCloudSync = (
  options: UseCloudSyncOptions = {}
): UseCloudSyncReturn => {
  const {
    autoSync = true,
    syncInterval = 300000, // 5 minutos
    retryAttempts = 3,
    onSyncComplete,
    onSyncError,
    onStatusChange
  } = options;

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [pendingItems, setPendingItems] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats>({
    totalSynced: 0,
    totalFailed: 0,
    imagesUploaded: 0,
    analysisResultsSynced: 0,
    notificationsSynced: 0,
    lastSuccessfulSync: null,
    averageSyncTime: 0
  });

  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const syncStartTimeRef = useRef<Date | null>(null);

  // Monitorear estado de conexión
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (autoSync && syncStatus === 'idle') {
        syncNow();
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [autoSync, syncStatus]);

  // Obtener estadísticas de elementos pendientes
  const updatePendingItems = useCallback(async () => {
    try {
      // Simular conteo de elementos pendientes
      // En una implementación real, esto consultaría la base de datos local
      const pending = Math.floor(Math.random() * 10); // Simulación
      setPendingItems(pending);
    } catch (err) {
      console.error('Error updating pending items:', err);
    }
  }, []);

  // Ejecutar sincronización
  const syncNow = useCallback(async () => {
    if (!isOnline) {
      setError('No internet connection available');
      return;
    }

    if (isSyncing) {
      return; // Ya hay una sincronización en progreso
    }

    try {
      setIsSyncing(true);
      setSyncProgress(0);
      setError(null);
      setSyncStatus('syncing');
      syncStartTimeRef.current = new Date();
      retryCountRef.current = 0;

      onStatusChange?.('syncing');

      // Sincronizar imágenes
      setSyncProgress(10);
      const imageResult = await cloudSyncService.syncAIImages();
      
      // Sincronizar resultados de análisis
      setSyncProgress(40);
      const analysisResult = await cloudSyncService.syncAIAnalysisResults();
      
      // Sincronizar notificaciones
      setSyncProgress(70);
      const notificationResult = await cloudSyncService.syncNotifications();

      setSyncProgress(100);

      // Consolidar resultados
      const totalSynced = imageResult.synced + analysisResult.synced + notificationResult.synced;
      const totalFailed = imageResult.failed + analysisResult.failed + notificationResult.failed;

      const syncResult: CloudSyncResult = {
        success: totalFailed === 0,
        synced: totalSynced,
        failed: totalFailed,
        errors: [
          ...imageResult.errors,
          ...analysisResult.errors,
          ...notificationResult.errors
        ]
      };

      // Actualizar estadísticas
      const syncEndTime = new Date();
      const syncDuration = syncEndTime.getTime() - (syncStartTimeRef.current?.getTime() || 0);
      
      setSyncStats(prev => ({
        ...prev,
        totalSynced: prev.totalSynced + totalSynced,
        totalFailed: prev.totalFailed + totalFailed,
        imagesUploaded: prev.imagesUploaded + imageResult.synced,
        analysisResultsSynced: prev.analysisResultsSynced + analysisResult.synced,
        notificationsSynced: prev.notificationsSynced + notificationResult.synced,
        lastSuccessfulSync: syncResult.success ? syncEndTime : prev.lastSuccessfulSync,
        averageSyncTime: prev.averageSyncTime > 0 
          ? (prev.averageSyncTime + syncDuration) / 2 
          : syncDuration
      }));

      setLastSyncTime(syncEndTime);
      setSyncStatus(syncResult.success ? 'success' : 'error');
      
      if (syncResult.success) {
        onSyncComplete?.(syncResult);
        onStatusChange?.('success');
      } else {
        const errorMsg = syncResult.errors.join(', ') || 'Sync failed';
        setError(errorMsg);
        onSyncError?.(new Error(errorMsg));
        onStatusChange?.('error');
      }

      await updatePendingItems();

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Sync failed';
      setError(errorMsg);
      setSyncStatus('error');
      onSyncError?.(err instanceof Error ? err : new Error(errorMsg));
      onStatusChange?.('error');

      // Reintentar si no se han agotado los intentos
      if (retryCountRef.current < retryAttempts) {
        retryCountRef.current++;
        setTimeout(() => {
          if (isOnline) {
            syncNow();
          }
        }, Math.pow(2, retryCountRef.current) * 1000); // Backoff exponencial
      }
    } finally {
      setIsSyncing(false);
      setSyncProgress(0);
    }
  }, [isOnline, isSyncing, retryAttempts, onSyncComplete, onSyncError, onStatusChange, updatePendingItems]);

  // Pausar sincronización automática
  const pauseSync = useCallback(() => {
    if (syncIntervalRef.current) {
      clearInterval(syncIntervalRef.current);
      syncIntervalRef.current = null;
    }
    setSyncStatus('paused');
    onStatusChange?.('paused');
  }, [onStatusChange]);

  // Reanudar sincronización automática
  const resumeSync = useCallback(() => {
    if (autoSync && isOnline) {
      setSyncStatus('idle');
      onStatusChange?.('idle');
      
      // Configurar intervalo de sincronización
      if (syncInterval > 0) {
        syncIntervalRef.current = setInterval(() => {
          if (isOnline && !isSyncing) {
            syncNow();
          }
        }, syncInterval);
      }
    }
  }, [autoSync, isOnline, syncInterval, isSyncing, syncNow, onStatusChange]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
    if (syncStatus === 'error') {
      setSyncStatus('idle');
      onStatusChange?.('idle');
    }
  }, [syncStatus, onStatusChange]);

  // Obtener estadísticas
  const getSyncStats = useCallback(() => syncStats, [syncStats]);

  // Configurar sincronización automática
  useEffect(() => {
    if (autoSync && isOnline && syncInterval > 0) {
      setSyncStatus('idle');
      onStatusChange?.('idle');
      
      // Configurar intervalo de sincronización
      if (syncInterval > 0) {
        syncIntervalRef.current = setInterval(() => {
          if (isOnline && !isSyncing) {
            syncNow();
          }
        }, syncInterval);
      }
    }

    return () => {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [autoSync, isOnline, syncInterval, isSyncing, syncNow, onStatusChange]);

  // Actualizar elementos pendientes al montar
  useEffect(() => {
    updatePendingItems();
  }, [updatePendingItems]);

  // Sincronización inicial si está habilitada
  useEffect(() => {
    if (autoSync && isOnline && syncStatus === 'idle' && pendingItems > 0) {
      // Esperar un poco antes de la sincronización inicial
      const timeout = setTimeout(() => {
        syncNow();
      }, 2000);

      return () => clearTimeout(timeout);
    }
  }, [autoSync, isOnline, syncStatus, pendingItems, syncNow]);

  return {
    syncStatus,
    lastSyncTime,
    isOnline,
    isSyncing,
    syncProgress,
    pendingItems,
    error,
    syncNow,
    pauseSync,
    resumeSync,
    clearError,
    getSyncStats
  };
};

// Hook especializado para sincronización de imágenes
export const useImageSync = () => {
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({});

  const uploadImage = useCallback(async (
    imageId: string,
    imageBlob: Blob,
    metadata?: Record<string, any>
  ) => {
    try {
      setUploadProgress(prev => ({ ...prev, [imageId]: 0 }));
      setUploadErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[imageId];
        return newErrors;
      });

      // Simular progreso de subida
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => ({
          ...prev,
          [imageId]: Math.min((prev[imageId] || 0) + 10, 90)
        }));
      }, 200);

      // Simular subida (en implementación real, usar cloudSyncService)
      await new Promise(resolve => setTimeout(resolve, 2000));

      clearInterval(progressInterval);
      setUploadProgress(prev => ({ ...prev, [imageId]: 100 }));

      // Limpiar progreso después de un tiempo
      setTimeout(() => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          delete newProgress[imageId];
          return newProgress;
        });
      }, 3000);

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Upload failed';
      setUploadErrors(prev => ({ ...prev, [imageId]: errorMsg }));
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[imageId];
        return newProgress;
      });
    }
  }, []);

  return {
    uploadProgress,
    uploadErrors,
    uploadImage
  };
};

// Hook para monitorear el estado de conectividad
export const useConnectivity = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');
  const [connectionSpeed, setConnectionSpeed] = useState<string>('unknown');

  useEffect(() => {
    const updateConnectionInfo = () => {
      setIsOnline(navigator.onLine);
      
      // Obtener información de conexión si está disponible
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        setConnectionType(connection.effectiveType || 'unknown');
        setConnectionSpeed(connection.downlink ? `${connection.downlink} Mbps` : 'unknown');
      }
    };

    const handleOnline = () => updateConnectionInfo();
    const handleOffline = () => updateConnectionInfo();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Actualizar información inicial
    updateConnectionInfo();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    connectionType,
    connectionSpeed
  };
};
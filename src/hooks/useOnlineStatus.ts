import { useState, useEffect, useCallback } from 'react';
import { offlineDB } from '../utils/offlineDB';

export interface OnlineStatus {
  isOnline: boolean;
  isConnecting: boolean;
  lastOnline: Date | null;
  connectionQuality: 'good' | 'poor' | 'offline';
  pendingSyncCount: number;
}

export const useOnlineStatus = () => {
  const [status, setStatus] = useState<OnlineStatus>({
    isOnline: navigator.onLine,
    isConnecting: false,
    lastOnline: navigator.onLine ? new Date() : null,
    connectionQuality: navigator.onLine ? 'good' : 'offline',
    pendingSyncCount: 0
  });

  // Verificar calidad de conexión
  const checkConnectionQuality = useCallback(async () => {
    if (!navigator.onLine) {
      return 'offline';
    }

    const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    
    // In development mode, use a simple connection check without external requests
    if (isDevelopment) {
      // Use navigator.connection API if available for better quality assessment
      const connection = (navigator as any).connection || 
                        (navigator as any).mozConnection || 
                        (navigator as any).webkitConnection;
      
      if (connection) {
        const effectiveType = connection.effectiveType;
        if (effectiveType === '4g' || effectiveType === '3g') {
          return 'good';
        } else if (effectiveType === '2g' || effectiveType === 'slow-2g') {
          return 'poor';
        }
      }
      
      // Fallback: assume good connection if navigator.onLine is true
      return navigator.onLine ? 'good' : 'offline';
    }

    // In production, try to ping the API (use lightweight ping endpoint)
    try {
      const start = Date.now();
      const response = await fetch('/api/ping', { cache: 'no-store' });
      const duration = Date.now() - start;

      const fromFallback = response.headers.get('X-From-Fallback') === 'true';
      if (response.ok && !fromFallback) {
        return duration < 1000 ? 'good' : 'poor';
      }
      if (fromFallback) {
        return 'offline';
      }
      return response.ok ? 'poor' : 'offline';
    } catch (error) {
      return 'offline';
    }
  }, []);

  // Actualizar contador de elementos pendientes de sincronización
  const updatePendingSyncCount = useCallback(async () => {
    try {
      const pendingItems = await offlineDB.getPendingSyncItems();
      setStatus(prev => ({
        ...prev,
        pendingSyncCount: pendingItems.length
      }));
    } catch (error) {
      console.error('Error updating pending sync count:', error);
    }
  }, []);

  // Manejar cambio de estado online
  const handleOnline = useCallback(async () => {
    setStatus(prev => ({
      ...prev,
      isOnline: true,
      isConnecting: true,
      lastOnline: new Date()
    }));

    const quality = await checkConnectionQuality();
    
    setStatus(prev => ({
      ...prev,
      isConnecting: false,
      connectionQuality: quality
    }));

    // Actualizar contador de sincronización
    await updatePendingSyncCount();

    // Disparar evento personalizado para sincronización
    window.dispatchEvent(new CustomEvent('connection-restored'));
  }, [checkConnectionQuality, updatePendingSyncCount]);

  // Manejar cambio de estado offline
  const handleOffline = useCallback(async () => {
    setStatus(prev => ({
      ...prev,
      isOnline: false,
      isConnecting: false,
      connectionQuality: 'offline'
    }));

    // Actualizar contador de sincronización
    await updatePendingSyncCount();

    // Disparar evento personalizado para modo offline
    window.dispatchEvent(new CustomEvent('connection-lost'));
  }, [updatePendingSyncCount]);

  // Verificar conexión manualmente
  const checkConnection = useCallback(async () => {
    setStatus(prev => ({ ...prev, isConnecting: true }));
    
    const quality = await checkConnectionQuality();
    const isOnline = quality !== 'offline';
    
    setStatus(prev => ({
      ...prev,
      isOnline,
      isConnecting: false,
      connectionQuality: quality,
      lastOnline: isOnline ? new Date() : prev.lastOnline
    }));

    await updatePendingSyncCount();
    
    return { isOnline, quality };
  }, [checkConnectionQuality, updatePendingSyncCount]);

  // Forzar sincronización
  const forcSync = useCallback(async () => {
    if (!status.isOnline) {
      throw new Error('No hay conexión disponible para sincronizar');
    }

    window.dispatchEvent(new CustomEvent('force-sync'));
    await updatePendingSyncCount();
  }, [status.isOnline, updatePendingSyncCount]);

  useEffect(() => {
    // Listeners para eventos de conexión
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verificar estado inicial
    if (navigator.onLine) {
      checkConnectionQuality().then(quality => {
        setStatus(prev => ({
          ...prev,
          connectionQuality: quality
        }));
      });
    }

    // Actualizar contador inicial
    updatePendingSyncCount();

    // Verificar conexión periódicamente
    const intervalId = setInterval(async () => {
      if (navigator.onLine) {
        const quality = await checkConnectionQuality();
        setStatus(prev => ({
          ...prev,
          connectionQuality: quality
        }));
      }
      await updatePendingSyncCount();
    }, 30000); // Cada 30 segundos

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
    };
  }, [handleOnline, handleOffline, checkConnectionQuality, updatePendingSyncCount]);

  return {
    ...status,
    checkConnection,
    forcSync,
    updatePendingSyncCount
  };
};

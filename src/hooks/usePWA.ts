import { useState, useEffect, useCallback } from 'react';
import { useOnlineStatus } from './useOnlineStatus';
import { syncManager, SyncResult, SyncProgress } from '../utils/syncManager';
import { notificationManager } from '../utils/notificationManager';
import { offlineDB } from '../utils/offlineDB';

export interface PWAStatus {
  isInstalled: boolean;
  canInstall: boolean;
  isOnline: boolean;
  issyncing: boolean;
  pendingSyncCount: number;
  notificationsEnabled: boolean;
  cacheSize: number;
  lastSync: Date | null;
}

export interface PWAActions {
  requestNotificationPermission: () => Promise<NotificationPermission>;
  forcSync: () => Promise<SyncResult>;
  clearCache: () => Promise<void>;
  clearOfflineData: () => Promise<void>;
  exportOfflineData: () => Promise<Blob>;
  importOfflineData: (file: File) => Promise<void>;
}

export const usePWA = () => {
  const onlineStatus = useOnlineStatus();
  
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    isInstalled: false,
    canInstall: false,
    isOnline: onlineStatus.isOnline,
    issyncing: false,
    pendingSyncCount: onlineStatus.pendingSyncCount,
    notificationsEnabled: false,
    cacheSize: 0,
    lastSync: null
  });

  const [syncProgress, setSyncProgress] = useState<SyncProgress | null>(null);

  // Actualizar estado PWA
  const updatePWAStatus = useCallback(async () => {
    try {
      const [
        cacheSize,
        lastSync,
        syncStatus,
        notificationSettings
      ] = await Promise.all([
        offlineDB.getCacheSize(),
        offlineDB.getSetting('lastSyncTime'),
        syncManager.getSyncStatus(),
        notificationManager.getUserSettings()
      ]);

      setPwaStatus(prev => ({
        ...prev,
        isOnline: onlineStatus.isOnline,
        pendingSyncCount: onlineStatus.pendingSyncCount,
        issyncing: syncStatus.issyncing,
        cacheSize,
        lastSync: lastSync ? new Date(lastSync) : null,
        notificationsEnabled: notificationSettings.enabled
      }));
    } catch (error) {
      console.error('[usePWA] Error updating PWA status:', error);
    }
  }, [onlineStatus.isOnline, onlineStatus.pendingSyncCount]);

  // Detectar instalación PWA
  useEffect(() => {
    // Verificar si está instalado
    const isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                       (window.navigator as any).standalone === true;
    
    setPwaStatus(prev => ({ ...prev, isInstalled }));

    // Escuchar evento de instalación
    const handleBeforeInstallPrompt = () => {
      setPwaStatus(prev => ({ ...prev, canInstall: true }));
    };

    const handleAppInstalled = () => {
      setPwaStatus(prev => ({ 
        ...prev, 
        isInstalled: true, 
        canInstall: false 
      }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Escuchar progreso de sincronización
  useEffect(() => {
    const unsubscribe = syncManager.onSyncProgress((progress) => {
      setSyncProgress(progress);
      if (progress.percentage === 100) {
        setTimeout(() => setSyncProgress(null), 2000);
        updatePWAStatus();
      }
    });

    return unsubscribe;
  }, [updatePWAStatus]);

  // Actualizar estado periódicamente
  useEffect(() => {
    updatePWAStatus();
    
    const interval = setInterval(updatePWAStatus, 30000); // Cada 30 segundos
    
    return () => clearInterval(interval);
  }, [updatePWAStatus]);

  // Acciones PWA
  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    const permission = await notificationManager.requestPermission();
    await updatePWAStatus();
    return permission;
  }, [updatePWAStatus]);

  const forcSync = useCallback(async (): Promise<SyncResult> => {
    if (!onlineStatus.isOnline) {
      throw new Error('Sin conexión a internet');
    }

    const result = await syncManager.syncAll();
    await updatePWAStatus();
    
    // Mostrar notificación de resultado
    await notificationManager.showSyncComplete(result);
    
    return result;
  }, [onlineStatus.isOnline, updatePWAStatus]);

  const clearCache = useCallback(async (): Promise<void> => {
    try {
      // Limpiar cache del navegador
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // Limpiar metadatos de cache en IndexedDB
      await offlineDB.cacheMetadata.clear();
      
      await updatePWAStatus();
      console.log('[usePWA] Cache cleared successfully');
    } catch (error) {
      console.error('[usePWA] Error clearing cache:', error);
      throw error;
    }
  }, [updatePWAStatus]);

  const clearOfflineData = useCallback(async (): Promise<void> => {
    try {
      // Limpiar todas las tablas de datos
      await Promise.all([
        offlineDB.lots.clear(),
        offlineDB.inventory.clear(),
        offlineDB.tasks.clear(),
        offlineDB.pestMonitoring.clear(),
        offlineDB.harvests.clear(),
        offlineDB.expenses.clear(),
        offlineDB.syncQueue.clear()
      ]);

      await updatePWAStatus();
      console.log('[usePWA] Offline data cleared successfully');
    } catch (error) {
      console.error('[usePWA] Error clearing offline data:', error);
      throw error;
    }
  }, [updatePWAStatus]);

  const exportOfflineData = useCallback(async (): Promise<Blob> => {
    try {
      const data = {
        lots: await offlineDB.lots.toArray(),
        inventory: await offlineDB.inventory.toArray(),
        tasks: await offlineDB.tasks.toArray(),
        pestMonitoring: await offlineDB.pestMonitoring.toArray(),
        harvests: await offlineDB.harvests.toArray(),
        expenses: await offlineDB.expenses.toArray(),
        settings: await offlineDB.settings.toArray(),
        exportDate: new Date().toISOString(),
        version: '1.0.0'
      };

      const jsonString = JSON.stringify(data, null, 2);
      return new Blob([jsonString], { type: 'application/json' });
    } catch (error) {
      console.error('[usePWA] Error exporting offline data:', error);
      throw error;
    }
  }, []);

  const importOfflineData = useCallback(async (file: File): Promise<void> => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      // Validar estructura de datos
      if (!data.version || !data.exportDate) {
        throw new Error('Formato de archivo inválido');
      }

      // Limpiar datos existentes
      await clearOfflineData();

      // Importar datos
      if (data.lots?.length) await offlineDB.lots.bulkAdd(data.lots);
      if (data.inventory?.length) await offlineDB.inventory.bulkAdd(data.inventory);
      if (data.tasks?.length) await offlineDB.tasks.bulkAdd(data.tasks);
      if (data.pestMonitoring?.length) await offlineDB.pestMonitoring.bulkAdd(data.pestMonitoring);
      if (data.harvests?.length) await offlineDB.harvests.bulkAdd(data.harvests);
      if (data.expenses?.length) await offlineDB.expenses.bulkAdd(data.expenses);
      if (data.settings?.length) await offlineDB.settings.bulkAdd(data.settings);

      await updatePWAStatus();
      console.log('[usePWA] Offline data imported successfully');
    } catch (error) {
      console.error('[usePWA] Error importing offline data:', error);
      throw error;
    }
  }, [clearOfflineData, updatePWAStatus]);

  // Estadísticas PWA
  const getOfflineStats = useCallback(async () => {
    return await offlineDB.getOfflineStats();
  }, []);

  // Limpiar datos antiguos
  const cleanupOldData = useCallback(async (maxAge?: number) => {
    return await offlineDB.cleanupOldData(maxAge);
  }, []);

  // Configurar notificaciones automáticas
  useEffect(() => {
    const setupNotifications = async () => {
      if (!notificationManager.hasPermission()) return;

      // Configurar manejadores de eventos
      notificationManager.setupEventHandlers();

      // Limpiar notificaciones antiguas
      await notificationManager.clearOldNotifications();
    };

    setupNotifications();
  }, [pwaStatus.notificationsEnabled]);

  const actions: PWAActions = {
    requestNotificationPermission,
    forcSync,
    clearCache,
    clearOfflineData,
    exportOfflineData,
    importOfflineData
  };

  return {
    status: pwaStatus,
    syncProgress,
    actions,
    getOfflineStats,
    cleanupOldData,
    onlineStatus
  };
};
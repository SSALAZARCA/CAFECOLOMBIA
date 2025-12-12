import { offlineDB } from '../utils/offlineDB';
import { AIAnalysisRequest, AIAnalysisResult, AINotification } from './aiService';
import { apiClient, ApiResponse } from './apiClient';
import { appConfig } from '../config';

export interface CloudSyncConfig {
  apiBaseUrl: string;
  apiKey: string;
  enableAutoSync: boolean;
  syncInterval: number; // en minutos
  maxRetries: number;
  batchSize: number;
}

export interface SyncStatus {
  lastSync: string;
  pendingUploads: number;
  pendingDownloads: number;
  failedOperations: number;
  isOnline: boolean;
  isSyncing: boolean;
}

export interface CloudSyncResult {
  success: boolean;
  uploaded: number;
  downloaded: number;
  failed: number;
  errors: string[];
}

export class CloudSyncService {
  private static instance: CloudSyncService;
  private config: CloudSyncConfig;
  private isOnline: boolean = navigator.onLine;
  private isSyncing: boolean = false;
  private syncInterval: NodeJS.Timeout | null = null;
  private retryQueue: Map<string, number> = new Map();

  private constructor(config: CloudSyncConfig) {
    this.config = config;
    this.setupConnectivityListeners();
    this.startAutoSync();
  }

  public static getInstance(config?: CloudSyncConfig): CloudSyncService {
    if (!CloudSyncService.instance && config) {
      CloudSyncService.instance = new CloudSyncService(config);
    }
    return CloudSyncService.instance;
  }

  private setupConnectivityListeners(): void {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.syncData();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  private startAutoSync(): void {
    if (this.config.enableAutoSync && this.config.syncInterval > 0) {
      this.syncInterval = setInterval(() => {
        if (this.isOnline && !this.isSyncing) {
          this.syncData();
        }
      }, this.config.syncInterval * 60 * 1000);
    }
  }

  // Sincronización principal
  async syncData(): Promise<CloudSyncResult> {
    if (!this.isOnline || this.isSyncing) {
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        failed: 0,
        errors: ['Offline or sync in progress']
      };
    }

    this.isSyncing = true;
    const result: CloudSyncResult = {
      success: true,
      uploaded: 0,
      downloaded: 0,
      failed: 0,
      errors: []
    };

    try {
      // Verificar conectividad del backend antes de sincronizar
      const backendAvailable = await this.checkBackendAvailability();
      
      if (!backendAvailable) {
        // En modo desarrollo, silenciar errores y continuar funcionando offline
        if (import.meta.env.DEV) {
          console.log('🔄 [CloudSync] Backend no disponible en desarrollo - funcionando offline');
          return {
            success: true, // Consideramos éxito en desarrollo sin backend
            uploaded: 0,
            downloaded: 0,
            failed: 0,
            errors: []
          };
        } else {
          return {
            success: false,
            uploaded: 0,
            downloaded: 0,
            failed: 0,
            errors: ['Backend service unavailable']
          };
        }
      }

      // Sincronizar imágenes para análisis de IA
      const imageResult = await this.syncAIImages();
      result.uploaded += imageResult.uploaded;
      result.failed += imageResult.failed;
      result.errors.push(...imageResult.errors);

      // Sincronizar análisis de IA
      const analysisResult = await this.syncAIAnalysis();
      result.uploaded += analysisResult.uploaded;
      result.downloaded += analysisResult.downloaded;
      result.failed += analysisResult.failed;
      result.errors.push(...analysisResult.errors);

      // Sincronizar notificaciones
      const notificationResult = await this.syncNotifications();
      result.downloaded += notificationResult.downloaded;
      result.failed += notificationResult.failed;
      result.errors.push(...notificationResult.errors);

      // Actualizar timestamp de última sincronización
      await this.updateLastSyncTimestamp();

    } catch (error) {
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Unknown sync error');
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  // Verificar disponibilidad del backend
  private async checkBackendAvailability(): Promise<boolean> {
    try {
<<<<<<< HEAD
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      
      const response = await fetch(`${this.config.apiBaseUrl}/health`, {
        method: 'GET',
        signal: controller.signal
=======
      const response = await fetch(`${this.config.apiBaseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(2000)
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
      });
      
      clearTimeout(timeoutId);
      return response.ok;
    } catch (error) {
      const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
      if (isDevelopment) {
        return false;
      }
      console.warn('[CloudSync] Backend availability check failed:', error);
      return false;
    }
  }

  // Sincronizar imágenes para análisis de IA
  private async syncAIImages(): Promise<Partial<CloudSyncResult>> {
    const result = { uploaded: 0, failed: 0, errors: [] as string[] };

    try {
      // Obtener imágenes pendientes de subir
      const pendingImages = await offlineDB.getAIImagesByStatus('pending');

      for (const image of pendingImages.slice(0, this.config.batchSize)) {
        try {
          const success = await this.uploadAIImage(image);
          if (success) {
            result.uploaded++;
            // Actualizar estado en IndexedDB
            await offlineDB.updateAIImageAnalysis(image.id, { status: 'uploaded' });
          } else {
            result.failed++;
            await this.handleRetry(image.id);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to upload image ${image.id}: ${error}`);
          await this.handleRetry(image.id);
        }
      }
    } catch (error) {
      result.errors.push(`Error syncing AI images: ${error}`);
    }

    return result;
  }

  // Subir imagen individual
  private async uploadAIImage(image: any): Promise<boolean> {
    try {
      const formData = new FormData();
      formData.append('image', image.blob);
      formData.append('metadata', JSON.stringify({
        id: image.id,
        filename: image.filename,
        timestamp: image.timestamp,
        metadata: image.metadata
      }));

      const response = await fetch(`${this.config.apiBaseUrl}/ai/images/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: formData
      });

      return response.ok;
    } catch (error) {
      // Silenciar errores de conexión en modo desarrollo
      if (import.meta.env.DEV) {
        console.warn('Backend not available for AI image upload:', error);
      } else {
        console.error('Error uploading AI image:', error);
      }
      return false;
    }
  }

  // Sincronizar análisis de IA
  private async syncAIAnalysis(): Promise<Partial<CloudSyncResult>> {
    const result = { uploaded: 0, downloaded: 0, failed: 0, errors: [] as string[] };

    try {
      // Subir análisis pendientes
      const pendingAnalysis = await offlineDB.getAIAnalysisByStatus('pending');
      
      for (const analysis of pendingAnalysis.slice(0, this.config.batchSize)) {
        try {
          const success = await this.uploadAnalysisRequest(analysis);
          if (success) {
            result.uploaded++;
          } else {
            result.failed++;
            await this.handleRetry(analysis.id);
          }
        } catch (error) {
          result.failed++;
          result.errors.push(`Failed to upload analysis ${analysis.id}: ${error}`);
        }
      }

      // Descargar resultados completados
      const downloadResult = await this.downloadAnalysisResults();
      result.downloaded += downloadResult.downloaded;
      result.failed += downloadResult.failed;
      result.errors.push(...downloadResult.errors);

    } catch (error) {
      result.errors.push(`Error syncing AI analysis: ${error}`);
    }

    return result;
  }

  // Subir solicitud de análisis
  private async uploadAnalysisRequest(analysis: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.apiBaseUrl}/ai/analysis/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`
        },
        body: JSON.stringify({
          id: analysis.id,
          agentType: analysis.agentType,
          imageId: analysis.imageId,
          metadata: analysis.metadata,
          priority: analysis.priority,
          timestamp: analysis.timestamp
        })
      });

      if (response.ok) {
        // Actualizar estado a 'processing'
        await offlineDB.updateAIAnalysisResult(analysis.id, {
          status: 'processing'
        }, 'processing');
        return true;
      }
      return false;
    } catch (error) {
      // Silenciar errores de conexión en modo desarrollo
      if (import.meta.env.DEV) {
        console.warn('Backend not available for analysis request upload:', error);
      } else {
        console.error('Error uploading analysis request:', error);
      }
      return false;
    }
  }

  // Descargar resultados de análisis
  private async downloadAnalysisResults(): Promise<Partial<CloudSyncResult>> {
    const result = { downloaded: 0, failed: 0, errors: [] as string[] };

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/ai/analysis/results`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (response.ok) {
        const results: AIAnalysisResult[] = await response.json();
        
        for (const analysisResult of results) {
          try {
            await offlineDB.updateAIAnalysisResult(
              analysisResult.requestId,
              analysisResult,
              analysisResult.status
            );
            result.downloaded++;
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to save analysis result ${analysisResult.id}: ${error}`);
          }
        }
      } else {
        if (!import.meta.env.DEV) {
          result.errors.push(`Failed to download analysis results: ${response.statusText}`);
        }
      }
    } catch (error) {
       // Silenciar errores de conexión en modo desarrollo
       if (import.meta.env.DEV) {
         // Silent in development mode
       } else {
         result.errors.push(`Error downloading analysis results: ${error}`);
       }
     }

    return result;
  }

  // Sincronizar notificaciones
  private async syncNotifications(): Promise<Partial<CloudSyncResult>> {
    const result = { downloaded: 0, failed: 0, errors: [] as string[] };

    try {
      const response = await fetch(`${this.config.apiBaseUrl}/ai/notifications`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`
        }
      });

      if (response.ok) {
        const notifications: AINotification[] = await response.json();
        
        for (const notification of notifications) {
          try {
            await offlineDB.addAINotification(
              notification.agentType,
              notification.type,
              notification.title,
              notification.message,
              notification.priority,
              notification.data
            );
            result.downloaded++;
          } catch (error) {
            result.failed++;
            result.errors.push(`Failed to save notification ${notification.id}: ${error}`);
          }
        }
      } else {
        if (!import.meta.env.DEV) {
          result.errors.push(`Failed to download notifications: ${response.statusText}`);
        }
      }
    } catch (error) {
      // Silenciar errores de conexión en modo desarrollo
      if (import.meta.env.DEV) {
        // Silent in development mode
      } else {
        result.errors.push(`Error downloading notifications: ${error}`);
      }
    }

    return result;
  }

  // Manejar reintentos
  private async handleRetry(itemId: string): Promise<void> {
    const currentRetries = this.retryQueue.get(itemId) || 0;
    
    if (currentRetries < this.config.maxRetries) {
      this.retryQueue.set(itemId, currentRetries + 1);
      // Programar reintento con backoff exponencial
      setTimeout(() => {
        this.syncData();
      }, Math.pow(2, currentRetries) * 1000);
    } else {
      // Marcar como fallido después de máximos reintentos
      this.retryQueue.delete(itemId);
      console.error(`Max retries reached for item ${itemId}`);
    }
  }

  // Actualizar timestamp de última sincronización
  private async updateLastSyncTimestamp(): Promise<void> {
    try {
      localStorage.setItem('lastCloudSync', new Date().toISOString());
    } catch (error) {
      console.error('Error updating last sync timestamp:', error);
    }
  }

  // Obtener estado de sincronización
  async getSyncStatus(): Promise<SyncStatus> {
    try {
      const [pendingImages, pendingAnalysis] = await Promise.all([
        offlineDB.getAIImagesByStatus('pending'),
        offlineDB.getAIAnalysisByStatus('pending')
      ]);

      return {
        lastSync: localStorage.getItem('lastCloudSync') || 'Never',
        pendingUploads: pendingImages.length + pendingAnalysis.length,
        pendingDownloads: 0, // Se calcularía consultando la API
        failedOperations: this.retryQueue.size,
        isOnline: this.isOnline,
        isSyncing: this.isSyncing
      };
    } catch (error) {
      console.error('Error getting sync status:', error);
      return {
        lastSync: 'Error',
        pendingUploads: 0,
        pendingDownloads: 0,
        failedOperations: 0,
        isOnline: this.isOnline,
        isSyncing: this.isSyncing
      };
    }
  }

  // Forzar sincronización manual
  async forcSync(): Promise<CloudSyncResult> {
    if (!this.isOnline) {
      return {
        success: false,
        uploaded: 0,
        downloaded: 0,
        failed: 0,
        errors: ['Device is offline']
      };
    }

    return await this.syncData();
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<CloudSyncConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    // Reiniciar auto-sync si cambió la configuración
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.startAutoSync();
  }

  // Limpiar recursos
  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    this.retryQueue.clear();
  }
}

// Configuración por defecto
export const defaultCloudSyncConfig: CloudSyncConfig = {
  apiBaseUrl: '/api',
  apiKey: import.meta.env.VITE_API_KEY || '',
  enableAutoSync: appConfig.sync.enableAutoSync,
  syncInterval: appConfig.sync.interval,
  maxRetries: appConfig.api.retryAttempts,
  batchSize: appConfig.sync.batchSize
};

// Exportar instancia singleton (se inicializa cuando se necesite)
let cloudSyncInstance: CloudSyncService | null = null;

export const getCloudSyncService = (config?: CloudSyncConfig): CloudSyncService => {
  if (!cloudSyncInstance) {
    cloudSyncInstance = CloudSyncService.getInstance(config || defaultCloudSyncConfig);
  }
  return cloudSyncInstance;
};
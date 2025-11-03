import Dexie, { Table } from 'dexie';
import { 
  AIAnalysisResult, 
  PhytosanitaryAnalysis, 
  PredictiveAnalysis, 
  RAGQuery, 
  OptimizationAnalysis,
  AIProcessingQueue,
  AIAgentConfig,
  AISystemStatus,
  ProcessingStatus,
  AgentType
} from '../types/ai';

// Interfaces para los datos offline
export interface OfflineLot {
  id?: number;
  serverId?: string;
  name: string;
  area: number;
  farmId: string;
  variety: string;
  plantingDate: string;
  status: string;
  coordinates?: string;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

export interface OfflineInventory {
  id?: number;
  serverId?: string;
  inputId: string;
  quantity: number;
  unit: string;
  expirationDate?: string;
  location: string;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

export interface OfflineTask {
  id?: number;
  serverId?: string;
  title: string;
  description: string;
  type: string;
  status: string;
  dueDate: string;
  lotId: string;
  assignedTo?: string;
  completedAt?: string;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

export interface OfflinePestMonitoring {
  id?: number;
  serverId?: string;
  lotId: string;
  pestType: string;
  severity: string;
  affectedArea: number;
  observationDate: string;
  notes?: string;
  photos?: string[];
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

export interface OfflineHarvest {
  id?: number;
  serverId?: string;
  lotId: string;
  date: string;
  quantity: number;
  quality: string;
  notes?: string;
  weather?: string;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

export interface OfflineExpense {
  id?: number;
  serverId?: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  lotId?: string;
  receipt?: string;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

export interface SyncQueue {
  id?: number;
  table: string;
  recordId: number;
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: Date;
  retries: number;
  lastError?: string;
}

export interface AppSettings {
  id?: number;
  key: string;
  value: any;
  lastUpdated: Date;
}

export interface CacheMetadata {
  id?: number;
  url: string;
  timestamp: Date;
  size: number;
  type: string;
}

// Interfaces para datos de IA offline
export interface OfflineAIImage {
  id?: number;
  serverId?: string;
  filename: string;
  blob: Blob;
  metadata: {
    captureDate: Date;
    location?: { lat: number; lng: number };
    lotId?: string;
    farmId?: string;
    deviceInfo?: string;
    cameraSettings?: any;
    imageSize?: { width: number; height: number };
    fileSize?: number;
    quality?: number;
  };
  analysisStatus: ProcessingStatus;
  analysisResults?: PhytosanitaryAnalysis[];
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
  uploadProgress?: number;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

export interface OfflineAIAnalysis {
  id?: number;
  serverId?: string;
  agentType: AgentType;
  inputData: any; // Datos de entrada específicos del agente
  result?: AIAnalysisResult;
  status: ProcessingStatus;
  priority: 'low' | 'medium' | 'high' | 'critical';
  createdAt: Date;
  processedAt?: Date;
  processingTime?: number; // Tiempo de procesamiento en ms
  confidence?: number; // Nivel de confianza del resultado (0-1)
  errorMessage?: string;
  retryCount: number;
  maxRetries?: number;
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
  tags?: string[]; // Etiquetas para categorización
  relatedImageId?: number; // ID de imagen relacionada
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

export interface OfflineAINotification {
  id?: number;
  serverId?: string;
  agentType: AgentType;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success' | 'critical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
  isRead: boolean;
  isDismissed?: boolean;
  actionRequired?: boolean;
  actionUrl?: string;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

export interface OfflineAIConfig {
  id?: number;
  agentType: AgentType;
  config: AIAgentConfig;
  isActive: boolean;
  lastUpdated: Date;
  version: string;
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
}

// Nueva interfaz para métricas de rendimiento de IA
export interface OfflineAIMetrics {
  id?: number;
  agentType: AgentType;
  date: string; // YYYY-MM-DD
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  averageProcessingTime: number;
  averageConfidence: number;
  totalImages: number;
  totalNotifications: number;
  syncErrors: number;
  lastUpdated: Date;
}

// Nueva interfaz para sesiones de análisis
export interface OfflineAISession {
  id?: number;
  serverId?: string;
  sessionId: string;
  agentType: AgentType;
  startTime: Date;
  endTime?: Date;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  totalItems: number;
  processedItems: number;
  failedItems: number;
  metadata?: any;
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

// Nueva interfaz para cache de modelos de IA
export interface OfflineAIModelCache {
  id?: number;
  agentType: AgentType;
  modelId: string;
  modelVersion: string;
  modelData?: Blob; // Datos del modelo para uso offline
  modelSize: number;
  downloadedAt: Date;
  lastUsed: Date;
  isActive: boolean;
  expiresAt?: Date;
}

// Nueva interfaz para logs de errores de IA
export interface OfflineAIErrorLog {
  id?: number;
  agentType: AgentType;
  errorType: 'processing' | 'sync' | 'network' | 'validation' | 'system';
  errorCode?: string;
  errorMessage: string;
  stackTrace?: string;
  context?: any; // Contexto adicional del error
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  resolved?: boolean;
  resolvedAt?: Date;
  relatedAnalysisId?: number;
  relatedImageId?: number;
}

// Nueva interfaz para configuraciones de usuario de IA
export interface OfflineAIUserPreferences {
  id?: number;
  userId?: string;
  agentType?: AgentType; // null para preferencias globales
  preferences: {
    autoAnalysis?: boolean;
    notificationSettings?: {
      enabled: boolean;
      severity: ('info' | 'warning' | 'error' | 'success' | 'critical')[];
      sound?: boolean;
      vibration?: boolean;
    };
    qualitySettings?: {
      imageQuality: 'low' | 'medium' | 'high';
      analysisDepth: 'basic' | 'detailed' | 'comprehensive';
    };
    syncSettings?: {
      autoSync: boolean;
      syncOnWifiOnly: boolean;
      syncFrequency: number; // minutos
    };
  };
  lastUpdated: Date;
}

// Nueva interfaz para suscripciones push
export interface OfflinePushSubscription {
  id?: number;
  token: string;
  endpoint: string;
  userId?: string;
  deviceId: string;
  subscribedAt: Date;
  lastActive: Date;
  preferences: {
    phytosanitary: boolean;
    predictive: boolean;
    rag_assistant: boolean;
    optimization: boolean;
    critical: boolean;
    marketing: boolean;
    system: boolean;
  };
  isActive: boolean;
  lastSync?: Date;
}

// Nueva interfaz para estadísticas de notificaciones
export interface OfflineNotificationStats {
  id?: number;
  type: 'sent' | 'received' | 'clicked' | 'dismissed';
  agentType: AgentType;
  timestamp: Date;
  payload?: any;
  deviceId?: string;
  sessionId?: string;
}

// Clase principal de la base de datos offline
export class OfflineDatabase extends Dexie {
  // Tablas de datos principales
  lots!: Table<OfflineLot>;
  inventory!: Table<OfflineInventory>;
  tasks!: Table<OfflineTask>;
  pestMonitoring!: Table<OfflinePestMonitoring>;
  harvests!: Table<OfflineHarvest>;
  expenses!: Table<OfflineExpense>;
  
  // Tablas de IA existentes
  aiImages!: Table<OfflineAIImage>;
  aiAnalysis!: Table<OfflineAIAnalysis>;
  aiNotifications!: Table<OfflineAINotification>;
  aiConfigs!: Table<OfflineAIConfig>;
  
  // Nuevas tablas de IA
  aiMetrics!: Table<OfflineAIMetrics>;
  aiSessions!: Table<OfflineAISession>;
  aiModelCache!: Table<OfflineAIModelCache>;
  aiErrorLogs!: Table<OfflineAIErrorLog>;
  aiUserPreferences!: Table<OfflineAIUserPreferences>;
  
  // Tablas de notificaciones push
  pushSubscriptions!: Table<OfflinePushSubscription>;
  notificationStats!: Table<OfflineNotificationStats>;
  
  // Tablas de sistema
  syncQueue!: Table<SyncQueue>;
  settings!: Table<AppSettings>;
  cacheMetadata!: Table<CacheMetadata>;

  constructor() {
    super('CafeColombiaOfflineDB');
    
    // Versión 1: Esquema original
    this.version(1).stores({
      lots: '++id, serverId, name, farmId, variety, status, lastSync, pendingSync',
      inventory: '++id, serverId, inputId, quantity, location, lastSync, pendingSync',
      tasks: '++id, serverId, title, type, status, dueDate, lotId, lastSync, pendingSync',
      pestMonitoring: '++id, serverId, lotId, pestType, severity, observationDate, lastSync, pendingSync',
      harvests: '++id, serverId, lotId, date, quantity, quality, lastSync, pendingSync',
      expenses: '++id, serverId, description, category, date, lotId, lastSync, pendingSync',
      syncQueue: '++id, table, recordId, action, timestamp, retries',
      settings: '++id, key, lastUpdated',
      cacheMetadata: '++id, url, timestamp, type'
    });

    // Versión 2: Agregar tablas de IA básicas
    this.version(2).stores({
      lots: '++id, serverId, name, farmId, variety, status, lastSync, pendingSync',
      inventory: '++id, serverId, inputId, quantity, location, lastSync, pendingSync',
      tasks: '++id, serverId, title, type, status, dueDate, lotId, lastSync, pendingSync',
      pestMonitoring: '++id, serverId, lotId, pestType, severity, observationDate, lastSync, pendingSync',
      harvests: '++id, serverId, lotId, date, quantity, quality, lastSync, pendingSync',
      expenses: '++id, serverId, description, category, date, lotId, lastSync, pendingSync',
      syncQueue: '++id, table, recordId, action, timestamp, retries',
      settings: '++id, key, lastUpdated',
      cacheMetadata: '++id, url, timestamp, type',
      // Tablas de IA básicas
      aiImages: '++id, serverId, filename, analysisStatus, syncStatus, lastSync, pendingSync',
      aiAnalysis: '++id, serverId, agentType, status, priority, createdAt, processedAt, syncStatus, lastSync, pendingSync',
      aiNotifications: '++id, serverId, agentType, severity, priority, isRead, isDismissed, createdAt, expiresAt, syncStatus, lastSync, pendingSync',
      aiConfigs: '++id, agentType, isActive, lastUpdated, version, syncStatus'
    });

    // Versión 3: Extender con nuevas tablas de IA avanzadas
    this.version(3).stores({
      lots: '++id, serverId, name, farmId, variety, status, lastSync, pendingSync',
      inventory: '++id, serverId, inputId, quantity, location, lastSync, pendingSync',
      tasks: '++id, serverId, title, type, status, dueDate, lotId, lastSync, pendingSync',
      pestMonitoring: '++id, serverId, lotId, pestType, severity, observationDate, lastSync, pendingSync',
      harvests: '++id, serverId, lotId, date, quantity, quality, lastSync, pendingSync',
      expenses: '++id, serverId, description, category, date, lotId, lastSync, pendingSync',
      syncQueue: '++id, table, recordId, action, timestamp, retries',
      settings: '++id, key, lastUpdated',
      cacheMetadata: '++id, url, timestamp, type',
      // Tablas de IA básicas (actualizadas)
      aiImages: '++id, serverId, filename, analysisStatus, syncStatus, uploadProgress, lastSync, pendingSync',
      aiAnalysis: '++id, serverId, agentType, status, priority, createdAt, processedAt, confidence, syncStatus, relatedImageId, lastSync, pendingSync',
      aiNotifications: '++id, serverId, agentType, severity, priority, isRead, isDismissed, actionRequired, createdAt, readAt, expiresAt, syncStatus, lastSync, pendingSync',
      aiConfigs: '++id, agentType, isActive, lastUpdated, version, syncStatus',
      // Nuevas tablas de IA avanzadas
      aiMetrics: '++id, agentType, date, totalAnalyses, successfulAnalyses, failedAnalyses, lastUpdated',
      aiSessions: '++id, serverId, sessionId, agentType, startTime, endTime, status, totalItems, processedItems, syncStatus, lastSync, pendingSync',
      aiModelCache: '++id, agentType, modelId, modelVersion, modelSize, downloadedAt, lastUsed, isActive, expiresAt',
      aiErrorLogs: '++id, agentType, errorType, severity, timestamp, resolved, resolvedAt, relatedAnalysisId, relatedImageId',
      aiUserPreferences: '++id, userId, agentType, lastUpdated'
    });

    // Versión 4: Agregar soporte para notificaciones push
    this.version(4).stores({
      lots: '++id, serverId, name, farmId, variety, status, lastSync, pendingSync',
      inventory: '++id, serverId, inputId, quantity, location, lastSync, pendingSync',
      tasks: '++id, serverId, title, type, status, dueDate, lotId, lastSync, pendingSync',
      pestMonitoring: '++id, serverId, lotId, pestType, severity, observationDate, lastSync, pendingSync',
      harvests: '++id, serverId, lotId, date, quantity, quality, lastSync, pendingSync',
      expenses: '++id, serverId, description, category, date, lotId, lastSync, pendingSync',
      syncQueue: '++id, table, recordId, action, timestamp, retries',
      settings: '++id, key, lastUpdated',
      cacheMetadata: '++id, url, timestamp, type',
      // Tablas de IA básicas (actualizadas)
      aiImages: '++id, serverId, filename, analysisStatus, syncStatus, uploadProgress, lastSync, pendingSync',
      aiAnalysis: '++id, serverId, agentType, status, priority, createdAt, processedAt, confidence, syncStatus, relatedImageId, lastSync, pendingSync',
      aiNotifications: '++id, serverId, agentType, severity, priority, isRead, isDismissed, actionRequired, createdAt, readAt, expiresAt, syncStatus, lastSync, pendingSync',
      aiConfigs: '++id, agentType, isActive, lastUpdated, version, syncStatus',
      // Nuevas tablas de IA avanzadas
      aiMetrics: '++id, agentType, date, totalAnalyses, successfulAnalyses, failedAnalyses, lastUpdated',
      aiSessions: '++id, serverId, sessionId, agentType, startTime, endTime, status, totalItems, processedItems, syncStatus, lastSync, pendingSync',
      aiModelCache: '++id, agentType, modelId, modelVersion, modelSize, downloadedAt, lastUsed, isActive, expiresAt',
      aiErrorLogs: '++id, agentType, errorType, severity, timestamp, resolved, resolvedAt, relatedAnalysisId, relatedImageId',
      aiUserPreferences: '++id, userId, agentType, lastUpdated',
      // Tablas de notificaciones push
      pushSubscriptions: '++id, token, endpoint, deviceId, subscribedAt, lastActive, isActive, lastSync',
      notificationStats: '++id, type, agentType, timestamp, deviceId, sessionId'
    });

    // Hooks para manejar cambios automáticamente
    this.lots.hook('creating', this.addSyncMetadata);
    this.lots.hook('updating', this.updateSyncMetadata);
    this.lots.hook('deleting', this.markForDeletion);

    this.inventory.hook('creating', this.addSyncMetadata);
    this.inventory.hook('updating', this.updateSyncMetadata);
    this.inventory.hook('deleting', this.markForDeletion);

    this.tasks.hook('creating', this.addSyncMetadata);
    this.tasks.hook('updating', this.updateSyncMetadata);
    this.tasks.hook('deleting', this.markForDeletion);

    this.pestMonitoring.hook('creating', this.addSyncMetadata);
    this.pestMonitoring.hook('updating', this.updateSyncMetadata);
    this.pestMonitoring.hook('deleting', this.markForDeletion);

    this.harvests.hook('creating', this.addSyncMetadata);
    this.harvests.hook('updating', this.updateSyncMetadata);
    this.harvests.hook('deleting', this.markForDeletion);

    this.expenses.hook('creating', this.addSyncMetadata);
    this.expenses.hook('updating', this.updateSyncMetadata);
    this.expenses.hook('deleting', this.markForDeletion);

    // Hooks para tablas de IA existentes
    this.aiImages.hook('creating', this.addSyncMetadata);
    this.aiImages.hook('updating', this.updateSyncMetadata);
    this.aiImages.hook('deleting', this.markForDeletion);

    this.aiAnalysis.hook('creating', this.addSyncMetadata);
    this.aiAnalysis.hook('updating', this.updateSyncMetadata);
    this.aiAnalysis.hook('deleting', this.markForDeletion);

    this.aiNotifications.hook('creating', this.addSyncMetadata);
    this.aiNotifications.hook('updating', this.updateSyncMetadata);
    this.aiNotifications.hook('deleting', this.markForDeletion);

    // Hooks para nuevas tablas de IA
    this.aiSessions.hook('creating', this.addSyncMetadata);
    this.aiSessions.hook('updating', this.updateSyncMetadata);
    this.aiSessions.hook('deleting', this.markForDeletion);

    // Hooks especiales para métricas (no necesitan sincronización)
    this.aiMetrics.hook('creating', (primKey: any, obj: any, trans: any) => {
      obj.lastUpdated = new Date();
    });

    this.aiMetrics.hook('updating', (modifications: any, primKey: any, obj: any, trans: any) => {
      modifications.lastUpdated = new Date();
    });

    // Hooks para preferencias de usuario
    this.aiUserPreferences.hook('creating', (primKey: any, obj: any, trans: any) => {
      obj.lastUpdated = new Date();
    });

    this.aiUserPreferences.hook('updating', (modifications: any, primKey: any, obj: any, trans: any) => {
      modifications.lastUpdated = new Date();
    });

    // Hooks para logs de errores
    this.aiErrorLogs.hook('creating', (primKey: any, obj: any, trans: any) => {
      obj.timestamp = new Date();
    });

    // Hooks para cache de modelos
    this.aiModelCache.hook('creating', (primKey: any, obj: any, trans: any) => {
      obj.downloadedAt = new Date();
      obj.lastUsed = new Date();
    });

    this.aiModelCache.hook('updating', (modifications: any, primKey: any, obj: any, trans: any) => {
      modifications.lastUsed = new Date();
    });
  }

  // Hook para agregar metadatos de sincronización al crear
  private addSyncMetadata = (primKey: any, obj: any, trans: any) => {
    obj.lastSync = new Date();
    obj.pendingSync = true;
    obj.action = 'create';
  };

  // Hook para actualizar metadatos de sincronización al modificar
  private updateSyncMetadata = (modifications: any, primKey: any, obj: any, trans: any) => {
    modifications.lastSync = new Date();
    modifications.pendingSync = true;
    if (!obj.action) {
      modifications.action = 'update';
    }
  };

  // Hook para marcar para eliminación
  private markForDeletion = async (primKey: any, obj: any, trans: any) => {
    if (obj.serverId) {
      // Si tiene serverId, marcar para eliminación en el servidor
      await this.syncQueue.add({
        table: trans.table.name,
        recordId: primKey,
        action: 'delete',
        data: obj,
        timestamp: new Date(),
        retries: 0
      });
    }
  };

  // Métodos de utilidad para sincronización
  async addToSyncQueue(table: string, recordId: number, action: 'create' | 'update' | 'delete', data: any) {
    return await this.syncQueue.add({
      table,
      recordId,
      action,
      data,
      timestamp: new Date(),
      retries: 0
    });
  }

  async getPendingSyncItems() {
    return await this.syncQueue.orderBy('timestamp').toArray();
  }

  async markSyncComplete(queueId: number) {
    return await this.syncQueue.delete(queueId);
  }

  async markSyncFailed(queueId: number, error: string) {
    const item = await this.syncQueue.get(queueId);
    if (item) {
      item.retries += 1;
      item.lastError = error;
      return await this.syncQueue.put(item);
    }
  }

  // Métodos para configuraciones
  async getSetting(key: string) {
    const setting = await this.settings.where('key').equals(key).first();
    return setting?.value;
  }

  async setSetting(key: string, value: any) {
    const existing = await this.settings.where('key').equals(key).first();
    if (existing) {
      return await this.settings.update(existing.id!, { value, lastUpdated: new Date() });
    } else {
      return await this.settings.add({ key, value, lastUpdated: new Date() });
    }
  }

  // Métodos para gestión de cache
  async addCacheMetadata(url: string, size: number, type: string) {
    return await this.cacheMetadata.add({
      url,
      timestamp: new Date(),
      size,
      type
    });
  }

  async getCacheSize() {
    const metadata = await this.cacheMetadata.toArray();
    return metadata.reduce((total, item) => total + item.size, 0);
  }

  async clearOldCache(maxAge: number = 7 * 24 * 60 * 60 * 1000) { // 7 días por defecto
    const cutoffDate = new Date(Date.now() - maxAge);
    const oldItems = await this.cacheMetadata.where('timestamp').below(cutoffDate).toArray();
    
    // Eliminar del cache del navegador
    if ('caches' in window) {
      const cache = await caches.open('dynamic-v1.0.0');
      for (const item of oldItems) {
        await cache.delete(item.url);
      }
    }
    
    // Eliminar metadatos
    return await this.cacheMetadata.where('timestamp').below(cutoffDate).delete();
  }

  // Métodos de búsqueda y filtrado
  async searchLots(query: string) {
    return await this.lots
      .filter(lot => 
        lot.name.toLowerCase().includes(query.toLowerCase()) ||
        lot.variety.toLowerCase().includes(query.toLowerCase())
      )
      .toArray();
  }

  async getTasksByStatus(status: string) {
    return await this.tasks.where('status').equals(status).toArray();
  }

  async getTasksByLot(lotId: string) {
    return await this.tasks.where('lotId').equals(lotId).toArray();
  }

  async getRecentHarvests(days: number = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return await this.harvests
      .where('date')
      .above(cutoffDate.toISOString().split('T')[0])
      .toArray();
  }

  async getExpensesByCategory(category: string) {
    return await this.expenses.where('category').equals(category).toArray();
  }

  // Métodos de estadísticas offline
  async getOfflineStats() {
    const [
      totalLots,
      totalTasks,
      pendingTasks,
      totalHarvests,
      totalExpenses,
      pendingSyncItems
    ] = await Promise.all([
      this.lots.count(),
      this.tasks.count(),
      this.tasks.where('status').equals('pending').count(),
      this.harvests.count(),
      this.expenses.count(),
      this.syncQueue.count()
    ]);

    return {
      totalLots,
      totalTasks,
      pendingTasks,
      totalHarvests,
      totalExpenses,
      pendingSyncItems,
      lastUpdated: new Date()
    };
  }

  // Método para limpiar datos antiguos
  async cleanupOldData(maxAge: number = 90 * 24 * 60 * 60 * 1000) { // 90 días
    const cutoffDate = new Date(Date.now() - maxAge);
    
    const deletedCounts = await Promise.all([
      this.harvests.where('lastSync').below(cutoffDate).delete(),
      this.expenses.where('lastSync').below(cutoffDate).delete(),
      this.pestMonitoring.where('lastSync').below(cutoffDate).delete(),
      this.clearOldCache(maxAge)
    ]);

    return {
      deletedHarvests: deletedCounts[0],
      deletedExpenses: deletedCounts[1],
      deletedPestMonitoring: deletedCounts[2],
      clearedCacheItems: deletedCounts[3]
    };
  }

  // ===== MÉTODOS ESPECÍFICOS PARA IA =====

  // Gestión de imágenes para análisis de IA
  async addAIImage(filename: string, blob: Blob, metadata: any): Promise<number> {
    return await this.aiImages.add({
      filename,
      blob,
      metadata: {
        ...metadata,
        captureDate: new Date()
      },
      analysisStatus: 'pending',
      pendingSync: true,
      action: 'create'
    });
  }

  async getAIImagesByStatus(status: ProcessingStatus) {
    return await this.aiImages.where('analysisStatus').equals(status).toArray();
  }

  async updateAIImageAnalysis(imageId: number, results: PhytosanitaryAnalysis[], status: ProcessingStatus) {
    return await this.aiImages.update(imageId, {
      analysisResults: results,
      analysisStatus: status
    });
  }

  // Gestión de análisis de IA
  async addAIAnalysis(agentType: AgentType, inputData: any, priority: 'low' | 'medium' | 'high' = 'medium'): Promise<number> {
    return await this.aiAnalysis.add({
      agentType,
      inputData,
      status: 'pending',
      priority,
      createdAt: new Date(),
      retryCount: 0,
      pendingSync: true,
      action: 'create'
    });
  }

  async getAIAnalysisByAgent(agentType: AgentType) {
    return await this.aiAnalysis.where('agentType').equals(agentType).toArray();
  }

  async getAIAnalysisByStatus(status: ProcessingStatus) {
    return await this.aiAnalysis.where('status').equals(status).toArray();
  }

  async updateAIAnalysisResult(analysisId: number, result: AIAnalysisResult, status: ProcessingStatus) {
    return await this.aiAnalysis.update(analysisId, {
      result,
      status,
      processedAt: new Date()
    });
  }

  async retryAIAnalysis(analysisId: number) {
    const analysis = await this.aiAnalysis.get(analysisId);
    if (analysis) {
      return await this.aiAnalysis.update(analysisId, {
        status: 'pending',
        retryCount: analysis.retryCount + 1,
        errorMessage: undefined
      });
    }
  }

  // Gestión de notificaciones de IA
  async addAINotification(
    agentType: AgentType, 
    title: string, 
    message: string, 
    severity: 'info' | 'warning' | 'error' | 'success',
    data?: any,
    expiresAt?: Date
  ): Promise<number> {
    return await this.aiNotifications.add({
      agentType,
      title,
      message,
      severity,
      data,
      isRead: false,
      createdAt: new Date(),
      expiresAt,
      pendingSync: true,
      action: 'create'
    });
  }

  async getUnreadAINotifications() {
    return await this.aiNotifications.where('isRead').equals(false).toArray();
  }

  async getAINotificationsByAgent(agentType: AgentType) {
    return await this.aiNotifications.where('agentType').equals(agentType).toArray();
  }

  async markAINotificationAsRead(notificationId: number) {
    return await this.aiNotifications.update(notificationId, { isRead: true });
  }

  async cleanupExpiredAINotifications() {
    const now = new Date();
    return await this.aiNotifications
      .where('expiresAt')
      .below(now)
      .delete();
  }

  // Gestión de configuraciones de IA
  async setAIAgentConfig(agentType: AgentType, config: AIAgentConfig, version: string = '1.0.0') {
    const existing = await this.aiConfigs.where('agentType').equals(agentType).first();
    
    if (existing) {
      return await this.aiConfigs.update(existing.id!, {
        config,
        lastUpdated: new Date(),
        version
      });
    } else {
      return await this.aiConfigs.add({
        agentType,
        config,
        isActive: true,
        lastUpdated: new Date(),
        version
      });
    }
  }

  async getAIAgentConfig(agentType: AgentType): Promise<OfflineAIConfig | undefined> {
    return await this.aiConfigs.where('agentType').equals(agentType).first();
  }

  async toggleAIAgent(agentType: AgentType, isActive: boolean) {
    const config = await this.getAIAgentConfig(agentType);
    if (config) {
      return await this.aiConfigs.update(config.id!, { isActive });
    }
  }

  // Estadísticas de IA
  async getAIStats() {
    const [
      totalImages,
      pendingImages,
      totalAnalysis,
      pendingAnalysis,
      unreadNotifications,
      activeAgents
    ] = await Promise.all([
      this.aiImages.count(),
      this.aiImages.where('analysisStatus').equals('pending').count(),
      this.aiAnalysis.count(),
      this.aiAnalysis.where('status').equals('pending').count(),
      this.aiNotifications.where('isRead').equals(false).count(),
      this.aiConfigs.where('isActive').equals(true).count()
    ]);

    return {
      totalImages,
      pendingImages,
      totalAnalysis,
      pendingAnalysis,
      unreadNotifications,
      activeAgents,
      lastUpdated: new Date()
    };
  }

  // Cola de procesamiento de IA
  async getAIPendingQueue(): Promise<AIProcessingQueue[]> {
    const [pendingImages, pendingAnalysis] = await Promise.all([
      this.aiImages.where('analysisStatus').equals('pending').toArray(),
      this.aiAnalysis.where('status').equals('pending').toArray()
    ]);

    const queue: AIProcessingQueue[] = [];

    // Agregar imágenes pendientes
    pendingImages.forEach(image => {
      queue.push({
        id: `image_${image.id}`,
        type: 'image_analysis',
        agentType: 'phytosanitary',
        data: {
          imageId: image.id,
          filename: image.filename,
          metadata: image.metadata
        },
        priority: 'medium',
        createdAt: image.metadata.captureDate,
        retryCount: 0
      });
    });

    // Agregar análisis pendientes
    pendingAnalysis.forEach(analysis => {
      queue.push({
        id: `analysis_${analysis.id}`,
        type: 'data_analysis',
        agentType: analysis.agentType,
        data: analysis.inputData,
        priority: analysis.priority,
        createdAt: analysis.createdAt,
        retryCount: analysis.retryCount
      });
    });

    // Ordenar por prioridad y fecha
    return queue.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  // Limpiar datos de IA antiguos
  async cleanupOldAIData(maxAge: number = 30 * 24 * 60 * 60 * 1000) { // 30 días
    const cutoffDate = new Date(Date.now() - maxAge);
    
    const deletedCounts = await Promise.all([
      this.aiImages.where('lastSync').below(cutoffDate).delete(),
      this.aiAnalysis.where('lastSync').below(cutoffDate).delete(),
      this.cleanupExpiredAINotifications()
    ]);

    return {
      deletedImages: deletedCounts[0],
      deletedAnalysis: deletedCounts[1],
      deletedNotifications: deletedCounts[2]
    };
  }

  // ===== NUEVOS MÉTODOS PARA FUNCIONALIDADES AVANZADAS DE IA =====

  // Gestión de métricas de IA
  async updateAIMetrics(agentType: AgentType, date: string, metrics: Partial<OfflineAIMetrics>): Promise<number> {
    const existing = await this.aiMetrics
      .where('[agentType+date]')
      .equals([agentType, date])
      .first();

    if (existing) {
      return await this.aiMetrics.update(existing.id!, {
        ...metrics,
        lastUpdated: new Date()
      });
    } else {
      return await this.aiMetrics.add({
        agentType,
        date,
        totalAnalyses: 0,
        successfulAnalyses: 0,
        failedAnalyses: 0,
        averageProcessingTime: 0,
        averageConfidence: 0,
        totalImages: 0,
        totalNotifications: 0,
        syncErrors: 0,
        ...metrics,
        lastUpdated: new Date()
      });
    }
  }

  async getAIMetricsByAgent(agentType: AgentType, days: number = 30): Promise<OfflineAIMetrics[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    return await this.aiMetrics
      .where('agentType')
      .equals(agentType)
      .and(metric => metric.date >= cutoffDateStr)
      .toArray();
  }

  async getAIMetricsSummary(days: number = 7): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoffDateStr = cutoffDate.toISOString().split('T')[0];

    const metrics = await this.aiMetrics
      .where('date')
      .above(cutoffDateStr)
      .toArray();

    const summary = metrics.reduce((acc, metric) => {
      if (!acc[metric.agentType]) {
        acc[metric.agentType] = {
          totalAnalyses: 0,
          successfulAnalyses: 0,
          failedAnalyses: 0,
          totalProcessingTime: 0,
          totalConfidence: 0,
          totalImages: 0,
          totalNotifications: 0,
          syncErrors: 0,
          days: 0
        };
      }

      const agent = acc[metric.agentType];
      agent.totalAnalyses += metric.totalAnalyses;
      agent.successfulAnalyses += metric.successfulAnalyses;
      agent.failedAnalyses += metric.failedAnalyses;
      agent.totalProcessingTime += metric.averageProcessingTime * metric.totalAnalyses;
      agent.totalConfidence += metric.averageConfidence * metric.totalAnalyses;
      agent.totalImages += metric.totalImages;
      agent.totalNotifications += metric.totalNotifications;
      agent.syncErrors += metric.syncErrors;
      agent.days++;

      return acc;
    }, {} as any);

    // Calcular promedios
    Object.keys(summary).forEach(agentType => {
      const agent = summary[agentType];
      agent.averageProcessingTime = agent.totalAnalyses > 0 ? agent.totalProcessingTime / agent.totalAnalyses : 0;
      agent.averageConfidence = agent.totalAnalyses > 0 ? agent.totalConfidence / agent.totalAnalyses : 0;
      agent.successRate = agent.totalAnalyses > 0 ? (agent.successfulAnalyses / agent.totalAnalyses) * 100 : 0;
    });

    return summary;
  }

  // Gestión de sesiones de análisis
  async startAISession(agentType: AgentType, totalItems: number, metadata?: any): Promise<string> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await this.aiSessions.add({
      sessionId,
      agentType,
      startTime: new Date(),
      status: 'active',
      totalItems,
      processedItems: 0,
      failedItems: 0,
      metadata,
      pendingSync: true,
      action: 'create'
    });

    return sessionId;
  }

  async updateAISession(sessionId: string, updates: Partial<OfflineAISession>): Promise<void> {
    const session = await this.aiSessions.where('sessionId').equals(sessionId).first();
    if (session) {
      await this.aiSessions.update(session.id!, updates);
    }
  }

  async completeAISession(sessionId: string, status: 'completed' | 'failed' | 'cancelled'): Promise<void> {
    await this.updateAISession(sessionId, {
      endTime: new Date(),
      status
    });
  }

  async getActiveAISessions(): Promise<OfflineAISession[]> {
    return await this.aiSessions.where('status').equals('active').toArray();
  }

  async getAISessionsByAgent(agentType: AgentType, limit: number = 10): Promise<OfflineAISession[]> {
    return await this.aiSessions
      .where('agentType')
      .equals(agentType)
      .orderBy('startTime')
      .reverse()
      .limit(limit)
      .toArray();
  }

  // Gestión de cache de modelos de IA
  async addAIModelToCache(agentType: AgentType, modelId: string, modelVersion: string, modelData: Blob): Promise<number> {
    // Eliminar versión anterior si existe
    await this.aiModelCache
      .where('[agentType+modelId]')
      .equals([agentType, modelId])
      .delete();

    return await this.aiModelCache.add({
      agentType,
      modelId,
      modelVersion,
      modelData,
      modelSize: modelData.size,
      downloadedAt: new Date(),
      lastUsed: new Date(),
      isActive: true
    });
  }

  async getAIModelFromCache(agentType: AgentType, modelId: string): Promise<OfflineAIModelCache | undefined> {
    const model = await this.aiModelCache
      .where('[agentType+modelId]')
      .equals([agentType, modelId])
      .first();

    if (model) {
      // Actualizar último uso
      await this.aiModelCache.update(model.id!, { lastUsed: new Date() });
    }

    return model;
  }

  async cleanupExpiredAIModels(): Promise<number> {
    const now = new Date();
    return await this.aiModelCache
      .where('expiresAt')
      .below(now)
      .delete();
  }

  async getAIModelCacheSize(): Promise<number> {
    const models = await this.aiModelCache.toArray();
    return models.reduce((total, model) => total + model.modelSize, 0);
  }

  async clearAIModelCache(agentType?: AgentType): Promise<number> {
    if (agentType) {
      return await this.aiModelCache.where('agentType').equals(agentType).delete();
    } else {
      return await this.aiModelCache.clear();
    }
  }

  // Gestión de logs de errores de IA
  async logAIError(
    agentType: AgentType,
    errorType: 'processing' | 'sync' | 'network' | 'validation' | 'system',
    errorMessage: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    context?: any,
    relatedAnalysisId?: number,
    relatedImageId?: number
  ): Promise<number> {
    return await this.aiErrorLogs.add({
      agentType,
      errorType,
      errorMessage,
      severity,
      context,
      timestamp: new Date(),
      resolved: false,
      relatedAnalysisId,
      relatedImageId
    });
  }

  async getAIErrorLogs(agentType?: AgentType, severity?: string, limit: number = 50): Promise<OfflineAIErrorLog[]> {
    let query = this.aiErrorLogs.orderBy('timestamp').reverse();

    if (agentType) {
      query = this.aiErrorLogs.where('agentType').equals(agentType).reverse();
    }

    const logs = await query.limit(limit).toArray();

    if (severity) {
      return logs.filter(log => log.severity === severity);
    }

    return logs;
  }

  async resolveAIError(errorId: number): Promise<void> {
    await this.aiErrorLogs.update(errorId, {
      resolved: true,
      resolvedAt: new Date()
    });
  }

  async getUnresolvedAIErrors(agentType?: AgentType): Promise<OfflineAIErrorLog[]> {
    let query = this.aiErrorLogs.where('resolved').equals(false);

    if (agentType) {
      query = query.and(log => log.agentType === agentType);
    }

    return await query.toArray();
  }

  async cleanupOldAIErrorLogs(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge);
    return await this.aiErrorLogs
      .where('timestamp')
      .below(cutoffDate)
      .and(log => log.resolved === true)
      .delete();
  }

  // Gestión de preferencias de usuario de IA
  async setAIUserPreferences(
    preferences: OfflineAIUserPreferences['preferences'],
    agentType?: AgentType,
    userId?: string
  ): Promise<number> {
    const existing = await this.aiUserPreferences
      .where('[userId+agentType]')
      .equals([userId || null, agentType || null])
      .first();

    if (existing) {
      return await this.aiUserPreferences.update(existing.id!, {
        preferences,
        lastUpdated: new Date()
      });
    } else {
      return await this.aiUserPreferences.add({
        userId,
        agentType,
        preferences,
        lastUpdated: new Date()
      });
    }
  }

  async getAIUserPreferences(agentType?: AgentType, userId?: string): Promise<OfflineAIUserPreferences | undefined> {
    return await this.aiUserPreferences
      .where('[userId+agentType]')
      .equals([userId || null, agentType || null])
      .first();
  }

  async getAllAIUserPreferences(userId?: string): Promise<OfflineAIUserPreferences[]> {
    if (userId) {
      return await this.aiUserPreferences.where('userId').equals(userId).toArray();
    } else {
      return await this.aiUserPreferences.where('userId').equals(null).toArray();
    }
  }

  // Métodos de utilidad avanzados
  async updateAIImageSyncStatus(imageId: number, status: 'pending' | 'syncing' | 'synced' | 'failed', progress?: number): Promise<void> {
    const updates: any = { syncStatus: status };
    if (progress !== undefined) {
      updates.uploadProgress = progress;
    }
    await this.aiImages.update(imageId, updates);
  }

  async updateAIAnalysisStatus(analysisId: number, status: ProcessingStatus, syncStatus?: string): Promise<void> {
    const updates: any = { status };
    if (syncStatus) {
      updates.syncStatus = syncStatus;
    }
    await this.aiAnalysis.update(analysisId, updates);
  }

  async updateAINotificationStatus(notificationId: number, syncStatus: 'pending' | 'syncing' | 'synced' | 'failed'): Promise<void> {
    await this.aiNotifications.update(notificationId, { syncStatus });
  }

  async getAIItemsBySyncStatus(table: 'aiImages' | 'aiAnalysis' | 'aiNotifications', status: string): Promise<any[]> {
    switch (table) {
      case 'aiImages':
        return await this.aiImages.where('syncStatus').equals(status).toArray();
      case 'aiAnalysis':
        return await this.aiAnalysis.where('syncStatus').equals(status).toArray();
      case 'aiNotifications':
        return await this.aiNotifications.where('syncStatus').equals(status).toArray();
      default:
        return [];
    }
  }

  // Estadísticas avanzadas de IA
  async getAdvancedAIStats() {
    const [
      basicStats,
      totalSessions,
      activeSessions,
      totalErrors,
      unresolvedErrors,
      modelCacheSize,
      userPreferences
    ] = await Promise.all([
      this.getAIStats(),
      this.aiSessions.count(),
      this.aiSessions.where('status').equals('active').count(),
      this.aiErrorLogs.count(),
      this.aiErrorLogs.where('resolved').equals(false).count(),
      this.getAIModelCacheSize(),
      this.aiUserPreferences.count()
    ]);

    return {
      ...basicStats,
      totalSessions,
      activeSessions,
      totalErrors,
      unresolvedErrors,
      modelCacheSize,
      userPreferences,
      lastUpdated: new Date()
    };
  }

  // Método para obtener estadísticas de rendimiento por agente
  async getAIPerformanceStats(agentType: AgentType, days: number = 7): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const [
      totalAnalyses,
      successfulAnalyses,
      failedAnalyses,
      avgProcessingTime,
      totalImages,
      totalNotifications,
      totalErrors,
      sessions
    ] = await Promise.all([
      this.aiAnalysis.where('agentType').equals(agentType).and(item => item.createdAt >= cutoffDate).count(),
      this.aiAnalysis.where('agentType').equals(agentType).and(item => item.createdAt >= cutoffDate && item.status === 'completed').count(),
      this.aiAnalysis.where('agentType').equals(agentType).and(item => item.createdAt >= cutoffDate && item.status === 'failed').count(),
      this.aiAnalysis.where('agentType').equals(agentType).and(item => item.createdAt >= cutoffDate && item.processingTime).toArray(),
      this.aiImages.where('metadata.captureDate').above(cutoffDate).count(),
      this.aiNotifications.where('agentType').equals(agentType).and(item => item.createdAt >= cutoffDate).count(),
      this.aiErrorLogs.where('agentType').equals(agentType).and(item => item.timestamp >= cutoffDate).count(),
      this.aiSessions.where('agentType').equals(agentType).and(item => item.startTime >= cutoffDate).toArray()
    ]);

    const processingTimes = avgProcessingTime.filter(a => a.processingTime).map(a => a.processingTime!);
    const averageProcessingTime = processingTimes.length > 0 
      ? processingTimes.reduce((sum, time) => sum + time, 0) / processingTimes.length 
      : 0;

    const confidenceScores = avgProcessingTime.filter(a => a.confidence).map(a => a.confidence!);
    const averageConfidence = confidenceScores.length > 0
      ? confidenceScores.reduce((sum, conf) => sum + conf, 0) / confidenceScores.length
      : 0;

    return {
      agentType,
      period: `${days} days`,
      totalAnalyses,
      successfulAnalyses,
      failedAnalyses,
      successRate: totalAnalyses > 0 ? (successfulAnalyses / totalAnalyses) * 100 : 0,
      averageProcessingTime,
      averageConfidence,
      totalImages,
      totalNotifications,
      totalErrors,
      totalSessions: sessions.length,
      completedSessions: sessions.filter(s => s.status === 'completed').length,
      lastUpdated: new Date()
    };
  }

  // Métodos para gestión de notificaciones push

  // Guardar suscripción push
  async savePushSubscription(subscription: Omit<OfflinePushSubscription, 'id'>): Promise<number> {
    // Verificar si ya existe una suscripción para este dispositivo
    const existing = await this.pushSubscriptions
      .where('deviceId')
      .equals(subscription.deviceId)
      .first();

    if (existing) {
      // Actualizar suscripción existente
      await this.pushSubscriptions.update(existing.id!, {
        ...subscription,
        lastActive: new Date()
      });
      return existing.id!;
    } else {
      // Crear nueva suscripción
      return await this.pushSubscriptions.add({
        ...subscription,
        isActive: true
      });
    }
  }

  // Obtener suscripción push activa
  async getPushSubscription(): Promise<OfflinePushSubscription | undefined> {
    return await this.pushSubscriptions
      .where('isActive')
      .equals(true)
      .first();
  }

  // Obtener suscripción por dispositivo
  async getPushSubscriptionByDevice(deviceId: string): Promise<OfflinePushSubscription | undefined> {
    return await this.pushSubscriptions
      .where('deviceId')
      .equals(deviceId)
      .first();
  }

  // Desactivar suscripción push
  async deactivatePushSubscription(deviceId: string): Promise<void> {
    await this.pushSubscriptions
      .where('deviceId')
      .equals(deviceId)
      .modify({ isActive: false });
  }

  // Limpiar suscripción push
  async clearPushSubscription(): Promise<void> {
    await this.pushSubscriptions.clear();
  }

  // Actualizar última actividad de suscripción
  async updatePushSubscriptionActivity(deviceId: string): Promise<void> {
    await this.pushSubscriptions
      .where('deviceId')
      .equals(deviceId)
      .modify({ lastActive: new Date() });
  }

  // Registrar estadística de notificación
  async recordNotificationStat(stat: Omit<OfflineNotificationStats, 'id'>): Promise<number> {
    return await this.notificationStats.add(stat);
  }

  // Obtener estadísticas de notificaciones
  async getNotificationStats(
    agentType?: AgentType,
    type?: 'sent' | 'received' | 'clicked' | 'dismissed',
    days: number = 7
  ): Promise<OfflineNotificationStats[]> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    let query = this.notificationStats.where('timestamp').above(cutoffDate);

    if (agentType) {
      query = query.and(stat => stat.agentType === agentType);
    }

    if (type) {
      query = query.and(stat => stat.type === type);
    }

    return await query.toArray();
  }

  // Obtener resumen de estadísticas de notificaciones
  async getNotificationStatsSummary(days: number = 7): Promise<any> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const stats = await this.notificationStats
      .where('timestamp')
      .above(cutoffDate)
      .toArray();

    const summary = {
      total: stats.length,
      byType: {
        sent: 0,
        received: 0,
        clicked: 0,
        dismissed: 0
      },
      byAgent: {
        phytosanitary: 0,
        predictive: 0,
        rag_assistant: 0,
        optimization: 0
      },
      clickRate: 0,
      dismissRate: 0
    };

    stats.forEach(stat => {
      summary.byType[stat.type]++;
      summary.byAgent[stat.agentType]++;
    });

    const received = summary.byType.received;
    if (received > 0) {
      summary.clickRate = (summary.byType.clicked / received) * 100;
      summary.dismissRate = (summary.byType.dismissed / received) * 100;
    }

    return summary;
  }

  // Limpiar estadísticas antiguas de notificaciones
  async cleanupOldNotificationStats(maxAge: number = 30 * 24 * 60 * 60 * 1000): Promise<number> {
    const cutoffDate = new Date(Date.now() - maxAge);
    return await this.notificationStats
      .where('timestamp')
      .below(cutoffDate)
      .delete();
  }
}

// Instancia global de la base de datos
export const offlineDB = new OfflineDatabase();
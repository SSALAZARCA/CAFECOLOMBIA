import { offlineDB, SyncQueue } from './offlineDB';

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  failedItems: number;
  errors: string[];
}

export interface SyncProgress {
  total: number;
  completed: number;
  current: string;
  percentage: number;
}

export class SyncManager {
  private issyncing = false;
  private syncListeners: ((progress: SyncProgress) => void)[] = [];
  private maxRetries = 3;
  private retryDelay = 1000; // 1 segundo

  constructor() {
    // Escuchar eventos de conexión
    window.addEventListener('connection-restored', this.handleConnectionRestored.bind(this));
    window.addEventListener('force-sync', this.handleForceSync.bind(this));

    // Registrar background sync si está disponible
    this.registerBackgroundSync();
  }

  // Registrar listener para progreso de sincronización
  onSyncProgress(callback: (progress: SyncProgress) => void) {
    this.syncListeners.push(callback);
    return () => {
      const index = this.syncListeners.indexOf(callback);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  // Notificar progreso a todos los listeners
  private notifyProgress(progress: SyncProgress) {
    this.syncListeners.forEach(callback => callback(progress));
  }

  // Manejar restauración de conexión
  public async handleConnectionRestored() {
    console.log('[SyncManager] Connection restored, starting sync...');
    await this.syncAll();
  }

  // Manejar sincronización forzada
  private async handleForceSync() {
    console.log('[SyncManager] Force sync requested...');
    await this.syncAll();
  }

  // Sincronizar todos los datos pendientes
  async syncAll(): Promise<SyncResult> {
    if (this.issyncing) {
      console.log('[SyncManager] Sync already in progress');
      return { success: false, syncedItems: 0, failedItems: 0, errors: ['Sincronización ya en progreso'] };
    }

    if (!navigator.onLine) {
      console.log('[SyncManager] No connection available');
      return { success: false, syncedItems: 0, failedItems: 0, errors: ['Sin conexión a internet'] };
    }

    this.issyncing = true;
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: []
    };

    try {
      const pendingItems = await offlineDB.getPendingSyncItems();
      console.log(`[SyncManager] Found ${pendingItems.length} items to sync`);

      if (pendingItems.length === 0) {
        return result;
      }

      // Agrupar por tabla para optimizar sincronización
      const itemsByTable = this.groupByTable(pendingItems);

      let completed = 0;
      const total = pendingItems.length;

      for (const [table, items] of Object.entries(itemsByTable)) {
        this.notifyProgress({
          total,
          completed,
          current: `Sincronizando ${table}...`,
          percentage: Math.round((completed / total) * 100)
        });

        for (const item of items) {
          try {
            await this.syncItem(item);
            await offlineDB.markSyncComplete(item.id!);
            result.syncedItems++;
            completed++;

            this.notifyProgress({
              total,
              completed,
              current: `Sincronizado ${table}: ${completed}/${total}`,
              percentage: Math.round((completed / total) * 100)
            });
          } catch (error) {
            console.error(`[SyncManager] Failed to sync item ${item.id}:`, error);
            await offlineDB.markSyncFailed(item.id!, error instanceof Error ? error.message : 'Error desconocido');
            result.failedItems++;
            result.errors.push(`${table}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
            completed++;
          }
        }
      }

      // Sincronización completada
      this.notifyProgress({
        total,
        completed: total,
        current: 'Sincronización completada',
        percentage: 100
      });

      // Limpiar elementos con demasiados reintentos
      await this.cleanupOldData();

    } catch (error) {
      console.error('[SyncManager] Sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error de sincronización');
    } finally {
      this.issyncing = false;
    }

    return result;
  }

  // Agrupar elementos por tabla
  private groupByTable(items: SyncQueue[]): Record<string, SyncQueue[]> {
    return items.reduce((groups, item) => {
      if (!groups[item.table]) {
        groups[item.table] = [];
      }
      groups[item.table].push(item);
      return groups;
    }, {} as Record<string, SyncQueue[]>);
  }

  // Sincronizar un elemento individual
  private async syncItem(item: SyncQueue): Promise<void> {
    const { table, action, data } = item;

    switch (table) {
      case 'lots':
        await this.syncLot(action, data);
        break;
      case 'inventory':
        await this.syncInventory(action, data);
        break;
      case 'tasks':
        await this.syncTask(action, data);
        break;
      case 'pestMonitoring':
        await this.syncPestMonitoring(action, data);
        break;
      case 'harvests':
        await this.syncHarvest(action, data);
        break;
      case 'expenses':
        await this.syncExpense(action, data);
        break;
      case 'marketPrices':
        await this.syncMarketPrice(action, data);
        break;
      // Nuevas tablas de IA
      case 'aiImages':
        await this.syncAIImage(action, data);
        break;
      case 'aiAnalysis':
        await this.syncAIAnalysis(action, data);
        break;
      case 'aiNotifications':
        await this.syncAINotification(action, data);
        break;
      default:
        throw new Error(`Tabla no soportada: ${table}`);
    }
  }

  private async syncMarketPrice(action: string, data: any): Promise<void> {
    const endpoint = '/api/market-prices';

    switch (action) {
      case 'create':
        await this.apiRequest('POST', endpoint, {
          ...data,
          coffeeType: 'Standard', // Default values if missing
          region: 'Local'
        });
        break;
      case 'update':
        await this.apiRequest('PUT', `${endpoint}/${data.serverId}`, data);
        break;
      case 'delete':
        await this.apiRequest('DELETE', `${endpoint}/${data.serverId}`);
        break;
    }
  }

  // Métodos de sincronización específicos por tabla
  private async syncLot(action: string, data: any): Promise<void> {
    const endpoint = '/api/lots';

    switch (action) {
      case 'create':
        await this.apiRequest('POST', endpoint, data);
        break;
      case 'update':
        await this.apiRequest('PUT', `${endpoint}/${data.serverId}`, data);
        break;
      case 'delete':
        await this.apiRequest('DELETE', `${endpoint}/${data.serverId}`);
        break;
    }
  }

  private async syncInventory(action: string, data: any): Promise<void> {
    const endpoint = '/api/inventory';

    switch (action) {
      case 'create':
        await this.apiRequest('POST', endpoint, data);
        break;
      case 'update':
        await this.apiRequest('PUT', `${endpoint}/${data.serverId}`, data);
        break;
      case 'delete':
        await this.apiRequest('DELETE', `${endpoint}/${data.serverId}`);
        break;
    }
  }

  private async syncTask(action: string, data: any): Promise<void> {
    const endpoint = '/api/tasks';

    switch (action) {
      case 'create':
        await this.apiRequest('POST', endpoint, data);
        break;
      case 'update':
        await this.apiRequest('PUT', `${endpoint}/${data.serverId}`, data);
        break;
      case 'delete':
        await this.apiRequest('DELETE', `${endpoint}/${data.serverId}`);
        break;
    }
  }

  private async syncPestMonitoring(action: string, data: any): Promise<void> {
    const endpoint = '/api/pests';

    switch (action) {
      case 'create':
        await this.apiRequest('POST', endpoint, data);
        break;
      case 'update':
        await this.apiRequest('PUT', `${endpoint}/${data.serverId}`, data);
        break;
      case 'delete':
        await this.apiRequest('DELETE', `${endpoint}/${data.serverId}`);
        break;
    }
  }

  private async syncHarvest(action: string, data: any): Promise<void> {
    const endpoint = '/api/harvests';

    switch (action) {
      case 'create':
        await this.apiRequest('POST', endpoint, data);
        break;
      case 'update':
        await this.apiRequest('PUT', `${endpoint}/${data.serverId}`, data);
        break;
      case 'delete':
        await this.apiRequest('DELETE', `${endpoint}/${data.serverId}`);
        break;
    }
  }

  private async syncExpense(action: string, data: any): Promise<void> {
    const endpoint = '/api/expenses';

    switch (action) {
      case 'create':
        await this.apiRequest('POST', endpoint, data);
        break;
      case 'update':
        await this.apiRequest('PUT', `${endpoint}/${data.serverId}`, data);
        break;
      case 'delete':
        await this.apiRequest('DELETE', `${endpoint}/${data.serverId}`);
        break;
    }
  }

  // ===== MÉTODOS DE SINCRONIZACIÓN PARA IA =====

  private async syncAIImage(action: string, data: any): Promise<void> {
    const endpoint = '/api/ai/images';

    switch (action) {
      case 'create':
        // Para imágenes, necesitamos enviar como FormData
        const formData = new FormData();
        formData.append('image', data.blob, data.filename);
        formData.append('metadata', JSON.stringify(data.metadata));
        formData.append('analysisStatus', data.analysisStatus);

        await this.apiRequestFormData('POST', endpoint, formData);
        break;
      case 'update':
        // Para actualizaciones, solo enviamos metadatos y resultados
        const updateData = {
          analysisStatus: data.analysisStatus,
          analysisResults: data.analysisResults,
          metadata: data.metadata
        };
        await this.apiRequest('PUT', `${endpoint}/${data.serverId}`, updateData);
        break;
      case 'delete':
        await this.apiRequest('DELETE', `${endpoint}/${data.serverId}`);
        break;
    }
  }

  private async syncAIAnalysis(action: string, data: any): Promise<void> {
    const endpoint = '/api/ai/analysis';

    switch (action) {
      case 'create':
        await this.apiRequest('POST', endpoint, data);
        break;
      case 'update':
        await this.apiRequest('PUT', `${endpoint}/${data.serverId}`, data);
        break;
      case 'delete':
        await this.apiRequest('DELETE', `${endpoint}/${data.serverId}`);
        break;
    }
  }

  private async syncAINotification(action: string, data: any): Promise<void> {
    const endpoint = '/api/ai/notifications';

    switch (action) {
      case 'create':
        await this.apiRequest('POST', endpoint, data);
        break;
      case 'update':
        await this.apiRequest('PUT', `${endpoint}/${data.serverId}`, data);
        break;
      case 'delete':
        await this.apiRequest('DELETE', `${endpoint}/${data.serverId}`);
        break;
    }
  }

  // Realizar petición a la API con reintentos
  private async apiRequest(method: string, url: string, data?: any): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const options: RequestInit = {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
        };

        if (data && method !== 'GET' && method !== 'DELETE') {
          options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return method !== 'DELETE' ? await response.json() : null;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido');

        // Silenciar errores de conexión en modo desarrollo
        const isDevelopment = import.meta.env.DEV;
        const isConnectionError = error instanceof Error && (
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.name === 'TypeError'
        );
        const isApiUrl = url.includes('/api/');

        if (isDevelopment && isConnectionError && isApiUrl) {
          // Silent failure in development mode for API connections
          throw new Error('Service unavailable in development mode');
        }

        if (attempt < this.maxRetries) {
          if (!isDevelopment || !isConnectionError || !isApiUrl) {
            console.log(`[SyncManager] Attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
          }
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError!;
  }

  // Realizar petición con FormData (para imágenes)
  private async apiRequestFormData(method: string, url: string, formData: FormData): Promise<any> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const options: RequestInit = {
          method,
          body: formData,
          // No establecer Content-Type para FormData, el navegador lo hace automáticamente
        };

        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return await response.json();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Error desconocido');

        if (attempt < this.maxRetries) {
          console.log(`[SyncManager] FormData attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * attempt));
        }
      }
    }

    throw lastError!;
  }

  // Limpiar elementos antiguos de la cola (más de 30 días)
  private async cleanupOldData(): Promise<void> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const oldQueueItems = await offlineDB.syncQueue
      .where('timestamp')
      .below(thirtyDaysAgo)
      .toArray();

    if (oldQueueItems.length > 0) {
      console.log(`[SyncManager] Cleaning up ${oldQueueItems.length} old sync queue items`);
      for (const item of oldQueueItems) {
        await offlineDB.syncQueue.delete(item.id!);
      }
    }
  }

  // Registrar background sync
  public async registerBackgroundSync(): Promise<void> {
    // Skip background sync registration in development mode
    const isDevelopment = import.meta.env.DEV;
    if (isDevelopment) {
      console.log('[SyncManager] Background sync disabled in development mode');
      return;
    }

    if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('background-sync');
        console.log('[SyncManager] Background sync registered');
      } catch (error) {
        // Silently handle background sync registration failures
        console.warn('[SyncManager] Background sync not available:', error.message);
      }
    } else {
      console.log('[SyncManager] Background sync not supported by browser');
    }
  }

  // Obtener estado de sincronización
  async getSyncStatus() {
    const pendingItems = await offlineDB.getPendingSyncItems();
    const failedItems = pendingItems.filter(item => item.retries > 0);

    return {
      issyncing: this.issyncing,
      pendingItems: pendingItems.length,
      failedItems: failedItems.length,
      lastSync: await offlineDB.getSetting('lastSyncTime')
    };
  }

  // Marcar tiempo de última sincronización
  async markLastSync(): Promise<void> {
    await offlineDB.setSetting('lastSyncTime', new Date().toISOString());
  }

  // Limpiar cola de sincronización
  async clearSyncQueue(): Promise<void> {
    await offlineDB.syncQueue.clear();
    console.log('[SyncManager] Sync queue cleared');
  }

  // ===== MÉTODOS ESPECÍFICOS PARA SINCRONIZACIÓN DE IA =====

  // Sincronizar solo datos de IA
  async syncAIData(): Promise<SyncResult> {
    if (this.issyncing) {
      console.log('[SyncManager] Sync already in progress');
      return { success: false, syncedItems: 0, failedItems: 0, errors: ['Sincronización ya en progreso'] };
    }

    if (!navigator.onLine) {
      console.log('[SyncManager] No connection available');
      return { success: false, syncedItems: 0, failedItems: 0, errors: ['Sin conexión a internet'] };
    }

    this.issyncing = true;
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: []
    };

    try {
      const pendingItems = await offlineDB.getPendingSyncItems();
      const aiItems = pendingItems.filter(item =>
        ['aiImages', 'aiAnalysis', 'aiNotifications'].includes(item.table)
      );

      console.log(`[SyncManager] Found ${aiItems.length} AI items to sync`);

      if (aiItems.length === 0) {
        return result;
      }

      // Priorizar elementos críticos primero
      const prioritizedItems = this.prioritizeAIItems(aiItems);

      let completed = 0;
      const total = prioritizedItems.length;

      for (const item of prioritizedItems) {
        this.notifyProgress({
          total,
          completed,
          current: `Sincronizando IA: ${item.table}...`,
          percentage: Math.round((completed / total) * 100)
        });

        try {
          await this.syncItem(item);
          await offlineDB.markSyncComplete(item.id!);
          result.syncedItems++;
          completed++;

          this.notifyProgress({
            total,
            completed,
            current: `Sincronizado IA: ${completed}/${total}`,
            percentage: Math.round((completed / total) * 100)
          });
        } catch (error) {
          console.error(`[SyncManager] Failed to sync AI item ${item.id}:`, error);
          await offlineDB.markSyncFailed(item.id!, error instanceof Error ? error.message : 'Error desconocido');
          result.failedItems++;
          result.errors.push(`${item.table}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
          completed++;
        }
      }

      // Sincronización de IA completada
      this.notifyProgress({
        total,
        completed: total,
        current: 'Sincronización de IA completada',
        percentage: 100
      });

      await this.markLastAISync();

    } catch (error) {
      console.error('[SyncManager] AI sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error de sincronización de IA');
    } finally {
      this.issyncing = false;
    }

    return result;
  }

  // Priorizar elementos de IA por importancia
  private prioritizeAIItems(items: SyncQueue[]): SyncQueue[] {
    return items.sort((a, b) => {
      // Prioridad por tipo de tabla
      const tablePriority = {
        'aiNotifications': 3, // Más alta prioridad
        'aiAnalysis': 2,
        'aiImages': 1
      };

      const aPriority = tablePriority[a.table as keyof typeof tablePriority] || 0;
      const bPriority = tablePriority[b.table as keyof typeof tablePriority] || 0;

      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }

      // Prioridad por metadatos específicos
      const aData = a.data || {};
      const bData = b.data || {};

      // Priorizar elementos críticos o de alta prioridad
      if (aData.priority === 'critical' && bData.priority !== 'critical') return -1;
      if (bData.priority === 'critical' && aData.priority !== 'critical') return 1;
      if (aData.priority === 'high' && bData.priority !== 'high') return -1;
      if (bData.priority === 'high' && aData.priority !== 'high') return 1;

      // Priorizar por timestamp (más recientes primero)
      const aTime = new Date(aData.timestamp || aData.createdAt || 0).getTime();
      const bTime = new Date(bData.timestamp || bData.createdAt || 0).getTime();
      return bTime - aTime;
    });
  }

  // Sincronizar imágenes por lotes para optimizar rendimiento
  async syncAIImagesBatch(batchSize: number = 5): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: []
    };

    try {
      const pendingImages = await offlineDB.getAIImagesByStatus('pending');
      console.log(`[SyncManager] Found ${pendingImages.length} pending AI images for batch sync`);

      // Procesar en lotes
      for (let i = 0; i < pendingImages.length; i += batchSize) {
        const batch = pendingImages.slice(i, i + batchSize);

        // Procesar lote en paralelo
        const batchPromises = batch.map(async (image) => {
          try {
            await this.syncAIImage('create', image);
            await offlineDB.aiImages.update(image.id!, { syncStatus: 'synced' });
            return { success: true, image };
          } catch (error) {
            console.error(`[SyncManager] Failed to sync image ${image.id}:`, error);
            await offlineDB.aiImages.update(image.id!, { syncStatus: 'failed' });
            return { success: false, image, error };
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);

        batchResults.forEach((promiseResult, index) => {
          if (promiseResult.status === 'fulfilled') {
            const { success } = promiseResult.value;
            if (success) {
              result.syncedItems++;
            } else {
              result.failedItems++;
              result.errors.push(`Image ${batch[index].filename}: ${promiseResult.value.error}`);
            }
          } else {
            result.failedItems++;
            result.errors.push(`Image ${batch[index].filename}: ${promiseResult.reason}`);
          }
        });

        // Pausa entre lotes para no sobrecargar el servidor
        if (i + batchSize < pendingImages.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

    } catch (error) {
      console.error('[SyncManager] Failed to sync AI images batch:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error al sincronizar lote de imágenes');
    }

    return result;
  }

  // Sincronizar análisis con validación de integridad
  async syncAIAnalysisWithValidation(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: []
    };

    try {
      const pendingAnalysis = await offlineDB.aiAnalysis
        .where('syncStatus')
        .equals('pending')
        .toArray();

      console.log(`[SyncManager] Found ${pendingAnalysis.length} pending AI analysis for validation sync`);

      for (const analysis of pendingAnalysis) {
        try {
          // Validar integridad del análisis antes de sincronizar
          const validationResult = await this.validateAIAnalysis(analysis);

          if (!validationResult.isValid) {
            result.failedItems++;
            result.errors.push(`Analysis ${analysis.id}: ${validationResult.errors.join(', ')}`);
            continue;
          }

          // Sincronizar análisis validado
          await this.syncAIAnalysis('create', analysis);
          await offlineDB.aiAnalysis.update(analysis.id!, { syncStatus: 'synced' });
          result.syncedItems++;

        } catch (error) {
          console.error(`[SyncManager] Failed to sync analysis ${analysis.id}:`, error);
          await offlineDB.aiAnalysis.update(analysis.id!, { syncStatus: 'failed' });
          result.failedItems++;
          result.errors.push(`Analysis ${analysis.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

    } catch (error) {
      console.error('[SyncManager] Failed to sync AI analysis with validation:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error al sincronizar análisis con validación');
    }

    return result;
  }

  // Validar integridad de un análisis de IA
  private async validateAIAnalysis(analysis: any): Promise<{ isValid: boolean; errors: string[] }> {
    const errors: string[] = [];

    // Validar campos requeridos
    if (!analysis.imageId) {
      errors.push('Missing imageId');
    }

    if (!analysis.agentType) {
      errors.push('Missing agentType');
    }

    if (!analysis.results || typeof analysis.results !== 'object') {
      errors.push('Missing or invalid results');
    }

    // Validar que la imagen asociada existe
    if (analysis.imageId) {
      const associatedImage = await offlineDB.aiImages.get(analysis.imageId);
      if (!associatedImage) {
        errors.push('Associated image not found');
      }
    }

    // Validar estructura de resultados según el tipo de agente
    if (analysis.results && analysis.agentType) {
      const structureValidation = this.validateAnalysisResultsStructure(analysis.agentType, analysis.results);
      if (!structureValidation.isValid) {
        errors.push(...structureValidation.errors);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Validar estructura de resultados según el tipo de agente
  private validateAnalysisResultsStructure(agentType: string, results: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (agentType) {
      case 'phytosanitary':
        if (!results.pestDetection) errors.push('Missing pestDetection in phytosanitary results');
        if (!results.diseaseDetection) errors.push('Missing diseaseDetection in phytosanitary results');
        if (!results.recommendations) errors.push('Missing recommendations in phytosanitary results');
        break;

      case 'predictive':
        if (!results.predictions) errors.push('Missing predictions in predictive results');
        if (!results.confidence) errors.push('Missing confidence in predictive results');
        if (!results.timeframe) errors.push('Missing timeframe in predictive results');
        break;

      case 'rag_assistant':
        if (!results.response) errors.push('Missing response in RAG assistant results');
        if (!results.sources) errors.push('Missing sources in RAG assistant results');
        if (!results.relevanceScore) errors.push('Missing relevanceScore in RAG assistant results');
        break;

      case 'optimization':
        if (!results.optimizations) errors.push('Missing optimizations in optimization results');
        if (!results.metrics) errors.push('Missing metrics in optimization results');
        if (!results.recommendations) errors.push('Missing recommendations in optimization results');
        break;

      default:
        errors.push(`Unknown agent type: ${agentType}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Sincronizar notificaciones con filtrado inteligente
  async syncAINotificationsFiltered(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: []
    };

    try {
      const pendingNotifications = await offlineDB.aiNotifications
        .where('syncStatus')
        .equals('pending')
        .toArray();

      console.log(`[SyncManager] Found ${pendingNotifications.length} pending AI notifications for filtered sync`);

      // Filtrar notificaciones duplicadas o obsoletas
      const filteredNotifications = await this.filterNotifications(pendingNotifications);

      console.log(`[SyncManager] After filtering: ${filteredNotifications.length} notifications to sync`);

      for (const notification of filteredNotifications) {
        try {
          await this.syncAINotification('create', notification);
          await offlineDB.aiNotifications.update(notification.id!, { syncStatus: 'synced' });
          result.syncedItems++;

        } catch (error) {
          console.error(`[SyncManager] Failed to sync notification ${notification.id}:`, error);
          await offlineDB.aiNotifications.update(notification.id!, { syncStatus: 'failed' });
          result.failedItems++;
          result.errors.push(`Notification ${notification.id}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }

    } catch (error) {
      console.error('[SyncManager] Failed to sync AI notifications filtered:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error al sincronizar notificaciones filtradas');
    }

    return result;
  }

  // Filtrar notificaciones para evitar duplicados y obsoletas
  private async filterNotifications(notifications: any[]): Promise<any[]> {
    const filtered: any[] = [];
    const seen = new Set<string>();

    // Ordenar por timestamp (más recientes primero)
    const sorted = notifications.sort((a, b) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    for (const notification of sorted) {
      // Crear clave única basada en tipo, agente y contenido
      const key = `${notification.type}-${notification.agentType}-${notification.title}`;

      // Evitar duplicados
      if (seen.has(key)) {
        console.log(`[SyncManager] Skipping duplicate notification: ${key}`);
        continue;
      }

      // Evitar notificaciones muy antiguas (más de 30 días)
      const notificationAge = Date.now() - new Date(notification.timestamp).getTime();
      const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 días en milisegundos

      if (notificationAge > maxAge) {
        console.log(`[SyncManager] Skipping old notification: ${notification.id}`);
        continue;
      }

      seen.add(key);
      filtered.push(notification);
    }

    return filtered;
  }

  // Obtener métricas detalladas de sincronización de IA
  async getDetailedAISyncMetrics(): Promise<{
    overview: any;
    byAgent: any;
    performance: any;
    errors: any;
  }> {
    try {
      const pendingItems = await offlineDB.getPendingSyncItems();
      const aiItems = pendingItems.filter(item =>
        ['aiImages', 'aiAnalysis', 'aiNotifications'].includes(item.table)
      );

      const aiStats = await offlineDB.getAIStats();
      const lastSync = await offlineDB.getSetting('lastAISyncTime');

      // Métricas por agente
      const agentMetrics = {
        phytosanitary: await this.getAgentSyncMetrics('phytosanitary'),
        predictive: await this.getAgentSyncMetrics('predictive'),
        rag_assistant: await this.getAgentSyncMetrics('rag_assistant'),
        optimization: await this.getAgentSyncMetrics('optimization')
      };

      // Métricas de rendimiento
      const performanceMetrics = await this.getSyncPerformanceMetrics();

      // Análisis de errores
      const errorAnalysis = await this.getSyncErrorAnalysis();

      return {
        overview: {
          issyncing: this.issyncing,
          pendingAIItems: aiItems.length,
          pendingImages: aiStats.pendingImages,
          pendingAnalysis: aiStats.pendingAnalysis,
          unreadNotifications: aiStats.unreadNotifications,
          lastSync,
          syncHealth: this.calculateSyncHealth(aiItems.length, performanceMetrics.errorRate)
        },
        byAgent: agentMetrics,
        performance: performanceMetrics,
        errors: errorAnalysis
      };

    } catch (error) {
      console.error('[SyncManager] Failed to get detailed AI sync metrics:', error);
      throw error;
    }
  }

  // Obtener métricas de sincronización por agente
  private async getAgentSyncMetrics(agentType: string): Promise<any> {
    try {
      const pendingAnalysis = await offlineDB.aiAnalysis
        .where('agentType')
        .equals(agentType)
        .and(item => item.syncStatus === 'pending')
        .count();

      const syncedAnalysis = await offlineDB.aiAnalysis
        .where('agentType')
        .equals(agentType)
        .and(item => item.syncStatus === 'synced')
        .count();

      const failedAnalysis = await offlineDB.aiAnalysis
        .where('agentType')
        .equals(agentType)
        .and(item => item.syncStatus === 'failed')
        .count();

      const total = pendingAnalysis + syncedAnalysis + failedAnalysis;
      const successRate = total > 0 ? (syncedAnalysis / total) * 100 : 100;

      return {
        pending: pendingAnalysis,
        synced: syncedAnalysis,
        failed: failedAnalysis,
        total,
        successRate: Math.round(successRate * 100) / 100
      };

    } catch (error) {
      console.error(`[SyncManager] Failed to get metrics for agent ${agentType}:`, error);
      return {
        pending: 0,
        synced: 0,
        failed: 0,
        total: 0,
        successRate: 0
      };
    }
  }

  // Obtener métricas de rendimiento de sincronización
  private async getSyncPerformanceMetrics(): Promise<any> {
    try {
      // Simular métricas de rendimiento (en implementación real, usar datos históricos)
      const avgSyncTime = 2500; // ms
      const errorRate = 5; // %
      const throughput = 10; // items/min

      return {
        averageSyncTime: avgSyncTime,
        errorRate,
        throughput,
        lastSyncDuration: avgSyncTime,
        peakHours: ['09:00', '14:00', '18:00'],
        optimalBatchSize: 5
      };

    } catch (error) {
      console.error('[SyncManager] Failed to get sync performance metrics:', error);
      return {
        averageSyncTime: 0,
        errorRate: 0,
        throughput: 0,
        lastSyncDuration: 0,
        peakHours: [],
        optimalBatchSize: 1
      };
    }
  }

  // Obtener análisis de errores de sincronización
  private async getSyncErrorAnalysis(): Promise<any> {
    try {
      const failedItems = await offlineDB.syncQueue
        .where('retries')
        .above(0)
        .toArray();

      const errorsByType = failedItems.reduce((acc, item) => {
        const errorType = this.categorizeError(item.lastError || 'Unknown error');
        acc[errorType] = (acc[errorType] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostCommonError = Object.entries(errorsByType)
        .sort(([, a], [, b]) => b - a)[0];

      return {
        totalErrors: failedItems.length,
        errorsByType,
        mostCommonError: mostCommonError ? mostCommonError[0] : 'None',
        recentErrors: failedItems
          .sort((a, b) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
          .slice(0, 5)
          .map(item => ({
            table: item.table,
            error: item.lastError,
            timestamp: item.timestamp,
            retries: item.retries
          }))
      };

    } catch (error) {
      console.error('[SyncManager] Failed to get sync error analysis:', error);
      return {
        totalErrors: 0,
        errorsByType: {},
        mostCommonError: 'None',
        recentErrors: []
      };
    }
  }

  // Categorizar errores para análisis
  private categorizeError(errorMessage: string): string {
    const message = errorMessage.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'Network Error';
    } else if (message.includes('timeout')) {
      return 'Timeout Error';
    } else if (message.includes('401') || message.includes('unauthorized')) {
      return 'Authentication Error';
    } else if (message.includes('403') || message.includes('forbidden')) {
      return 'Permission Error';
    } else if (message.includes('404') || message.includes('not found')) {
      return 'Not Found Error';
    } else if (message.includes('500') || message.includes('server')) {
      return 'Server Error';
    } else if (message.includes('validation') || message.includes('invalid')) {
      return 'Validation Error';
    } else {
      return 'Unknown Error';
    }
  }

  // Calcular salud general de la sincronización
  private calculateSyncHealth(pendingItems: number, errorRate: number): 'excellent' | 'good' | 'fair' | 'poor' {
    if (pendingItems === 0 && errorRate < 2) {
      return 'excellent';
    } else if (pendingItems < 5 && errorRate < 5) {
      return 'good';
    } else if (pendingItems < 20 && errorRate < 10) {
      return 'fair';
    } else {
      return 'poor';
    }
  }

  // Sincronizar imágenes pendientes de análisis (método original mejorado)
  async syncPendingAIImages(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: []
    };

    try {
      const pendingImages = await offlineDB.getAIImagesByStatus('pending');
      console.log(`[SyncManager] Found ${pendingImages.length} pending AI images`);

      for (const image of pendingImages) {
        try {
          // Agregar a la cola de sincronización si no está ya
          await offlineDB.addToSyncQueue('aiImages', image.id!, 'create', image);
          result.syncedItems++;
        } catch (error) {
          console.error(`[SyncManager] Failed to queue AI image ${image.id}:`, error);
          result.failedItems++;
          result.errors.push(`Image ${image.filename}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
        }
      }
    } catch (error) {
      console.error('[SyncManager] Failed to sync pending AI images:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error al sincronizar imágenes de IA');
    }

    return result;
  }

  // Obtener estadísticas de sincronización de IA
  async getAISyncStatus() {
    const pendingItems = await offlineDB.getPendingSyncItems();
    const aiItems = pendingItems.filter(item =>
      ['aiImages', 'aiAnalysis', 'aiNotifications'].includes(item.table)
    );

    const aiStats = await offlineDB.getAIStats();

    return {
      issyncing: this.issyncing,
      pendingAIItems: aiItems.length,
      pendingImages: aiStats.pendingImages,
      pendingAnalysis: aiStats.pendingAnalysis,
      unreadNotifications: aiStats.unreadNotifications,
      lastSync: await offlineDB.getSetting('lastAISyncTime')
    };
  }

  // Marcar tiempo de última sincronización de IA
  async markLastAISync(): Promise<void> {
    await offlineDB.setSetting('lastAISyncTime', new Date().toISOString());
  }

  // Forzar sincronización de un análisis específico
  async forceSyncAIAnalysis(analysisId: number): Promise<boolean> {
    try {
      const analysis = await offlineDB.aiAnalysis.get(analysisId);
      if (!analysis) {
        throw new Error('Análisis no encontrado');
      }

      await offlineDB.addToSyncQueue('aiAnalysis', analysisId, 'update', analysis);

      // Intentar sincronizar inmediatamente si hay conexión
      if (navigator.onLine) {
        await this.syncAIData();
      }

      return true;
    } catch (error) {
      console.error(`[SyncManager] Failed to force sync AI analysis ${analysisId}:`, error);
      return false;
    }
  }

  // Priorizar sincronización de elementos críticos de IA
  async prioritizeAISync(): Promise<void> {
    try {
      // Obtener elementos de alta prioridad
      const highPriorityAnalysis = await offlineDB.aiAnalysis
        .where('priority')
        .equals('high')
        .and(item => item.status === 'pending')
        .toArray();

      // Agregar a la cola con prioridad
      for (const analysis of highPriorityAnalysis) {
        await offlineDB.addToSyncQueue('aiAnalysis', analysis.id!, 'create', analysis);
      }

      // Sincronizar inmediatamente si hay conexión
      if (navigator.onLine && !this.issyncing) {
        await this.syncAIData();
      }
    } catch (error) {
      console.error('[SyncManager] Failed to prioritize AI sync:', error);
    }
  }

  // Método para sincronización inteligente basada en contexto
  async smartAISync(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: []
    };

    try {
      // Determinar estrategia de sincronización basada en el contexto
      const connectionType = this.getConnectionType();
      const batteryLevel = await this.getBatteryLevel();
      const currentTime = new Date().getHours();

      // Ajustar estrategia según las condiciones
      let strategy: 'aggressive' | 'balanced' | 'conservative' = 'balanced';

      if (connectionType === 'wifi' && batteryLevel > 50) {
        strategy = 'aggressive';
      } else if (connectionType === 'cellular' || batteryLevel < 20) {
        strategy = 'conservative';
      }

      console.log(`[SyncManager] Using ${strategy} sync strategy`);

      switch (strategy) {
        case 'aggressive':
          // Sincronizar todo en paralelo
          const [imagesResult, analysisResult, notificationsResult] = await Promise.allSettled([
            this.syncAIImagesBatch(10),
            this.syncAIAnalysisWithValidation(),
            this.syncAINotificationsFiltered()
          ]);

          this.consolidateResults(result, [imagesResult, analysisResult, notificationsResult]);
          break;

        case 'conservative':
          // Sincronizar solo elementos críticos
          const criticalResult = await this.syncCriticalAIData();
          this.consolidateResults(result, [{ status: 'fulfilled', value: criticalResult }]);
          break;

        case 'balanced':
        default:
          // Sincronización estándar con priorización
          const balancedResult = await this.syncAIData();
          this.consolidateResults(result, [{ status: 'fulfilled', value: balancedResult }]);
          break;
      }

    } catch (error) {
      console.error('[SyncManager] Smart AI sync failed:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error en sincronización inteligente');
    }

    return result;
  }

  // Sincronizar solo datos críticos de IA
  private async syncCriticalAIData(): Promise<SyncResult> {
    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      failedItems: 0,
      errors: []
    };

    try {
      // Obtener solo notificaciones críticas
      const criticalNotifications = await offlineDB.aiNotifications
        .where('priority')
        .equals('critical')
        .and(item => item.syncStatus === 'pending')
        .toArray();

      // Obtener análisis de alta prioridad
      const highPriorityAnalysis = await offlineDB.aiAnalysis
        .where('priority')
        .equals('high')
        .and(item => item.syncStatus === 'pending')
        .toArray();

      // Sincronizar notificaciones críticas
      for (const notification of criticalNotifications) {
        try {
          await this.syncAINotification('create', notification);
          await offlineDB.updateAINotificationStatus(notification.id!, 'synced');
          result.syncedItems++;
        } catch (error) {
          result.failedItems++;
          result.errors.push(`Critical notification ${notification.id}: ${error}`);
        }
      }

      // Sincronizar análisis de alta prioridad
      for (const analysis of highPriorityAnalysis) {
        try {
          await this.syncAIAnalysis('create', analysis);
          await offlineDB.updateAIAnalysisStatus(analysis.id!, 'synced');
          result.syncedItems++;
        } catch (error) {
          result.failedItems++;
          result.errors.push(`High priority analysis ${analysis.id}: ${error}`);
        }
      }

    } catch (error) {
      console.error('[SyncManager] Failed to sync critical AI data:', error);
      result.success = false;
      result.errors.push(error instanceof Error ? error.message : 'Error al sincronizar datos críticos');
    }

    return result;
  }

  // Consolidar resultados de múltiples operaciones de sincronización
  private consolidateResults(mainResult: SyncResult, results: PromiseSettledResult<SyncResult>[]): void {
    results.forEach(result => {
      if (result.status === 'fulfilled') {
        const syncResult = result.value;
        mainResult.syncedItems += syncResult.syncedItems;
        mainResult.failedItems += syncResult.failedItems;
        mainResult.errors.push(...syncResult.errors);
        if (!syncResult.success) {
          mainResult.success = false;
        }
      } else {
        mainResult.success = false;
        mainResult.errors.push(`Operation failed: ${result.reason}`);
      }
    });
  }

  // Obtener tipo de conexión
  private getConnectionType(): 'wifi' | 'cellular' | 'unknown' {
    const connection = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    if (connection) {
      return connection.type === 'wifi' ? 'wifi' : 'cellular';
    }

    return 'unknown';
  }

  // Obtener nivel de batería
  private async getBatteryLevel(): Promise<number> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return battery.level * 100;
      }
    } catch (error) {
      console.warn('[SyncManager] Battery API not available:', error);
    }

    return 100; // Asumir batería completa si no se puede obtener
  }

  // Programar sincronización automática inteligente
  scheduleSmartSync(intervalMinutes: number = 30): void {
    // Limpiar intervalo anterior si existe
    if ((this as any).smartSyncInterval) {
      clearInterval((this as any).smartSyncInterval);
    }

    // Configurar nuevo intervalo
    (this as any).smartSyncInterval = setInterval(async () => {
      if (navigator.onLine && !this.issyncing) {
        console.log('[SyncManager] Running scheduled smart sync...');
        await this.smartAISync();
      }
    }, intervalMinutes * 60 * 1000);

    console.log(`[SyncManager] Smart sync scheduled every ${intervalMinutes} minutes`);
  }

  // Detener sincronización automática
  stopScheduledSync(): void {
    if ((this as any).smartSyncInterval) {
      clearInterval((this as any).smartSyncInterval);
      (this as any).smartSyncInterval = null;
      console.log('[SyncManager] Scheduled sync stopped');
    }
  }
}

// Instancia global del gestor de sincronización
export const syncManager = new SyncManager();
// Servicio para gestión de cola offline de análisis fitosanitario
import { offlineDB } from '../utils/offlineDB';
import { diseaseDetectionService } from './diseaseDetectionService';
import { useAINotifications } from '../hooks/useAINotifications';
import { 
  PhytosanitaryAnalysisRequest, 
  PhytosanitaryAnalysisResult 
} from '../types/phytosanitary';

export interface QueuedAnalysis {
  id: string;
  request: PhytosanitaryAnalysisRequest;
  imageBlob: Blob;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
  processedAt?: Date;
  result?: PhytosanitaryAnalysisResult;
  error?: string;
  retryCount: number;
  maxRetries: number;
}

class OfflineAnalysisQueue {
  private queue: QueuedAnalysis[] = [];
  private isProcessing = false;
  private processingInterval: NodeJS.Timeout | null = null;
  private maxConcurrentAnalysis = 2;
  private currentProcessing = 0;

  constructor() {
    this.loadQueueFromStorage();
    this.startProcessingLoop();
    
    // Escuchar cambios de conectividad
    window.addEventListener('online', () => {
      console.log('Conexión restaurada - procesando cola de análisis');
      this.processQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Conexión perdida - pausando procesamiento');
      this.pauseProcessing();
    });
  }

  // Agregar análisis a la cola
  async addToQueue(
    request: PhytosanitaryAnalysisRequest,
    imageBlob: Blob,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'MEDIUM'
  ): Promise<string> {
    const queuedAnalysis: QueuedAnalysis = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      request,
      imageBlob,
      status: 'PENDING',
      priority,
      createdAt: new Date(),
      retryCount: 0,
      maxRetries: 3
    };

    // Agregar a la cola en memoria
    this.queue.push(queuedAnalysis);
    
    // Ordenar por prioridad
    this.sortQueueByPriority();

    // Guardar en almacenamiento local
    await this.saveQueueToStorage();

    // Intentar procesar inmediatamente si hay conexión
    if (navigator.onLine) {
      this.processQueue();
    }

    console.log(`Análisis agregado a la cola: ${queuedAnalysis.id} (Prioridad: ${priority})`);
    return queuedAnalysis.id;
  }

  // Obtener estado de la cola
  getQueueStatus(): {
    total: number;
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    byPriority: Record<string, number>;
  } {
    const total = this.queue.length;
    const pending = this.queue.filter(item => item.status === 'PENDING').length;
    const processing = this.queue.filter(item => item.status === 'PROCESSING').length;
    const completed = this.queue.filter(item => item.status === 'COMPLETED').length;
    const failed = this.queue.filter(item => item.status === 'FAILED').length;

    const byPriority = this.queue.reduce((acc, item) => {
      acc[item.priority] = (acc[item.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      pending,
      processing,
      completed,
      failed,
      byPriority
    };
  }

  // Obtener análisis por ID
  getAnalysisById(id: string): QueuedAnalysis | undefined {
    return this.queue.find(item => item.id === id);
  }

  // Obtener resultado de análisis
  getAnalysisResult(id: string): PhytosanitaryAnalysisResult | undefined {
    const analysis = this.getAnalysisById(id);
    return analysis?.result;
  }

  // Procesar cola
  private async processQueue(): Promise<void> {
    if (this.isProcessing || !navigator.onLine) {
      return;
    }

    this.isProcessing = true;

    try {
      const pendingItems = this.queue
        .filter(item => item.status === 'PENDING')
        .slice(0, this.maxConcurrentAnalysis - this.currentProcessing);

      if (pendingItems.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`Procesando ${pendingItems.length} análisis de la cola`);

      // Procesar elementos en paralelo
      const processingPromises = pendingItems.map(item => this.processAnalysis(item));
      await Promise.allSettled(processingPromises);

      // Guardar estado actualizado
      await this.saveQueueToStorage();

      // Limpiar elementos completados antiguos (más de 24 horas)
      await this.cleanupOldItems();

    } catch (error) {
      console.error('Error procesando cola de análisis:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Procesar un análisis individual
  private async processAnalysis(queuedAnalysis: QueuedAnalysis): Promise<void> {
    try {
      // Marcar como procesando
      queuedAnalysis.status = 'PROCESSING';
      this.currentProcessing++;

      console.log(`Procesando análisis: ${queuedAnalysis.id}`);

      // Ejecutar análisis
      const result = await diseaseDetectionService.analyzeImage(queuedAnalysis.request);

      // Marcar como completado
      queuedAnalysis.status = 'COMPLETED';
      queuedAnalysis.result = result;
      queuedAnalysis.processedAt = new Date();

      console.log(`Análisis completado: ${queuedAnalysis.id}`);

      // Notificar resultado si hay detecciones críticas
      if (result.detections.length > 0) {
        const criticalDetections = result.detections.filter(d => 
          d.severity === 'CRITICAL' || d.severity === 'VERY_HIGH'
        );
        
        if (criticalDetections.length > 0) {
          // Aquí se podría enviar una notificación push
          console.log(`Detecciones críticas encontradas en análisis ${queuedAnalysis.id}`);
        }
      }

    } catch (error) {
      console.error(`Error procesando análisis ${queuedAnalysis.id}:`, error);
      
      queuedAnalysis.retryCount++;
      
      if (queuedAnalysis.retryCount >= queuedAnalysis.maxRetries) {
        queuedAnalysis.status = 'FAILED';
        queuedAnalysis.error = error instanceof Error ? error.message : 'Error desconocido';
      } else {
        queuedAnalysis.status = 'PENDING';
        console.log(`Reintentando análisis ${queuedAnalysis.id} (${queuedAnalysis.retryCount}/${queuedAnalysis.maxRetries})`);
      }
    } finally {
      this.currentProcessing--;
    }
  }

  // Ordenar cola por prioridad
  private sortQueueByPriority(): void {
    const priorityOrder = { 'CRITICAL': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    
    this.queue.sort((a, b) => {
      // Primero por prioridad
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Luego por fecha de creación (más antiguos primero)
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  // Iniciar bucle de procesamiento
  private startProcessingLoop(): void {
    this.processingInterval = setInterval(() => {
      if (navigator.onLine && !this.isProcessing) {
        this.processQueue();
      }
    }, 30000); // Verificar cada 30 segundos
  }

  // Pausar procesamiento
  private pauseProcessing(): void {
    this.isProcessing = false;
    this.currentProcessing = 0;
  }

  // Guardar cola en almacenamiento local
  private async saveQueueToStorage(): Promise<void> {
    try {
      // Convertir blobs a base64 para almacenamiento
      const queueForStorage = await Promise.all(
        this.queue.map(async (item) => {
          const imageBase64 = await this.blobToBase64(item.imageBlob);
          return {
            ...item,
            imageBlob: imageBase64,
            createdAt: item.createdAt.toISOString(),
            processedAt: item.processedAt?.toISOString()
          };
        })
      );

      localStorage.setItem('phytosanitary_analysis_queue', JSON.stringify(queueForStorage));
    } catch (error) {
      console.error('Error guardando cola en almacenamiento:', error);
    }
  }

  // Cargar cola desde almacenamiento local
  private async loadQueueFromStorage(): Promise<void> {
    try {
      const storedQueue = localStorage.getItem('phytosanitary_analysis_queue');
      if (!storedQueue) return;

      const queueData = JSON.parse(storedQueue);
      
      // Convertir base64 de vuelta a blobs
      this.queue = await Promise.all(
        queueData.map(async (item: any) => {
          const imageBlob = await this.base64ToBlob(item.imageBlob);
          return {
            ...item,
            imageBlob,
            createdAt: new Date(item.createdAt),
            processedAt: item.processedAt ? new Date(item.processedAt) : undefined
          };
        })
      );

      // Resetear elementos que estaban procesando
      this.queue.forEach(item => {
        if (item.status === 'PROCESSING') {
          item.status = 'PENDING';
        }
      });

      console.log(`Cola cargada desde almacenamiento: ${this.queue.length} elementos`);
    } catch (error) {
      console.error('Error cargando cola desde almacenamiento:', error);
      this.queue = [];
    }
  }

  // Limpiar elementos antiguos
  private async cleanupOldItems(): Promise<void> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(item => {
      // Mantener elementos pendientes o que fallaron
      if (item.status === 'PENDING' || item.status === 'PROCESSING') {
        return true;
      }
      
      // Mantener elementos completados/fallidos recientes
      const itemDate = item.processedAt || item.createdAt;
      return itemDate > oneDayAgo;
    });

    if (this.queue.length < initialLength) {
      console.log(`Limpieza de cola: ${initialLength - this.queue.length} elementos eliminados`);
      await this.saveQueueToStorage();
    }
  }

  // Utilidades para conversión de blobs
  private blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  private base64ToBlob(base64: string): Promise<Blob> {
    return fetch(base64).then(res => res.blob());
  }

  // Reintentar análisis fallido
  async retryAnalysis(id: string): Promise<boolean> {
    const analysis = this.getAnalysisById(id);
    if (!analysis || analysis.status !== 'FAILED') {
      return false;
    }

    analysis.status = 'PENDING';
    analysis.retryCount = 0;
    analysis.error = undefined;

    this.sortQueueByPriority();
    await this.saveQueueToStorage();

    if (navigator.onLine) {
      this.processQueue();
    }

    return true;
  }

  // Cancelar análisis
  async cancelAnalysis(id: string): Promise<boolean> {
    const index = this.queue.findIndex(item => item.id === id);
    if (index === -1) return false;

    const analysis = this.queue[index];
    if (analysis.status === 'PROCESSING') {
      // No se puede cancelar un análisis en proceso
      return false;
    }

    this.queue.splice(index, 1);
    await this.saveQueueToStorage();
    return true;
  }

  // Obtener estadísticas de la cola
  getQueueStatistics(): {
    averageProcessingTime: number;
    successRate: number;
    totalProcessed: number;
    queueSize: number;
  } {
    const completed = this.queue.filter(item => item.status === 'COMPLETED');
    const failed = this.queue.filter(item => item.status === 'FAILED');
    const totalProcessed = completed.length + failed.length;

    const averageProcessingTime = completed.length > 0 
      ? completed.reduce((sum, item) => {
          if (item.processedAt) {
            return sum + (item.processedAt.getTime() - item.createdAt.getTime());
          }
          return sum;
        }, 0) / completed.length
      : 0;

    const successRate = totalProcessed > 0 ? (completed.length / totalProcessed) * 100 : 0;

    return {
      averageProcessingTime: Math.round(averageProcessingTime / 1000), // en segundos
      successRate: Math.round(successRate),
      totalProcessed,
      queueSize: this.queue.length
    };
  }

  // Destructor
  destroy(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    
    window.removeEventListener('online', this.processQueue);
    window.removeEventListener('offline', this.pauseProcessing);
  }
}

// Instancia singleton
export const offlineAnalysisQueue = new OfflineAnalysisQueue();
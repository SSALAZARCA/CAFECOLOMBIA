import { offlineDB } from '../utils/offlineDB';
import { AIAnalysisRequest, AIAnalysisResult, AIAgentType } from './aiService';

export interface QueueItem {
  id: string;
  request: AIAnalysisRequest;
  priority: 'low' | 'medium' | 'high' | 'critical';
  attempts: number;
  maxAttempts: number;
  createdAt: string;
  scheduledAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  error?: string;
}

export interface QueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  averageProcessingTime: number;
  successRate: number;
}

export interface ProcessingOptions {
  maxConcurrent: number;
  retryDelay: number; // en milisegundos
  priorityWeights: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export class AnalysisQueueService {
  private static instance: AnalysisQueueService;
  private queue: Map<string, QueueItem> = new Map();
  private processing: Set<string> = new Set();
  private isProcessing: boolean = false;
  private options: ProcessingOptions;
  private processingInterval: NodeJS.Timeout | null = null;

  private constructor(options: ProcessingOptions) {
    this.options = options;
    this.loadQueueFromStorage();
    this.startProcessing();
  }

  public static getInstance(options?: ProcessingOptions): AnalysisQueueService {
    if (!AnalysisQueueService.instance) {
      const defaultOptions: ProcessingOptions = {
        maxConcurrent: 3,
        retryDelay: 5000,
        priorityWeights: {
          critical: 100,
          high: 75,
          medium: 50,
          low: 25
        }
      };
      AnalysisQueueService.instance = new AnalysisQueueService(options || defaultOptions);
    }
    return AnalysisQueueService.instance;
  }

  // Agregar análisis a la cola
  async addToQueue(request: AIAnalysisRequest, priority: QueueItem['priority'] = 'medium'): Promise<string> {
    const queueItem: QueueItem = {
      id: `queue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      request,
      priority,
      attempts: 0,
      maxAttempts: 3,
      createdAt: new Date().toISOString(),
      scheduledAt: new Date().toISOString(),
      status: 'pending'
    };

    this.queue.set(queueItem.id, queueItem);
    await this.saveQueueToStorage();

    // Iniciar procesamiento si no está activo
    if (!this.isProcessing) {
      this.processQueue();
    }

    return queueItem.id;
  }

  // Procesar cola
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processing.size >= this.options.maxConcurrent) {
      return;
    }

    this.isProcessing = true;

    try {
      const pendingItems = Array.from(this.queue.values())
        .filter(item => item.status === 'pending' && !this.processing.has(item.id))
        .sort((a, b) => this.getPriorityScore(b) - this.getPriorityScore(a));

      const availableSlots = this.options.maxConcurrent - this.processing.size;
      const itemsToProcess = pendingItems.slice(0, availableSlots);

      const processingPromises = itemsToProcess.map(item => this.processItem(item));
      
      if (processingPromises.length > 0) {
        await Promise.allSettled(processingPromises);
      }

    } catch (error) {
      console.error('Error processing queue:', error);
    } finally {
      this.isProcessing = false;
      
      // Continuar procesando si hay más elementos pendientes
      const hasPending = Array.from(this.queue.values()).some(item => 
        item.status === 'pending' && !this.processing.has(item.id)
      );
      
      if (hasPending && this.processing.size < this.options.maxConcurrent) {
        setTimeout(() => this.processQueue(), 1000);
      }
    }
  }

  // Procesar elemento individual
  private async processItem(item: QueueItem): Promise<void> {
    this.processing.add(item.id);
    
    try {
      // Actualizar estado a procesando
      item.status = 'processing';
      item.attempts++;
      this.queue.set(item.id, item);
      await this.saveQueueToStorage();

      // Procesar análisis según el tipo de agente
      const result = await this.executeAnalysis(item.request);

      // Marcar como completado
      item.status = 'completed';
      this.queue.set(item.id, item);

      // Guardar resultado en IndexedDB
      await offlineDB.updateAIAnalysisResult(
        item.request.id,
        result,
        'completed'
      );

    } catch (error) {
      console.error(`Error processing queue item ${item.id}:`, error);
      
      // Manejar error y reintentos
      item.error = error instanceof Error ? error.message : 'Unknown error';
      
      if (item.attempts < item.maxAttempts) {
        // Programar reintento
        item.status = 'pending';
        item.scheduledAt = new Date(Date.now() + this.options.retryDelay).toISOString();
      } else {
        // Marcar como fallido
        item.status = 'failed';
        await offlineDB.updateAIAnalysisResult(
          item.request.id,
          { 
            status: 'failed',
            error: item.error,
            processingTime: 0,
            confidence: 0,
            results: {}
          },
          'failed'
        );
      }
      
      this.queue.set(item.id, item);
    } finally {
      this.processing.delete(item.id);
      await this.saveQueueToStorage();
    }
  }

  // Ejecutar análisis según el tipo de agente
  private async executeAnalysis(request: AIAnalysisRequest): Promise<Partial<AIAnalysisResult>> {
    const startTime = Date.now();

    // Simular procesamiento específico por agente
    let processingTime: number;
    let results: AIAnalysisResult['results'] = {};

    switch (request.agentType) {
      case 'phytosanitary':
        processingTime = await this.simulatePhytosanitaryAnalysis(request);
        results.phytosanitary = {
          pestType: request.metadata.pestType || 'Roya del café',
          severity: this.randomChoice(['low', 'medium', 'high', 'critical']) as any,
          affectedArea: Math.random() * 30 + 5,
          recommendations: [
            'Aplicar fungicida específico',
            'Mejorar ventilación',
            'Monitorear humedad'
          ],
          treatmentUrgency: this.randomChoice(['immediate', 'within_week', 'monitor']) as any
        };
        break;

      case 'predictive':
        processingTime = await this.simulatePredictiveAnalysis(request);
        results.predictive = {
          yieldPrediction: Math.random() * 2000 + 1000,
          qualityScore: Math.random() * 30 + 70,
          riskFactors: ['Condiciones climáticas', 'Presión de plagas'],
          recommendations: ['Ajustar fertilización', 'Implementar riego'],
          confidenceInterval: [0.7, 0.9]
        };
        break;

      case 'rag_assistant':
        processingTime = await this.simulateRAGAnalysis(request);
        results.rag_assistant = {
          query: 'Consulta sobre manejo',
          answer: 'Respuesta basada en conocimiento...',
          sources: ['Manual técnico', 'Guía FNC'],
          relevanceScore: Math.random() * 0.3 + 0.7
        };
        break;

      case 'optimization':
        processingTime = await this.simulateOptimizationAnalysis(request);
        results.optimization = {
          currentEfficiency: Math.random() * 20 + 70,
          optimizationSuggestions: ['Optimizar espaciamiento', 'Mejorar poda'],
          potentialImprovement: Math.random() * 15 + 5,
          implementationPriority: this.randomChoice(['high', 'medium', 'low']) as any
        };
        break;

      default:
        throw new Error(`Unknown agent type: ${request.agentType}`);
    }

    const actualProcessingTime = Date.now() - startTime;

    return {
      status: 'completed',
      confidence: Math.random() * 0.3 + 0.7,
      processingTime: actualProcessingTime,
      results,
      timestamp: new Date().toISOString()
    };
  }

  // Simulaciones específicas por agente
  private async simulatePhytosanitaryAnalysis(request: AIAnalysisRequest): Promise<number> {
    // Simular análisis fitosanitario (más complejo)
    const baseTime = 2000;
    const complexityFactor = request.priority === 'high' ? 1.5 : 1.0;
    const processingTime = baseTime * complexityFactor + Math.random() * 1000;
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    return processingTime;
  }

  private async simulatePredictiveAnalysis(request: AIAnalysisRequest): Promise<number> {
    // Simular análisis predictivo (requiere más datos)
    const baseTime = 3000;
    const processingTime = baseTime + Math.random() * 2000;
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    return processingTime;
  }

  private async simulateRAGAnalysis(request: AIAnalysisRequest): Promise<number> {
    // Simular consulta RAG (búsqueda en base de conocimiento)
    const baseTime = 1500;
    const processingTime = baseTime + Math.random() * 500;
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    return processingTime;
  }

  private async simulateOptimizationAnalysis(request: AIAnalysisRequest): Promise<number> {
    // Simular análisis de optimización
    const baseTime = 2500;
    const processingTime = baseTime + Math.random() * 1500;
    
    await new Promise(resolve => setTimeout(resolve, processingTime));
    return processingTime;
  }

  // Calcular puntuación de prioridad
  private getPriorityScore(item: QueueItem): number {
    const priorityWeight = this.options.priorityWeights[item.priority];
    const ageBonus = Math.min(
      (Date.now() - new Date(item.createdAt).getTime()) / (1000 * 60 * 60), // horas
      24 // máximo 24 horas de bonus
    );
    
    return priorityWeight + ageBonus;
  }

  // Utilidad para selección aleatoria
  private randomChoice<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  // Obtener estadísticas de la cola
  async getQueueStats(): Promise<QueueStats> {
    const items = Array.from(this.queue.values());
    const total = items.length;
    
    const statusCounts = items.reduce((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const completedItems = items.filter(item => item.status === 'completed');
    const averageProcessingTime = completedItems.length > 0
      ? completedItems.reduce((sum, item) => {
          const created = new Date(item.createdAt).getTime();
          const now = Date.now();
          return sum + (now - created);
        }, 0) / completedItems.length
      : 0;

    const successRate = total > 0 
      ? (statusCounts.completed || 0) / total 
      : 0;

    return {
      total,
      pending: statusCounts.pending || 0,
      processing: statusCounts.processing || 0,
      completed: statusCounts.completed || 0,
      failed: statusCounts.failed || 0,
      averageProcessingTime,
      successRate
    };
  }

  // Obtener elementos de la cola
  getQueueItems(status?: QueueItem['status']): QueueItem[] {
    const items = Array.from(this.queue.values());
    return status ? items.filter(item => item.status === status) : items;
  }

  // Cancelar elemento de la cola
  async cancelQueueItem(itemId: string): Promise<boolean> {
    const item = this.queue.get(itemId);
    if (!item || item.status === 'completed') {
      return false;
    }

    if (item.status === 'processing') {
      // No se puede cancelar si ya está procesando
      return false;
    }

    item.status = 'cancelled';
    this.queue.set(itemId, item);
    await this.saveQueueToStorage();
    
    return true;
  }

  // Limpiar elementos completados/fallidos antiguos
  async cleanupQueue(olderThanHours: number = 24): Promise<number> {
    const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
    let cleaned = 0;

    for (const [id, item] of this.queue.entries()) {
      const itemTime = new Date(item.createdAt).getTime();
      
      if (itemTime < cutoffTime && 
          (item.status === 'completed' || item.status === 'failed' || item.status === 'cancelled')) {
        this.queue.delete(id);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      await this.saveQueueToStorage();
    }

    return cleaned;
  }

  // Persistencia en localStorage
  private async saveQueueToStorage(): Promise<void> {
    try {
      const queueData = Array.from(this.queue.entries());
      localStorage.setItem('analysisQueue', JSON.stringify(queueData));
    } catch (error) {
      console.error('Error saving queue to storage:', error);
    }
  }

  private async loadQueueFromStorage(): Promise<void> {
    try {
      const queueData = localStorage.getItem('analysisQueue');
      if (queueData) {
        const entries: [string, QueueItem][] = JSON.parse(queueData);
        this.queue = new Map(entries);
        
        // Resetear elementos que estaban procesando
        for (const [id, item] of this.queue.entries()) {
          if (item.status === 'processing') {
            item.status = 'pending';
            this.queue.set(id, item);
          }
        }
      }
    } catch (error) {
      console.error('Error loading queue from storage:', error);
      this.queue.clear();
    }
  }

  // Iniciar procesamiento automático
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      if (!this.isProcessing && this.queue.size > 0) {
        this.processQueue();
      }
    }, 5000); // Verificar cada 5 segundos
  }

  // Detener procesamiento
  stopProcessing(): void {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
  }

  // Limpiar recursos
  destroy(): void {
    this.stopProcessing();
    this.queue.clear();
    this.processing.clear();
  }
}

// Exportar instancia singleton
export const analysisQueue = AnalysisQueueService.getInstance();
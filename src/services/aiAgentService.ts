import { offlineDB } from '@/utils/offlineDB';
import { notificationService } from './notificationService';
import { cloudInitializer } from './cloudInitializer';

// Tipos de agentes de IA
export type AIAgentType = 'phytosanitary' | 'predictive' | 'rag_assistant' | 'optimization';

// Estados de análisis
export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

// Prioridades de análisis
export type AnalysisPriority = 'low' | 'medium' | 'high' | 'critical';

// Interfaz base para solicitudes de análisis
export interface AIAnalysisRequest {
  id: string;
  agentType: AIAgentType;
  imageId?: string;
  imageData?: Blob;
  metadata: {
    farmId?: string;
    lotId?: string;
    pestType?: string;
    plantPart?: string;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
      accuracy: number;
      altitude?: number;
    };
    captureTimestamp: string;
    deviceInfo: {
      userAgent: string;
      platform: string;
      language: string;
    };
    imageQuality?: 'excellent' | 'good' | 'fair' | 'poor';
    lightingConditions?: 'natural' | 'artificial' | 'mixed' | 'poor';
    focusQuality?: 'sharp' | 'slightly_blurred' | 'blurred';
  };
  priority: AnalysisPriority;
  autoAnalyze: boolean;
  requestTimestamp: string;
  userId?: string;
}

// Interfaz base para resultados de análisis
export interface AIAnalysisResult {
  id: string;
  requestId: string;
  agentType: AIAgentType;
  status: AnalysisStatus;
  confidence: number;
  processingTime: number;
  results: any;
  error?: string;
  completedTimestamp?: string;
  modelVersion?: string;
  apiVersion?: string;
}

// Configuración de agentes
export interface AIAgentConfig {
  agentType: AIAgentType;
  enabled: boolean;
  autoAnalyze: boolean;
  priority: AnalysisPriority;
  confidenceThreshold: number;
  maxRetries: number;
  timeoutMs: number;
  batchSize: number;
  modelVersion?: string;
  apiEndpoint?: string;
  customSettings?: Record<string, any>;
}

// Métricas de rendimiento
export interface AIPerformanceMetrics {
  agentType: AIAgentType;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageProcessingTime: number;
  averageConfidence: number;
  lastUpdated: string;
}

class AIAgentService {
  private configs: Map<AIAgentType, AIAgentConfig> = new Map();
  private activeRequests: Map<string, AIAnalysisRequest> = new Map();
  private processingQueue: AIAnalysisRequest[] = [];
  private isProcessing = false;
  private retryAttempts: Map<string, number> = new Map();

  constructor() {
    this.initializeDefaultConfigs();
    this.startProcessingQueue();
  }

  // Inicializar configuraciones por defecto
  private initializeDefaultConfigs() {
    const defaultConfigs: AIAgentConfig[] = [
      {
        agentType: 'phytosanitary',
        enabled: true,
        autoAnalyze: true,
        priority: 'high',
        confidenceThreshold: 0.7,
        maxRetries: 3,
        timeoutMs: 30000,
        batchSize: 5,
        modelVersion: '1.0.0'
      },
      {
        agentType: 'predictive',
        enabled: true,
        autoAnalyze: false,
        priority: 'medium',
        confidenceThreshold: 0.6,
        maxRetries: 2,
        timeoutMs: 45000,
        batchSize: 3,
        modelVersion: '1.0.0'
      },
      {
        agentType: 'rag_assistant',
        enabled: true,
        autoAnalyze: false,
        priority: 'medium',
        confidenceThreshold: 0.5,
        maxRetries: 2,
        timeoutMs: 20000,
        batchSize: 1,
        modelVersion: '1.0.0'
      },
      {
        agentType: 'optimization',
        enabled: true,
        autoAnalyze: false,
        priority: 'low',
        confidenceThreshold: 0.6,
        maxRetries: 2,
        timeoutMs: 60000,
        batchSize: 2,
        modelVersion: '1.0.0'
      }
    ];

    defaultConfigs.forEach(config => {
      this.configs.set(config.agentType, config);
    });
  }

  // Obtener configuración de un agente
  getAgentConfig(agentType: AIAgentType): AIAgentConfig | undefined {
    return this.configs.get(agentType);
  }

  // Actualizar configuración de un agente
  async updateAgentConfig(agentType: AIAgentType, config: Partial<AIAgentConfig>): Promise<void> {
    const currentConfig = this.configs.get(agentType);
    if (!currentConfig) {
      throw new Error(`Agent type ${agentType} not found`);
    }

    const updatedConfig = { ...currentConfig, ...config };
    this.configs.set(agentType, updatedConfig);

    // Guardar en IndexedDB
    await offlineDB.setAIConfig(agentType, updatedConfig);
  }

  // Crear solicitud de análisis
  async createAnalysisRequest(
    agentType: AIAgentType,
    imageData: Blob,
    metadata: AIAnalysisRequest['metadata'],
    options: {
      priority?: AnalysisPriority;
      autoAnalyze?: boolean;
      userId?: string;
    } = {}
  ): Promise<string> {
    const config = this.getAgentConfig(agentType);
    if (!config || !config.enabled) {
      throw new Error(`Agent ${agentType} is not enabled`);
    }

    const requestId = `${agentType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const request: AIAnalysisRequest = {
      id: requestId,
      agentType,
      imageData,
      metadata,
      priority: options.priority || config.priority,
      autoAnalyze: options.autoAnalyze ?? config.autoAnalyze,
      requestTimestamp: new Date().toISOString(),
      userId: options.userId
    };

    // Guardar imagen en IndexedDB
    const imageId = await offlineDB.addAIImage(
      `${requestId}.jpg`,
      imageData,
      {
        originalPhotoId: requestId,
        pestType: metadata.pestType,
        lotId: metadata.lotId,
        gpsCoordinates: metadata.gpsCoordinates,
        captureTimestamp: metadata.captureTimestamp,
        deviceInfo: metadata.deviceInfo,
        aiMetadata: {
          enableAIAnalysis: true,
          analysisTypes: [agentType],
          priority: request.priority,
          autoAnalyze: request.autoAnalyze,
          plantPart: metadata.plantPart as any,
          imageQuality: metadata.imageQuality,
          lightingConditions: metadata.lightingConditions,
          focusQuality: metadata.focusQuality
        }
      }
    );

    request.imageId = imageId;

    // Crear entrada de análisis en IndexedDB
    await offlineDB.addAIAnalysis(
      agentType,
      {
        photoId: requestId,
        imageMetadata: request.metadata,
        priority: request.priority,
        autoAnalyze: request.autoAnalyze
      },
      request.priority
    );

    // Agregar a la cola de procesamiento
    this.activeRequests.set(requestId, request);
    this.processingQueue.push(request);
    this.sortProcessingQueue();

    console.log(`[AIAgentService] Created analysis request: ${requestId} for agent: ${agentType}`);

    // Iniciar procesamiento si está habilitado el análisis automático
    if (request.autoAnalyze) {
      this.processQueue();
    }

    return requestId;
  }

  // Obtener estado de solicitud
  async getAnalysisStatus(requestId: string): Promise<AnalysisStatus | null> {
    try {
      const analysis = await offlineDB.getAIAnalysisByPhotoId(requestId);
      return analysis?.status as AnalysisStatus || null;
    } catch (error) {
      console.error('[AIAgentService] Error getting analysis status:', error);
      return null;
    }
  }

  // Obtener resultado de análisis
  async getAnalysisResult(requestId: string): Promise<AIAnalysisResult | null> {
    try {
      const analysis = await offlineDB.getAIAnalysisByPhotoId(requestId);
      if (!analysis) return null;

      return {
        id: analysis.id,
        requestId,
        agentType: analysis.analysisType as AIAgentType,
        status: analysis.status as AnalysisStatus,
        confidence: analysis.confidence || 0,
        processingTime: analysis.processingTime || 0,
        results: analysis.results,
        error: analysis.error,
        completedTimestamp: analysis.completedAt,
        modelVersion: analysis.modelVersion,
        apiVersion: analysis.apiVersion
      };
    } catch (error) {
      console.error('[AIAgentService] Error getting analysis result:', error);
      return null;
    }
  }

  // Cancelar solicitud de análisis
  async cancelAnalysisRequest(requestId: string): Promise<boolean> {
    try {
      // Remover de la cola de procesamiento
      const queueIndex = this.processingQueue.findIndex(req => req.id === requestId);
      if (queueIndex !== -1) {
        this.processingQueue.splice(queueIndex, 1);
      }

      // Remover de solicitudes activas
      this.activeRequests.delete(requestId);

      // Actualizar estado en IndexedDB
      const analysis = await offlineDB.getAIAnalysisByPhotoId(requestId);
      if (analysis) {
        await offlineDB.updateAIAnalysisResult(analysis.id, null, 'cancelled');
      }

      console.log(`[AIAgentService] Cancelled analysis request: ${requestId}`);
      return true;
    } catch (error) {
      console.error('[AIAgentService] Error cancelling analysis request:', error);
      return false;
    }
  }

  // Procesar cola de análisis
  private async processQueue(): Promise<void> {
    if (this.isProcessing || this.processingQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      while (this.processingQueue.length > 0) {
        const request = this.processingQueue.shift();
        if (!request) continue;

        await this.processAnalysisRequest(request);
      }
    } catch (error) {
      console.error('[AIAgentService] Error processing queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  // Procesar solicitud individual
  private async processAnalysisRequest(request: AIAnalysisRequest): Promise<void> {
    const config = this.getAgentConfig(request.agentType);
    if (!config) {
      console.error(`[AIAgentService] No config found for agent: ${request.agentType}`);
      return;
    }

    try {
      console.log(`[AIAgentService] Processing analysis request: ${request.id}`);

      // Actualizar estado a procesando
      const analysis = await offlineDB.getAIAnalysisByPhotoId(request.id);
      if (analysis) {
        await offlineDB.updateAIAnalysisResult(analysis.id, null, 'processing');
      }

      // Simular procesamiento (en producción esto sería una llamada a la API de IA)
      const startTime = Date.now();
      const result = await this.simulateAIAnalysis(request);
      const processingTime = Date.now() - startTime;

      // Actualizar resultado en IndexedDB
      if (analysis) {
        await offlineDB.updateAIAnalysisResult(
          analysis.id,
          {
            ...result,
            processingTime,
            modelVersion: config.modelVersion,
            apiVersion: '1.0.0'
          },
          'completed'
        );
      }

      // Enviar notificación
      await this.sendAnalysisNotification(request, result, processingTime);

      // Actualizar métricas
      await this.updatePerformanceMetrics(request.agentType, true, processingTime, result.confidence);

      console.log(`[AIAgentService] Completed analysis request: ${request.id}`);

    } catch (error) {
      console.error(`[AIAgentService] Error processing request ${request.id}:`, error);

      // Manejar reintentos
      const retryCount = this.retryAttempts.get(request.id) || 0;
      if (retryCount < config.maxRetries) {
        this.retryAttempts.set(request.id, retryCount + 1);
        this.processingQueue.push(request);
        console.log(`[AIAgentService] Retrying request ${request.id} (attempt ${retryCount + 1})`);
      } else {
        // Marcar como fallido
        const analysis = await offlineDB.getAIAnalysisByPhotoId(request.id);
        if (analysis) {
          await offlineDB.updateAIAnalysisResult(
            analysis.id,
            null,
            'failed',
            error instanceof Error ? error.message : 'Unknown error'
          );
        }

        // Actualizar métricas
        await this.updatePerformanceMetrics(request.agentType, false, 0, 0);
      }
    } finally {
      this.activeRequests.delete(request.id);
    }
  }

  // Simular análisis de IA (reemplazar con llamadas reales a la API)
  private async simulateAIAnalysis(request: AIAnalysisRequest): Promise<any> {
    // Simular tiempo de procesamiento
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));

    const baseConfidence = 0.6 + Math.random() * 0.3;

    switch (request.agentType) {
      case 'phytosanitary':
        return {
          pestDetection: [
            {
              pestType: 'coffee_leaf_rust',
              confidence: baseConfidence,
              severity: Math.random() > 0.5 ? 'medium' : 'high',
              affectedArea: Math.floor(Math.random() * 30) + 10,
              recommendations: [
                'Aplicar fungicida específico para roya',
                'Mejorar ventilación del cultivo',
                'Monitorear humedad relativa'
              ]
            }
          ],
          confidence: baseConfidence
        };

      case 'predictive':
        return {
          predictions: [
            {
              type: 'pest_outbreak_risk',
              probability: baseConfidence,
              timeframe: '7-14 days',
              factors: ['humidity', 'temperature', 'rainfall'],
              recommendations: [
                'Aplicar tratamiento preventivo',
                'Aumentar frecuencia de monitoreo'
              ]
            }
          ],
          confidence: baseConfidence
        };

      case 'rag_assistant':
        return {
          recommendations: [
            {
              category: 'treatment',
              suggestion: 'Basado en el análisis de la imagen, se recomienda aplicar un fungicida sistémico',
              confidence: baseConfidence,
              sources: ['Manual de Plagas del Café', 'Guía Técnica CENICAFE']
            }
          ],
          confidence: baseConfidence
        };

      case 'optimization':
        return {
          optimizations: [
            {
              area: 'irrigation',
              current_efficiency: 0.7,
              potential_improvement: 0.15,
              recommendations: [
                'Ajustar frecuencia de riego',
                'Implementar riego por goteo'
              ]
            }
          ],
          confidence: baseConfidence
        };

      default:
        throw new Error(`Unknown agent type: ${request.agentType}`);
    }
  }

  // Enviar notificación de análisis completado
  private async sendAnalysisNotification(
    request: AIAnalysisRequest,
    result: any,
    processingTime: number
  ): Promise<void> {
    try {
      const severity = result.confidence > 0.8 ? 'high' : 
                     result.confidence > 0.6 ? 'medium' : 'low';

      await notificationService.createNotification({
        title: `Análisis ${request.agentType} completado`,
        message: `Análisis completado con ${(result.confidence * 100).toFixed(0)}% de confianza`,
        type: 'ai_analysis',
        severity,
        data: {
          requestId: request.id,
          agentType: request.agentType,
          confidence: result.confidence,
          processingTime
        },
        agentType: request.agentType
      });
    } catch (error) {
      console.error('[AIAgentService] Error sending notification:', error);
    }
  }

  // Actualizar métricas de rendimiento
  private async updatePerformanceMetrics(
    agentType: AIAgentType,
    success: boolean,
    processingTime: number,
    confidence: number
  ): Promise<void> {
    try {
      await offlineDB.recordAIMetrics(agentType, {
        requestCount: 1,
        successCount: success ? 1 : 0,
        failureCount: success ? 0 : 1,
        totalProcessingTime: processingTime,
        averageConfidence: confidence,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[AIAgentService] Error updating metrics:', error);
    }
  }

  // Ordenar cola de procesamiento por prioridad
  private sortProcessingQueue(): void {
    const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
    
    this.processingQueue.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Si tienen la misma prioridad, ordenar por timestamp
      return new Date(a.requestTimestamp).getTime() - new Date(b.requestTimestamp).getTime();
    });
  }

  // Iniciar procesamiento automático de la cola
  private startProcessingQueue(): void {
    setInterval(() => {
      if (!this.isProcessing && this.processingQueue.length > 0) {
        this.processQueue();
      }
    }, 5000); // Verificar cada 5 segundos
  }

  // Obtener métricas de rendimiento
  async getPerformanceMetrics(agentType?: AIAgentType): Promise<AIPerformanceMetrics[]> {
    try {
      const metrics = await offlineDB.getAIMetrics(agentType);
      return metrics.map(metric => ({
        agentType: metric.agentType as AIAgentType,
        totalRequests: metric.requestCount,
        successfulRequests: metric.successCount,
        failedRequests: metric.failureCount,
        averageProcessingTime: metric.averageProcessingTime,
        averageConfidence: metric.averageConfidence,
        lastUpdated: metric.timestamp
      }));
    } catch (error) {
      console.error('[AIAgentService] Error getting performance metrics:', error);
      return [];
    }
  }

  // Limpiar datos antiguos
  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      // Limpiar análisis antiguos
      await offlineDB.cleanupOldAIAnalysis(cutoffDate);
      
      // Limpiar imágenes antiguas
      await offlineDB.cleanupOldAIImages(cutoffDate);
      
      // Limpiar métricas antiguas
      await offlineDB.cleanupOldAIMetrics(cutoffDate);

      console.log(`[AIAgentService] Cleaned up data older than ${daysToKeep} days`);
    } catch (error) {
      console.error('[AIAgentService] Error cleaning up old data:', error);
    }
  }

  // Obtener estadísticas generales
  async getGeneralStats(): Promise<{
    totalRequests: number;
    pendingRequests: number;
    completedRequests: number;
    failedRequests: number;
    averageProcessingTime: number;
    agentStats: Record<AIAgentType, {
      enabled: boolean;
      totalRequests: number;
      successRate: number;
    }>;
  }> {
    try {
      const allMetrics = await this.getPerformanceMetrics();
      
      const totalRequests = allMetrics.reduce((sum, m) => sum + m.totalRequests, 0);
      const successfulRequests = allMetrics.reduce((sum, m) => sum + m.successfulRequests, 0);
      const failedRequests = allMetrics.reduce((sum, m) => sum + m.failedRequests, 0);
      const avgProcessingTime = allMetrics.reduce((sum, m) => sum + m.averageProcessingTime, 0) / allMetrics.length || 0;

      const agentStats: Record<AIAgentType, any> = {} as any;
      
      for (const agentType of ['phytosanitary', 'predictive', 'rag_assistant', 'optimization'] as AIAgentType[]) {
        const config = this.getAgentConfig(agentType);
        const metrics = allMetrics.find(m => m.agentType === agentType);
        
        agentStats[agentType] = {
          enabled: config?.enabled || false,
          totalRequests: metrics?.totalRequests || 0,
          successRate: metrics ? (metrics.successfulRequests / metrics.totalRequests) : 0
        };
      }

      return {
        totalRequests,
        pendingRequests: this.processingQueue.length,
        completedRequests: successfulRequests,
        failedRequests,
        averageProcessingTime: avgProcessingTime,
        agentStats
      };
    } catch (error) {
      console.error('[AIAgentService] Error getting general stats:', error);
      return {
        totalRequests: 0,
        pendingRequests: 0,
        completedRequests: 0,
        failedRequests: 0,
        averageProcessingTime: 0,
        agentStats: {} as any
      };
    }
  }
}

// Instancia singleton del servicio
export const aiAgentService = new AIAgentService();
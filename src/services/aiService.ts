import { offlineDB } from '../utils/offlineDB';

// Tipos para los agentes de IA
export type AIAgentType = 'phytosanitary' | 'predictive' | 'rag_assistant' | 'optimization';

export interface AIAnalysisRequest {
  id: string;
  agentType: AIAgentType;
  imageId: string;
  imageUrl: string;
  metadata: {
    plantPart: string;
    pestType?: string;
    lotId?: string;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      altitude?: number;
    };
    deviceInfo?: {
      userAgent: string;
      platform: string;
      language: string;
    };
    timestamp: string;
  };
  priority: 'low' | 'medium' | 'high';
  settings: {
    qualityThreshold: number;
    autoAnalyze: boolean;
    enableNotifications: boolean;
  };
}

export interface AIAnalysisResult {
  id: string;
  requestId: string;
  agentType: AIAgentType;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence: number;
  processingTime: number;
  results: {
    // Resultados específicos del agente fitosanitario
    phytosanitary?: {
      pestType: string;
      severity: 'low' | 'medium' | 'high' | 'critical';
      affectedArea: number;
      recommendations: string[];
      treatmentUrgency: 'immediate' | 'within_week' | 'monitor';
    };
    // Resultados específicos del agente predictivo
    predictive?: {
      yieldPrediction: number;
      qualityScore: number;
      riskFactors: string[];
      recommendations: string[];
      confidenceInterval: [number, number];
    };
    // Resultados específicos del asistente RAG
    rag_assistant?: {
      query: string;
      answer: string;
      sources: string[];
      relevanceScore: number;
    };
    // Resultados específicos del agente de optimización
    optimization?: {
      currentEfficiency: number;
      optimizationSuggestions: string[];
      potentialImprovement: number;
      implementationPriority: 'high' | 'medium' | 'low';
    };
  };
  error?: string;
  timestamp: string;
}

export interface AINotification {
  id: string;
  agentType: AIAgentType;
  type: 'analysis_complete' | 'urgent_alert' | 'recommendation' | 'system_update';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: any;
  read: boolean;
  timestamp: string;
  expiresAt?: string;
}

export class AIService {
  private static instance: AIService;
  private isOnline: boolean = navigator.onLine;
  private processingQueue: Map<string, AIAnalysisRequest> = new Map();

  private constructor() {
    // Escuchar cambios de conectividad
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.processPendingAnalysis();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  public static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  // Solicitar análisis de IA
  async requestAnalysis(request: AIAnalysisRequest): Promise<string> {
    try {
      // Guardar solicitud en IndexedDB
      const analysisId = await offlineDB.addAIAnalysis(
        request.agentType,
        request.imageId,
        request.metadata,
        request.priority
      );

      // Agregar a la cola de procesamiento
      this.processingQueue.set(analysisId, request);

      // Si está online, procesar inmediatamente
      if (this.isOnline) {
        this.processAnalysis(analysisId, request);
      }

      return analysisId;
    } catch (error) {
      console.error('Error requesting AI analysis:', error);
      throw error;
    }
  }

  // Procesar análisis individual
  private async processAnalysis(analysisId: string, request: AIAnalysisRequest): Promise<void> {
    try {
      // Actualizar estado a 'processing'
      await offlineDB.updateAIAnalysisResult(analysisId, {
        status: 'processing',
        processingTime: 0,
        confidence: 0,
        results: {}
      }, 'processing');

      // Simular procesamiento (en producción, aquí se haría la llamada a la API)
      const result = await this.simulateAIAnalysis(request);

      // Guardar resultado
      await offlineDB.updateAIAnalysisResult(analysisId, result, 'completed');

      // Crear notificación si está habilitada
      if (request.settings.enableNotifications) {
        await this.createNotification(request.agentType, result);
      }

      // Remover de la cola
      this.processingQueue.delete(analysisId);

    } catch (error) {
      console.error('Error processing AI analysis:', error);

      // Marcar como fallido
      await offlineDB.updateAIAnalysisResult(analysisId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        processingTime: 0,
        confidence: 0,
        results: {}
      }, 'failed');

      this.processingQueue.delete(analysisId);
    }
  }

  // Simular análisis de IA (reemplazar con llamadas reales a la API)
  private async simulateAIAnalysis(request: AIAnalysisRequest): Promise<Partial<AIAnalysisResult>> {
    // Simular tiempo de procesamiento
    const processingTime = Math.random() * 3000 + 1000; // 1-4 segundos
    await new Promise(resolve => setTimeout(resolve, processingTime));

    const confidence = Math.random() * 0.4 + 0.6; // 60-100%

    let results: AIAnalysisResult['results'] = {};

    switch (request.agentType) {
      case 'phytosanitary':
        results.phytosanitary = {
          pestType: request.metadata.pestType || 'Roya del café',
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
          affectedArea: Math.random() * 30 + 5, // 5-35%
          recommendations: [
            'Aplicar fungicida específico para roya',
            'Mejorar ventilación en el cultivo',
            'Monitorear humedad relativa'
          ],
          treatmentUrgency: ['immediate', 'within_week', 'monitor'][Math.floor(Math.random() * 3)] as any
        };
        break;

      case 'predictive':
        results.predictive = {
          yieldPrediction: Math.random() * 2000 + 1000, // kg/ha
          qualityScore: Math.random() * 30 + 70, // 70-100
          riskFactors: ['Condiciones climáticas adversas', 'Presión de plagas'],
          recommendations: [
            'Ajustar programa de fertilización',
            'Implementar riego por goteo'
          ],
          confidenceInterval: [confidence - 0.1, confidence + 0.1]
        };
        break;

      case 'rag_assistant':
        results.rag_assistant = {
          query: 'Consulta sobre manejo de cultivo',
          answer: 'Basado en las mejores prácticas para café colombiano...',
          sources: ['Manual de Buenas Prácticas', 'Guía Técnica FNC'],
          relevanceScore: confidence
        };
        break;

      case 'optimization':
        results.optimization = {
          currentEfficiency: Math.random() * 20 + 70, // 70-90%
          optimizationSuggestions: [
            'Optimizar espaciamiento entre plantas',
            'Mejorar sistema de poda'
          ],
          potentialImprovement: Math.random() * 15 + 5, // 5-20%
          implementationPriority: ['high', 'medium', 'low'][Math.floor(Math.random() * 3)] as any
        };
        break;
    }

    return {
      status: 'completed',
      confidence,
      processingTime,
      results,
      timestamp: new Date().toISOString()
    };
  }

  // Procesar análisis pendientes
  private async processPendingAnalysis(): Promise<void> {
    try {
      const pendingAnalysis = await offlineDB.getAIAnalysisByStatus('pending');

      for (const analysis of pendingAnalysis) {
        if (this.processingQueue.has(analysis.id)) continue;

        const request: AIAnalysisRequest = {
          id: analysis.id,
          agentType: analysis.agentType,
          imageId: analysis.imageId,
          imageUrl: '', // Se obtendría de IndexedDB
          metadata: analysis.metadata,
          priority: analysis.priority,
          settings: {
            qualityThreshold: 0.7,
            autoAnalyze: true,
            enableNotifications: true
          }
        };

        this.processingQueue.set(analysis.id, request);
        this.processAnalysis(analysis.id, request);
      }
    } catch (error) {
      console.error('Error processing pending analysis:', error);
    }
  }

  // Crear notificación
  private async createNotification(agentType: AIAgentType, result: Partial<AIAnalysisResult>): Promise<void> {
    const notification: Omit<AINotification, 'id'> = {
      agentType,
      type: 'analysis_complete',
      title: this.getNotificationTitle(agentType),
      message: this.getNotificationMessage(agentType, result),
      priority: this.getNotificationPriority(result),
      data: result,
      read: false,
      timestamp: new Date().toISOString()
    };

    await offlineDB.addAINotification(
      notification.agentType,
      notification.type,
      notification.title,
      notification.message,
      notification.priority,
      notification.data
    );
  }

  private getNotificationTitle(agentType: AIAgentType): string {
    const titles = {
      phytosanitary: 'Análisis Fitosanitario Completado',
      predictive: 'Predicción de Rendimiento Lista',
      rag_assistant: 'Consulta Procesada',
      optimization: 'Análisis de Optimización Completado'
    };
    return titles[agentType];
  }

  private getNotificationMessage(agentType: AIAgentType, result: Partial<AIAnalysisResult>): string {
    if (agentType === 'phytosanitary' && result.results?.phytosanitary) {
      const phyto = result.results.phytosanitary;
      return `Detectado: ${phyto.pestType} (Severidad: ${phyto.severity})`;
    }
    return 'El análisis ha sido completado exitosamente.';
  }

  private getNotificationPriority(result: Partial<AIAnalysisResult>): AINotification['priority'] {
    if (result.results?.phytosanitary?.severity === 'critical') return 'critical';
    if (result.results?.phytosanitary?.severity === 'high') return 'high';
    if (result.confidence && result.confidence < 0.7) return 'medium';
    return 'low';
  }

  // Obtener resultados de análisis
  async getAnalysisResults(analysisId: string): Promise<AIAnalysisResult | null> {
    try {
      const analysis = await offlineDB.getAIAnalysisByAgent('phytosanitary'); // Temporal
      return analysis.find(a => a.id === analysisId) || null;
    } catch (error) {
      console.error('Error getting analysis results:', error);
      return null;
    }
  }

  // Obtener notificaciones
  async getNotifications(agentType?: AIAgentType): Promise<AINotification[]> {
    try {
      // Intentar obtener desde backend primero
      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
      const endpoint = `${baseUrl}/api/notifications`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('authToken')) : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(endpoint, { headers });
      if (res.ok) {
        const payload = await res.json();
        const data = Array.isArray(payload?.data) ? payload.data : [];

        // Normalizar a AINotification
        const normalized: AINotification[] = data.map((n: any) => ({
          id: String(n.id ?? crypto.randomUUID()),
          agentType: (n.agentType ?? 'predictive') as AIAgentType,
          type: (n.type ?? 'system_update') as AINotification['type'],
          title: n.title ?? 'Notificación',
          message: n.message ?? '',
          priority: (n.priority ?? 'medium') as AINotification['priority'],
          data: n.metadata ?? n.data ?? {},
          read: Boolean(n.isRead ?? n.read ?? false),
          timestamp: (n.createdAt instanceof Date ? n.createdAt.toISOString() : (n.createdAt ?? new Date().toISOString())),
          expiresAt: n.expiresAt ? (n.expiresAt instanceof Date ? n.expiresAt.toISOString() : n.expiresAt) : undefined
        }));

        // Si se especifica agente, filtrar
        return agentType ? normalized.filter(n => n.agentType === agentType) : normalized;
      }

      // Fallback a IndexedDB si falla backend
      if (agentType) {
        return await offlineDB.getAINotificationsByAgent(agentType);
      }
      return await offlineDB.getUnreadAINotifications();
    } catch (error) {
      // En modo desarrollo, ser menos ruidoso con los errores de base de datos
      const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';
      if (!isDevelopment) {
        console.error('Error getting notifications:', error);
      }
      return [];
    }
  }

  // Marcar notificación como leída
  async markNotificationAsRead(notificationId: string): Promise<void> {
    try {
      await offlineDB.markAINotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  // Obtener estadísticas de IA
  async getAIStats(): Promise<any> {
    try {
      return await offlineDB.getAIStats();
    } catch (error) {
      console.error('Error getting AI stats:', error);
      return null;
    }
  }

  // Limpiar datos antiguos
  async cleanup(): Promise<void> {
    try {
      await offlineDB.cleanupExpiredAINotifications();
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  }
}

// Exportar instancia singleton
export const aiService = AIService.getInstance();
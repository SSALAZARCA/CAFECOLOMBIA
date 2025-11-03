import { useState, useEffect, useCallback } from 'react';
import { aiAgentService, AIAgentType, AnalysisPriority, AIAnalysisResult } from '@/services/aiAgentService';
import { imageAnalysisService, ImageAnalysisResult } from '@/services/imageAnalysisService';
import { aiValidationService, ValidationResult, DataQualityMetrics } from '@/services/aiValidationService';

// Estado de los servicios de IA
export interface AIServicesState {
  isInitialized: boolean;
  isProcessing: boolean;
  error: string | null;
  activeRequests: Map<string, AIAnalysisRequest>;
  completedAnalyses: Map<string, AIAnalysisResult>;
  validationResults: Map<string, ValidationResult>;
  qualityMetrics: Map<string, DataQualityMetrics>;
  statistics: {
    totalRequests: number;
    successfulAnalyses: number;
    failedAnalyses: number;
    averageProcessingTime: number;
    validationErrors: number;
    averageQualityScore: number;
  };
}

// Solicitud de análisis de IA
export interface AIAnalysisRequest {
  id: string;
  imageBlob: Blob;
  agentType: AIAgentType;
  priority: AnalysisPriority;
  timestamp: Date;
  metadata: {
    imageAnalysis?: ImageAnalysisResult;
    plantPart?: string;
    confidenceThreshold?: number;
  };
}

export function useAIServices() {
  const [state, setState] = useState<AIServicesState>({
    isInitialized: false,
    isProcessing: false,
    error: null,
    activeRequests: new Map(),
    completedAnalyses: new Map(),
    validationResults: new Map(),
    qualityMetrics: new Map(),
    statistics: {
      totalRequests: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      averageProcessingTime: 0,
      validationErrors: 0,
      averageQualityScore: 0
    }
  });

  const [activeRequests, setActiveRequests] = useState<Map<string, {
    agentType: AIAgentType;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    progress: number;
  }>>(new Map());

  // Inicializar servicios
  const initialize = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));
      
      // Cargar estadísticas generales
      const stats = await aiAgentService.getGeneralStats();
      
      setState(prev => ({
        ...prev,
        isInitialized: true,
        isProcessing: false,
        stats: {
          totalRequests: stats.totalRequests,
          pendingRequests: stats.pendingRequests,
          completedRequests: stats.completedRequests,
          failedRequests: stats.failedRequests,
          averageProcessingTime: stats.averageProcessingTime
        },
        agentConfigs: stats.agentStats
      }));
      
    } catch (error) {
      console.error('[useAIServices] Error initializing:', error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Error initializing AI services'
      }));
    }
  }, []);

  // Analizar imagen con IA
  const analyzeImage = useCallback(async (
    imageBlob: Blob,
    agentType: AIAgentType,
    options?: {
      priority?: AnalysisPriority;
      includeQuality?: boolean;
      includeContent?: boolean;
      includeMetadata?: boolean;
      plantPart?: string;
      confidenceThreshold?: number;
      skipValidation?: boolean;
    }
  ): Promise<{
    analysisId: string;
    imageAnalysis?: ImageAnalysisResult;
    aiAnalysis?: AIAnalysisResult;
    validation?: ValidationResult;
    quality?: DataQualityMetrics;
  }> => {
    try {
      setState(prev => ({ ...prev, isProcessing: true, error: null }));

      const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Crear solicitud de análisis de IA
      const aiRequest: AIAnalysisRequest = {
        id: analysisId,
        imageBlob,
        agentType,
        priority: options?.priority || 'medium',
        timestamp: new Date(),
        metadata: {
          plantPart: options?.plantPart,
          confidenceThreshold: options?.confidenceThreshold
        }
      };

      // Validar solicitud si no se omite
      let validation: ValidationResult | undefined;
      let quality: DataQualityMetrics | undefined;
      
      if (!options?.skipValidation) {
        validation = aiValidationService.validateAnalysisRequest(aiRequest);
        quality = aiValidationService.calculateDataQuality(aiRequest);
        
        // Si hay errores críticos de validación, no proceder
        if (!validation.isValid && validation.errors.length > 0) {
          const validationError = `Errores de validación: ${validation.errors.join(', ')}`;
          setState(prev => ({
            ...prev,
            isProcessing: false,
            error: validationError,
            validationResults: new Map(prev.validationResults.set(analysisId, validation!)),
            qualityMetrics: new Map(prev.qualityMetrics.set(analysisId, quality!)),
            statistics: {
              ...prev.statistics,
              totalRequests: prev.statistics.totalRequests + 1,
              validationErrors: prev.statistics.validationErrors + 1
            }
          }));
          throw new Error(validationError);
        }
      }

      // Análisis de imagen si se solicita
      let imageAnalysis: ImageAnalysisResult | undefined;
      if (options?.includeQuality || options?.includeContent || options?.includeMetadata) {
        imageAnalysis = await imageAnalysisService.analyzeImage(imageBlob, {
          includeQuality: options.includeQuality ?? true,
          includeContent: options.includeContent ?? true,
          includeMetadata: options.includeMetadata ?? true
        });

        // Validar resultado de análisis de imagen
        if (imageAnalysis && !options?.skipValidation) {
          const imageValidation = aiValidationService.validateImageAnalysisResult(imageAnalysis);
          if (imageValidation.warnings.length > 0) {
            console.warn('Advertencias en análisis de imagen:', imageValidation.warnings);
          }
        }

        // Actualizar metadatos con análisis de imagen
        aiRequest.metadata = {
          ...aiRequest.metadata,
          imageAnalysis
        };
      }

      // Procesar con agente de IA
      const aiAnalysis = await aiAgentService.processAnalysis(aiRequest);

      // Validar resultado de IA
      if (aiAnalysis && !options?.skipValidation) {
        const resultValidation = aiValidationService.validateAnalysisResult(aiAnalysis);
        if (resultValidation.warnings.length > 0) {
          console.warn('Advertencias en resultado de IA:', resultValidation.warnings);
        }
      }

      // Actualizar estado
      setState(prev => {
        const newActiveRequests = new Map(prev.activeRequests);
        const newCompletedAnalyses = new Map(prev.completedAnalyses);
        const newValidationResults = new Map(prev.validationResults);
        const newQualityMetrics = new Map(prev.qualityMetrics);

        if (aiAnalysis) {
          newCompletedAnalyses.set(analysisId, aiAnalysis);
        }
        if (validation) {
          newValidationResults.set(analysisId, validation);
        }
        if (quality) {
          newQualityMetrics.set(analysisId, quality);
        }

        // Calcular nueva puntuación promedio de calidad
        const qualityScores = Array.from(newQualityMetrics.values()).map(q => q.overall);
        const averageQualityScore = qualityScores.length > 0 
          ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length 
          : 0;

        return {
          ...prev,
          isProcessing: false,
          activeRequests: newActiveRequests,
          completedAnalyses: newCompletedAnalyses,
          validationResults: newValidationResults,
          qualityMetrics: newQualityMetrics,
          statistics: {
            ...prev.statistics,
            totalRequests: prev.statistics.totalRequests + 1,
            successfulAnalyses: prev.statistics.successfulAnalyses + 1,
            averageQualityScore
          }
        };
      });

      return {
        analysisId,
        imageAnalysis,
        aiAnalysis,
        validation,
        quality
      };

    } catch (error) {
      setState(prev => ({
        ...prev,
        isProcessing: false,
        error: error instanceof Error ? error.message : 'Error en análisis de imagen',
        statistics: {
          ...prev.statistics,
          totalRequests: prev.statistics.totalRequests + 1,
          failedAnalyses: prev.statistics.failedAnalyses + 1
        }
      }));
      throw error;
    }
  }, []);

  // Obtener estado de solicitud
  const getRequestStatus = useCallback(async (requestId: string) => {
    try {
      const status = await aiAgentService.getAnalysisStatus(requestId);
      
      // Actualizar estado local
      setActiveRequests(prev => {
        const newMap = new Map(prev);
        const request = newMap.get(requestId);
        if (request && status) {
          newMap.set(requestId, {
            ...request,
            status: status as any,
            progress: status === 'completed' ? 100 : 
                    status === 'processing' ? 50 : 
                    status === 'failed' ? 0 : 10
          });
        }
        return newMap;
      });

      return status;
    } catch (error) {
      console.error('[useAIServices] Error getting request status:', error);
      return null;
    }
  }, []);

  // Obtener resultado de análisis
  const getAnalysisResult = useCallback(async (requestId: string): Promise<AIAnalysisResult | null> => {
    try {
      const result = await aiAgentService.getAnalysisResult(requestId);
      
      if (result && result.status === 'completed') {
        // Remover de solicitudes activas
        setActiveRequests(prev => {
          const newMap = new Map(prev);
          newMap.delete(requestId);
          return newMap;
        });
      }
      
      return result;
    } catch (error) {
      console.error('[useAIServices] Error getting analysis result:', error);
      return null;
    }
  }, []);

  // Cancelar solicitud
  const cancelRequest = useCallback(async (requestId: string): Promise<boolean> => {
    try {
      const success = await aiAgentService.cancelAnalysisRequest(requestId);
      
      if (success) {
        setActiveRequests(prev => {
          const newMap = new Map(prev);
          newMap.delete(requestId);
          return newMap;
        });
      }
      
      return success;
    } catch (error) {
      console.error('[useAIServices] Error cancelling request:', error);
      return false;
    }
  }, []);

  // Actualizar configuración de agente
  const updateAgentConfig = useCallback(async (
    agentType: AIAgentType,
    config: {
      enabled?: boolean;
      autoAnalyze?: boolean;
      priority?: AnalysisPriority;
      confidenceThreshold?: number;
    }
  ) => {
    try {
      await aiAgentService.updateAgentConfig(agentType, config);
      
      // Recargar estadísticas
      await initialize();
      
      return true;
    } catch (error) {
      console.error('[useAIServices] Error updating agent config:', error);
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error updating agent config'
      }));
      return false;
    }
  }, [initialize]);

  // Obtener métricas de rendimiento
  const getPerformanceMetrics = useCallback(async (agentType?: AIAgentType) => {
    try {
      return await aiAgentService.getPerformanceMetrics(agentType);
    } catch (error) {
      console.error('[useAIServices] Error getting performance metrics:', error);
      return [];
    }
  }, []);

  // Limpiar datos antiguos
  const cleanupOldData = useCallback(async (daysToKeep: number = 30) => {
    try {
      await aiAgentService.cleanupOldData(daysToKeep);
      imageAnalysisService.cleanupOldResults(daysToKeep);
      
      // Recargar estadísticas
      await initialize();
      
      return true;
    } catch (error) {
      console.error('[useAIServices] Error cleaning up old data:', error);
      return false;
    }
  }, [initialize]);

  // Obtener configuración de análisis de imagen
  const getImageAnalysisConfig = useCallback(() => {
    return imageAnalysisService.getConfig();
  }, []);

  // Actualizar configuración de análisis de imagen
  const updateImageAnalysisConfig = useCallback((config: any) => {
    imageAnalysisService.updateConfig(config);
  }, []);

  // Obtener resultados de análisis de imagen guardados
  const getImageAnalysisResults = useCallback((limit?: number) => {
    return imageAnalysisService.getAnalysisResults(limit);
  }, []);

  // Monitorear solicitudes activas
  useEffect(() => {
    if (activeRequests.size === 0) return;

    const interval = setInterval(async () => {
      for (const [requestId, request] of activeRequests.entries()) {
        if (request.status === 'pending' || request.status === 'processing') {
          await getRequestStatus(requestId);
        }
      }
    }, 2000); // Verificar cada 2 segundos

    return () => clearInterval(interval);
  }, [activeRequests, getRequestStatus]);

  // Inicializar al montar
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Limpiar error después de un tiempo
  useEffect(() => {
    if (state.error) {
      const timeout = setTimeout(() => {
        setState(prev => ({ ...prev, error: null }));
      }, 5000);
      
      return () => clearTimeout(timeout);
    }
  }, [state.error]);

  // Obtener reporte de validación
  const getValidationReport = useCallback((analysisId: string) => {
    const validation = state.validationResults.get(analysisId);
    const quality = state.qualityMetrics.get(analysisId);
    const analysis = state.completedAnalyses.get(analysisId);

    if (!validation || !quality) {
      return null;
    }

    return aiValidationService.generateValidationReport({
      id: analysisId,
      ...analysis
    });
  }, [state.validationResults, state.qualityMetrics, state.completedAnalyses]);

  // Validar datos manualmente
  const validateData = useCallback((data: any): ValidationResult => {
    return aiValidationService.validateAnalysisRequest(data);
  }, []);

  // Calcular métricas de calidad
  const calculateQuality = useCallback((data: any): DataQualityMetrics => {
    return aiValidationService.calculateDataQuality(data);
  }, []);

  // Obtener estadísticas de validación
  const getValidationStatistics = useCallback(() => {
    const validations = Array.from(state.validationResults.values());
    const qualities = Array.from(state.qualityMetrics.values());

    const totalValidations = validations.length;
    const validCount = validations.filter(v => v.isValid).length;
    const errorCount = validations.reduce((sum, v) => sum + v.errors.length, 0);
    const warningCount = validations.reduce((sum, v) => sum + v.warnings.length, 0);

    const averageQuality = qualities.length > 0
      ? qualities.reduce((sum, q) => sum + q.overall, 0) / qualities.length
      : 0;

    const qualityDistribution = {
      excellent: qualities.filter(q => q.overall >= 0.9).length,
      good: qualities.filter(q => q.overall >= 0.75 && q.overall < 0.9).length,
      fair: qualities.filter(q => q.overall >= 0.6 && q.overall < 0.75).length,
      poor: qualities.filter(q => q.overall < 0.6).length
    };

    return {
      totalValidations,
      validCount,
      invalidCount: totalValidations - validCount,
      validationRate: totalValidations > 0 ? validCount / totalValidations : 0,
      errorCount,
      warningCount,
      averageQuality,
      qualityDistribution
    };
  }, [state.validationResults, state.qualityMetrics]);

  // Limpiar datos de validación antiguos
  const clearOldValidationData = useCallback((olderThanDays: number = 7) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - olderThanDays);

    setState(prev => {
      const newValidationResults = new Map(prev.validationResults);
      const newQualityMetrics = new Map(prev.qualityMetrics);
      const newCompletedAnalyses = new Map(prev.completedAnalyses);

      // Filtrar por fecha
      for (const [id, analysis] of prev.completedAnalyses) {
        if (analysis.timestamp && new Date(analysis.timestamp) < cutoffDate) {
          newValidationResults.delete(id);
          newQualityMetrics.delete(id);
          newCompletedAnalyses.delete(id);
        }
      }

      return {
        ...prev,
        validationResults: newValidationResults,
        qualityMetrics: newQualityMetrics,
        completedAnalyses: newCompletedAnalyses
      };
    });
  }, []);

  return {
    // Estado
    ...state,
    activeRequests: Array.from(activeRequests.entries()).map(([id, request]) => ({
      id,
      ...request
    })),
    
    // Acciones
    initialize,
    analyzeImage,
    getRequestStatus,
    getAnalysisResult,
    cancelRequest,
    updateAgentConfig,
    getPerformanceMetrics,
    cleanupOldData,
    
    // Configuración de análisis de imagen
    getImageAnalysisConfig,
    updateImageAnalysisConfig,
    getImageAnalysisResults,
    
    // Validación y calidad
    getValidationReport,
    validateData,
    calculateQuality,
    getValidationStatistics,
    clearOldValidationData,
    
    // Utilidades
    clearError: () => setState(prev => ({ ...prev, error: null })),
    refreshStats: initialize
  };
}
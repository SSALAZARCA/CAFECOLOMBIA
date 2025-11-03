import { useState, useEffect, useCallback, useRef } from 'react';
import { aiService, AIAnalysisRequest, AIAnalysisResult, AIAgentType } from '../services/aiService';
import { analysisQueueService, QueueItem, QueueStats } from '../services/analysisQueue';

export interface UseAIAnalysisOptions {
  autoStart?: boolean;
  retryAttempts?: number;
  onComplete?: (result: AIAnalysisResult) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: number) => void;
}

export interface UseAIAnalysisReturn {
  isAnalyzing: boolean;
  progress: number;
  result: AIAnalysisResult | null;
  error: string | null;
  queuePosition: number;
  estimatedTime: number;
  startAnalysis: (request: AIAnalysisRequest) => Promise<void>;
  cancelAnalysis: () => void;
  retryAnalysis: () => Promise<void>;
  clearResult: () => void;
  clearError: () => void;
}

export const useAIAnalysis = (
  options: UseAIAnalysisOptions = {}
): UseAIAnalysisReturn => {
  const {
    autoStart = false,
    retryAttempts = 3,
    onComplete,
    onError,
    onProgress
  } = options;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<AIAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queuePosition, setQueuePosition] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState(0);

  const currentRequestRef = useRef<AIAnalysisRequest | null>(null);
  const analysisIdRef = useRef<string | null>(null);
  const retryCountRef = useRef(0);

  // Iniciar análisis
  const startAnalysis = useCallback(async (request: AIAnalysisRequest) => {
    try {
      setIsAnalyzing(true);
      setProgress(0);
      setResult(null);
      setError(null);
      setQueuePosition(0);
      retryCountRef.current = 0;

      currentRequestRef.current = request;

      // Solicitar análisis al servicio de IA
      const analysisId = await aiService.requestAnalysis(request);
      analysisIdRef.current = analysisId;

      // Monitorear progreso
      const progressInterval = setInterval(async () => {
        try {
          const queueStats = await analysisQueueService.getQueueStats();
          const queueItem = await analysisQueueService.getQueueItem(analysisId);

          if (queueItem) {
            setQueuePosition(queueItem.priority || 0);
            
            // Simular progreso basado en el estado
            if (queueItem.status === 'processing') {
              setProgress(prev => Math.min(prev + 10, 90));
            } else if (queueItem.status === 'completed') {
              setProgress(100);
              clearInterval(progressInterval);
              
              // Obtener resultado
              const analysisResult = await aiService.getAnalysisResult(analysisId);
              if (analysisResult) {
                setResult(analysisResult);
                setIsAnalyzing(false);
                onComplete?.(analysisResult);
              }
            } else if (queueItem.status === 'failed') {
              clearInterval(progressInterval);
              const errorMsg = queueItem.error || 'Analysis failed';
              setError(errorMsg);
              setIsAnalyzing(false);
              onError?.(new Error(errorMsg));
            }

            // Estimar tiempo restante
            const avgProcessingTime = queueStats.averageProcessingTime || 30000; // 30 segundos por defecto
            const estimatedMs = avgProcessingTime * (queueStats.pending + queueStats.processing);
            setEstimatedTime(Math.ceil(estimatedMs / 1000));

            // Reportar progreso
            onProgress?.(progress);
          }
        } catch (err) {
          console.error('Error monitoring analysis progress:', err);
        }
      }, 2000); // Verificar cada 2 segundos

      // Limpiar intervalo después de 5 minutos (timeout)
      setTimeout(() => {
        clearInterval(progressInterval);
        if (isAnalyzing) {
          setError('Analysis timeout');
          setIsAnalyzing(false);
          onError?.(new Error('Analysis timeout'));
        }
      }, 300000); // 5 minutos

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to start analysis');
      setIsAnalyzing(false);
      onError?.(err instanceof Error ? err : new Error('Failed to start analysis'));
    }
  }, [isAnalyzing, progress, onComplete, onError, onProgress]);

  // Cancelar análisis
  const cancelAnalysis = useCallback(() => {
    if (analysisIdRef.current) {
      analysisQueueService.cancelQueueItem(analysisIdRef.current);
      analysisIdRef.current = null;
    }
    
    currentRequestRef.current = null;
    setIsAnalyzing(false);
    setProgress(0);
    setError(null);
  }, []);

  // Reintentar análisis
  const retryAnalysis = useCallback(async () => {
    if (!currentRequestRef.current) {
      setError('No analysis to retry');
      return;
    }

    if (retryCountRef.current >= retryAttempts) {
      setError(`Maximum retry attempts (${retryAttempts}) exceeded`);
      return;
    }

    retryCountRef.current++;
    setError(null);
    
    await startAnalysis(currentRequestRef.current);
  }, [startAnalysis, retryAttempts]);

  // Limpiar resultado
  const clearResult = useCallback(() => {
    setResult(null);
    setProgress(0);
  }, []);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Auto-start si está habilitado y hay una solicitud pendiente
  useEffect(() => {
    if (autoStart && currentRequestRef.current && !isAnalyzing && !result) {
      startAnalysis(currentRequestRef.current);
    }
  }, [autoStart, isAnalyzing, result, startAnalysis]);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      if (analysisIdRef.current) {
        analysisQueueService.cancelQueueItem(analysisIdRef.current);
      }
    };
  }, []);

  return {
    isAnalyzing,
    progress,
    result,
    error,
    queuePosition,
    estimatedTime,
    startAnalysis,
    cancelAnalysis,
    retryAnalysis,
    clearResult,
    clearError
  };
};

// Hook especializado para análisis de imágenes
export const useImageAnalysis = (agentType: AIAgentType = 'phytosanitary') => {
  const analysis = useAIAnalysis({
    retryAttempts: 2,
    onComplete: (result) => {
      console.log(`${agentType} analysis completed:`, result);
    },
    onError: (error) => {
      console.error(`${agentType} analysis failed:`, error);
    }
  });

  const analyzeImage = useCallback(async (
    imageBlob: Blob,
    metadata?: Record<string, any>
  ) => {
    const request: AIAnalysisRequest = {
      agentType,
      imageData: imageBlob,
      metadata: {
        timestamp: new Date().toISOString(),
        source: 'camera',
        ...metadata
      },
      priority: agentType === 'phytosanitary' ? 'high' : 'medium'
    };

    await analysis.startAnalysis(request);
  }, [agentType, analysis]);

  return {
    ...analysis,
    analyzeImage
  };
};

// Hook para análisis por lotes
export const useBatchAnalysis = () => {
  const [batchProgress, setBatchProgress] = useState(0);
  const [batchResults, setBatchResults] = useState<AIAnalysisResult[]>([]);
  const [batchErrors, setBatchErrors] = useState<string[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const processBatch = useCallback(async (
    requests: AIAnalysisRequest[]
  ) => {
    setIsProcessingBatch(true);
    setBatchProgress(0);
    setBatchResults([]);
    setBatchErrors([]);

    const results: AIAnalysisResult[] = [];
    const errors: string[] = [];

    for (let i = 0; i < requests.length; i++) {
      try {
        const analysisId = await aiService.requestAnalysis(requests[i]);
        
        // Esperar resultado (simplificado para el ejemplo)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const result = await aiService.getAnalysisResult(analysisId);
        if (result) {
          results.push(result);
        }
      } catch (error) {
        errors.push(error instanceof Error ? error.message : 'Unknown error');
      }

      // Actualizar progreso
      const progress = ((i + 1) / requests.length) * 100;
      setBatchProgress(progress);
    }

    setBatchResults(results);
    setBatchErrors(errors);
    setIsProcessingBatch(false);
  }, []);

  return {
    batchProgress,
    batchResults,
    batchErrors,
    isProcessingBatch,
    processBatch
  };
};

// Hook para estadísticas de análisis
export const useAnalysisStats = () => {
  const [stats, setStats] = useState<QueueStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshStats = useCallback(async () => {
    try {
      const queueStats = await analysisQueueService.getQueueStats();
      setStats(queueStats);
    } catch (error) {
      console.error('Error loading analysis stats:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshStats();
    
    // Refrescar cada 30 segundos
    const interval = setInterval(refreshStats, 30000);
    return () => clearInterval(interval);
  }, [refreshStats]);

  return {
    stats,
    isLoading,
    refreshStats
  };
};
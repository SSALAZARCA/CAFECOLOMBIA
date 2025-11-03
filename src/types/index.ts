// Exportaciones centralizadas de todos los tipos de IA
export * from './ai';
export * from './aiDatabase';
export * from './aiServices';
export * from './aiSchemas';

// Re-exportaciones específicas para facilitar el uso
export type {
  // Tipos base
  AgentType,
  Priority,
  ProcessingStatus,
  SyncStatus,
  
  // Interfaces de base de datos
  AIAnalysisResult,
  PhytosanitaryAnalysis,
  PredictiveAnalysis,
  RAGQuery,
  OptimizationAnalysis,
  AINotification,
  AIMetrics,
  AISession,
  AIModelCache,
  AIErrorLog,
  AIUserPreferences,
  AIProcessingQueue,
  AIAgentConfig,
  AISystemStatus,
  
  // Interfaces de servicios
  AIAnalysisService,
  ImageAnalysisRequest,
  ImageAnalysisResponse,
  PredictiveAnalysisRequest,
  PredictiveAnalysisResponse,
  RAGQueryRequest,
  RAGQueryResponse,
  OptimizationRequest,
  OptimizationResponse,
  
  // Interfaces de validación
  ValidationSchema,
  ValidationResult,
  ValidationError,
  SafeParseResult
} from './aiDatabase';

export type {
  // Tipos originales de ai.ts
  EstadoProcesamiento,
  TipoAgente,
  NivelConfianza,
  SeveridadRiesgo,
  DiagnosticoIA,
  DiagnosticoDetalle,
  RecomendacionTratamiento,
  MetadatosImagen,
  DatosPrediccion,
  FactorRiesgo,
  AccionPreventiva,
  DatosAmbientales,
  ConsultaRAG,
  RespuestaRAG,
  FuenteDocumento,
  AccionRecomendada,
  EnlaceModulo,
  CategoriaConsulta,
  ContextoFinca,
  MetricasOptimizacion,
  AnalisisCostos,
  AnalisisProduccion,
  AnalisisCalidad,
  AnalisisEficiencia,
  CorrelacionesDetectadas,
  CorrelacionSignificativa,
  RecomendacionOptimizacion,
  OportunidadAhorro,
  FactorProduccion,
  FactorCalidad,
  CorrelacionProceso,
  ComparacionBenchmark,
  TareaIA,
  ResultadoIA,
  ConfiguracionAgente,
  EstadoSistemaIA,
  EstadisticasUso
} from './ai';

export {
  // Esquemas de validación
  AISchemas,
  AgentTypeSchema,
  PrioritySchema,
  ProcessingStatusSchema,
  AIAnalysisResultSchema,
  AINotificationSchema,
  validatePhytosanitaryAnalysis,
  validatePredictiveAnalysis,
  validateImageFile,
  validateCoordinates,
  validateAIConfig,
  sanitizeString,
  sanitizeNumber,
  sanitizeObject,
  createValidationPipeline
} from './aiSchemas';

// Constantes útiles
export const AGENT_TYPES = ['phytosanitary', 'predictive', 'rag_assistant', 'optimization'] as const;
export const PRIORITIES = ['low', 'medium', 'high', 'critical'] as const;
export const PROCESSING_STATUSES = ['pending', 'processing', 'completed', 'failed', 'cancelled'] as const;
export const SYNC_STATUSES = ['pending', 'syncing', 'synced', 'failed'] as const;

// Mapas de traducción para la UI
export const AGENT_TYPE_LABELS = {
  phytosanitary: 'Fitosanitario',
  predictive: 'Predictivo',
  rag_assistant: 'Asistente RAG',
  optimization: 'Optimización'
} as const;

export const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  critical: 'Crítica'
} as const;

export const STATUS_LABELS = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
  cancelled: 'Cancelado'
} as const;

export const SYNC_STATUS_LABELS = {
  pending: 'Pendiente',
  syncing: 'Sincronizando',
  synced: 'Sincronizado',
  failed: 'Error'
} as const;

// Tipos de utilidad
export type AIAgentTypeKey = keyof typeof AGENT_TYPE_LABELS;
export type PriorityKey = keyof typeof PRIORITY_LABELS;
export type StatusKey = keyof typeof STATUS_LABELS;
export type SyncStatusKey = keyof typeof SYNC_STATUS_LABELS;

// Funciones de utilidad para tipos
export const isValidAgentType = (type: string): type is AgentType => {
  return AGENT_TYPES.includes(type as AgentType);
};

export const isValidPriority = (priority: string): priority is Priority => {
  return PRIORITIES.includes(priority as Priority);
};

export const isValidProcessingStatus = (status: string): status is ProcessingStatus => {
  return PROCESSING_STATUSES.includes(status as ProcessingStatus);
};

export const isValidSyncStatus = (status: string): status is SyncStatus => {
  return SYNC_STATUSES.includes(status as SyncStatus);
};

// Funciones de conversión
export const getAgentTypeLabel = (type: AgentType): string => {
  return AGENT_TYPE_LABELS[type] || type;
};

export const getPriorityLabel = (priority: Priority): string => {
  return PRIORITY_LABELS[priority] || priority;
};

export const getStatusLabel = (status: ProcessingStatus): string => {
  return STATUS_LABELS[status] || status;
};

export const getSyncStatusLabel = (status: SyncStatus): string => {
  return SYNC_STATUS_LABELS[status] || status;
};

// Tipos para configuración por defecto
export interface DefaultAIConfig {
  phytosanitary: {
    confidenceThreshold: number;
    maxDetections: number;
    enableRecommendations: boolean;
    autoAnalysis: boolean;
  };
  predictive: {
    timeHorizon: number;
    riskThreshold: number;
    includeWeatherData: boolean;
    updateInterval: number;
  };
  rag_assistant: {
    maxSources: number;
    responseLength: 'short' | 'medium' | 'long';
    technicalLevel: 'basic' | 'intermediate' | 'advanced';
    language: 'es' | 'en';
  };
  optimization: {
    analysisDepth: 'basic' | 'standard' | 'comprehensive';
    includeScenarios: boolean;
    benchmarkComparison: boolean;
    timeframe: number;
  };
}

// Configuración por defecto
export const DEFAULT_AI_CONFIG: DefaultAIConfig = {
  phytosanitary: {
    confidenceThreshold: 0.7,
    maxDetections: 10,
    enableRecommendations: true,
    autoAnalysis: false
  },
  predictive: {
    timeHorizon: 30,
    riskThreshold: 0.6,
    includeWeatherData: true,
    updateInterval: 24
  },
  rag_assistant: {
    maxSources: 5,
    responseLength: 'medium',
    technicalLevel: 'intermediate',
    language: 'es'
  },
  optimization: {
    analysisDepth: 'standard',
    includeScenarios: true,
    benchmarkComparison: true,
    timeframe: 12
  }
};

// Tipos para eventos del sistema de IA
export interface AISystemEvent {
  type: 'analysis_started' | 'analysis_completed' | 'analysis_failed' | 'sync_started' | 'sync_completed' | 'sync_failed' | 'notification_created' | 'error_logged';
  timestamp: Date;
  agentType?: AgentType;
  data?: any;
  metadata?: Record<string, any>;
}

export type AIEventListener = (event: AISystemEvent) => void;

// Tipos para métricas del sistema
export interface AISystemMetrics {
  totalAnalyses: number;
  successfulAnalyses: number;
  failedAnalyses: number;
  averageProcessingTime: number;
  queueSize: number;
  activeAgents: AgentType[];
  lastSync: Date;
  errorRate: number;
  uptime: number;
}

// Tipos para configuración de límites
export interface AILimits {
  maxConcurrentAnalyses: number;
  maxQueueSize: number;
  maxRetryAttempts: number;
  requestTimeout: number;
  maxImageSize: number;
  maxDailyRequests: number;
  maxHourlyRequests: number;
}

export const DEFAULT_AI_LIMITS: AILimits = {
  maxConcurrentAnalyses: 3,
  maxQueueSize: 100,
  maxRetryAttempts: 3,
  requestTimeout: 30000,
  maxImageSize: 10 * 1024 * 1024, // 10MB
  maxDailyRequests: 1000,
  maxHourlyRequests: 100
};

// Tipos para estado de conectividad
export interface AIConnectivityStatus {
  isOnline: boolean;
  lastOnline: Date;
  connectionType: 'wifi' | 'cellular' | 'ethernet' | 'unknown';
  connectionSpeed: 'slow' | 'medium' | 'fast' | 'unknown';
  latency: number;
  bandwidth: number;
}

// Tipos para caché de resultados
export interface AICacheEntry<T = any> {
  key: string;
  data: T;
  timestamp: Date;
  expiresAt: Date;
  size: number;
  hits: number;
  agentType: AgentType;
}

export interface AICacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  missRate: number;
  oldestEntry: Date;
  newestEntry: Date;
  entriesByAgent: Record<AgentType, number>;
}

// Tipos para análisis de rendimiento
export interface AIPerformanceProfile {
  agentType: AgentType;
  averageProcessingTime: number;
  medianProcessingTime: number;
  p95ProcessingTime: number;
  p99ProcessingTime: number;
  successRate: number;
  errorRate: number;
  throughput: number; // requests per minute
  resourceUsage: {
    cpu: number;
    memory: number;
    network: number;
  };
}

// Tipos para alertas del sistema
export interface AISystemAlert {
  id: string;
  type: 'performance' | 'error' | 'quota' | 'connectivity' | 'storage';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  resolvedAt?: Date;
  metadata?: Record<string, any>;
}

// Tipos para configuración de monitoreo
export interface AIMonitoringConfig {
  enablePerformanceMonitoring: boolean;
  enableErrorTracking: boolean;
  enableUsageTracking: boolean;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    queueSize: number;
    memoryUsage: number;
  };
  retentionPeriod: number; // days
  samplingRate: number; // 0-1
}

export const DEFAULT_MONITORING_CONFIG: AIMonitoringConfig = {
  enablePerformanceMonitoring: true,
  enableErrorTracking: true,
  enableUsageTracking: true,
  alertThresholds: {
    errorRate: 0.1, // 10%
    responseTime: 30000, // 30 seconds
    queueSize: 50,
    memoryUsage: 0.8 // 80%
  },
  retentionPeriod: 30,
  samplingRate: 1.0
};
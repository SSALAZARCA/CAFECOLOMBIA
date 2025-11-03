// Interfaces específicas para base de datos y servicios de IA
import { 
  TipoAgente, 
  EstadoProcesamiento, 
  DiagnosticoIA, 
  DatosPrediccion, 
  ConsultaRAG, 
  MetricasOptimizacion 
} from './ai';

// Tipos base para sincronización y estado
export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type AgentType = 'phytosanitary' | 'predictive' | 'rag_assistant' | 'optimization';
export type Priority = 'low' | 'medium' | 'high' | 'critical';

// Interfaces para análisis de IA en base de datos
export interface AIAnalysisResult {
  id?: number;
  agentType: AgentType;
  inputData: any;
  result?: any;
  status: ProcessingStatus;
  priority: Priority;
  createdAt: Date;
  completedAt?: Date;
  processingTime?: number;
  confidence?: number;
  errorMessage?: string;
  retryCount: number;
  maxRetries: number;
  metadata?: Record<string, any>;
  syncStatus?: SyncStatus;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

// Interfaces para análisis fitosanitario específico
export interface PhytosanitaryAnalysis {
  id: string;
  imageId: string;
  lotId?: string;
  detections: PhytosanitaryDetection[];
  overallConfidence: number;
  recommendations: PhytosanitaryRecommendation[];
  severity: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'immediate' | '24h' | '48h' | 'weekly';
  processedAt: Date;
  modelVersion: string;
}

export interface PhytosanitaryDetection {
  type: 'pest' | 'disease' | 'deficiency' | 'stress';
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  affectedArea: number; // percentage
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

export interface PhytosanitaryRecommendation {
  action: string;
  priority: number;
  estimatedCost: number;
  timeframe: string;
  materials: string[];
  linkedModule?: 'supplies' | 'mip' | 'tasks';
  effectiveness: number; // 0-100
}

// Interfaces para análisis predictivo
export interface PredictiveAnalysis {
  id: string;
  farmId: string;
  predictionType: 'rust' | 'borer' | 'leaf_spot' | 'anthracnose' | 'general';
  riskProbability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedRiskDate: Date;
  validityDays: number;
  riskFactors: PredictiveRiskFactor[];
  preventiveActions: PredictiveAction[];
  environmentalData: EnvironmentalData;
  modelVersion: string;
  processedAt: Date;
}

export interface PredictiveRiskFactor {
  factor: string;
  type: 'climatic' | 'biological' | 'agricultural' | 'regional';
  value: number;
  impact: number; // contribution to total risk
  trend: 'increasing' | 'stable' | 'decreasing';
  description: string;
}

export interface PredictiveAction {
  action: string;
  timeWindow: string;
  effectiveness: number; // 0-100
  cost: number;
  complexity: 'low' | 'medium' | 'high';
  resources: string[];
}

export interface EnvironmentalData {
  date: Date;
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  humidity: {
    relative: number;
    absolute?: number;
  };
  precipitation: {
    amount: number; // mm
    intensity: 'light' | 'moderate' | 'heavy';
    duration: number; // hours
  };
  wind: {
    speed: number; // km/h
    direction: string;
  };
  atmosphericPressure: number;
  solarRadiation: number;
  dataSource: 'sensor' | 'api' | 'manual' | 'estimated';
  reliability: number; // 0-100
}

// Interfaces para consultas RAG
export interface RAGQuery {
  id: string;
  userId: string;
  query: string;
  category: RAGCategory;
  farmContext: FarmContext;
  response?: RAGResponse;
  status: ProcessingStatus;
  satisfaction?: number; // 1-5
  followUp?: string[];
  createdAt: Date;
  completedAt?: Date;
}

export type RAGCategory = 
  | 'pests_diseases'
  | 'fertilization'
  | 'regulations'
  | 'best_practices'
  | 'costs'
  | 'quality'
  | 'processing'
  | 'marketing'
  | 'general';

export interface RAGResponse {
  content: string;
  sources: DocumentSource[];
  confidence: number;
  recommendedActions: RecommendedAction[];
  relevantLinks: ModuleLink[];
  responseTime: number; // ms
  tokensUsed: number;
}

export interface DocumentSource {
  id: string;
  type: 'FNC' | 'ICA' | 'BPA' | 'REGULATION' | 'TECHNICAL';
  title: string;
  section?: string;
  relevance: number; // 0-1
  publicationDate: Date;
  url?: string;
}

export interface RecommendedAction {
  action: string;
  module: 'supplies' | 'mip' | 'farm' | 'traceability' | 'external';
  parameters?: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  description: string;
}

export interface ModuleLink {
  module: string;
  route: string;
  description: string;
  parameters?: Record<string, any>;
}

export interface FarmContext {
  farmId: string;
  location: {
    department: string;
    municipality: string;
    altitude: number;
    coordinates?: { lat: number; lng: number };
  };
  characteristics: {
    totalArea: number;
    coffeeVarieties: string[];
    averageAge: number;
    productionSystem: 'traditional' | 'technified' | 'organic';
  };
  currentState: {
    lots: number;
    recentProblems: string[];
    activeTreatments: string[];
    upcomingHarvests: Date[];
  };
  history: {
    previousProduction: number;
    commonProblems: string[];
    successfulTreatments: string[];
  };
}

// Interfaces para análisis de optimización
export interface OptimizationAnalysis {
  id: string;
  farmId: string;
  period: {
    start: Date;
    end: Date;
    type: 'monthly' | 'quarterly' | 'semi-annual' | 'annual';
  };
  costs: CostAnalysis;
  production: ProductionAnalysis;
  quality: QualityAnalysis;
  efficiency: EfficiencyAnalysis;
  correlations: DetectedCorrelations;
  recommendations: OptimizationRecommendation[];
  benchmarking?: BenchmarkComparison;
  processedAt: Date;
  modelVersion: string;
}

export interface CostAnalysis {
  total: number;
  byCategory: {
    fertilizers: number;
    pesticides: number;
    labor: number;
    machinery: number;
    others: number;
  };
  costPerKg: number;
  trend: 'increasing' | 'stable' | 'decreasing';
  spendingEfficiency: number; // 0-100
  savingOpportunities: SavingOpportunity[];
}

export interface ProductionAnalysis {
  totalKg: number;
  kgPerHectare: number;
  distributionByLot: Record<string, number>;
  productionTrend: 'increasing' | 'stable' | 'decreasing';
  influencingFactors: ProductionFactor[];
  nextHarvestProjection: number;
}

export interface QualityAnalysis {
  averageCupScore: number;
  qualityDistribution: Record<string, number>; // excellent, good, regular
  qualityFactors: QualityFactor[];
  processCorrelations: ProcessCorrelation[];
  improvementOpportunities: string[];
}

export interface EfficiencyAnalysis {
  overallEfficiency: number; // 0-100
  efficiencyByProcess: Record<string, number>;
  optimalTimes: Record<string, number>;
  optimalResources: Record<string, number>;
  detectedWaste: number;
}

export interface DetectedCorrelations {
  costVsProduction: number; // -1 to 1
  treatmentVsQuality: number;
  climateVsYield: number;
  fertilizationVsProduction: number;
  fermentationTimeVsQuality: number;
  significantCorrelations: SignificantCorrelation[];
}

export interface SignificantCorrelation {
  variables: [string, string];
  coefficient: number;
  significance: number;
  interpretation: string;
  recommendation: string;
}

export interface OptimizationRecommendation {
  type: 'cost' | 'production' | 'quality' | 'efficiency';
  title: string;
  description: string;
  estimatedImpact: {
    savings?: number;
    productionIncrease?: number;
    qualityImprovement?: number;
  };
  implementationComplexity: 'low' | 'medium' | 'high';
  implementationTime: string;
  requiredResources: string[];
  priority: number; // 1-10
  confidence: number; // 0-100
}

export interface SavingOpportunity {
  category: string;
  description: string;
  estimatedSaving: number;
  savingPercentage: number;
  implementationEase: 'easy' | 'moderate' | 'difficult';
  risk: 'low' | 'medium' | 'high';
}

export interface ProductionFactor {
  factor: string;
  impact: number; // -100 to 100
  controllable: boolean;
  recommendation?: string;
}

export interface QualityFactor {
  factor: string;
  correlation: number; // -1 to 1
  importance: number; // 0-100
  optimizable: boolean;
  optimalValue?: number | string;
}

export interface ProcessCorrelation {
  process: string;
  parameter: string;
  qualityCorrelation: number;
  optimalRange: [number, number];
  unit: string;
}

export interface BenchmarkComparison {
  percentilePosition: number; // 0-100
  comparisonMetrics: Record<string, {
    value: number;
    average: number;
    top10: number;
  }>;
  strengthAreas: string[];
  improvementAreas: string[];
  benchmarkRecommendations: string[];
}

// Interfaces para cola de procesamiento de IA
export interface AIProcessingQueue {
  id?: number;
  agentType: AgentType;
  inputData: any;
  priority: Priority;
  status: ProcessingStatus;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  scheduledAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
  result?: any;
  estimatedTime?: number; // seconds
  actualTime?: number; // seconds
  metadata?: Record<string, any>;
}

// Interfaces para configuración de agentes
export interface AIAgentConfig {
  agentType: AgentType;
  isActive: boolean;
  configuration: Record<string, any>;
  lastUpdated: Date;
  version: string;
  limits: {
    requestsPerDay: number;
    requestsPerHour: number;
    maxImageSize: number; // MB
    maxQueueSize: number;
  };
  endpoints: {
    primary: string;
    fallback?: string;
  };
  authentication: {
    apiKey?: string;
    token?: string;
    refreshToken?: string;
    expiresAt?: Date;
  };
}

// Interfaces para estado del sistema de IA
export interface AISystemStatus {
  activeAgents: AgentType[];
  queuedTasks: number;
  processingTasks: number;
  lastSync: Date;
  cloudConnectivity: boolean;
  serviceStatus: Record<string, 'active' | 'inactive' | 'error'>;
  usageStats: UsageStatistics;
  performance: PerformanceMetrics;
}

export interface UsageStatistics {
  totalQueries: number;
  successfulQueries: number;
  averageResponseTime: number;
  usageByAgent: Record<AgentType, number>;
  averageSatisfaction: number;
  lastReset: Date;
  dailyUsage: Record<string, number>;
  weeklyUsage: Record<string, number>;
  monthlyUsage: Record<string, number>;
}

export interface PerformanceMetrics {
  averageProcessingTime: Record<AgentType, number>;
  successRate: Record<AgentType, number>;
  errorRate: Record<AgentType, number>;
  queueWaitTime: number;
  systemLoad: number; // 0-100
  memoryUsage: number; // MB
  diskUsage: number; // MB
  networkLatency: number; // ms
}

// Interfaces para notificaciones de IA
export interface AINotification {
  id?: number;
  agentType: AgentType;
  type: 'result' | 'alert' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  data?: any;
  priority: Priority;
  isRead: boolean;
  createdAt: Date;
  readAt?: Date;
  expiresAt?: Date;
  actionRequired: boolean;
  actions?: NotificationAction[];
  relatedId?: string; // ID of related analysis, task, etc.
  syncStatus?: SyncStatus;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

export interface NotificationAction {
  id: string;
  label: string;
  action: string;
  parameters?: Record<string, any>;
  style: 'primary' | 'secondary' | 'danger' | 'warning';
}

// Interfaces para métricas y estadísticas avanzadas
export interface AIMetrics {
  id?: number;
  agentType: AgentType;
  date: Date;
  metrics: {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    averageConfidence: number;
    totalProcessingTime: number;
    queueWaitTime: number;
    errorRate: number;
    satisfactionScore?: number;
  };
  performance: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkUsage: number;
  };
  costs: {
    apiCalls: number;
    computeTime: number;
    storageUsed: number;
    totalCost: number;
  };
  syncStatus?: SyncStatus;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

// Interfaces para sesiones de análisis de IA
export interface AISession {
  id?: number;
  agentType: AgentType;
  userId: string;
  sessionType: 'analysis' | 'consultation' | 'optimization' | 'prediction';
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // seconds
  status: 'active' | 'completed' | 'cancelled' | 'error';
  tasksCompleted: number;
  totalTasks: number;
  results: any[];
  metadata: {
    farmId?: string;
    lotId?: string;
    context?: Record<string, any>;
  };
  satisfaction?: number; // 1-5
  feedback?: string;
  syncStatus?: SyncStatus;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

// Interfaces para caché de modelos de IA
export interface AIModelCache {
  id?: number;
  agentType: AgentType;
  modelName: string;
  modelVersion: string;
  modelData?: Blob; // Model data for offline use
  modelSize: number;
  downloadedAt: Date;
  lastUsed: Date;
  isActive: boolean;
  expiresAt?: Date;
  checksum?: string;
  metadata?: Record<string, any>;
  syncStatus?: SyncStatus;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

// Interfaces para logs de errores de IA
export interface AIErrorLog {
  id?: number;
  agentType: AgentType;
  errorType: 'processing' | 'sync' | 'network' | 'validation' | 'system';
  errorCode?: string;
  errorMessage: string;
  stackTrace?: string;
  context: {
    requestId?: string;
    userId?: string;
    farmId?: string;
    inputData?: any;
    timestamp: Date;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  isResolved: boolean;
  resolvedAt?: Date;
  resolution?: string;
  occurrenceCount: number;
  firstOccurrence: Date;
  lastOccurrence: Date;
  syncStatus?: SyncStatus;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

// Interfaces para preferencias de usuario de IA
export interface AIUserPreferences {
  id?: number;
  userId: string;
  agentType?: AgentType; // null for global preferences
  preferences: {
    autoAnalysis: boolean;
    notificationLevel: 'all' | 'important' | 'critical' | 'none';
    preferredLanguage: 'es' | 'en';
    confidenceThreshold: number; // 0-100
    maxWaitTime: number; // seconds
    enableOfflineMode: boolean;
    dataRetentionDays: number;
    shareAnalytics: boolean;
  };
  customSettings?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  syncStatus?: SyncStatus;
  lastSync?: Date;
  pendingSync?: boolean;
  action?: 'create' | 'update' | 'delete';
}

// Tipos de utilidad para validación y transformación
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  severity: 'error' | 'warning';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion?: string;
}

// Interfaces para respuestas de API
export interface AIApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
    version: string;
  };
}

// Interfaces para configuración de sincronización
export interface SyncConfiguration {
  enabled: boolean;
  interval: number; // minutes
  retryAttempts: number;
  retryDelay: number; // seconds
  batchSize: number;
  priorityOrder: AgentType[];
  offlineThreshold: number; // minutes
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
}

// Interfaces para estadísticas de sincronización
export interface SyncStatistics {
  lastSync: Date;
  totalSynced: number;
  pendingSync: number;
  failedSync: number;
  syncErrors: SyncError[];
  averageSyncTime: number;
  dataTransferred: number; // bytes
  compressionRatio?: number;
}

export interface SyncError {
  id: string;
  timestamp: Date;
  agentType: AgentType;
  errorType: string;
  errorMessage: string;
  retryCount: number;
  resolved: boolean;
}
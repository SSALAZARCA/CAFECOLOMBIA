// Interfaces específicas para servicios de IA y APIs
import { AgentType, Priority, ProcessingStatus, AIAnalysisResult } from './aiDatabase';

// Interfaces para servicios de análisis de IA
export interface AIAnalysisService {
  analyzeImage(request: ImageAnalysisRequest): Promise<ImageAnalysisResponse>;
  analyzePredictive(request: PredictiveAnalysisRequest): Promise<PredictiveAnalysisResponse>;
  queryRAG(request: RAGQueryRequest): Promise<RAGQueryResponse>;
  optimizeMetrics(request: OptimizationRequest): Promise<OptimizationResponse>;
  getAnalysisStatus(analysisId: string): Promise<AnalysisStatusResponse>;
  cancelAnalysis(analysisId: string): Promise<CancelAnalysisResponse>;
}

// Interfaces para solicitudes de análisis de imagen
export interface ImageAnalysisRequest {
  id: string;
  agentType: 'phytosanitary';
  imageData: ImageData;
  metadata: ImageMetadata;
  options: AnalysisOptions;
}

export interface ImageData {
  blob: Blob;
  url?: string;
  format: 'jpeg' | 'png' | 'webp';
  size: number; // bytes
  dimensions: {
    width: number;
    height: number;
  };
  quality?: number; // 0-100
}

export interface ImageMetadata {
  capturedAt: Date;
  location?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    altitude?: number;
  };
  camera: {
    make?: string;
    model?: string;
    settings?: CameraSettings;
  };
  plantPart: 'leaf' | 'stem' | 'fruit' | 'root' | 'flower' | 'whole_plant';
  lightingConditions: 'natural' | 'artificial' | 'mixed' | 'poor';
  focusQuality: 'sharp' | 'slightly_blurred' | 'blurred';
  farmContext?: {
    farmId: string;
    lotId?: string;
    plantAge?: number;
    variety?: string;
  };
}

export interface CameraSettings {
  iso?: number;
  aperture?: string;
  shutterSpeed?: string;
  focalLength?: number;
  flash?: boolean;
}

export interface AnalysisOptions {
  priority: Priority;
  enableDetection: {
    pests: boolean;
    diseases: boolean;
    deficiencies: boolean;
    stress: boolean;
  };
  confidenceThreshold: number; // 0-1
  maxDetections: number;
  includeRecommendations: boolean;
  language: 'es' | 'en';
  modelVersion?: string;
}

// Interfaces para respuestas de análisis de imagen
export interface ImageAnalysisResponse {
  analysisId: string;
  status: ProcessingStatus;
  result?: PhytosanitaryResult;
  error?: AnalysisError;
  metadata: ResponseMetadata;
}

export interface PhytosanitaryResult {
  detections: Detection[];
  overallHealth: HealthAssessment;
  recommendations: Recommendation[];
  confidence: number; // 0-1
  processingInfo: ProcessingInfo;
}

export interface Detection {
  id: string;
  type: 'pest' | 'disease' | 'deficiency' | 'stress';
  name: string;
  scientificName?: string;
  confidence: number; // 0-1
  severity: 'low' | 'medium' | 'high' | 'critical';
  boundingBox?: BoundingBox;
  affectedArea: number; // percentage 0-100
  description: string;
  symptoms: string[];
  causes: string[];
  riskFactors: string[];
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface HealthAssessment {
  overallScore: number; // 0-100
  healthStatus: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
  affectedPercentage: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  urgency: 'none' | 'monitor' | 'treat_soon' | 'treat_immediately';
}

export interface Recommendation {
  id: string;
  type: 'treatment' | 'prevention' | 'monitoring' | 'cultural_practice';
  title: string;
  description: string;
  priority: number; // 1-10
  urgency: 'immediate' | '24h' | '48h' | 'weekly' | 'monthly';
  estimatedCost: number;
  timeframe: string;
  materials: Material[];
  steps: ActionStep[];
  effectiveness: number; // 0-100
  linkedModules: string[]; // modules in the app
  alternatives?: Recommendation[];
}

export interface Material {
  name: string;
  type: 'pesticide' | 'fungicide' | 'fertilizer' | 'tool' | 'equipment';
  quantity: number;
  unit: string;
  estimatedCost: number;
  supplier?: string;
  activeIngredient?: string;
  concentration?: string;
}

export interface ActionStep {
  order: number;
  description: string;
  duration: string;
  tools: string[];
  precautions: string[];
  expectedOutcome: string;
}

// Interfaces para análisis predictivo
export interface PredictiveAnalysisRequest {
  id: string;
  agentType: 'predictive';
  farmData: FarmData;
  environmentalData: EnvironmentalDataInput;
  historicalData?: HistoricalData;
  predictionType: PredictionType;
  options: PredictiveOptions;
}

export interface FarmData {
  farmId: string;
  location: {
    latitude: number;
    longitude: number;
    altitude: number;
    department: string;
    municipality: string;
  };
  characteristics: {
    totalArea: number;
    cultivatedArea: number;
    varieties: CoffeeVariety[];
    plantingDensity: number;
    averageAge: number;
    productionSystem: 'traditional' | 'technified' | 'organic';
    irrigationSystem?: 'none' | 'drip' | 'sprinkler' | 'flood';
  };
  currentConditions: {
    phenologicalStage: PhenologicalStage;
    lastTreatments: Treatment[];
    recentProblems: Problem[];
    soilConditions?: SoilConditions;
  };
}

export interface CoffeeVariety {
  name: string;
  percentage: number; // of total area
  plantingDate: Date;
  expectedYield: number; // kg/ha
  resistances: string[];
  vulnerabilities: string[];
}

export interface PhenologicalStage {
  stage: 'flowering' | 'fruit_development' | 'ripening' | 'harvest' | 'rest';
  percentage: number; // completion of stage
  estimatedDuration: number; // days remaining
}

export interface Treatment {
  date: Date;
  type: 'pesticide' | 'fungicide' | 'fertilizer' | 'cultural';
  product: string;
  dosage: string;
  area: number; // hectares
  effectiveness?: number; // 0-100
}

export interface Problem {
  date: Date;
  type: 'pest' | 'disease' | 'deficiency' | 'weather';
  name: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affectedArea: number; // hectares
  treatment?: string;
  resolved: boolean;
}

export interface SoilConditions {
  ph: number;
  organicMatter: number; // percentage
  nitrogen: number; // ppm
  phosphorus: number; // ppm
  potassium: number; // ppm
  moisture: number; // percentage
  temperature: number; // celsius
  lastAnalysis: Date;
}

export interface EnvironmentalDataInput {
  current: CurrentWeather;
  forecast: WeatherForecast[];
  historical?: HistoricalWeather[];
}

export interface CurrentWeather {
  timestamp: Date;
  temperature: number;
  humidity: number;
  precipitation: number;
  windSpeed: number;
  windDirection: number;
  pressure: number;
  solarRadiation: number;
  uvIndex: number;
}

export interface WeatherForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
  };
  humidity: {
    min: number;
    max: number;
  };
  precipitation: {
    probability: number; // 0-100
    amount: number; // mm
  };
  wind: {
    speed: number;
    direction: number;
  };
  conditions: string;
  confidence: number; // 0-100
}

export interface HistoricalWeather {
  date: Date;
  temperature: {
    min: number;
    max: number;
    average: number;
  };
  humidity: number;
  precipitation: number;
  windSpeed: number;
  solarRadiation: number;
}

export interface HistoricalData {
  productions: ProductionRecord[];
  problems: HistoricalProblem[];
  treatments: HistoricalTreatment[];
  yields: YieldRecord[];
}

export interface ProductionRecord {
  year: number;
  totalProduction: number; // kg
  qualityGrade: string;
  averagePrice: number;
  costs: number;
  profitability: number;
}

export interface HistoricalProblem {
  date: Date;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: number; // production loss percentage
  treatment: string;
  cost: number;
  effectiveness: number; // 0-100
}

export interface HistoricalTreatment {
  date: Date;
  type: string;
  product: string;
  cost: number;
  effectiveness: number; // 0-100
  sideEffects?: string[];
}

export interface YieldRecord {
  date: Date;
  variety: string;
  yield: number; // kg/ha
  quality: number; // cup score
  factors: string[]; // contributing factors
}

export type PredictionType = 
  | 'rust_risk'
  | 'borer_risk'
  | 'leaf_spot_risk'
  | 'anthracnose_risk'
  | 'yield_prediction'
  | 'quality_prediction'
  | 'optimal_harvest_time'
  | 'treatment_timing'
  | 'general_risk';

export interface PredictiveOptions {
  timeHorizon: number; // days
  confidenceLevel: number; // 0-1
  includeRecommendations: boolean;
  riskThreshold: number; // 0-1
  modelVersion?: string;
  language: 'es' | 'en';
}

// Interfaces para respuestas de análisis predictivo
export interface PredictiveAnalysisResponse {
  analysisId: string;
  status: ProcessingStatus;
  result?: PredictiveResult;
  error?: AnalysisError;
  metadata: ResponseMetadata;
}

export interface PredictiveResult {
  predictions: Prediction[];
  riskAssessment: RiskAssessment;
  recommendations: PredictiveRecommendation[];
  confidence: number; // 0-1
  validityPeriod: number; // days
  processingInfo: ProcessingInfo;
}

export interface Prediction {
  type: PredictionType;
  probability: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  estimatedDate?: Date;
  confidence: number; // 0-1
  factors: RiskFactor[];
  scenarios: Scenario[];
}

export interface RiskFactor {
  factor: string;
  type: 'environmental' | 'biological' | 'agricultural' | 'historical';
  contribution: number; // 0-1
  trend: 'increasing' | 'stable' | 'decreasing';
  controllable: boolean;
  description: string;
}

export interface Scenario {
  name: string;
  probability: number; // 0-1
  description: string;
  impact: 'low' | 'medium' | 'high' | 'severe';
  timeline: string;
  preventiveMeasures: string[];
}

export interface RiskAssessment {
  overallRisk: number; // 0-1
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  primaryThreats: string[];
  timeToAction: number; // days
  actionRequired: boolean;
  monitoringPoints: string[];
}

export interface PredictiveRecommendation {
  type: 'preventive' | 'monitoring' | 'treatment' | 'cultural';
  action: string;
  timing: string;
  priority: number; // 1-10
  effectiveness: number; // 0-100
  cost: number;
  resources: string[];
  alternatives: string[];
}

// Interfaces para consultas RAG
export interface RAGQueryRequest {
  id: string;
  agentType: 'rag_assistant';
  query: string;
  context: RAGContext;
  options: RAGOptions;
}

export interface RAGContext {
  farmId?: string;
  userId: string;
  language: 'es' | 'en';
  category?: RAGCategory;
  previousQueries?: string[];
  currentModule?: string;
  farmData?: Partial<FarmData>;
  recentProblems?: string[];
  activeTreatments?: string[];
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

export interface RAGOptions {
  maxSources: number;
  includeActions: boolean;
  responseLength: 'short' | 'medium' | 'long';
  technicalLevel: 'basic' | 'intermediate' | 'advanced';
  includeLinks: boolean;
  language: 'es' | 'en';
}

// Interfaces para respuestas RAG
export interface RAGQueryResponse {
  queryId: string;
  status: ProcessingStatus;
  result?: RAGResult;
  error?: AnalysisError;
  metadata: ResponseMetadata;
}

export interface RAGResult {
  answer: string;
  sources: Source[];
  confidence: number; // 0-1
  relevance: number; // 0-1
  actions: SuggestedAction[];
  relatedQueries: string[];
  followUpQuestions: string[];
  processingInfo: ProcessingInfo;
}

export interface Source {
  id: string;
  title: string;
  type: 'FNC' | 'ICA' | 'BPA' | 'REGULATION' | 'TECHNICAL' | 'RESEARCH';
  excerpt: string;
  relevance: number; // 0-1
  url?: string;
  publicationDate?: Date;
  author?: string;
  section?: string;
}

export interface SuggestedAction {
  action: string;
  module: string;
  description: string;
  parameters?: Record<string, any>;
  priority: 'low' | 'medium' | 'high';
  estimatedTime: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

// Interfaces para optimización
export interface OptimizationRequest {
  id: string;
  agentType: 'optimization';
  farmData: FarmData;
  productionData: ProductionDataInput;
  costData: CostDataInput;
  qualityData: QualityDataInput;
  timeframe: TimeframeInput;
  options: OptimizationOptions;
}

export interface ProductionDataInput {
  currentProduction: number; // kg
  targetProduction?: number; // kg
  historicalProduction: ProductionRecord[];
  yieldByLot: Record<string, number>;
  varietyPerformance: Record<string, number>;
  seasonalVariation: SeasonalData[];
}

export interface CostDataInput {
  totalCosts: number;
  costBreakdown: CostBreakdown;
  historicalCosts: CostRecord[];
  benchmarkCosts?: BenchmarkData;
}

export interface CostBreakdown {
  labor: number;
  fertilizers: number;
  pesticides: number;
  machinery: number;
  processing: number;
  transportation: number;
  certification: number;
  others: number;
}

export interface CostRecord {
  date: Date;
  category: string;
  amount: number;
  description: string;
  effectiveness?: number; // 0-100
}

export interface QualityDataInput {
  currentQuality: QualityMetrics;
  historicalQuality: QualityRecord[];
  targetQuality?: QualityMetrics;
  qualityFactors: QualityFactorData[];
}

export interface QualityMetrics {
  cupScore: number;
  defects: number;
  moisture: number;
  screenSize: number;
  density: number;
  uniformity: number;
}

export interface QualityRecord {
  date: Date;
  metrics: QualityMetrics;
  grade: string;
  price: number;
  factors: string[];
}

export interface QualityFactorData {
  factor: string;
  currentValue: number;
  optimalRange: [number, number];
  impact: number; // 0-100
  controllable: boolean;
}

export interface TimeframeInput {
  analysisStart: Date;
  analysisEnd: Date;
  projectionPeriod: number; // months
  seasonality: boolean;
}

export interface SeasonalData {
  month: number;
  production: number;
  quality: number;
  costs: number;
  factors: string[];
}

export interface BenchmarkData {
  region: string;
  averageCosts: CostBreakdown;
  topPerformerCosts: CostBreakdown;
  industryStandards: Record<string, number>;
}

export interface OptimizationOptions {
  objectives: OptimizationObjective[];
  constraints: OptimizationConstraint[];
  riskTolerance: 'low' | 'medium' | 'high';
  timeHorizon: number; // months
  includeScenarios: boolean;
  language: 'es' | 'en';
}

export interface OptimizationObjective {
  type: 'maximize_profit' | 'minimize_cost' | 'maximize_quality' | 'maximize_yield';
  weight: number; // 0-1
  target?: number;
}

export interface OptimizationConstraint {
  type: 'budget' | 'time' | 'resources' | 'quality' | 'environmental';
  value: number;
  operator: 'max' | 'min' | 'equal';
  description: string;
}

// Interfaces para respuestas de optimización
export interface OptimizationResponse {
  analysisId: string;
  status: ProcessingStatus;
  result?: OptimizationResult;
  error?: AnalysisError;
  metadata: ResponseMetadata;
}

export interface OptimizationResult {
  currentState: StateAnalysis;
  optimizedState: StateAnalysis;
  improvements: Improvement[];
  recommendations: OptimizationRecommendation[];
  scenarios: OptimizationScenario[];
  riskAnalysis: OptimizationRiskAnalysis;
  processingInfo: ProcessingInfo;
}

export interface StateAnalysis {
  production: {
    total: number;
    perHectare: number;
    efficiency: number; // 0-100
  };
  costs: {
    total: number;
    perKg: number;
    breakdown: CostBreakdown;
  };
  quality: {
    score: number;
    grade: string;
    consistency: number; // 0-100
  };
  profitability: {
    gross: number;
    net: number;
    margin: number; // percentage
    roi: number; // percentage
  };
}

export interface Improvement {
  area: string;
  currentValue: number;
  optimizedValue: number;
  improvement: number; // percentage
  confidence: number; // 0-100
  timeToAchieve: number; // months
  investmentRequired: number;
}

export interface OptimizationRecommendation {
  id: string;
  category: 'production' | 'cost' | 'quality' | 'efficiency';
  title: string;
  description: string;
  impact: ImpactAnalysis;
  implementation: ImplementationPlan;
  priority: number; // 1-10
  confidence: number; // 0-100
  alternatives: string[];
}

export interface ImpactAnalysis {
  costSaving?: number;
  productionIncrease?: number;
  qualityImprovement?: number;
  efficiencyGain?: number;
  timeframe: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface ImplementationPlan {
  phases: ImplementationPhase[];
  totalDuration: number; // months
  totalCost: number;
  requiredResources: string[];
  dependencies: string[];
  milestones: Milestone[];
}

export interface ImplementationPhase {
  name: string;
  duration: number; // months
  cost: number;
  activities: string[];
  deliverables: string[];
  risks: string[];
}

export interface Milestone {
  name: string;
  date: Date;
  criteria: string[];
  importance: 'low' | 'medium' | 'high' | 'critical';
}

export interface OptimizationScenario {
  name: string;
  description: string;
  probability: number; // 0-1
  outcomes: StateAnalysis;
  requirements: string[];
  risks: string[];
  timeline: string;
}

export interface OptimizationRiskAnalysis {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: OptimizationRiskFactor[];
  mitigationStrategies: string[];
  contingencyPlans: string[];
}

export interface OptimizationRiskFactor {
  factor: string;
  probability: number; // 0-1
  impact: 'low' | 'medium' | 'high' | 'severe';
  mitigation: string;
  monitoring: string;
}

// Interfaces comunes para respuestas
export interface AnalysisError {
  code: string;
  message: string;
  details?: any;
  retryable: boolean;
  suggestedAction?: string;
}

export interface ResponseMetadata {
  requestId: string;
  timestamp: Date;
  processingTime: number; // ms
  modelVersion: string;
  apiVersion: string;
  usage: UsageInfo;
}

export interface ProcessingInfo {
  modelUsed: string;
  processingTime: number; // ms
  computeUnits: number;
  memoryUsed: number; // MB
  cacheHit: boolean;
  qualityScore: number; // 0-100
}

export interface UsageInfo {
  tokensUsed?: number;
  apiCalls: number;
  computeTime: number; // ms
  dataTransferred: number; // bytes
  cost?: number;
}

// Interfaces para estado de análisis
export interface AnalysisStatusResponse {
  analysisId: string;
  status: ProcessingStatus;
  progress: number; // 0-100
  estimatedTimeRemaining?: number; // seconds
  currentStep?: string;
  error?: AnalysisError;
  metadata: ResponseMetadata;
}

export interface CancelAnalysisResponse {
  analysisId: string;
  cancelled: boolean;
  reason?: string;
  metadata: ResponseMetadata;
}

// Interfaces para configuración de servicios
export interface ServiceConfiguration {
  baseUrl: string;
  apiKey: string;
  timeout: number; // ms
  retryAttempts: number;
  retryDelay: number; // ms
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
    requestsPerDay: number;
  };
  features: {
    caching: boolean;
    compression: boolean;
    encryption: boolean;
    offline: boolean;
  };
}

// Interfaces para métricas de servicio
export interface ServiceMetrics {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  errorRate: number;
  uptime: number; // percentage
  lastError?: AnalysisError;
  lastSuccess?: Date;
}

// Interfaces para caché de servicios
export interface ServiceCache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
  size(): Promise<number>;
}

// Interfaces para eventos de servicio
export interface ServiceEvent {
  type: 'request' | 'response' | 'error' | 'cache_hit' | 'cache_miss';
  timestamp: Date;
  data: any;
  metadata?: Record<string, any>;
}

export interface ServiceEventListener {
  (event: ServiceEvent): void;
}

// Interfaces para monitoreo de servicios
export interface ServiceMonitor {
  isHealthy(): Promise<boolean>;
  getMetrics(): Promise<ServiceMetrics>;
  getStatus(): Promise<ServiceStatus>;
  addEventListener(listener: ServiceEventListener): void;
  removeEventListener(listener: ServiceEventListener): void;
}

export interface ServiceStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  lastCheck: Date;
  issues: string[];
  uptime: number; // seconds
  version: string;
}
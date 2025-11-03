// Tipos para el Sistema de Alertas Tempranas y Análisis Predictivo

export interface WeatherConditions {
  temperature: number;
  humidity: number;
  rainfall: number;
  windSpeed: number;
  pressure: number;
  uvIndex: number;
  dewPoint: number;
  timestamp: Date;
}

export interface WeatherForecast extends WeatherConditions {
  forecastDate: Date;
  confidence: number;
  source: 'api' | 'model' | 'historical';
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type PestType = 
  | 'roya' 
  | 'broca' 
  | 'minador' 
  | 'cochinilla' 
  | 'nematodos' 
  | 'antracnosis'
  | 'mancha_foliar'
  | 'ojo_gallo';

export interface PestRiskFactors {
  temperature: { min: number; max: number; optimal: number };
  humidity: { min: number; max: number; optimal: number };
  rainfall: { min: number; max: number; optimal: number };
  seasonality: number[]; // Meses del año (1-12) con mayor riesgo
  hostPlantStage: string[];
  previousOccurrence: boolean;
}

export interface RiskPrediction {
  pestType: PestType;
  riskLevel: RiskLevel;
  confidence: number;
  probability: number;
  timeframe: {
    start: Date;
    peak: Date;
    end: Date;
  };
  factors: {
    weather: number;
    seasonal: number;
    historical: number;
    environmental: number;
  };
  recommendations: string[];
}

export interface EarlyWarningAlert {
  id: string;
  pestType: PestType;
  riskLevel: RiskLevel;
  title: string;
  description: string;
  probability: number;
  confidence: number;
  timeframe: {
    start: Date;
    peak: Date;
    end: Date;
  };
  affectedAreas: string[];
  recommendations: {
    immediate: string[];
    preventive: string[];
    monitoring: string[];
  };
  weatherTriggers: WeatherConditions;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  acknowledgedAt?: Date;
  resolvedAt?: Date;
}

export interface PredictiveModel {
  id: string;
  name: string;
  pestType: PestType;
  version: string;
  accuracy: number;
  lastTrained: Date;
  parameters: {
    weatherWeight: number;
    seasonalWeight: number;
    historicalWeight: number;
    environmentalWeight: number;
  };
  thresholds: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

export interface HistoricalPestData {
  id: string;
  pestType: PestType;
  occurrenceDate: Date;
  severity: 'low' | 'medium' | 'high';
  affectedArea: number; // en hectáreas
  weatherConditions: WeatherConditions;
  treatmentApplied: string[];
  effectiveness: number;
  cost: number;
  notes: string;
}

export interface PredictionAnalysis {
  modelId: string;
  pestType: PestType;
  inputData: {
    currentWeather: WeatherConditions;
    forecast: WeatherForecast[];
    historicalData: HistoricalPestData[];
    farmConditions: {
      cropStage: string;
      lastTreatment: Date;
      soilMoisture: number;
      plantHealth: number;
    };
  };
  prediction: RiskPrediction;
  alternativeScenarios: RiskPrediction[];
  modelConfidence: number;
  dataQuality: number;
  timestamp: Date;
}

export interface AlertThreshold {
  pestType: PestType;
  riskLevel: RiskLevel;
  enabled: boolean;
  conditions: {
    probability: number;
    confidence: number;
    timeframe: number; // días
  };
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
  };
  customMessage?: string;
}

export interface RiskDashboardData {
  currentRisks: RiskPrediction[];
  activeAlerts: EarlyWarningAlert[];
  weatherSummary: {
    current: WeatherConditions;
    forecast: WeatherForecast[];
    trends: {
      temperature: 'rising' | 'falling' | 'stable';
      humidity: 'rising' | 'falling' | 'stable';
      rainfall: 'increasing' | 'decreasing' | 'stable';
    };
  };
  historicalComparison: {
    sameTimeLastYear: RiskPrediction[];
    averageRisk: number;
    trendDirection: 'improving' | 'worsening' | 'stable';
  };
  recommendations: {
    immediate: string[];
    shortTerm: string[];
    longTerm: string[];
  };
  lastUpdated: Date;
}

export interface PredictiveAnalyticsConfig {
  updateInterval: number; // minutos
  forecastDays: number;
  historicalDataDays: number;
  modelRefreshInterval: number; // horas
  alertThresholds: AlertThreshold[];
  enabledPestTypes: PestType[];
  weatherDataSources: string[];
  notificationSettings: {
    maxAlertsPerDay: number;
    quietHours: { start: string; end: string };
    groupSimilarAlerts: boolean;
    minimumConfidence: number;
  };
}

export interface ModelPerformanceMetrics {
  modelId: string;
  pestType: PestType;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  falsePositiveRate: number;
  falseNegativeRate: number;
  lastEvaluated: Date;
  testDataSize: number;
  performanceTrend: 'improving' | 'declining' | 'stable';
}

export interface WeatherPattern {
  id: string;
  name: string;
  description: string;
  conditions: Partial<WeatherConditions>;
  duration: number; // días
  frequency: number; // veces por año
  associatedPests: PestType[];
  riskMultiplier: number;
  seasonality: number[]; // meses más comunes
}

export interface PredictionValidation {
  predictionId: string;
  actualOutcome: {
    occurred: boolean;
    severity?: 'low' | 'medium' | 'high';
    date?: Date;
    affectedArea?: number;
  };
  predictionAccuracy: number;
  timeAccuracy: number;
  severityAccuracy: number;
  validatedAt: Date;
  notes: string;
}

// Tipos para la interfaz de usuario
export interface EarlyWarningUIState {
  selectedPestTypes: PestType[];
  selectedTimeframe: '7d' | '14d' | '30d' | '90d';
  selectedRiskLevels: RiskLevel[];
  showOnlyActiveAlerts: boolean;
  sortBy: 'risk' | 'date' | 'confidence' | 'pest';
  sortOrder: 'asc' | 'desc';
  filterByLocation: string[];
}

export interface ChartDataPoint {
  date: Date;
  value: number;
  label: string;
  color?: string;
}

export interface RiskTrendData {
  pestType: PestType;
  historical: ChartDataPoint[];
  predicted: ChartDataPoint[];
  confidence: ChartDataPoint[];
}

// Eventos del sistema
export interface EarlyWarningEvent {
  type: 'alert_created' | 'alert_updated' | 'alert_resolved' | 'model_updated' | 'prediction_validated';
  timestamp: Date;
  data: any;
  userId?: string;
}

export interface EarlyWarningSystemStatus {
  isOnline: boolean;
  lastUpdate: Date;
  activeModels: number;
  pendingPredictions: number;
  systemHealth: 'healthy' | 'warning' | 'error';
  dataQuality: number;
  apiConnections: {
    weather: boolean;
    historical: boolean;
    notifications: boolean;
  };
}

// Tipos para notificaciones inteligentes
export type NotificationChannel = 'push' | 'in_app' | 'email' | 'sms';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationPreferences {
  enabled: boolean;
  channels: NotificationChannel[];
  quietHours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  riskLevelSettings: {
    [K in RiskLevel]: {
      enabled: boolean;
      channels: NotificationChannel[];
    };
  };
  pestTypeSettings: {
    [K in PestType]: {
      enabled: boolean;
      priority: NotificationPriority;
    };
  };
  groupSimilar: boolean;
  maxNotificationsPerHour: number;
  intelligentTiming: boolean;
}
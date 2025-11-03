// Tipos específicos para el Agente Fitosanitario (Diagnóstico por Imagen)

export type CoffeeDiseaseType = 
  | 'ROYA'           // Roya del café (Hemileia vastatrix)
  | 'BROCA'          // Broca del café (Hypothenemus hampei)
  | 'ANTRACNOSIS'    // Antracnosis (Colletotrichum spp.)
  | 'MANCHA_HIERRO'  // Mancha de hierro (Cercospora coffeicola)
  | 'OJO_GALLO'      // Ojo de gallo (Mycena citricolor)
  | 'MAL_ROSADO'     // Mal rosado (Corticium salmonicolor)
  | 'NEMATODOS'      // Nematodos (Meloidogyne spp.)
  | 'DEFICIENCIA_N'  // Deficiencia de nitrógeno
  | 'DEFICIENCIA_K'  // Deficiencia de potasio
  | 'DEFICIENCIA_MG' // Deficiencia de magnesio
  | 'DEFICIENCIA_FE' // Deficiencia de hierro
  | 'HEALTHY'        // Planta saludable
  | 'UNKNOWN';       // No identificado

export type PlantPartType = 
  | 'LEAF'           // Hoja
  | 'STEM'           // Tallo
  | 'FRUIT'          // Fruto/cereza
  | 'ROOT'           // Raíz
  | 'FLOWER'         // Flor
  | 'WHOLE_PLANT';   // Planta completa

export type SeverityLevel = 
  | 'VERY_LOW'       // 0-10%
  | 'LOW'            // 11-25%
  | 'MODERATE'       // 26-50%
  | 'HIGH'           // 51-75%
  | 'VERY_HIGH'      // 76-90%
  | 'CRITICAL';      // 91-100%

export type ConfidenceLevel = 
  | 'VERY_LOW'       // 0-30%
  | 'LOW'            // 31-50%
  | 'MODERATE'       // 51-70%
  | 'HIGH'           // 71-85%
  | 'VERY_HIGH';     // 86-100%

export interface ImageQualityMetrics {
  overall: number;           // 0-100
  sharpness: number;         // 0-100
  brightness: number;        // 0-100
  contrast: number;          // 0-100
  colorBalance: number;      // 0-100
  noiseLevel: number;        // 0-100 (lower is better)
  resolution: {
    width: number;
    height: number;
    megapixels: number;
  };
  lighting: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
  focus: 'SHARP' | 'SLIGHTLY_BLURRED' | 'BLURRED';
  composition: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR';
}

export interface DiseaseDetection {
  disease: CoffeeDiseaseType;
  confidence: number;        // 0-100
  confidenceLevel: ConfidenceLevel;
  severity: SeverityLevel;
  affectedArea: number;      // Porcentaje del área afectada (0-100)
  plantPart: PlantPartType;
  symptoms: string[];
  description: string;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface TreatmentRecommendation {
  id: string;
  disease: CoffeeDiseaseType;
  severity: SeverityLevel;
  treatment: {
    type: 'CHEMICAL' | 'BIOLOGICAL' | 'CULTURAL' | 'INTEGRATED';
    name: string;
    activeIngredient?: string;
    dosage: string;
    applicationMethod: string;
    frequency: string;
    duration: string;
    cost: {
      estimated: number;
      currency: string;
      unit: string;
    };
  };
  preventiveMeasures: string[];
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  effectiveness: number;     // 0-100
  environmentalImpact: 'LOW' | 'MEDIUM' | 'HIGH';
  safetyPrecautions: string[];
  relatedProducts?: string[]; // IDs de productos en inventario
}

export interface PhytosanitaryAnalysisRequest {
  id: string;
  imageUrl: string;
  imageBlob?: Blob;
  metadata: {
    lotId?: string;
    farmId?: string;
    captureDate: Date;
    gpsCoordinates?: {
      latitude: number;
      longitude: number;
      accuracy: number;
    };
    weather?: {
      temperature: number;
      humidity: number;
      precipitation: number;
    };
    plantAge?: number;        // Edad de la planta en meses
    variety?: string;         // Variedad de café
    plantingDensity?: number; // Plantas por hectárea
  };
  analysisOptions: {
    enableDiseaseDetection: boolean;
    enableSeverityAssessment: boolean;
    enableTreatmentRecommendations: boolean;
    plantPartFocus?: PlantPartType;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
  };
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  createdAt: Date;
  processedAt?: Date;
}

export interface PhytosanitaryAnalysisResult {
  id: string;
  requestId: string;
  imageQuality: ImageQualityMetrics;
  detections: DiseaseDetection[];
  primaryDiagnosis?: DiseaseDetection;
  recommendations: TreatmentRecommendation[];
  overallHealthScore: number; // 0-100
  riskAssessment: {
    spreadRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    economicImpact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timeToAction: string; // e.g., "24 hours", "1 week"
  };
  confidence: {
    overall: number;
    detection: number;
    severity: number;
    treatment: number;
  };
  processingTime: number;    // Tiempo en milisegundos
  modelVersion: string;
  analysisDate: Date;
  notes?: string;
}

export interface DiagnosisHistory {
  id: string;
  lotId: string;
  farmId: string;
  analysisResults: PhytosanitaryAnalysisResult[];
  trends: {
    diseaseProgression: Array<{
      date: Date;
      disease: CoffeeDiseaseType;
      severity: SeverityLevel;
      affectedArea: number;
    }>;
    healthScore: Array<{
      date: Date;
      score: number;
    }>;
  };
  treatmentHistory: Array<{
    date: Date;
    treatment: TreatmentRecommendation;
    applied: boolean;
    effectiveness?: number;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface PhytosanitaryConfig {
  modelSettings: {
    confidenceThreshold: number;    // Umbral mínimo de confianza (0-100)
    enableMultipleDetections: boolean;
    maxDetectionsPerImage: number;
    enableSeverityAnalysis: boolean;
  };
  imageProcessing: {
    maxImageSize: number;           // Tamaño máximo en bytes
    allowedFormats: string[];       // ['jpg', 'jpeg', 'png', 'webp']
    autoEnhancement: boolean;
    qualityThreshold: number;       // Calidad mínima requerida (0-100)
  };
  notifications: {
    enableRealTime: boolean;
    criticalThreshold: SeverityLevel;
    notifyOnLowConfidence: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  };
  offline: {
    enableOfflineAnalysis: boolean;
    maxQueueSize: number;
    autoSyncWhenOnline: boolean;
    cacheResults: boolean;
    cacheDuration: number;          // Días
  };
}

// Tipos para la interfaz de usuario
export interface DiagnosisUIState {
  isAnalyzing: boolean;
  progress: number;
  currentStep: string;
  error?: string;
  showResults: boolean;
  selectedDetection?: DiseaseDetection;
  showTreatments: boolean;
  showHistory: boolean;
}

export interface DiagnosisFilters {
  diseases: CoffeeDiseaseType[];
  severityLevels: SeverityLevel[];
  confidenceLevels: ConfidenceLevel[];
  dateRange: {
    start: Date;
    end: Date;
  };
  lotIds: string[];
}

// Eventos para el sistema de notificaciones
export interface PhytosanitaryNotification {
  id: string;
  type: 'DISEASE_DETECTED' | 'HIGH_SEVERITY' | 'TREATMENT_RECOMMENDED' | 'ANALYSIS_COMPLETE';
  disease?: CoffeeDiseaseType;
  severity?: SeverityLevel;
  confidence: number;
  lotId: string;
  farmId: string;
  message: string;
  actionRequired: boolean;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  createdAt: Date;
  readAt?: Date;
  actionTaken?: boolean;
}

// Estadísticas y métricas
export interface PhytosanitaryStats {
  totalAnalyses: number;
  diseasesDetected: number;
  averageConfidence: number;
  mostCommonDiseases: Array<{
    disease: CoffeeDiseaseType;
    count: number;
    percentage: number;
  }>;
  severityDistribution: Record<SeverityLevel, number>;
  healthTrend: 'IMPROVING' | 'STABLE' | 'DECLINING';
  lastAnalysis?: Date;
  averageProcessingTime: number;
}
// Tipos para el sistema de optimización de recursos

export interface WaterOptimizationData {
  id: string;
  timestamp: Date;
  soilMoisture: number; // Porcentaje de humedad del suelo
  weatherForecast: WeatherForecast[];
  plantStage: PlantGrowthStage;
  irrigationHistory: IrrigationRecord[];
  recommendations: WaterRecommendation[];
}

export interface WeatherForecast {
  date: Date;
  temperature: {
    min: number;
    max: number;
    avg: number;
  };
  humidity: number;
  precipitation: number;
  windSpeed: number;
  evapotranspiration: number;
}

export interface PlantGrowthStage {
  stage: 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';
  daysInStage: number;
  waterRequirement: number; // L/m²/día
  criticalPeriod: boolean;
}

export interface IrrigationRecord {
  date: Date;
  amount: number; // Litros
  duration: number; // Minutos
  method: 'drip' | 'sprinkler' | 'flood' | 'manual';
  efficiency: number; // Porcentaje
  cost: number;
}

export interface WaterRecommendation {
  date: Date;
  amount: number;
  timing: string;
  method: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  reasoning: string;
  expectedSavings: number;
  confidence: number;
}

// Tipos para optimización de fertilizantes
export interface FertilizerOptimizationData {
  id: string;
  timestamp: Date;
  soilAnalysis: SoilAnalysis;
  plantNutritionStatus: PlantNutritionStatus;
  fertilizerHistory: FertilizerApplication[];
  recommendations: FertilizerRecommendation[];
  costAnalysis: FertilizerCostAnalysis;
}

export interface SoilAnalysis {
  pH: number;
  organicMatter: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  calcium: number;
  magnesium: number;
  sulfur: number;
  micronutrients: {
    iron: number;
    manganese: number;
    zinc: number;
    copper: number;
    boron: number;
  };
  cationExchangeCapacity: number;
  testDate: Date;
}

export interface PlantNutritionStatus {
  stage: PlantGrowthStage;
  deficiencies: NutrientDeficiency[];
  excesses: NutrientExcess[];
  overallHealth: number; // 0-100
  yieldPotential: number;
}

export interface NutrientDeficiency {
  nutrient: string;
  severity: 'mild' | 'moderate' | 'severe';
  symptoms: string[];
  impact: number; // Impacto en rendimiento (0-100)
}

export interface NutrientExcess {
  nutrient: string;
  level: number;
  risks: string[];
  remediation: string[];
}

export interface FertilizerApplication {
  date: Date;
  type: string;
  composition: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    micronutrients?: Record<string, number>;
  };
  amount: number; // kg/ha
  method: 'broadcast' | 'banding' | 'foliar' | 'fertigation';
  cost: number;
  efficiency: number;
}

export interface FertilizerRecommendation {
  date: Date;
  type: string;
  composition: {
    nitrogen: number;
    phosphorus: number;
    potassium: number;
    micronutrients?: Record<string, number>;
  };
  amount: number;
  method: string;
  timing: string;
  splitApplications?: FertilizerSplit[];
  expectedYieldIncrease: number;
  costBenefit: number;
  environmentalImpact: number;
  confidence: number;
  reasoning: string;
}

export interface FertilizerSplit {
  date: Date;
  percentage: number;
  reasoning: string;
}

export interface FertilizerCostAnalysis {
  totalCost: number;
  costPerHectare: number;
  costPerKgYield: number;
  roi: number;
  paybackPeriod: number; // días
  alternatives: FertilizerAlternative[];
}

export interface FertilizerAlternative {
  name: string;
  cost: number;
  efficiency: number;
  environmentalScore: number;
  availability: boolean;
}

// Tipos para optimización de pesticidas
export interface PesticideOptimizationData {
  id: string;
  timestamp: Date;
  pestPressure: PestPressureAnalysis;
  pesticideHistory: PesticideApplication[];
  resistanceRisk: ResistanceRiskAssessment;
  recommendations: PesticideRecommendation[];
  environmentalImpact: EnvironmentalImpactAssessment;
}

export interface PestPressureAnalysis {
  currentThreats: PestThreat[];
  predictedThreats: PestThreat[];
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  economicThreshold: number;
  actionThreshold: number;
}

export interface PestThreat {
  pestType: string;
  severity: number; // 0-100
  distribution: string; // Distribución en la finca
  lifeCycleStage: string;
  weatherSensitivity: number;
  naturalEnemies: string[];
  economicImpact: number;
}

export interface PesticideApplication {
  date: Date;
  product: string;
  activeIngredient: string;
  concentration: number;
  amount: number; // L/ha
  method: 'spray' | 'dust' | 'granular' | 'systemic';
  targetPest: string[];
  effectiveness: number; // 0-100
  cost: number;
  weatherConditions: {
    temperature: number;
    humidity: number;
    windSpeed: number;
  };
}

export interface ResistanceRiskAssessment {
  overallRisk: 'low' | 'medium' | 'high';
  riskFactors: ResistanceRiskFactor[];
  mitigationStrategies: string[];
  rotationRecommendations: string[];
}

export interface ResistanceRiskFactor {
  factor: string;
  riskLevel: number; // 0-100
  description: string;
  mitigation: string;
}

export interface PesticideRecommendation {
  date: Date;
  product: string;
  activeIngredient: string;
  concentration: number;
  amount: number;
  method: string;
  timing: string;
  targetPests: string[];
  alternativeProducts: string[];
  ipmIntegration: string[];
  resistanceManagement: string;
  costEffectiveness: number;
  environmentalScore: number;
  confidence: number;
  reasoning: string;
}

export interface EnvironmentalImpactAssessment {
  carbonFootprint: number; // kg CO2 eq
  waterContamination: number; // 0-100
  soilHealth: number; // 0-100
  beneficialInsects: number; // Impacto en insectos benéficos
  biodiversity: number; // Impacto en biodiversidad
  humanHealth: number; // Riesgo para salud humana
  mitigationMeasures: string[];
}

// Tipos para análisis costo-beneficio
export interface CostBenefitAnalysis {
  id: string;
  timestamp: Date;
  analysisType: 'water' | 'fertilizer' | 'pesticide' | 'integrated';
  timeframe: {
    start: Date;
    end: Date;
  };
  currentScenario: ResourceScenario;
  optimizedScenario: ResourceScenario;
  comparison: ScenarioComparison;
  recommendations: EconomicRecommendation[];
}

export interface ResourceScenario {
  name: string;
  costs: {
    water: number;
    fertilizer: number;
    pesticide: number;
    labor: number;
    equipment: number;
    total: number;
  };
  yields: {
    expected: number;
    quality: number;
    marketValue: number;
  };
  risks: {
    weather: number;
    pest: number;
    market: number;
    overall: number;
  };
  sustainability: SustainabilityMetrics;
}

export interface ScenarioComparison {
  costSavings: number;
  yieldIncrease: number;
  profitIncrease: number;
  roi: number;
  paybackPeriod: number;
  riskReduction: number;
  sustainabilityImprovement: number;
}

export interface EconomicRecommendation {
  category: 'cost-reduction' | 'yield-increase' | 'risk-mitigation' | 'sustainability';
  action: string;
  investment: number;
  expectedReturn: number;
  timeframe: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  risks: string[];
  benefits: string[];
}

// Tipos para métricas de sostenibilidad
export interface SustainabilityMetrics {
  carbonFootprint: CarbonFootprint;
  waterEfficiency: WaterEfficiency;
  soilHealth: SoilHealth;
  biodiversity: BiodiversityMetrics;
  certification: CertificationStatus;
  overallScore: number; // 0-100
}

export interface CarbonFootprint {
  total: number; // kg CO2 eq/ha/año
  breakdown: {
    fertilizers: number;
    pesticides: number;
    machinery: number;
    transportation: number;
    processing: number;
  };
  sequestration: number; // CO2 capturado por el suelo/plantas
  netEmissions: number;
  reductionTargets: {
    shortTerm: number; // 1 año
    mediumTerm: number; // 3 años
    longTerm: number; // 5 años
  };
}

export interface WaterEfficiency {
  usage: number; // L/kg café producido
  efficiency: number; // 0-100
  wastage: number; // Porcentaje de desperdicio
  recycling: number; // Porcentaje de agua reciclada
  qualityImpact: number; // Impacto en calidad del agua
  conservationMeasures: string[];
}

export interface SoilHealth {
  organicMatter: number;
  erosionRate: number;
  compaction: number;
  biodiversity: number;
  nutrientCycling: number;
  overallHealth: number; // 0-100
  improvementPlan: string[];
}

export interface BiodiversityMetrics {
  speciesRichness: number;
  habitatQuality: number;
  pollinatorHealth: number;
  naturalEnemies: number;
  overallBiodiversity: number; // 0-100
  conservationActions: string[];
}

export interface CertificationStatus {
  organic: boolean;
  rainforestAlliance: boolean;
  fairTrade: boolean;
  utz: boolean;
  birdFriendly: boolean;
  carbonNeutral: boolean;
  customCertifications: string[];
  complianceScore: number; // 0-100
}

// Tipos para dashboard y visualización
export interface ResourceDashboardData {
  summary: ResourceSummary;
  trends: ResourceTrends;
  alerts: ResourceAlert[];
  recommendations: DashboardRecommendation[];
  performance: PerformanceMetrics;
}

export interface ResourceSummary {
  period: {
    start: Date;
    end: Date;
  };
  water: {
    used: number;
    saved: number;
    efficiency: number;
    cost: number;
  };
  fertilizer: {
    used: number;
    saved: number;
    efficiency: number;
    cost: number;
  };
  pesticide: {
    used: number;
    saved: number;
    efficiency: number;
    cost: number;
  };
  totalSavings: number;
  sustainabilityScore: number;
}

export interface ResourceTrends {
  water: TrendData[];
  fertilizer: TrendData[];
  pesticide: TrendData[];
  costs: TrendData[];
  yields: TrendData[];
  sustainability: TrendData[];
}

export interface TrendData {
  date: Date;
  value: number;
  target?: number;
  benchmark?: number;
}

export interface ResourceAlert {
  id: string;
  type: 'water' | 'fertilizer' | 'pesticide' | 'cost' | 'sustainability';
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  timestamp: Date;
  actionRequired: boolean;
  recommendations: string[];
}

export interface DashboardRecommendation {
  id: string;
  category: 'optimization' | 'cost-saving' | 'sustainability' | 'efficiency';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  expectedSavings: number;
  priority: number; // 1-10
}

export interface PerformanceMetrics {
  efficiency: {
    water: number;
    fertilizer: number;
    pesticide: number;
    overall: number;
  };
  costs: {
    perHectare: number;
    perKgProduced: number;
    trend: 'increasing' | 'stable' | 'decreasing';
  };
  sustainability: {
    score: number;
    trend: 'improving' | 'stable' | 'declining';
    certificationProgress: number;
  };
  benchmarks: {
    regional: number;
    national: number;
    international: number;
  };
}

// Tipos para configuración y preferencias
export interface OptimizationSettings {
  water: WaterOptimizationSettings;
  fertilizer: FertilizerOptimizationSettings;
  pesticide: PesticideOptimizationSettings;
  economic: EconomicOptimizationSettings;
  sustainability: SustainabilitySettings;
}

export interface WaterOptimizationSettings {
  conservationLevel: 'low' | 'medium' | 'high' | 'maximum';
  irrigationMethod: 'drip' | 'sprinkler' | 'flood' | 'mixed';
  soilMoistureThresholds: {
    minimum: number;
    optimal: number;
    maximum: number;
  };
  weatherIntegration: boolean;
  costPriority: number; // 0-100
  yieldPriority: number; // 0-100
}

export interface FertilizerOptimizationSettings {
  approach: 'conventional' | 'organic' | 'integrated' | 'precision';
  soilTestFrequency: number; // meses
  splitApplications: boolean;
  micronutrientFocus: boolean;
  costPriority: number;
  yieldPriority: number;
  environmentalPriority: number;
}

export interface PesticideOptimizationSettings {
  strategy: 'conventional' | 'ipm' | 'organic' | 'biological';
  resistanceManagement: boolean;
  beneficialInsectProtection: boolean;
  applicationThresholds: {
    economic: number;
    action: number;
  };
  weatherRestrictions: boolean;
  costPriority: number;
  effectivenessPriority: number;
  environmentalPriority: number;
}

export interface EconomicOptimizationSettings {
  timeHorizon: number; // años
  discountRate: number;
  riskTolerance: 'low' | 'medium' | 'high';
  profitabilityThreshold: number;
  investmentBudget: number;
  marketPriceVolatility: boolean;
}

export interface SustainabilitySettings {
  carbonNeutralGoal: boolean;
  certificationTargets: string[];
  biodiversityPriority: number;
  soilHealthPriority: number;
  waterConservationPriority: number;
  reportingFrequency: 'monthly' | 'quarterly' | 'annually';
}

// Interfaces para análisis económico
export interface EconomicAnalysis {
  id: string;
  timestamp: Date;
  currentCosts: CostBreakdown;
  optimizedCosts: CostBreakdown;
  roiAnalysis: ROIAnalysis;
  budgetForecast: BudgetForecast;
  recommendations: EconomicRecommendation[];
  profitabilityAnalysis: ProfitabilityAnalysis;
}

export interface CostBreakdown {
  water: number;
  fertilizer: number;
  pesticide: number;
  labor: number;
  equipment: number;
  total: number;
}

export interface ROIAnalysis {
  roi: number; // Porcentaje de retorno de inversión
  paybackPeriod: number; // Meses para recuperar inversión
  netPresentValue: number; // Valor presente neto
  irr?: number; // Tasa interna de retorno
  profitabilityIndex?: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface BudgetForecast {
  monthly: MonthlyBudget[];
  quarterly: QuarterlyBudget[];
  annual: AnnualBudget;
  contingency: number; // Porcentaje de contingencia
}

export interface MonthlyBudget {
  month: number;
  year: number;
  plannedCosts: CostBreakdown;
  actualCosts?: CostBreakdown;
  variance?: number;
}

export interface QuarterlyBudget {
  quarter: number;
  year: number;
  plannedCosts: CostBreakdown;
  actualCosts?: CostBreakdown;
  variance?: number;
}

export interface AnnualBudget {
  year: number;
  plannedCosts: CostBreakdown;
  actualCosts?: CostBreakdown;
  variance?: number;
  projectedSavings: number;
}

export interface ProfitabilityAnalysis {
  grossMargin: number;
  netMargin: number;
  costPerKg: number;
  revenuePerKg: number;
  breakEvenPoint: number;
  profitProjection: number;
}

export interface ResourceCostData {
  fixedCosts: number;
  variableCosts: number;
  maintenanceCosts: number;
  operationalCosts: number;
  total: number;
}

export interface ROICalculation {
  investment: number;
  annualReturn: number;
  roi: number;
  paybackPeriod: number;
  npv: number;
  irr: number;
}

export interface CostOptimizationRecommendation {
  category: 'water' | 'fertilizer' | 'pesticide' | 'labor' | 'equipment';
  action: string;
  investment: number;
  expectedSavings: number;
  timeframe: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  risks: string[];
  benefits: string[];
}

export interface ResourceAllocation {
  water: {
    currentInvestment: number;
    recommendedInvestment: number;
    expectedSavings: number;
    yieldContribution: number;
    recommendations: string[];
  };
  fertilizer: {
    currentInvestment: number;
    recommendedInvestment: number;
    expectedSavings: number;
    yieldContribution: number;
    recommendations: string[];
  };
  pesticide: {
    currentInvestment: number;
    recommendedInvestment: number;
    expectedSavings: number;
    yieldContribution: number;
    recommendations: string[];
  };
  totalInvestment: number;
  totalSavings: number;
  totalYieldIncrease: number;
  efficiencyScore: number;
  riskLevel: 'low' | 'medium' | 'high';
}
// Tipos para el Agente de Análisis de Mercado
export interface CoffeePrice {
  id: string;
  timestamp: Date;
  price: number; // USD por libra
  currency: 'USD' | 'COP';
  market: 'local' | 'national' | 'international';
  quality: CoffeeQuality;
  source: string;
  volume?: number; // libras
}

export interface CoffeeQuality {
  grade: 'Premium' | 'Specialty' | 'Commercial' | 'Standard';
  score: number; // 0-100
  certifications: string[];
  origin: string;
  processingMethod: 'Washed' | 'Natural' | 'Honey' | 'Semi-washed';
  altitude: number; // metros sobre el nivel del mar
}

export interface MarketTrend {
  id: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  priceChange: number; // porcentaje
  volumeChange: number; // porcentaje
  trend: 'bullish' | 'bearish' | 'stable';
  confidence: number; // 0-1
  factors: string[];
}

export interface PricePrediction {
  id: string;
  targetDate: Date;
  predictedPrice: number;
  confidence: number; // 0-1
  priceRange: {
    min: number;
    max: number;
  };
  factors: PredictionFactor[];
  methodology: 'ML' | 'Statistical' | 'Hybrid';
  lastUpdated: Date;
}

export interface PredictionFactor {
  name: string;
  impact: number; // -1 a 1
  confidence: number; // 0-1
  description: string;
  category: 'weather' | 'economic' | 'political' | 'supply' | 'demand' | 'quality';
}

export interface MarketOpportunity {
  id: string;
  type: 'export' | 'local' | 'specialty' | 'direct_trade';
  market: string;
  estimatedPrice: number;
  volume: number;
  requirements: string[];
  deadline: Date;
  profitability: number; // porcentaje
  riskLevel: 'low' | 'medium' | 'high';
  contact?: string;
}

export interface CompetitorAnalysis {
  id: string;
  competitorName: string;
  marketShare: number; // porcentaje
  averagePrice: number;
  qualityLevel: CoffeeQuality['grade'];
  strengths: string[];
  weaknesses: string[];
  marketPosition: 'leader' | 'challenger' | 'follower' | 'niche';
  lastUpdated: Date;
}

export interface SalesStrategy {
  id: string;
  name: string;
  targetMarket: string;
  recommendedPrice: number;
  expectedVolume: number;
  timeline: {
    start: Date;
    end: Date;
  };
  roi: number; // porcentaje
  riskAssessment: {
    level: 'low' | 'medium' | 'high';
    factors: string[];
  };
  requirements: string[];
}

export interface MarketAlert {
  id: string;
  type: 'price_spike' | 'price_drop' | 'opportunity' | 'risk' | 'competitor_move';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  actionRequired: boolean;
  recommendations: string[];
  expiresAt?: Date;
  createdAt: Date;
}

export interface MarketAnalysisConfig {
  priceAlerts: {
    enabled: boolean;
    thresholds: {
      priceIncrease: number; // porcentaje
      priceDecrease: number; // porcentaje
    };
  };
  predictionSettings: {
    horizon: number; // días
    updateFrequency: 'daily' | 'weekly';
    confidenceThreshold: number; // 0-1
  };
  marketPreferences: {
    preferredMarkets: string[];
    qualityFocus: CoffeeQuality['grade'][];
    riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  };
}

export interface MarketDashboardData {
  currentPrices: CoffeePrice[];
  predictions: PricePrediction[];
  trends: MarketTrend[];
  opportunities: MarketOpportunity[];
  alerts: MarketAlert[];
  competitors: CompetitorAnalysis[];
  strategies: SalesStrategy[];
  performance: {
    totalRevenue: number;
    averagePrice: number;
    volumeSold: number;
    profitMargin: number;
    marketShare: number;
  };
}

export interface PriceAnalysis {
  current: number;
  predicted: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  factors: string[];
}

export interface MarketInsight {
  id: string;
  type: 'trend' | 'opportunity' | 'risk' | 'recommendation';
  title: string;
  description: string;
  impact: 'low' | 'medium' | 'high';
  timeframe: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
  actionable: boolean;
  relatedData?: any;
}

export interface ExportMarket {
  country: string;
  region: string;
  demandLevel: 'low' | 'medium' | 'high';
  priceLevel: 'below_average' | 'average' | 'above_average' | 'premium';
  requirements: string[];
  certifications: string[];
  contactInfo?: string;
  marketSize: number; // toneladas anuales
  growthRate: number; // porcentaje anual
}

export interface QualityPriceCorrelation {
  qualityScore: number;
  expectedPrice: number;
  priceRange: {
    min: number;
    max: number;
  };
  marketDemand: 'low' | 'medium' | 'high';
  premiumPotential: number; // porcentaje sobre precio base
}

export interface MarketVolatility {
  period: string;
  volatilityIndex: number; // 0-100
  riskLevel: 'low' | 'medium' | 'high' | 'extreme';
  factors: string[];
  recommendation: string;
}

export interface SalesOptimization {
  optimalTiming: {
    month: number;
    week: number;
    confidence: number;
  };
  recommendedStrategy: SalesStrategy;
  expectedOutcome: {
    revenue: number;
    profit: number;
    roi: number;
  };
  alternatives: SalesStrategy[];
}
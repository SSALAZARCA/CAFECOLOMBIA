// Tipos para el Agente de Análisis de Mercado
export interface CoffeePrice {
  id: string;
  timestamp: Date;
  price: number; // USD por libra
  currency: 'USD' | 'COP';
  market: 'local' | 'national' | 'international';
  quality: CoffeeQuality;
  source: string;
  region?: string; // Added for Strict Reality (Local vs National)
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

// ... (omitted)

export interface MarketOpportunity {
  id: string;
  // Legacy fields (optional)
  type?: 'export' | 'local' | 'specialty' | 'direct_trade';
  market?: string;
  estimatedPrice?: number;
  // New fields for UI
  marketName: string;
  description: string;
  potentialRevenue: string; // Changed to string for display e.g. "Premium 10%"
  difficulty?: 'Baja' | 'Media' | 'Alta';
  status?: string;

  volume?: number;
  requirements: string[];
  deadline?: Date;
  profitability?: number; // porcentaje
  riskLevel?: 'low' | 'medium' | 'high';
  contact?: string;
  contactPhone?: string;
  contactUrl?: string;
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

export interface MarketTrend {
  id: string;
  name: string;
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
  trend: 'up' | 'down' | 'stable';
  category: 'price' | 'demand' | 'supply' | 'climate';
  confidence: number;
}

export interface PricePrediction {
  date: Date;
  price: number;
  confidence: {
    lower: number;
    upper: number;
  };
  factors: {
    name: string;
    impact: number;
  }[];
}
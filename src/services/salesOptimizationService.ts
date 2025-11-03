import { 
  SalesStrategy, 
  SalesOptimization, 
  QualityPriceCorrelation, 
  MarketVolatility,
  CoffeeQuality,
  MarketAlert 
} from '../types/marketAnalysis';
import { pricePredictionService } from './pricePredictionService';
import { marketTrendsService } from './marketTrendsService';

class SalesOptimizationService {
  private strategies: SalesStrategy[] = [];
  private alerts: MarketAlert[] = [];

  constructor() {
    this.initializeStrategies();
  }

  private initializeStrategies(): void {
    const now = new Date();
    
    this.strategies = [
      {
        id: 'strategy-premium',
        name: 'Estrategia Premium',
        targetMarket: 'Mercado Specialty Internacional',
        recommendedPrice: 6.50,
        expectedVolume: 500,
        timeline: {
          start: now,
          end: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000)
        },
        roi: 35.2,
        riskAssessment: {
          level: 'medium',
          factors: ['Dependencia de certificaciones', 'Volatilidad de demanda specialty']
        },
        requirements: ['Puntaje SCA >85', 'Certificaciones orgánicas', 'Trazabilidad completa']
      },
      {
        id: 'strategy-volume',
        name: 'Estrategia de Volumen',
        targetMarket: 'Mercado Nacional Comercial',
        recommendedPrice: 4.20,
        expectedVolume: 2000,
        timeline: {
          start: now,
          end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        },
        roi: 18.5,
        riskAssessment: {
          level: 'low',
          factors: ['Competencia en precios', 'Márgenes reducidos']
        },
        requirements: ['Calidad consistente', 'Entrega puntual', 'Volumen garantizado']
      },
      {
        id: 'strategy-export',
        name: 'Estrategia de Exportación',
        targetMarket: 'Unión Europea',
        recommendedPrice: 5.80,
        expectedVolume: 1000,
        timeline: {
          start: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000)
        },
        roi: 28.7,
        riskAssessment: {
          level: 'medium',
          factors: ['Regulaciones de importación', 'Fluctuaciones de tipo de cambio']
        },
        requirements: ['Certificación EU Organic', 'Fair Trade', 'Documentación completa']
      }
    ];
  }

  async optimizeSalesStrategy(
    availableVolume: number,
    quality: CoffeeQuality,
    timeframe: number = 60 // días
  ): Promise<SalesOptimization> {
    // Analizar correlación calidad-precio
    const qualityPriceCorr = await this.analyzeQualityPriceCorrelation(quality);
    
    // Obtener predicciones de precio
    const predictions = await pricePredictionService.predictPrices(timeframe);
    
    // Obtener oportunidades de mercado
    const opportunities = await marketTrendsService.getMarketOpportunities();
    
    // Calcular timing óptimo
    const optimalTiming = this.calculateOptimalTiming(predictions);
    
    // Seleccionar mejor estrategia
    const recommendedStrategy = this.selectBestStrategy(
      availableVolume,
      quality,
      qualityPriceCorr,
      opportunities
    );
    
    // Calcular resultados esperados
    const expectedOutcome = this.calculateExpectedOutcome(
      recommendedStrategy,
      availableVolume,
      optimalTiming
    );
    
    // Generar estrategias alternativas
    const alternatives = this.generateAlternativeStrategies(
      availableVolume,
      quality,
      recommendedStrategy
    );
    
    return {
      optimalTiming,
      recommendedStrategy,
      expectedOutcome,
      alternatives
    };
  }

  private calculateOptimalTiming(predictions: any[]): {
    month: number;
    week: number;
    confidence: number;
  } {
    // Encontrar el momento con mejor precio predicho
    let bestPrediction = predictions[0];
    let bestIndex = 0;
    
    predictions.forEach((pred, index) => {
      if (pred.predictedPrice > bestPrediction.predictedPrice && pred.confidence > 0.6) {
        bestPrediction = pred;
        bestIndex = index;
      }
    });
    
    const targetDate = bestPrediction.targetDate;
    
    return {
      month: targetDate.getMonth() + 1,
      week: Math.ceil(bestIndex / 7) + 1,
      confidence: bestPrediction.confidence
    };
  }

  private selectBestStrategy(
    volume: number,
    quality: CoffeeQuality,
    qualityPriceCorr: QualityPriceCorrelation,
    opportunities: any[]
  ): SalesStrategy {
    let bestStrategy = this.strategies[0];
    let bestScore = 0;
    
    this.strategies.forEach(strategy => {
      let score = 0;
      
      // Evaluar compatibilidad de volumen
      if (volume >= strategy.expectedVolume) {
        score += 30;
      } else {
        score += (volume / strategy.expectedVolume) * 30;
      }
      
      // Evaluar compatibilidad de calidad
      if (quality.score >= 85 && strategy.name.includes('Premium')) {
        score += 40;
      } else if (quality.score >= 80 && strategy.name.includes('Export')) {
        score += 35;
      } else if (strategy.name.includes('Volumen')) {
        score += 25;
      }
      
      // Evaluar ROI
      score += strategy.roi * 0.5;
      
      // Penalizar por riesgo
      if (strategy.riskAssessment.level === 'high') {
        score -= 15;
      } else if (strategy.riskAssessment.level === 'medium') {
        score -= 5;
      }
      
      if (score > bestScore) {
        bestScore = score;
        bestStrategy = strategy;
      }
    });
    
    return bestStrategy;
  }

  private calculateExpectedOutcome(
    strategy: SalesStrategy,
    volume: number,
    timing: any
  ): {
    revenue: number;
    profit: number;
    roi: number;
  } {
    const effectiveVolume = Math.min(volume, strategy.expectedVolume);
    const revenue = effectiveVolume * strategy.recommendedPrice;
    
    // Costos estimados (70% del precio de venta)
    const costs = revenue * 0.70;
    const profit = revenue - costs;
    const roi = (profit / costs) * 100;
    
    return {
      revenue,
      profit,
      roi
    };
  }

  private generateAlternativeStrategies(
    volume: number,
    quality: CoffeeQuality,
    mainStrategy: SalesStrategy
  ): SalesStrategy[] {
    return this.strategies
      .filter(s => s.id !== mainStrategy.id)
      .slice(0, 2)
      .map(strategy => ({
        ...strategy,
        expectedVolume: Math.min(volume, strategy.expectedVolume)
      }));
  }

  async analyzeQualityPriceCorrelation(quality: CoffeeQuality): Promise<QualityPriceCorrelation> {
    const basePrice = 4.0; // Precio base USD por libra
    let priceMultiplier = 1.0;
    let premiumPotential = 0;
    
    // Ajuste por puntaje de calidad
    if (quality.score >= 90) {
      priceMultiplier = 1.8;
      premiumPotential = 80;
    } else if (quality.score >= 85) {
      priceMultiplier = 1.5;
      premiumPotential = 50;
    } else if (quality.score >= 80) {
      priceMultiplier = 1.3;
      premiumPotential = 30;
    } else if (quality.score >= 75) {
      priceMultiplier = 1.1;
      premiumPotential = 10;
    }
    
    // Ajuste por certificaciones
    if (quality.certifications.includes('Organic')) {
      priceMultiplier += 0.2;
      premiumPotential += 20;
    }
    
    if (quality.certifications.includes('Fair Trade')) {
      priceMultiplier += 0.15;
      premiumPotential += 15;
    }
    
    // Ajuste por altitud
    if (quality.altitude > 1600) {
      priceMultiplier += 0.1;
      premiumPotential += 10;
    }
    
    // Ajuste por método de procesamiento
    if (quality.processingMethod === 'Honey' || quality.processingMethod === 'Natural') {
      priceMultiplier += 0.05;
      premiumPotential += 5;
    }
    
    const expectedPrice = basePrice * priceMultiplier;
    
    // Determinar demanda de mercado
    let marketDemand: 'low' | 'medium' | 'high' = 'medium';
    if (quality.score >= 85 && quality.certifications.length > 0) {
      marketDemand = 'high';
    } else if (quality.score < 75) {
      marketDemand = 'low';
    }
    
    return {
      qualityScore: quality.score,
      expectedPrice,
      priceRange: {
        min: expectedPrice * 0.9,
        max: expectedPrice * 1.15
      },
      marketDemand,
      premiumPotential
    };
  }

  async calculateMarketVolatility(days: number = 30): Promise<MarketVolatility> {
    const volatility = await pricePredictionService.calculatePriceVolatility(days);
    
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    let factors: string[] = [];
    let recommendation = '';
    
    if (volatility > 30) {
      riskLevel = 'extreme';
      factors = ['Crisis económica global', 'Eventos climáticos extremos', 'Inestabilidad política'];
      recommendation = 'Evitar ventas grandes, diversificar mercados';
    } else if (volatility > 20) {
      riskLevel = 'high';
      factors = ['Incertidumbre económica', 'Fluctuaciones de demanda', 'Cambios regulatorios'];
      recommendation = 'Ventas graduales, contratos a futuro';
    } else if (volatility > 10) {
      riskLevel = 'medium';
      factors = ['Variaciones estacionales', 'Competencia de mercado'];
      recommendation = 'Monitoreo constante, flexibilidad en estrategias';
    } else {
      riskLevel = 'low';
      factors = ['Mercado estable', 'Demanda consistente'];
      recommendation = 'Momento favorable para ventas planificadas';
    }
    
    return {
      period: `Últimos ${days} días`,
      volatilityIndex: volatility,
      riskLevel,
      factors,
      recommendation
    };
  }

  async generateMarketAlerts(): Promise<MarketAlert[]> {
    const alerts: MarketAlert[] = [];
    const now = new Date();
    
    // Alerta de precio
    const currentPrice = await pricePredictionService.getCurrentPrice();
    const volatility = await this.calculateMarketVolatility();
    
    if (volatility.riskLevel === 'high' || volatility.riskLevel === 'extreme') {
      alerts.push({
        id: `alert-volatility-${Date.now()}`,
        type: 'risk',
        severity: volatility.riskLevel === 'extreme' ? 'critical' : 'high',
        title: 'Alta Volatilidad de Mercado',
        message: `Volatilidad del ${volatility.volatilityIndex.toFixed(1)}% detectada. ${volatility.recommendation}`,
        actionRequired: true,
        recommendations: [
          'Revisar estrategias de venta actuales',
          'Considerar contratos a futuro',
          'Diversificar mercados objetivo'
        ],
        createdAt: now
      });
    }
    
    // Alerta de oportunidad
    const opportunities = await marketTrendsService.getMarketOpportunities();
    const bestOpportunity = opportunities[0];
    
    if (bestOpportunity && bestOpportunity.profitability > 30) {
      alerts.push({
        id: `alert-opportunity-${Date.now()}`,
        type: 'opportunity',
        severity: 'medium',
        title: 'Oportunidad de Alta Rentabilidad',
        message: `${bestOpportunity.market} ofrece ${bestOpportunity.profitability}% de rentabilidad`,
        actionRequired: true,
        recommendations: [
          'Evaluar cumplimiento de requisitos',
          'Preparar documentación necesaria',
          'Contactar al comprador'
        ],
        expiresAt: bestOpportunity.deadline,
        createdAt: now
      });
    }
    
    // Alerta de precio
    if (currentPrice.price > 5.0) {
      alerts.push({
        id: `alert-price-${Date.now()}`,
        type: 'price_spike',
        severity: 'medium',
        title: 'Precio Favorable Detectado',
        message: `Precio actual de $${currentPrice.price.toFixed(2)} por libra está por encima del promedio`,
        actionRequired: false,
        recommendations: [
          'Considerar acelerar ventas planificadas',
          'Aprovechar momento favorable del mercado'
        ],
        createdAt: now
      });
    }
    
    this.alerts = alerts;
    return alerts;
  }

  async getOptimalSellingCalendar(months: number = 12): Promise<{
    month: string;
    optimalityScore: number; // 0-100
    factors: string[];
    recommendedAction: string;
  }[]> {
    const calendar = [];
    const now = new Date();
    
    for (let i = 0; i < months; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = targetDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
      
      let optimalityScore = 50; // Base score
      const factors: string[] = [];
      let recommendedAction = 'Monitorear mercado';
      
      // Factores estacionales
      const monthNum = targetDate.getMonth();
      
      // Temporada alta en mercados del norte
      if (monthNum >= 9 || monthNum <= 2) {
        optimalityScore += 20;
        factors.push('Temporada alta en mercados internacionales');
        recommendedAction = 'Priorizar exportaciones';
      }
      
      // Temporada de cosecha
      if (monthNum >= 3 && monthNum <= 6) {
        optimalityScore -= 10;
        factors.push('Temporada de cosecha - mayor oferta');
        recommendedAction = 'Almacenar para mejor momento';
      }
      
      // Fin de año fiscal
      if (monthNum === 11) {
        optimalityScore += 15;
        factors.push('Cierre fiscal - demanda empresarial');
        recommendedAction = 'Acelerar ventas B2B';
      }
      
      // Factores aleatorios para simular eventos del mercado
      if (Math.random() > 0.7) {
        optimalityScore += 10;
        factors.push('Condiciones favorables proyectadas');
      }
      
      calendar.push({
        month,
        optimalityScore: Math.min(100, Math.max(0, optimalityScore)),
        factors,
        recommendedAction
      });
    }
    
    return calendar;
  }

  async getSalesStrategies(): Promise<SalesStrategy[]> {
    return this.strategies;
  }

  async getMarketAlerts(): Promise<MarketAlert[]> {
    return this.alerts;
  }

  // Método para actualizar estrategias basado en condiciones de mercado
  async updateStrategies(): Promise<void> {
    const currentPrice = await pricePredictionService.getCurrentPrice();
    const volatility = await this.calculateMarketVolatility();
    
    // Ajustar precios recomendados basado en condiciones actuales
    this.strategies.forEach(strategy => {
      if (volatility.riskLevel === 'high') {
        strategy.recommendedPrice *= 0.95; // Reducir precio para venta rápida
        strategy.riskAssessment.level = 'high';
      } else if (currentPrice.price > 5.0) {
        strategy.recommendedPrice *= 1.05; // Aprovechar precios altos
      }
    });
  }
}

export const salesOptimizationService = new SalesOptimizationService();
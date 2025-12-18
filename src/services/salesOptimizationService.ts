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
import { offlineDB } from '../utils/offlineDB';

class SalesOptimizationService {
  private strategies: SalesStrategy[] = [];
  private alerts: MarketAlert[] = [];

  constructor() {
    // Inicialización bajo demanda
  }

  async optimizeSalesStrategy(
    availableVolume: number, // Este volumen idealmente vendría de offlineDB.harvests
    quality: CoffeeQuality,
    timeframe: number = 60 // días
  ): Promise<SalesOptimization> {

    // Verificar si hay volumen real para vender
    if (availableVolume <= 0) {
      return this.generateEmptyOptimization(quality);
    }

    // Analizar correlación calidad-precio basada en datos reales
    const qualityPriceCorr = await this.analyzeQualityPriceCorrelation(quality);

    // Obtener predicciones de precio reales
    const predictions = await pricePredictionService.predictPrices(timeframe);

    // Calcular timing óptimo
    const optimalTiming = this.calculateOptimalTiming(predictions);

    // Generar estrategias dinámicas basadas en la realidad
    this.strategies = this.generateDynamicStrategies(availableVolume, quality, qualityPriceCorr);

    // Seleccionar la mejor estrategia
    const recommendedStrategy = this.strategies[0] || this.createDefaultStrategy(availableVolume, quality);

    // Calcular resultados esperados
    const expectedOutcome = this.calculateExpectedOutcome(
      recommendedStrategy,
      availableVolume
    );

    // Generar estrategias alternativas
    const alternatives = this.strategies.slice(1);

    return {
      optimalTiming,
      recommendedStrategy,
      expectedOutcome,
      alternatives
    };
  }

  private generateEmptyOptimization(quality: CoffeeQuality): SalesOptimization {
    const now = new Date();
    return {
      optimalTiming: { month: now.getMonth() + 1, week: 1, confidence: 0 },
      recommendedStrategy: {
        id: 'no-inventory',
        name: 'Sin Inventario Disponible',
        targetMarket: 'N/A',
        recommendedPrice: 0,
        expectedVolume: 0,
        timeline: { start: now, end: now },
        roi: 0,
        riskAssessment: { level: 'low', factors: [] },
        requirements: ['Registrar cosecha en OfflineDB']
      },
      expectedOutcome: { revenue: 0, profit: 0, roi: 0 },
      alternatives: []
    };
  }

  private generateDynamicStrategies(
    volume: number,
    quality: CoffeeQuality,
    priceCorr: QualityPriceCorrelation
  ): SalesStrategy[] {
    const strategies: SalesStrategy[] = [];
    const now = new Date();
    const basePrice = priceCorr.expectedPrice;

    // Estrategia 1: Venta Inmediata (Estándar)
    strategies.push({
      id: 'strategy-immediate',
      name: 'Venta Inmediata',
      targetMarket: 'Mercado Local / Cooperativa',
      recommendedPrice: basePrice,
      expectedVolume: volume,
      timeline: { start: now, end: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      roi: 10, // Estimado conservador
      riskAssessment: { level: 'low', factors: ['Fluctuación mínima en corto plazo'] },
      requirements: ['Disponibilidad inmediata']
    });

    // Estrategia 2: Calidad Superior (Solo si la calidad lo permite)
    if (quality.score >= 84) {
      strategies.push({
        id: 'strategy-quality',
        name: 'Venta Diferenciada por Calidad',
        targetMarket: 'Microlotes / Specialty',
        recommendedPrice: basePrice * 1.25, // +25% premium
        expectedVolume: volume,
        timeline: { start: now, end: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
        roi: 25,
        riskAssessment: { level: 'medium', factors: ['Requiere comprador especializado', 'Mayor tiempo de almacenamiento'] },
        requirements: ['Certificado de Calidad', 'Muestra aprobada']
      });
    }

    // Ordenar por ROI descendente
    return strategies.sort((a, b) => b.roi - a.roi);
  }

  private createDefaultStrategy(volume: number, quality: CoffeeQuality): SalesStrategy {
    const now = new Date();
    return {
      id: 'default',
      name: 'Venta Estándar',
      targetMarket: 'Punto de Compra Local',
      recommendedPrice: 0, // Se llenará con precio de mercado actual
      expectedVolume: volume,
      timeline: { start: now, end: now },
      roi: 0,
      riskAssessment: { level: 'low', factors: [] },
      requirements: []
    };
  }

  private calculateOptimalTiming(predictions: any[]): {
    month: number;
    week: number;
    confidence: number;
  } {
    if (!predictions || predictions.length === 0) {
      const now = new Date();
      return { month: now.getMonth() + 1, week: 1, confidence: 0 };
    }

    // Encontrar el momento con mejor precio predicho
    let bestPrediction = predictions[0];
    let bestIndex = 0;

    predictions.forEach((pred, index) => {
      if (pred.predictedPrice > bestPrediction.predictedPrice) {
        bestPrediction = pred;
        bestIndex = index;
      }
    });

    const targetDate = new Date(bestPrediction.targetDate);

    return {
      month: targetDate.getMonth() + 1,
      week: Math.ceil(targetDate.getDate() / 7),
      confidence: bestPrediction.confidence
    };
  }

  // Lógica de negocio (No Mock)
  async analyzeQualityPriceCorrelation(quality: CoffeeQuality): Promise<QualityPriceCorrelation> {
    const currentMarket = await pricePredictionService.getCurrentPrice();
    const basePrice = currentMarket ? currentMarket.price : 4.0; // Fallback seguro si no hay datos

    let priceMultiplier = 1.0;
    let premiumPotential = 0;

    // Reglas de negocio reales para estimación de precio
    if (quality.score >= 86) {
      priceMultiplier = 1.4; // +40%
      premiumPotential = 40;
    } else if (quality.score >= 83) {
      priceMultiplier = 1.2; // +20%
      premiumPotential = 20;
    }

    const expectedPrice = basePrice * priceMultiplier;

    return {
      qualityScore: quality.score,
      expectedPrice,
      priceRange: {
        min: expectedPrice * 0.95,
        max: expectedPrice * 1.05
      },
      marketDemand: quality.score >= 84 ? 'high' : 'medium',
      premiumPotential
    };
  }

  async calculateMarketVolatility(days: number = 30): Promise<MarketVolatility> {
    const volatility = await pricePredictionService.calculatePriceVolatility(days);

    let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';
    let recommendation = '';

    if (volatility > 20) {
      riskLevel = 'high';
      recommendation = 'Alta incertidumbre: Asegurar precio pronto.';
    } else if (volatility > 10) {
      riskLevel = 'medium';
      recommendation = 'Mercado variable: Vender escalonado.';
    } else {
      riskLevel = 'low';
      recommendation = 'Mercado estable.';
    }

    return {
      period: `Últimos ${days} días`,
      volatilityIndex: volatility,
      riskLevel,
      factors: ['Volatilidad histórica calculada'],
      recommendation
    };
  }

  async generateMarketAlerts(): Promise<MarketAlert[]> {
    const alerts: MarketAlert[] = [];
    const now = new Date();

    // Alerta de volatilidad real
    const volatility = await this.calculateMarketVolatility();

    if (volatility.riskLevel === 'high') {
      alerts.push({
        id: `alert-volatility-${Date.now()}`,
        type: 'risk',
        severity: 'high',
        title: 'Alta Volatilidad Detectada',
        message: `La volatilidad de precios es del ${volatility.volatilityIndex.toFixed(1)}%.`,
        actionRequired: true,
        recommendations: ['Considerar fijar precios', 'Revisar costos de producción'],
        createdAt: now
      });
    }

    this.alerts = alerts;
    return alerts;
  }

  async getOptimalSellingCalendar(months: number = 12): Promise<any[]> {
    // Retornamos calendario vacío si no hay datos suficientes de predicción
    // O una guía general estática basada en cosecha
    return marketTrendsService.predictMarketDemand(months);
  }

  async getSalesStrategies(): Promise<SalesStrategy[]> {
    return this.strategies;
  }

  async getMarketAlerts(): Promise<MarketAlert[]> {
    return this.alerts;
  }

  async updateStrategies(): Promise<void> {
    // No-op: Actualización se realiza al llamar optimizeSalesStrategy
  }

  private calculateExpectedOutcome(
    strategy: SalesStrategy,
    volume: number,
    timing?: any
  ): {
    revenue: number;
    profit: number;
    roi: number;
  } {
    const effectiveVolume = Math.min(volume, strategy.expectedVolume);
    const revenue = effectiveVolume * strategy.recommendedPrice;

    // Costos estimados (Hardcoded 70% temporalmente hasta integrar con EconomicService)
    const costs = revenue * 0.70;
    const profit = revenue - costs;
    const roi = costs > 0 ? (profit / costs) * 100 : 0;

    return {
      revenue,
      profit,
      roi
    };
  }
}

export const salesOptimizationService = new SalesOptimizationService();
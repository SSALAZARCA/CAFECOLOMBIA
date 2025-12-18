import {
  CoffeePrice,
  PricePrediction,
  PredictionFactor,
  CoffeeQuality,
  PriceAnalysis
} from '../types/marketAnalysis';
import { offlineDB, OfflineMarketPrice } from '../utils/offlineDB';

class PricePredictionService {
  private historicalPrices: CoffeePrice[] = [];
  private predictions: PricePrediction[] = [];

  constructor() {
    this.initializeHistoricalData();
  }

  private async initializeHistoricalData(): Promise<void> {
    try {
      // Cargar precios registrados por el usuario
      const prices = await offlineDB.marketPrices
        .orderBy('date')
        .toArray();

      this.historicalPrices = prices.map(p => ({
        id: p.id?.toString() || `temp-${Date.now()}`,
        timestamp: new Date(p.date),
        price: p.price,
        currency: p.currency,
        market: p.source,
        quality: {
          grade: p.coffeeType,
          score: 0, // No disponible en registro simple
          certifications: [],
          origin: p.region || 'Local', // Map region here
          processingMethod: 'Unknown',
          altitude: 0
        },
        source: p.source,
        region: p.region, // Add this property to the mapping
        volume: 0
      }));
    } catch (error) {
      console.error('Error initializing historical prices:', error);
      this.historicalPrices = [];
    }
  }

  async predictPrices(days: number = 30): Promise<PricePrediction[]> {
    await this.initializeHistoricalData();

    if (this.historicalPrices.length < 2) {
      return []; // No hay suficientes datos para predecir
    }

    const predictions: PricePrediction[] = [];
    const lastPrice = this.historicalPrices[this.historicalPrices.length - 1];

    // Predicción lineal simple basada en la última tendencia real
    const recentPrices = this.historicalPrices.slice(-5); // Últimos 5 registros
    const firstRecent = recentPrices[0];
    const lastRecent = recentPrices[recentPrices.length - 1];

    const timeDiff = lastRecent.timestamp.getTime() - firstRecent.timestamp.getTime();
    const priceDiff = lastRecent.price - firstRecent.price;

    // Variación diaria promedio (si timeDiff es 0, asumimos 0 cambio)
    const dailyChange = timeDiff > 0 ? priceDiff / (timeDiff / (1000 * 60 * 60 * 24)) : 0;

    for (let i = 1; i <= days; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);

      const predictedPrice = lastPrice.price + (dailyChange * i);

      predictions.push({
        id: `pred-${i}`,
        targetDate,
        predictedPrice: Math.max(0, predictedPrice), // No precios negativos
        confidence: 0.5, // Confianza media/baja al ser proyección lineal simple
        priceRange: {
          min: predictedPrice * 0.95,
          max: predictedPrice * 1.05
        },
        factors: [{
          name: 'Tendencia Histórica',
          impact: dailyChange,
          confidence: 0.8,
          description: 'Proyección basada en registros recientes del usuario',
          category: 'economic'
        }],
        methodology: 'Linear Projection',
        lastUpdated: new Date()
      });
    }

    this.predictions = predictions;
    return predictions;
  }

  async analyzePriceMovement(): Promise<PriceAnalysis> {
    await this.initializeHistoricalData();

    if (this.historicalPrices.length === 0) {
      return {
        current: 0,
        predicted: 0,
        change: 0,
        changePercent: 0,
        trend: 'stable',
        confidence: 0,
        factors: ['Datos insuficientes']
      };
    }

    const currentPrice = this.historicalPrices[this.historicalPrices.length - 1].price;
    const previousPrice = this.historicalPrices.length > 1
      ? this.historicalPrices[this.historicalPrices.length - 2].price
      : currentPrice;

    const change = currentPrice - previousPrice;
    const changePercent = previousPrice > 0 ? (change / previousPrice) * 100 : 0;

    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 1) {
      trend = changePercent > 0 ? 'up' : 'down';
    }

    return {
      current: currentPrice,
      predicted: currentPrice + change, // Proyección simple
      change,
      changePercent,
      trend,
      confidence: 0.8, // Alta confianza en datos históricos reales
      factors: ['Registros de usuario']
    };
  }

  async getHistoricalPrices(days: number = 30): Promise<CoffeePrice[]> {
    await this.initializeHistoricalData();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.historicalPrices.filter(p => p.timestamp >= cutoffDate);
  }

  async getCurrentPrice(): Promise<CoffeePrice | null> {
    await this.initializeHistoricalData();
    if (this.historicalPrices.length === 0) return null;
    return this.historicalPrices[this.historicalPrices.length - 1];
  }

  async calculatePriceVolatility(days: number = 30): Promise<number> {
    const prices = await this.getHistoricalPrices(days);
    if (prices.length < 2) return 0;

    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      const prev = prices[i - 1].price;
      if (prev > 0) {
        const dailyReturn = (prices[i].price - prev) / prev;
        returns.push(dailyReturn);
      }
    }

    if (returns.length === 0) return 0;

    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;

    // Volatilidad simple (desviación estándar)
    return Math.sqrt(variance) * 100;
  }
}

export const pricePredictionService = new PricePredictionService();
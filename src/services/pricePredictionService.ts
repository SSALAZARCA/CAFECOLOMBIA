import { 
  CoffeePrice, 
  PricePrediction, 
  PredictionFactor, 
  CoffeeQuality,
  PriceAnalysis 
} from '../types/marketAnalysis';

class PricePredictionService {
  private historicalPrices: CoffeePrice[] = [];
  private predictions: PricePrediction[] = [];

  constructor() {
    this.initializeHistoricalData();
  }

  private initializeHistoricalData(): void {
    // Generar datos históricos de precios mock
    const now = new Date();
    const prices: CoffeePrice[] = [];
    
    for (let i = 90; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const basePrice = 4.50; // USD por libra
      const seasonalFactor = Math.sin((date.getMonth() / 12) * 2 * Math.PI) * 0.3;
      const randomFactor = (Math.random() - 0.5) * 0.4;
      const trendFactor = -i * 0.001; // Tendencia ligeramente bajista
      
      const price = basePrice + seasonalFactor + randomFactor + trendFactor;
      
      prices.push({
        id: `price-${i}`,
        timestamp: date,
        price: Math.max(3.0, price),
        currency: 'USD',
        market: 'international',
        quality: {
          grade: 'Specialty',
          score: 85 + Math.random() * 10,
          certifications: ['Organic', 'Fair Trade'],
          origin: 'Colombia',
          processingMethod: 'Washed',
          altitude: 1500
        },
        source: 'ICE Futures',
        volume: 1000 + Math.random() * 500
      });
    }
    
    this.historicalPrices = prices;
  }

  async predictPrices(days: number = 30): Promise<PricePrediction[]> {
    const predictions: PricePrediction[] = [];
    const lastPrice = this.historicalPrices[this.historicalPrices.length - 1];
    
    for (let i = 1; i <= days; i++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + i);
      
      // Algoritmo de predicción mock basado en tendencias y factores
      const factors = this.generatePredictionFactors();
      const basePrice = lastPrice.price;
      
      // Calcular impacto de factores
      let priceImpact = 0;
      factors.forEach(factor => {
        priceImpact += factor.impact * factor.confidence * 0.1;
      });
      
      // Agregar componente estacional
      const seasonalImpact = Math.sin((targetDate.getMonth() / 12) * 2 * Math.PI) * 0.2;
      
      // Agregar ruido aleatorio
      const randomImpact = (Math.random() - 0.5) * 0.1;
      
      const predictedPrice = basePrice + priceImpact + seasonalImpact + randomImpact;
      const confidence = Math.max(0.6 - (i * 0.01), 0.3); // Confianza decrece con el tiempo
      
      predictions.push({
        id: `pred-${i}`,
        targetDate,
        predictedPrice: Math.max(3.0, predictedPrice),
        confidence,
        priceRange: {
          min: predictedPrice * 0.9,
          max: predictedPrice * 1.1
        },
        factors,
        methodology: 'ML',
        lastUpdated: new Date()
      });
    }
    
    this.predictions = predictions;
    return predictions;
  }

  private generatePredictionFactors(): PredictionFactor[] {
    const factors: PredictionFactor[] = [
      {
        name: 'Condiciones Climáticas',
        impact: (Math.random() - 0.5) * 0.6,
        confidence: 0.8,
        description: 'Impacto de las condiciones meteorológicas en la producción',
        category: 'weather'
      },
      {
        name: 'Demanda Global',
        impact: (Math.random() - 0.3) * 0.4,
        confidence: 0.7,
        description: 'Tendencias en el consumo mundial de café',
        category: 'demand'
      },
      {
        name: 'Inventarios Globales',
        impact: (Math.random() - 0.6) * 0.5,
        confidence: 0.75,
        description: 'Niveles de inventario en mercados principales',
        category: 'supply'
      },
      {
        name: 'Tipo de Cambio USD/COP',
        impact: (Math.random() - 0.5) * 0.3,
        confidence: 0.6,
        description: 'Fluctuaciones en el tipo de cambio',
        category: 'economic'
      },
      {
        name: 'Calidad de Cosecha',
        impact: Math.random() * 0.4,
        confidence: 0.85,
        description: 'Calidad esperada de la cosecha actual',
        category: 'quality'
      }
    ];
    
    return factors;
  }

  async analyzePriceMovement(): Promise<PriceAnalysis> {
    const recentPrices = this.historicalPrices.slice(-7); // Últimos 7 días
    const currentPrice = recentPrices[recentPrices.length - 1].price;
    const previousPrice = recentPrices[0].price;
    
    const change = currentPrice - previousPrice;
    const changePercent = (change / previousPrice) * 100;
    
    // Obtener predicción para mañana
    const predictions = await this.predictPrices(1);
    const nextDayPrediction = predictions[0];
    
    let trend: 'up' | 'down' | 'stable' = 'stable';
    if (Math.abs(changePercent) > 2) {
      trend = changePercent > 0 ? 'up' : 'down';
    }
    
    return {
      current: currentPrice,
      predicted: nextDayPrediction.predictedPrice,
      change,
      changePercent,
      trend,
      confidence: nextDayPrediction.confidence,
      factors: nextDayPrediction.factors.map(f => f.name)
    };
  }

  async getHistoricalPrices(days: number = 30): Promise<CoffeePrice[]> {
    return this.historicalPrices.slice(-days);
  }

  async getCurrentPrice(): Promise<CoffeePrice> {
    return this.historicalPrices[this.historicalPrices.length - 1];
  }

  async calculatePriceVolatility(days: number = 30): Promise<number> {
    const prices = this.historicalPrices.slice(-days);
    const returns = [];
    
    for (let i = 1; i < prices.length; i++) {
      const dailyReturn = (prices[i].price - prices[i-1].price) / prices[i-1].price;
      returns.push(dailyReturn);
    }
    
    // Calcular desviación estándar
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance) * Math.sqrt(252); // Anualizada
    
    return volatility * 100; // Como porcentaje
  }

  async identifyPriceTrends(): Promise<{
    shortTerm: 'bullish' | 'bearish' | 'neutral';
    mediumTerm: 'bullish' | 'bearish' | 'neutral';
    longTerm: 'bullish' | 'bearish' | 'neutral';
  }> {
    const shortTermPrices = this.historicalPrices.slice(-7);
    const mediumTermPrices = this.historicalPrices.slice(-30);
    const longTermPrices = this.historicalPrices.slice(-90);
    
    const analyzeTrend = (prices: CoffeePrice[]) => {
      const firstPrice = prices[0].price;
      const lastPrice = prices[prices.length - 1].price;
      const change = (lastPrice - firstPrice) / firstPrice;
      
      if (change > 0.02) return 'bullish';
      if (change < -0.02) return 'bearish';
      return 'neutral';
    };
    
    return {
      shortTerm: analyzeTrend(shortTermPrices),
      mediumTerm: analyzeTrend(mediumTermPrices),
      longTerm: analyzeTrend(longTermPrices)
    };
  }

  // Método para simular actualizaciones en tiempo real
  async updatePrices(): Promise<void> {
    const lastPrice = this.historicalPrices[this.historicalPrices.length - 1];
    const newPrice: CoffeePrice = {
      ...lastPrice,
      id: `price-${Date.now()}`,
      timestamp: new Date(),
      price: lastPrice.price + (Math.random() - 0.5) * 0.1,
      volume: 1000 + Math.random() * 500
    };
    
    this.historicalPrices.push(newPrice);
    
    // Mantener solo los últimos 90 días
    if (this.historicalPrices.length > 90) {
      this.historicalPrices = this.historicalPrices.slice(-90);
    }
  }
}

export const pricePredictionService = new PricePredictionService();
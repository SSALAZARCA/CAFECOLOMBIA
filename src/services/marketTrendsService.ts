import { 
  MarketTrend, 
  MarketOpportunity, 
  CompetitorAnalysis, 
  ExportMarket,
  MarketInsight,
  CoffeeQuality 
} from '../types/marketAnalysis';

class MarketTrendsService {
  private trends: MarketTrend[] = [];
  private opportunities: MarketOpportunity[] = [];
  private competitors: CompetitorAnalysis[] = [];
  private exportMarkets: ExportMarket[] = [];

  constructor() {
    this.initializeMarketData();
  }

  private initializeMarketData(): void {
    this.initializeTrends();
    this.initializeOpportunities();
    this.initializeCompetitors();
    this.initializeExportMarkets();
  }

  private initializeTrends(): void {
    const now = new Date();
    
    this.trends = [
      {
        id: 'trend-weekly',
        period: 'weekly',
        startDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        endDate: now,
        priceChange: 2.3,
        volumeChange: -1.2,
        trend: 'bullish',
        confidence: 0.78,
        factors: ['Reducción en inventarios', 'Aumento demanda europea', 'Clima favorable']
      },
      {
        id: 'trend-monthly',
        period: 'monthly',
        startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        endDate: now,
        priceChange: -1.8,
        volumeChange: 3.4,
        trend: 'bearish',
        confidence: 0.65,
        factors: ['Aumento en producción Brasil', 'Fortalecimiento del dólar', 'Incertidumbre económica']
      },
      {
        id: 'trend-quarterly',
        period: 'quarterly',
        startDate: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000),
        endDate: now,
        priceChange: 5.7,
        volumeChange: -2.1,
        trend: 'bullish',
        confidence: 0.82,
        factors: ['Crisis climática en Vietnam', 'Crecimiento mercado specialty', 'Certificaciones sostenibles']
      }
    ];
  }

  private initializeOpportunities(): void {
    const now = new Date();
    
    this.opportunities = [
      {
        id: 'opp-export-eu',
        type: 'export',
        market: 'Unión Europea',
        estimatedPrice: 5.20,
        volume: 2000,
        requirements: ['Certificación Orgánica', 'Fair Trade', 'Trazabilidad completa'],
        deadline: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000),
        profitability: 18.5,
        riskLevel: 'medium',
        contact: 'importador-eu@coffee.com'
      },
      {
        id: 'opp-specialty-local',
        type: 'specialty',
        market: 'Cafeterías Specialty Bogotá',
        estimatedPrice: 6.80,
        volume: 500,
        requirements: ['Puntaje SCA >85', 'Micro-lote', 'Historia del productor'],
        deadline: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
        profitability: 35.2,
        riskLevel: 'low',
        contact: 'specialty@bogota.com'
      },
      {
        id: 'opp-direct-trade',
        type: 'direct_trade',
        market: 'Tostadores Artesanales USA',
        estimatedPrice: 7.50,
        volume: 300,
        requirements: ['Relación directa', 'Visita a finca', 'Calidad excepcional'],
        deadline: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000),
        profitability: 42.8,
        riskLevel: 'low'
      }
    ];
  }

  private initializeCompetitors(): void {
    this.competitors = [
      {
        id: 'comp-huila',
        competitorName: 'Cooperativa del Huila',
        marketShare: 15.2,
        averagePrice: 4.85,
        qualityLevel: 'Specialty',
        strengths: ['Volumen consistente', 'Certificaciones', 'Red de distribución'],
        weaknesses: ['Menor diferenciación', 'Dependencia de intermediarios'],
        marketPosition: 'leader',
        lastUpdated: new Date()
      },
      {
        id: 'comp-nariño',
        competitorName: 'Cafés de Nariño',
        marketShare: 8.7,
        averagePrice: 5.20,
        qualityLevel: 'Premium',
        strengths: ['Alta calidad', 'Marca reconocida', 'Innovación'],
        weaknesses: ['Menor volumen', 'Precios altos'],
        marketPosition: 'challenger',
        lastUpdated: new Date()
      },
      {
        id: 'comp-tolima',
        competitorName: 'Productores del Tolima',
        marketShare: 12.1,
        averagePrice: 4.60,
        qualityLevel: 'Commercial',
        strengths: ['Precios competitivos', 'Logística eficiente'],
        weaknesses: ['Calidad variable', 'Poca diferenciación'],
        marketPosition: 'follower',
        lastUpdated: new Date()
      }
    ];
  }

  private initializeExportMarkets(): void {
    this.exportMarkets = [
      {
        country: 'Estados Unidos',
        region: 'Costa Este',
        demandLevel: 'high',
        priceLevel: 'above_average',
        requirements: ['FDA approval', 'Organic certification'],
        certifications: ['USDA Organic', 'Fair Trade USA'],
        marketSize: 50000,
        growthRate: 8.5,
        contactInfo: 'usa-imports@coffee.com'
      },
      {
        country: 'Alemania',
        region: 'Europa Central',
        demandLevel: 'high',
        priceLevel: 'premium',
        requirements: ['EU Organic', 'Rainforest Alliance'],
        certifications: ['EU Organic', 'Rainforest Alliance', 'UTZ'],
        marketSize: 35000,
        growthRate: 6.2
      },
      {
        country: 'Japón',
        region: 'Asia Pacífico',
        demandLevel: 'medium',
        priceLevel: 'premium',
        requirements: ['JAS Organic', 'Detailed traceability'],
        certifications: ['JAS Organic', 'Bird Friendly'],
        marketSize: 15000,
        growthRate: 12.3
      }
    ];
  }

  async getMarketTrends(period?: 'weekly' | 'monthly' | 'quarterly'): Promise<MarketTrend[]> {
    if (period) {
      return this.trends.filter(trend => trend.period === period);
    }
    return this.trends;
  }

  async getMarketOpportunities(type?: MarketOpportunity['type']): Promise<MarketOpportunity[]> {
    if (type) {
      return this.opportunities.filter(opp => opp.type === type);
    }
    return this.opportunities.sort((a, b) => b.profitability - a.profitability);
  }

  async getCompetitorAnalysis(): Promise<CompetitorAnalysis[]> {
    return this.competitors.sort((a, b) => b.marketShare - a.marketShare);
  }

  async getExportMarkets(): Promise<ExportMarket[]> {
    return this.exportMarkets.sort((a, b) => b.growthRate - a.growthRate);
  }

  async generateMarketInsights(): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];
    
    // Insight sobre tendencias de precios
    const weeklyTrend = this.trends.find(t => t.period === 'weekly');
    if (weeklyTrend && weeklyTrend.priceChange > 2) {
      insights.push({
        id: 'insight-price-surge',
        type: 'opportunity',
        title: 'Alza de Precios Detectada',
        description: `Los precios han subido ${weeklyTrend.priceChange}% esta semana. Momento óptimo para ventas.`,
        impact: 'high',
        timeframe: 'immediate',
        actionable: true,
        relatedData: weeklyTrend
      });
    }
    
    // Insight sobre oportunidades de exportación
    const bestOpportunity = this.opportunities.reduce((best, current) => 
      current.profitability > best.profitability ? current : best
    );
    
    insights.push({
      id: 'insight-best-opportunity',
      type: 'opportunity',
      title: 'Mejor Oportunidad de Mercado',
      description: `${bestOpportunity.market} ofrece ${bestOpportunity.profitability}% de rentabilidad.`,
      impact: 'high',
      timeframe: 'short_term',
      actionable: true,
      relatedData: bestOpportunity
    });
    
    // Insight sobre competencia
    const topCompetitor = this.competitors[0];
    insights.push({
      id: 'insight-competition',
      type: 'risk',
      title: 'Análisis Competitivo',
      description: `${topCompetitor.competitorName} lidera con ${topCompetitor.marketShare}% del mercado.`,
      impact: 'medium',
      timeframe: 'medium_term',
      actionable: true,
      relatedData: topCompetitor
    });
    
    // Insight sobre mercados de exportación
    const fastestGrowingMarket = this.exportMarkets.reduce((fastest, current) =>
      current.growthRate > fastest.growthRate ? current : fastest
    );
    
    insights.push({
      id: 'insight-export-growth',
      type: 'trend',
      title: 'Mercado de Exportación en Crecimiento',
      description: `${fastestGrowingMarket.country} muestra crecimiento del ${fastestGrowingMarket.growthRate}% anual.`,
      impact: 'medium',
      timeframe: 'long_term',
      actionable: true,
      relatedData: fastestGrowingMarket
    });
    
    return insights;
  }

  async analyzeMarketPosition(quality: CoffeeQuality): Promise<{
    position: string;
    competitiveAdvantages: string[];
    recommendations: string[];
    marketFit: number; // 0-100
  }> {
    // Análisis basado en la calidad del café
    const qualityScore = quality.score;
    const certifications = quality.certifications;
    
    let marketFit = 0;
    const competitiveAdvantages: string[] = [];
    const recommendations: string[] = [];
    
    // Evaluar posición basada en calidad
    if (qualityScore >= 85) {
      marketFit += 30;
      competitiveAdvantages.push('Calidad specialty premium');
      if (qualityScore >= 90) {
        competitiveAdvantages.push('Calidad excepcional para mercados de lujo');
        marketFit += 10;
      }
    }
    
    // Evaluar certificaciones
    if (certifications.includes('Organic')) {
      marketFit += 20;
      competitiveAdvantages.push('Certificación orgánica valorada');
    }
    
    if (certifications.includes('Fair Trade')) {
      marketFit += 15;
      competitiveAdvantages.push('Comercio justo atractivo para mercados conscientes');
    }
    
    // Evaluar origen y procesamiento
    if (quality.altitude > 1400) {
      marketFit += 15;
      competitiveAdvantages.push('Café de altura con características únicas');
    }
    
    if (quality.processingMethod === 'Washed') {
      marketFit += 10;
      competitiveAdvantages.push('Proceso lavado preferido en mercados premium');
    }
    
    // Generar recomendaciones
    if (marketFit >= 80) {
      recommendations.push('Enfocar en mercados specialty y exportación premium');
      recommendations.push('Desarrollar marca propia y marketing directo');
    } else if (marketFit >= 60) {
      recommendations.push('Mejorar certificaciones para acceder a mejores mercados');
      recommendations.push('Considerar alianzas con tostadores especializados');
    } else {
      recommendations.push('Invertir en mejora de calidad y procesos');
      recommendations.push('Obtener certificaciones básicas (Orgánico, Fair Trade)');
    }
    
    const position = marketFit >= 80 ? 'Premium' : 
                    marketFit >= 60 ? 'Specialty' : 
                    marketFit >= 40 ? 'Commercial Plus' : 'Commercial';
    
    return {
      position,
      competitiveAdvantages,
      recommendations,
      marketFit
    };
  }

  async predictMarketDemand(months: number = 6): Promise<{
    period: string;
    demandLevel: 'low' | 'medium' | 'high';
    factors: string[];
    confidence: number;
  }[]> {
    const predictions = [];
    const now = new Date();
    
    for (let i = 1; i <= months; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = targetDate.getMonth();
      
      // Factores estacionales
      let demandLevel: 'low' | 'medium' | 'high' = 'medium';
      const factors: string[] = [];
      let confidence = 0.7;
      
      // Temporada alta en países del norte (otoño/invierno)
      if (month >= 9 || month <= 2) {
        demandLevel = 'high';
        factors.push('Temporada alta en mercados del norte');
        confidence += 0.1;
      }
      
      // Temporada de cosecha en Colombia
      if (month >= 3 && month <= 6) {
        factors.push('Temporada de cosecha principal');
        if (demandLevel === 'medium') demandLevel = 'high';
      }
      
      // Factores económicos simulados
      if (Math.random() > 0.7) {
        factors.push('Crecimiento económico proyectado');
        if (demandLevel === 'low') demandLevel = 'medium';
        if (demandLevel === 'medium') demandLevel = 'high';
      }
      
      // Tendencias de consumo
      if (Math.random() > 0.6) {
        factors.push('Crecimiento del mercado specialty');
        confidence += 0.05;
      }
      
      predictions.push({
        period: targetDate.toLocaleDateString('es-CO', { year: 'numeric', month: 'long' }),
        demandLevel,
        factors,
        confidence: Math.min(confidence, 0.9)
      });
    }
    
    return predictions;
  }

  // Método para actualizar datos de mercado
  async updateMarketData(): Promise<void> {
    // Simular actualización de tendencias
    this.trends.forEach(trend => {
      trend.priceChange += (Math.random() - 0.5) * 0.5;
      trend.volumeChange += (Math.random() - 0.5) * 0.3;
      trend.confidence = Math.max(0.5, trend.confidence + (Math.random() - 0.5) * 0.1);
    });
    
    // Simular nuevas oportunidades ocasionalmente
    if (Math.random() > 0.9) {
      const newOpportunity: MarketOpportunity = {
        id: `opp-${Date.now()}`,
        type: 'local',
        market: 'Nuevo Cliente Local',
        estimatedPrice: 4.5 + Math.random() * 2,
        volume: 100 + Math.random() * 500,
        requirements: ['Calidad consistente'],
        deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        profitability: 10 + Math.random() * 20,
        riskLevel: 'low'
      };
      
      this.opportunities.push(newOpportunity);
    }
  }
}

export const marketTrendsService = new MarketTrendsService();
import {
  MarketTrend,
  MarketOpportunity,
  CompetitorAnalysis,
  ExportMarket,
  MarketInsight,
  CoffeeQuality
} from '../types/marketAnalysis';
import { pricePredictionService } from './pricePredictionService';

class MarketTrendsService {
  private trends: MarketTrend[] = [];
  private opportunities: MarketOpportunity[] = [];
  private competitors: CompetitorAnalysis[] = [];
  private exportMarkets: ExportMarket[] = [];

  constructor() {
    this.initializeMarketData();
  }

  private initializeMarketData(): void {
    // Inicializar datos estáticos (educativos/referencia)
    this.initializeCompetitors();
    this.initializeExportMarkets();
    // Las tendencias y oportunidades se calculan dinámicamente o se dejan vacías si no hay datos
  }

  private initializeCompetitors(): void {
    // Datos estáticos de referencia del mercado colombiano
    this.competitors = [
      {
        id: 'ref-huila',
        competitorName: 'Huila (Referencia)',
        marketShare: 18.0,
        averagePrice: 0, // Se actualizará si hay datos reales comparativos
        qualityLevel: 'Specialty',
        strengths: ['Volumen consistente', 'Denominación de Origen', 'Alta asociatividad'],
        weaknesses: [],
        marketPosition: 'leader',
        lastUpdated: new Date()
      },
      {
        id: 'ref-narino',
        competitorName: 'Nariño (Referencia)',
        marketShare: 9.0,
        averagePrice: 0,
        qualityLevel: 'Premium',
        strengths: ['Alta acidez', 'Perfiles exóticos', 'Marca regional fuerte'],
        weaknesses: ['Logística compleja'],
        marketPosition: 'challenger',
        lastUpdated: new Date()
      }
    ];
  }

  private initializeExportMarkets(): void {
    // Guía estática de mercados potenciales
    this.exportMarkets = [
      {
        country: 'Estados Unidos',
        region: 'Norteamérica',
        demandLevel: 'high',
        priceLevel: 'above_average',
        requirements: ['FDA Registration', 'FSMA Compliance'],
        certifications: ['USDA Organic', 'Fair Trade USA'],
        marketSize: 0, // Dato referencial no disponible offline
        growthRate: 0,
        contactInfo: 'Requiere agente comercial'
      },
      {
        country: 'Alemania',
        region: 'Europa',
        demandLevel: 'high',
        priceLevel: 'premium',
        requirements: ['EU Organic', 'Green Deal Compliance'],
        certifications: ['EU Organic', 'Rainforest Alliance'],
        marketSize: 0,
        growthRate: 0
      },
      {
        country: 'Japón',
        region: 'Asia',
        demandLevel: 'medium',
        priceLevel: 'premium',
        requirements: ['Límites estrictos LMR', 'JAS Organic'],
        certifications: ['JAS Organic'],
        marketSize: 0,
        growthRate: 0
      }
    ];
  }

  async getNationalOpportunities(): Promise<MarketOpportunity[]> {
    // Datos estáticos de referencia nacional con contactos reales
    return [
      {
        id: 'nat-1',
        marketName: 'Cooperativa de Caficultores (FNC)',
        description: 'Venta con Garantía de Compra en puntos autorizados.',
        potentialRevenue: 'Precio Base + Bonificaciones',
        difficulty: 'Baja',
        requirements: ['Cédula Cafetera', 'Registro Finca'],
        status: 'active',
        contact: 'Línea Nacional FNC',
        contactPhone: '01 8000 950 070',
        contactUrl: 'https://federaciondecafeteros.org/'
      },
      {
        id: 'nat-2',
        marketName: 'Almacenes de Cadena (Grupo Éxito/Carulla)',
        description: 'Programa proveedores Carulla FreshMarket (Café Especial).',
        potentialRevenue: 'Premium 10-15%',
        difficulty: 'Alta',
        requirements: ['Volumen Mínimo', 'Empaquetado', 'Registro INVIMA'],
        status: 'active',
        contact: 'Portal Proveedores',
        contactUrl: 'https://www.grupo-exito.com/es/proveedores'
      },
      {
        id: 'nat-3',
        marketName: 'Almacafe (Logística y Trilla)',
        description: 'Servicios de trilla y almacenamiento para exportación.',
        potentialRevenue: 'Valor Agregado (Trilla)',
        difficulty: 'Media',
        requirements: ['Calidad > Factor 90', 'Muestra Física'],
        status: 'active',
        contact: 'Oficina Central Bogotá',
        contactPhone: '(601) 313 6600',
        contactUrl: 'https://www.almacafe.com.co/'
      }
    ];
  }

  async getMarketTrends(period?: 'weekly' | 'monthly' | 'quarterly'): Promise<MarketTrend[]> {
    // Intenta generar una tendencia basada en el historial de precios local
    const priceAnalysis = await pricePredictionService.analyzePriceMovement();

    // Si no hay datos suficientes, retornar vacío
    if (priceAnalysis.confidence === 0) {
      return [];
    }

    // Convertir el análisis de precios en una tendencia de mercado "local"
    const localTrend: MarketTrend = {
      id: 'local-trend-generated',
      period: period || 'weekly',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      priceChange: priceAnalysis.changePercent,
      volumeChange: 0, // No tenemos datos de volumen de mercado general
      trend: priceAnalysis.trend === 'up' ? 'bullish' : priceAnalysis.trend === 'down' ? 'bearish' : 'neutral',
      confidence: priceAnalysis.confidence,
      factors: ['Basado en historial de precios registrado']
    };

    return [localTrend];
  }

  async getMarketOpportunities(type?: MarketOpportunity['type']): Promise<MarketOpportunity[]> {
    // Sin backend real, no podemos "inventar" oportunidades de venta.
    // Retornamos lista vacía para cumplir con "Strict Reality".
    // Futuro: Permitir que el usuario registre oportunidades manualmente.
    return [];
  }

  async getCompetitorAnalysis(): Promise<CompetitorAnalysis[]> {
    return this.competitors;
  }

  async getExportMarkets(): Promise<ExportMarket[]> {
    return this.exportMarkets;
  }

  async generateMarketInsights(): Promise<MarketInsight[]> {
    const insights: MarketInsight[] = [];
    const priceAnalysis = await pricePredictionService.analyzePriceMovement();

    // Solo generar insights si hay datos reales
    if (priceAnalysis.confidence > 0 && Math.abs(priceAnalysis.changePercent) > 5) {
      insights.push({
        id: 'insight-price-volatility',
        type: priceAnalysis.changePercent > 0 ? 'opportunity' : 'risk',
        title: priceAnalysis.changePercent > 0 ? 'Tendencia Alcista Detectada' : 'Tendencia Bajista Detectada',
        description: `Sus registros indican un cambio de ${priceAnalysis.changePercent.toFixed(1)}% en los precios recientes.`,
        impact: Math.abs(priceAnalysis.changePercent) > 10 ? 'high' : 'medium',
        timeframe: 'immediate',
        actionable: true,
        relatedData: priceAnalysis
      });
    }

    return insights;
  }

  async analyzeMarketPosition(quality: CoffeeQuality): Promise<{
    position: string;
    competitiveAdvantages: string[];
    recommendations: string[];
    marketFit: number;
  }> {
    // Lógica determinista basada en reglas de negocio (SCA Score)
    // Esto es válido mantenerlo ya que no es "mock" sino "Lógica de Negocio"
    const qualityScore = quality.score;
    const certifications = quality.certifications;

    let marketFit = 0;
    const competitiveAdvantages: string[] = [];
    const recommendations: string[] = [];

    if (qualityScore >= 85) {
      marketFit += 30;
      competitiveAdvantages.push('Calidad Specialty (>85 SCA)');
    }

    if (certifications.includes('Organic') || certifications.includes('USDA Organic')) {
      marketFit += 20;
      competitiveAdvantages.push('Certificación Orgánica');
    }

    if (certifications.includes('Fair Trade')) {
      marketFit += 15;
      competitiveAdvantages.push('Fair Trade');
    }

    if (quality.altitude > 1500) {
      marketFit += 15;
      competitiveAdvantages.push('Altura (>1500 msnm)');
    }

    // Recomendaciones estáticas pero válidas según puntaje
    if (marketFit >= 70) {
      recommendations.push('Perfil apto para exportación directa o microlotes.');
    } else if (marketFit >= 40) {
      recommendations.push('Considerar mejorar procesos de beneficio para alcanzar estándar Specialty.');
    } else {
      recommendations.push('Enfocarse en volumen o certificar para agregar valor.');
    }

    const position = marketFit >= 70 ? 'Premium/Export' :
      marketFit >= 40 ? 'Estándar Mejorado' : 'Comercial';

    return {
      position,
      competitiveAdvantages,
      recommendations,
      marketFit
    };
  }

  async predictMarketDemand(months: number = 6): Promise<any[]> {
    // Sin datos globales reales, no podemos predecir demanda.
    // Retornamos predicción estacional simple basada en calendario cafetero de Colombia.
    const predictions = [];
    const now = new Date();

    for (let i = 1; i <= months; i++) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const month = targetDate.getMonth(); // 0-11

      let demandLevel = 'medium';
      const factors = [];

      // Estacionalidad simple (Cosecha principal vs Mitaca)
      // Ejemplo genérico para Colombia
      if (month >= 9 || month <= 11) {
        demandLevel = 'high';
        factors.push('Cosecha Principal (aprox)');
      } else if (month >= 3 && month <= 5) {
        demandLevel = 'medium';
        factors.push('Cosecha Mitaca (aprox)');
      }

      predictions.push({
        period: targetDate.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }),
        demandLevel,
        factors,
        confidence: 0.5 // Baja confianza por ser genérico
      });
    }

    return predictions;
  }

  async updateMarketData(): Promise<void> {
    // No-op: No hay simulación de actualización
  }
}

export const marketTrendsService = new MarketTrendsService();
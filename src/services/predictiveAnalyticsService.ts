// Servicio de Análisis Predictivo para Alertas Tempranas (Determinístico y conectado a DB)
import {
  WeatherConditions,
  WeatherForecast,
  RiskPrediction,
  PestType,
  RiskLevel,
  PredictiveModel,
  HistoricalPestData,
  PredictionAnalysis,
  PestRiskFactors,
  ModelPerformanceMetrics,
  WeatherPattern
} from '../types/earlyWarning';
import { offlineDB, OfflinePestMonitoring } from '../utils/offlineDB';

class PredictiveAnalyticsService {
  private models: Map<PestType, PredictiveModel> = new Map();
  private weatherPatterns: WeatherPattern[] = [];

  constructor() {
    this.initializeModels();
    this.initializeWeatherPatterns();
  }

  // Inicializar modelos predictivos (Valores fijos basados en literatura, no random)
  private initializeModels(): void {
    const pestTypes: PestType[] = ['roya', 'broca', 'minador', 'cochinilla', 'nematodos', 'antracnosis', 'mancha_foliar', 'ojo_gallo'];

    // Configuraciones base para cada plaga
    const baseConfigs: Record<string, { accuracy: number, weights: any }> = {
      'roya': { accuracy: 0.85, weights: { weather: 0.5, seasonal: 0.2, historical: 0.2, environmental: 0.1 } },
      'broca': { accuracy: 0.82, weights: { weather: 0.4, seasonal: 0.3, historical: 0.2, environmental: 0.1 } },
      'default': { accuracy: 0.75, weights: { weather: 0.4, seasonal: 0.2, historical: 0.2, environmental: 0.2 } }
    };

    pestTypes.forEach(pestType => {
      const config = baseConfigs[pestType] || baseConfigs['default'];
      const model: PredictiveModel = {
        id: `model_${pestType}_v1`,
        name: `Modelo Predictivo ${pestType.charAt(0).toUpperCase() + pestType.slice(1)}`,
        pestType,
        version: '1.0.0',
        accuracy: config.accuracy,
        lastTrained: new Date('2023-01-01'), // Fecha fija
        parameters: {
          weatherWeight: config.weights.weather,
          seasonalWeight: config.weights.seasonal,
          historicalWeight: config.weights.historical,
          environmentalWeight: config.weights.environmental
        },
        thresholds: {
          low: 0.2,
          medium: 0.4,
          high: 0.7,
          critical: 0.85
        }
      };
      this.models.set(pestType, model);
    });
  }

  // Inicializar patrones meteorológicos (Estáticos)
  private initializeWeatherPatterns(): void {
    this.weatherPatterns = [
      {
        id: 'pattern_humid_warm',
        name: 'Cálido y Húmedo',
        description: 'Condiciones favorables para hongos y bacterias',
        conditions: { temperature: 25, humidity: 85, rainfall: 15 },
        duration: 7,
        frequency: 3,
        associatedPests: ['roya', 'antracnosis', 'mancha_foliar'],
        riskMultiplier: 1.5,
        seasonality: [4, 5, 9, 10, 11]
      },
      {
        id: 'pattern_dry_hot',
        name: 'Seco y Caliente',
        description: 'Condiciones favorables para insectos',
        conditions: { temperature: 30, humidity: 45, rainfall: 2 },
        duration: 14,
        frequency: 2,
        associatedPests: ['broca', 'minador', 'cochinilla'],
        riskMultiplier: 1.3,
        seasonality: [1, 2, 3, 7, 8]
      }
    ];
  }

  // Obtener factores de riesgo para cada plaga
  private getPestRiskFactors(pestType: PestType): PestRiskFactors {
    const riskFactors: Record<PestType, PestRiskFactors> = {
      roya: {
        temperature: { min: 18, max: 28, optimal: 22 },
        humidity: { min: 70, max: 100, optimal: 85 },
        rainfall: { min: 10, max: 50, optimal: 20 },
        seasonality: [4, 5, 6, 10, 11],
        hostPlantStage: ['floración', 'desarrollo_fruto'],
        previousOccurrence: true
      },
      broca: {
        temperature: { min: 20, max: 35, optimal: 28 },
        humidity: { min: 40, max: 80, optimal: 60 },
        rainfall: { min: 0, max: 15, optimal: 5 },
        seasonality: [1, 2, 3, 7, 8, 9],
        hostPlantStage: ['maduración_fruto', 'cosecha'],
        previousOccurrence: false
      },
      minador: {
        temperature: { min: 22, max: 32, optimal: 27 },
        humidity: { min: 50, max: 85, optimal: 70 },
        rainfall: { min: 5, max: 20, optimal: 10 },
        seasonality: [2, 3, 4, 8, 9],
        hostPlantStage: ['brotes_nuevos', 'crecimiento'],
        previousOccurrence: false
      },
      cochinilla: {
        temperature: { min: 25, max: 35, optimal: 30 },
        humidity: { min: 30, max: 70, optimal: 50 },
        rainfall: { min: 0, max: 10, optimal: 3 },
        seasonality: [1, 2, 3, 7, 8],
        hostPlantStage: ['cualquier_etapa'],
        previousOccurrence: true
      },
      nematodos: {
        temperature: { min: 20, max: 30, optimal: 25 },
        humidity: { min: 80, max: 100, optimal: 90 },
        rainfall: { min: 15, max: 40, optimal: 25 },
        seasonality: [5, 6, 10, 11, 12],
        hostPlantStage: ['raíces_jóvenes'],
        previousOccurrence: true
      },
      antracnosis: {
        temperature: { min: 20, max: 28, optimal: 24 },
        humidity: { min: 75, max: 95, optimal: 85 },
        rainfall: { min: 12, max: 35, optimal: 20 },
        seasonality: [4, 5, 6, 9, 10, 11],
        hostPlantStage: ['floración', 'desarrollo_fruto'],
        previousOccurrence: false
      },
      mancha_foliar: {
        temperature: { min: 18, max: 26, optimal: 22 },
        humidity: { min: 70, max: 90, optimal: 80 },
        rainfall: { min: 8, max: 25, optimal: 15 },
        seasonality: [4, 5, 6, 10, 11],
        hostPlantStage: ['hojas_jóvenes', 'crecimiento'],
        previousOccurrence: false
      },
      ojo_gallo: {
        temperature: { min: 19, max: 27, optimal: 23 },
        humidity: { min: 75, max: 95, optimal: 85 },
        rainfall: { min: 10, max: 30, optimal: 18 },
        seasonality: [4, 5, 6, 9, 10, 11],
        hostPlantStage: ['hojas_maduras', 'frutos'],
        previousOccurrence: true
      }
    };

    return riskFactors[pestType];
  }

  // Calcular probabilidad de riesgo basada en condiciones meteorológicas
  private calculateWeatherRisk(weather: WeatherConditions, pestType: PestType): number {
    const factors = this.getPestRiskFactors(pestType);

    // Calcular score para temperatura
    const tempScore = this.calculateOptimalityScore(
      weather.temperature, factors.temperature.min, factors.temperature.max, factors.temperature.optimal
    );

    // Calcular score para humedad
    const humidityScore = this.calculateOptimalityScore(
      weather.humidity, factors.humidity.min, factors.humidity.max, factors.humidity.optimal
    );

    // Calcular score para lluvia
    const rainfallScore = this.calculateOptimalityScore(
      weather.rainfall, factors.rainfall.min, factors.rainfall.max, factors.rainfall.optimal
    );

    // Promedio ponderado
    return (tempScore * 0.4 + humidityScore * 0.4 + rainfallScore * 0.2);
  }

  // Calcular score de optimalidad (0 a 1)
  private calculateOptimalityScore(value: number, min: number, max: number, optimal: number): number {
    if (value < min || value > max) return 0;
    if (value === optimal) return 1;

    const distanceToOptimal = Math.abs(value - optimal);
    const maxDistance = Math.max(optimal - min, max - optimal);

    return Math.max(0, 1 - (distanceToOptimal / maxDistance));
  }

  // Calcular riesgo estacional (Determinístico)
  private calculateSeasonalRisk(date: Date, pestType: PestType): number {
    const factors = this.getPestRiskFactors(pestType);
    const month = date.getMonth() + 1;
    return factors.seasonality.includes(month) ? 0.9 : 0.2;
  }

  // Calcular riesgo histórico REAL desde offlineDB
  private async calculateHistoricalRisk(pestType: PestType): Promise<number> {
    try {
      const pestMonitorings = await offlineDB.pestMonitoring
        .where('pestType')
        .equals(pestType)
        .toArray();

      if (pestMonitorings.length === 0) return 0.1; // Riesgo base bajo si no hay historial

      // Filtrar últimos 6 meses
      const sixMonthsAgo = new Date(Date.now() - 180 * 24 * 60 * 60 * 1000);
      const recent = pestMonitorings.filter(p => new Date(p.observationDate) > sixMonthsAgo);

      if (recent.length === 0) return 0.2;

      // Calcular severidad promedio
      let severityScore = 0;
      recent.forEach(p => {
        if (p.severity === 'CRITICAL') severityScore += 5;
        else if (p.severity === 'HIGH') severityScore += 3;
        else if (p.severity === 'MEDIUM') severityScore += 1;
      });

      // Normalizar score (máximo heurístico de 20 puntos de severidad en 6 meses = 100%)
      const normalized = Math.min(1, severityScore / 20);
      return normalized;
    } catch (e) {
      console.warn('Error reading historical risk:', e);
      return 0.1;
    }
  }

  // Determinar nivel de riesgo
  private determineRiskLevel(probability: number): RiskLevel {
    if (probability >= 0.80) return 'critical';
    if (probability >= 0.60) return 'high';
    if (probability >= 0.35) return 'medium';
    return 'low';
  }

  // Generar recomendaciones (Estáticas)
  private generateRecommendations(pestType: PestType, riskLevel: RiskLevel): string[] {
    const baseRecommendations: Record<PestType, Record<RiskLevel, string[]>> = {
      roya: {
        low: ['Monitoreo semanal de hojas', 'Mantener buena ventilación'],
        medium: ['Aplicar fungicida preventivo', 'Aumentar frecuencia de monitoreo'],
        high: ['Aplicar fungicida sistémico', 'Mejorar drenaje', 'Poda sanitaria'],
        critical: ['Tratamiento inmediato con fungicida', 'Aislamiento de áreas afectadas', 'Consultar especialista']
      },
      broca: {
        low: ['Inspección de frutos semanalmente', 'Mantener limpieza del cultivo'],
        medium: ['Colocar trampas con feromonas', 'Cosecha oportuna de frutos maduros'],
        high: ['Aplicar insecticida específico', 'Intensificar trampeo', 'Cosecha inmediata'],
        critical: ['Tratamiento químico urgente', 'Cosecha total inmediata', 'Destrucción de frutos caídos']
      },
      minador: {
        low: ['Revisión de hojas nuevas', 'Control de malezas'],
        medium: ['Aplicar insecticida foliar', 'Eliminar hojas afectadas'],
        high: ['Tratamiento sistémico', 'Poda de brotes afectados', 'Control biológico'],
        critical: ['Aplicación inmediata de insecticida', 'Poda severa', 'Monitoreo diario']
      },
      cochinilla: {
        low: ['Inspección de tallos y hojas', 'Mantener plantas saludables'],
        medium: ['Aplicar aceite mineral', 'Eliminar insectos manualmente'],
        high: ['Insecticida sistémico', 'Lavado con agua a presión', 'Control biológico'],
        critical: ['Tratamiento químico intensivo', 'Aislamiento de plantas', 'Consulta técnica']
      },
      nematodos: {
        low: ['Análisis de suelo anual', 'Rotación con cultivos resistentes'],
        medium: ['Aplicar nematicida biológico', 'Mejorar estructura del suelo'],
        high: ['Nematicida químico', 'Solarización del suelo', 'Injertos resistentes'],
        critical: ['Tratamiento del suelo urgente', 'Replantación con variedades resistentes', 'Consulta especializada']
      },
      antracnosis: {
        low: ['Monitoreo de frutos', 'Evitar heridas en plantas'],
        medium: ['Fungicida preventivo', 'Mejorar ventilación'],
        high: ['Fungicida sistémico', 'Eliminación de frutos afectados', 'Poda sanitaria'],
        critical: ['Tratamiento fungicida inmediato', 'Cosecha anticipada', 'Desinfección de herramientas']
      },
      mancha_foliar: {
        low: ['Inspección foliar semanal', 'Evitar riego por aspersión'],
        medium: ['Fungicida foliar', 'Eliminación de hojas afectadas'],
        high: ['Fungicida sistémico', 'Poda de ventilación', 'Control de humedad'],
        critical: ['Tratamiento fungicida urgente', 'Defoliación parcial', 'Mejora del drenaje']
      },
      ojo_gallo: {
        low: ['Monitoreo de hojas y frutos', 'Mantener limpieza'],
        medium: ['Fungicida preventivo', 'Eliminación de material infectado'],
        high: ['Fungicida sistémico', 'Poda sanitaria severa', 'Control de sombra'],
        critical: ['Tratamiento inmediato', 'Eliminación total de material afectado', 'Consulta técnica urgente']
      }
    };
    return baseRecommendations[pestType]?.[riskLevel] || ['Consultar con especialista'];
  }

  // Análisis predictivo principal
  async analyzePestRisk(
    currentWeather: WeatherConditions,
    forecast: WeatherForecast[],
    pestTypes: PestType[] = ['roya', 'broca', 'minador', 'cochinilla']
  ): Promise<PredictionAnalysis[]> {
    console.log('🔬 [PestAnalysis] Iniciando análisis determinístico con datos reales...');

    // Ejecutar análisis en paralelo
    const promises = pestTypes.map(async (pestType) => {
      const model = this.models.get(pestType);
      if (!model) return null;

      // 1. Riesgo Climático
      const weatherRisk = this.calculateWeatherRisk(currentWeather, pestType);

      // 2. Riesgo Estacional
      const seasonalRisk = this.calculateSeasonalRisk(new Date(), pestType);

      // 3. Riesgo Histórico (Async desde DB)
      const historicalRisk = await this.calculateHistoricalRisk(pestType);

      // 4. Riesgo Ambiental (Por ahora fijo o derivado de weatherRisk)
      const environmentalRisk = weatherRisk * 0.8; // Simplificación determinística

      // Probabilidad Total Ponderada
      const totalProbability = Math.min(0.99, Math.max(0.01,
        (weatherRisk * model.parameters.weatherWeight) +
        (seasonalRisk * model.parameters.seasonalWeight) +
        (historicalRisk * model.parameters.historicalWeight) +
        (environmentalRisk * model.parameters.environmentalWeight)
      ));

      const riskLevel = this.determineRiskLevel(totalProbability);

      // Timeframe determinístico basado en ciclo de vida y clima
      // Si hace calor, el ciclo es más rápido
      const cycleSpeed = currentWeather.temperature > 25 ? 0.8 : 1.0;
      const startDays = 2 * cycleSpeed;
      const peakDays = 7 * cycleSpeed;
      const endDays = 14 * cycleSpeed;

      const start = new Date(Date.now() + startDays * 24 * 60 * 60 * 1000);
      const peak = new Date(Date.now() + peakDays * 24 * 60 * 60 * 1000);
      const end = new Date(Date.now() + endDays * 24 * 60 * 60 * 1000);

      const prediction: RiskPrediction = {
        pestType,
        riskLevel,
        confidence: model.accuracy, // Confianza del modelo fija
        probability: totalProbability,
        timeframe: { start, peak, end },
        factors: {
          weather: weatherRisk,
          seasonal: seasonalRisk,
          historical: historicalRisk,
          environmental: environmentalRisk
        },
        recommendations: this.generateRecommendations(pestType, riskLevel)
      };

      return {
        modelId: model.id,
        pestType,
        inputData: {
          currentWeather,
          forecast,
          historicalData: [], // Se podría poblar
          farmConditions: {
            cropStage: 'desarrollo_fruto', // Se podría obtener de Lotes
            lastTreatment: new Date(),
            soilMoisture: 60,
            plantHealth: 80
          }
        },
        prediction,
        alternativeScenarios: [],
        modelConfidence: model.accuracy,
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      } as PredictionAnalysis;
    });

    const results = await Promise.all(promises);
    return results.filter((r): r is PredictionAnalysis => r !== null);
  }

  // Obtener patrones meteorológicos
  getWeatherPatterns(): WeatherPattern[] {
    return this.weatherPatterns;
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
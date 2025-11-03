// Servicio de Análisis Predictivo para Alertas Tempranas
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

class PredictiveAnalyticsService {
  private models: Map<PestType, PredictiveModel> = new Map();
  private historicalData: HistoricalPestData[] = [];
  private weatherPatterns: WeatherPattern[] = [];

  constructor() {
    this.initializeModels();
    this.initializeHistoricalData();
    this.initializeWeatherPatterns();
  }

  // Inicializar modelos predictivos mock
  private initializeModels(): void {
    const pestTypes: PestType[] = ['roya', 'broca', 'minador', 'cochinilla', 'nematodos', 'antracnosis', 'mancha_foliar', 'ojo_gallo'];
    
    pestTypes.forEach(pestType => {
      const model: PredictiveModel = {
        id: `model_${pestType}_v1`,
        name: `Modelo Predictivo ${pestType.charAt(0).toUpperCase() + pestType.slice(1)}`,
        pestType,
        version: '1.0.0',
        accuracy: 0.75 + Math.random() * 0.2, // 75-95% accuracy
        lastTrained: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Últimos 30 días
        parameters: {
          weatherWeight: 0.4,
          seasonalWeight: 0.25,
          historicalWeight: 0.2,
          environmentalWeight: 0.15
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

  // Inicializar datos históricos mock
  private initializeHistoricalData(): void {
    const pestTypes: PestType[] = ['roya', 'broca', 'minador', 'cochinilla'];
    const currentDate = new Date();
    
    for (let i = 0; i < 50; i++) {
      const occurrenceDate = new Date(currentDate.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
      
      this.historicalData.push({
        id: `hist_${i}`,
        pestType: pestTypes[Math.floor(Math.random() * pestTypes.length)],
        occurrenceDate,
        severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as 'low' | 'medium' | 'high',
        affectedArea: Math.random() * 10 + 1, // 1-11 hectáreas
        weatherConditions: this.generateMockWeatherConditions(occurrenceDate),
        treatmentApplied: this.generateMockTreatments(),
        effectiveness: Math.random() * 100,
        cost: Math.random() * 1000 + 200,
        notes: `Ocurrencia histórica de ${pestTypes[Math.floor(Math.random() * pestTypes.length)]}`
      });
    }
  }

  // Inicializar patrones meteorológicos
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
      },
      {
        id: 'pattern_rainy_season',
        name: 'Temporada Lluviosa',
        description: 'Alta humedad y precipitación constante',
        conditions: { temperature: 22, humidity: 90, rainfall: 25 },
        duration: 21,
        frequency: 2,
        associatedPests: ['roya', 'nematodos', 'ojo_gallo'],
        riskMultiplier: 1.8,
        seasonality: [4, 5, 6, 10, 11]
      }
    ];
  }

  // Generar condiciones meteorológicas mock
  private generateMockWeatherConditions(date: Date): WeatherConditions {
    const month = date.getMonth() + 1;
    const isRainySeason = [4, 5, 6, 10, 11].includes(month);
    
    return {
      temperature: isRainySeason ? 20 + Math.random() * 8 : 25 + Math.random() * 10,
      humidity: isRainySeason ? 75 + Math.random() * 20 : 45 + Math.random() * 30,
      rainfall: isRainySeason ? Math.random() * 30 : Math.random() * 10,
      windSpeed: Math.random() * 15 + 5,
      pressure: 1010 + Math.random() * 20,
      uvIndex: Math.random() * 10 + 2,
      dewPoint: 15 + Math.random() * 10,
      timestamp: date
    };
  }

  // Generar tratamientos mock
  private generateMockTreatments(): string[] {
    const treatments = [
      'Fungicida cúprico',
      'Insecticida orgánico',
      'Control biológico',
      'Poda sanitaria',
      'Mejora drenaje',
      'Fertilización foliar',
      'Control cultural'
    ];
    
    const numTreatments = Math.floor(Math.random() * 3) + 1;
    return treatments.sort(() => 0.5 - Math.random()).slice(0, numTreatments);
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
      weather.temperature, 
      factors.temperature.min, 
      factors.temperature.max, 
      factors.temperature.optimal
    );
    
    // Calcular score para humedad
    const humidityScore = this.calculateOptimalityScore(
      weather.humidity, 
      factors.humidity.min, 
      factors.humidity.max, 
      factors.humidity.optimal
    );
    
    // Calcular score para lluvia
    const rainfallScore = this.calculateOptimalityScore(
      weather.rainfall, 
      factors.rainfall.min, 
      factors.rainfall.max, 
      factors.rainfall.optimal
    );
    
    // Promedio ponderado
    return (tempScore * 0.4 + humidityScore * 0.4 + rainfallScore * 0.2);
  }

  // Calcular score de optimalidad para un parámetro
  private calculateOptimalityScore(value: number, min: number, max: number, optimal: number): number {
    if (value < min || value > max) {
      return 0;
    }
    
    if (value === optimal) {
      return 1;
    }
    
    // Calcular distancia al valor óptimo
    const distanceToOptimal = Math.abs(value - optimal);
    const maxDistance = Math.max(optimal - min, max - optimal);
    
    return Math.max(0, 1 - (distanceToOptimal / maxDistance));
  }

  // Calcular riesgo estacional
  private calculateSeasonalRisk(date: Date, pestType: PestType): number {
    const factors = this.getPestRiskFactors(pestType);
    const month = date.getMonth() + 1;
    
    if (factors.seasonality.includes(month)) {
      // Mes de alta temporada
      return 0.8 + Math.random() * 0.2;
    } else {
      // Mes de baja temporada
      return Math.random() * 0.3;
    }
  }

  // Calcular riesgo histórico
  private calculateHistoricalRisk(pestType: PestType): number {
    const relevantHistory = this.historicalData.filter(h => h.pestType === pestType);
    
    if (relevantHistory.length === 0) {
      return 0.1;
    }
    
    // Calcular frecuencia de ocurrencias en los últimos 12 meses
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    const recentOccurrences = relevantHistory.filter(h => h.occurrenceDate > oneYearAgo);
    
    const frequency = recentOccurrences.length / 12; // Ocurrencias por mes
    return Math.min(frequency * 0.3, 0.8);
  }

  // Determinar nivel de riesgo basado en probabilidad
  private determineRiskLevel(probability: number): RiskLevel {
    if (probability >= 0.85) return 'critical';
    if (probability >= 0.7) return 'high';
    if (probability >= 0.4) return 'medium';
    return 'low';
  }

  // Generar recomendaciones basadas en el riesgo
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

    return baseRecommendations[pestType][riskLevel] || ['Consultar con especialista'];
  }

  // Función auxiliar para procesar una plaga de forma asíncrona
  private async processPestAnalysis(
    pestType: PestType,
    currentWeather: WeatherConditions,
    forecast: WeatherForecast[]
  ): Promise<PredictionAnalysis | null> {
    return new Promise((resolve) => {
      // Usar setTimeout para no bloquear el hilo principal
      setTimeout(() => {
        const model = this.models.get(pestType);
        if (!model) {
          resolve(null);
          return;
        }

        try {
          // Calcular factores de riesgo
          const weatherRisk = this.calculateWeatherRisk(currentWeather, pestType);
          const seasonalRisk = this.calculateSeasonalRisk(new Date(), pestType);
          const historicalRisk = this.calculateHistoricalRisk(pestType);
          const environmentalRisk = 0.3 + Math.random() * 0.4; // Mock environmental factors

          // Calcular probabilidad total usando pesos del modelo
          const totalProbability = (
            weatherRisk * model.parameters.weatherWeight +
            seasonalRisk * model.parameters.seasonalWeight +
            historicalRisk * model.parameters.historicalWeight +
            environmentalRisk * model.parameters.environmentalWeight
          );

          const riskLevel = this.determineRiskLevel(totalProbability);
          const confidence = model.accuracy * (0.8 + Math.random() * 0.2);

          // Calcular timeframe
          const start = new Date();
          const peak = new Date(start.getTime() + (3 + Math.random() * 7) * 24 * 60 * 60 * 1000);
          const end = new Date(peak.getTime() + (7 + Math.random() * 14) * 24 * 60 * 60 * 1000);

          const prediction: RiskPrediction = {
            pestType,
            riskLevel,
            confidence,
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

          // Generar escenarios alternativos
          const alternativeScenarios: RiskPrediction[] = [];
          for (let i = 0; i < 2; i++) {
            const altProbability = Math.max(0, Math.min(1, totalProbability + (Math.random() - 0.5) * 0.3));
            const altRiskLevel = this.determineRiskLevel(altProbability);
            
            alternativeScenarios.push({
              ...prediction,
              probability: altProbability,
              riskLevel: altRiskLevel,
              confidence: confidence * 0.8,
              recommendations: this.generateRecommendations(pestType, altRiskLevel)
            });
          }

          const analysis: PredictionAnalysis = {
            modelId: model.id,
            pestType,
            inputData: {
              currentWeather,
              forecast,
              historicalData: this.historicalData.filter(h => h.pestType === pestType),
              farmConditions: {
                cropStage: 'desarrollo_fruto',
                lastTreatment: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                soilMoisture: 60 + Math.random() * 30,
                plantHealth: 70 + Math.random() * 25
              }
            },
            prediction,
            alternativeScenarios,
            modelConfidence: confidence,
            dataQuality: 0.85 + Math.random() * 0.1,
            timestamp: new Date()
          };

          resolve(analysis);
        } catch (error) {
          console.error(`Error processing pest analysis for ${pestType}:`, error);
          resolve(null);
        }
      }, 0); // Permitir que el navegador actualice la UI
    });
  }

  // Análisis predictivo principal optimizado
  async analyzePestRisk(
    currentWeather: WeatherConditions,
    forecast: WeatherForecast[],
    pestTypes: PestType[] = ['roya', 'broca', 'minador', 'cochinilla']
  ): Promise<PredictionAnalysis[]> {
    console.log('🔬 [PestAnalysis] Iniciando análisis simplificado y rápido...');
    
    // Análisis simplificado y directo - sin procesamiento asíncrono complejo
    const analyses: PredictionAnalysis[] = pestTypes.map(pestType => {
      const model = this.models.get(pestType);
      if (!model) {
        console.warn(`⚠️ [PestAnalysis] Modelo no encontrado para ${pestType}, usando valores por defecto`);
        return this.createFallbackAnalysis(pestType, currentWeather);
      }

      // Cálculo rápido de factores de riesgo
      const weatherRisk = this.calculateWeatherRisk(currentWeather, pestType);
      const seasonalRisk = this.calculateSeasonalRisk(new Date(), pestType);
      const historicalRisk = 0.3 + Math.random() * 0.3; // Simplificado
      const environmentalRisk = 0.2 + Math.random() * 0.4; // Simplificado

      // Probabilidad total simplificada
      const totalProbability = Math.min(0.95, Math.max(0.05, 
        weatherRisk * 0.4 + seasonalRisk * 0.3 + historicalRisk * 0.2 + environmentalRisk * 0.1
      ));

      const riskLevel = this.determineRiskLevel(totalProbability);
      const confidence = 0.75 + Math.random() * 0.2; // Simplificado

      // Timeframe simplificado
      const start = new Date();
      const peak = new Date(start.getTime() + (2 + Math.random() * 5) * 24 * 60 * 60 * 1000);
      const end = new Date(peak.getTime() + (5 + Math.random() * 10) * 24 * 60 * 60 * 1000);

      const prediction: RiskPrediction = {
        pestType,
        riskLevel,
        confidence,
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
          historicalData: [], // Simplificado
          farmConditions: {
            cropStage: 'desarrollo_fruto',
            lastTreatment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            soilMoisture: 60 + Math.random() * 20,
            plantHealth: 70 + Math.random() * 25
          }
        },
        prediction,
        alternativeScenarios: [], // Simplificado - sin escenarios alternativos
        modelConfidence: confidence,
        generatedAt: new Date(),
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
    });

    console.log(`✅ [PestAnalysis] Análisis completado para ${analyses.length} plagas`);
    return analyses;
  }

  // Método de respaldo para crear análisis básico cuando no hay modelo
  private createFallbackAnalysis(pestType: PestType, weather: WeatherConditions): PredictionAnalysis {
    const tempFactor = Math.abs(weather.temperature - 22) / 10;
    const humidityFactor = Math.abs(weather.humidity - 65) / 35;
    const probability = Math.min(0.8, 0.2 + tempFactor + humidityFactor);
    const riskLevel = this.determineRiskLevel(probability);

    return {
      modelId: `fallback_${pestType}`,
      pestType,
      inputData: {
        currentWeather: weather,
        forecast: [],
        historicalData: [],
        farmConditions: {
          cropStage: 'desarrollo_fruto',
          lastTreatment: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          soilMoisture: 65,
          plantHealth: 75
        }
      },
      prediction: {
        pestType,
        riskLevel,
        confidence: 0.6,
        probability,
        timeframe: {
          start: new Date(),
          peak: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
          end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        },
        factors: {
          weather: tempFactor + humidityFactor,
          seasonal: 0.3,
          historical: 0.3,
          environmental: 0.2
        },
        recommendations: this.generateRecommendations(pestType, riskLevel)
      },
      alternativeScenarios: [],
      modelConfidence: 0.6,
      generatedAt: new Date(),
      validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };
  }

  // Obtener métricas de rendimiento del modelo
  getModelPerformance(pestType: PestType): ModelPerformanceMetrics | null {
    const model = this.models.get(pestType);
    if (!model) return null;

    return {
      modelId: model.id,
      pestType,
      accuracy: model.accuracy,
      precision: model.accuracy * (0.9 + Math.random() * 0.1),
      recall: model.accuracy * (0.85 + Math.random() * 0.15),
      f1Score: model.accuracy * (0.87 + Math.random() * 0.13),
      falsePositiveRate: (1 - model.accuracy) * 0.6,
      falseNegativeRate: (1 - model.accuracy) * 0.4,
      lastEvaluated: model.lastTrained,
      testDataSize: 100 + Math.floor(Math.random() * 200),
      performanceTrend: ['improving', 'declining', 'stable'][Math.floor(Math.random() * 3)] as 'improving' | 'declining' | 'stable'
    };
  }

  // Obtener patrones meteorológicos
  getWeatherPatterns(): WeatherPattern[] {
    return this.weatherPatterns;
  }

  // Obtener datos históricos
  getHistoricalData(pestType?: PestType): HistoricalPestData[] {
    if (pestType) {
      return this.historicalData.filter(h => h.pestType === pestType);
    }
    return this.historicalData;
  }

  // Actualizar modelo (mock)
  async updateModel(pestType: PestType): Promise<boolean> {
    const model = this.models.get(pestType);
    if (!model) return false;

    // Simular actualización del modelo
    model.accuracy = Math.min(0.95, model.accuracy + (Math.random() - 0.5) * 0.1);
    model.lastTrained = new Date();
    model.version = `${model.version.split('.')[0]}.${parseInt(model.version.split('.')[1]) + 1}.0`;

    return true;
  }

  // Validar predicción
  async validatePrediction(predictionId: string, actualOutcome: any): Promise<boolean> {
    // Mock validation logic
    console.log(`Validating prediction ${predictionId} with outcome:`, actualOutcome);
    return true;
  }
}

export const predictiveAnalyticsService = new PredictiveAnalyticsService();
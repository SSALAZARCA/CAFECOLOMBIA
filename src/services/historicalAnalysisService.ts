import {
  HistoricalPestData,
  WeatherPattern,
  PestType,
  RiskLevel,
  WeatherConditions,
  PredictionValidation,
  ModelPerformanceMetrics,
  ChartDataPoint,
  RiskTrendData
} from '../types/earlyWarning';

// Interfaces específicas para análisis histórico
interface HistoricalDataPoint {
  date: Date;
  pestType: PestType;
  incidenceLevel: number; // 0-1
  weatherConditions: WeatherConditions;
  treatmentApplied?: string;
  effectiveness?: number; // 0-1
  location: string;
  cropStage: 'seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest';
}

interface PatternRecognitionResult {
  pattern: {
    id: string;
    name: string;
    description: string;
    confidence: number;
    frequency: number; // veces por año
  };
  triggers: {
    weather: WeatherPattern[];
    seasonal: {
      months: number[];
      probability: number;
    };
    environmental: {
      temperature_range: [number, number];
      humidity_range: [number, number];
      rainfall_range: [number, number];
    };
  };
  predictions: {
    nextOccurrence: Date;
    probability: number;
    severity: RiskLevel;
  };
}

interface SeasonalTrend {
  pestType: PestType;
  month: number;
  averageIncidence: number;
  peakProbability: number;
  historicalSeverity: RiskLevel;
  recommendedActions: string[];
}

interface CorrelationAnalysis {
  pestType: PestType;
  weatherFactors: {
    temperature: number; // correlación -1 a 1
    humidity: number;
    rainfall: number;
    windSpeed: number;
  };
  seasonalFactors: {
    month: number;
    correlation: number;
  }[];
  treatmentEffectiveness: {
    treatment: string;
    successRate: number;
    conditions: string[];
  }[];
}

interface PredictiveAccuracy {
  model: string;
  pestType: PestType;
  accuracy: number;
  precision: number;
  recall: number;
  f1Score: number;
  lastValidation: Date;
  sampleSize: number;
}

class HistoricalAnalysisService {
  private historicalData: HistoricalDataPoint[] = [];
  private patterns: PatternRecognitionResult[] = [];
  private seasonalTrends: SeasonalTrend[] = [];
  private correlations: CorrelationAnalysis[] = [];
  private accuracyMetrics: PredictiveAccuracy[] = [];

  constructor() {
    this.initializeMockHistoricalData();
    this.analyzePatterns();
    this.calculateSeasonalTrends();
    this.performCorrelationAnalysis();
  }

  private initializeMockHistoricalData(): void {
    // Generar datos históricos simulados para los últimos 3 años
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 3);
    
    const pestTypes: PestType[] = ['roya', 'broca', 'minador', 'cochinilla'];
    const locations = ['Zona Norte', 'Zona Sur', 'Zona Este', 'Zona Oeste'];
    const cropStages: ('seedling' | 'vegetative' | 'flowering' | 'fruiting' | 'harvest')[] = 
      ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'];

    for (let i = 0; i < 1095; i++) { // 3 años de datos diarios
      const currentDate = new Date(startDate);
      currentDate.setDate(currentDate.getDate() + i);
      
      // Generar datos para cada tipo de plaga
      pestTypes.forEach(pestType => {
        // Simular patrones estacionales
        const month = currentDate.getMonth();
        const seasonalFactor = this.getSeasonalFactor(pestType, month);
        
        // Generar condiciones meteorológicas
        const weather = this.generateMockWeatherForDate(currentDate);
        
        // Calcular nivel de incidencia basado en factores
        const weatherFactor = this.calculateWeatherFactor(pestType, weather);
        const baseIncidence = Math.random() * 0.3; // Base random
        const incidenceLevel = Math.min(1, baseIncidence + seasonalFactor + weatherFactor);
        
        // Solo agregar si hay incidencia significativa
        if (incidenceLevel > 0.1) {
          const dataPoint: HistoricalDataPoint = {
            date: new Date(currentDate),
            pestType,
            incidenceLevel,
            weatherConditions: weather,
            location: locations[Math.floor(Math.random() * locations.length)],
            cropStage: cropStages[Math.floor(Math.random() * cropStages.length)]
          };
          
          // Agregar tratamiento si la incidencia es alta
          if (incidenceLevel > 0.6) {
            dataPoint.treatmentApplied = this.getRandomTreatment(pestType);
            dataPoint.effectiveness = Math.random() * 0.4 + 0.6; // 60-100% efectividad
          }
          
          this.historicalData.push(dataPoint);
        }
      });
    }
  }

  private getSeasonalFactor(pestType: PestType, month: number): number {
    // Patrones estacionales específicos por plaga
    const seasonalPatterns = {
      roya: [0.3, 0.4, 0.5, 0.3, 0.2, 0.1, 0.1, 0.1, 0.2, 0.4, 0.5, 0.4], // Picos en época lluviosa
      broca: [0.2, 0.2, 0.3, 0.4, 0.5, 0.4, 0.3, 0.3, 0.4, 0.5, 0.4, 0.3], // Más constante
      minador: [0.4, 0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.2, 0.3, 0.4, 0.5, 0.4], // Similar a roya
      cochinilla: [0.1, 0.2, 0.3, 0.4, 0.5, 0.5, 0.4, 0.3, 0.2, 0.2, 0.2, 0.1] // Picos en época seca
    };
    
    return seasonalPatterns[pestType]?.[month] || 0.2;
  }

  private generateMockWeatherForDate(date: Date): WeatherConditions {
    const month = date.getMonth();
    
    // Patrones meteorológicos estacionales para Colombia
    const baseTemp = 22 + Math.sin((month - 3) * Math.PI / 6) * 3; // Variación estacional
    const baseHumidity = 70 + Math.sin((month - 9) * Math.PI / 6) * 15; // Época seca/lluviosa
    const baseRainfall = Math.max(0, 5 + Math.sin((month - 9) * Math.PI / 6) * 10);
    
    return {
      temperature: baseTemp + (Math.random() - 0.5) * 6,
      humidity: Math.max(30, Math.min(95, baseHumidity + (Math.random() - 0.5) * 20)),
      rainfall: Math.max(0, baseRainfall + (Math.random() - 0.5) * 15),
      windSpeed: 5 + Math.random() * 10,
      pressure: 1013 + (Math.random() - 0.5) * 20,
      uvIndex: 8 + Math.random() * 4
    };
  }

  private calculateWeatherFactor(pestType: PestType, weather: WeatherConditions): number {
    // Factores meteorológicos específicos por plaga
    const weatherPreferences = {
      roya: {
        temperature: { optimal: 22, tolerance: 3 },
        humidity: { optimal: 85, tolerance: 10 },
        rainfall: { optimal: 10, tolerance: 5 }
      },
      broca: {
        temperature: { optimal: 25, tolerance: 4 },
        humidity: { optimal: 70, tolerance: 15 },
        rainfall: { optimal: 5, tolerance: 8 }
      },
      minador: {
        temperature: { optimal: 24, tolerance: 3 },
        humidity: { optimal: 75, tolerance: 12 },
        rainfall: { optimal: 8, tolerance: 6 }
      },
      cochinilla: {
        temperature: { optimal: 26, tolerance: 4 },
        humidity: { optimal: 60, tolerance: 15 },
        rainfall: { optimal: 3, tolerance: 4 }
      }
    };
    
    const prefs = weatherPreferences[pestType];
    if (!prefs) return 0;
    
    const tempFactor = 1 - Math.abs(weather.temperature - prefs.temperature.optimal) / (prefs.temperature.tolerance * 2);
    const humidityFactor = 1 - Math.abs(weather.humidity - prefs.humidity.optimal) / (prefs.humidity.tolerance * 2);
    const rainfallFactor = 1 - Math.abs(weather.rainfall - prefs.rainfall.optimal) / (prefs.rainfall.tolerance * 2);
    
    return Math.max(0, (tempFactor + humidityFactor + rainfallFactor) / 3) * 0.4;
  }

  private getRandomTreatment(pestType: PestType): string {
    const treatments = {
      roya: ['Fungicida cúprico', 'Triazol sistémico', 'Manejo cultural'],
      broca: ['Insecticida organofosforado', 'Control biológico', 'Trampas con feromonas'],
      minador: ['Insecticida sistémico', 'Control biológico', 'Podas sanitarias'],
      cochinilla: ['Aceite mineral', 'Insecticida sistémico', 'Control biológico']
    };
    
    const pestTreatments = treatments[pestType] || ['Tratamiento genérico'];
    return pestTreatments[Math.floor(Math.random() * pestTreatments.length)];
  }

  // Análisis de patrones
  private analyzePatterns(): void {
    const pestTypes: PestType[] = ['roya', 'broca', 'minador', 'cochinilla'];
    
    pestTypes.forEach(pestType => {
      const pestData = this.historicalData.filter(d => d.pestType === pestType);
      
      // Analizar patrones estacionales
      const seasonalPattern = this.identifySeasonalPattern(pestData);
      
      // Analizar patrones meteorológicos
      const weatherPattern = this.identifyWeatherPattern(pestData);
      
      // Crear resultado de reconocimiento de patrón
      const pattern: PatternRecognitionResult = {
        pattern: {
          id: `pattern_${pestType}_seasonal`,
          name: `Patrón Estacional de ${pestType.charAt(0).toUpperCase() + pestType.slice(1)}`,
          description: `Patrón recurrente de ${pestType} basado en análisis de 3 años de datos históricos`,
          confidence: 0.85 + Math.random() * 0.1,
          frequency: seasonalPattern.frequency
        },
        triggers: {
          weather: [weatherPattern],
          seasonal: seasonalPattern.seasonal,
          environmental: seasonalPattern.environmental
        },
        predictions: {
          nextOccurrence: this.predictNextOccurrence(pestType, seasonalPattern),
          probability: seasonalPattern.probability,
          severity: seasonalPattern.severity
        }
      };
      
      this.patterns.push(pattern);
    });
  }

  private identifySeasonalPattern(data: HistoricalDataPoint[]) {
    // Agrupar por mes
    const monthlyData = new Array(12).fill(0).map(() => ({ count: 0, totalIncidence: 0 }));
    
    data.forEach(point => {
      const month = point.date.getMonth();
      monthlyData[month].count++;
      monthlyData[month].totalIncidence += point.incidenceLevel;
    });
    
    // Encontrar meses pico
    const peakMonths = monthlyData
      .map((data, month) => ({ month, avgIncidence: data.count > 0 ? data.totalIncidence / data.count : 0 }))
      .filter(m => m.avgIncidence > 0.4)
      .map(m => m.month);
    
    // Calcular rangos ambientales
    const temperatures = data.map(d => d.weatherConditions.temperature);
    const humidities = data.map(d => d.weatherConditions.humidity);
    const rainfalls = data.map(d => d.weatherConditions.rainfall);
    
    return {
      frequency: peakMonths.length > 0 ? 12 / peakMonths.length : 1,
      seasonal: {
        months: peakMonths,
        probability: 0.7 + Math.random() * 0.2
      },
      environmental: {
        temperature_range: [Math.min(...temperatures), Math.max(...temperatures)] as [number, number],
        humidity_range: [Math.min(...humidities), Math.max(...humidities)] as [number, number],
        rainfall_range: [Math.min(...rainfalls), Math.max(...rainfalls)] as [number, number]
      },
      probability: 0.6 + Math.random() * 0.3,
      severity: peakMonths.length > 3 ? 'high' as RiskLevel : 'medium' as RiskLevel
    };
  }

  private identifyWeatherPattern(data: HistoricalDataPoint[]): WeatherPattern {
    // Calcular promedios de condiciones cuando hay alta incidencia
    const highIncidenceData = data.filter(d => d.incidenceLevel > 0.6);
    
    if (highIncidenceData.length === 0) {
      return {
        id: 'default_pattern',
        name: 'Patrón por defecto',
        description: 'Sin datos suficientes',
        conditions: {
          temperature: { min: 20, max: 30 },
          humidity: { min: 60, max: 90 },
          rainfall: { min: 0, max: 20 }
        },
        confidence: 0.5,
        frequency: 'occasional'
      };
    }
    
    const avgTemp = highIncidenceData.reduce((sum, d) => sum + d.weatherConditions.temperature, 0) / highIncidenceData.length;
    const avgHumidity = highIncidenceData.reduce((sum, d) => sum + d.weatherConditions.humidity, 0) / highIncidenceData.length;
    const avgRainfall = highIncidenceData.reduce((sum, d) => sum + d.weatherConditions.rainfall, 0) / highIncidenceData.length;
    
    return {
      id: `weather_pattern_${Date.now()}`,
      name: 'Patrón Meteorológico Favorable',
      description: 'Condiciones meteorológicas que favorecen el desarrollo de la plaga',
      conditions: {
        temperature: { min: avgTemp - 3, max: avgTemp + 3 },
        humidity: { min: avgHumidity - 10, max: avgHumidity + 10 },
        rainfall: { min: Math.max(0, avgRainfall - 5), max: avgRainfall + 5 }
      },
      confidence: 0.75 + Math.random() * 0.2,
      frequency: highIncidenceData.length > 50 ? 'frequent' : 'occasional'
    };
  }

  private predictNextOccurrence(pestType: PestType, pattern: any): Date {
    const now = new Date();
    const currentMonth = now.getMonth();
    
    // Encontrar el próximo mes pico
    const nextPeakMonth = pattern.seasonal.months.find((month: number) => month > currentMonth) || 
                         pattern.seasonal.months[0];
    
    const nextOccurrence = new Date(now);
    if (nextPeakMonth <= currentMonth) {
      nextOccurrence.setFullYear(nextOccurrence.getFullYear() + 1);
    }
    nextOccurrence.setMonth(nextPeakMonth);
    nextOccurrence.setDate(15); // Medio del mes
    
    return nextOccurrence;
  }

  // Análisis de tendencias estacionales
  private calculateSeasonalTrends(): void {
    const pestTypes: PestType[] = ['roya', 'broca', 'minador', 'cochinilla'];
    
    pestTypes.forEach(pestType => {
      for (let month = 0; month < 12; month++) {
        const monthData = this.historicalData.filter(d => 
          d.pestType === pestType && d.date.getMonth() === month
        );
        
        if (monthData.length > 0) {
          const avgIncidence = monthData.reduce((sum, d) => sum + d.incidenceLevel, 0) / monthData.length;
          const peakProbability = monthData.filter(d => d.incidenceLevel > 0.7).length / monthData.length;
          
          const trend: SeasonalTrend = {
            pestType,
            month,
            averageIncidence: avgIncidence,
            peakProbability,
            historicalSeverity: avgIncidence > 0.7 ? 'high' : avgIncidence > 0.4 ? 'medium' : 'low',
            recommendedActions: this.getRecommendedActions(pestType, avgIncidence)
          };
          
          this.seasonalTrends.push(trend);
        }
      }
    });
  }

  private getRecommendedActions(pestType: PestType, incidenceLevel: number): string[] {
    const baseActions = {
      roya: ['Monitoreo de hojas', 'Control de humedad', 'Aplicación preventiva de fungicidas'],
      broca: ['Inspección de frutos', 'Recolección sanitaria', 'Trampas con feromonas'],
      minador: ['Revisión de hojas nuevas', 'Control biológico', 'Podas sanitarias'],
      cochinilla: ['Inspección de tallos', 'Control de hormigas', 'Aplicación de aceites']
    };
    
    const actions = baseActions[pestType] || ['Monitoreo general'];
    
    if (incidenceLevel > 0.6) {
      actions.push('Tratamiento químico', 'Intensificar monitoreo');
    } else if (incidenceLevel > 0.3) {
      actions.push('Medidas preventivas', 'Monitoreo semanal');
    }
    
    return actions;
  }

  // Análisis de correlaciones
  private performCorrelationAnalysis(): void {
    const pestTypes: PestType[] = ['roya', 'broca', 'minador', 'cochinilla'];
    
    pestTypes.forEach(pestType => {
      const pestData = this.historicalData.filter(d => d.pestType === pestType);
      
      if (pestData.length > 10) {
        const correlation: CorrelationAnalysis = {
          pestType,
          weatherFactors: this.calculateWeatherCorrelations(pestData),
          seasonalFactors: this.calculateSeasonalCorrelations(pestData),
          treatmentEffectiveness: this.calculateTreatmentEffectiveness(pestData)
        };
        
        this.correlations.push(correlation);
      }
    });
  }

  private calculateWeatherCorrelations(data: HistoricalDataPoint[]) {
    // Calcular correlaciones de Pearson simplificadas
    const incidences = data.map(d => d.incidenceLevel);
    const temperatures = data.map(d => d.weatherConditions.temperature);
    const humidities = data.map(d => d.weatherConditions.humidity);
    const rainfalls = data.map(d => d.weatherConditions.rainfall);
    const windSpeeds = data.map(d => d.weatherConditions.windSpeed);
    
    return {
      temperature: this.calculateCorrelation(incidences, temperatures),
      humidity: this.calculateCorrelation(incidences, humidities),
      rainfall: this.calculateCorrelation(incidences, rainfalls),
      windSpeed: this.calculateCorrelation(incidences, windSpeeds)
    };
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private calculateSeasonalCorrelations(data: HistoricalDataPoint[]) {
    const monthlyCorrelations = [];
    
    for (let month = 0; month < 12; month++) {
      const monthData = data.filter(d => d.date.getMonth() === month);
      const correlation = monthData.length > 0 ? 
        monthData.reduce((sum, d) => sum + d.incidenceLevel, 0) / monthData.length : 0;
      
      monthlyCorrelations.push({ month, correlation });
    }
    
    return monthlyCorrelations;
  }

  private calculateTreatmentEffectiveness(data: HistoricalDataPoint[]) {
    const treatmentData = data.filter(d => d.treatmentApplied && d.effectiveness !== undefined);
    const treatments = [...new Set(treatmentData.map(d => d.treatmentApplied!))];
    
    return treatments.map(treatment => {
      const treatmentPoints = treatmentData.filter(d => d.treatmentApplied === treatment);
      const successRate = treatmentPoints.reduce((sum, d) => sum + d.effectiveness!, 0) / treatmentPoints.length;
      
      return {
        treatment,
        successRate,
        conditions: ['Condiciones favorables', 'Aplicación temprana'] // Mock conditions
      };
    });
  }

  // API pública
  async getHistoricalTrends(pestType: PestType, timeRange: '1y' | '2y' | '3y' = '1y'): Promise<ChartDataPoint[]> {
    const years = timeRange === '1y' ? 1 : timeRange === '2y' ? 2 : 3;
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - years);
    
    const filteredData = this.historicalData.filter(d => 
      d.pestType === pestType && d.date >= startDate
    );
    
    // Agrupar por mes
    const monthlyData = new Map<string, { total: number; count: number }>();
    
    filteredData.forEach(point => {
      const monthKey = `${point.date.getFullYear()}-${point.date.getMonth()}`;
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, { total: 0, count: 0 });
      }
      const data = monthlyData.get(monthKey)!;
      data.total += point.incidenceLevel;
      data.count++;
    });
    
    return Array.from(monthlyData.entries()).map(([monthKey, data]) => {
      const [year, month] = monthKey.split('-').map(Number);
      return {
        date: new Date(year, month, 1),
        value: data.count > 0 ? data.total / data.count : 0,
        label: new Date(year, month, 1).toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
      };
    }).sort((a, b) => a.date.getTime() - b.date.getTime());
  }

  async getSeasonalAnalysis(pestType?: PestType): Promise<SeasonalTrend[]> {
    if (pestType) {
      return this.seasonalTrends.filter(t => t.pestType === pestType);
    }
    return this.seasonalTrends;
  }

  async getPatternRecognition(pestType?: PestType): Promise<PatternRecognitionResult[]> {
    if (pestType) {
      return this.patterns.filter(p => p.pattern.id.includes(pestType));
    }
    return this.patterns;
  }

  async getCorrelationAnalysis(pestType?: PestType): Promise<CorrelationAnalysis[]> {
    if (pestType) {
      return this.correlations.filter(c => c.pestType === pestType);
    }
    return this.correlations;
  }

  async validatePredictions(predictions: any[], actualData: HistoricalPestData[]): Promise<PredictionValidation[]> {
    // Mock validation - en producción compararía predicciones con datos reales
    return predictions.map((prediction, index) => ({
      predictionId: `pred_${index}`,
      actualOutcome: Math.random() > 0.3, // 70% de acierto
      accuracy: 0.7 + Math.random() * 0.25,
      timeframe: {
        predicted: prediction.timeframe?.start || new Date(),
        actual: new Date()
      },
      severityMatch: Math.random() > 0.4,
      notes: 'Validación automática basada en datos históricos'
    }));
  }

  async getModelPerformance(): Promise<ModelPerformanceMetrics> {
    // Calcular métricas de rendimiento basadas en validaciones históricas
    const totalPredictions = this.patterns.length * 10; // Mock
    const correctPredictions = Math.floor(totalPredictions * 0.75);
    
    return {
      accuracy: correctPredictions / totalPredictions,
      precision: 0.78 + Math.random() * 0.15,
      recall: 0.72 + Math.random() * 0.18,
      f1Score: 0.75 + Math.random() * 0.15,
      lastUpdated: new Date(),
      sampleSize: totalPredictions,
      confidenceInterval: [0.68, 0.82]
    };
  }

  async generateInsights(pestType?: PestType): Promise<string[]> {
    const insights: string[] = [];
    
    const relevantPatterns = pestType ? 
      this.patterns.filter(p => p.pattern.id.includes(pestType)) : 
      this.patterns;
    
    const relevantCorrelations = pestType ? 
      this.correlations.filter(c => c.pestType === pestType) : 
      this.correlations;
    
    // Generar insights basados en patrones
    relevantPatterns.forEach(pattern => {
      if (pattern.pattern.confidence > 0.8) {
        insights.push(`Patrón altamente confiable detectado para ${pattern.pattern.name} con ${(pattern.pattern.confidence * 100).toFixed(1)}% de confianza`);
      }
      
      if (pattern.predictions.probability > 0.7) {
        const daysToNext = Math.ceil((pattern.predictions.nextOccurrence.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        insights.push(`Alta probabilidad de brote en ${daysToNext} días basado en patrones históricos`);
      }
    });
    
    // Generar insights basados en correlaciones
    relevantCorrelations.forEach(correlation => {
      Object.entries(correlation.weatherFactors).forEach(([factor, value]) => {
        if (Math.abs(value) > 0.6) {
          const direction = value > 0 ? 'positiva' : 'negativa';
          insights.push(`Correlación ${direction} fuerte entre ${factor} y incidencia de ${correlation.pestType} (${(value * 100).toFixed(1)}%)`);
        }
      });
    });
    
    // Insights sobre tratamientos
    relevantCorrelations.forEach(correlation => {
      const bestTreatment = correlation.treatmentEffectiveness
        .sort((a, b) => b.successRate - a.successRate)[0];
      
      if (bestTreatment && bestTreatment.successRate > 0.8) {
        insights.push(`${bestTreatment.treatment} muestra la mayor efectividad para ${correlation.pestType} con ${(bestTreatment.successRate * 100).toFixed(1)}% de éxito`);
      }
    });
    
    return insights.slice(0, 10); // Limitar a 10 insights más relevantes
  }
}

// Instancia singleton
export const historicalAnalysisService = new HistoricalAnalysisService();
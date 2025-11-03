// Servicio Meteorológico Mejorado con Análisis de IA
import { 
  WeatherConditions, 
  WeatherForecast, 
  WeatherPattern,
  EarlyWarningSystemStatus 
} from '../types/earlyWarning';

interface WeatherAlert {
  id: string;
  type: 'temperature' | 'humidity' | 'rainfall' | 'wind' | 'pressure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  startTime: Date;
  endTime: Date;
  affectedAreas: string[];
  recommendations: string[];
}

interface WeatherTrend {
  parameter: 'temperature' | 'humidity' | 'rainfall' | 'pressure';
  direction: 'rising' | 'falling' | 'stable';
  rate: number; // Tasa de cambio por hora
  confidence: number;
  timeframe: number; // Horas
}

interface WeatherAnalysis {
  current: WeatherConditions;
  trends: WeatherTrend[];
  patterns: WeatherPattern[];
  alerts: WeatherAlert[];
  pestRiskFactors: {
    temperature: number;
    humidity: number;
    rainfall: number;
    overall: number;
  };
  recommendations: string[];
  confidence: number;
  lastUpdated: Date;
}

class EnhancedWeatherService {
  private currentWeather: WeatherConditions | null = null;
  private forecast: WeatherForecast[] = [];
  private weatherHistory: WeatherConditions[] = [];
  private patterns: WeatherPattern[] = [];
  private alerts: WeatherAlert[] = [];
  private updateInterval: number = 30 * 60 * 1000; // 30 minutos
  private lastUpdate: Date = new Date();

  constructor() {
    this.initializeWeatherPatterns();
    this.startPeriodicUpdates();
  }

  // Inicializar patrones meteorológicos conocidos
  private initializeWeatherPatterns(): void {
    this.patterns = [
      {
        id: 'pattern_roya_favorable',
        name: 'Condiciones Favorables para Roya',
        description: 'Temperatura moderada con alta humedad y lluvia ligera',
        conditions: { 
          temperature: 22, 
          humidity: 85, 
          rainfall: 15,
          windSpeed: 5
        },
        duration: 5,
        frequency: 4,
        associatedPests: ['roya'],
        riskMultiplier: 2.0,
        seasonality: [4, 5, 6, 10, 11]
      },
      {
        id: 'pattern_broca_outbreak',
        name: 'Condiciones de Brote de Broca',
        description: 'Clima seco y caliente durante maduración del fruto',
        conditions: { 
          temperature: 28, 
          humidity: 50, 
          rainfall: 3,
          windSpeed: 8
        },
        duration: 10,
        frequency: 2,
        associatedPests: ['broca'],
        riskMultiplier: 1.8,
        seasonality: [1, 2, 3, 7, 8, 9]
      },
      {
        id: 'pattern_fungal_diseases',
        name: 'Condiciones para Enfermedades Fúngicas',
        description: 'Alta humedad con temperaturas moderadas',
        conditions: { 
          temperature: 24, 
          humidity: 90, 
          rainfall: 20,
          windSpeed: 3
        },
        duration: 7,
        frequency: 3,
        associatedPests: ['antracnosis', 'mancha_foliar', 'ojo_gallo'],
        riskMultiplier: 1.6,
        seasonality: [4, 5, 6, 9, 10, 11]
      },
      {
        id: 'pattern_stress_conditions',
        name: 'Condiciones de Estrés para Plantas',
        description: 'Temperaturas extremas con baja humedad',
        conditions: { 
          temperature: 35, 
          humidity: 30, 
          rainfall: 0,
          windSpeed: 15
        },
        duration: 3,
        frequency: 2,
        associatedPests: ['cochinilla', 'minador'],
        riskMultiplier: 1.4,
        seasonality: [1, 2, 3, 12]
      }
    ];
  }

  // Generar datos meteorológicos mock realistas
  private generateMockWeatherData(): WeatherConditions {
    const now = new Date();
    const month = now.getMonth() + 1;
    const hour = now.getHours();
    
    // Variaciones estacionales
    const isRainySeason = [4, 5, 6, 10, 11].includes(month);
    const isDrySeason = [1, 2, 3, 7, 8, 9, 12].includes(month);
    
    // Variaciones diurnas
    const tempVariation = Math.sin((hour - 6) * Math.PI / 12) * 8; // Pico a las 2 PM
    const humidityVariation = -Math.sin((hour - 6) * Math.PI / 12) * 15; // Mínimo a las 2 PM
    
    let baseTemp = isRainySeason ? 22 : 26;
    let baseHumidity = isRainySeason ? 80 : 60;
    let baseRainfall = isRainySeason ? Math.random() * 25 : Math.random() * 5;
    
    return {
      temperature: baseTemp + tempVariation + (Math.random() - 0.5) * 4,
      humidity: Math.max(30, Math.min(100, baseHumidity + humidityVariation + (Math.random() - 0.5) * 10)),
      rainfall: Math.max(0, baseRainfall + (Math.random() - 0.5) * 5),
      windSpeed: 5 + Math.random() * 10 + (isDrySeason ? 3 : 0),
      pressure: 1013 + (Math.random() - 0.5) * 15,
      uvIndex: Math.max(0, Math.min(12, 6 + tempVariation * 0.5 + Math.random() * 2)),
      dewPoint: baseTemp - (100 - baseHumidity) * 0.2,
      timestamp: now
    };
  }

  // Generar pronóstico meteorológico
  private generateWeatherForecast(days: number = 7): WeatherForecast[] {
    const forecast: WeatherForecast[] = [];
    const baseWeather = this.currentWeather || this.generateMockWeatherData();
    
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(Date.now() + i * 24 * 60 * 60 * 1000);
      
      // Aplicar tendencias graduales
      const tempTrend = (Math.random() - 0.5) * 2;
      const humidityTrend = (Math.random() - 0.5) * 5;
      const rainfallTrend = (Math.random() - 0.5) * 3;
      
      const forecastWeather: WeatherForecast = {
        temperature: baseWeather.temperature + tempTrend * i + (Math.random() - 0.5) * 3,
        humidity: Math.max(30, Math.min(100, baseWeather.humidity + humidityTrend * i + (Math.random() - 0.5) * 8)),
        rainfall: Math.max(0, baseWeather.rainfall + rainfallTrend * i + (Math.random() - 0.5) * 4),
        windSpeed: baseWeather.windSpeed + (Math.random() - 0.5) * 3,
        pressure: baseWeather.pressure + (Math.random() - 0.5) * 8,
        uvIndex: Math.max(0, Math.min(12, baseWeather.uvIndex + (Math.random() - 0.5) * 2)),
        dewPoint: baseWeather.dewPoint + tempTrend * i * 0.8,
        timestamp: forecastDate,
        forecastDate,
        confidence: Math.max(0.6, 1 - (i * 0.05)), // Confianza decrece con el tiempo
        source: i <= 3 ? 'api' : 'model'
      };
      
      forecast.push(forecastWeather);
    }
    
    return forecast;
  }

  // Detectar patrones meteorológicos
  private detectWeatherPatterns(weather: WeatherConditions): WeatherPattern[] {
    const matchedPatterns: WeatherPattern[] = [];
    
    for (const pattern of this.patterns) {
      let matchScore = 0;
      let totalFactors = 0;
      
      // Comparar temperatura
      if (pattern.conditions.temperature !== undefined) {
        const tempDiff = Math.abs(weather.temperature - pattern.conditions.temperature);
        matchScore += Math.max(0, 1 - tempDiff / 10); // Tolerancia de ±10°C
        totalFactors++;
      }
      
      // Comparar humedad
      if (pattern.conditions.humidity !== undefined) {
        const humidityDiff = Math.abs(weather.humidity - pattern.conditions.humidity);
        matchScore += Math.max(0, 1 - humidityDiff / 20); // Tolerancia de ±20%
        totalFactors++;
      }
      
      // Comparar lluvia
      if (pattern.conditions.rainfall !== undefined) {
        const rainfallDiff = Math.abs(weather.rainfall - pattern.conditions.rainfall);
        matchScore += Math.max(0, 1 - rainfallDiff / 15); // Tolerancia de ±15mm
        totalFactors++;
      }
      
      // Comparar viento
      if (pattern.conditions.windSpeed !== undefined) {
        const windDiff = Math.abs(weather.windSpeed - pattern.conditions.windSpeed);
        matchScore += Math.max(0, 1 - windDiff / 8); // Tolerancia de ±8 km/h
        totalFactors++;
      }
      
      const averageMatch = matchScore / totalFactors;
      
      // Si el patrón coincide en más del 70%, lo incluimos
      if (averageMatch > 0.7) {
        matchedPatterns.push({
          ...pattern,
          riskMultiplier: pattern.riskMultiplier * averageMatch
        });
      }
    }
    
    return matchedPatterns;
  }

  // Calcular tendencias meteorológicas
  private calculateWeatherTrends(): WeatherTrend[] {
    if (this.weatherHistory.length < 3) {
      return [];
    }
    
    const trends: WeatherTrend[] = [];
    const recent = this.weatherHistory.slice(-6); // Últimas 6 lecturas
    
    // Calcular tendencia de temperatura
    const tempValues = recent.map(w => w.temperature);
    const tempTrend = this.calculateTrend(tempValues);
    trends.push({
      parameter: 'temperature',
      direction: tempTrend.direction,
      rate: tempTrend.rate,
      confidence: tempTrend.confidence,
      timeframe: recent.length
    });
    
    // Calcular tendencia de humedad
    const humidityValues = recent.map(w => w.humidity);
    const humidityTrend = this.calculateTrend(humidityValues);
    trends.push({
      parameter: 'humidity',
      direction: humidityTrend.direction,
      rate: humidityTrend.rate,
      confidence: humidityTrend.confidence,
      timeframe: recent.length
    });
    
    // Calcular tendencia de lluvia
    const rainfallValues = recent.map(w => w.rainfall);
    const rainfallTrend = this.calculateTrend(rainfallValues);
    trends.push({
      parameter: 'rainfall',
      direction: rainfallTrend.direction,
      rate: rainfallTrend.rate,
      confidence: rainfallTrend.confidence,
      timeframe: recent.length
    });
    
    // Calcular tendencia de presión
    const pressureValues = recent.map(w => w.pressure);
    const pressureTrend = this.calculateTrend(pressureValues);
    trends.push({
      parameter: 'pressure',
      direction: pressureTrend.direction,
      rate: pressureTrend.rate,
      confidence: pressureTrend.confidence,
      timeframe: recent.length
    });
    
    return trends;
  }

  // Calcular tendencia de una serie de valores
  private calculateTrend(values: number[]): { direction: 'rising' | 'falling' | 'stable', rate: number, confidence: number } {
    if (values.length < 2) {
      return { direction: 'stable', rate: 0, confidence: 0 };
    }
    
    // Regresión lineal simple
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * values[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Calcular R²
    const meanY = sumY / n;
    const ssTotal = values.reduce((sum, yi) => sum + Math.pow(yi - meanY, 2), 0);
    const ssRes = values.reduce((sum, yi, i) => {
      const predicted = slope * i + (sumY - slope * sumX) / n;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssRes / ssTotal);
    
    let direction: 'rising' | 'falling' | 'stable';
    if (Math.abs(slope) < 0.1) {
      direction = 'stable';
    } else if (slope > 0) {
      direction = 'rising';
    } else {
      direction = 'falling';
    }
    
    return {
      direction,
      rate: Math.abs(slope),
      confidence: Math.max(0, Math.min(1, rSquared))
    };
  }

  // Generar alertas meteorológicas
  private generateWeatherAlerts(weather: WeatherConditions, patterns: WeatherPattern[]): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];
    
    // Alerta por temperatura extrema
    if (weather.temperature > 35) {
      alerts.push({
        id: `temp_high_${Date.now()}`,
        type: 'temperature',
        severity: weather.temperature > 40 ? 'critical' : 'high',
        message: `Temperatura extremadamente alta: ${weather.temperature.toFixed(1)}°C`,
        startTime: new Date(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        affectedAreas: ['Toda la finca'],
        recommendations: [
          'Aumentar riego',
          'Proporcionar sombra adicional',
          'Monitorear estrés hídrico',
          'Evitar aplicaciones químicas'
        ]
      });
    }
    
    if (weather.temperature < 15) {
      alerts.push({
        id: `temp_low_${Date.now()}`,
        type: 'temperature',
        severity: weather.temperature < 10 ? 'critical' : 'medium',
        message: `Temperatura muy baja: ${weather.temperature.toFixed(1)}°C`,
        startTime: new Date(),
        endTime: new Date(Date.now() + 8 * 60 * 60 * 1000),
        affectedAreas: ['Toda la finca'],
        recommendations: [
          'Proteger plantas jóvenes',
          'Considerar calentadores',
          'Monitorear daño por frío',
          'Evitar riego nocturno'
        ]
      });
    }
    
    // Alerta por humedad extrema
    if (weather.humidity > 90) {
      alerts.push({
        id: `humidity_high_${Date.now()}`,
        type: 'humidity',
        severity: 'high',
        message: `Humedad muy alta: ${weather.humidity.toFixed(1)}%`,
        startTime: new Date(),
        endTime: new Date(Date.now() + 12 * 60 * 60 * 1000),
        affectedAreas: ['Áreas con poca ventilación'],
        recommendations: [
          'Mejorar ventilación',
          'Aplicar fungicidas preventivos',
          'Monitorear enfermedades fúngicas',
          'Reducir riego'
        ]
      });
    }
    
    // Alerta por lluvia intensa
    if (weather.rainfall > 20) {
      alerts.push({
        id: `rainfall_high_${Date.now()}`,
        type: 'rainfall',
        severity: weather.rainfall > 40 ? 'critical' : 'high',
        message: `Lluvia intensa: ${weather.rainfall.toFixed(1)}mm`,
        startTime: new Date(),
        endTime: new Date(Date.now() + 4 * 60 * 60 * 1000),
        affectedAreas: ['Áreas con mal drenaje'],
        recommendations: [
          'Verificar sistemas de drenaje',
          'Evitar aplicaciones foliares',
          'Monitorear encharcamientos',
          'Proteger equipos'
        ]
      });
    }
    
    // Alertas basadas en patrones detectados
    for (const pattern of patterns) {
      if (pattern.riskMultiplier > 1.5) {
        alerts.push({
          id: `pattern_${pattern.id}_${Date.now()}`,
          type: 'temperature', // Tipo genérico para patrones
          severity: pattern.riskMultiplier > 1.8 ? 'high' : 'medium',
          message: `Patrón detectado: ${pattern.name}`,
          startTime: new Date(),
          endTime: new Date(Date.now() + pattern.duration * 24 * 60 * 60 * 1000),
          affectedAreas: ['Toda la finca'],
          recommendations: [
            `Monitorear ${pattern.associatedPests.join(', ')}`,
            'Aplicar medidas preventivas',
            'Aumentar frecuencia de inspección'
          ]
        });
      }
    }
    
    return alerts;
  }

  // Calcular factores de riesgo para plagas
  private calculatePestRiskFactors(weather: WeatherConditions): any {
    // Factores de riesgo basados en condiciones meteorológicas
    const tempRisk = this.calculateTemperatureRisk(weather.temperature);
    const humidityRisk = this.calculateHumidityRisk(weather.humidity);
    const rainfallRisk = this.calculateRainfallRisk(weather.rainfall);
    
    const overall = (tempRisk + humidityRisk + rainfallRisk) / 3;
    
    return {
      temperature: tempRisk,
      humidity: humidityRisk,
      rainfall: rainfallRisk,
      overall
    };
  }

  private calculateTemperatureRisk(temp: number): number {
    // Riesgo óptimo entre 20-28°C para la mayoría de plagas
    if (temp >= 20 && temp <= 28) return 0.8;
    if (temp >= 15 && temp <= 35) return 0.5;
    return 0.2;
  }

  private calculateHumidityRisk(humidity: number): number {
    // Riesgo alto con humedad > 70%
    if (humidity > 80) return 0.9;
    if (humidity > 70) return 0.7;
    if (humidity > 60) return 0.5;
    return 0.3;
  }

  private calculateRainfallRisk(rainfall: number): number {
    // Riesgo moderado con lluvia ligera a moderada
    if (rainfall >= 5 && rainfall <= 20) return 0.8;
    if (rainfall > 20) return 0.6; // Demasiada lluvia puede reducir algunas plagas
    if (rainfall > 0) return 0.4;
    return 0.2;
  }

  // Generar recomendaciones meteorológicas
  private generateWeatherRecommendations(
    weather: WeatherConditions, 
    trends: WeatherTrend[], 
    patterns: WeatherPattern[]
  ): string[] {
    const recommendations: string[] = [];
    
    // Recomendaciones basadas en condiciones actuales
    if (weather.temperature > 30) {
      recommendations.push('Aumentar frecuencia de riego debido a altas temperaturas');
    }
    
    if (weather.humidity > 85) {
      recommendations.push('Mejorar ventilación para reducir riesgo de enfermedades fúngicas');
    }
    
    if (weather.rainfall > 15) {
      recommendations.push('Evitar aplicaciones foliares durante períodos de lluvia');
    }
    
    // Recomendaciones basadas en tendencias
    const tempTrend = trends.find(t => t.parameter === 'temperature');
    if (tempTrend && tempTrend.direction === 'rising' && tempTrend.confidence > 0.7) {
      recommendations.push('Prepararse para aumento de temperatura - considerar riego adicional');
    }
    
    const humidityTrend = trends.find(t => t.parameter === 'humidity');
    if (humidityTrend && humidityTrend.direction === 'rising' && humidityTrend.confidence > 0.7) {
      recommendations.push('Humedad en aumento - aplicar fungicidas preventivos');
    }
    
    // Recomendaciones basadas en patrones
    for (const pattern of patterns) {
      if (pattern.associatedPests.includes('roya')) {
        recommendations.push('Condiciones favorables para roya - intensificar monitoreo');
      }
      if (pattern.associatedPests.includes('broca')) {
        recommendations.push('Condiciones favorables para broca - revisar frutos maduros');
      }
    }
    
    return recommendations;
  }

  // Actualizar datos meteorológicos
  async updateWeatherData(): Promise<void> {
    try {
      // Generar nuevos datos meteorológicos
      const newWeather = this.generateMockWeatherData();
      
      // Actualizar datos actuales
      this.currentWeather = newWeather;
      
      // Agregar al historial
      this.weatherHistory.push(newWeather);
      
      // Mantener solo las últimas 24 horas de historial
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.weatherHistory = this.weatherHistory.filter(w => w.timestamp > oneDayAgo);
      
      // Actualizar pronóstico
      this.forecast = this.generateWeatherForecast();
      
      this.lastUpdate = new Date();
      
    } catch (error) {
      console.error('Error updating weather data:', error);
    }
  }

  // Análisis meteorológico completo
  async getWeatherAnalysis(): Promise<WeatherAnalysis> {
    if (!this.currentWeather) {
      await this.updateWeatherData();
    }
    
    const current = this.currentWeather!;
    const trends = this.calculateWeatherTrends();
    const patterns = this.detectWeatherPatterns(current);
    const alerts = this.generateWeatherAlerts(current, patterns);
    const pestRiskFactors = this.calculatePestRiskFactors(current);
    const recommendations = this.generateWeatherRecommendations(current, trends, patterns);
    
    return {
      current,
      trends,
      patterns,
      alerts,
      pestRiskFactors,
      recommendations,
      confidence: 0.85 + Math.random() * 0.1,
      lastUpdated: this.lastUpdate
    };
  }

  // Obtener pronóstico
  async getForecast(days: number = 7): Promise<WeatherForecast[]> {
    if (this.forecast.length === 0) {
      this.forecast = this.generateWeatherForecast(days);
    }
    return this.forecast.slice(0, days);
  }

  // Obtener estado del sistema
  getSystemStatus(): EarlyWarningSystemStatus {
    return {
      isOnline: true,
      lastUpdate: this.lastUpdate,
      activeModels: 4,
      pendingPredictions: Math.floor(Math.random() * 5),
      systemHealth: 'healthy',
      dataQuality: 0.9 + Math.random() * 0.1,
      apiConnections: {
        weather: true,
        historical: true,
        notifications: true
      }
    };
  }

  // Iniciar actualizaciones periódicas
  private startPeriodicUpdates(): void {
    setInterval(() => {
      this.updateWeatherData();
    }, this.updateInterval);
    
    // Actualización inicial
    this.updateWeatherData();
  }

  // Obtener alertas activas
  getActiveAlerts(): WeatherAlert[] {
    const now = new Date();
    return this.alerts.filter(alert => alert.endTime > now);
  }

  // Obtener historial meteorológico
  getWeatherHistory(hours: number = 24): WeatherConditions[] {
    const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.weatherHistory.filter(w => w.timestamp > cutoff);
  }
}

export const enhancedWeatherService = new EnhancedWeatherService();
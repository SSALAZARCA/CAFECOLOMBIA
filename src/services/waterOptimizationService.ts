import {
  WaterOptimizationData,
  WaterRecommendation,
  IrrigationRecord,
  WeatherForecast,
  PlantGrowthStage,
  WaterOptimizationSettings
} from '../types/resourceOptimization';
import { enhancedWeatherService } from './enhancedWeatherService';
import { offlineDB } from '../utils/offlineDB';

class WaterOptimizationService {
  private settings: WaterOptimizationSettings = {
    conservationLevel: 'medium',
    irrigationMethod: 'drip',
    soilMoistureThresholds: {
      minimum: 30,
      optimal: 60,
      maximum: 80
    },
    weatherIntegration: true,
    costPriority: 70,
    yieldPriority: 80
  };

  // Algoritmo principal de optimización de agua
  public async optimizeWaterUsage(data: Partial<WaterOptimizationData>): Promise<WaterOptimizationData> {

    // Obtener datos reales de clima y suelo
    // Nota: enhancedWeatherService retorna tipos de 'earlyWarning', necesitamos mapear a 'resourceOptimization'
    const realData = await this.fetchRealWaterData();

    // Determinar humedad del suelo (Strict Reality)
    // Si no se proveyó en 'data', asumimos -1 (dato faltante) para activar recomendación de sensor
    const soilMoisture = (data.soilMoisture !== undefined && data.soilMoisture !== null) ? data.soilMoisture : -1;

    const optimizationData: WaterOptimizationData = {
      id: data.id || `water_opt_${Date.now()}`,
      timestamp: new Date(),
      soilMoisture: soilMoisture,
      // Mapeo explicito entre tipos de clima
      weatherForecast: realData.forecast.length > 0 ? realData.forecast.map((f: any) => ({
        date: f.forecastDate || f.timestamp || new Date(),
        temperature: {
          min: f.temperature, // Aproximación ya que el servicio solo devuelve avg en la interfaz publica
          max: f.temperature,
          avg: f.temperature
        },
        humidity: f.humidity,
        precipitation: f.rainfall || 0,
        windSpeed: f.windSpeed || 0,
        evapotranspiration: 0 // Dato no disponible en servicio simple
      })) : (data.weatherForecast || []),

      plantStage: data.plantStage || {
        stage: 'flowering',
        daysInStage: 45,
        waterRequirement: 5.0, // L/planta/día
        criticalPeriod: true
      },
      irrigationHistory: realData.history.length > 0 ? realData.history.map((h: any) => ({
        date: new Date(h.date || h.timestamp),
        amount: h.precipitation || 0, // Usamos lluvia como proxy de riego histórico si no hay dato
        duration: 0,
        method: 'manual',
        efficiency: 100,
        cost: 0
      })) : (data.irrigationHistory || []),
      recommendations: []
    };

    // Generar recomendaciones basadas en datos procesados
    optimizationData.recommendations = await this.generateWaterRecommendations(optimizationData);

    return optimizationData;
  }

  // Obtener datos reales
  private async fetchRealWaterData() {
    try {
      // A. Clima Real (Forecast)
      const forecast = await enhancedWeatherService.generateForecastFromAPI(7);

      // B. Historial Real (Gastos cat. 'Riego')
      const expenses = await offlineDB.expenses
        .where('category')
        .equals('Riego')
        .reverse()
        .limit(20)
        .toArray();

      const history: IrrigationRecord[] = expenses.map(exp => ({
        date: new Date(exp.date),
        amount: 0, // En gastos usualmente está el $$, no los Litros. Difícil de inferir sin input extra.
        duration: 0, // Desconocido en gastos
        method: 'drip', // Asumido o por defecto
        efficiency: 75, // Asumido promedio
        cost: exp.amount
      }));

      return { forecast, history };
    } catch (error) {
      console.error("Error fetching real water data:", error);
      return { forecast: [], history: [] };
    }
  }

  // Generar recomendaciones inteligentes de riego
  private async generateWaterRecommendations(data: WaterOptimizationData): Promise<WaterRecommendation[]> {
    const recommendations: WaterRecommendation[] = [];
    const currentDate = new Date();

    // CHEQUEO CRÍTICO: Si no hay dato de humedad, pedirlo.
    if (data.soilMoisture === -1) {
      recommendations.push({
        date: currentDate,
        amount: 0,
        timing: "Inmediato",
        method: "Manual",
        priority: 'critical',
        reasoning: "No se detectó medición de humedad del suelo. Por favor registre la humedad actual o conecte un sensor para recibir recomendaciones de riego precisas.",
        expectedSavings: 0,
        confidence: 100
      });
      // Aun así, podemos dar recomendaciones basadas puramente en clima (si va a llover mucho)
    }

    // Análisis de necesidades hídricas (Si hay humedad)
    let waterNeed = { immediate: 0, daily: 0, weekly: 0 };
    if (data.soilMoisture !== -1) {
      waterNeed = this.calculateWaterNeed(data.plantStage, data.soilMoisture);
    }

    // Análisis del pronóstico del tiempo
    const weatherAnalysis = this.analyzeWeatherForecast(data.weatherForecast);

    // Análisis de eficiencia histórica
    const efficiencyAnalysis = this.analyzeIrrigationEfficiency(data.irrigationHistory);

    // Recomendación inmediata (Solo si hay dato de humedad y es bajo)
    if (data.soilMoisture !== -1 && data.soilMoisture < this.settings.soilMoistureThresholds.minimum) {
      recommendations.push({
        date: currentDate,
        amount: waterNeed.immediate,
        timing: this.getOptimalIrrigationTime(weatherAnalysis),
        method: this.settings.irrigationMethod,
        priority: 'critical',
        reasoning: `Humedad del suelo crítica (${data.soilMoisture}%). Riego inmediato necesario para evitar estrés hídrico.`,
        expectedSavings: 0,
        confidence: 95
      });
    }

    // Recomendaciones basadas en Clima (Independientes de Humedad Actual a veces)
    // Si va a llover mucho mañana, sugerir suspender riegos programados
    const tomorrow = new Date(currentDate);
    tomorrow.setDate(currentDate.getDate() + 1);
    const tomorrowWeather = data.weatherForecast.find(w => w.date.toDateString() === tomorrow.toDateString());

    if (tomorrowWeather && tomorrowWeather.rainfall > 10) {
      recommendations.push({
        date: tomorrow,
        amount: 0,
        timing: "Todo el día",
        method: "N/A",
        priority: 'high',
        reasoning: `Pronóstico de lluvia fuerte (${tomorrowWeather.rainfall}mm). Suspender riego programado para ahorrar agua y costos.`,
        expectedSavings: 1000, // Valor estimado
        confidence: 90
      });
    }

    // Recomendaciones diarias (Solo si tenemos humedad inicial para proyectar o es solo informativo)
    // Si no tenemos humedad, saltamos la proyección detallada para no acumular error.
    if (data.soilMoisture !== -1) {
      for (let i = 1; i <= 3; i++) { // Reducido a 3 días para mayor precisión
        const futureDate = new Date(currentDate);
        futureDate.setDate(currentDate.getDate() + i);

        const dayWeather = data.weatherForecast.find(w =>
          w.date.toDateString() === futureDate.toDateString()
        );

        if (dayWeather && dayWeather.rainfall <= 5) { // Solo recomendar riego si no llueve
          const recommendation = this.generateDailyRecommendation(
            futureDate,
            dayWeather,
            data.plantStage,
            efficiencyAnalysis
          );
          if (recommendation) recommendations.push(recommendation);
        }
      }
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  // Calcular necesidades hídricas según etapa de crecimiento
  private calculateWaterNeed(plantStage: PlantGrowthStage, currentMoisture: number) {
    const baseRequirement = plantStage.waterRequirement;
    const moistureDeficit = Math.max(0, this.settings.soilMoistureThresholds.optimal - currentMoisture);

    return {
      immediate: Math.round((moistureDeficit / 100) * baseRequirement * 1.2),
      daily: Math.round(baseRequirement * this.getStageMultiplier(plantStage.stage)),
      weekly: Math.round(baseRequirement * this.getStageMultiplier(plantStage.stage) * 7)
    };
  }

  private getStageMultiplier(stage: string): number {
    const multipliers = {
      'seedling': 0.8,
      'vegetative': 1.2,
      'flowering': 1.5,
      'fruiting': 1.3,
      'harvest': 0.9
    };
    return multipliers[stage as keyof typeof multipliers] || 1.0;
  }

  // Analizar pronóstico del tiempo para optimización
  private analyzeWeatherForecast(forecast: WeatherForecast[]) {
    if (!forecast || forecast.length === 0) return {
      totalPrecipitation: 0, avgTemperature: 25, avgHumidity: 70,
      totalEvapotranspiration: 0, rainDays: 0, hotDays: 0
    };

    const next7Days = forecast.slice(0, 7);

    return {
      totalPrecipitation: next7Days.reduce((sum, day) => sum + day.rainfall, 0), // Note: rainfall in enhancedWeatherService
      avgTemperature: next7Days.reduce((sum, day) => sum + (day.temperature as any), 0) / next7Days.length, // Temperature might be number
      avgHumidity: next7Days.reduce((sum, day) => sum + day.humidity, 0) / next7Days.length,
      totalEvapotranspiration: 0, // OpenMeteo basic free doesn't give ET easy, assuming 0 or calc
      rainDays: next7Days.filter(day => day.rainfall > 5).length,
      hotDays: next7Days.filter(day => (day.temperature as any) > 30).length
    };
  }

  // Obtener hora óptima de riego
  private getOptimalIrrigationTime(weatherAnalysis: any): string {
    if (weatherAnalysis.avgTemperature > 28) {
      return "5:00 AM - 7:00 AM (evitar horas de calor)";
    } else if (weatherAnalysis.avgHumidity > 80) {
      return "8:00 AM - 10:00 AM (reducir riesgo de hongos)";
    } else {
      return "6:00 AM - 8:00 AM (condiciones óptimas)";
    }
  }

  // Analizar eficiencia histórica de riego
  private analyzeIrrigationEfficiency(history: IrrigationRecord[]) {
    if (history.length === 0) {
      return { avgEfficiency: 75, costPerLiter: 0.05, bestMethod: 'drip' };
    }

    // Con datos de gastos, eficiencia es difícil de saber, se asume estándar
    // Pero el costo sí es real
    const totalCost = history.reduce((sum, record) => sum + record.cost, 0);
    // Si amount es 0 (porque viene de gastos), no podemos calc costPerLiter real sin saber litros
    // Usamos placeholder o estimación de mercado
    const costPerLiter = 0.05;

    return {
      avgEfficiency: 75,
      costPerLiter,
      bestMethod: 'drip'
    };
  }

  // Generar recomendación diaria
  private generateDailyRecommendation(
    date: Date,
    weather: WeatherForecast,
    plantStage: PlantGrowthStage,
    efficiency: any
  ): WaterRecommendation | null {
    const baseNeed = plantStage.waterRequirement;
    const precipitationAdjustment = Math.max(0, baseNeed - weather.rainfall);
    const tempVal = typeof weather.temperature === 'number' ? weather.temperature : weather.temperature.avg;
    const temperatureAdjustment = tempVal > 25 ? 1.2 : 1.0;

    // Estimación básica ET
    const evapotranspirationAdjustment = 1;

    const adjustedNeed = precipitationAdjustment * temperatureAdjustment + evapotranspirationAdjustment;

    // No regar si lluvia significativa
    if (weather.rainfall > 10) {
      return null;
    }

    // Determinar prioridad
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (tempVal > 32 && weather.rainfall < 2) {
      priority = 'high';
    } else if (weather.rainfall > 5) {
      priority = 'low';
    }

    const expectedSavings = Math.round(adjustedNeed * 0.2); // Ahorro estandar optimizado

    return {
      date,
      amount: Math.round(adjustedNeed),
      timing: this.getOptimalIrrigationTime({
        avgTemperature: tempVal,
        avgHumidity: weather.humidity
      }),
      method: efficiency.bestMethod,
      priority,
      reasoning: `Riego calculado considerando precipitación de ${weather.rainfall}mm y temperatura de ${Math.round(tempVal as number)}°C.`,
      expectedSavings,
      confidence: 85
    };
  }

  // Fallback seguro para etapa de planta si no se provee
  private getDefaultPlantStage(): PlantGrowthStage {
    // Por defecto "vegetative" que es estándar, sin inventar días.
    return {
      stage: 'vegetative',
      daysInStage: 0,
      waterRequirement: 25, // Promedio L/m2
      criticalPeriod: false
    };
  }

  // Métodos de configuración
  updateSettings(newSettings: Partial<WaterOptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): WaterOptimizationSettings {
    return { ...this.settings };
  }

  // Calcular métricas de rendimiento (Real)
  async calculateWaterEfficiencyMetrics(history: IrrigationRecord[]): Promise<{
    totalUsage: number;
    averageEfficiency: number;
    costPerLiter: number;
    trendAnalysis: string;
  }> {
    if (history.length === 0) {
      return {
        totalUsage: 0,
        averageEfficiency: 0,
        costPerLiter: 0,
        trendAnalysis: 'Sin datos históricos'
      };
    }

    // Total Usage es $ si viene de gastos
    const totalCost = history.reduce((sum, record) => sum + record.cost, 0);

    return {
      totalUsage: 0, // Desconocido en litros
      averageEfficiency: 0, // Desconocido
      costPerLiter: 0,
      trendAnalysis: `Gasto total registrado: $${totalCost.toLocaleString()}`
    };
  }
}

export const waterOptimizationService = new WaterOptimizationService();
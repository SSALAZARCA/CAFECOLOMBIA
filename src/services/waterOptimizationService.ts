import { 
  WaterOptimizationData, 
  WaterRecommendation, 
  IrrigationRecord, 
  WeatherForecast,
  PlantGrowthStage,
  WaterOptimizationSettings
} from '../types/resourceOptimization';

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
  async optimizeWaterUsage(data: Partial<WaterOptimizationData>): Promise<WaterOptimizationData> {
    const currentDate = new Date();
    
    // Generar datos mock si no se proporcionan
    const optimizationData: WaterOptimizationData = {
      id: `water_opt_${Date.now()}`,
      timestamp: currentDate,
      soilMoisture: data.soilMoisture || this.generateMockSoilMoisture(),
      weatherForecast: data.weatherForecast || this.generateMockWeatherForecast(),
      plantStage: data.plantStage || this.getCurrentPlantStage(),
      irrigationHistory: data.irrigationHistory || this.generateMockIrrigationHistory(),
      recommendations: []
    };

    // Generar recomendaciones basadas en algoritmos de optimización
    optimizationData.recommendations = await this.generateWaterRecommendations(optimizationData);

    return optimizationData;
  }

  // Generar recomendaciones inteligentes de riego
  private async generateWaterRecommendations(data: WaterOptimizationData): Promise<WaterRecommendation[]> {
    const recommendations: WaterRecommendation[] = [];
    const currentDate = new Date();

    // Análisis de necesidades hídricas basado en etapa de crecimiento
    const waterNeed = this.calculateWaterNeed(data.plantStage, data.soilMoisture);
    
    // Análisis del pronóstico del tiempo
    const weatherAnalysis = this.analyzeWeatherForecast(data.weatherForecast);
    
    // Análisis de eficiencia histórica
    const efficiencyAnalysis = this.analyzeIrrigationEfficiency(data.irrigationHistory);

    // Recomendación inmediata (hoy)
    if (data.soilMoisture < this.settings.soilMoistureThresholds.minimum) {
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

    // Recomendaciones para los próximos 7 días
    for (let i = 1; i <= 7; i++) {
      const futureDate = new Date(currentDate);
      futureDate.setDate(currentDate.getDate() + i);
      
      const dayWeather = data.weatherForecast.find(w => 
        w.date.toDateString() === futureDate.toDateString()
      );

      if (dayWeather) {
        const recommendation = this.generateDailyRecommendation(
          futureDate, 
          dayWeather, 
          data.plantStage, 
          efficiencyAnalysis
        );
        
        if (recommendation) {
          recommendations.push(recommendation);
        }
      }
    }

    // Recomendaciones de optimización a largo plazo
    const longTermRecommendations = this.generateLongTermOptimizations(data);
    recommendations.push(...longTermRecommendations);

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
    const next7Days = forecast.slice(0, 7);
    
    return {
      totalPrecipitation: next7Days.reduce((sum, day) => sum + day.precipitation, 0),
      avgTemperature: next7Days.reduce((sum, day) => sum + day.temperature.avg, 0) / next7Days.length,
      avgHumidity: next7Days.reduce((sum, day) => sum + day.humidity, 0) / next7Days.length,
      totalEvapotranspiration: next7Days.reduce((sum, day) => sum + day.evapotranspiration, 0),
      rainDays: next7Days.filter(day => day.precipitation > 5).length,
      hotDays: next7Days.filter(day => day.temperature.max > 30).length
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

    const avgEfficiency = history.reduce((sum, record) => sum + record.efficiency, 0) / history.length;
    const totalCost = history.reduce((sum, record) => sum + record.cost, 0);
    const totalVolume = history.reduce((sum, record) => sum + record.amount, 0);
    const costPerLiter = totalVolume > 0 ? totalCost / totalVolume : 0.05;

    // Determinar mejor método basado en eficiencia
    const methodEfficiency = history.reduce((acc, record) => {
      if (!acc[record.method]) {
        acc[record.method] = { total: 0, count: 0 };
      }
      acc[record.method].total += record.efficiency;
      acc[record.method].count += 1;
      return acc;
    }, {} as Record<string, { total: number; count: number }>);

    const bestMethod = Object.entries(methodEfficiency)
      .map(([method, data]) => ({ method, avgEfficiency: data.total / data.count }))
      .sort((a, b) => b.avgEfficiency - a.avgEfficiency)[0]?.method || 'drip';

    return {
      avgEfficiency: Math.round(avgEfficiency),
      costPerLiter: Math.round(costPerLiter * 1000) / 1000,
      bestMethod
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
    const precipitationAdjustment = Math.max(0, baseNeed - weather.precipitation);
    const temperatureAdjustment = weather.temperature.avg > 25 ? 1.2 : 1.0;
    const evapotranspirationAdjustment = weather.evapotranspiration / 5; // Normalizar

    const adjustedNeed = precipitationAdjustment * temperatureAdjustment + evapotranspirationAdjustment;

    // No regar si lluvia significativa
    if (weather.precipitation > 10) {
      return null;
    }

    // Determinar prioridad
    let priority: 'low' | 'medium' | 'high' | 'critical' = 'medium';
    if (weather.temperature.max > 32 && weather.precipitation < 2) {
      priority = 'high';
    } else if (weather.precipitation > 5) {
      priority = 'low';
    }

    const expectedSavings = this.calculateExpectedSavings(adjustedNeed, efficiency);

    return {
      date,
      amount: Math.round(adjustedNeed),
      timing: this.getOptimalIrrigationTime({ 
        avgTemperature: weather.temperature.avg, 
        avgHumidity: weather.humidity 
      }),
      method: efficiency.bestMethod,
      priority,
      reasoning: this.generateRecommendationReasoning(weather, plantStage, adjustedNeed),
      expectedSavings,
      confidence: this.calculateConfidence(weather, plantStage)
    };
  }

  // Generar recomendaciones de optimización a largo plazo
  private generateLongTermOptimizations(data: WaterOptimizationData): WaterRecommendation[] {
    const recommendations: WaterRecommendation[] = [];
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);

    // Recomendación de mejora de sistema de riego
    if (data.irrigationHistory.some(record => record.efficiency < 70)) {
      recommendations.push({
        date: futureDate,
        amount: 0,
        timing: "Planificación a largo plazo",
        method: "Mejora de sistema",
        priority: 'medium',
        reasoning: "Considerar actualización del sistema de riego para mejorar eficiencia. Eficiencia actual por debajo del 70%.",
        expectedSavings: 500, // Ahorro estimado en litros/mes
        confidence: 80
      });
    }

    // Recomendación de mulching
    if (this.settings.conservationLevel === 'high' || this.settings.conservationLevel === 'maximum') {
      recommendations.push({
        date: futureDate,
        amount: 0,
        timing: "Implementación gradual",
        method: "Mulching orgánico",
        priority: 'medium',
        reasoning: "Implementar mulching para reducir evaporación y conservar humedad del suelo. Puede reducir necesidades de riego hasta 30%.",
        expectedSavings: 800,
        confidence: 85
      });
    }

    return recommendations;
  }

  // Calcular ahorro esperado
  private calculateExpectedSavings(recommendedAmount: number, efficiency: any): number {
    const standardAmount = recommendedAmount * 1.3; // Cantidad típica sin optimización
    const optimizedAmount = recommendedAmount * (efficiency.avgEfficiency / 100);
    return Math.max(0, Math.round(standardAmount - optimizedAmount));
  }

  // Generar explicación de la recomendación
  private generateRecommendationReasoning(
    weather: WeatherForecast, 
    plantStage: PlantGrowthStage, 
    amount: number
  ): string {
    const reasons = [];

    if (weather.temperature.max > 30) {
      reasons.push("temperatura alta aumenta evapotranspiración");
    }
    
    if (weather.precipitation < 2) {
      reasons.push("precipitación insuficiente");
    }
    
    if (plantStage.criticalPeriod) {
      reasons.push(`etapa crítica de ${plantStage.stage}`);
    }
    
    if (weather.humidity < 60) {
      reasons.push("baja humedad relativa");
    }

    const baseReason = `Riego de ${amount}L recomendado debido a: ${reasons.join(', ')}.`;
    
    return baseReason;
  }

  // Calcular nivel de confianza
  private calculateConfidence(weather: WeatherForecast, plantStage: PlantGrowthStage): number {
    let confidence = 80; // Base

    // Ajustar según disponibilidad de datos
    if (weather.precipitation !== undefined) confidence += 5;
    if (weather.evapotranspiration !== undefined) confidence += 5;
    if (plantStage.criticalPeriod !== undefined) confidence += 5;

    // Ajustar según condiciones extremas
    if (weather.temperature.max > 35 || weather.temperature.min < 10) confidence -= 10;
    if (weather.windSpeed > 20) confidence -= 5;

    return Math.max(60, Math.min(95, confidence));
  }

  // Métodos para generar datos mock
  private generateMockSoilMoisture(): number {
    return Math.round(Math.random() * 40 + 30); // 30-70%
  }

  private generateMockWeatherForecast(): WeatherForecast[] {
    const forecast: WeatherForecast[] = [];
    const baseDate = new Date();

    for (let i = 0; i < 14; i++) {
      const date = new Date(baseDate);
      date.setDate(baseDate.getDate() + i);

      forecast.push({
        date,
        temperature: {
          min: Math.round(Math.random() * 8 + 18), // 18-26°C
          max: Math.round(Math.random() * 10 + 25), // 25-35°C
          avg: Math.round(Math.random() * 8 + 22) // 22-30°C
        },
        humidity: Math.round(Math.random() * 30 + 60), // 60-90%
        precipitation: Math.random() > 0.7 ? Math.round(Math.random() * 15) : 0, // 0-15mm
        windSpeed: Math.round(Math.random() * 15 + 5), // 5-20 km/h
        evapotranspiration: Math.round(Math.random() * 3 + 3) // 3-6mm
      });
    }

    return forecast;
  }

  private getCurrentPlantStage(): PlantGrowthStage {
    const stages = ['seedling', 'vegetative', 'flowering', 'fruiting', 'harvest'];
    const randomStage = stages[Math.floor(Math.random() * stages.length)];
    
    return {
      stage: randomStage as any,
      daysInStage: Math.round(Math.random() * 60 + 10),
      waterRequirement: Math.round(Math.random() * 20 + 15), // 15-35 L/m²/día
      criticalPeriod: randomStage === 'flowering' || randomStage === 'fruiting'
    };
  }

  private generateMockIrrigationHistory(): IrrigationRecord[] {
    const history: IrrigationRecord[] = [];
    const methods = ['drip', 'sprinkler', 'flood', 'manual'];
    
    for (let i = 0; i < 10; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (i * 3));
      
      history.push({
        date,
        amount: Math.round(Math.random() * 500 + 200), // 200-700L
        duration: Math.round(Math.random() * 120 + 30), // 30-150 min
        method: methods[Math.floor(Math.random() * methods.length)] as any,
        efficiency: Math.round(Math.random() * 30 + 60), // 60-90%
        cost: Math.round((Math.random() * 20 + 10) * 100) / 100 // $10-30
      });
    }

    return history;
  }

  // Métodos de configuración
  updateSettings(newSettings: Partial<WaterOptimizationSettings>): void {
    this.settings = { ...this.settings, ...newSettings };
  }

  getSettings(): WaterOptimizationSettings {
    return { ...this.settings };
  }

  // Calcular métricas de rendimiento
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
        trendAnalysis: 'Sin datos suficientes'
      };
    }

    const totalUsage = history.reduce((sum, record) => sum + record.amount, 0);
    const averageEfficiency = history.reduce((sum, record) => sum + record.efficiency, 0) / history.length;
    const totalCost = history.reduce((sum, record) => sum + record.cost, 0);
    const costPerLiter = totalUsage > 0 ? totalCost / totalUsage : 0;

    // Análisis de tendencia simple
    const recentRecords = history.slice(0, 5);
    const olderRecords = history.slice(5, 10);
    
    const recentEfficiency = recentRecords.length > 0 
      ? recentRecords.reduce((sum, record) => sum + record.efficiency, 0) / recentRecords.length 
      : 0;
    const olderEfficiency = olderRecords.length > 0 
      ? olderRecords.reduce((sum, record) => sum + record.efficiency, 0) / olderRecords.length 
      : 0;

    let trendAnalysis = 'Estable';
    if (recentEfficiency > olderEfficiency + 5) {
      trendAnalysis = 'Mejorando';
    } else if (recentEfficiency < olderEfficiency - 5) {
      trendAnalysis = 'Empeorando';
    }

    return {
      totalUsage: Math.round(totalUsage),
      averageEfficiency: Math.round(averageEfficiency),
      costPerLiter: Math.round(costPerLiter * 1000) / 1000,
      trendAnalysis
    };
  }
}

export const waterOptimizationService = new WaterOptimizationService();
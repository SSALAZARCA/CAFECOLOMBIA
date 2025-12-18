// Servicio Meteorológico Real usando Open-Meteo API (Gratuito, sin API Key)
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
  rate: number;
  confidence: number;
  timeframe: number;
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

  // Ubicación por defecto (Zona Cafetera Colombia - Manizales aprox)
  private defaultLocation = { lat: 5.06, lon: -75.51 };
  private currentLocation = { ...this.defaultLocation };

  constructor() {
    this.initializeWeatherPatterns();
    this.startPeriodicUpdates();
  }

  private initializeWeatherPatterns(): void {
    // Patrones basados en literatura de caficultura (Cenicafé)
    this.patterns = [
      {
        id: 'pattern_roya_favorable',
        name: 'Condiciones Favorables para Roya',
        description: 'Temperatura moderada (20-25°C) con humedad alta y baja luminosidad',
        conditions: {
          temperature: 22,
          humidity: 80,
          rainfall: 5,
          windSpeed: 2
        },
        duration: 7,
        frequency: 4,
        associatedPests: ['roya', 'ojo_gallo'],
        riskMultiplier: 2.0,
        seasonality: [4, 5, 9, 10, 11]
      },
      {
        id: 'pattern_broca_vuelo',
        name: 'Vuelo de Broca',
        description: 'Días soleados y calurosos después de lluvias (emergencia de brocas)',
        conditions: {
          temperature: 26,
          humidity: 60,
          rainfall: 0,
          windSpeed: 5
        },
        duration: 3,
        frequency: 2,
        associatedPests: ['broca'],
        riskMultiplier: 2.5,
        seasonality: [1, 2, 8, 9]
      }
    ];
  }

  // Obtener ubicación actual
  private async getCurrentPosition(): Promise<{ lat: number, lon: number }> {
    // Retornamos la ubicación actual (que inicia como default y se actualiza via setLocation)
    // Eliminamos navigator.geolocation para evitar que pida permisos al usuario
    return this.currentLocation;
  }

  // Permitir establecer ubicación manualmente (desde Lotes)
  public setLocation(lat: number, lon: number) {
    // Solo actualizar si la ubicación cambió significativamente (evitar recargas innecesarias)
    const epsilon = 0.0001;
    if (Math.abs(this.currentLocation.lat - lat) > epsilon || Math.abs(this.currentLocation.lon - lon) > epsilon) {
      this.currentLocation = { lat, lon };
      this.updateWeatherData(); // Forzar actualización con nueva ubicación
    }
  }

  // Fetch real data from Open-Meteo
  // Modificado para usar siempre getCurrentPosition que ya no pide GPS
  private async fetchRealWeatherData(): Promise<WeatherConditions> {
    try {
      const location = await this.getCurrentPosition();

      // Open-Meteo API query
      // current_weather=true
      // hourly=relativehumidity_2m,rain,surface_pressure
      // timezone=auto
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&current_weather=true&hourly=relativehumidity_2m,rain,surface_pressure,dewpoint_2m,uv_index&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather API Error');

      const data = await response.json();
      const current = data.current_weather;

      // Open-Meteo entrega arrays horarios. Buscamos el índice de la hora actual.
      const nowISO = new Date().toISOString().slice(0, 13); // "2023-10-27T10"
      const hourIndex = data.hourly.time.findIndex((t: string) => t.startsWith(nowISO)) || 0;

      const humidity = data.hourly.relativehumidity_2m[hourIndex] || 70;
      const rain = data.hourly.rain[hourIndex] || 0;
      const pressure = data.hourly.surface_pressure[hourIndex] || 1013;
      const uvDetails = data.hourly.uv_index?.[hourIndex] || 0;
      const dewDetails = data.hourly.dewpoint_2m?.[hourIndex] || (current.temperature - 5);

      return {
        temperature: current.temperature, // °C
        humidity: humidity, // %
        rainfall: rain, // mm
        windSpeed: current.windspeed, // km/h
        pressure: pressure, // hPa
        uvIndex: uvDetails,
        dewPoint: dewDetails,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Failed to fetch real weather, falling back to basic estimation:', error);
      // Fallback básico solo si falla la API (ej. sin internet)
      return {
        temperature: 25,
        humidity: 70,
        rainfall: 0,
        windSpeed: 5,
        pressure: 1013,
        uvIndex: 5,
        dewPoint: 20,
        timestamp: new Date()
      };
    }
  }

  public async generateForecastFromAPI(days: number = 7): Promise<WeatherForecast[]> {
    try {
      const location = await this.getCurrentPosition(); // Uses currentLocation if set
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${location.lat}&longitude=${location.lon}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,rain_sum,windspeed_10m_max,uv_index_max&timezone=auto&forecast_days=${days}`;

      const response = await fetch(url);
      if (!response.ok) return [];

      const data = await response.json();
      const daily = data.daily;
      const forecast: WeatherForecast[] = [];

      for (let i = 0; i < daily.time.length; i++) {
        const maxTemp = daily.temperature_2m_max[i];
        const minTemp = daily.temperature_2m_min[i];
        const avgTemp = (maxTemp + minTemp) / 2;

        forecast.push({
          temperature: avgTemp,
          humidity: 75, // Diario no da humedad promedio fácilmente sin procesar hourly, estimado
          rainfall: daily.precipitation_sum[i] || 0,
          windSpeed: daily.windspeed_10m_max[i] || 5,
          pressure: 1013,
          uvIndex: daily.uv_index_max[i] || 5,
          dewPoint: minTemp,
          timestamp: new Date(daily.time[i]),
          forecastDate: new Date(daily.time[i]),
          confidence: 0.9 - (i * 0.05), // API real es más confiable a corto plazo
          source: 'api'
        });
      }
      return forecast;

    } catch (err) {
      console.error('Forecast API error', err);
      return [];
    }
  }

  // Detectar patrones meteorológicos (Lógica determinística)
  private detectWeatherPatterns(weather: WeatherConditions): WeatherPattern[] {
    const matchedPatterns: WeatherPattern[] = [];

    for (const pattern of this.patterns) {
      // Comparación Estricta con márgenes definidos (No probabilidad)
      const tempMatch = Math.abs(weather.temperature - pattern.conditions.temperature) < 4; // Margen +/- 4°C
      const humMatch = Math.abs(weather.humidity - pattern.conditions.humidity) < 15; // Margen +/- 15%
      const rainMatch = Math.abs(weather.rainfall - pattern.conditions.rainfall) < 5; // Margen +/- 5mm

      // Si cumple 2 de 3 condiciones principales
      let matches = 0;
      if (tempMatch) matches++;
      if (humMatch) matches++;
      if (rainMatch) matches++;

      if (matches >= 2) {
        matchedPatterns.push({
          ...pattern,
          // El risk multiplier se ajusta qué tan cerca está
          riskMultiplier: matches === 3 ? pattern.riskMultiplier : (pattern.riskMultiplier * 0.8)
        });
      }
    }

    return matchedPatterns;
  }

  // Generar alertas meteorológicas
  private generateWeatherAlerts(weather: WeatherConditions, patterns: WeatherPattern[]): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];

    // Alerta por temperatura extrema REAL
    if (weather.temperature > 30) {
      alerts.push({
        id: `temp_high_${Date.now()}`,
        type: 'temperature',
        severity: weather.temperature > 35 ? 'critical' : 'high',
        message: `Ola de calor detectada: ${weather.temperature.toFixed(1)}°C`,
        startTime: new Date(),
        endTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
        affectedAreas: ['Lotes expuestos al sol'],
        recommendations: ['Hidratación de cultivos', 'Suspender fertilización']
      });
    }

    if (weather.rainfall > 10) { // Lluvia fuerte es > 10mm/h o acumulado
      alerts.push({
        id: `rain_high_${Date.now()}`,
        type: 'rainfall',
        severity: weather.rainfall > 25 ? 'critical' : 'high',
        message: `Lluvia intensa detectada: ${weather.rainfall.toFixed(1)}mm`,
        startTime: new Date(),
        endTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        affectedAreas: ['Vías de acceso', 'Lotes con pendiente'],
        recommendations: ['Revisar drenajes', 'Suspender recolección']
      });
    }

    return alerts;
  }

  // Calcular factores de riesgo (Determinista)
  private calculatePestRiskFactors(weather: WeatherConditions): any {
    // 1. Temperatura: Ideal para plagas es 22-28
    let tempRisk = 0;
    if (weather.temperature >= 22 && weather.temperature <= 28) tempRisk = 1.0;
    else if (weather.temperature >= 18 && weather.temperature <= 32) tempRisk = 0.6;
    else tempRisk = 0.2;

    // 2. Humedad: Hongos aman > 80%, Insectos aman < 60% (promedio para riesgo general)
    let humidityRisk = 0;
    if (weather.humidity > 80) humidityRisk = 0.9; // Hongo
    else if (weather.humidity < 60) humidityRisk = 0.7; // Insectos (Broca)
    else humidityRisk = 0.5; // Zona intermedia

    // 3. Lluvia
    let rainRisk = 0;
    if (weather.rainfall > 5) rainRisk = 0.8; // Favorece hongos, lava insecticidas
    else rainRisk = 0.3;

    const overall = (tempRisk + humidityRisk + rainRisk) / 3;

    return {
      temperature: tempRisk,
      humidity: humidityRisk,
      rainfall: rainRisk,
      overall
    };
  }

  // Actualizar datos
  async updateWeatherData(): Promise<void> {
    try {
      this.currentWeather = await this.fetchRealWeatherData();
      this.weatherHistory.push(this.currentWeather);

      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.weatherHistory = this.weatherHistory.filter(w => w.timestamp > oneDayAgo);

      this.forecast = await this.generateForecastFromAPI();
      this.lastUpdate = new Date();

    } catch (error) {
      console.error('Error updating weather data:', error);
    }
  }

  // Análisis meteorológico completo
  async getWeatherAnalysis(): Promise<WeatherAnalysis> {
    if (!this.currentWeather || (Date.now() - this.lastUpdate.getTime() > this.updateInterval)) {
      await this.updateWeatherData();
    }

    const current = this.currentWeather!;
    const trends: WeatherTrend[] = []; // Se calcularían con histórico real
    const patterns = this.detectWeatherPatterns(current);
    const alerts = this.generateWeatherAlerts(current, patterns);
    const pestRiskFactors = this.calculatePestRiskFactors(current);
    const recommendations = ['Mantener monitoreo constante']; // Placeholder simple

    return {
      current,
      trends, // Dejamos vacío por simplificación, se llenará con el tiempo
      patterns,
      alerts,
      pestRiskFactors,
      recommendations,
      confidence: 1.0, // Datos reales = confianza máxima
      lastUpdated: this.lastUpdate
    };
  }

  private startPeriodicUpdates(): void {
    setInterval(() => {
      this.updateWeatherData();
    }, this.updateInterval);
  }

  // Obtener histórico real de Open-Meteo Archive
  public async getHistoricalWeather(latitude: number, longitude: number, startDate: Date, endDate: Date): Promise<{ date: string; rainfall: number }[]> {
    try {
      const startStr = startDate.toISOString().split('T')[0];
      const endStr = endDate.toISOString().split('T')[0];

      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${startStr}&end_date=${endStr}&daily=precipitation_sum&timezone=auto`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Historical Weather API Error');

      const data = await response.json();
      const daily = data.daily;
      const history: { date: string; rainfall: number }[] = [];

      if (daily && daily.time) {
        for (let i = 0; i < daily.time.length; i++) {
          history.push({
            date: daily.time[i],
            rainfall: daily.precipitation_sum[i] || 0
          });
        }
      }

      return history;

    } catch (error) {
      console.error('Failed to fetch historical weather:', error);
      return [];
    }
  }
}

export const enhancedWeatherService = new EnhancedWeatherService();
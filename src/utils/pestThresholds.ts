// Algoritmos de cálculo de umbrales económicos para plagas del café
// Basado en estándares internacionales de MIP y certificaciones

export interface ThresholdCalculation {
  pestType: string;
  currentLevel: number;
  economicThreshold: number;
  actionThreshold: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendedAction: string;
  treatmentUrgency: 'NONE' | 'MONITOR' | 'SCHEDULE' | 'IMMEDIATE';
  costBenefitRatio: number;
  predictedDamage: number;
}

export interface PestMonitoringData {
  pestType: string;
  plantsInspected: number;
  plantsAffected: number;
  severity: number; // 1-5 scale
  affectedArea: number;
  growthStage: 'FLOWERING' | 'FRUIT_DEVELOPMENT' | 'HARVEST' | 'POST_HARVEST';
  weatherConditions: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
  previousTreatments: Array<{
    date: string;
    product: string;
    efficacy: number;
  }>;
}

export interface CoffeeVarietyData {
  variety: string;
  susceptibility: number; // 1-5 scale
  economicValue: number; // price per kg
  yieldPotential: number; // kg/ha
}

// Umbrales económicos por tipo de plaga según estándares internacionales
const PEST_THRESHOLDS = {
  BROCA: {
    // Broca del café (Hypothenemus hampei)
    economicThreshold: 0.02, // 2% de infestación
    actionThreshold: 0.05, // 5% de infestación
    criticalThreshold: 0.10, // 10% de infestación
    damageCoefficient: 0.15, // 15% de pérdida por cada 1% de infestación
    treatmentCost: 150000, // COP por hectárea
    controlEfficacy: 0.85 // 85% de eficacia promedio
  },
  ROYA: {
    // Roya del café (Hemileia vastatrix)
    economicThreshold: 0.05, // 5% de incidencia
    actionThreshold: 0.10, // 10% de incidencia
    criticalThreshold: 0.20, // 20% de incidencia
    damageCoefficient: 0.20, // 20% de pérdida por cada 10% de incidencia
    treatmentCost: 200000, // COP por hectárea
    controlEfficacy: 0.80 // 80% de eficacia promedio
  },
  MINADOR: {
    // Minador de la hoja (Leucoptera coffeella)
    economicThreshold: 0.15, // 15% de hojas afectadas
    actionThreshold: 0.25, // 25% de hojas afectadas
    criticalThreshold: 0.40, // 40% de hojas afectadas
    damageCoefficient: 0.10, // 10% de pérdida por cada 10% de hojas afectadas
    treatmentCost: 120000, // COP por hectárea
    controlEfficacy: 0.75 // 75% de eficacia promedio
  },
  COCHINILLA: {
    // Cochinilla (Planococcus citri)
    economicThreshold: 0.08, // 8% de plantas afectadas
    actionThreshold: 0.15, // 15% de plantas afectadas
    criticalThreshold: 0.25, // 25% de plantas afectadas
    damageCoefficient: 0.12, // 12% de pérdida por cada 10% de plantas afectadas
    treatmentCost: 180000, // COP por hectárea
    controlEfficacy: 0.70 // 70% de eficacia promedio
  },
  NEMATODOS: {
    // Nematodos (Meloidogyne spp.)
    economicThreshold: 0.10, // 10% de plantas con síntomas
    actionThreshold: 0.20, // 20% de plantas con síntomas
    criticalThreshold: 0.35, // 35% de plantas con síntomas
    damageCoefficient: 0.25, // 25% de pérdida por cada 10% de plantas afectadas
    treatmentCost: 300000, // COP por hectárea
    controlEfficacy: 0.60 // 60% de eficacia promedio
  }
};

// Factores de ajuste por etapa de crecimiento
const GROWTH_STAGE_FACTORS = {
  FLOWERING: 1.5, // Mayor susceptibilidad durante floración
  FRUIT_DEVELOPMENT: 2.0, // Crítico durante desarrollo del fruto
  HARVEST: 1.2, // Moderado durante cosecha
  POST_HARVEST: 0.8 // Menor impacto post-cosecha
};

// Factores climáticos que afectan el desarrollo de plagas
const WEATHER_RISK_FACTORS = {
  BROCA: {
    optimalTemp: [20, 30], // Rango óptimo de temperatura
    optimalHumidity: [60, 90], // Rango óptimo de humedad
    rainfallThreshold: 100 // mm/mes
  },
  ROYA: {
    optimalTemp: [18, 25],
    optimalHumidity: [80, 95],
    rainfallThreshold: 150
  },
  MINADOR: {
    optimalTemp: [22, 28],
    optimalHumidity: [70, 85],
    rainfallThreshold: 80
  },
  COCHINILLA: {
    optimalTemp: [25, 32],
    optimalHumidity: [50, 70],
    rainfallThreshold: 50
  },
  NEMATODOS: {
    optimalTemp: [20, 28],
    optimalHumidity: [70, 90],
    rainfallThreshold: 120
  }
};

export function calculatePestThreshold(
  monitoringData: PestMonitoringData,
  varietyData: CoffeeVarietyData
): ThresholdCalculation {
  const pestType = monitoringData.pestType as keyof typeof PEST_THRESHOLDS;
  const thresholds = PEST_THRESHOLDS[pestType];
  
  if (!thresholds) {
    throw new Error(`Umbrales no definidos para la plaga: ${pestType}`);
  }

  // Calcular nivel actual de infestación
  const currentLevel = monitoringData.plantsAffected / monitoringData.plantsInspected;
  
  // Ajustar umbrales por etapa de crecimiento
  const growthFactor = GROWTH_STAGE_FACTORS[monitoringData.growthStage];
  const adjustedEconomicThreshold = thresholds.economicThreshold / growthFactor;
  const adjustedActionThreshold = thresholds.actionThreshold / growthFactor;
  
  // Calcular factor de riesgo climático
  const weatherRisk = calculateWeatherRisk(pestType, monitoringData.weatherConditions);
  
  // Ajustar umbrales por condiciones climáticas
  const weatherAdjustedEconomicThreshold = adjustedEconomicThreshold * (1 - weatherRisk * 0.3);
  const weatherAdjustedActionThreshold = adjustedActionThreshold * (1 - weatherRisk * 0.3);
  
  // Ajustar por susceptibilidad de la variedad
  const varietyFactor = varietyData.susceptibility / 3; // Normalizar a factor 0.33-1.67
  const finalEconomicThreshold = weatherAdjustedEconomicThreshold * varietyFactor;
  const finalActionThreshold = weatherAdjustedActionThreshold * varietyFactor;
  
  // Determinar nivel de riesgo
  let riskLevel: ThresholdCalculation['riskLevel'];
  let treatmentUrgency: ThresholdCalculation['treatmentUrgency'];
  let recommendedAction: string;
  
  if (currentLevel >= thresholds.criticalThreshold) {
    riskLevel = 'CRITICAL';
    treatmentUrgency = 'IMMEDIATE';
    recommendedAction = 'Aplicación inmediata de tratamiento. Monitoreo diario.';
  } else if (currentLevel >= finalActionThreshold) {
    riskLevel = 'HIGH';
    treatmentUrgency = 'SCHEDULE';
    recommendedAction = 'Programar tratamiento en 24-48 horas. Aumentar frecuencia de monitoreo.';
  } else if (currentLevel >= finalEconomicThreshold) {
    riskLevel = 'MEDIUM';
    treatmentUrgency = 'MONITOR';
    recommendedAction = 'Monitoreo intensivo. Preparar tratamiento preventivo.';
  } else {
    riskLevel = 'LOW';
    treatmentUrgency = 'NONE';
    recommendedAction = 'Continuar monitoreo regular. Mantener prácticas preventivas.';
  }
  
  // Calcular daño económico predicho
  const predictedDamage = calculatePredictedDamage(
    currentLevel,
    thresholds,
    varietyData,
    monitoringData.affectedArea
  );
  
  // Calcular relación costo-beneficio
  const costBenefitRatio = calculateCostBenefitRatio(
    predictedDamage,
    thresholds.treatmentCost,
    thresholds.controlEfficacy,
    monitoringData.affectedArea
  );
  
  return {
    pestType: monitoringData.pestType,
    currentLevel,
    economicThreshold: finalEconomicThreshold,
    actionThreshold: finalActionThreshold,
    riskLevel,
    recommendedAction,
    treatmentUrgency,
    costBenefitRatio,
    predictedDamage
  };
}

function calculateWeatherRisk(
  pestType: keyof typeof WEATHER_RISK_FACTORS,
  weather: PestMonitoringData['weatherConditions']
): number {
  const factors = WEATHER_RISK_FACTORS[pestType];
  let riskScore = 0;
  
  // Evaluar temperatura
  if (weather.temperature >= factors.optimalTemp[0] && weather.temperature <= factors.optimalTemp[1]) {
    riskScore += 0.4;
  }
  
  // Evaluar humedad
  if (weather.humidity >= factors.optimalHumidity[0] && weather.humidity <= factors.optimalHumidity[1]) {
    riskScore += 0.4;
  }
  
  // Evaluar precipitación
  if (weather.rainfall >= factors.rainfallThreshold) {
    riskScore += 0.2;
  }
  
  return Math.min(riskScore, 1.0); // Máximo 1.0
}

function calculatePredictedDamage(
  currentLevel: number,
  thresholds: typeof PEST_THRESHOLDS[keyof typeof PEST_THRESHOLDS],
  varietyData: CoffeeVarietyData,
  affectedArea: number
): number {
  // Calcular pérdida de rendimiento esperada
  const yieldLoss = currentLevel * thresholds.damageCoefficient;
  
  // Calcular pérdida económica
  const totalYield = varietyData.yieldPotential * affectedArea;
  const lostYield = totalYield * yieldLoss;
  const economicLoss = lostYield * varietyData.economicValue;
  
  return economicLoss;
}

function calculateCostBenefitRatio(
  predictedDamage: number,
  treatmentCost: number,
  controlEfficacy: number,
  affectedArea: number
): number {
  const totalTreatmentCost = treatmentCost * affectedArea;
  const preventedDamage = predictedDamage * controlEfficacy;
  
  if (totalTreatmentCost === 0) return 0;
  
  return preventedDamage / totalTreatmentCost;
}

// Función para obtener recomendaciones específicas por plaga
export function getPestSpecificRecommendations(pestType: string, riskLevel: string): string[] {
  const recommendations: Record<string, Record<string, string[]>> = {
    BROCA: {
      LOW: [
        'Mantener monitoreo quincenal',
        'Recolección oportuna de frutos maduros',
        'Eliminación de frutos brocados',
        'Uso de trampas con alcohol'
      ],
      MEDIUM: [
        'Aumentar frecuencia de monitoreo a semanal',
        'Intensificar recolección de frutos',
        'Aplicar control biológico con Beauveria bassiana',
        'Revisar y limpiar beneficiaderos'
      ],
      HIGH: [
        'Monitoreo cada 3 días',
        'Aplicación de insecticida específico',
        'Control biológico intensivo',
        'Recolección sanitaria inmediata'
      ],
      CRITICAL: [
        'Monitoreo diario',
        'Aplicación inmediata de tratamiento químico',
        'Control biológico de emergencia',
        'Recolección total de frutos'
      ]
    },
    ROYA: {
      LOW: [
        'Monitoreo mensual de hojas',
        'Manejo de sombra adecuado',
        'Nutrición balanceada',
        'Poda sanitaria'
      ],
      MEDIUM: [
        'Monitoreo quincenal',
        'Aplicación preventiva de fungicida',
        'Mejoramiento de ventilación',
        'Fertilización con cobre'
      ],
      HIGH: [
        'Monitoreo semanal',
        'Aplicación curativa de fungicida sistémico',
        'Poda de ramas afectadas',
        'Manejo intensivo de sombra'
      ],
      CRITICAL: [
        'Monitoreo cada 3 días',
        'Aplicación inmediata de fungicida',
        'Poda sanitaria intensiva',
        'Renovación de cafetales severamente afectados'
      ]
    },
    MINADOR: {
      LOW: [
        'Monitoreo mensual de hojas',
        'Control de malezas hospederas',
        'Conservación de enemigos naturales',
        'Manejo de sombra'
      ],
      MEDIUM: [
        'Monitoreo quincenal',
        'Liberación de parasitoides',
        'Control biológico preventivo',
        'Eliminación de hojas muy afectadas'
      ],
      HIGH: [
        'Monitoreo semanal',
        'Aplicación de insecticida selectivo',
        'Control biológico intensivo',
        'Poda de ramas severamente afectadas'
      ],
      CRITICAL: [
        'Monitoreo cada 3 días',
        'Aplicación inmediata de tratamiento',
        'Defoliación controlada si es necesario',
        'Programa intensivo de recuperación'
      ]
    }
  };

  return recommendations[pestType]?.[riskLevel] || [
    'Consultar con técnico especializado',
    'Implementar monitoreo específico',
    'Aplicar medidas de control integrado'
  ];
}

// Función para calcular el índice de riesgo climático
export function calculateClimateRiskIndex(
  pestType: string,
  weatherData: PestMonitoringData['weatherConditions'],
  forecastDays: number = 7
): number {
  const baseRisk = calculateWeatherRisk(
    pestType as keyof typeof WEATHER_RISK_FACTORS,
    weatherData
  );
  
  // Ajustar por pronóstico (simulado - en implementación real se usaría API meteorológica)
  const forecastFactor = Math.min(forecastDays / 7, 1.0);
  
  return baseRisk * (1 + forecastFactor * 0.3);
}

// Función para generar alertas automáticas
export function generateAutomaticAlert(
  threshold: ThresholdCalculation,
  monitoringData: PestMonitoringData
): {
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  actions: string[];
} {
  const recommendations = getPestSpecificRecommendations(
    threshold.pestType,
    threshold.riskLevel
  );
  
  let message = '';
  
  switch (threshold.riskLevel) {
    case 'CRITICAL':
      message = `ALERTA CRÍTICA: ${threshold.pestType} ha superado el umbral crítico (${(threshold.currentLevel * 100).toFixed(1)}%). Se requiere acción inmediata.`;
      break;
    case 'HIGH':
      message = `ALERTA ALTA: ${threshold.pestType} ha superado el umbral de acción (${(threshold.currentLevel * 100).toFixed(1)}%). Programar tratamiento urgente.`;
      break;
    case 'MEDIUM':
      message = `ALERTA MEDIA: ${threshold.pestType} se acerca al umbral económico (${(threshold.currentLevel * 100).toFixed(1)}%). Intensificar monitoreo.`;
      break;
    default:
      message = `Monitoreo normal: ${threshold.pestType} bajo control (${(threshold.currentLevel * 100).toFixed(1)}%).`;
  }
  
  return {
    severity: threshold.riskLevel,
    message,
    actions: recommendations
  };
}
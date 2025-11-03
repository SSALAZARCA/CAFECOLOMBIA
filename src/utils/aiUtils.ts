import { AIAgentType, AnalysisPriority } from '@/services/aiAgentService';

// Tipos de plagas y enfermedades del café
export const COFFEE_PESTS = {
  'coffee_leaf_rust': {
    name: 'Roya del Café',
    scientificName: 'Hemileia vastatrix',
    type: 'fungal',
    severity: 'high',
    symptoms: ['Manchas amarillas en hojas', 'Polvo anaranjado en el envés', 'Defoliación'],
    treatments: ['Fungicidas sistémicos', 'Variedades resistentes', 'Manejo de sombra'],
    prevention: ['Monitoreo regular', 'Nutrición balanceada', 'Control de humedad']
  },
  'coffee_berry_borer': {
    name: 'Broca del Café',
    scientificName: 'Hypothenemus hampei',
    type: 'insect',
    severity: 'high',
    symptoms: ['Perforaciones en frutos', 'Galerías en granos', 'Caída prematura'],
    treatments: ['Beauveria bassiana', 'Trampas con alcohol', 'Recolección oportuna'],
    prevention: ['Cosecha completa', 'Manejo de residuos', 'Control biológico']
  },
  'coffee_leaf_miner': {
    name: 'Minador de la Hoja',
    scientificName: 'Leucoptera coffeella',
    type: 'insect',
    severity: 'medium',
    symptoms: ['Minas en hojas', 'Manchas necróticas', 'Defoliación parcial'],
    treatments: ['Insecticidas selectivos', 'Control biológico', 'Podas sanitarias'],
    prevention: ['Monitoreo de adultos', 'Manejo de sombra', 'Nutrición adecuada']
  },
  'anthracnose': {
    name: 'Antracnosis',
    scientificName: 'Colletotrichum spp.',
    type: 'fungal',
    severity: 'medium',
    symptoms: ['Manchas oscuras en frutos', 'Lesiones hundidas', 'Momificación'],
    treatments: ['Fungicidas preventivos', 'Manejo de humedad', 'Podas de ventilación'],
    prevention: ['Drenaje adecuado', 'Espaciamiento correcto', 'Manejo de residuos']
  },
  'coffee_wilt': {
    name: 'Marchitez del Café',
    scientificName: 'Fusarium xylarioides',
    type: 'fungal',
    severity: 'high',
    symptoms: ['Marchitez de ramas', 'Decoloración vascular', 'Muerte de plantas'],
    treatments: ['Variedades resistentes', 'Manejo de suelos', 'Eliminación de plantas'],
    prevention: ['Desinfección de herramientas', 'Control de vectores', 'Rotación de cultivos']
  }
} as const;

// Partes de la planta de café
export const COFFEE_PLANT_PARTS = {
  'leaf': {
    name: 'Hoja',
    description: 'Órgano fotosintético principal',
    commonIssues: ['Roya', 'Minador', 'Deficiencias nutricionales'],
    analysisPoints: ['Color', 'Manchas', 'Textura', 'Bordes']
  },
  'stem': {
    name: 'Tallo',
    description: 'Estructura de soporte y transporte',
    commonIssues: ['Barrenadores', 'Cancros', 'Heridas'],
    analysisPoints: ['Color', 'Lesiones', 'Grosor', 'Ramificación']
  },
  'fruit': {
    name: 'Fruto',
    description: 'Cereza del café',
    commonIssues: ['Broca', 'Antracnosis', 'Maduración irregular'],
    analysisPoints: ['Color', 'Tamaño', 'Perforaciones', 'Estado de madurez']
  },
  'root': {
    name: 'Raíz',
    description: 'Sistema radicular',
    commonIssues: ['Nematodos', 'Pudriciones', 'Deficiencias'],
    analysisPoints: ['Color', 'Grosor', 'Ramificación', 'Lesiones']
  },
  'flower': {
    name: 'Flor',
    description: 'Órgano reproductivo',
    commonIssues: ['Caída prematura', 'Deformaciones', 'Plagas'],
    analysisPoints: ['Color', 'Forma', 'Cantidad', 'Estado']
  },
  'whole_plant': {
    name: 'Planta Completa',
    description: 'Vista general de la planta',
    commonIssues: ['Estrés general', 'Deficiencias', 'Plagas múltiples'],
    analysisPoints: ['Vigor', 'Arquitectura', 'Color general', 'Distribución de síntomas']
  }
} as const;

// Niveles de severidad
export const SEVERITY_LEVELS = {
  'low': {
    name: 'Baja',
    color: '#10B981',
    description: 'Daño mínimo, fácil control',
    action: 'Monitoreo preventivo',
    urgency: 1
  },
  'medium': {
    name: 'Media',
    color: '#F59E0B',
    description: 'Daño moderado, requiere atención',
    action: 'Tratamiento recomendado',
    urgency: 2
  },
  'high': {
    name: 'Alta',
    color: '#EF4444',
    description: 'Daño severo, acción inmediata',
    action: 'Tratamiento urgente',
    urgency: 3
  },
  'critical': {
    name: 'Crítica',
    color: '#7C2D12',
    description: 'Daño extremo, riesgo de pérdida',
    action: 'Intervención inmediata',
    urgency: 4
  }
} as const;

// Condiciones ambientales óptimas para el café
export const OPTIMAL_CONDITIONS = {
  temperature: {
    min: 18,
    max: 24,
    optimal: 21,
    unit: '°C'
  },
  humidity: {
    min: 60,
    max: 80,
    optimal: 70,
    unit: '%'
  },
  rainfall: {
    min: 1200,
    max: 2000,
    optimal: 1500,
    unit: 'mm/año'
  },
  altitude: {
    min: 800,
    max: 2000,
    optimal: 1200,
    unit: 'msnm'
  },
  ph: {
    min: 6.0,
    max: 6.5,
    optimal: 6.2,
    unit: 'pH'
  }
} as const;

// Utilidades para análisis de IA
export class AIUtils {
  
  // Obtener información de plaga por ID
  static getPestInfo(pestId: string) {
    return COFFEE_PESTS[pestId as keyof typeof COFFEE_PESTS] || null;
  }

  // Obtener información de parte de planta
  static getPlantPartInfo(partId: string) {
    return COFFEE_PLANT_PARTS[partId as keyof typeof COFFEE_PLANT_PARTS] || null;
  }

  // Obtener información de severidad
  static getSeverityInfo(severity: string) {
    return SEVERITY_LEVELS[severity as keyof typeof SEVERITY_LEVELS] || null;
  }

  // Calcular prioridad basada en severidad y confianza
  static calculatePriority(severity: string, confidence: number): AnalysisPriority {
    const severityInfo = this.getSeverityInfo(severity);
    if (!severityInfo) return 'medium';

    if (confidence < 0.5) return 'low';
    
    if (severityInfo.urgency >= 3 && confidence >= 0.8) return 'high';
    if (severityInfo.urgency >= 2 && confidence >= 0.7) return 'medium';
    
    return 'low';
  }

  // Generar recomendaciones basadas en análisis
  static generateRecommendations(
    pestType: string,
    severity: string,
    confidence: number,
    plantPart: string,
    environmentalFactors?: {
      temperature?: number;
      humidity?: number;
      rainfall?: number;
    }
  ): string[] {
    const recommendations: string[] = [];
    const pestInfo = this.getPestInfo(pestType);
    const severityInfo = this.getSeverityInfo(severity);

    if (!pestInfo || !severityInfo) {
      return ['Consultar con especialista para diagnóstico preciso'];
    }

    // Recomendaciones basadas en confianza
    if (confidence < 0.7) {
      recommendations.push('Confirmar diagnóstico con especialista');
      recommendations.push('Tomar muestras adicionales para análisis');
    }

    // Recomendaciones de tratamiento
    if (severityInfo.urgency >= 3) {
      recommendations.push(`${severityInfo.action} requerida`);
      recommendations.push(...pestInfo.treatments.slice(0, 2));
    } else {
      recommendations.push(...pestInfo.prevention.slice(0, 2));
    }

    // Recomendaciones ambientales
    if (environmentalFactors) {
      if (environmentalFactors.humidity && environmentalFactors.humidity > 80) {
        recommendations.push('Mejorar ventilación para reducir humedad');
      }
      if (environmentalFactors.temperature && environmentalFactors.temperature > 25) {
        recommendations.push('Considerar manejo de sombra para reducir temperatura');
      }
    }

    // Recomendaciones específicas por parte de planta
    const plantPartInfo = this.getPlantPartInfo(plantPart);
    if (plantPartInfo) {
      if (plantPart === 'leaf' && pestType === 'coffee_leaf_rust') {
        recommendations.push('Aplicar fungicida foliar sistémico');
        recommendations.push('Mejorar nutrición con potasio');
      }
      if (plantPart === 'fruit' && pestType === 'coffee_berry_borer') {
        recommendations.push('Acelerar cosecha de frutos maduros');
        recommendations.push('Implementar trampas con alcohol');
      }
    }

    return recommendations.slice(0, 5); // Máximo 5 recomendaciones
  }

  // Evaluar condiciones ambientales
  static evaluateEnvironmentalConditions(conditions: {
    temperature?: number;
    humidity?: number;
    rainfall?: number;
    altitude?: number;
    ph?: number;
  }): {
    overall: 'optimal' | 'good' | 'fair' | 'poor';
    score: number;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];
    let totalScore = 0;
    let factorCount = 0;

    // Evaluar temperatura
    if (conditions.temperature !== undefined) {
      factorCount++;
      const temp = conditions.temperature;
      if (temp >= OPTIMAL_CONDITIONS.temperature.min && temp <= OPTIMAL_CONDITIONS.temperature.max) {
        totalScore += 100;
      } else if (temp >= 15 && temp <= 28) {
        totalScore += 70;
        if (temp < OPTIMAL_CONDITIONS.temperature.min) {
          issues.push('Temperatura baja para café');
          recommendations.push('Considerar variedades tolerantes al frío');
        } else {
          issues.push('Temperatura alta para café');
          recommendations.push('Implementar manejo de sombra');
        }
      } else {
        totalScore += 30;
        issues.push('Temperatura fuera del rango adecuado');
        recommendations.push('Evaluar viabilidad del cultivo en esta zona');
      }
    }

    // Evaluar humedad
    if (conditions.humidity !== undefined) {
      factorCount++;
      const humidity = conditions.humidity;
      if (humidity >= OPTIMAL_CONDITIONS.humidity.min && humidity <= OPTIMAL_CONDITIONS.humidity.max) {
        totalScore += 100;
      } else if (humidity >= 50 && humidity <= 90) {
        totalScore += 70;
        if (humidity < OPTIMAL_CONDITIONS.humidity.min) {
          issues.push('Humedad baja');
          recommendations.push('Implementar riego por aspersión');
        } else {
          issues.push('Humedad alta');
          recommendations.push('Mejorar ventilación y drenaje');
        }
      } else {
        totalScore += 30;
        issues.push('Humedad inadecuada');
        recommendations.push('Implementar sistema de control climático');
      }
    }

    // Evaluar precipitación
    if (conditions.rainfall !== undefined) {
      factorCount++;
      const rainfall = conditions.rainfall;
      if (rainfall >= OPTIMAL_CONDITIONS.rainfall.min && rainfall <= OPTIMAL_CONDITIONS.rainfall.max) {
        totalScore += 100;
      } else if (rainfall >= 1000 && rainfall <= 2500) {
        totalScore += 70;
        if (rainfall < OPTIMAL_CONDITIONS.rainfall.min) {
          issues.push('Precipitación insuficiente');
          recommendations.push('Implementar sistema de riego');
        } else {
          issues.push('Precipitación excesiva');
          recommendations.push('Mejorar drenaje del terreno');
        }
      } else {
        totalScore += 30;
        issues.push('Precipitación inadecuada');
        recommendations.push('Evaluar sistemas de manejo hídrico');
      }
    }

    // Evaluar altitud
    if (conditions.altitude !== undefined) {
      factorCount++;
      const altitude = conditions.altitude;
      if (altitude >= OPTIMAL_CONDITIONS.altitude.min && altitude <= OPTIMAL_CONDITIONS.altitude.max) {
        totalScore += 100;
      } else if (altitude >= 600 && altitude <= 2200) {
        totalScore += 70;
        if (altitude < OPTIMAL_CONDITIONS.altitude.min) {
          issues.push('Altitud baja para café de calidad');
          recommendations.push('Considerar variedades adaptadas a menor altitud');
        } else {
          issues.push('Altitud alta, riesgo de heladas');
          recommendations.push('Implementar protección contra heladas');
        }
      } else {
        totalScore += 30;
        issues.push('Altitud inadecuada para café');
        recommendations.push('Evaluar otros cultivos más apropiados');
      }
    }

    // Evaluar pH
    if (conditions.ph !== undefined) {
      factorCount++;
      const ph = conditions.ph;
      if (ph >= OPTIMAL_CONDITIONS.ph.min && ph <= OPTIMAL_CONDITIONS.ph.max) {
        totalScore += 100;
      } else if (ph >= 5.5 && ph <= 7.0) {
        totalScore += 70;
        if (ph < OPTIMAL_CONDITIONS.ph.min) {
          issues.push('Suelo ácido');
          recommendations.push('Aplicar cal para corregir pH');
        } else {
          issues.push('Suelo alcalino');
          recommendations.push('Aplicar materia orgánica para acidificar');
        }
      } else {
        totalScore += 30;
        issues.push('pH del suelo inadecuado');
        recommendations.push('Realizar análisis detallado de suelos');
      }
    }

    const averageScore = factorCount > 0 ? totalScore / factorCount : 0;
    
    let overall: 'optimal' | 'good' | 'fair' | 'poor';
    if (averageScore >= 90) overall = 'optimal';
    else if (averageScore >= 75) overall = 'good';
    else if (averageScore >= 60) overall = 'fair';
    else overall = 'poor';

    return {
      overall,
      score: averageScore,
      issues,
      recommendations
    };
  }

  // Formatear resultados de análisis para mostrar
  static formatAnalysisResults(results: any, agentType: AIAgentType): {
    title: string;
    summary: string;
    details: Array<{
      label: string;
      value: string;
      severity?: string;
      confidence?: number;
    }>;
    recommendations: string[];
  } {
    const formatted = {
      title: '',
      summary: '',
      details: [] as any[],
      recommendations: [] as string[]
    };

    switch (agentType) {
      case 'phytosanitary':
        formatted.title = 'Análisis Fitosanitario';
        if (results.pestDetection && results.pestDetection.length > 0) {
          const pest = results.pestDetection[0];
          const pestInfo = this.getPestInfo(pest.pestType);
          
          formatted.summary = `Detectado: ${pestInfo?.name || pest.pestType} con ${(pest.confidence * 100).toFixed(0)}% de confianza`;
          
          formatted.details = [
            { label: 'Plaga/Enfermedad', value: pestInfo?.name || pest.pestType },
            { label: 'Nombre Científico', value: pestInfo?.scientificName || 'N/A' },
            { label: 'Tipo', value: pestInfo?.type || 'N/A' },
            { label: 'Severidad', value: pest.severity, severity: pest.severity },
            { label: 'Confianza', value: `${(pest.confidence * 100).toFixed(1)}%`, confidence: pest.confidence },
            { label: 'Área Afectada', value: `${pest.affectedArea || 'N/A'}%` }
          ];
          
          formatted.recommendations = pest.recommendations || [];
        }
        break;

      case 'predictive':
        formatted.title = 'Análisis Predictivo';
        if (results.predictions && results.predictions.length > 0) {
          const prediction = results.predictions[0];
          
          formatted.summary = `Riesgo de ${prediction.type}: ${(prediction.probability * 100).toFixed(0)}% en ${prediction.timeframe}`;
          
          formatted.details = [
            { label: 'Tipo de Predicción', value: prediction.type },
            { label: 'Probabilidad', value: `${(prediction.probability * 100).toFixed(1)}%`, confidence: prediction.probability },
            { label: 'Marco Temporal', value: prediction.timeframe },
            { label: 'Factores', value: prediction.factors?.join(', ') || 'N/A' }
          ];
          
          formatted.recommendations = prediction.recommendations || [];
        }
        break;

      case 'rag_assistant':
        formatted.title = 'Asistente Virtual';
        if (results.recommendations && results.recommendations.length > 0) {
          const rec = results.recommendations[0];
          
          formatted.summary = `Recomendación: ${rec.category}`;
          
          formatted.details = [
            { label: 'Categoría', value: rec.category },
            { label: 'Sugerencia', value: rec.suggestion },
            { label: 'Confianza', value: `${(rec.confidence * 100).toFixed(1)}%`, confidence: rec.confidence },
            { label: 'Fuentes', value: rec.sources?.join(', ') || 'N/A' }
          ];
        }
        break;

      case 'optimization':
        formatted.title = 'Optimización';
        if (results.optimizations && results.optimizations.length > 0) {
          const opt = results.optimizations[0];
          
          formatted.summary = `Optimización de ${opt.area}: ${(opt.potential_improvement * 100).toFixed(0)}% de mejora potencial`;
          
          formatted.details = [
            { label: 'Área', value: opt.area },
            { label: 'Eficiencia Actual', value: `${(opt.current_efficiency * 100).toFixed(1)}%` },
            { label: 'Mejora Potencial', value: `${(opt.potential_improvement * 100).toFixed(1)}%` }
          ];
          
          formatted.recommendations = opt.recommendations || [];
        }
        break;
    }

    return formatted;
  }

  // Obtener color basado en severidad
  static getSeverityColor(severity: string): string {
    const severityInfo = this.getSeverityInfo(severity);
    return severityInfo?.color || '#6B7280';
  }

  // Obtener icono basado en tipo de agente
  static getAgentIcon(agentType: AIAgentType): string {
    const icons = {
      'phytosanitary': '🔬',
      'predictive': '📊',
      'rag_assistant': '🤖',
      'optimization': '⚡'
    };
    return icons[agentType] || '🤖';
  }

  // Validar calidad de imagen para análisis
  static validateImageQuality(
    width: number,
    height: number,
    size: number,
    format: string
  ): {
    isValid: boolean;
    issues: string[];
    recommendations: string[];
  } {
    const issues: string[] = [];
    const recommendations: string[] = [];

    // Validar resolución
    if (width < 640 || height < 480) {
      issues.push('Resolución muy baja');
      recommendations.push('Usar cámara con mayor resolución (mínimo 640x480)');
    }

    // Validar tamaño de archivo
    if (size > 10 * 1024 * 1024) { // 10MB
      issues.push('Archivo muy grande');
      recommendations.push('Comprimir imagen o reducir calidad');
    } else if (size < 50 * 1024) { // 50KB
      issues.push('Archivo muy pequeño, posible baja calidad');
      recommendations.push('Aumentar calidad de captura');
    }

    // Validar formato
    const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!supportedFormats.includes(format.toLowerCase())) {
      issues.push('Formato no soportado');
      recommendations.push('Usar formato JPEG, PNG o WebP');
    }

    return {
      isValid: issues.length === 0,
      issues,
      recommendations
    };
  }

  // Generar ID único para análisis
  static generateAnalysisId(agentType: AIAgentType, timestamp?: Date): string {
    const ts = timestamp || new Date();
    const dateStr = ts.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = ts.toISOString().slice(11, 19).replace(/:/g, '');
    const random = Math.random().toString(36).substr(2, 6);
    
    return `${agentType}_${dateStr}_${timeStr}_${random}`;
  }

  // Calcular tiempo estimado de procesamiento
  static estimateProcessingTime(
    agentType: AIAgentType,
    imageSize: number,
    priority: AnalysisPriority
  ): number {
    // Tiempo base en segundos por tipo de agente
    const baseTimes = {
      'phytosanitary': 15,
      'predictive': 25,
      'rag_assistant': 10,
      'optimization': 30
    };

    // Factor por tamaño de imagen (MB)
    const sizeMB = imageSize / (1024 * 1024);
    const sizeFactor = Math.max(1, sizeMB / 2);

    // Factor por prioridad
    const priorityFactors = {
      'critical': 0.5,
      'high': 0.7,
      'medium': 1.0,
      'low': 1.5
    };

    const baseTime = baseTimes[agentType] || 20;
    const priorityFactor = priorityFactors[priority] || 1.0;

    return Math.round(baseTime * sizeFactor * priorityFactor);
  }
}

// Exportar constantes y utilidades
export {
  COFFEE_PESTS,
  COFFEE_PLANT_PARTS,
  SEVERITY_LEVELS,
  OPTIMAL_CONDITIONS
};
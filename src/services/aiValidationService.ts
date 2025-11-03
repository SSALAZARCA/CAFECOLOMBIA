import { AIAgentType, AnalysisPriority, AIAnalysisRequest, AIAnalysisResult } from './aiAgentService';
import { ImageAnalysisResult } from './imageAnalysisService';
import { AIUtils } from '@/utils/aiUtils';

// Tipos para validación
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export interface DataQualityMetrics {
  completeness: number; // 0-1
  accuracy: number; // 0-1
  consistency: number; // 0-1
  timeliness: number; // 0-1
  overall: number; // 0-1
}

export interface ValidationConfig {
  strictMode: boolean;
  requireGPS: boolean;
  minImageQuality: number;
  maxImageSize: number;
  allowedFormats: string[];
  minConfidence: number;
}

export class AIValidationService {
  private config: ValidationConfig;

  constructor(config?: Partial<ValidationConfig>) {
    this.config = {
      strictMode: false,
      requireGPS: true,
      minImageQuality: 0.6,
      maxImageSize: 10 * 1024 * 1024, // 10MB
      allowedFormats: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      minConfidence: 0.5,
      ...config
    };
  }

  // Validar solicitud de análisis de IA
  validateAnalysisRequest(request: AIAnalysisRequest): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validar campos requeridos
    if (!request.id) {
      errors.push('ID de solicitud es requerido');
    }

    if (!request.imageBlob) {
      errors.push('Imagen es requerida');
    } else {
      // Validar imagen
      const imageValidation = this.validateImage(request.imageBlob);
      errors.push(...imageValidation.errors);
      warnings.push(...imageValidation.warnings);
      suggestions.push(...imageValidation.suggestions);
    }

    if (!request.agentType) {
      errors.push('Tipo de agente es requerido');
    } else if (!this.isValidAgentType(request.agentType)) {
      errors.push('Tipo de agente no válido');
    }

    if (!request.priority) {
      warnings.push('Prioridad no especificada, usando "medium"');
    } else if (!this.isValidPriority(request.priority)) {
      errors.push('Prioridad no válida');
    }

    // Validar metadatos
    if (request.metadata) {
      const metadataValidation = this.validateMetadata(request.metadata);
      errors.push(...metadataValidation.errors);
      warnings.push(...metadataValidation.warnings);
      suggestions.push(...metadataValidation.suggestions);
    } else if (this.config.strictMode) {
      errors.push('Metadatos son requeridos en modo estricto');
    }

    // Validar configuración específica del agente
    if (request.agentConfig) {
      const configValidation = this.validateAgentConfig(request.agentType, request.agentConfig);
      errors.push(...configValidation.errors);
      warnings.push(...configValidation.warnings);
      suggestions.push(...configValidation.suggestions);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Validar imagen
  validateImage(imageBlob: Blob): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validar tamaño
    if (imageBlob.size > this.config.maxImageSize) {
      errors.push(`Imagen muy grande (${(imageBlob.size / 1024 / 1024).toFixed(1)}MB). Máximo: ${(this.config.maxImageSize / 1024 / 1024).toFixed(1)}MB`);
      suggestions.push('Comprimir imagen o reducir resolución');
    }

    if (imageBlob.size < 10 * 1024) { // 10KB
      warnings.push('Imagen muy pequeña, puede afectar la calidad del análisis');
      suggestions.push('Usar imagen de mayor resolución');
    }

    // Validar formato
    if (!this.config.allowedFormats.includes(imageBlob.type)) {
      errors.push(`Formato no soportado: ${imageBlob.type}`);
      suggestions.push(`Usar uno de estos formatos: ${this.config.allowedFormats.join(', ')}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Validar metadatos
  validateMetadata(metadata: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validar GPS si es requerido
    if (this.config.requireGPS) {
      if (!metadata.gps || (!metadata.gps.latitude || !metadata.gps.longitude)) {
        errors.push('Coordenadas GPS son requeridas');
        suggestions.push('Habilitar GPS en el dispositivo');
      } else {
        // Validar coordenadas válidas
        const lat = parseFloat(metadata.gps.latitude);
        const lng = parseFloat(metadata.gps.longitude);
        
        if (isNaN(lat) || lat < -90 || lat > 90) {
          errors.push('Latitud no válida');
        }
        
        if (isNaN(lng) || lng < -180 || lng > 180) {
          errors.push('Longitud no válida');
        }

        // Validar que esté en Colombia (aproximadamente)
        if (lat < -4.5 || lat > 13.5 || lng < -82 || lng > -66) {
          warnings.push('Coordenadas fuera del territorio colombiano');
          suggestions.push('Verificar ubicación GPS');
        }
      }
    }

    // Validar timestamp
    if (metadata.timestamp) {
      const timestamp = new Date(metadata.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);
      
      if (isNaN(timestamp.getTime())) {
        errors.push('Timestamp no válido');
      } else if (hoursDiff > 24) {
        warnings.push('Imagen tomada hace más de 24 horas');
        suggestions.push('Usar imágenes recientes para mejor análisis');
      } else if (timestamp > now) {
        errors.push('Timestamp en el futuro');
      }
    }

    // Validar información del dispositivo
    if (metadata.device) {
      if (!metadata.device.userAgent) {
        warnings.push('Información del dispositivo incompleta');
      }
    }

    // Validar calidad de imagen
    if (metadata.imageQuality) {
      const quality = parseFloat(metadata.imageQuality);
      if (isNaN(quality) || quality < 0 || quality > 1) {
        errors.push('Calidad de imagen no válida (debe estar entre 0 y 1)');
      } else if (quality < this.config.minImageQuality) {
        warnings.push(`Calidad de imagen baja (${(quality * 100).toFixed(0)}%)`);
        suggestions.push('Mejorar iluminación y enfoque');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Validar configuración del agente
  validateAgentConfig(agentType: AIAgentType, config: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    switch (agentType) {
      case 'phytosanitary':
        if (config.plantPart && !AIUtils.getPlantPartInfo(config.plantPart)) {
          errors.push('Parte de planta no válida');
        }
        
        if (config.confidenceThreshold !== undefined) {
          const threshold = parseFloat(config.confidenceThreshold);
          if (isNaN(threshold) || threshold < 0 || threshold > 1) {
            errors.push('Umbral de confianza no válido');
          } else if (threshold < 0.3) {
            warnings.push('Umbral de confianza muy bajo');
            suggestions.push('Usar umbral mínimo de 0.3 para resultados confiables');
          }
        }
        break;

      case 'predictive':
        if (config.timeframe && !['1_day', '3_days', '1_week', '2_weeks', '1_month'].includes(config.timeframe)) {
          errors.push('Marco temporal no válido');
        }
        
        if (config.includeWeather === undefined) {
          warnings.push('No se especificó si incluir datos meteorológicos');
        }
        break;

      case 'rag_assistant':
        if (config.language && !['es', 'en'].includes(config.language)) {
          warnings.push('Idioma no soportado completamente');
          suggestions.push('Usar español (es) o inglés (en)');
        }
        
        if (config.maxSuggestions && (config.maxSuggestions < 1 || config.maxSuggestions > 10)) {
          warnings.push('Número de sugerencias fuera del rango recomendado (1-10)');
        }
        break;

      case 'optimization':
        if (config.optimizationAreas && !Array.isArray(config.optimizationAreas)) {
          errors.push('Áreas de optimización deben ser un array');
        }
        
        if (config.includeEconomicAnalysis === undefined) {
          warnings.push('No se especificó si incluir análisis económico');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Validar resultado de análisis
  validateAnalysisResult(result: AIAnalysisResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validar campos requeridos
    if (!result.id) {
      errors.push('ID de resultado es requerido');
    }

    if (!result.agentType) {
      errors.push('Tipo de agente es requerido');
    }

    if (!result.status) {
      errors.push('Estado es requerido');
    }

    if (!result.timestamp) {
      errors.push('Timestamp es requerido');
    }

    // Validar resultados específicos por agente
    if (result.status === 'completed' && result.results) {
      const resultsValidation = this.validateAgentResults(result.agentType, result.results);
      errors.push(...resultsValidation.errors);
      warnings.push(...resultsValidation.warnings);
      suggestions.push(...resultsValidation.suggestions);
    }

    // Validar confianza general
    if (result.confidence !== undefined) {
      if (result.confidence < 0 || result.confidence > 1) {
        errors.push('Confianza debe estar entre 0 y 1');
      } else if (result.confidence < this.config.minConfidence) {
        warnings.push(`Confianza baja (${(result.confidence * 100).toFixed(0)}%)`);
        suggestions.push('Considerar repetir análisis con mejor imagen');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Validar resultados específicos del agente
  private validateAgentResults(agentType: AIAgentType, results: any): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    switch (agentType) {
      case 'phytosanitary':
        if (results.pestDetection && Array.isArray(results.pestDetection)) {
          results.pestDetection.forEach((detection: any, index: number) => {
            if (!detection.pestType) {
              errors.push(`Detección ${index + 1}: Tipo de plaga requerido`);
            }
            
            if (detection.confidence === undefined || detection.confidence < 0 || detection.confidence > 1) {
              errors.push(`Detección ${index + 1}: Confianza no válida`);
            }
            
            if (!detection.severity) {
              warnings.push(`Detección ${index + 1}: Severidad no especificada`);
            }
          });
        }
        break;

      case 'predictive':
        if (results.predictions && Array.isArray(results.predictions)) {
          results.predictions.forEach((prediction: any, index: number) => {
            if (!prediction.type) {
              errors.push(`Predicción ${index + 1}: Tipo requerido`);
            }
            
            if (prediction.probability === undefined || prediction.probability < 0 || prediction.probability > 1) {
              errors.push(`Predicción ${index + 1}: Probabilidad no válida`);
            }
            
            if (!prediction.timeframe) {
              warnings.push(`Predicción ${index + 1}: Marco temporal no especificado`);
            }
          });
        }
        break;

      case 'rag_assistant':
        if (results.recommendations && Array.isArray(results.recommendations)) {
          results.recommendations.forEach((rec: any, index: number) => {
            if (!rec.category) {
              errors.push(`Recomendación ${index + 1}: Categoría requerida`);
            }
            
            if (!rec.suggestion) {
              errors.push(`Recomendación ${index + 1}: Sugerencia requerida`);
            }
            
            if (rec.confidence === undefined || rec.confidence < 0 || rec.confidence > 1) {
              warnings.push(`Recomendación ${index + 1}: Confianza no válida`);
            }
          });
        }
        break;

      case 'optimization':
        if (results.optimizations && Array.isArray(results.optimizations)) {
          results.optimizations.forEach((opt: any, index: number) => {
            if (!opt.area) {
              errors.push(`Optimización ${index + 1}: Área requerida`);
            }
            
            if (opt.current_efficiency === undefined || opt.current_efficiency < 0 || opt.current_efficiency > 1) {
              errors.push(`Optimización ${index + 1}: Eficiencia actual no válida`);
            }
            
            if (opt.potential_improvement === undefined || opt.potential_improvement < 0) {
              errors.push(`Optimización ${index + 1}: Mejora potencial no válida`);
            }
          });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Calcular métricas de calidad de datos
  calculateDataQuality(data: any): DataQualityMetrics {
    let completeness = 0;
    let accuracy = 0;
    let consistency = 0;
    let timeliness = 0;

    // Calcular completitud
    const requiredFields = ['id', 'timestamp', 'agentType'];
    const presentFields = requiredFields.filter(field => data[field] !== undefined && data[field] !== null);
    completeness = presentFields.length / requiredFields.length;

    // Calcular precisión (basado en validaciones)
    const validation = this.validateAnalysisRequest(data);
    accuracy = validation.errors.length === 0 ? 1 : Math.max(0, 1 - (validation.errors.length * 0.2));

    // Calcular consistencia (verificar tipos de datos)
    let consistencyScore = 1;
    if (data.timestamp && isNaN(new Date(data.timestamp).getTime())) {
      consistencyScore -= 0.3;
    }
    if (data.confidence !== undefined && (typeof data.confidence !== 'number' || data.confidence < 0 || data.confidence > 1)) {
      consistencyScore -= 0.3;
    }
    consistency = Math.max(0, consistencyScore);

    // Calcular oportunidad temporal
    if (data.timestamp) {
      const age = (Date.now() - new Date(data.timestamp).getTime()) / (1000 * 60 * 60); // horas
      timeliness = Math.max(0, 1 - (age / 24)); // Decrece linealmente en 24 horas
    } else {
      timeliness = 0;
    }

    const overall = (completeness + accuracy + consistency + timeliness) / 4;

    return {
      completeness,
      accuracy,
      consistency,
      timeliness,
      overall
    };
  }

  // Validar resultado de análisis de imagen
  validateImageAnalysisResult(result: ImageAnalysisResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Validar métricas de calidad
    if (result.quality) {
      if (result.quality.overall < 0 || result.quality.overall > 1) {
        errors.push('Calidad general fuera de rango');
      } else if (result.quality.overall < 0.5) {
        warnings.push('Calidad de imagen baja');
        suggestions.push('Mejorar iluminación y enfoque');
      }

      // Validar métricas específicas
      const metrics = ['brightness', 'contrast', 'sharpness', 'noise'];
      metrics.forEach(metric => {
        if (result.quality[metric] !== undefined && (result.quality[metric] < 0 || result.quality[metric] > 1)) {
          errors.push(`Métrica ${metric} fuera de rango`);
        }
      });
    }

    // Validar análisis de contenido
    if (result.content) {
      if (result.content.plantDetected === false) {
        warnings.push('No se detectó planta en la imagen');
        suggestions.push('Enfocar la cámara en la planta de café');
      }

      if (result.content.plantCoverage !== undefined && result.content.plantCoverage < 0.3) {
        warnings.push('Cobertura de planta baja en la imagen');
        suggestions.push('Acercar más la cámara a la planta');
      }
    }

    // Validar metadatos
    if (result.metadata) {
      if (!result.metadata.width || !result.metadata.height) {
        errors.push('Dimensiones de imagen requeridas');
      } else if (result.metadata.width < 640 || result.metadata.height < 480) {
        warnings.push('Resolución baja');
        suggestions.push('Usar cámara con mayor resolución');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  // Métodos auxiliares
  private isValidAgentType(agentType: string): boolean {
    return ['phytosanitary', 'predictive', 'rag_assistant', 'optimization'].includes(agentType);
  }

  private isValidPriority(priority: string): boolean {
    return ['critical', 'high', 'medium', 'low'].includes(priority);
  }

  // Actualizar configuración
  updateConfig(newConfig: Partial<ValidationConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  // Obtener configuración actual
  getConfig(): ValidationConfig {
    return { ...this.config };
  }

  // Generar reporte de validación
  generateValidationReport(data: any): {
    summary: {
      isValid: boolean;
      score: number;
      level: 'excellent' | 'good' | 'fair' | 'poor';
    };
    details: ValidationResult;
    quality: DataQualityMetrics;
    recommendations: string[];
  } {
    const validation = this.validateAnalysisRequest(data);
    const quality = this.calculateDataQuality(data);
    
    const score = quality.overall;
    let level: 'excellent' | 'good' | 'fair' | 'poor';
    
    if (score >= 0.9) level = 'excellent';
    else if (score >= 0.75) level = 'good';
    else if (score >= 0.6) level = 'fair';
    else level = 'poor';

    const recommendations: string[] = [
      ...validation.suggestions,
      ...validation.warnings.map(w => `Advertencia: ${w}`)
    ];

    if (quality.completeness < 0.8) {
      recommendations.push('Completar campos faltantes');
    }
    if (quality.timeliness < 0.5) {
      recommendations.push('Usar datos más recientes');
    }

    return {
      summary: {
        isValid: validation.isValid,
        score,
        level
      },
      details: validation,
      quality,
      recommendations
    };
  }
}

// Instancia singleton del servicio de validación
export const aiValidationService = new AIValidationService();
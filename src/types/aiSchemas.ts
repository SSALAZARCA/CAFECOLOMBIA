// Esquemas de validación para datos de IA
import { 
  AgentType, 
  Priority, 
  ProcessingStatus, 
  SyncStatus,
  AIAnalysisResult,
  PhytosanitaryAnalysis,
  PredictiveAnalysis,
  RAGQuery,
  OptimizationAnalysis,
  AINotification,
  AIMetrics,
  AISession,
  AIModelCache,
  AIErrorLog,
  AIUserPreferences
} from './aiDatabase';

// Esquemas de validación usando una estructura similar a Zod
export interface ValidationSchema<T> {
  validate(data: unknown): ValidationResult<T>;
  parse(data: unknown): T;
  safeParse(data: unknown): SafeParseResult<T>;
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: ValidationError[];
}

export interface SafeParseResult<T> {
  success: boolean;
  data?: T;
  error?: ValidationError;
}

export interface ValidationError {
  path: string[];
  message: string;
  code: string;
  expected?: string;
  received?: string;
}

// Esquemas base
export const AgentTypeSchema: ValidationSchema<AgentType> = {
  validate: (data: unknown): ValidationResult<AgentType> => {
    const validTypes: AgentType[] = ['phytosanitary', 'predictive', 'rag_assistant', 'optimization'];
    if (typeof data === 'string' && validTypes.includes(data as AgentType)) {
      return { success: true, data: data as AgentType };
    }
    return {
      success: false,
      errors: [{
        path: [],
        message: `Expected one of: ${validTypes.join(', ')}`,
        code: 'invalid_enum',
        expected: validTypes.join(' | '),
        received: typeof data
      }]
    };
  },
  parse: (data: unknown): AgentType => {
    const result = AgentTypeSchema.validate(data);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors?.[0]?.message}`);
    }
    return result.data!;
  },
  safeParse: (data: unknown): SafeParseResult<AgentType> => {
    const result = AgentTypeSchema.validate(data);
    return {
      success: result.success,
      data: result.data,
      error: result.errors?.[0]
    };
  }
};

export const PrioritySchema: ValidationSchema<Priority> = {
  validate: (data: unknown): ValidationResult<Priority> => {
    const validPriorities: Priority[] = ['low', 'medium', 'high', 'critical'];
    if (typeof data === 'string' && validPriorities.includes(data as Priority)) {
      return { success: true, data: data as Priority };
    }
    return {
      success: false,
      errors: [{
        path: [],
        message: `Expected one of: ${validPriorities.join(', ')}`,
        code: 'invalid_enum',
        expected: validPriorities.join(' | '),
        received: typeof data
      }]
    };
  },
  parse: (data: unknown): Priority => {
    const result = PrioritySchema.validate(data);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors?.[0]?.message}`);
    }
    return result.data!;
  },
  safeParse: (data: unknown): SafeParseResult<Priority> => {
    const result = PrioritySchema.validate(data);
    return {
      success: result.success,
      data: result.data,
      error: result.errors?.[0]
    };
  }
};

export const ProcessingStatusSchema: ValidationSchema<ProcessingStatus> = {
  validate: (data: unknown): ValidationResult<ProcessingStatus> => {
    const validStatuses: ProcessingStatus[] = ['pending', 'processing', 'completed', 'failed', 'cancelled'];
    if (typeof data === 'string' && validStatuses.includes(data as ProcessingStatus)) {
      return { success: true, data: data as ProcessingStatus };
    }
    return {
      success: false,
      errors: [{
        path: [],
        message: `Expected one of: ${validStatuses.join(', ')}`,
        code: 'invalid_enum',
        expected: validStatuses.join(' | '),
        received: typeof data
      }]
    };
  },
  parse: (data: unknown): ProcessingStatus => {
    const result = ProcessingStatusSchema.validate(data);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors?.[0]?.message}`);
    }
    return result.data!;
  },
  safeParse: (data: unknown): SafeParseResult<ProcessingStatus> => {
    const result = ProcessingStatusSchema.validate(data);
    return {
      success: result.success,
      data: result.data,
      error: result.errors?.[0]
    };
  }
};

// Funciones de validación auxiliares
export const isValidDate = (data: unknown): data is Date => {
  return data instanceof Date && !isNaN(data.getTime());
};

export const isValidNumber = (data: unknown, min?: number, max?: number): data is number => {
  if (typeof data !== 'number' || isNaN(data)) return false;
  if (min !== undefined && data < min) return false;
  if (max !== undefined && data > max) return false;
  return true;
};

export const isValidString = (data: unknown, minLength?: number, maxLength?: number): data is string => {
  if (typeof data !== 'string') return false;
  if (minLength !== undefined && data.length < minLength) return false;
  if (maxLength !== undefined && data.length > maxLength) return false;
  return true;
};

export const isValidArray = <T>(data: unknown, validator?: (item: unknown) => item is T): data is T[] => {
  if (!Array.isArray(data)) return false;
  if (validator) {
    return data.every(validator);
  }
  return true;
};

export const isValidObject = (data: unknown): data is Record<string, any> => {
  return typeof data === 'object' && data !== null && !Array.isArray(data);
};

// Esquemas para estructuras complejas
export const AIAnalysisResultSchema: ValidationSchema<Partial<AIAnalysisResult>> = {
  validate: (data: unknown): ValidationResult<Partial<AIAnalysisResult>> => {
    const errors: ValidationError[] = [];
    
    if (!isValidObject(data)) {
      return {
        success: false,
        errors: [{
          path: [],
          message: 'Expected object',
          code: 'invalid_type',
          expected: 'object',
          received: typeof data
        }]
      };
    }

    const obj = data as Record<string, any>;

    // Validar agentType (requerido)
    if (!obj.agentType) {
      errors.push({
        path: ['agentType'],
        message: 'agentType is required',
        code: 'required'
      });
    } else {
      const agentTypeResult = AgentTypeSchema.validate(obj.agentType);
      if (!agentTypeResult.success) {
        errors.push({
          path: ['agentType'],
          message: agentTypeResult.errors![0].message,
          code: 'invalid_enum'
        });
      }
    }

    // Validar status (requerido)
    if (!obj.status) {
      errors.push({
        path: ['status'],
        message: 'status is required',
        code: 'required'
      });
    } else {
      const statusResult = ProcessingStatusSchema.validate(obj.status);
      if (!statusResult.success) {
        errors.push({
          path: ['status'],
          message: statusResult.errors![0].message,
          code: 'invalid_enum'
        });
      }
    }

    // Validar priority (requerido)
    if (!obj.priority) {
      errors.push({
        path: ['priority'],
        message: 'priority is required',
        code: 'required'
      });
    } else {
      const priorityResult = PrioritySchema.validate(obj.priority);
      if (!priorityResult.success) {
        errors.push({
          path: ['priority'],
          message: priorityResult.errors![0].message,
          code: 'invalid_enum'
        });
      }
    }

    // Validar createdAt (requerido)
    if (!obj.createdAt) {
      errors.push({
        path: ['createdAt'],
        message: 'createdAt is required',
        code: 'required'
      });
    } else if (!isValidDate(obj.createdAt)) {
      errors.push({
        path: ['createdAt'],
        message: 'createdAt must be a valid Date',
        code: 'invalid_date'
      });
    }

    // Validar campos opcionales
    if (obj.completedAt && !isValidDate(obj.completedAt)) {
      errors.push({
        path: ['completedAt'],
        message: 'completedAt must be a valid Date',
        code: 'invalid_date'
      });
    }

    if (obj.processingTime && !isValidNumber(obj.processingTime, 0)) {
      errors.push({
        path: ['processingTime'],
        message: 'processingTime must be a positive number',
        code: 'invalid_number'
      });
    }

    if (obj.confidence && !isValidNumber(obj.confidence, 0, 1)) {
      errors.push({
        path: ['confidence'],
        message: 'confidence must be between 0 and 1',
        code: 'invalid_range'
      });
    }

    if (obj.retryCount && !isValidNumber(obj.retryCount, 0)) {
      errors.push({
        path: ['retryCount'],
        message: 'retryCount must be a non-negative number',
        code: 'invalid_number'
      });
    }

    if (obj.maxRetries && !isValidNumber(obj.maxRetries, 0)) {
      errors.push({
        path: ['maxRetries'],
        message: 'maxRetries must be a non-negative number',
        code: 'invalid_number'
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: obj as Partial<AIAnalysisResult> };
  },
  parse: (data: unknown): Partial<AIAnalysisResult> => {
    const result = AIAnalysisResultSchema.validate(data);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors?.[0]?.message}`);
    }
    return result.data!;
  },
  safeParse: (data: unknown): SafeParseResult<Partial<AIAnalysisResult>> => {
    const result = AIAnalysisResultSchema.validate(data);
    return {
      success: result.success,
      data: result.data,
      error: result.errors?.[0]
    };
  }
};

export const AINotificationSchema: ValidationSchema<Partial<AINotification>> = {
  validate: (data: unknown): ValidationResult<Partial<AINotification>> => {
    const errors: ValidationError[] = [];
    
    if (!isValidObject(data)) {
      return {
        success: false,
        errors: [{
          path: [],
          message: 'Expected object',
          code: 'invalid_type',
          expected: 'object',
          received: typeof data
        }]
      };
    }

    const obj = data as Record<string, any>;

    // Validar campos requeridos
    if (!obj.agentType) {
      errors.push({
        path: ['agentType'],
        message: 'agentType is required',
        code: 'required'
      });
    } else {
      const agentTypeResult = AgentTypeSchema.validate(obj.agentType);
      if (!agentTypeResult.success) {
        errors.push({
          path: ['agentType'],
          message: agentTypeResult.errors![0].message,
          code: 'invalid_enum'
        });
      }
    }

    if (!obj.type) {
      errors.push({
        path: ['type'],
        message: 'type is required',
        code: 'required'
      });
    } else {
      const validTypes = ['result', 'alert', 'warning', 'info', 'error'];
      if (!validTypes.includes(obj.type)) {
        errors.push({
          path: ['type'],
          message: `type must be one of: ${validTypes.join(', ')}`,
          code: 'invalid_enum'
        });
      }
    }

    if (!obj.title || !isValidString(obj.title, 1, 200)) {
      errors.push({
        path: ['title'],
        message: 'title is required and must be between 1 and 200 characters',
        code: 'invalid_string'
      });
    }

    if (!obj.message || !isValidString(obj.message, 1, 1000)) {
      errors.push({
        path: ['message'],
        message: 'message is required and must be between 1 and 1000 characters',
        code: 'invalid_string'
      });
    }

    if (!obj.priority) {
      errors.push({
        path: ['priority'],
        message: 'priority is required',
        code: 'required'
      });
    } else {
      const priorityResult = PrioritySchema.validate(obj.priority);
      if (!priorityResult.success) {
        errors.push({
          path: ['priority'],
          message: priorityResult.errors![0].message,
          code: 'invalid_enum'
        });
      }
    }

    if (typeof obj.isRead !== 'boolean') {
      errors.push({
        path: ['isRead'],
        message: 'isRead must be a boolean',
        code: 'invalid_type'
      });
    }

    if (!obj.createdAt || !isValidDate(obj.createdAt)) {
      errors.push({
        path: ['createdAt'],
        message: 'createdAt is required and must be a valid Date',
        code: 'invalid_date'
      });
    }

    if (typeof obj.actionRequired !== 'boolean') {
      errors.push({
        path: ['actionRequired'],
        message: 'actionRequired must be a boolean',
        code: 'invalid_type'
      });
    }

    // Validar campos opcionales
    if (obj.readAt && !isValidDate(obj.readAt)) {
      errors.push({
        path: ['readAt'],
        message: 'readAt must be a valid Date',
        code: 'invalid_date'
      });
    }

    if (obj.expiresAt && !isValidDate(obj.expiresAt)) {
      errors.push({
        path: ['expiresAt'],
        message: 'expiresAt must be a valid Date',
        code: 'invalid_date'
      });
    }

    if (obj.actions && !isValidArray(obj.actions)) {
      errors.push({
        path: ['actions'],
        message: 'actions must be an array',
        code: 'invalid_type'
      });
    }

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: obj as Partial<AINotification> };
  },
  parse: (data: unknown): Partial<AINotification> => {
    const result = AINotificationSchema.validate(data);
    if (!result.success) {
      throw new Error(`Validation failed: ${result.errors?.[0]?.message}`);
    }
    return result.data!;
  },
  safeParse: (data: unknown): SafeParseResult<Partial<AINotification>> => {
    const result = AINotificationSchema.validate(data);
    return {
      success: result.success,
      data: result.data,
      error: result.errors?.[0]
    };
  }
};

// Validadores específicos para cada tipo de análisis
export const validatePhytosanitaryAnalysis = (data: unknown): ValidationResult<Partial<PhytosanitaryAnalysis>> => {
  const errors: ValidationError[] = [];
  
  if (!isValidObject(data)) {
    return {
      success: false,
      errors: [{
        path: [],
        message: 'Expected object',
        code: 'invalid_type',
        expected: 'object',
        received: typeof data
      }]
    };
  }

  const obj = data as Record<string, any>;

  // Validar campos requeridos
  if (!obj.id || !isValidString(obj.id, 1)) {
    errors.push({
      path: ['id'],
      message: 'id is required and must be a non-empty string',
      code: 'invalid_string'
    });
  }

  if (!obj.imageId || !isValidString(obj.imageId, 1)) {
    errors.push({
      path: ['imageId'],
      message: 'imageId is required and must be a non-empty string',
      code: 'invalid_string'
    });
  }

  if (!obj.detections || !isValidArray(obj.detections)) {
    errors.push({
      path: ['detections'],
      message: 'detections is required and must be an array',
      code: 'invalid_type'
    });
  }

  if (!isValidNumber(obj.overallConfidence, 0, 1)) {
    errors.push({
      path: ['overallConfidence'],
      message: 'overallConfidence must be a number between 0 and 1',
      code: 'invalid_range'
    });
  }

  if (!obj.recommendations || !isValidArray(obj.recommendations)) {
    errors.push({
      path: ['recommendations'],
      message: 'recommendations is required and must be an array',
      code: 'invalid_type'
    });
  }

  const validSeverities = ['low', 'medium', 'high', 'critical'];
  if (!obj.severity || !validSeverities.includes(obj.severity)) {
    errors.push({
      path: ['severity'],
      message: `severity must be one of: ${validSeverities.join(', ')}`,
      code: 'invalid_enum'
    });
  }

  const validUrgencies = ['immediate', '24h', '48h', 'weekly'];
  if (!obj.urgency || !validUrgencies.includes(obj.urgency)) {
    errors.push({
      path: ['urgency'],
      message: `urgency must be one of: ${validUrgencies.join(', ')}`,
      code: 'invalid_enum'
    });
  }

  if (!obj.processedAt || !isValidDate(obj.processedAt)) {
    errors.push({
      path: ['processedAt'],
      message: 'processedAt is required and must be a valid Date',
      code: 'invalid_date'
    });
  }

  if (!obj.modelVersion || !isValidString(obj.modelVersion, 1)) {
    errors.push({
      path: ['modelVersion'],
      message: 'modelVersion is required and must be a non-empty string',
      code: 'invalid_string'
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: obj as Partial<PhytosanitaryAnalysis> };
};

export const validatePredictiveAnalysis = (data: unknown): ValidationResult<Partial<PredictiveAnalysis>> => {
  const errors: ValidationError[] = [];
  
  if (!isValidObject(data)) {
    return {
      success: false,
      errors: [{
        path: [],
        message: 'Expected object',
        code: 'invalid_type',
        expected: 'object',
        received: typeof data
      }]
    };
  }

  const obj = data as Record<string, any>;

  // Validar campos requeridos
  if (!obj.id || !isValidString(obj.id, 1)) {
    errors.push({
      path: ['id'],
      message: 'id is required and must be a non-empty string',
      code: 'invalid_string'
    });
  }

  if (!obj.farmId || !isValidString(obj.farmId, 1)) {
    errors.push({
      path: ['farmId'],
      message: 'farmId is required and must be a non-empty string',
      code: 'invalid_string'
    });
  }

  const validPredictionTypes = ['rust', 'borer', 'leaf_spot', 'anthracnose', 'general'];
  if (!obj.predictionType || !validPredictionTypes.includes(obj.predictionType)) {
    errors.push({
      path: ['predictionType'],
      message: `predictionType must be one of: ${validPredictionTypes.join(', ')}`,
      code: 'invalid_enum'
    });
  }

  if (!isValidNumber(obj.riskProbability, 0, 1)) {
    errors.push({
      path: ['riskProbability'],
      message: 'riskProbability must be a number between 0 and 1',
      code: 'invalid_range'
    });
  }

  const validRiskLevels = ['low', 'medium', 'high', 'critical'];
  if (!obj.riskLevel || !validRiskLevels.includes(obj.riskLevel)) {
    errors.push({
      path: ['riskLevel'],
      message: `riskLevel must be one of: ${validRiskLevels.join(', ')}`,
      code: 'invalid_enum'
    });
  }

  if (!obj.estimatedRiskDate || !isValidDate(obj.estimatedRiskDate)) {
    errors.push({
      path: ['estimatedRiskDate'],
      message: 'estimatedRiskDate is required and must be a valid Date',
      code: 'invalid_date'
    });
  }

  if (!isValidNumber(obj.validityDays, 1)) {
    errors.push({
      path: ['validityDays'],
      message: 'validityDays must be a positive number',
      code: 'invalid_number'
    });
  }

  if (!obj.riskFactors || !isValidArray(obj.riskFactors)) {
    errors.push({
      path: ['riskFactors'],
      message: 'riskFactors is required and must be an array',
      code: 'invalid_type'
    });
  }

  if (!obj.preventiveActions || !isValidArray(obj.preventiveActions)) {
    errors.push({
      path: ['preventiveActions'],
      message: 'preventiveActions is required and must be an array',
      code: 'invalid_type'
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: obj as Partial<PredictiveAnalysis> };
};

// Funciones de validación para entrada de usuario
export const validateImageFile = (file: File): ValidationResult<File> => {
  const errors: ValidationError[] = [];
  
  // Validar tipo de archivo
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    errors.push({
      path: ['type'],
      message: `File type must be one of: ${validTypes.join(', ')}`,
      code: 'invalid_file_type'
    });
  }

  // Validar tamaño de archivo (máximo 10MB)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (file.size > maxSize) {
    errors.push({
      path: ['size'],
      message: `File size must be less than ${maxSize / (1024 * 1024)}MB`,
      code: 'file_too_large'
    });
  }

  // Validar tamaño mínimo (1KB)
  const minSize = 1024; // 1KB
  if (file.size < minSize) {
    errors.push({
      path: ['size'],
      message: `File size must be at least ${minSize} bytes`,
      code: 'file_too_small'
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: file };
};

export const validateCoordinates = (lat: number, lng: number): ValidationResult<{ lat: number; lng: number }> => {
  const errors: ValidationError[] = [];

  if (!isValidNumber(lat, -90, 90)) {
    errors.push({
      path: ['latitude'],
      message: 'Latitude must be between -90 and 90',
      code: 'invalid_range'
    });
  }

  if (!isValidNumber(lng, -180, 180)) {
    errors.push({
      path: ['longitude'],
      message: 'Longitude must be between -180 and 180',
      code: 'invalid_range'
    });
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: { lat, lng } };
};

// Funciones de sanitización
export const sanitizeString = (str: string, maxLength: number = 1000): string => {
  return str.trim().substring(0, maxLength);
};

export const sanitizeNumber = (num: number, min?: number, max?: number): number => {
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  return num;
};

export const sanitizeObject = <T extends Record<string, any>>(
  obj: T, 
  allowedKeys: (keyof T)[]
): Partial<T> => {
  const sanitized: Partial<T> = {};
  for (const key of allowedKeys) {
    if (key in obj) {
      sanitized[key] = obj[key];
    }
  }
  return sanitized;
};

// Validadores compuestos
export const createValidationPipeline = <T>(
  validators: Array<(data: unknown) => ValidationResult<T>>
) => {
  return (data: unknown): ValidationResult<T> => {
    for (const validator of validators) {
      const result = validator(data);
      if (!result.success) {
        return result;
      }
    }
    return { success: true, data: data as T };
  };
};

// Esquemas de validación para configuración
export const validateAIConfig = (config: unknown): ValidationResult<Record<string, any>> => {
  const errors: ValidationError[] = [];
  
  if (!isValidObject(config)) {
    return {
      success: false,
      errors: [{
        path: [],
        message: 'Config must be an object',
        code: 'invalid_type'
      }]
    };
  }

  const obj = config as Record<string, any>;

  // Validar configuraciones específicas según el tipo de agente
  if (obj.agentType) {
    switch (obj.agentType) {
      case 'phytosanitary':
        if (obj.confidenceThreshold && !isValidNumber(obj.confidenceThreshold, 0, 1)) {
          errors.push({
            path: ['confidenceThreshold'],
            message: 'confidenceThreshold must be between 0 and 1',
            code: 'invalid_range'
          });
        }
        break;
      case 'predictive':
        if (obj.timeHorizon && !isValidNumber(obj.timeHorizon, 1, 365)) {
          errors.push({
            path: ['timeHorizon'],
            message: 'timeHorizon must be between 1 and 365 days',
            code: 'invalid_range'
          });
        }
        break;
      case 'rag_assistant':
        if (obj.maxSources && !isValidNumber(obj.maxSources, 1, 20)) {
          errors.push({
            path: ['maxSources'],
            message: 'maxSources must be between 1 and 20',
            code: 'invalid_range'
          });
        }
        break;
      case 'optimization':
        if (obj.analysisDepth && !['basic', 'standard', 'comprehensive'].includes(obj.analysisDepth)) {
          errors.push({
            path: ['analysisDepth'],
            message: 'analysisDepth must be basic, standard, or comprehensive',
            code: 'invalid_enum'
          });
        }
        break;
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: obj };
};

// Exportar todos los esquemas
export const AISchemas = {
  AgentType: AgentTypeSchema,
  Priority: PrioritySchema,
  ProcessingStatus: ProcessingStatusSchema,
  AIAnalysisResult: AIAnalysisResultSchema,
  AINotification: AINotificationSchema,
  validatePhytosanitaryAnalysis,
  validatePredictiveAnalysis,
  validateImageFile,
  validateCoordinates,
  validateAIConfig,
  sanitizeString,
  sanitizeNumber,
  sanitizeObject,
  createValidationPipeline
};
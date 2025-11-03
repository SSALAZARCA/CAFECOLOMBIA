// AI Services configuration for CaféColombia PWA
import { AgentType, Priority } from '../types/aiDatabase';

// AI Service configuration interface
export interface AIServiceConfig {
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  modelCacheSize: number;
  enableOfflineMode: boolean;
  enableAnalytics: boolean;
}

// AI Agent configuration
export interface AIAgentConfig {
  type: AgentType;
  enabled: boolean;
  priority: Priority;
  modelVersion: string;
  confidenceThreshold: number;
  processingTimeout: number;
  maxConcurrentRequests: number;
  enableCaching: boolean;
  enableNotifications: boolean;
}

// AI Service endpoints configuration
export interface AIEndpointsConfig {
  phytosanitary: {
    analyze: string;
    models: string;
    history: string;
  };
  predictive: {
    forecast: string;
    alerts: string;
    models: string;
  };
  rag: {
    query: string;
    context: string;
    feedback: string;
  };
  optimization: {
    analyze: string;
    recommendations: string;
    benchmarks: string;
  };
  common: {
    health: string;
    metrics: string;
    status: string;
  };
}

// Get AI service configuration from environment variables
const getAIServiceConfig = (): AIServiceConfig => {
  return {
    baseUrl: import.meta.env.VITE_AI_SERVICE_URL || 'https://ai.cafecolombiaapp.com',
    apiKey: import.meta.env.VITE_AI_API_KEY || '',
    timeout: parseInt(import.meta.env.AI_REQUEST_TIMEOUT || '30000'),
    retryAttempts: 3,
    retryDelay: 1000,
    modelCacheSize: parseInt(import.meta.env.AI_MODEL_CACHE_SIZE || '100'),
    enableOfflineMode: true,
    enableAnalytics: import.meta.env.PERFORMANCE_MONITORING === 'true'
  };
};

// Default AI agents configuration
const getDefaultAIAgentsConfig = (): Record<AgentType, AIAgentConfig> => {
  return {
    phytosanitary: {
      type: 'phytosanitary',
      enabled: true,
      priority: 'high',
      modelVersion: 'v2.1',
      confidenceThreshold: 0.75,
      processingTimeout: 30000,
      maxConcurrentRequests: 3,
      enableCaching: true,
      enableNotifications: true
    },
    predictive: {
      type: 'predictive',
      enabled: true,
      priority: 'medium',
      modelVersion: 'v1.8',
      confidenceThreshold: 0.70,
      processingTimeout: 45000,
      maxConcurrentRequests: 2,
      enableCaching: true,
      enableNotifications: true
    },
    rag: {
      type: 'rag',
      enabled: true,
      priority: 'low',
      modelVersion: 'v1.5',
      confidenceThreshold: 0.60,
      processingTimeout: 15000,
      maxConcurrentRequests: 5,
      enableCaching: true,
      enableNotifications: false
    },
    optimization: {
      type: 'optimization',
      enabled: true,
      priority: 'medium',
      modelVersion: 'v1.3',
      confidenceThreshold: 0.65,
      processingTimeout: 60000,
      maxConcurrentRequests: 1,
      enableCaching: true,
      enableNotifications: true
    }
  };
};

// AI service endpoints configuration
const getAIEndpointsConfig = (): AIEndpointsConfig => {
  const baseUrl = getAIServiceConfig().baseUrl;
  
  return {
    phytosanitary: {
      analyze: `${baseUrl}/api/v1/phytosanitary/analyze`,
      models: `${baseUrl}/api/v1/phytosanitary/models`,
      history: `${baseUrl}/api/v1/phytosanitary/history`
    },
    predictive: {
      forecast: `${baseUrl}/api/v1/predictive/forecast`,
      alerts: `${baseUrl}/api/v1/predictive/alerts`,
      models: `${baseUrl}/api/v1/predictive/models`
    },
    rag: {
      query: `${baseUrl}/api/v1/rag/query`,
      context: `${baseUrl}/api/v1/rag/context`,
      feedback: `${baseUrl}/api/v1/rag/feedback`
    },
    optimization: {
      analyze: `${baseUrl}/api/v1/optimization/analyze`,
      recommendations: `${baseUrl}/api/v1/optimization/recommendations`,
      benchmarks: `${baseUrl}/api/v1/optimization/benchmarks`
    },
    common: {
      health: `${baseUrl}/api/v1/health`,
      metrics: `${baseUrl}/api/v1/metrics`,
      status: `${baseUrl}/api/v1/status`
    }
  };
};

// AI service limits and quotas
export interface AIServiceLimits {
  dailyRequests: number;
  monthlyRequests: number;
  maxImageSize: number; // bytes
  maxBatchSize: number;
  maxConcurrentRequests: number;
  rateLimitPerMinute: number;
}

const getAIServiceLimits = (): AIServiceLimits => {
  return {
    dailyRequests: 1000,
    monthlyRequests: 25000,
    maxImageSize: 10 * 1024 * 1024, // 10MB
    maxBatchSize: 10,
    maxConcurrentRequests: 5,
    rateLimitPerMinute: 60
  };
};

// AI service health check configuration
export interface AIHealthCheckConfig {
  enabled: boolean;
  interval: number; // milliseconds
  timeout: number; // milliseconds
  retryAttempts: number;
  endpoints: string[];
}

const getAIHealthCheckConfig = (): AIHealthCheckConfig => {
  const endpoints = getAIEndpointsConfig();
  
  return {
    enabled: true,
    interval: 300000, // 5 minutes
    timeout: 5000, // 5 seconds
    retryAttempts: 3,
    endpoints: [
      endpoints.common.health,
      endpoints.phytosanitary.models,
      endpoints.predictive.models
    ]
  };
};

// Check if AI services are configured
export const isAIServicesConfigured = (): boolean => {
  const config = getAIServiceConfig();
  return !!(config.baseUrl && config.apiKey);
};

// Validate AI service configuration
export const validateAIServiceConfig = (): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const config = getAIServiceConfig();
  const errors: string[] = [];
  const warnings: string[] = [];

  // In development mode, treat missing configuration as warnings instead of errors
  const isDevelopment = import.meta.env.MODE === 'development';

  // Check required fields
  if (!config.baseUrl) {
    if (isDevelopment) {
      warnings.push('AI service base URL not configured - AI features will be limited');
    } else {
      errors.push('AI service base URL is required');
    }
  }
  
  if (!config.apiKey) {
    if (isDevelopment) {
      warnings.push('AI service API key not configured - AI features will be limited');
    } else {
      errors.push('AI service API key is required');
    }
  }

  // Check URL format
  if (config.baseUrl && !config.baseUrl.startsWith('http')) {
    if (isDevelopment) {
      warnings.push('AI service base URL should start with http or https');
    } else {
      errors.push('AI service base URL must start with http or https');
    }
  }

  // Check timeout values
  if (config.timeout < 5000) {
    warnings.push('AI service timeout is very low (< 5 seconds)');
  }

  if (config.timeout > 120000) {
    warnings.push('AI service timeout is very high (> 2 minutes)');
  }

  // Check cache size
  if (config.modelCacheSize < 10) {
    warnings.push('Model cache size is very small (< 10)');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

// Export configurations
export const aiServiceConfig = getAIServiceConfig();
export const aiAgentsConfig = getDefaultAIAgentsConfig();
export const aiEndpointsConfig = getAIEndpointsConfig();
export const aiServiceLimits = getAIServiceLimits();
export const aiHealthCheckConfig = getAIHealthCheckConfig();

// Export configuration getters for dynamic updates
export {
  getAIServiceConfig,
  getDefaultAIAgentsConfig,
  getAIEndpointsConfig,
  getAIServiceLimits,
  getAIHealthCheckConfig
};

// Default export
export default {
  service: aiServiceConfig,
  agents: aiAgentsConfig,
  endpoints: aiEndpointsConfig,
  limits: aiServiceLimits,
  healthCheck: aiHealthCheckConfig,
  isConfigured: isAIServicesConfigured,
  validate: validateAIServiceConfig
};
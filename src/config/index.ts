// Central configuration file for CaféColombia PWA
// import firebaseConfig from './firebase';
import aiServicesConfig from './aiServices';
import cloudStorageConfig from './cloudStorage';

// Application environment
export type AppEnvironment = 'development' | 'staging' | 'production';

// Main application configuration interface
export interface AppConfig {
  environment: AppEnvironment;
  version: string;
  buildDate: string;
  features: {
    offlineMode: boolean;
    aiServices: boolean;
    pushNotifications: boolean;
    cloudSync: boolean;
    analytics: boolean;
    debugging: boolean;
  };
  api: {
    baseUrl: string;
    timeout: number;
    retryAttempts: number;
  };
  cache: {
    maxSize: number; // MB
    ttl: number; // seconds
    enablePersistence: boolean;
  };
  sync: {
    interval: number; // minutes
    batchSize: number;
    enableAutoSync: boolean;
  };
  notifications: {
    vapidPublicKey: string;
    enableSound: boolean;
    enableVibration: boolean;
    defaultTtl: number; // seconds
  };
}

// Get application environment
const getAppEnvironment = (): AppEnvironment => {
  const env = import.meta.env.MODE || 'development';
  return env as AppEnvironment;
};

// Get application configuration
const getAppConfig = (): AppConfig => {
  const environment = getAppEnvironment();
  const isDevelopment = environment === 'development';
  const isProduction = environment === 'production';

  return {
    environment,
    version: import.meta.env.VITE_APP_VERSION || '1.0.0',
    buildDate: new Date().toISOString(),
    features: {
      offlineMode: true,
      aiServices: !!import.meta.env.VITE_AI_API_KEY,
      pushNotifications: !!import.meta.env.VITE_VAPID_PUBLIC_KEY,
      cloudSync: !!import.meta.env.VITE_API_KEY,
      analytics: isProduction && !!import.meta.env.VITE_ANALYTICS_ID,
      debugging: isDevelopment
    },
    api: {
      baseUrl: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api',
      timeout: 30000,
      retryAttempts: 3
    },
    cache: {
      maxSize: 100, // 100MB
      ttl: 3600, // 1 hour
      enablePersistence: true
    },
    sync: {
      interval: 15, // 15 minutes
      batchSize: 50,
      enableAutoSync: true
    },
    notifications: {
      vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY || '',
      enableSound: true,
      enableVibration: true,
      defaultTtl: 86400 // 24 hours
    }
  };
};

// Configuration validation
export interface ConfigValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  missingFeatures: string[];
}

// Validate all configurations
export const validateConfiguration = (): ConfigValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFeatures: string[] = [];

  // Validate Firebase configuration
  // Firebase is optional for now
  missingFeatures.push('Firebase integration');
  warnings.push('Firebase not configured - push notifications and cloud storage will be limited');

  // Validate AI services configuration
  const aiValidation = aiServicesConfig.validate();
  if (!aiValidation.isValid) {
    missingFeatures.push('AI services');
    // Tratar servicios de IA como opcionales: convertir errores en advertencias
    warnings.push(...aiValidation.errors);
  }
  warnings.push(...aiValidation.warnings);

  // Validate cloud storage configuration
  const storageValidation = cloudStorageConfig.validate();
  if (!storageValidation.isValid) {
    missingFeatures.push('Cloud storage');
    // Tratar storage como opcional en todas las etapas: convertir errores en advertencias
    warnings.push(...storageValidation.errors);
  }
  warnings.push(...storageValidation.warnings);

  // Validate API configuration
  const appConfig = getAppConfig();
  const isDevelopment = appConfig.environment === 'development';

  // In development mode, allow empty baseUrl for Vite proxy
  if (!appConfig.api.baseUrl && !isDevelopment) {
    errors.push('API base URL is required');
  }

  // In development mode, allow empty baseUrl for Vite proxy
  if (appConfig.api.baseUrl && !appConfig.api.baseUrl.startsWith('http') && !isDevelopment) {
    errors.push('API base URL must start with http or https');
  }

  // In development mode, VITE_API_URL can be empty for Vite proxy
  if (!isDevelopment) {
    const requiredEnvVars = ['VITE_API_URL'];
    const missingEnvVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);

    if (missingEnvVars.length > 0) {
      errors.push(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
    }
  } else {
    // In development mode, just warn if VITE_API_URL is not set
    if (!import.meta.env.VITE_API_URL) {
      warnings.push('VITE_API_URL not set - using Vite proxy for API requests');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    missingFeatures
  };
};

// Get configuration summary
export const getConfigurationSummary = () => {
  const appConfig = getAppConfig();
  const validation = validateConfiguration();

  return {
    environment: appConfig.environment,
    version: appConfig.version,
    features: {
      enabled: Object.entries(appConfig.features)
        .filter(([, enabled]) => enabled)
        .map(([feature]) => feature),
      disabled: Object.entries(appConfig.features)
        .filter(([, enabled]) => !enabled)
        .map(([feature]) => feature)
    },
    services: {
      firebase: false, // firebaseConfig.isConfigured(),
      aiServices: aiServicesConfig.isConfigured(),
      cloudStorage: cloudStorageConfig.isConfigured()
    },
    validation: {
      isValid: validation.isValid,
      errorCount: validation.errors.length,
      warningCount: validation.warnings.length,
      missingFeatures: validation.missingFeatures
    }
  };
};

// Initialize all configurations
export const initializeConfiguration = async () => {
  console.log('🚀 Initializing CaféColombia PWA configuration...');

  const summary = getConfigurationSummary();
  console.log('📊 Configuration summary:', summary);

  // Initialize Firebase if configured
  // Firebase is optional for now
  console.warn('⚠️ Firebase not configured - some features will be limited');

  // Validate configuration
  const validation = validateConfiguration();
  if (!validation.isValid) {
    console.error('❌ Configuration validation failed:', validation.errors);

    // In development mode, only warn about missing configurations instead of throwing
    const environment = getAppEnvironment();
    if (environment === 'development') {
      console.warn('⚠️ Running in development mode - continuing despite configuration errors');
    } else {
      throw new Error(`Configuration validation failed: ${validation.errors.join(', ')}`);
    }
  }

  if (validation.warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:', validation.warnings);
  }

  if (validation.missingFeatures.length > 0) {
    console.info('ℹ️ Missing features:', validation.missingFeatures);
  }

  console.log('✅ Configuration initialization completed');
  return summary;
};

// Export individual configurations
export { /* firebaseConfig, */ aiServicesConfig, cloudStorageConfig };

// Export main configuration
export const appConfig = getAppConfig();

// Default export
export default {
  app: appConfig,
  firebase: null, // firebaseConfig,
  aiServices: aiServicesConfig,
  cloudStorage: cloudStorageConfig,
  validate: validateConfiguration,
  getSummary: getConfigurationSummary,
  initialize: initializeConfiguration
};
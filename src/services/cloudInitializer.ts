// Cloud services initializer for CaféColombia PWA
import { initializeConfiguration, getConfigurationSummary } from '../config';
import { apiClient } from './apiClient';
import { getCloudSyncService } from './cloudSync';
import { offlineDB } from '../utils/offlineDB';

// Initialization status interface
export interface InitializationStatus {
  step: string;
  progress: number; // 0-100
  status: 'pending' | 'in_progress' | 'completed' | 'error';
  message: string;
  error?: string;
}

// Initialization result interface
export interface InitializationResult {
  success: boolean;
  steps: InitializationStatus[];
  summary: any;
  errors: string[];
  warnings: string[];
}

// Cloud initializer class
export class CloudInitializer {
  private static instance: CloudInitializer;
  private initializationSteps: InitializationStatus[] = [];
  private onProgressCallback?: (status: InitializationStatus) => void;

  private constructor() {
    this.setupInitializationSteps();
  }

  public static getInstance(): CloudInitializer {
    if (!CloudInitializer.instance) {
      CloudInitializer.instance = new CloudInitializer();
    }
    return CloudInitializer.instance;
  }

  // Set progress callback
  public onProgress(callback: (status: InitializationStatus) => void): void {
    this.onProgressCallback = callback;
  }

  // Setup initialization steps
  private setupInitializationSteps(): void {
    this.initializationSteps = [
      {
        step: 'config-validation',
        progress: 0,
        status: 'pending',
        message: 'Validando configuración...'
      },
      {
        step: 'database-init',
        progress: 0,
        status: 'pending',
        message: 'Inicializando base de datos offline...'
      },
      {
        step: 'firebase-init',
        progress: 0,
        status: 'pending',
        message: 'Inicializando Firebase...'
      },
      {
        step: 'api-client-init',
        progress: 0,
        status: 'pending',
        message: 'Configurando cliente API...'
      },
      {
        step: 'cloud-sync-init',
        progress: 0,
        status: 'pending',
        message: 'Inicializando sincronización cloud...'
      },
      {
        step: 'connectivity-check',
        progress: 0,
        status: 'pending',
        message: 'Verificando conectividad...'
      },
      {
        step: 'service-worker-init',
        progress: 0,
        status: 'pending',
        message: 'Registrando service workers...'
      },
      {
        step: 'initial-sync',
        progress: 0,
        status: 'pending',
        message: 'Realizando sincronización inicial...'
      }
    ];
  }

  // Update step status
  private updateStepStatus(
    stepId: string,
    status: InitializationStatus['status'],
    progress: number,
    message: string,
    error?: string
  ): void {
    const step = this.initializationSteps.find(s => s.step === stepId);
    if (step) {
      step.status = status;
      step.progress = progress;
      step.message = message;
      step.error = error;

      if (this.onProgressCallback) {
        this.onProgressCallback(step);
      }
    }
  }

  // Initialize all cloud services
  public async initialize(): Promise<InitializationResult> {
    console.log('🚀 Starting cloud services initialization...');
    
    const result: InitializationResult = {
      success: true,
      steps: [...this.initializationSteps],
      summary: {},
      errors: [],
      warnings: []
    };

    try {
      // Step 1: Configuration validation
      await this.validateConfiguration(result);

      // Step 2: Database initialization
      await this.initializeDatabase(result);

      // Step 3: Firebase initialization
      await this.initializeFirebase(result);

      // Step 4: API client initialization
      await this.initializeApiClient(result);

      // Step 5: Cloud sync initialization
      await this.initializeCloudSync(result);

      // Step 6: Connectivity check
      await this.checkConnectivity(result);

      // Step 7: Service worker initialization
      await this.initializeServiceWorkers(result);

      // Step 8: Initial sync (if online)
      await this.performInitialSync(result);

      // Get final configuration summary
      result.summary = getConfigurationSummary();

      console.log('✅ Cloud services initialization completed successfully');

    } catch (error) {
      result.success = false;
      const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
      result.errors.push(errorMessage);
      console.error('❌ Cloud services initialization failed:', error);
    }

    return result;
  }

  // Step 1: Validate configuration
  private async validateConfiguration(result: InitializationResult): Promise<void> {
    this.updateStepStatus('config-validation', 'in_progress', 10, 'Validando configuración...');

    try {
      const configSummary = await initializeConfiguration();
      
      // Incluso si la validación no es válida, no bloqueamos producción
      if (!configSummary.validation.isValid) {
        result.warnings.push(...configSummary.validation.errors);
      }

      // Tratar missingFeatures como advertencias y continuar
      result.warnings.push(...configSummary.validation.missingFeatures);
      this.updateStepStatus('config-validation', 'completed', 100, 'Configuración validada con advertencias');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Configuration validation failed';
      result.errors.push(errorMessage);
      this.updateStepStatus('config-validation', 'error', 100, 'Error en validación', errorMessage);
      throw error;
    }
  }

  // Step 2: Initialize database
  private async initializeDatabase(result: InitializationResult): Promise<void> {
    this.updateStepStatus('database-init', 'in_progress', 20, 'Inicializando base de datos...');

    try {
      // Test database connection
      await offlineDB.open();
      
      // Verify tables exist
      const tables = ['aiImages', 'aiAnalysis', 'aiNotifications', 'aiConfigs'];
      for (const table of tables) {
        if (!offlineDB[table as keyof typeof offlineDB]) {
          throw new Error(`Table ${table} not found in database`);
        }
      }

      this.updateStepStatus('database-init', 'completed', 100, 'Base de datos inicializada');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Database initialization failed';
      result.errors.push(errorMessage);
      this.updateStepStatus('database-init', 'error', 100, 'Error en base de datos', errorMessage);
      throw error;
    }
  }

  // Step 3: Initialize Firebase
  private async initializeFirebase(result: InitializationResult): Promise<void> {
    this.updateStepStatus('firebase-init', 'in_progress', 30, 'Inicializando Firebase...');

    try {
      // Firebase is temporarily disabled
      result.warnings.push('Firebase not configured - push notifications will be limited');
      this.updateStepStatus('firebase-init', 'completed', 100, 'Firebase no configurado (opcional)');
      return;

      /*
      const { initializeFirebase, isFirebaseConfigured } = await import('../config/firebase');
      
      if (!isFirebaseConfigured()) {
        result.warnings.push('Firebase not configured - push notifications will be limited');
        this.updateStepStatus('firebase-init', 'completed', 100, 'Firebase no configurado (opcional)');
        return;
      }

      const firebaseServices = await initializeFirebase();
      
      if (!firebaseServices.app) {
        throw new Error('Firebase app initialization failed');
      }

      this.updateStepStatus('firebase-init', 'completed', 100, 'Firebase inicializado');
      */

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Firebase initialization failed';
      result.warnings.push(errorMessage); // Firebase is optional, so treat as warning
      this.updateStepStatus('firebase-init', 'completed', 100, 'Firebase no disponible', errorMessage);
    }
  }

  // Step 4: Initialize API client
  private async initializeApiClient(result: InitializationResult): Promise<void> {
    this.updateStepStatus('api-client-init', 'in_progress', 40, 'Configurando cliente API...');

    try {
      // Set API key if available
      const apiKey = import.meta.env.VITE_API_KEY;
      if (apiKey) {
        apiClient.setApiKey(apiKey);
      }

      this.updateStepStatus('api-client-init', 'completed', 100, 'Cliente API configurado');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'API client initialization failed';
      result.errors.push(errorMessage);
      this.updateStepStatus('api-client-init', 'error', 100, 'Error en cliente API', errorMessage);
      throw error;
    }
  }

  // Step 5: Initialize cloud sync
  private async initializeCloudSync(result: InitializationResult): Promise<void> {
    this.updateStepStatus('cloud-sync-init', 'in_progress', 50, 'Inicializando sincronización...');

    try {
      const cloudSyncService = getCloudSyncService();
      
      // Test sync service
      const syncStatus = await cloudSyncService.getSyncStatus();
      
      this.updateStepStatus('cloud-sync-init', 'completed', 100, 'Sincronización inicializada');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Cloud sync initialization failed';
      // En modo desarrollo, solo advertir sobre errores de sincronización
      if (import.meta.env.DEV) {
        result.warnings.push(`Cloud sync initialization warning: ${errorMessage}`);
        this.updateStepStatus('cloud-sync-init', 'completed', 100, 'Sincronización omitida (backend no disponible)');
      } else {
        result.errors.push(errorMessage);
        this.updateStepStatus('cloud-sync-init', 'error', 100, 'Error en sincronización', errorMessage);
      }
    }
  }

  // Step 6: Check connectivity
  private async checkConnectivity(result: InitializationResult): Promise<void> {
    this.updateStepStatus('connectivity-check', 'in_progress', 60, 'Verificando conectividad...');

    try {
      const isOnline = navigator.onLine;
      
      if (isOnline) {
        // Test API connectivity with timeout
        const healthCheck = await Promise.race([
          apiClient.healthCheck(),
          new Promise<boolean>((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), 5000)
          )
        ]);
        
        if (healthCheck) {
          this.updateStepStatus('connectivity-check', 'completed', 100, 'Conectividad verificada');
        } else {
          // En modo desarrollo, no considerar esto como un error crítico
          if (import.meta.env.DEV) {
            console.log('🔄 [CloudInitializer] Backend no disponible en desarrollo - continuando en modo offline');
            this.updateStepStatus('connectivity-check', 'completed', 100, 'Modo offline (desarrollo)');
          } else {
            result.warnings.push('API server not reachable');
            this.updateStepStatus('connectivity-check', 'completed', 100, 'API no disponible');
          }
        }
      } else {
        result.warnings.push('Device is offline');
        this.updateStepStatus('connectivity-check', 'completed', 100, 'Dispositivo offline');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connectivity check failed';
      
      // En modo desarrollo, silenciar errores de conectividad
      if (import.meta.env.DEV) {
        console.log('🔄 [CloudInitializer] Error de conectividad en desarrollo (ignorado):', errorMessage);
        this.updateStepStatus('connectivity-check', 'completed', 100, 'Modo offline (desarrollo)');
      } else {
        result.warnings.push(errorMessage);
        this.updateStepStatus('connectivity-check', 'completed', 100, 'Conectividad limitada', errorMessage);
      }
    }
  }

  // Step 7: Initialize service workers
  private async initializeServiceWorkers(result: InitializationResult): Promise<void> {
    this.updateStepStatus('service-worker-init', 'in_progress', 70, 'Registrando service workers...');

    try {
      if ('serviceWorker' in navigator) {
        // Register Firebase messaging service worker
        try {
          const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          console.log('Firebase service worker registered:', registration);
        } catch (error) {
          console.warn('Firebase service worker registration failed:', error);
          result.warnings.push('Firebase service worker registration failed');
        }
      } else {
        result.warnings.push('Service workers not supported');
      }

      this.updateStepStatus('service-worker-init', 'completed', 100, 'Service workers registrados');

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Service worker initialization failed';
      result.warnings.push(errorMessage);
      this.updateStepStatus('service-worker-init', 'completed', 100, 'Service workers limitados', errorMessage);
    }
  }

  // Step 8: Perform initial sync
  private async performInitialSync(result: InitializationResult): Promise<void> {
    this.updateStepStatus('initial-sync', 'in_progress', 80, 'Realizando sincronización inicial...');

    try {
      if (!navigator.onLine) {
        this.updateStepStatus('initial-sync', 'completed', 100, 'Sincronización omitida (offline)');
        return;
      }

      const cloudSyncService = getCloudSyncService();
      const syncResult = await cloudSyncService.syncData();

      if (syncResult.success) {
        this.updateStepStatus(
          'initial-sync',
          'completed',
          100,
          `Sincronización completada (${syncResult.uploaded} subidos, ${syncResult.downloaded} descargados)`
        );
      } else {
        // En modo desarrollo, no considerar errores de sincronización como críticos
        if (import.meta.env.DEV && syncResult.errors.some(error => 
          error.includes('Backend service unavailable') || 
          error.includes('Service unavailable in development mode')
        )) {
          console.log('🔄 [CloudInitializer] Sincronización omitida en desarrollo - backend no disponible');
          this.updateStepStatus('initial-sync', 'completed', 100, 'Modo offline (desarrollo)');
        } else {
          result.warnings.push('Initial sync had errors');
          this.updateStepStatus(
            'initial-sync',
            'completed',
            100,
            'Sincronización con errores',
            syncResult.errors.join(', ')
          );
        }
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Initial sync failed';
      
      // En modo desarrollo, silenciar errores de sincronización
      if (import.meta.env.DEV) {
        console.log('🔄 [CloudInitializer] Error de sincronización en desarrollo (ignorado):', errorMessage);
        this.updateStepStatus('initial-sync', 'completed', 100, 'Modo offline (desarrollo)');
      } else {
        result.warnings.push(errorMessage);
        this.updateStepStatus('initial-sync', 'completed', 100, 'Sincronización fallida', errorMessage);
      }
    }
  }

  // Get current initialization status
  public getInitializationStatus(): InitializationStatus[] {
    return [...this.initializationSteps];
  }

  // Reset initialization state
  public reset(): void {
    this.setupInitializationSteps();
  }
}

// Export singleton instance
export const cloudInitializer = CloudInitializer.getInstance();

// Export default
export default cloudInitializer;
import React from 'react';
import { toast } from 'sonner';

export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  retryCount: number;
  error?: string;
  currentUrl?: string;
}

export interface BackendHealthResponse {
  status: 'healthy' | 'unhealthy';
  message: string;
  timestamp: string;
  version?: string;
  environment?: string;
}

class BackendConnectionService {
  private connectionStatus: ConnectionStatus = {
    isConnected: false,
    lastChecked: new Date(),
    retryCount: 0
  };

  private healthCheckInterval: NodeJS.Timeout | null = null;
  private retryTimeout: NodeJS.Timeout | null = null;
  private maxRetries = 5;
  private retryDelay = 5000; // 5 segundos
  private healthCheckInterval_ms = 30000; // 30 segundos
  private isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

<<<<<<< HEAD
  // URLs de fallback para diferentes entornos
  private baseUrls = [
    // Construir base /api con robustez: si VITE_API_URL ya termina en /api, usar tal cual; si no, agregar /api
    (() => {
      const raw = import.meta.env.VITE_API_URL;
      if (raw && raw.startsWith('http')) {
        const normalized = raw.replace(/\/$/, '');
        return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
      }
      return `${window.location.origin.replace(/\/$/, '')}/api`;
    })()
  ].filter((url, index, arr) => arr.indexOf(url) === index);

  private currentBaseUrl = this.baseUrls[0];
  private healthEndpoint = '/health';
=======
  // Usar VITE_API_BASE_URL si está definido; en su defecto, rutas relativas para proxy de Vite
  // En desarrollo usar rutas relativas para aprovechar el proxy de Vite
  private baseUrl = ((import.meta.env.VITE_API_BASE_URL || '') && !this.isDevelopment) ? import.meta.env.VITE_API_BASE_URL : '';
  private healthEndpoint = '/api/ping';
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad

  constructor() {
    // En modo desarrollo, reducir la frecuencia de health checks
    if (this.isDevelopment) {
      this.healthCheckInterval_ms = 60000; // 1 minuto en desarrollo
      this.maxRetries = 2; // Menos reintentos en desarrollo
    }

    console.log('🔧 BackendConnectionService initialized');
    console.log('🔧 Available URLs:', this.baseUrls);
    console.log('🔧 Current URL:', this.currentBaseUrl);
    console.log('🔧 Environment:', this.isDevelopment ? 'development' : 'production');

    // DESACTIVAR COMPLETAMENTE todos los event listeners automáticos en desarrollo
    if (!this.isDevelopment) {
      this.setupEventListeners();
    }

    // En desarrollo, no iniciar health check automáticamente para evitar errores ERR_ABORTED
    if (!this.isDevelopment) {
      setTimeout(() => {
        this.startHealthCheck();
      }, 2000);
    }
  }

  /**
   * Probar múltiples URLs hasta encontrar una que funcione
   */
  private async tryMultipleUrls(): Promise<{ success: boolean; url?: string; response?: Response; error?: string }> {
    // En desarrollo, no hacer peticiones para evitar ERR_ABORTED
    if (this.isDevelopment) {
      console.log('🔧 tryMultipleUrls skipped in development mode');
      return {
        success: true,
        url: this.currentBaseUrl,
        response: new Response(JSON.stringify({ status: 'healthy', message: 'Development mode' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      };
    }

    for (const baseUrl of this.baseUrls) {
      try {
        if (this.isDevelopment) {
          console.log(`🔧 Trying URL: ${baseUrl}${this.healthEndpoint}`);
        }

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // Reducir timeout a 5 segundos

        const response = await fetch(`${baseUrl}${this.healthEndpoint}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (response.ok) {
          if (this.isDevelopment) {
            console.log(`✅ Success with URL: ${baseUrl}`);
          }
          this.currentBaseUrl = baseUrl;
          return { success: true, url: baseUrl, response };
        } else {
          if (this.isDevelopment) {
            console.log(`⚠️ Failed with URL: ${baseUrl} - Status: ${response.status}`);
          }
        }
      } catch (error: any) {
        // Silenciar errores de red comunes en desarrollo
        if (this.isDevelopment && (error.name === 'AbortError' || error.message.includes('ERR_ABORTED'))) {
          // No mostrar estos errores en desarrollo
        } else if (this.isDevelopment) {
          console.log(`⚠️ Error with URL: ${baseUrl} - ${error.message}`);
        }
      }
    }

    return { success: false, error: 'All URLs failed' };
  }

  /**
   * Verificar el estado de salud del backend
   */
  async checkHealth(): Promise<ConnectionStatus> {
    // En desarrollo, no hacer peticiones automáticas para evitar ERR_ABORTED
    if (this.isDevelopment) {
      console.log('🔧 Health check skipped in development mode');
      return {
        isConnected: true, // Asumir conectado en desarrollo
        lastChecked: new Date(),
        retryCount: 0,
        currentUrl: this.currentBaseUrl
      };
    }

    try {
      const result = await this.tryMultipleUrls();

<<<<<<< HEAD
      if (result.success && result.response) {
        const healthData: BackendHealthResponse = await result.response.json();
=======
      // Elegir endpoint según configuración: si hay baseUrl, usarla; si no, ruta relativa para proxy
      const healthUrl = this.baseUrl
        ? `${this.baseUrl}${this.healthEndpoint}`
        : this.healthEndpoint;
      const response = await fetch(healthUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad

        this.connectionStatus = {
          isConnected: true,
          lastChecked: new Date(),
          retryCount: 0,
          currentUrl: result.url
        };

        // Si acabamos de reconectar después de errores
        if (this.connectionStatus.retryCount > 0) {
          console.log('✅ Backend connection restored');
          if (!this.isDevelopment) {
            toast.success('Conexión al servidor restaurada', {
              description: `Conectado a: ${result.url}`
            });
          }
        }

        console.log('✅ Backend health check successful:', {
          url: result.url,
          status: healthData.status,
          environment: healthData.environment
        });

        return this.connectionStatus;
      } else {
        // No lanzar error, solo actualizar el estado
        const errorMessage = result.error || 'All connection attempts failed';

        this.connectionStatus = {
          isConnected: false,
          lastChecked: new Date(),
          retryCount: this.connectionStatus.retryCount + 1,
          error: errorMessage,
          currentUrl: this.currentBaseUrl
        };

        console.warn(`⚠️ Backend health check failed (attempt ${this.connectionStatus.retryCount}):`, {
          error: errorMessage,
          triedUrls: this.baseUrls,
          currentUrl: this.currentBaseUrl
        });

        return this.connectionStatus;
      }
    } catch (error: any) {
<<<<<<< HEAD
      const errorMessage = this.getErrorMessage(error);

=======
      // Manejo específico para AbortError y fallos de red en desarrollo
      const isAbort = error?.name === 'AbortError';
      const errorMessage = isAbort ? 'Solicitud de salud abortada por timeout' : this.getErrorMessage(error);
      
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
      this.connectionStatus = {
        isConnected: false,
        lastChecked: new Date(),
        retryCount: this.connectionStatus.retryCount + 1,
        error: errorMessage,
        currentUrl: this.currentBaseUrl
      };

      console.warn(`⚠️ Backend health check failed (attempt ${this.connectionStatus.retryCount}):`, {
        error: errorMessage,
        triedUrls: this.baseUrls,
        currentUrl: this.currentBaseUrl
      });

<<<<<<< HEAD
      // Solo mostrar toast en producción y después de varios intentos
      if (!this.isDevelopment && this.connectionStatus.retryCount > 3 && this.connectionStatus.retryCount % 5 === 0) {
=======
      // Solo mostrar toast en producción o en el primer error en desarrollo
      if (!this.isDevelopment && !isAbort && (this.connectionStatus.retryCount === 1 || this.connectionStatus.retryCount % 5 === 0)) {
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
        toast.error('Error de conexión al servidor', {
          description: `${errorMessage}. Probando URLs alternativas...`,
          duration: 5000
        });
      }

      return this.connectionStatus;
    }
  }

  /**
   * Obtener el estado actual de la conexión
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  /**
   * Verificar si el backend está disponible
   */
  isBackendAvailable(): boolean {
    return this.connectionStatus.isConnected;
  }

  /**
   * Realizar una petición con fallback automático
   */
  async fetchWithFallback<T>(
    endpoint: string,
    options: RequestInit = {},
    fallbackData?: T
  ): Promise<{ data: T | null; fromCache: boolean; error?: string }> {
    try {
      // Verificar conexión primero
      if (!this.connectionStatus.isConnected) {
        console.log('🔧 Connection not established, checking health...');
        // En desarrollo, no hacer peticiones para evitar ERR_ABORTED
        if (!this.isDevelopment) {
          await this.checkHealth();
        }
      }

      if (!this.connectionStatus.isConnected) {
        throw new Error('Backend not available after health check');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

<<<<<<< HEAD
      const fullUrl = `${this.currentBaseUrl}${endpoint}`;
      console.log(`🔧 Making request to: ${fullUrl}`);

      const response = await fetch(fullUrl, {
=======
      const response = await fetch(`${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, {
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ Request successful: ${fullUrl}`);
      return { data, fromCache: false };

    } catch (error: any) {
      console.warn(`🔄 API request failed for ${endpoint}:`, error.message);

      // Intentar obtener datos del cache/localStorage
      const cachedData = this.getCachedData<T>(endpoint);
      if (cachedData) {
        console.log(`📦 Using cached data for ${endpoint}`);
        return { data: cachedData, fromCache: true };
      }

      // Usar datos de fallback si están disponibles
      if (fallbackData) {
        console.log(`🔄 Using fallback data for ${endpoint}`);
        return { data: fallbackData, fromCache: false };
      }

      return { data: null, fromCache: false, error: error.message };
    }
  }

  /**
   * Guardar datos en cache para uso offline
   */
  setCachedData<T>(endpoint: string, data: T): void {
    try {
      const cacheKey = `api_cache_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const cacheData = {
        data,
        timestamp: Date.now(),
        endpoint
      };
      localStorage.setItem(cacheKey, JSON.stringify(cacheData));
    } catch (error) {
      console.warn('Failed to cache data:', error);
    }
  }

  /**
   * Obtener datos del cache
   */
  getCachedData<T>(endpoint: string): T | null {
    try {
      const cacheKey = `api_cache_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const cached = localStorage.getItem(cacheKey);

      if (cached) {
        const cacheData = JSON.parse(cached);
        const age = Date.now() - cacheData.timestamp;
        const maxAge = 5 * 60 * 1000; // 5 minutos

        if (age < maxAge) {
          return cacheData.data;
        } else {
          localStorage.removeItem(cacheKey);
        }
      }
    } catch (error) {
      console.warn('Failed to get cached data:', error);
    }

    return null;
  }

  /**
   * Iniciar verificaciones periódicas de salud
   */
  private startHealthCheck(): void {
    // Verificación inicial
    this.checkHealth();

    // Verificaciones periódicas
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, this.healthCheckInterval_ms);
  }

  /**
   * Configurar event listeners
   */
  private setupEventListeners(): void {
    // Verificar conexión cuando la ventana recupera el foco
    window.addEventListener('focus', () => {
      if (!this.connectionStatus.isConnected) {
        console.log('🔧 Window focused, checking connection...');
        this.checkHealth();
      }
    });

    // Verificar conexión cuando se restaura la conectividad
    window.addEventListener('online', () => {
      console.log('🔧 Network online, checking connection...');
      this.checkHealth();
    });

    // Manejar pérdida de conectividad
    window.addEventListener('offline', () => {
      console.log('🔧 Network offline');
      this.connectionStatus.isConnected = false;
      this.connectionStatus.error = 'Network offline';
    });
  }

  /**
   * Obtener mensaje de error legible
   */
  private getErrorMessage(error: any): string {
    if (error.name === 'AbortError') {
      return 'Timeout de conexión';
    }

    if (error.message?.includes('fetch')) {
      return 'Error de red - servidor no disponible';
    }

    if (error.message?.includes('CORS')) {
      return 'Error de CORS - configuración del servidor';
    }

    return error.message || 'Error desconocido';
  }

  /**
   * Método público para obtener la URL base actual
   */
  getCurrentBaseUrl(): string {
    return this.currentBaseUrl || this.baseUrls[0];
  }

  /**
   * Método público para inicializar la conexión manualmente
   */
  public async initializeConnection(): Promise<boolean> {
    try {
      const result = await this.tryMultipleUrls();
      if (result.success) {
        this.connectionStatus.isConnected = true;
        this.connectionStatus.retryCount = 0;
        return true;
      }
      return false;
    } catch (error) {
      console.warn('Error initializing connection:', error);
      return false;
    }
  }

  /**
   * Limpiar recursos
   */
  destroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  /**
   * Obtener información de debug
   */
  getDebugInfo(): any {
    return {
      connectionStatus: this.connectionStatus,
      availableUrls: this.baseUrls,
      currentUrl: this.currentBaseUrl,
      isDevelopment: this.isDevelopment,
      environment: import.meta.env.MODE,
      viteApiUrl: import.meta.env.VITE_API_URL
    };
  }
}

// Instancia singleton
const backendConnectionService = new BackendConnectionService();

// Hook personalizado para usar el servicio de conexión
export const useBackendConnection = () => {
  const [connectionStatus, setConnectionStatus] = React.useState<ConnectionStatus>(() => {
    // En desarrollo, simular estado conectado para evitar health checks
    const isDev = import.meta.env.DEV;
    if (isDev) {
      return {
        isConnected: true,
        lastChecked: new Date(),
        retryCount: 0,
        currentUrl: '/api'
      };
    }
    return backendConnectionService.getConnectionStatus();
  });

  React.useEffect(() => {
    const isDev = import.meta.env.DEV;

    if (isDev) {
      // En desarrollo, no hacer polling automático
      return;
    }

    // Actualizar el estado inicial
    setConnectionStatus(backendConnectionService.getConnectionStatus());

    // Configurar un intervalo para actualizar el estado
    const interval = setInterval(() => {
      setConnectionStatus(backendConnectionService.getConnectionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const checkHealth = React.useCallback(async () => {
    const status = await backendConnectionService.checkHealth();
    setConnectionStatus(status);
    return status;
  }, []);

  return {
    isConnected: connectionStatus.isConnected,
    lastChecked: connectionStatus.lastChecked,
    retryCount: connectionStatus.retryCount,
    error: connectionStatus.error,
    currentUrl: connectionStatus.currentUrl,
    checkHealth,
    isAvailable: () => backendConnectionService.isBackendAvailable(),
    fetchWithFallback: backendConnectionService.fetchWithFallback.bind(backendConnectionService),
    getDebugInfo: () => backendConnectionService.getDebugInfo()
  };
};

export default backendConnectionService;
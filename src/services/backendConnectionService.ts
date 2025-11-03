import React from 'react';
import { toast } from 'sonner';

export interface ConnectionStatus {
  isConnected: boolean;
  lastChecked: Date;
  retryCount: number;
  error?: string;
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

  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  private healthEndpoint = '/api/health';

  constructor() {
    // En modo desarrollo, reducir la frecuencia de health checks
    if (this.isDevelopment) {
      this.healthCheckInterval_ms = 60000; // 1 minuto en desarrollo
      this.maxRetries = 2; // Menos reintentos en desarrollo
    }
    
    this.startHealthCheck();
    this.setupEventListeners();
  }

  /**
   * Verificar el estado de salud del backend
   */
  async checkHealth(): Promise<ConnectionStatus> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

      const response = await fetch(`${this.baseUrl}${this.healthEndpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const healthData: BackendHealthResponse = await response.json();
        
        this.connectionStatus = {
          isConnected: true,
          lastChecked: new Date(),
          retryCount: 0
        };

        // Si acabamos de reconectar después de errores
        if (this.connectionStatus.retryCount > 0) {
          console.log('✅ Backend connection restored');
          toast.success('Conexión al servidor restaurada', {
            description: 'Todos los servicios están funcionando correctamente'
          });
        }

        return this.connectionStatus;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      const errorMessage = this.getErrorMessage(error);
      
      this.connectionStatus = {
        isConnected: false,
        lastChecked: new Date(),
        retryCount: this.connectionStatus.retryCount + 1,
        error: errorMessage
      };

      // En modo desarrollo, ser menos ruidoso con los errores
      if (this.isDevelopment) {
        // Solo logear el primer error en desarrollo
        if (this.connectionStatus.retryCount === 1) {
          console.log(`🔄 Backend not available in development mode - running offline`);
        }
      } else {
        console.warn(`❌ Backend health check failed (attempt ${this.connectionStatus.retryCount}):`, errorMessage);
      }

      // Solo mostrar toast en producción o en el primer error en desarrollo
      if (!this.isDevelopment && (this.connectionStatus.retryCount === 1 || this.connectionStatus.retryCount % 5 === 0)) {
        toast.error('Error de conexión al servidor', {
          description: `${errorMessage}. Reintentando...`,
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
        await this.checkHealth();
      }

      if (!this.connectionStatus.isConnected) {
        throw new Error('Backend not available');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 segundos

      const response = await fetch(`${this.baseUrl}${endpoint}`, {
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
  private getCachedData<T>(endpoint: string): T | null {
    try {
      const cacheKey = `api_cache_${endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (!cached) return null;

      const cacheData = JSON.parse(cached);
      const maxAge = 30 * 60 * 1000; // 30 minutos
      
      if (Date.now() - cacheData.timestamp > maxAge) {
        localStorage.removeItem(cacheKey);
        return null;
      }

      return cacheData.data;
    } catch (error) {
      console.warn('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Iniciar verificación periódica de salud
   */
  private startHealthCheck(): void {
    // Verificación inicial
    this.checkHealth();

    // Verificación periódica
    this.healthCheckInterval = setInterval(() => {
      this.checkHealth();
    }, this.healthCheckInterval_ms);
  }

  /**
   * Configurar listeners de eventos
   */
  private setupEventListeners(): void {
    // Verificar cuando se restaura la conexión a internet
    window.addEventListener('online', () => {
      console.log('🌐 Internet connection restored, checking backend...');
      setTimeout(() => this.checkHealth(), 1000);
    });

    // Pausar verificaciones cuando se pierde la conexión
    window.addEventListener('offline', () => {
      console.log('🌐 Internet connection lost');
      this.connectionStatus.isConnected = false;
    });

    // Verificar cuando la página vuelve a estar visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && navigator.onLine) {
        this.checkHealth();
      }
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
    
    if (error.message?.includes('ECONNREFUSED')) {
      return 'Conexión rechazada - servidor offline';
    }
    
    return error.message || 'Error desconocido';
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
   * Reiniciar el servicio
   */
  restart(): void {
    this.destroy();
    this.connectionStatus = {
      isConnected: false,
      lastChecked: new Date(),
      retryCount: 0
    };
    this.startHealthCheck();
  }
}

// Instancia singleton
export const backendConnectionService = new BackendConnectionService();

// Hook para usar en componentes React
export const useBackendConnection = () => {
  const [status, setStatus] = React.useState<ConnectionStatus>(
    backendConnectionService.getConnectionStatus()
  );

  React.useEffect(() => {
    const interval = setInterval(() => {
      setStatus(backendConnectionService.getConnectionStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    ...status,
    checkHealth: () => backendConnectionService.checkHealth(),
    fetchWithFallback: backendConnectionService.fetchWithFallback.bind(backendConnectionService),
    isAvailable: backendConnectionService.isBackendAvailable()
  };
};

export default backendConnectionService;
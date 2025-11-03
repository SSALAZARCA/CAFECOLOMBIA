import { backendConnectionService } from './backendConnectionService';

export interface ApiResponse<T> {
  data: T | null;
  fromCache: boolean;
  error?: string;
  success: boolean;
}

class ApiService {
  private baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

  /**
   * Realizar petición GET con fallback automático
   */
  async get<T>(endpoint: string, fallbackData?: T): Promise<ApiResponse<T>> {
    try {
      const result = await backendConnectionService.fetchWithFallback<T>(
        endpoint,
        { method: 'GET' },
        fallbackData
      );

      // Guardar en cache si la petición fue exitosa
      if (result.data && !result.fromCache) {
        backendConnectionService.setCachedData(endpoint, result.data);
      }

      return {
        data: result.data,
        fromCache: result.fromCache,
        error: result.error,
        success: result.data !== null
      };
    } catch (error: any) {
      console.error(`API GET error for ${endpoint}:`, error);
      return {
        data: fallbackData || null,
        fromCache: false,
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Realizar petición POST con fallback automático
   */
  async post<T>(endpoint: string, data: any, fallbackData?: T): Promise<ApiResponse<T>> {
    try {
      const result = await backendConnectionService.fetchWithFallback<T>(
        endpoint,
        {
          method: 'POST',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        fallbackData
      );

      return {
        data: result.data,
        fromCache: result.fromCache,
        error: result.error,
        success: result.data !== null
      };
    } catch (error: any) {
      console.error(`API POST error for ${endpoint}:`, error);
      return {
        data: fallbackData || null,
        fromCache: false,
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Realizar petición PUT con fallback automático
   */
  async put<T>(endpoint: string, data: any, fallbackData?: T): Promise<ApiResponse<T>> {
    try {
      const result = await backendConnectionService.fetchWithFallback<T>(
        endpoint,
        {
          method: 'PUT',
          body: JSON.stringify(data),
          headers: {
            'Content-Type': 'application/json',
          },
        },
        fallbackData
      );

      return {
        data: result.data,
        fromCache: result.fromCache,
        error: result.error,
        success: result.data !== null
      };
    } catch (error: any) {
      console.error(`API PUT error for ${endpoint}:`, error);
      return {
        data: fallbackData || null,
        fromCache: false,
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Realizar petición DELETE con fallback automático
   */
  async delete<T>(endpoint: string, fallbackData?: T): Promise<ApiResponse<T>> {
    try {
      const result = await backendConnectionService.fetchWithFallback<T>(
        endpoint,
        { method: 'DELETE' },
        fallbackData
      );

      return {
        data: result.data,
        fromCache: result.fromCache,
        error: result.error,
        success: result.data !== null
      };
    } catch (error: any) {
      console.error(`API DELETE error for ${endpoint}:`, error);
      return {
        data: fallbackData || null,
        fromCache: false,
        error: error.message,
        success: false
      };
    }
  }

  /**
   * Verificar si el backend está disponible
   */
  isBackendAvailable(): boolean {
    return backendConnectionService.isBackendAvailable();
  }

  /**
   * Obtener estado de la conexión
   */
  getConnectionStatus() {
    return backendConnectionService.getConnectionStatus();
  }

  /**
   * Forzar verificación de salud del backend
   */
  async checkHealth() {
    return await backendConnectionService.checkHealth();
  }
}

// Instancia singleton
export const apiService = new ApiService();

// Datos de fallback para diferentes endpoints
export const fallbackData = {
  // Datos de ejemplo para fincas
  fincas: [],
  
  // Datos de ejemplo para lotes
  lotes: [],
  
  // Datos de ejemplo para cultivos
  cultivos: [
    {
      id: 'cafe-arabica',
      nombre: 'Café Arábica',
      variedad: 'Típica',
      cicloVida: 365,
      requerimientosAgua: 1200,
      requerimientosFertilizante: {
        nitrogeno: 150,
        fosforo: 50,
        potasio: 100
      }
    }
  ],
  
  // Datos de ejemplo para análisis económico
  economicAnalysis: {
    currentCosts: {
      water: 0,
      fertilizer: 0,
      pesticide: 0,
      total: 0
    },
    optimizedCosts: {
      water: 0,
      fertilizer: 0,
      pesticide: 0,
      total: 0
    },
    roiAnalysis: {
      roi: 0,
      paybackPeriod: 0
    },
    recommendations: []
  },
  
  // Datos de ejemplo para alertas
  alertas: [],
  
  // Datos de ejemplo para trazabilidad
  trazabilidad: [],
  
  // Datos de ejemplo para insumos
  insumos: [],
  
  // Datos de ejemplo para MIP
  mip: {
    plagas: [],
    enfermedades: [],
    tratamientos: []
  }
};

export default apiService;
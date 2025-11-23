// API Client service for CaféColombia PWA
import { appConfig } from '../config';

// API response interface
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// API error interface
export interface ApiError {
  code: string;
  message: string;
  details?: any;
  timestamp: string;
  requestId?: string;
}

// Request options interface
export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: any;
  timeout?: number;
  retries?: number;
  cache?: boolean;
  signal?: AbortSignal;
}

// API endpoints configuration
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/api/auth/login',
    logout: '/api/auth/logout',
    refresh: '/api/auth/refresh',
    profile: '/api/auth/profile'
  },
  
  // Farm management
  farms: {
    list: '/api/farms',
    create: '/api/farms',
    get: (id: string) => `/api/farms/${id}`,
    update: (id: string) => `/api/farms/${id}`,
    delete: (id: string) => `/api/farms/${id}`
  },
  
  // Lot management
  lots: {
    list: (farmId: string) => `/api/farms/${farmId}/lots`,
    create: (farmId: string) => `/api/farms/${farmId}/lots`,
    get: (farmId: string, lotId: string) => `/api/farms/${farmId}/lots/${lotId}`,
    update: (farmId: string, lotId: string) => `/api/farms/${farmId}/lots/${lotId}`,
    delete: (farmId: string, lotId: string) => `/api/farms/${farmId}/lots/${lotId}`
  },
  
  // AI Services
  ai: {
    // Phytosanitary analysis
    phytosanitary: {
      analyze: '/api/ai/phytosanitary/analyze',
      history: '/api/ai/phytosanitary/history',
      result: (id: string) => `/api/ai/phytosanitary/result/${id}`
    },
    
    // Predictive analysis
    predictive: {
      forecast: '/api/ai/predictive/forecast',
      alerts: '/api/ai/predictive/alerts',
      history: '/api/ai/predictive/history'
    },
    
    // RAG Assistant
    rag: {
      query: '/api/ai/rag/query',
      context: '/api/ai/rag/context',
      feedback: '/api/ai/rag/feedback'
    },
    
    // Optimization
    optimization: {
      analyze: '/api/ai/optimization/analyze',
      recommendations: '/api/ai/optimization/recommendations',
      benchmarks: '/api/ai/optimization/benchmarks'
    },
    
    // Common AI endpoints
    status: '/api/ai/status',
    metrics: '/api/ai/metrics',
    models: '/api/ai/models'
  },
  
  // File management
  files: {
    upload: '/api/files/upload',
    download: (id: string) => `/api/files/${id}`,
    delete: (id: string) => `/api/files/${id}`,
    metadata: (id: string) => `/api/files/${id}/metadata`
  },
  
  // Sync endpoints
  sync: {
    status: '/api/sync/status',
    upload: '/api/sync/upload',
    download: '/api/sync/download',
    conflicts: '/api/sync/conflicts'
  },
  
  // Notifications
  notifications: {
    list: '/api/notifications',
    mark_read: (id: string) => `/api/notifications/${id}/read`,
    subscribe: '/api/notifications/subscribe',
    unsubscribe: '/api/notifications/unsubscribe'
  },
  
  // System
  system: {
    health: '/api/ping',
    version: '/api/version',
    config: '/api/config'
  }
} as const;

// API Client class
export class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;
  private timeout: number;
  private retryAttempts: number;

  constructor() {
    this.baseUrl = appConfig.api.baseUrl;
    this.timeout = appConfig.api.timeout;
    this.retryAttempts = appConfig.api.retryAttempts;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.defaultHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  removeAuthToken(): void {
    delete this.defaultHeaders['Authorization'];
  }

  // Set API key
  setApiKey(apiKey: string): void {
    this.defaultHeaders['X-API-Key'] = apiKey;
  }

  // Make HTTP request with retry logic
  private async makeRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      method = 'GET',
      headers = {},
      body,
      timeout = this.timeout,
      retries = this.retryAttempts,
      signal
    } = options;

    // Use relative URLs in development to leverage Vite proxy
    const isDev = import.meta.env.MODE === 'development' || import.meta.env.DEV;
    const url = isDev ? endpoint : `${this.baseUrl}${endpoint}`;
    const requestHeaders = { ...this.defaultHeaders, ...headers };

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    // Use provided signal or create new one
    const requestSignal = signal || controller.signal;

    const requestOptions: RequestInit = {
      method,
      headers: requestHeaders,
      signal: requestSignal
    };

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      if (body instanceof FormData) {
        // Remove Content-Type for FormData (browser will set it with boundary)
        delete requestOptions.headers!['Content-Type'];
        requestOptions.body = body;
      } else {
        requestOptions.body = JSON.stringify(body);
      }
    }

    let lastError: Error | null = null;

    // Check if this is a backend connection in development mode
    const isDevelopment = import.meta.env.DEV || process.env.NODE_ENV === 'development';
    const isBackendUrl = url.includes('/api/');

    // Retry logic
    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const response = await fetch(url, requestOptions);
        clearTimeout(timeoutId);

        // Handle HTTP errors
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
        }

        // Parse response
        const data = await response.json();
        
        return {
          success: true,
          data: data.data || data,
          message: data.message,
          timestamp: new Date().toISOString(),
          requestId: response.headers.get('X-Request-ID') || undefined
        };

      } catch (error) {
        lastError = error as Error;
        
        // Check if this is a connection error
        const isConnectionError = error instanceof Error && (
          error.message.includes('ERR_CONNECTION_REFUSED') ||
          error.message.includes('Failed to fetch') ||
          error.message.includes('NetworkError') ||
          error.message.includes('fetch') ||
          error.name === 'TypeError'
        );
        
        // In development mode, silently handle backend connection errors
        if (isDevelopment && isConnectionError && isBackendUrl) {
          // Don't log errors to console, just return offline response
          clearTimeout(timeoutId);
          return {
            success: false,
            error: 'offline_mode',
            message: 'Backend service unavailable - running in offline mode',
            timestamp: new Date().toISOString()
          };
        }
        
        // Don't retry on abort or certain errors
        if (error instanceof Error) {
          if (error.name === 'AbortError' || 
              error.message.includes('401') || 
              error.message.includes('403')) {
            break;
          }
        }

        // For connection errors to backend in development, don't retry
        if (isDevelopment && isConnectionError && isBackendUrl) {
          break;
        }

        // Wait before retry (exponential backoff)
        if (attempt < retries) {
          const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s, etc.
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    clearTimeout(timeoutId);

    // Return error response
    const errorMessage = isDevelopment && isBackendUrl ? 'offline_mode' : (lastError?.message || 'Unknown error occurred');
    return {
      success: false,
      error: errorMessage,
      message: isDevelopment && isBackendUrl ? 'Backend service unavailable - running in offline mode' : undefined,
      timestamp: new Date().toISOString()
    };
  }

  // GET request
  async get<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'POST', body });
  }

  // PUT request
  async put<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PUT', body });
  }

  // PATCH request
  async patch<T>(endpoint: string, body?: any, options?: Omit<RequestOptions, 'method'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'PATCH', body });
  }

  // DELETE request
  async delete<T>(endpoint: string, options?: Omit<RequestOptions, 'method' | 'body'>): Promise<ApiResponse<T>> {
    return this.makeRequest<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Upload file
  async uploadFile<T>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);

    // Add additional data
    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, typeof value === 'string' ? value : JSON.stringify(value));
      });
    }

    // TODO: Implement progress tracking with XMLHttpRequest if needed
    return this.post<T>(endpoint, formData);
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.get(API_ENDPOINTS.system.health, { timeout: 3000, retries: 0 });
      return response.success;
    } catch {
      // Silently fail in development mode
      return false;
    }
  }

  // Get API status
  async getStatus(): Promise<ApiResponse<any>> {
    return this.get(API_ENDPOINTS.system.health);
  }
}

// Create singleton instance
export const apiClient = new ApiClient();

// Export default instance
export default apiClient;
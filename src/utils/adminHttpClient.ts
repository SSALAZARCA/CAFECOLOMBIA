// =====================================================
// CLIENTE HTTP PARA PANEL DE ADMINISTRACIÓN
// Interceptores y manejo de errores centralizado
// =====================================================

import { toast } from 'sonner';

// =====================================================
// TIPOS
// =====================================================

interface RequestConfig extends RequestInit {
  skipAuth?: boolean;
  skipErrorToast?: boolean;
  timeout?: number;
}

interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

interface RefreshTokenResponse {
  token: string;
  expires_at: string;
}

// =====================================================
// CONFIGURACIÓN
// =====================================================

const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://api.cafecolombiaapp.com' 
  : 'http://localhost:3001';

const DEFAULT_TIMEOUT = 30000; // 30 segundos

// =====================================================
// GESTIÓN DE TOKENS
// =====================================================

class TokenManager {
  private static instance: TokenManager;
  private token: string | null = null;
  private refreshPromise: Promise<string> | null = null;

  static getInstance(): TokenManager {
    if (!TokenManager.instance) {
      TokenManager.instance = new TokenManager();
    }
    return TokenManager.instance;
  }

  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('admin_token', token);
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('admin_token');
    }
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_refresh_token');
  }

  async refreshToken(): Promise<string> {
    // Evitar múltiples llamadas simultáneas de refresh
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = this.performRefresh();
    
    try {
      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      return newToken;
    } catch (error) {
      this.refreshPromise = null;
      throw error;
    }
  }

  private async performRefresh(): Promise<string> {
    const refreshToken = localStorage.getItem('admin_refresh_token');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await fetch(`${API_BASE_URL}/api/auth/admin/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      this.clearToken();
      // Redirigir al login
      window.location.href = '/admin/login';
      throw new Error('Failed to refresh token');
    }

    const data: RefreshTokenResponse = await response.json();
    this.setToken(data.token);
    
    return data.token;
  }

  isTokenExpired(token: string): boolean {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp < currentTime;
    } catch {
      return true;
    }
  }
}

// =====================================================
// CLIENTE HTTP
// =====================================================

class AdminHttpClient {
  private tokenManager: TokenManager;

  constructor() {
    this.tokenManager = TokenManager.getInstance();
  }

  // =====================================================
  // MÉTODO PRINCIPAL DE REQUEST
  // =====================================================

  async request<T = any>(
    endpoint: string, 
    config: RequestConfig = {}
  ): Promise<T> {
    const {
      skipAuth = false,
      skipErrorToast = false,
      timeout = DEFAULT_TIMEOUT,
      ...requestConfig
    } = config;

    // Construir URL completa
    const url = endpoint.startsWith('http') 
      ? endpoint 
      : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    // Configurar headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...requestConfig.headers,
    };

    // Agregar token de autenticación si es necesario
    if (!skipAuth) {
      const token = await this.getValidToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    // Configurar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        ...requestConfig,
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Manejar respuesta
      return await this.handleResponse<T>(response, skipErrorToast);

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new Error('Request timeout');
        this.handleError(timeoutError, skipErrorToast);
        throw timeoutError;
      }

      this.handleError(error, skipErrorToast);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS DE CONVENIENCIA
  // =====================================================

  async get<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  // =====================================================
  // UPLOAD DE ARCHIVOS
  // =====================================================

  async upload<T = any>(
    endpoint: string, 
    file: File | FormData, 
    config?: Omit<RequestConfig, 'headers'>
  ): Promise<T> {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    const token = await this.getValidToken();
    const headers: HeadersInit = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers,
    });
  }

  // =====================================================
  // MÉTODOS PRIVADOS
  // =====================================================

  private async getValidToken(): Promise<string | null> {
    let token = this.tokenManager.getToken();
    
    if (!token) {
      return null;
    }

    // Verificar si el token está expirado
    if (this.tokenManager.isTokenExpired(token)) {
      try {
        token = await this.tokenManager.refreshToken();
      } catch (error) {
        console.error('Failed to refresh token:', error);
        return null;
      }
    }

    return token;
  }

  private async handleResponse<T>(response: Response, skipErrorToast: boolean): Promise<T> {
    let data: any;
    
    try {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }
    } catch (error) {
      data = null;
    }

    if (!response.ok) {
      const apiError: ApiError = {
        message: data?.message || data?.error || `HTTP ${response.status}: ${response.statusText}`,
        code: data?.code,
        status: response.status,
        details: data?.details || data
      };

      // Manejar casos especiales
      if (response.status === 401) {
        this.tokenManager.clearToken();
        if (window.location.pathname !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      }

      throw apiError;
    }

    return data;
  }

  private handleError(error: any, skipErrorToast: boolean): void {
    console.error('HTTP Client Error:', error);

    if (!skipErrorToast) {
      let message = 'Error de conexión';
      
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'string') {
        message = error;
      } else if (error?.message) {
        message = error.message;
      }

      // Mostrar toast de error
      toast.error(message);
    }
  }

  // =====================================================
  // MÉTODOS PÚBLICOS PARA GESTIÓN DE TOKENS
  // =====================================================

  setAuthToken(token: string, refreshToken?: string): void {
    this.tokenManager.setToken(token);
    if (refreshToken) {
      localStorage.setItem('admin_refresh_token', refreshToken);
    }
  }

  clearAuthToken(): void {
    this.tokenManager.clearToken();
  }

  getAuthToken(): string | null {
    return this.tokenManager.getToken();
  }
}

// =====================================================
// INSTANCIA SINGLETON
// =====================================================

export const adminHttpClient = new AdminHttpClient();

// =====================================================
// HOOK PARA USAR EN COMPONENTES
// =====================================================

export const useAdminHttpClient = () => {
  return adminHttpClient;
};

// =====================================================
// TIPOS EXPORTADOS
// =====================================================

export type { RequestConfig, ApiError };
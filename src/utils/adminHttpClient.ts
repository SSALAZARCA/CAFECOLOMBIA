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

// Usar Proxy de Vite en desarrollo para evitar CORS
// Utility to ensure base URL has /api suffix
const getBaseUrl = () => {
  if (import.meta.env.DEV) return '/api';

  let url = import.meta.env.VITE_API_URL || '';
  if (!url) return '/api';

  // Ensure it starts with http/https if absolute, logic handled by browser for relative
  // But if it's the full domain from Coolify, it usually has https://

  // Strip trailing slash
  url = url.replace(/\/$/, '');

  // Append /api if not present
  if (!url.endsWith('/api')) {
    url += '/api';
  }

  return url;
};

const API_BASE_URL = getBaseUrl();

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

    const response = await fetch(`${API_BASE_URL}/auth/admin/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!response.ok) {
      this.clearToken();
      // Redirigir al login
      window.location.href = '/login';
      throw new Error('Failed to refresh token');
    }

    const data: RefreshTokenResponse = await response.json();
    this.setToken(data.token);

    return data.token;
  }

  isTokenExpired(token: string): boolean {
    try {
      // Si el token no es JWT (no tiene 3 partes), asumir que no expira
      const parts = token.split('.');
      if (parts.length !== 3) {
        return false;
      }

      const payload = JSON.parse(atob(parts[1]));
      const currentTime = Date.now() / 1000;
      return typeof payload.exp === 'number' ? payload.exp < currentTime : false;
    } catch {
      // Si no se puede decodificar, tratarlo como no expirado para tokens no-JWT
      return false;
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

    // Construir URL completa con normalización para evitar doble "/api"
    let url: string;
    if (endpoint.startsWith('http')) {
      url = endpoint;
    } else {
      const base = (API_BASE_URL || '').replace(/\/+$/, '');
      let path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

      // Si el base termina en "/api" y el endpoint comienza con "/api",
      // evitar duplicar el segmento "/api"
      if (base.endsWith('/api') && /^\/api(?:\/|$)/.test(path)) {
        path = path.replace(/^\/api/, '');
        // Asegurar que path comience con '/'
        if (!path.startsWith('/')) path = `/${path}`;
      }

      url = `${base}${path}`;
    }

    // Configurar headers sin forzar Content-Type por defecto
    const headers: HeadersInit = {
      ...requestConfig.headers,
    };

    // Si el cuerpo es FormData, quitar Content-Type para que el navegador
    // establezca correctamente el boundary de multipart
    if (requestConfig.body instanceof FormData) {
      // @ts-expect-error Mutation segura de objeto plano de headers
      delete (headers as any)['Content-Type'];
    }

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
      // Si el cuerpo es FormData, NO establecer Content-Type manualmente
      const isFormDataBody = requestConfig.body instanceof FormData;
      if (!isFormDataBody) {
        // Para cuerpos no-FormData, si no se especificó Content-Type, asumir JSON
        if (!('Content-Type' in (headers as any)) && requestConfig.body !== undefined) {
          (headers as any)['Content-Type'] = 'application/json';
        }
      }

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
    const isForm = data instanceof FormData;
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: isForm ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    const isForm = data instanceof FormData;
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: isForm ? data : (data ? JSON.stringify(data) : undefined),
    });
  }

  async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<T> {
    const isForm = data instanceof FormData;
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: isForm ? data : (data ? JSON.stringify(data) : undefined),
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
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
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

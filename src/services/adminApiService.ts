// =====================================================
// SERVICIO DE API PARA PANEL DE ADMINISTRACIÓN
// Conexión con backend MySQL - Café Colombia
// =====================================================

import type {
  ApiResponse,
  PaginatedResponse,
  AdminUser,
  AdminSession,
  SystemUser,
  CoffeeGrower,
  Farm,
  SubscriptionPlan,
  Subscription,
  Payment,
  AuditLog,
  SystemConfig,
  DashboardMetrics,
  ReportData,
  ReportFilter
} from '../types/admin';

// =====================================================
// CONFIGURACIÓN BASE
// =====================================================

// Forzar IPv4 directo y evitar proxy /api
// Forzar IPv4 directo y evitar proxy /api
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

class AdminApiService {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // =====================================================
  // MÉTODOS AUXILIARES
  // =====================================================

  setToken(token: string) {
    this.token = token;
  }

  clearToken() {
    this.token = null;
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP error! status: ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  private async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  private async post<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async put<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async patch<T>(endpoint: string, data?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  private async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // =====================================================
  // AUTENTICACIÓN
  // =====================================================

  async login(email: string, password: string, twoFactorCode?: string): Promise<{
    admin: AdminUser;
    session: AdminSession;
  }> {
    const response = await this.post<{
      admin: AdminUser;
      session: AdminSession;
    }>('/auth/admin/login', {
      email,
      password,
      two_factor_code: twoFactorCode,
    });

    if (response.success && response.data) {
      this.setToken(response.data.session.token);
      return response.data;
    }

    throw new Error(response.message || 'Error de autenticación');
  }

  async logout(): Promise<void> {
    try {
      await this.post('/auth/admin/logout');
    } finally {
      this.clearToken();
    }
  }

  async refreshSession(): Promise<AdminSession> {
    const response = await this.post<AdminSession>('/auth/admin/refresh');

    if (response.success && response.data) {
      this.setToken(response.data.token);
      return response.data;
    }

    throw new Error(response.message || 'Error al renovar sesión');
  }

  async enable2FA(): Promise<string> {
    const response = await this.post<{ qr_code: string }>('/auth/admin/2fa/enable');

    if (response.success && response.data) {
      return response.data.qr_code;
    }

    throw new Error(response.message || 'Error al habilitar 2FA');
  }

  async verify2FA(code: string): Promise<boolean> {
    const response = await this.post<{ verified: boolean }>('/auth/admin/2fa/verify', { code });

    if (response.success && response.data) {
      return response.data.verified;
    }

    throw new Error(response.message || 'Error al verificar 2FA');
  }

  async disable2FA(code: string): Promise<boolean> {
    const response = await this.post<{ disabled: boolean }>('/auth/admin/2fa/disable', { code });

    if (response.success && response.data) {
      return response.data.disabled;
    }

    throw new Error(response.message || 'Error al deshabilitar 2FA');
  }

  // =====================================================
  // USUARIOS DEL SISTEMA
  // =====================================================

  async getUsers(params?: Record<string, any>): Promise<PaginatedResponse<SystemUser>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await this.get<PaginatedResponse<SystemUser>>(`/admin/users${queryString}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener usuarios');
  }

  async getUser(id: string): Promise<SystemUser> {
    const response = await this.get<SystemUser>(`/admin/users/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener usuario');
  }

  async createUser(userData: Partial<SystemUser>): Promise<SystemUser> {
    const response = await this.post<SystemUser>('/admin/users', userData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al crear usuario');
  }

  async updateUser(id: string, userData: Partial<SystemUser>): Promise<SystemUser> {
    const response = await this.put<SystemUser>(`/admin/users/${id}`, userData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al actualizar usuario');
  }

  async deleteUser(id: string): Promise<void> {
    const response = await this.delete(`/admin/users/${id}`);

    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar usuario');
    }
  }

  async toggleUserStatus(id: string): Promise<SystemUser> {
    const response = await this.patch<SystemUser>(`/admin/users/${id}/toggle-status`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al cambiar estado del usuario');
  }

  async exportUsers(filters?: Record<string, any>): Promise<string> {
    const params = { ...filters, export: 'csv' };
    const queryString = `?${new URLSearchParams(params).toString()}`;
    const response = await this.get<{ download_url: string }>(`/admin/users/export${queryString}`);

    if (response.success && response.data) {
      return response.data.download_url;
    }

    throw new Error(response.message || 'Error al exportar usuarios');
  }

  // =====================================================
  // CAFICULTORES
  // =====================================================

  async getCoffeeGrowers(params?: Record<string, any>): Promise<PaginatedResponse<CoffeeGrower>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await this.get<PaginatedResponse<CoffeeGrower>>(`/admin/coffee-growers${queryString}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener caficultores');
  }

  async getCoffeeGrower(id: string): Promise<CoffeeGrower> {
    const response = await this.get<CoffeeGrower>(`/admin/coffee-growers/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener caficoltor');
  }

  async createCoffeeGrower(growerData: Partial<CoffeeGrower>): Promise<CoffeeGrower> {
    const response = await this.post<CoffeeGrower>('/admin/coffee-growers', growerData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al crear caficoltor');
  }

  async updateCoffeeGrower(id: string, growerData: Partial<CoffeeGrower>): Promise<CoffeeGrower> {
    const response = await this.put<CoffeeGrower>(`/admin/coffee-growers/${id}`, growerData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al actualizar caficoltor');
  }

  async deleteCoffeeGrower(id: string): Promise<void> {
    const response = await this.delete(`/admin/coffee-growers/${id}`);

    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar caficoltor');
    }
  }

  async exportCoffeeGrowers(filters?: Record<string, any>): Promise<string> {
    const params = { ...filters, export: 'csv' };
    const queryString = `?${new URLSearchParams(params).toString()}`;
    const response = await this.get<{ download_url: string }>(`/admin/coffee-growers/export${queryString}`);

    if (response.success && response.data) {
      return response.data.download_url;
    }

    throw new Error(response.message || 'Error al exportar caficultores');
  }

  // =====================================================
  // FINCAS
  // =====================================================

  async getFarms(params?: Record<string, any>): Promise<PaginatedResponse<Farm>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await this.get<PaginatedResponse<Farm>>(`/admin/farms${queryString}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener fincas');
  }

  async getFarm(id: string): Promise<Farm> {
    const response = await this.get<Farm>(`/admin/farms/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener finca');
  }

  async createFarm(farmData: Partial<Farm>): Promise<Farm> {
    const response = await this.post<Farm>('/admin/farms', farmData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al crear finca');
  }

  async updateFarm(id: string, farmData: Partial<Farm>): Promise<Farm> {
    const response = await this.put<Farm>(`/admin/farms/${id}`, farmData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al actualizar finca');
  }

  async deleteFarm(id: string): Promise<void> {
    const response = await this.delete(`/admin/farms/${id}`);

    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar finca');
    }
  }

  async exportFarms(filters?: Record<string, any>): Promise<string> {
    const params = { ...filters, export: 'csv' };
    const queryString = `?${new URLSearchParams(params).toString()}`;
    const response = await this.get<{ download_url: string }>(`/admin/farms/export${queryString}`);

    if (response.success && response.data) {
      return response.data.download_url;
    }

    throw new Error(response.message || 'Error al exportar fincas');
  }

  // =====================================================
  // PLANES DE SUSCRIPCIÓN
  // =====================================================

  async getSubscriptionPlans(params?: Record<string, any>): Promise<PaginatedResponse<SubscriptionPlan>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await this.get<PaginatedResponse<SubscriptionPlan>>(`/admin/subscription-plans${queryString}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener planes de suscripción');
  }

  async getSubscriptionPlan(id: string): Promise<SubscriptionPlan> {
    const response = await this.get<SubscriptionPlan>(`/admin/subscription-plans/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener plan de suscripción');
  }

  async createSubscriptionPlan(planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const response = await this.post<SubscriptionPlan>('/admin/subscription-plans', planData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al crear plan de suscripción');
  }

  async updateSubscriptionPlan(id: string, planData: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> {
    const response = await this.put<SubscriptionPlan>(`/admin/subscription-plans/${id}`, planData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al actualizar plan de suscripción');
  }

  async deleteSubscriptionPlan(id: string): Promise<void> {
    const response = await this.delete(`/admin/subscription-plans/${id}`);

    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar plan de suscripción');
    }
  }

  async togglePlanStatus(id: string): Promise<SubscriptionPlan> {
    const response = await this.patch<SubscriptionPlan>(`/admin/subscription-plans/${id}/toggle-status`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al cambiar estado del plan');
  }

  // =====================================================
  // SUSCRIPCIONES
  // =====================================================

  async getSubscriptions(params?: Record<string, any>): Promise<PaginatedResponse<Subscription>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await this.get<PaginatedResponse<Subscription>>(`/admin/subscriptions${queryString}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener suscripciones');
  }

  async getSubscription(id: string): Promise<Subscription> {
    const response = await this.get<Subscription>(`/admin/subscriptions/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener suscripción');
  }

  async createSubscription(subscriptionData: Partial<Subscription>): Promise<Subscription> {
    const response = await this.post<Subscription>('/admin/subscriptions', subscriptionData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al crear suscripción');
  }

  async updateSubscription(id: string, subscriptionData: Partial<Subscription>): Promise<Subscription> {
    const response = await this.put<Subscription>(`/admin/subscriptions/${id}`, subscriptionData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al actualizar suscripción');
  }

  async cancelSubscription(id: string, reason?: string): Promise<void> {
    const response = await this.patch(`/admin/subscriptions/${id}/cancel`, { reason });

    if (!response.success) {
      throw new Error(response.message || 'Error al cancelar suscripción');
    }
  }

  async renewSubscription(id: string): Promise<Subscription> {
    const response = await this.patch<Subscription>(`/admin/subscriptions/${id}/renew`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al renovar suscripción');
  }

  async exportSubscriptions(filters?: Record<string, any>): Promise<string> {
    const params = { ...filters, export: 'csv' };
    const queryString = `?${new URLSearchParams(params).toString()}`;
    const response = await this.get<{ download_url: string }>(`/admin/subscriptions/export${queryString}`);

    if (response.success && response.data) {
      return response.data.download_url;
    }

    throw new Error(response.message || 'Error al exportar suscripciones');
  }

  // =====================================================
  // PAGOS
  // =====================================================

  async getPayments(params?: Record<string, any>): Promise<PaginatedResponse<Payment>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await this.get<PaginatedResponse<Payment>>(`/admin/payments${queryString}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener pagos');
  }

  async getPayment(id: string): Promise<Payment> {
    const response = await this.get<Payment>(`/admin/payments/${id}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener pago');
  }

  async createPayment(paymentData: Partial<Payment>): Promise<Payment> {
    const response = await this.post<Payment>('/admin/payments', paymentData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al crear pago');
  }

  async updatePayment(id: string, paymentData: Partial<Payment>): Promise<Payment> {
    const response = await this.put<Payment>(`/admin/payments/${id}`, paymentData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al actualizar pago');
  }

  async refundPayment(id: string, amount?: number, reason?: string): Promise<void> {
    const response = await this.patch(`/admin/payments/${id}/refund`, { amount, reason });

    if (!response.success) {
      throw new Error(response.message || 'Error al reembolsar pago');
    }
  }

  async exportPayments(filters?: Record<string, any>): Promise<string> {
    const params = { ...filters, export: 'csv' };
    const queryString = `?${new URLSearchParams(params).toString()}`;
    const response = await this.get<{ download_url: string }>(`/admin/payments/export${queryString}`);

    if (response.success && response.data) {
      return response.data.download_url;
    }

    throw new Error(response.message || 'Error al exportar pagos');
  }

  // =====================================================
  // AUDITORÍA
  // =====================================================

  async getAuditLogs(params?: Record<string, any>): Promise<PaginatedResponse<AuditLog>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await this.get<PaginatedResponse<AuditLog>>(`/admin/audit${queryString}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener logs de auditoría');
  }

  async exportAuditLogs(filters?: Record<string, any>): Promise<string> {
    const params = { ...filters, export: 'csv' };
    const queryString = `?${new URLSearchParams(params).toString()}`;
    const response = await this.get<{ download_url: string }>(`/admin/audit/export${queryString}`);

    if (response.success && response.data) {
      return response.data.download_url;
    }

    throw new Error(response.message || 'Error al exportar logs de auditoría');
  }

  // =====================================================
  // CONFIGURACIÓN DEL SISTEMA
  // =====================================================

  async getSystemConfigs(params?: Record<string, any>): Promise<PaginatedResponse<SystemConfig>> {
    const queryString = params ? `?${new URLSearchParams(params).toString()}` : '';
    const response = await this.get<PaginatedResponse<SystemConfig>>(`/admin/settings${queryString}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener configuraciones');
  }

  async updateSystemConfig(key: string, value: string): Promise<SystemConfig> {
    const response = await this.put<SystemConfig>(`/admin/settings/${key}`, { value });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al actualizar configuración');
  }

  async createSystemConfig(configData: Partial<SystemConfig>): Promise<SystemConfig> {
    const response = await this.post<SystemConfig>('/admin/settings', configData);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al crear configuración');
  }

  async deleteSystemConfig(key: string): Promise<void> {
    const response = await this.delete(`/admin/settings/${key}`);

    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar configuración');
    }
  }

  // =====================================================
  // MÉTRICAS Y REPORTES
  // =====================================================

  async getDashboardMetrics(dateRange?: { from: string; to: string }): Promise<DashboardMetrics> {
    const params = dateRange ? `?from=${dateRange.from}&to=${dateRange.to}` : '';
    const response = await this.get<DashboardMetrics>(`/admin/reports/dashboard${params}`);

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al obtener métricas del dashboard');
  }

  async generateReport(type: string, filters?: ReportFilter): Promise<ReportData> {
    const response = await this.post<ReportData>('/admin/reports/generate', { type, filters });

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error(response.message || 'Error al generar reporte');
  }

  async exportReport(reportId: string, format: 'csv' | 'pdf' | 'excel'): Promise<string> {
    const response = await this.get<{ download_url: string }>(`/admin/reports/${reportId}/export?format=${format}`);

    if (response.success && response.data) {
      return response.data.download_url;
    }

    throw new Error(response.message || 'Error al exportar reporte');
  }

  // =====================================================
  // HEALTH CHECK
  // =====================================================

  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    // En desarrollo, no hacer peticiones para evitar ERR_ABORTED
    if (import.meta.env.DEV) {
      console.log('🔧 [AdminApiService] Health check skipped in development mode');
      return { status: 'healthy', timestamp: new Date().toISOString() };
    }

    const response = await this.get<{ status: string; timestamp: string }>('/health');

    if (response.success && response.data) {
      return response.data;
    }

    throw new Error('Error en health check');
  }
}

// =====================================================
// INSTANCIA SINGLETON
// =====================================================

export const adminApiService = new AdminApiService();

// =====================================================
// HOOKS PERSONALIZADOS PARA REACT
// =====================================================

export const useAdminApi = () => {
  return adminApiService;
};

// =====================================================
// EXPORTACIONES
// =====================================================

export default adminApiService;
export type { AdminApiService };
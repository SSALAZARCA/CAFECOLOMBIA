// =====================================================
// STORE ZUSTAND PARA PANEL DE ADMINISTRACIÓN
// Gestión de estado global del sistema administrativo
// =====================================================

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { toast } from 'sonner';
import { adminHttpClient } from '../utils/adminHttpClient';
import { PERMISSIONS } from '../hooks/usePermissions';
import type {
  AdminState,
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
  PaginatedResponse,
  NotificationEvent,
  AdminPermissionCheck
} from '../types/admin';

// =====================================================
// INTERFACE DEL STORE
// =====================================================

interface AdminStore extends AdminState {
  // =====================================================
  // ACCIONES DE AUTENTICACIÓN
  // =====================================================
  login: (email: string, password: string, twoFactorCode?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<boolean>;
  enable2FA: () => Promise<string>; // Retorna QR code
  verify2FA: (code: string) => Promise<boolean>;
  disable2FA: (code: string) => Promise<boolean>;
  
  // =====================================================
  // ACCIONES DE UI
  // =====================================================
  setSidebarOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // =====================================================
  // ACCIONES DE USUARIOS
  // =====================================================
  fetchUsers: (params?: any) => Promise<void>;
  createUser: (userData: Partial<SystemUser>) => Promise<SystemUser>;
  updateUser: (id: string, userData: Partial<SystemUser>) => Promise<SystemUser>;
  deleteUser: (id: string) => Promise<void>;
  toggleUserStatus: (id: string) => Promise<void>;
  exportUsers: (filters?: any) => Promise<string>; // Retorna URL de descarga
  
  // =====================================================
  // ACCIONES DE CAFICULTORES
  // =====================================================
  fetchCoffeeGrowers: (params?: any) => Promise<void>;
  createCoffeeGrower: (growerData: Partial<CoffeeGrower>) => Promise<CoffeeGrower>;
  updateCoffeeGrower: (id: string, growerData: Partial<CoffeeGrower>) => Promise<CoffeeGrower>;
  deleteCoffeeGrower: (id: string) => Promise<void>;
  exportCoffeeGrowers: (filters?: any) => Promise<string>;
  
  // =====================================================
  // ACCIONES DE FINCAS
  // =====================================================
  fetchFarms: (params?: any) => Promise<void>;
  createFarm: (farmData: Partial<Farm>) => Promise<Farm>;
  updateFarm: (id: string, farmData: Partial<Farm>) => Promise<Farm>;
  deleteFarm: (id: string) => Promise<void>;
  exportFarms: (filters?: any) => Promise<string>;
  
  // =====================================================
  // ACCIONES DE PLANES DE SUSCRIPCIÓN
  // =====================================================
  fetchSubscriptionPlans: (params?: any) => Promise<void>;
  createSubscriptionPlan: (planData: Partial<SubscriptionPlan>) => Promise<SubscriptionPlan>;
  updateSubscriptionPlan: (id: string, planData: Partial<SubscriptionPlan>) => Promise<SubscriptionPlan>;
  deleteSubscriptionPlan: (id: string) => Promise<void>;
  togglePlanStatus: (id: string) => Promise<void>;
  
  // =====================================================
  // ACCIONES DE SUSCRIPCIONES
  // =====================================================
  fetchSubscriptions: (params?: any) => Promise<void>;
  createSubscription: (subscriptionData: Partial<Subscription>) => Promise<Subscription>;
  updateSubscription: (id: string, subscriptionData: Partial<Subscription>) => Promise<Subscription>;
  cancelSubscription: (id: string, reason?: string) => Promise<void>;
  renewSubscription: (id: string) => Promise<void>;
  exportSubscriptions: (filters?: any) => Promise<string>;
  
  // =====================================================
  // ACCIONES DE PAGOS
  // =====================================================
  fetchPayments: (params?: any) => Promise<void>;
  createPayment: (paymentData: Partial<Payment>) => Promise<Payment>;
  updatePayment: (id: string, paymentData: Partial<Payment>) => Promise<Payment>;
  refundPayment: (id: string, amount?: number, reason?: string) => Promise<void>;
  exportPayments: (filters?: any) => Promise<string>;
  
  // =====================================================
  // ACCIONES DE AUDITORÍA
  // =====================================================
  fetchAuditLogs: (params?: any) => Promise<void>;
  exportAuditLogs: (filters?: any) => Promise<string>;
  
  // =====================================================
  // ACCIONES DE CONFIGURACIÓN
  // =====================================================
  fetchSystemConfigs: (params?: any) => Promise<void>;
  updateSystemConfig: (key: string, value: string) => Promise<void>;
  createSystemConfig: (configData: Partial<SystemConfig>) => Promise<SystemConfig>;
  deleteSystemConfig: (key: string) => Promise<void>;
  
  // =====================================================
  // ACCIONES DE MÉTRICAS
  // =====================================================
  fetchDashboardMetrics: (dateRange?: { from: string; to: string }) => Promise<void>;
  refreshMetrics: () => Promise<void>;
  
  // =====================================================
  // ACCIONES DE REPORTES
  // =====================================================
  generateReport: (type: string, filters?: any) => Promise<any>;
  exportReport: (reportId: string, format: 'csv' | 'pdf' | 'excel') => Promise<string>;
  
  // =====================================================
  // ACCIONES DE PERMISOS
  // =====================================================
  checkPermission: (permission: AdminPermissionCheck) => boolean;
  hasRole: (role: string) => boolean;
  
  // =====================================================
  // ACCIONES DE NOTIFICACIONES
  // =====================================================
  notifications: NotificationEvent[];
  addNotification: (notification: Omit<NotificationEvent, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  markNotificationAsRead: (id: string) => void;
  clearNotifications: () => void;
  
  // =====================================================
  // UTILIDADES
  // =====================================================
  useAuthenticatedFetch: (endpoint: string, options?: RequestInit) => Promise<Response>;
  reset: () => void;
  hydrate: () => void;
}

// =====================================================
// ESTADO INICIAL
// =====================================================

const initialState: AdminState = {
  // Autenticación
  isAuthenticated: false,
  currentAdmin: null,
  session: null,
  
  // UI
  sidebarOpen: true,
  loading: false,
  error: null,
  
  // Datos
  users: [],
  coffeeGrowers: [],
  farms: [],
  subscriptionPlans: [],
  subscriptions: [],
  payments: [],
  auditLogs: [],
  systemConfigs: [],
  
  // Métricas
  dashboardMetrics: null,
  
  // Paginación
  pagination: {}
};

// =====================================================
// STORE PRINCIPAL
// =====================================================

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      ...initialState,
      
      // =====================================================
      // IMPLEMENTACIÓN DE AUTENTICACIÓN
      // =====================================================
      
      login: async (email: string, password: string, twoFactorCode?: string) => {
        set({ loading: true, error: null });
        
        try {
          console.log('🔐 DEBUG AdminStore - Iniciando login con:', { email, password: '***' });
          
          const data = await adminHttpClient.post('/api/admin/auth/login', {
            username: email, // El servidor espera 'username' pero acepta email
            password,
            two_factor_code: twoFactorCode
          }, { skipAuth: true });
          
          console.log('✅ DEBUG AdminStore - Login exitoso, respuesta:', data);
          
          // Decodificar JWT para obtener permisos
          const jwtPayload = JSON.parse(atob(data.token.split('.')[1]));
          console.log('🔑 DEBUG AdminStore - JWT payload:', jwtPayload);
          
          // Obtener información del admin autenticado
          const adminInfo = await adminHttpClient.get('/api/admin/auth/me', {
            headers: {
              'Authorization': `Bearer ${data.token}`
            }
          });
          
          console.log('👤 DEBUG AdminStore - Admin info recibida:', adminInfo);
          
          // Adaptar respuesta del backend actual
          const adminUser = {
            id: adminInfo.admin.id,
            email: adminInfo.admin.email,
            name: adminInfo.admin.name,
            role: adminInfo.admin.is_super_admin ? 'super_admin' : 'admin',
            is_super_admin: adminInfo.admin.is_super_admin,
            is_active: adminInfo.admin.is_active,
            permissions: jwtPayload.permissions || []
          };
          
          console.log('🎯 DEBUG AdminStore - Usuario final creado:', adminUser);
          
          const session = {
            token: data.token,
            refresh_token: data.token, // Usar el mismo token por ahora
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          };
          
          // Configurar token en el cliente HTTP
          adminHttpClient.setAuthToken(session.token, session.refresh_token);
          
          set({
            isAuthenticated: true,
            currentAdmin: adminUser,
            session: session,
            loading: false
          });
          
          // Cargar métricas iniciales
          get().fetchDashboardMetrics();
          
          toast.success('Inicio de sesión exitoso');
          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error desconocido';
          set({ 
            error: message,
            loading: false 
          });
          toast.error(message);
          return false;
        }
      },
      
      logout: async () => {
        const { session } = get();
        
        if (session) {
          try {
            await adminHttpClient.post('/api/auth/admin/logout');
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
          }
        }
        
        // Limpiar token del cliente HTTP
        adminHttpClient.clearAuthToken();
        
        set({
          isAuthenticated: false,
          currentAdmin: null,
          session: null,
          error: null,
          loading: false
        });
        
        toast.success('Sesión cerrada correctamente');
      },
      
      refreshSession: async () => {
        const { session } = get();
        if (!session) return false;
        
        try {
          const response = await fetch('/api/auth/admin/refresh', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${session.token}` }
          });
          
          if (!response.ok) {
            get().logout();
            return false;
          }
          
          const data = await response.json();
          set({ session: data.session });
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },
      
      enable2FA: async () => {
        const { session } = get();
        if (!session) throw new Error('No hay sesión activa');
        
        const response = await fetch('/api/auth/admin/2fa/enable', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        return data.qr_code;
      },
      
      verify2FA: async (code: string) => {
        const { session } = get();
        if (!session) throw new Error('No hay sesión activa');
        
        const response = await fetch('/api/auth/admin/2fa/verify', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        // Actualizar el usuario actual
        set(state => ({
          currentAdmin: state.currentAdmin ? {
            ...state.currentAdmin,
            two_factor_enabled: true
          } : null
        }));
        
        return true;
      },
      
      disable2FA: async (code: string) => {
        const { session } = get();
        if (!session) throw new Error('No hay sesión activa');
        
        const response = await fetch('/api/auth/admin/2fa/disable', {
          method: 'POST',
          headers: { 
            'Authorization': `Bearer ${session.token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        // Actualizar el usuario actual
        set(state => ({
          currentAdmin: state.currentAdmin ? {
            ...state.currentAdmin,
            two_factor_enabled: false
          } : null
        }));
        
        return true;
      },
      
      // =====================================================
      // IMPLEMENTACIÓN DE UI
      // =====================================================
      
      setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
      setLoading: (loading: boolean) => set({ loading }),
      setError: (error: string | null) => set({ error }),
      clearError: () => set({ error: null }),
      
      // =====================================================
      // IMPLEMENTACIÓN DE USUARIOS
      // =====================================================
      
      fetchUsers: async (filters = {}) => {
        set({ loading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams(filters);
          const data = await adminHttpClient.get(`/api/users?${queryParams}`);
          
          set({ 
            users: data.data || data,
            pagination: { ...get().pagination, users: data.pagination },
            loading: false 
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al cargar usuarios';
          set({ 
            error: message,
            loading: false 
          });
          toast.error(message);
        }
      },
      
      createUser: async (userData: Partial<SystemUser>) => {
        set({ loading: true, error: null });
        
        try {
          const data = await adminHttpClient.post('/api/users', userData);
          
          // Actualizar la lista de usuarios
          set(state => ({
            users: [data.data || data, ...state.users],
            loading: false
          }));
          
          toast.success('Usuario creado exitosamente');
          return data.data || data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al crear usuario';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      updateUser: async (id: string, userData: Partial<SystemUser>) => {
        set({ loading: true, error: null });
        
        try {
          const data = await adminHttpClient.put(`/api/users/${id}`, userData);
          
          // Actualizar el usuario en la lista
          set(state => ({
            users: state.users.map(user => 
              user.id === id ? { ...user, ...(data.data || data) } : user
            ),
            loading: false
          }));
          
          toast.success('Usuario actualizado exitosamente');
          return data.data || data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al actualizar usuario';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      deleteUser: async (id: string) => {
        set({ loading: true, error: null });
        
        try {
          await adminHttpClient.delete(`/api/users/${id}`);
          
          // Remover el usuario de la lista
          set(state => ({
            users: state.users.filter(user => user.id !== id),
            loading: false
          }));
          
          toast.success('Usuario eliminado exitosamente');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al eliminar usuario';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      toggleUserStatus: async (id: string) => {
        const { session } = get();
        if (!session) throw new Error('No hay sesión activa');
        
        const response = await fetch(`/api/users/${id}/toggle-status`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        // Actualizar el estado del usuario
        set(state => ({
          users: state.users.map(user => 
            user.id === id ? { ...user, is_active: !user.is_active } : user
          )
        }));
      },
      
      exportUsers: async (filters = {}) => {
        const { session } = get();
        if (!session) throw new Error('No hay sesión activa');
        
        const queryParams = new URLSearchParams({ ...filters, export: 'csv' });
        const response = await fetch(`/api/users/export?${queryParams}`, {
          headers: { 'Authorization': `Bearer ${session.token}` }
        });
        
        const data = await response.json();
        if (!response.ok) throw new Error(data.message);
        
        return data.download_url;
      },
      
      // =====================================================
      // IMPLEMENTACIÓN DE MÉTRICAS
      // =====================================================
      
      fetchDashboardMetrics: async (dateRange) => {
        set({ loading: true, error: null });
        
        try {
          const params = dateRange ? 
            `?from=${dateRange.from}&to=${dateRange.to}` : '';
          
          const data = await adminHttpClient.get(`/api/admin/dashboard/stats${params}`);
          
          set({ 
            dashboardMetrics: data,
            loading: false 
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al cargar métricas';
          set({ error: message, loading: false });
          console.error('Error al cargar métricas:', error);
        }
      },
      
      refreshMetrics: async () => {
        await get().fetchDashboardMetrics();
      },
      
      // =====================================================
      // IMPLEMENTACIÓN DE PERMISOS
      // =====================================================
      
      checkPermission: (permission: AdminPermissionCheck) => {
        const { currentAdmin } = get();
        if (!currentAdmin) return false;
        
        // Los superadministradores tienen todos los permisos
        if (currentAdmin.is_super_admin) return true;
        
        // Si tiene el permiso universal '*', tiene todos los permisos
        if (currentAdmin.permissions && currentAdmin.permissions.includes('*')) return true;
        
        // Verificar permisos específicos - manejar tanto string como objetos
        if (typeof permission === 'string') {
          return currentAdmin.permissions.includes(permission);
        }
        
        // Para objetos AdminPermissionCheck, construir el string de permiso
        const permissionString = `${permission.resource}:${permission.action}`;
        return currentAdmin.permissions.includes(permissionString);
      },
      
      hasRole: (role: string) => {
        const { currentAdmin } = get();
        if (!currentAdmin) return false;
        
        if (role === 'super_admin') return currentAdmin.is_super_admin;
        if (role === 'admin') return true; // Todos los usuarios admin tienen rol admin
        
        return false;
      },
      
      // =====================================================
      // IMPLEMENTACIÓN DE NOTIFICACIONES
      // =====================================================
      
      notifications: [],
      
      addNotification: (notification) => {
        const newNotification: NotificationEvent = {
          ...notification,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          read: false
        };
        
        set(state => ({
          notifications: [newNotification, ...state.notifications].slice(0, 50) // Máximo 50 notificaciones
        }));
      },
      
      removeNotification: (id: string) => {
        set(state => ({
          notifications: state.notifications.filter(n => n.id !== id)
        }));
      },
      
      markNotificationAsRead: (id: string) => {
        set(state => ({
          notifications: state.notifications.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        }));
      },
      
      clearNotifications: () => {
        set({ notifications: [] });
      },
      
      // =====================================================
      // IMPLEMENTACIONES PENDIENTES (PLACEHOLDER)
      // =====================================================
      
      // Caficultores
      fetchCoffeeGrowers: async (filters = {}) => {
        set({ loading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams(filters);
          const data = await adminHttpClient.get(`/api/coffee-growers?${queryParams}`);
          
          set({ 
            coffeeGrowers: data.data || data,
            loading: false 
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al cargar caficultores';
          set({ error: message, loading: false });
          toast.error(message);
        }
      },
      
      createCoffeeGrower: async (growerData: Partial<CoffeeGrower>) => {
        set({ loading: true, error: null });
        
        try {
          const data = await adminHttpClient.post('/api/coffee-growers', growerData);
          
          set(state => ({
            coffeeGrowers: [data.data || data, ...state.coffeeGrowers],
            loading: false
          }));
          
          toast.success('Caficultor creado exitosamente');
          return data.data || data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al crear caficultor';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      updateCoffeeGrower: async (id: string, growerData: Partial<CoffeeGrower>) => {
        set({ loading: true, error: null });
        
        try {
          const data = await adminHttpClient.put(`/api/coffee-growers/${id}`, growerData);
          
          set(state => ({
            coffeeGrowers: state.coffeeGrowers.map(grower => 
              grower.id === id ? { ...grower, ...(data.data || data) } : grower
            ),
            loading: false
          }));
          
          toast.success('Caficultor actualizado exitosamente');
          return data.data || data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al actualizar caficultor';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      deleteCoffeeGrower: async (id: string) => {
        set({ loading: true, error: null });
        
        try {
          await adminHttpClient.delete(`/api/coffee-growers/${id}`);
          
          set(state => ({
            coffeeGrowers: state.coffeeGrowers.filter(grower => grower.id !== id),
            loading: false
          }));
          
          toast.success('Caficultor eliminado exitosamente');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al eliminar caficultor';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      exportCoffeeGrowers: async (filters = {}) => {
        try {
          const queryParams = new URLSearchParams({ ...filters, export: 'csv' });
          const data = await adminHttpClient.get(`/api/coffee-growers/export?${queryParams}`);
          
          toast.success('Exportación iniciada');
          return data.download_url || data.url;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al exportar caficultores';
          toast.error(message);
          throw error;
        }
      },
      
      // Fincas
      fetchFarms: async (filters = {}) => {
        set({ loading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams(filters);
          const data = await adminHttpClient.get(`/api/farms?${queryParams}`);
          
          set({ 
            farms: data.data || data,
            loading: false 
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al cargar fincas';
          set({ error: message, loading: false });
          toast.error(message);
        }
      },
      
      createFarm: async (farmData: Partial<Farm>) => {
        set({ loading: true, error: null });
        
        try {
          const data = await adminHttpClient.post('/api/farms', farmData);
          
          set(state => ({
            farms: [data.data || data, ...state.farms],
            loading: false
          }));
          
          toast.success('Finca creada exitosamente');
          return data.data || data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al crear finca';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      updateFarm: async (id: string, farmData: Partial<Farm>) => {
        set({ loading: true, error: null });
        
        try {
          const data = await adminHttpClient.put(`/api/farms/${id}`, farmData);
          
          set(state => ({
            farms: state.farms.map(farm => 
              farm.id === id ? { ...farm, ...(data.data || data) } : farm
            ),
            loading: false
          }));
          
          toast.success('Finca actualizada exitosamente');
          return data.data || data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al actualizar finca';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      deleteFarm: async (id: string) => {
        set({ loading: true, error: null });
        
        try {
          await adminHttpClient.delete(`/api/farms/${id}`);
          
          set(state => ({
            farms: state.farms.filter(farm => farm.id !== id),
            loading: false
          }));
          
          toast.success('Finca eliminada exitosamente');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al eliminar finca';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      exportFarms: async (filters = {}) => {
        try {
          const queryParams = new URLSearchParams({ ...filters, export: 'csv' });
          const data = await adminHttpClient.get(`/api/farms/export?${queryParams}`);
          
          toast.success('Exportación iniciada');
          return data.download_url || data.url;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al exportar fincas';
          toast.error(message);
          throw error;
        }
      },
      
      // Planes
      fetchSubscriptionPlans: async (filters = {}) => {
        set({ loading: true, error: null });
        
        try {
          const queryParams = new URLSearchParams(filters);
          const data = await adminHttpClient.get(`/api/subscription-plans?${queryParams}`);
          
          set({ 
            subscriptionPlans: data.data || data,
            loading: false 
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al cargar planes';
          set({ error: message, loading: false });
          toast.error(message);
        }
      },
      
      createSubscriptionPlan: async (planData: Partial<SubscriptionPlan>) => {
        set({ loading: true, error: null });
        
        try {
          const data = await adminHttpClient.post('/api/subscription-plans', planData);
          
          set(state => ({
            subscriptionPlans: [data.data || data, ...state.subscriptionPlans],
            loading: false
          }));
          
          toast.success('Plan creado exitosamente');
          return data.data || data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al crear plan';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      updateSubscriptionPlan: async (id: string, planData: Partial<SubscriptionPlan>) => {
        set({ loading: true, error: null });
        
        try {
          const data = await adminHttpClient.put(`/api/subscription-plans/${id}`, planData);
          
          set(state => ({
            subscriptionPlans: state.subscriptionPlans.map(plan => 
              plan.id === id ? { ...plan, ...(data.data || data) } : plan
            ),
            loading: false
          }));
          
          toast.success('Plan actualizado exitosamente');
          return data.data || data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al actualizar plan';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      deleteSubscriptionPlan: async (id: string) => {
        set({ loading: true, error: null });
        
        try {
          await adminHttpClient.delete(`/api/subscription-plans/${id}`);
          
          set(state => ({
            subscriptionPlans: state.subscriptionPlans.filter(plan => plan.id !== id),
            loading: false
          }));
          
          toast.success('Plan eliminado exitosamente');
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al eliminar plan';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      togglePlanStatus: async (id: string) => {
        set({ loading: true, error: null });
        
        try {
          const data = await adminHttpClient.patch(`/api/subscription-plans/${id}/toggle-status`);
          
          set(state => ({
            subscriptionPlans: state.subscriptionPlans.map(plan => 
              plan.id === id ? { ...plan, is_active: !plan.is_active } : plan
            ),
            loading: false
          }));
          
          toast.success('Estado del plan actualizado');
          return data.data || data;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Error al cambiar estado del plan';
          set({ error: message, loading: false });
          toast.error(message);
          throw error;
        }
      },
      
      // Suscripciones
      fetchSubscriptions: async () => { /* TODO: Implementar */ },
      createSubscription: async () => { throw new Error('No implementado'); },
      updateSubscription: async () => { throw new Error('No implementado'); },
      cancelSubscription: async () => { /* TODO: Implementar */ },
      renewSubscription: async () => { /* TODO: Implementar */ },
      exportSubscriptions: async () => { throw new Error('No implementado'); },
      
      // Pagos
      fetchPayments: async () => { /* TODO: Implementar */ },
      createPayment: async () => { throw new Error('No implementado'); },
      updatePayment: async () => { throw new Error('No implementado'); },
      refundPayment: async () => { /* TODO: Implementar */ },
      exportPayments: async () => { throw new Error('No implementado'); },
      
      // Auditoría
      fetchAuditLogs: async () => { /* TODO: Implementar */ },
      exportAuditLogs: async () => { throw new Error('No implementado'); },
      
      // Configuración
      fetchSystemConfigs: async () => { /* TODO: Implementar */ },
      updateSystemConfig: async () => { /* TODO: Implementar */ },
      createSystemConfig: async () => { throw new Error('No implementado'); },
      deleteSystemConfig: async () => { /* TODO: Implementar */ },
      
      // Reportes
      generateReport: async () => { throw new Error('No implementado'); },
      exportReport: async () => { throw new Error('No implementado'); },
      
      // =====================================================
      // UTILIDADES
      // =====================================================
      
      useAuthenticatedFetch: async (endpoint: string, options: RequestInit = {}) => {
        try {
          const { isAuthenticated } = get();
          
          if (!isAuthenticated) {
            throw new Error('Usuario no autenticado');
          }

          // Usar adminHttpClient para hacer la petición
          const method = (options.method || 'GET').toUpperCase();
          const body = options.body;
          
          let response;
          
          switch (method) {
            case 'GET':
              response = await adminHttpClient.get(endpoint);
              break;
            case 'POST':
              response = await adminHttpClient.post(endpoint, body ? JSON.parse(body as string) : undefined);
              break;
            case 'PUT':
              response = await adminHttpClient.put(endpoint, body ? JSON.parse(body as string) : undefined);
              break;
            case 'PATCH':
              response = await adminHttpClient.patch(endpoint, body ? JSON.parse(body as string) : undefined);
              break;
            case 'DELETE':
              response = await adminHttpClient.delete(endpoint);
              break;
            default:
              throw new Error(`Método HTTP no soportado: ${method}`);
          }

          // Crear un objeto Response compatible
          return new Response(JSON.stringify(response), {
            status: 200,
            statusText: 'OK',
            headers: {
              'Content-Type': 'application/json',
            },
          });
          
        } catch (error: any) {
          console.error('Error en useAuthenticatedFetch:', error);
          
          // Si es un error de autenticación, hacer logout
          if (error.message?.includes('401') || error.message?.includes('Unauthorized')) {
            get().logout();
          }
          
          // Crear un Response de error
          return new Response(JSON.stringify({ error: error.message }), {
            status: error.status || 500,
            statusText: error.statusText || 'Internal Server Error',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        }
      },
      
      reset: () => set(initialState),
      hydrate: () => {
        // Verificar si la sesión sigue siendo válida
        const { session } = get();
        if (session && new Date(session.expires_at) < new Date()) {
          get().logout();
        }
      }
    }),
    {
      name: 'admin-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentAdmin: state.currentAdmin,
        session: state.session,
        sidebarOpen: state.sidebarOpen
      })
    }
  )
);

// =====================================================
// HOOKS PERSONALIZADOS
// =====================================================

export const useAdminAuth = () => {
  const { 
    isAuthenticated, 
    currentAdmin, 
    login, 
    logout, 
    loading, 
    error 
  } = useAdminStore();
  
  return {
    isAuthenticated,
    currentAdmin,
    login,
    logout,
    loading,
    error
  };
};

export const useAdminPermissions = () => {
  const { checkPermission, hasRole, currentAdmin } = useAdminStore();
  
  return {
    checkPermission,
    hasRole,
    isSuperAdmin: currentAdmin?.is_super_admin || false
  };
};

export const useAdminNotifications = () => {
  const { 
    notifications, 
    addNotification, 
    removeNotification,
    markNotificationAsRead, 
    clearNotifications 
  } = useAdminStore();
  
  const unreadCount = notifications.filter(n => !n.read).length;
  
  return {
    notifications,
    unreadCount,
    addNotification,
    removeNotification,
    markNotificationAsRead,
    clearNotifications
  };
};
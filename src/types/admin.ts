// =====================================================
// TIPOS Y INTERFACES PARA PANEL DE ADMINISTRACIÓN
// Café Colombia - Super Administrator Panel
// =====================================================

// =====================================================
// INTERFACES PRINCIPALES
// =====================================================

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  permissions: string[];
  created_at?: string;
  updated_at?: string;
  last_login?: string;
}

export interface AdminSession {
  token: string;
  refresh_token: string;
  expires_at: string;
}

export interface SystemUser {
  id: string;
  email: string;
  name: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
  subscription_status?: string;
}

export interface CoffeeGrower {
  id: string;
  name: string;
  email: string;
  phone?: string;
  document_type: string;
  document_number: string;
  farm_count: number;
  total_area: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Farm {
  id: string;
  name: string;
  grower_id: string;
  grower_name?: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
    municipality: string;
    department: string;
  };
  area: number;
  coffee_varieties: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_months: number;
  features: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  user_name?: string;
  plan_id: string;
  plan_name?: string;
  status: 'active' | 'inactive' | 'cancelled' | 'expired';
  start_date: string;
  end_date: string;
  auto_renew: boolean;
  created_at: string;
  updated_at: string;
}

export interface Payment {
  id: string;
  user_id: string;
  user_name?: string;
  subscription_id?: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  resource: string;
  resource_id?: string;
  details: Record<string, any>;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export interface SystemConfig {
  key: string;
  value: string;
  description?: string;
  type: 'string' | 'number' | 'boolean' | 'json';
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardMetrics {
  users: {
    total: number;
    active: number;
    new_this_month: number;
    growth_rate: number;
  };
  subscriptions: {
    total: number;
    active: number;
    new_this_month: number;
    revenue_this_month: number;
  };
  farms: {
    total: number;
    active: number;
    total_area: number;
    average_area: number;
  };
  revenue: {
    total: number;
    this_month: number;
    last_month: number;
    growth_rate: number;
  };
}

export interface NotificationEvent {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action_url?: string;
}

// =====================================================
// INTERFACES DE ESTADO
// =====================================================

export interface AdminState {
  // Autenticación
  isAuthenticated: boolean;
  currentAdmin: AdminUser | null;
  session: AdminSession | null;
  
  // UI State
  sidebarOpen: boolean;
  loading: boolean;
  error: string | null;
  
  // Datos
  users: SystemUser[];
  coffeeGrowers: CoffeeGrower[];
  farms: Farm[];
  subscriptionPlans: SubscriptionPlan[];
  subscriptions: Subscription[];
  payments: Payment[];
  auditLogs: AuditLog[];
  systemConfigs: SystemConfig[];
  
  // Métricas
  dashboardMetrics: DashboardMetrics | null;
  
  // Paginación
  pagination: Record<string, any>;
}

// =====================================================
// TIPOS DE UTILIDAD
// =====================================================

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export type AdminPermissionCheck = string | {
  resource: string;
  action: string;
};

// =====================================================
// TIPOS DE FILTROS Y BÚSQUEDA
// =====================================================

export interface UserFilters {
  search?: string;
  status?: 'active' | 'inactive';
  subscription_status?: string;
  date_from?: string;
  date_to?: string;
}

export interface CoffeeGrowerFilters {
  search?: string;
  status?: 'active' | 'inactive';
  department?: string;
  municipality?: string;
  min_area?: number;
  max_area?: number;
}

export interface FarmFilters {
  search?: string;
  grower_id?: string;
  department?: string;
  municipality?: string;
  min_area?: number;
  max_area?: number;
  varieties?: string[];
}

export interface PaymentFilters {
  search?: string;
  status?: 'pending' | 'completed' | 'failed' | 'refunded';
  payment_method?: string;
  date_from?: string;
  date_to?: string;
  min_amount?: number;
  max_amount?: number;
}

// =====================================================
// TIPOS DE RESPUESTA DE API
// =====================================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}
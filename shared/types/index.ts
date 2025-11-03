// Exportar todos los tipos del sistema de administración

// Tipos de administración
export * from './admin.js';

// Tipos de suscripciones
export * from './subscriptions.js';

// Tipos de pagos
export * from './payments.js';

// Tipos de auditoría
export * from './audit.js';

// Tipos del sistema
export * from './system.js';

// Tipos de caficultores
export * from './coffeeGrowers.js';

// Tipos de fincas
export * from './farms.js';

// Tipos de dashboard
export * from './dashboard.js';

// Tipos comunes para respuestas de API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// Tipos para filtros comunes
export interface BaseFilters {
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  search?: string;
}

// Tipos para fechas
export interface DateRange {
  start: Date;
  end: Date;
}

export interface DateRangeFilter {
  date_from?: string;
  date_to?: string;
}

// Tipos para estadísticas comunes
export interface BaseStats {
  total: number;
  active: number;
  inactive: number;
  growth_rate: number;
  period_comparison: {
    current: number;
    previous: number;
    change_percentage: number;
  };
}

// Tipos para métricas de tiempo
export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  label?: string;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string;
    borderColor?: string;
  }[];
}

// Tipos para configuración de la aplicación
export interface AppConfig {
  app_name: string;
  app_version: string;
  environment: 'development' | 'staging' | 'production';
  api_base_url: string;
  admin_panel_url: string;
  features: {
    two_factor_auth: boolean;
    audit_logging: boolean;
    real_time_metrics: boolean;
    payment_processing: boolean;
    subscription_management: boolean;
  };
  limits: {
    max_file_size: number;
    max_upload_files: number;
    session_timeout: number;
    max_login_attempts: number;
  };
}
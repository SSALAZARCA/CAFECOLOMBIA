// Tipos para configuración del sistema

export interface SystemConfig {
  id: number;
  key: string;
  value: string;
  description?: string;
  category: ConfigCategory;
  data_type: ConfigDataType;
  is_sensitive: boolean;
  is_readonly: boolean;
  created_at: Date;
  updated_at: Date;
}

export type ConfigCategory = 
  | 'general' 
  | 'security' 
  | 'payment' 
  | 'email' 
  | 'storage' 
  | 'api' 
  | 'ui' 
  | 'audit' 
  | 'subscription';

export type ConfigDataType = 
  | 'string' 
  | 'number' 
  | 'boolean' 
  | 'json' 
  | 'email' 
  | 'url' 
  | 'password';

export interface SystemConfigUpdateRequest {
  value: string;
}

export interface SystemConfigCreateRequest {
  key: string;
  value: string;
  description?: string;
  category: ConfigCategory;
  data_type: ConfigDataType;
  is_sensitive?: boolean;
  is_readonly?: boolean;
}

// Tipos para métricas del sistema
export interface SystemMetrics {
  users: {
    total: number;
    active: number;
    new_this_month: number;
    growth_rate: number;
  };
  growers: {
    total: number;
    active: number;
    verified: number;
    new_this_month: number;
  };
  farms: {
    total: number;
    active: number;
    verified: number;
    total_area_hectares: number;
  };
  subscriptions: {
    total: number;
    active: number;
    trial: number;
    canceled: number;
    revenue_current_month: number;
    revenue_previous_month: number;
  };
  payments: {
    total: number;
    successful: number;
    failed: number;
    total_revenue: number;
    success_rate: number;
  };
  system: {
    uptime: number;
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    api_response_time: number;
    error_rate: number;
  };
}

// Tipos para dashboard
export interface DashboardData {
  metrics: SystemMetrics;
  recent_activities: AuditLog[];
  alerts: SecurityAlert[];
  revenue_chart: {
    labels: string[];
    data: number[];
  };
  user_growth_chart: {
    labels: string[];
    data: number[];
  };
  subscription_distribution: {
    plan_name: string;
    count: number;
    percentage: number;
  }[];
  payment_methods_distribution: {
    method: string;
    count: number;
    percentage: number;
  }[];
}

// Tipos para reportes
export interface ReportTemplate {
  id: number;
  name: string;
  description: string;
  type: ReportType;
  parameters: ReportParameter[];
  schedule?: ReportSchedule;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export type ReportType = 
  | 'users' 
  | 'growers' 
  | 'farms' 
  | 'subscriptions' 
  | 'payments' 
  | 'revenue' 
  | 'audit' 
  | 'system';

export interface ReportParameter {
  name: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  default_value?: any;
  options?: string[];
}

export interface ReportSchedule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  day_of_week?: number;
  day_of_month?: number;
  time: string;
  recipients: string[];
  is_active: boolean;
}

export interface GeneratedReport {
  id: number;
  template_id: number;
  name: string;
  parameters: Record<string, any>;
  status: ReportStatus;
  file_path?: string;
  file_size?: number;
  generated_by: number;
  generated_at: Date;
  error_message?: string;
}

// Tipos para notificaciones
export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  recipient_type: 'admin' | 'user' | 'all';
  recipient_id?: number;
  is_read: boolean;
  metadata?: Record<string, any>;
  created_at: Date;
  read_at?: Date;
}

export type NotificationType = 
  | 'info' 
  | 'warning' 
  | 'error' 
  | 'success' 
  | 'payment' 
  | 'subscription' 
  | 'security' 
  | 'system';

export interface NotificationCreateRequest {
  type: NotificationType;
  title: string;
  message: string;
  recipient_type: 'admin' | 'user' | 'all';
  recipient_id?: number;
  metadata?: Record<string, any>;
}

// Tipos para backup y mantenimiento
export interface BackupInfo {
  id: number;
  type: 'full' | 'incremental';
  status: 'pending' | 'running' | 'completed' | 'failed';
  file_path?: string;
  file_size?: number;
  started_at: Date;
  completed_at?: Date;
  error_message?: string;
}

export interface MaintenanceWindow {
  id: number;
  title: string;
  description: string;
  start_time: Date;
  end_time: Date;
  is_active: boolean;
  created_by: number;
  created_at: Date;
}

// Importar tipos de otros módulos para referencias
import type { AuditLog } from './audit.js';
import type { SecurityAlert } from './audit.js';
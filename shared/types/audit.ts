// Audit Types
export type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'login' | 'logout' | 'error' | 'export' | 'import';

export interface AuditLog {
  id: number;
  user_id: number;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  description?: string;
  created_at: string;
  user_name?: string;
  user_email?: string;
  user_role?: string;
}

export interface AuditLogCreateRequest {
  user_id: number;
  action: AuditAction;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  description?: string;
}

export interface AuditLogListFilters extends PaginationParams {
  search?: string;
  user_id?: number;
  action?: AuditAction;
  resource_type?: string;
  resource_id?: string;
  date_range?: DateRange;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface AuditLogListResponse {
  data: AuditLog[];
  pagination: PaginationInfo;
}

export interface AuditLogStats {
  total: number;
  today: number;
  this_week: number;
  this_month: number;
  by_action: Array<{
    action: AuditAction;
    count: number;
  }>;
  by_resource_type: Array<{
    resource_type: string;
    count: number;
  }>;
  by_user: Array<{
    user_id: number;
    user_name: string;
    email: string;
    count: number;
  }>;
  recent_activities: Array<{
    id: number;
    action: AuditAction;
    resource_type: string;
    resource_id?: string;
    description?: string;
    created_at: string;
    user_name?: string;
  }>;
  daily_activity: Array<{
    date: string;
    count: number;
  }>;
}

// Interfaces para el middleware de auditoría
export interface AuditInfo {
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  description?: string;
}

// Extender el tipo Request de Express para incluir información de auditoría
declare global {
  namespace Express {
    interface Request {
      auditInfo?: AuditInfo;
    }
  }
}
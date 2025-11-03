// Tipos para el sistema de administración

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  full_name: string;
  role: AdminRole;
  is_active: boolean;
  last_login?: Date;
  failed_login_attempts: number;
  locked_until?: Date;
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  created_at: Date;
  updated_at: Date;
}

export type AdminRole = 'super_admin' | 'admin' | 'moderator';

export interface AdminSession {
  id: string;
  admin_id: number;
  token: string;
  refresh_token: string;
  expires_at: Date;
  ip_address?: string;
  user_agent?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
  two_factor_code?: string;
}

export interface AdminLoginResponse {
  success: boolean;
  token?: string;
  refresh_token?: string;
  admin?: Omit<AdminUser, 'password_hash' | 'two_factor_secret'>;
  requires_2fa?: boolean;
  message?: string;
}

export interface AdminCreateRequest {
  username: string;
  email: string;
  password: string;
  full_name: string;
  role: AdminRole;
}

export interface AdminUpdateRequest {
  username?: string;
  email?: string;
  full_name?: string;
  role?: AdminRole;
  is_active?: boolean;
  two_factor_enabled?: boolean;
}

export interface AdminPasswordChangeRequest {
  current_password: string;
  new_password: string;
  confirm_password: string;
}

export interface TwoFactorSetupResponse {
  secret: string;
  qr_code: string;
  backup_codes: string[];
}

export interface AdminPermission {
  id: number;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface AdminRolePermission {
  role: AdminRole;
  permission_id: number;
  granted: boolean;
}

// Tipos para filtros y paginación
export interface AdminListFilters {
  role?: AdminRole;
  is_active?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sort_by?: 'username' | 'email' | 'full_name' | 'created_at' | 'last_login';
  sort_order?: 'asc' | 'desc';
}

export interface AdminListResponse {
  admins: AdminUser[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

// Tipos para estadísticas de administradores
export interface AdminStats {
  total_admins: number;
  active_admins: number;
  super_admins: number;
  admins: number;
  moderators: number;
  recent_logins: number;
  locked_accounts: number;
}
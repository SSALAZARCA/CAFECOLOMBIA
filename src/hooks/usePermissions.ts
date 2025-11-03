import { useAdminStore } from '@/stores/adminStore';

export interface Permission {
  id: string;
  name: string;
  description: string;
  category: string;
}

export const PERMISSIONS = {
  // Dashboard
  DASHBOARD_VIEW: 'dashboard:view',
  DASHBOARD_ANALYTICS: 'dashboard:analytics',
  
  // Usuarios
  USERS_VIEW: 'users:view',
  USERS_CREATE: 'users:create',
  USERS_EDIT: 'users:edit',
  USERS_DELETE: 'users:delete',
  USERS_EXPORT: 'users:export',
  
  // Caficultores
  GROWERS_VIEW: 'growers:view',
  GROWERS_CREATE: 'growers:create',
  GROWERS_EDIT: 'growers:edit',
  GROWERS_DELETE: 'growers:delete',
  GROWERS_EXPORT: 'growers:export',
  
  // Fincas
  FARMS_VIEW: 'farms:view',
  FARMS_CREATE: 'farms:create',
  FARMS_EDIT: 'farms:edit',
  FARMS_DELETE: 'farms:delete',
  FARMS_EXPORT: 'farms:export',
  
  // Planes de Suscripción
  PLANS_VIEW: 'plans:view',
  PLANS_CREATE: 'plans:create',
  PLANS_EDIT: 'plans:edit',
  PLANS_DELETE: 'plans:delete',
  
  // Suscripciones
  SUBSCRIPTIONS_VIEW: 'subscriptions:view',
  SUBSCRIPTIONS_CREATE: 'subscriptions:create',
  SUBSCRIPTIONS_EDIT: 'subscriptions:edit',
  SUBSCRIPTIONS_CANCEL: 'subscriptions:cancel',
  SUBSCRIPTIONS_EXPORT: 'subscriptions:export',
  
  // Pagos
  PAYMENTS_VIEW: 'payments:view',
  PAYMENTS_REFUND: 'payments:refund',
  PAYMENTS_EXPORT: 'payments:export',
  
  // Reportes
  REPORTS_VIEW: 'reports:view',
  REPORTS_EXPORT: 'reports:export',
  REPORTS_ANALYTICS: 'reports:analytics',
  
  // Auditoría
  AUDIT_VIEW: 'audit:view',
  AUDIT_EXPORT: 'audit:export',
  
  // Seguridad
  SECURITY_VIEW: 'security:view',
  SECURITY_MANAGE: 'security:manage',
  SECURITY_ROLES: 'security:roles',
  
  // Configuración
  SETTINGS_VIEW: 'settings:view',
  SETTINGS_EDIT: 'settings:edit',
  SETTINGS_SYSTEM: 'settings:system',
} as const;

export const PERMISSION_DEFINITIONS: Permission[] = [
  // Dashboard
  { id: PERMISSIONS.DASHBOARD_VIEW, name: 'Ver Dashboard', description: 'Acceso al panel principal', category: 'Dashboard' },
  { id: PERMISSIONS.DASHBOARD_ANALYTICS, name: 'Analíticas Dashboard', description: 'Ver métricas y analíticas avanzadas', category: 'Dashboard' },
  
  // Usuarios
  { id: PERMISSIONS.USERS_VIEW, name: 'Ver Usuarios', description: 'Listar y ver usuarios del sistema', category: 'Usuarios' },
  { id: PERMISSIONS.USERS_CREATE, name: 'Crear Usuarios', description: 'Crear nuevos usuarios', category: 'Usuarios' },
  { id: PERMISSIONS.USERS_EDIT, name: 'Editar Usuarios', description: 'Modificar información de usuarios', category: 'Usuarios' },
  { id: PERMISSIONS.USERS_DELETE, name: 'Eliminar Usuarios', description: 'Eliminar usuarios del sistema', category: 'Usuarios' },
  { id: PERMISSIONS.USERS_EXPORT, name: 'Exportar Usuarios', description: 'Exportar datos de usuarios', category: 'Usuarios' },
  
  // Caficultores
  { id: PERMISSIONS.GROWERS_VIEW, name: 'Ver Caficultores', description: 'Listar y ver caficultores', category: 'Caficultores' },
  { id: PERMISSIONS.GROWERS_CREATE, name: 'Crear Caficultores', description: 'Registrar nuevos caficultores', category: 'Caficultores' },
  { id: PERMISSIONS.GROWERS_EDIT, name: 'Editar Caficultores', description: 'Modificar información de caficultores', category: 'Caficultores' },
  { id: PERMISSIONS.GROWERS_DELETE, name: 'Eliminar Caficultores', description: 'Eliminar caficultores', category: 'Caficultores' },
  { id: PERMISSIONS.GROWERS_EXPORT, name: 'Exportar Caficultores', description: 'Exportar datos de caficultores', category: 'Caficultores' },
  
  // Fincas
  { id: PERMISSIONS.FARMS_VIEW, name: 'Ver Fincas', description: 'Listar y ver fincas', category: 'Fincas' },
  { id: PERMISSIONS.FARMS_CREATE, name: 'Crear Fincas', description: 'Registrar nuevas fincas', category: 'Fincas' },
  { id: PERMISSIONS.FARMS_EDIT, name: 'Editar Fincas', description: 'Modificar información de fincas', category: 'Fincas' },
  { id: PERMISSIONS.FARMS_DELETE, name: 'Eliminar Fincas', description: 'Eliminar fincas', category: 'Fincas' },
  { id: PERMISSIONS.FARMS_EXPORT, name: 'Exportar Fincas', description: 'Exportar datos de fincas', category: 'Fincas' },
  
  // Planes
  { id: PERMISSIONS.PLANS_VIEW, name: 'Ver Planes', description: 'Ver planes de suscripción', category: 'Planes' },
  { id: PERMISSIONS.PLANS_CREATE, name: 'Crear Planes', description: 'Crear nuevos planes', category: 'Planes' },
  { id: PERMISSIONS.PLANS_EDIT, name: 'Editar Planes', description: 'Modificar planes existentes', category: 'Planes' },
  { id: PERMISSIONS.PLANS_DELETE, name: 'Eliminar Planes', description: 'Eliminar planes de suscripción', category: 'Planes' },
  
  // Suscripciones
  { id: PERMISSIONS.SUBSCRIPTIONS_VIEW, name: 'Ver Suscripciones', description: 'Ver suscripciones activas', category: 'Suscripciones' },
  { id: PERMISSIONS.SUBSCRIPTIONS_CREATE, name: 'Crear Suscripciones', description: 'Crear nuevas suscripciones', category: 'Suscripciones' },
  { id: PERMISSIONS.SUBSCRIPTIONS_EDIT, name: 'Editar Suscripciones', description: 'Modificar suscripciones', category: 'Suscripciones' },
  { id: PERMISSIONS.SUBSCRIPTIONS_CANCEL, name: 'Cancelar Suscripciones', description: 'Cancelar suscripciones activas', category: 'Suscripciones' },
  { id: PERMISSIONS.SUBSCRIPTIONS_EXPORT, name: 'Exportar Suscripciones', description: 'Exportar datos de suscripciones', category: 'Suscripciones' },
  
  // Pagos
  { id: PERMISSIONS.PAYMENTS_VIEW, name: 'Ver Pagos', description: 'Ver historial de pagos', category: 'Pagos' },
  { id: PERMISSIONS.PAYMENTS_REFUND, name: 'Procesar Reembolsos', description: 'Procesar reembolsos de pagos', category: 'Pagos' },
  { id: PERMISSIONS.PAYMENTS_EXPORT, name: 'Exportar Pagos', description: 'Exportar datos de pagos', category: 'Pagos' },
  
  // Reportes
  { id: PERMISSIONS.REPORTS_VIEW, name: 'Ver Reportes', description: 'Acceso a reportes del sistema', category: 'Reportes' },
  { id: PERMISSIONS.REPORTS_EXPORT, name: 'Exportar Reportes', description: 'Exportar reportes generados', category: 'Reportes' },
  { id: PERMISSIONS.REPORTS_ANALYTICS, name: 'Analíticas Avanzadas', description: 'Acceso a analíticas avanzadas', category: 'Reportes' },
  
  // Auditoría
  { id: PERMISSIONS.AUDIT_VIEW, name: 'Ver Auditoría', description: 'Ver logs de auditoría', category: 'Auditoría' },
  { id: PERMISSIONS.AUDIT_EXPORT, name: 'Exportar Auditoría', description: 'Exportar logs de auditoría', category: 'Auditoría' },
  
  // Seguridad
  { id: PERMISSIONS.SECURITY_VIEW, name: 'Ver Seguridad', description: 'Ver configuración de seguridad', category: 'Seguridad' },
  { id: PERMISSIONS.SECURITY_MANAGE, name: 'Gestionar Seguridad', description: 'Modificar configuración de seguridad', category: 'Seguridad' },
  { id: PERMISSIONS.SECURITY_ROLES, name: 'Gestionar Roles', description: 'Crear y modificar roles de usuario', category: 'Seguridad' },
  
  // Configuración
  { id: PERMISSIONS.SETTINGS_VIEW, name: 'Ver Configuración', description: 'Ver configuración del sistema', category: 'Configuración' },
  { id: PERMISSIONS.SETTINGS_EDIT, name: 'Editar Configuración', description: 'Modificar configuración del sistema', category: 'Configuración' },
  { id: PERMISSIONS.SETTINGS_SYSTEM, name: 'Configuración Sistema', description: 'Acceso a configuración crítica del sistema', category: 'Configuración' },
];

export const ROLE_PERMISSIONS = {
  super_admin: Object.values(PERMISSIONS),
  admin: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_EXPORT,
    PERMISSIONS.GROWERS_VIEW,
    PERMISSIONS.GROWERS_CREATE,
    PERMISSIONS.GROWERS_EDIT,
    PERMISSIONS.GROWERS_EXPORT,
    PERMISSIONS.FARMS_VIEW,
    PERMISSIONS.FARMS_CREATE,
    PERMISSIONS.FARMS_EDIT,
    PERMISSIONS.FARMS_EXPORT,
    PERMISSIONS.PLANS_VIEW,
    PERMISSIONS.PLANS_CREATE,
    PERMISSIONS.PLANS_EDIT,
    PERMISSIONS.SUBSCRIPTIONS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_CREATE,
    PERMISSIONS.SUBSCRIPTIONS_EDIT,
    PERMISSIONS.SUBSCRIPTIONS_EXPORT,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.PAYMENTS_EXPORT,
    PERMISSIONS.REPORTS_VIEW,
    PERMISSIONS.REPORTS_EXPORT,
    PERMISSIONS.AUDIT_VIEW,
    PERMISSIONS.SETTINGS_VIEW,
  ],
  moderator: [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.GROWERS_VIEW,
    PERMISSIONS.FARMS_VIEW,
    PERMISSIONS.PLANS_VIEW,
    PERMISSIONS.SUBSCRIPTIONS_VIEW,
    PERMISSIONS.PAYMENTS_VIEW,
    PERMISSIONS.REPORTS_VIEW,
  ],
};

export const usePermissions = () => {
  const { currentAdmin } = useAdminStore();

  const hasPermission = (permission: string): boolean => {
    if (!currentAdmin) return false;
    
    // Si es super admin, tiene todos los permisos
    if (currentAdmin.is_super_admin || currentAdmin.role === 'super_admin') return true;
    
    // Si tiene el permiso universal '*', tiene todos los permisos
    if (currentAdmin.permissions && currentAdmin.permissions.includes('*')) return true;
    
    // Si no tiene permisos definidos, usar los permisos por rol
    if (!currentAdmin.permissions || currentAdmin.permissions.length === 0) {
      const rolePermissions = ROLE_PERMISSIONS[currentAdmin.role as keyof typeof ROLE_PERMISSIONS] || [];
      return rolePermissions.includes(permission);
    }
    
    return currentAdmin.permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!currentAdmin) return false;
    
    // Si es super admin, tiene todos los permisos
    if (currentAdmin.is_super_admin || currentAdmin.role === 'super_admin') return true;
    
    // Si tiene el permiso universal '*', tiene todos los permisos
    if (currentAdmin.permissions && currentAdmin.permissions.includes('*')) return true;
    
    return permissions.some(permission => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!currentAdmin) return false;
    
    // Si es super admin, tiene todos los permisos
    if (currentAdmin.is_super_admin || currentAdmin.role === 'super_admin') return true;
    
    // Si tiene el permiso universal '*', tiene todos los permisos
    if (currentAdmin.permissions && currentAdmin.permissions.includes('*')) return true;
    
    return permissions.every(permission => hasPermission(permission));
  };

  const hasRole = (role: string): boolean => {
    if (!currentAdmin) return false;
    return currentAdmin.role === role;
  };

  const hasMinimumRole = (minimumRole: 'moderator' | 'admin' | 'super_admin'): boolean => {
    if (!currentAdmin) return false;
    
    const roleHierarchy = {
      'moderator': 1,
      'admin': 2,
      'super_admin': 3
    };

    const userRoleLevel = roleHierarchy[currentAdmin.role as keyof typeof roleHierarchy] || 0;
    const minimumRoleLevel = roleHierarchy[minimumRole] || 0;

    return userRoleLevel >= minimumRoleLevel;
  };

  const canAccess = (requiredRole?: string, requiredPermissions?: string[]): boolean => {
    // Verificar rol si es requerido
    if (requiredRole && !hasMinimumRole(requiredRole as any)) {
      return false;
    }

    // Verificar permisos si son requeridos
    if (requiredPermissions && requiredPermissions.length > 0) {
      return hasAllPermissions(requiredPermissions);
    }

    return true;
  };

  const getUserPermissions = (): string[] => {
    if (!currentAdmin) return [];
    
    // Si es super admin, devolver todos los permisos
    if (currentAdmin.is_super_admin || currentAdmin.role === 'super_admin') {
      return Object.values(PERMISSIONS);
    }
    
    // Si tiene permisos definidos, devolverlos
    if (currentAdmin.permissions && currentAdmin.permissions.length > 0) {
      return currentAdmin.permissions;
    }
    
    // Si no, devolver permisos por rol
    return ROLE_PERMISSIONS[currentAdmin.role as keyof typeof ROLE_PERMISSIONS] || [];
  };

  const getPermissionsByCategory = (category: string): Permission[] => {
    return PERMISSION_DEFINITIONS.filter(permission => permission.category === category);
  };

  const getAllCategories = (): string[] => {
    return [...new Set(PERMISSION_DEFINITIONS.map(permission => permission.category))];
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    hasMinimumRole,
    canAccess,
    getUserPermissions,
    getPermissionsByCategory,
    getAllCategories,
    user: currentAdmin,
    permissions: PERMISSIONS,
    permissionDefinitions: PERMISSION_DEFINITIONS,
    rolePermissions: ROLE_PERMISSIONS,
  };
};
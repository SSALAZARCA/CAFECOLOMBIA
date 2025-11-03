// =====================================================
// SIDEBAR DEL PANEL DE ADMINISTRACIÓN
// Café Colombia - Super Administrator Panel
// =====================================================

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Users,
  UserCheck,
  Building,
  CreditCard,
  FileBarChart,
  BarChart3,
  Settings,
  ShieldCheck,
  ClipboardList,
  UserCircle,
  X,
  DollarSign,
  Layers
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import { usePermissions } from '../../hooks/usePermissions';

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentPath: string;
}

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  description: string;
  badge?: string;
  permission?: string;
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ isOpen, onClose, currentPath }) => {
  const { currentAdmin } = useAdminStore();
  const { hasPermission } = usePermissions();

  // =====================================================
  // ELEMENTOS DE NAVEGACIÓN
  // =====================================================

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: Home,
      description: 'Panel principal con métricas y KPIs',
      permission: 'dashboard:view'
    },
    {
      name: 'Usuarios',
      href: '/admin/users',
      icon: Users,
      description: 'Gestión de usuarios del sistema',
      permission: 'users:view'
    },
    {
      name: 'Caficultores',
      href: '/admin/coffee-growers',
      icon: UserCheck,
      description: 'Gestión de productores de café',
      permission: 'growers:view'
    },
    {
      name: 'Fincas',
      href: '/admin/farms',
      icon: Building,
      description: 'Gestión de fincas cafeteras',
      permission: 'farms:view'
    },
    {
      name: 'Suscripciones',
      href: '/admin/subscriptions',
      icon: Layers,
      description: 'Gestión de suscripciones activas',
      permission: 'subscriptions:view'
    },
    {
      name: 'Planes',
      href: '/admin/subscription-plans',
      icon: CreditCard,
      description: 'Configuración de planes de suscripción',
      permission: 'plans:view'
    },
    {
      name: 'Pagos',
      href: '/admin/payments',
      icon: DollarSign,
      description: 'Historial y gestión de pagos',
      permission: 'payments:view'
    },
    {
      name: 'Reportes',
      href: '/admin/reports',
      icon: FileBarChart,
      description: 'Generación de reportes personalizados',
      permission: 'reports:view'
    },
    {
      name: 'Analíticas',
      href: '/admin/analytics',
      icon: BarChart3,
      description: 'Dashboard de analíticas avanzadas',
      permission: 'reports:analytics'
    },
    {
      name: 'Configuración',
      href: '/admin/settings',
      icon: Settings,
      description: 'Configuración del sistema',
      permission: 'settings:view'
    },
    {
      name: 'Seguridad',
      href: '/admin/security',
      icon: ShieldCheck,
      description: 'Gestión de roles y permisos',
      permission: 'security:view'
    },
    {
      name: 'Auditoría',
      href: '/admin/audit',
      icon: ClipboardList,
      description: 'Registro de actividades del sistema',
      permission: 'audit:view'
    },
    {
      name: 'Mi Perfil',
      href: '/admin/profile',
      icon: UserCircle,
      description: 'Configuración del perfil personal'
      // Sin permiso requerido - todos pueden ver su perfil
    }
  ];

  // =====================================================
  // FILTRAR NAVEGACIÓN POR PERMISOS
  // =====================================================

  const filteredNavigation = navigation.filter(item => {
    if (!item.permission) return true;
    return hasPermission(item.permission);
  });

  // =====================================================
  // VERIFICAR SI RUTA ESTÁ ACTIVA
  // =====================================================

  const isActiveRoute = (href: string): boolean => {
    if (href === '/admin') {
      return currentPath === '/admin';
    }
    return currentPath.startsWith(href);
  };

  // =====================================================
  // CLASES CSS PARA ELEMENTOS DE NAVEGACIÓN
  // =====================================================

  const getNavItemClasses = (href: string): string => {
    const baseClasses = 'group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200';
    
    if (isActiveRoute(href)) {
      return `${baseClasses} bg-blue-100 text-blue-700 border-r-2 border-blue-600`;
    }
    
    return `${baseClasses} text-gray-700 hover:bg-gray-100 hover:text-gray-900`;
  };

  const getIconClasses = (href: string): string => {
    const baseClasses = 'mr-3 flex-shrink-0 h-5 w-5 transition-colors duration-200';
    
    if (isActiveRoute(href)) {
      return `${baseClasses} text-blue-600`;
    }
    
    return `${baseClasses} text-gray-400 group-hover:text-gray-600`;
  };

  // =====================================================
  // RENDER DEL COMPONENTE
  // =====================================================

  return (
    <>
      {/* Sidebar para desktop */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo y título */}
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">CC</span>
              </div>
              <div className="ml-3">
                <h1 className="text-lg font-bold text-gray-900">Café Colombia</h1>
                <p className="text-xs text-gray-500">Panel de Administración</p>
              </div>
            </div>
          </div>

          {/* Información del administrador */}
          {currentAdmin && (
            <div className="px-4 mb-6">
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {currentAdmin.first_name?.charAt(0)}{currentAdmin.last_name?.charAt(0)}
                    </span>
                  </div>
                  <div className="ml-3 flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {currentAdmin.first_name} {currentAdmin.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentAdmin.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navegación */}
          <nav className="flex-1 px-3 space-y-1">
            {filteredNavigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={getNavItemClasses(item.href)}
                  title={item.description}
                >
                  <Icon className={getIconClasses(item.href)} />
                  <span className="flex-1">{item.name}</span>
                  {item.badge && (
                    <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Información de versión */}
          <div className="px-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>Versión 1.0.0</p>
              <p>© 2024 Café Colombia</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar para móvil */}
      <div className={`lg:hidden fixed inset-0 z-50 ${isOpen ? 'block' : 'hidden'}`}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={onClose} />
        
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          {/* Botón de cerrar */}
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={onClose}
            >
              <span className="sr-only">Cerrar sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          {/* Contenido del sidebar móvil */}
          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            {/* Logo y título */}
            <div className="flex items-center flex-shrink-0 px-4 mb-8">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-green-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">CC</span>
                </div>
                <div className="ml-3">
                  <h1 className="text-lg font-bold text-gray-900">Café Colombia</h1>
                  <p className="text-xs text-gray-500">Panel de Administración</p>
                </div>
              </div>
            </div>

            {/* Información del administrador */}
            {currentAdmin && (
              <div className="px-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {currentAdmin.first_name?.charAt(0)}{currentAdmin.last_name?.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-3 flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {currentAdmin.first_name} {currentAdmin.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {currentAdmin.role}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navegación móvil */}
            <nav className="px-3 space-y-1">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={getNavItemClasses(item.href)}
                    onClick={onClose}
                    title={item.description}
                  >
                    <Icon className={getIconClasses(item.href)} />
                    <span className="flex-1">{item.name}</span>
                    {item.badge && (
                      <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* Información de versión móvil */}
          <div className="px-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-500 text-center">
              <p>Versión 1.0.0</p>
              <p>© 2024 Café Colombia</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminSidebar;
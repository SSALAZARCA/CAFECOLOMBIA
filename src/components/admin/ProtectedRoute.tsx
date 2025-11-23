import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '@/stores/adminStore';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'super_admin' | 'admin' | 'moderator';
  requiredPermissions?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
  requiredPermissions = []
}) => {
  const location = useLocation();
  const { isAuthenticated, currentAdmin, loading } = useAdminStore();

  // DEBUG: Agregar logs del estado de autenticación
  console.log('🔐 DEBUG ProtectedRoute - Estado de autenticación:');
  console.log('🔓 isAuthenticated:', isAuthenticated);
  console.log('⏳ loading:', loading);
  console.log('👤 currentAdmin:', currentAdmin);
  console.log('📍 location.pathname:', location.pathname);

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-amber-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Redirigir al login si no está autenticado
  if (!isAuthenticated || !currentAdmin) {
    // Si hay sesión general de usuario cafetero/trabajador, redirigir al dashboard público
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        const parsed = JSON.parse(rawUser);
        const role = parsed?.role;
        if (role === 'coffee_grower' || role === 'trabajador') {
          return <Navigate to="/dashboard" replace />;
        }
      }
    } catch {}

    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Si el usuario no pertenece al contexto admin, redirigir al dashboard público
  const adminRoles = ['super_admin', 'admin', 'moderator'];
  if (!adminRoles.includes(currentAdmin.role as any)) {
    return <Navigate to="/dashboard" replace />;
  }

  // Verificar rol requerido
  if (requiredRole && currentAdmin.role !== requiredRole) {
    // Verificar jerarquía de roles
    const roleHierarchy = {
      'super_admin': 3,
      'admin': 2,
      'moderator': 1
    };

    const userRoleLevel = roleHierarchy[currentAdmin.role as keyof typeof roleHierarchy] || 0;
    const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

    if (userRoleLevel < requiredRoleLevel) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Acceso Denegado</h2>
            <p className="text-gray-600 mb-4">
              No tienes permisos suficientes para acceder a esta página.
            </p>
            <p className="text-sm text-gray-500">
              Rol requerido: <span className="font-medium">{requiredRole}</span><br />
              Tu rol actual: <span className="font-medium">{currentAdmin.role}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      );
    }
  }

  // DEBUG: Agregar logs antes de verificar permisos
  console.log('🚀 DEBUG ProtectedRoute - Estado inicial:');
  console.log('📋 requiredPermissions:', requiredPermissions);
  console.log('👤 currentAdmin completo:', currentAdmin);
  console.log('🔑 currentAdmin.permissions existe?:', !!currentAdmin.permissions);
  console.log('⭐ currentAdmin.is_super_admin:', currentAdmin.is_super_admin);
  console.log('🌟 currentAdmin.role:', currentAdmin.role);

  // Verificar permisos específicos
  if (requiredPermissions.length > 0 && currentAdmin.permissions) {
    // DEBUG: Agregar logs para diagnosticar el problema
    console.log('🔍 DEBUG ProtectedRoute - Verificando permisos:');
    console.log('📋 requiredPermissions:', requiredPermissions);
    console.log('👤 currentAdmin:', currentAdmin);
    console.log('🔑 currentAdmin.permissions:', currentAdmin.permissions);
    console.log('⭐ currentAdmin.is_super_admin:', currentAdmin.is_super_admin);
    console.log('🌟 currentAdmin.role:', currentAdmin.role);
    
    // Super admin tiene todos los permisos
    if (currentAdmin.is_super_admin) {
      console.log('✅ Super admin detectado - permitiendo acceso');
      // Super admin pasa todas las verificaciones
    } else if (currentAdmin.permissions.includes('*')) {
      console.log('✅ Permiso comodín (*) detectado - permitiendo acceso');
      // Permiso comodín otorga todos los permisos
    } else {
      // Verificar permisos específicos para otros roles
      console.log('🔍 Verificando permisos específicos para usuario no super admin');
      const hasAllPermissions = requiredPermissions.every(permission => {
        const hasPermission = currentAdmin.permissions.includes(permission);
        console.log(`🔐 Permiso "${permission}": ${hasPermission ? '✅' : '❌'}`);
        return hasPermission;
      });
      
      console.log('📊 Resultado final hasAllPermissions:', hasAllPermissions);

      if (!hasAllPermissions) {
        console.log('❌ Acceso denegado - permisos insuficientes');
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center max-w-md mx-auto p-6">
              <div className="bg-yellow-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 0h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Permisos Insuficientes</h2>
              <p className="text-gray-600 mb-4">
                No tienes los permisos necesarios para acceder a esta funcionalidad.
              </p>
              <div className="text-sm text-gray-500 mb-4">
                <p className="mb-2">Permisos requeridos:</p>
                <ul className="list-disc list-inside space-y-1">
                  {requiredPermissions.map(permission => (
                    <li key={permission} className="font-medium">{permission}</li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => window.history.back()}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        );
      }
    }
  }

  // Si pasa todas las verificaciones, renderizar el contenido
  return <>{children}</>;
};

export default ProtectedRoute;

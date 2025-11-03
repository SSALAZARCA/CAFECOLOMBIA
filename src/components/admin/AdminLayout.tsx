// =====================================================
// LAYOUT PRINCIPAL DEL PANEL DE ADMINISTRACIÓN
// Café Colombia - Super Administrator Panel
// =====================================================

import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAdminStore } from '../../stores/adminStore';
import AdminSidebar from './AdminSidebar';
import AdminHeader from './AdminHeader';
import AdminNotifications from './AdminNotifications';
import BreadcrumbNavigation from './BreadcrumbNavigation';
import { adminApiService } from '../../services/adminApiService';

interface AdminLayoutProps {
  children?: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const {
    isAuthenticated,
    currentAdmin,
    session,
    logout,
    refreshSession,
    setLoading,
    addNotification
  } = useAdminStore();

  // =====================================================
  // VERIFICACIÓN DE AUTENTICACIÓN
  // =====================================================

  useEffect(() => {
    // Verificación simple de autenticación
    if (!isAuthenticated || !currentAdmin) {
      console.log('No hay sesión activa, redirigiendo a login');
      navigate('/admin/login', { replace: true });
      return;
    }

    // Verificar si la sesión ha expirado
    if (session?.expires_at && new Date() > new Date(session.expires_at)) {
      console.log('Sesión expirada, cerrando sesión');
      logout().then(() => {
        navigate('/admin/login', { replace: true });
      });
      return;
    }

    // Si llegamos aquí, la autenticación es válida
    setIsLoading(false);
  }, [isAuthenticated, currentAdmin, session, navigate, logout]);

  // =====================================================
  // AUTO-RENOVACIÓN DE SESIÓN
  // =====================================================

  useEffect(() => {
    if (!isAuthenticated || !session?.expires_at) return;

    const checkSessionExpiry = () => {
      const now = new Date();
      const expiry = new Date(session.expires_at);
      const timeUntilExpiry = expiry.getTime() - now.getTime();

      // Renovar sesión 5 minutos antes de que expire
      if (timeUntilExpiry <= 5 * 60 * 1000 && timeUntilExpiry > 0) {
        refreshSession().catch((error) => {
          console.error('Error al renovar sesión automáticamente:', error);
        });
      }
    };

    const interval = setInterval(checkSessionExpiry, 60000); // Verificar cada minuto

    return () => clearInterval(interval);
  }, [isAuthenticated, session, refreshSession]);

  // =====================================================
  // MANEJO DE EVENTOS
  // =====================================================

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleLogout = async () => {
    try {
      setLoading(true);
      await logout();
      navigate('/admin/login', { replace: true });
      addNotification({
        id: Date.now().toString(),
        type: 'success',
        title: 'Sesión cerrada',
        message: 'Has cerrado sesión exitosamente.',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      addNotification({
        id: Date.now().toString(),
        type: 'error',
        title: 'Error',
        message: 'Error al cerrar sesión. Inténtalo de nuevo.',
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // PANTALLA DE CARGA
  // =====================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Cargando Panel de Administración
          </h2>
          <p className="text-gray-600">
            Verificando autenticación y configuración...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // VERIFICACIÓN DE AUTENTICACIÓN
  // =====================================================

  if (!isAuthenticated || !currentAdmin) {
    return null; // El useEffect se encargará de redirigir
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        currentPath={location.pathname}
      />

      {/* Overlay para móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Contenido principal */}
      <div className="lg:pl-64">
        {/* Header */}
        <AdminHeader
          onMenuClick={handleSidebarToggle}
          onLogout={handleLogout}
          admin={currentAdmin}
        />

        {/* Contenido de la página */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Navegación de breadcrumbs */}
            <BreadcrumbNavigation />
            
            {children || <Outlet />}
          </div>
        </main>
      </div>

      {/* Notificaciones */}
      <AdminNotifications />

      {/* Indicador de estado de conexión */}
      <div className="fixed bottom-4 right-4 z-50">
        <div className="flex items-center space-x-2 bg-white rounded-lg shadow-lg px-3 py-2 border">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-600">Conectado</span>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
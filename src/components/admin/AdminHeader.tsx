// =====================================================
// HEADER DEL PANEL DE ADMINISTRACIÓN
// Café Colombia - Super Administrator Panel
// =====================================================

import React, { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  UserCircle,
  LogOut,
  Settings,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import GlobalSearch from './GlobalSearch';
import type { AdminUser } from '../../types/admin';

interface AdminHeaderProps {
  onMenuClick: () => void;
  onLogout: () => void;
  admin: AdminUser;
}

const AdminHeader: React.FC<AdminHeaderProps> = ({ onMenuClick, onLogout, admin }) => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);
  
  const userMenuRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  
  const { notifications, unreadNotificationsCount, markNotificationAsRead } = useAdminStore();

  // =====================================================
  // CERRAR MENÚS AL HACER CLICK FUERA
  // =====================================================

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // =====================================================
  // MANEJO DE EVENTOS
  // =====================================================

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Implementar lógica de búsqueda global
      console.log('Buscar:', searchQuery);
    }
  };

  const handleNotificationClick = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Implementar lógica de tema oscuro
    document.documentElement.classList.toggle('dark');
  };

  // =====================================================
  // FORMATEAR TIEMPO RELATIVO
  // =====================================================

  const formatRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // =====================================================
  // OBTENER INICIALES DEL USUARIO
  // =====================================================

  const getUserInitials = (): string => {
    const firstName = admin.first_name || '';
    const lastName = admin.last_name || '';
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // =====================================================
  // RENDER DEL COMPONENTE
  // =====================================================

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Lado izquierdo */}
          <div className="flex items-center">
            {/* Botón de menú móvil */}
            <button
              type="button"
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              onClick={onMenuClick}
            >
              <span className="sr-only">Abrir menú</span>
              <Menu className="h-6 w-6" />
            </button>

            {/* Título de la página */}
            <div className="ml-4 lg:ml-0">
              <h1 className="text-xl font-semibold text-gray-900">
                Panel de Administración
              </h1>
            </div>
          </div>

          {/* Centro - Búsqueda global */}
          <div className="hidden md:block flex-1 max-w-lg mx-8">
            <GlobalSearch />
          </div>

          {/* Lado derecho */}
          <div className="flex items-center space-x-4">
            {/* Botón de tema */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              title={darkMode ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            >
              {darkMode ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>

            {/* Notificaciones */}
            <div className="relative" ref={notificationsRef}>
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 relative"
              >
                <span className="sr-only">Ver notificaciones</span>
                <Bell className="h-6 w-6" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {unreadNotificationsCount > 9 ? '9+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {/* Panel de notificaciones */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-gray-900">Notificaciones</h3>
                      {unreadNotificationsCount > 0 && (
                        <span className="text-xs text-blue-600">
                          {unreadNotificationsCount} nuevas
                        </span>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No hay notificaciones
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {notifications.slice(0, 5).map((notification) => (
                            <div
                              key={notification.id}
                              onClick={() => handleNotificationClick(notification.id)}
                              className={`p-3 rounded-md cursor-pointer transition-colors ${
                                notification.read
                                  ? 'bg-gray-50 hover:bg-gray-100'
                                  : 'bg-blue-50 hover:bg-blue-100'
                              }`}
                            >
                              <div className="flex items-start">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900">
                                    {notification.title}
                                  </p>
                                  <p className="text-sm text-gray-600 mt-1">
                                    {notification.message}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-1">
                                    {formatRelativeTime(notification.timestamp)}
                                  </p>
                                </div>
                                {!notification.read && (
                                  <div className="w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {notifications.length > 5 && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <Link
                          to="/admin/notifications"
                          className="text-sm text-blue-600 hover:text-blue-500"
                          onClick={() => setNotificationsOpen(false)}
                        >
                          Ver todas las notificaciones
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Menú de usuario */}
            <div className="relative" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <span className="sr-only">Abrir menú de usuario</span>
                <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {getUserInitials()}
                  </span>
                </div>
                <div className="ml-3 hidden md:block text-left">
                  <p className="text-sm font-medium text-gray-700">
                    {admin.first_name} {admin.last_name}
                  </p>
                  <p className="text-xs text-gray-500">{admin.role}</p>
                </div>
              </button>

              {/* Dropdown del menú de usuario */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1">
                    <div className="px-4 py-2 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900">
                        {admin.first_name} {admin.last_name}
                      </p>
                      <p className="text-sm text-gray-500">{admin.email}</p>
                    </div>
                    
                    <Link
                      to="/admin/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <UserCircle className="h-4 w-4 mr-3" />
                      Mi Perfil
                    </Link>
                    
                    <Link
                      to="/admin/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Configuración
                    </Link>
                    
                    <Link
                      to="/admin/security"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <ShieldCheck className="h-4 w-4 mr-3" />
                      Seguridad
                    </Link>
                    
                    <div className="border-t border-gray-200">
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          onLogout();
                        }}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
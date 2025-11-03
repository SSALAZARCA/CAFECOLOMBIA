import { useState, useEffect, useRef } from 'react';
import { Coffee, Menu, Bell, User, Settings, Wifi, WifiOff, LogOut, ChevronDown } from 'lucide-react';
import { PWASettings } from './ui/PWASettings';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { useAuth } from '../hooks/useAuth';

interface HeaderProps {
  onMenuClick: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showPWASettings, setShowPWASettings] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { isOnline, pendingSyncCount } = useOnlineStatus();
  const { user, logout } = useAuth();
  const notificationsRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };

    if (showNotifications || showUserMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showUserMenu]);

  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
  };

  // Mock notifications data
  const notifications = [
    {
      id: 1,
      title: 'Sincronización completada',
      message: 'Todos los datos se han sincronizado correctamente',
      time: '5 min',
      type: 'success'
    },
    {
      id: 2,
      title: 'Alerta de plagas',
      message: 'Se detectó actividad de broca en el Lote A',
      time: '1 hora',
      type: 'warning'
    },
    {
      id: 3,
      title: 'Recordatorio',
      message: 'Programar aplicación de fertilizante',
      time: '2 horas',
      type: 'info'
    }
  ];

  return (
    <>
      <header className="bg-white shadow-sm border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="p-2 rounded-md hover:bg-gray-100 lg:hidden"
            >
              <Menu className="h-6 w-6 text-gray-600" />
            </button>
            
            <div className="flex items-center space-x-2">
              <Coffee className="h-8 w-8 text-amber-600" />
              <h1 className="text-xl font-bold text-gray-900">Café Colombia</h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Connection Status Icon */}
            <div className="flex items-center">
              {isOnline ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-500" />
              )}
              {pendingSyncCount > 0 && (
                <span className="ml-1 px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                  {pendingSyncCount}
                </span>
              )}
            </div>

            {/* PWA Settings Button */}
            <button 
              onClick={() => setShowPWASettings(true)}
              className="p-2 rounded-md hover:bg-gray-100 relative"
              title="Configuración PWA"
            >
              <Settings className="h-5 w-5 text-gray-600" />
            </button>

            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button 
                className="p-2 rounded-md hover:bg-gray-100 relative"
                onClick={() => setShowNotifications(!showNotifications)}
                title="Notificaciones"
              >
                <Bell className="h-6 w-6 text-gray-600" />
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </button>

              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notification) => (
                        <div key={notification.id} className="p-4 border-b border-gray-100 hover:bg-gray-50">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="text-sm font-medium text-gray-900">{notification.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">{notification.time}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">
                        No hay notificaciones
                      </div>
                    )}
                  </div>
                  <div className="p-3 border-t border-gray-200">
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="w-full text-sm text-blue-600 hover:text-blue-800"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            {/* User Profile */}
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100"
              >
                <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center">
                  <User className="h-5 w-5 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">
                  {user?.nombre || 'Caficultor'}
                </span>
                <ChevronDown className="h-4 w-4 text-gray-500" />
              </button>

              {/* User Menu Dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                  <div className="p-3 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900">{user?.nombre || 'Usuario'}</p>
                    <p className="text-xs text-gray-500">{user?.email || ''}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* PWA Settings Modal */}
      <PWASettings 
        isOpen={showPWASettings} 
        onClose={() => setShowPWASettings(false)} 
      />
    </>
  );
}
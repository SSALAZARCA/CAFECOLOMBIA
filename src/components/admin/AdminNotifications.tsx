// =====================================================
// SISTEMA DE NOTIFICACIONES DEL PANEL DE ADMINISTRACIÓN
// Café Colombia - Super Administrator Panel
// =====================================================

import React, { useEffect } from 'react';
import {
  CheckCircle,
  AlertTriangle,
  Info,
  XCircle,
  X
} from 'lucide-react';
import { useAdminStore } from '../../stores/adminStore';
import type { AdminNotification } from '../../types/admin';

const AdminNotifications: React.FC = () => {
  const { notifications, removeNotification } = useAdminStore();

  // =====================================================
  // AUTO-REMOVER NOTIFICACIONES
  // =====================================================

  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    notifications.forEach((notification) => {
      if (!notification.persistent) {
        const timer = setTimeout(() => {
          removeNotification(notification.id);
        }, 5000); // 5 segundos
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  // =====================================================
  // OBTENER ICONO POR TIPO
  // =====================================================

  const getNotificationIcon = (type: AdminNotification['type']) => {
    const iconClasses = "h-5 w-5";
    
    switch (type) {
      case 'success':
        return <CheckCircle className={`${iconClasses} text-green-500`} />;
      case 'error':
        return <XCircle className={`${iconClasses} text-red-500`} />;
      case 'warning':
        return <AlertTriangle className={`${iconClasses} text-yellow-500`} />;
      case 'info':
      default:
        return <Info className={`${iconClasses} text-blue-500`} />;
    }
  };

  // =====================================================
  // OBTENER CLASES CSS POR TIPO
  // =====================================================

  const getNotificationClasses = (type: AdminNotification['type']) => {
    const baseClasses = "max-w-sm w-full bg-white shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden";
    
    switch (type) {
      case 'success':
        return `${baseClasses} border-l-4 border-green-500`;
      case 'error':
        return `${baseClasses} border-l-4 border-red-500`;
      case 'warning':
        return `${baseClasses} border-l-4 border-yellow-500`;
      case 'info':
      default:
        return `${baseClasses} border-l-4 border-blue-500`;
    }
  };

  // =====================================================
  // OBTENER COLOR DE FONDO POR TIPO
  // =====================================================

  const getBackgroundColor = (type: AdminNotification['type']) => {
    switch (type) {
      case 'success':
        return 'bg-green-50';
      case 'error':
        return 'bg-red-50';
      case 'warning':
        return 'bg-yellow-50';
      case 'info':
      default:
        return 'bg-blue-50';
    }
  };

  // =====================================================
  // FORMATEAR TIEMPO
  // =====================================================

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // =====================================================
  // FILTRAR NOTIFICACIONES VISIBLES
  // =====================================================

  const visibleNotifications = notifications
    .filter(notification => !notification.read || notification.persistent)
    .slice(0, 5); // Máximo 5 notificaciones visibles

  // =====================================================
  // RENDER DEL COMPONENTE
  // =====================================================

  if (visibleNotifications.length === 0) {
    return null;
  }

  return (
    <div
      aria-live="assertive"
      className="fixed inset-0 flex items-end justify-center px-4 py-6 pointer-events-none sm:p-6 sm:items-start sm:justify-end z-50"
    >
      <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`${getNotificationClasses(notification.type)} transform transition-all duration-300 ease-in-out`}
          >
            <div className={`p-4 ${getBackgroundColor(notification.type)}`}>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  {getNotificationIcon(notification.type)}
                </div>
                
                <div className="ml-3 w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-gray-900">
                    {notification.title}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {notification.message}
                  </p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-xs text-gray-400">
                      {formatTime(notification.timestamp)}
                    </p>
                    {notification.action && (
                      <button
                        type="button"
                        onClick={notification.action.onClick}
                        className="text-xs font-medium text-blue-600 hover:text-blue-500"
                      >
                        {notification.action.label}
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="ml-4 flex-shrink-0 flex">
                  <button
                    type="button"
                    className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    onClick={() => removeNotification(notification.id)}
                  >
                    <span className="sr-only">Cerrar</span>
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminNotifications;
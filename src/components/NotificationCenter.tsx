import React, { useState, useEffect, useRef } from 'react';
import { X, Check, AlertTriangle, Info, Bug, TrendingUp, MessageCircle, Settings, Eye, Trash2 } from 'lucide-react';
import { notificationService, NotificationOptions } from '../services/notificationService';
import { offlineDB } from '../utils/offlineDB';

interface NotificationItem extends NotificationOptions {
  id: string;
  timestamp: Date;
  read: boolean;
  agentType?: 'phytosanitary' | 'predictive' | 'rag_assistant' | 'optimization' | 'system';
}

interface NotificationCenterProps {
  className?: string;
  maxVisible?: number;
  autoHide?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

const getAgentIcon = (agentType?: string) => {
  switch (agentType) {
    case 'phytosanitary':
      return <Bug className="h-4 w-4" />;
    case 'predictive':
      return <TrendingUp className="h-4 w-4" />;
    case 'rag_assistant':
      return <MessageCircle className="h-4 w-4" />;
    case 'optimization':
      return <Settings className="h-4 w-4" />;
    default:
      return <Info className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'error':
      return 'border-red-200 bg-red-50 text-red-800';
    case 'warning':
      return 'border-yellow-200 bg-yellow-50 text-yellow-800';
    case 'success':
      return 'border-green-200 bg-green-50 text-green-800';
    case 'info':
    default:
      return 'border-blue-200 bg-blue-50 text-blue-800';
  }
};

const getAgentName = (agentType?: string) => {
  switch (agentType) {
    case 'phytosanitary':
      return 'Análisis Fitosanitario';
    case 'predictive':
      return 'Análisis Predictivo';
    case 'rag_assistant':
      return 'Asistente Virtual';
    case 'optimization':
      return 'Optimización';
    case 'system':
      return 'Sistema';
    default:
      return 'Notificación';
  }
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  className = '',
  maxVisible = 5,
  autoHide = true,
  position = 'top-right'
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    loadNotifications();
    
    // Actualizar notificaciones cada 30 segundos
    intervalRef.current = setInterval(loadNotifications, 30000);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      
      // Cargar notificaciones desde la base de datos con fallback
      let unreadNotifications: any[] = [];
      let agentNotifications: any[][] = [];
      
      try {
        unreadNotifications = await notificationService.getUnreadNotifications();
      } catch (error) {
        // Silenciar error en modo desarrollo y usar fallback vacío
        if (!import.meta.env.DEV) {
          console.warn('Failed to load unread notifications:', error);
        }
        unreadNotifications = [];
      }
      
      try {
        agentNotifications = await Promise.all([
          notificationService.getAgentNotifications('phytosanitary').catch(() => []),
          notificationService.getAgentNotifications('predictive').catch(() => []),
          notificationService.getAgentNotifications('rag_assistant').catch(() => []),
          notificationService.getAgentNotifications('optimization').catch(() => [])
        ]);
      } catch (error) {
        // Silenciar error en modo desarrollo y usar fallback vacío
        if (!import.meta.env.DEV) {
          console.warn('Failed to load agent notifications:', error);
        }
        agentNotifications = [[], [], [], []];
      }

      // Combinar y ordenar notificaciones
      const allNotifications = [
        ...unreadNotifications,
        ...agentNotifications.flat()
      ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      // Convertir a formato del componente
      const formattedNotifications: NotificationItem[] = allNotifications.map(notification => ({
        id: notification.id || `${Date.now()}-${Math.random()}`,
        title: notification.title,
        body: notification.body,
        severity: notification.severity || 'info',
        timestamp: new Date(notification.timestamp),
        read: notification.read || false,
        agentType: notification.agentType as any,
        actions: notification.actions,
        data: notification.data
      }));

      setNotifications(formattedNotifications.slice(0, 50)); // Limitar a 50 notificaciones
      setUnreadCount(formattedNotifications.filter(n => !n.read).length);
    } catch (error) {
      // Silenciar error completamente en modo desarrollo
      if (!import.meta.env.DEV) {
        console.error('Failed to load notifications:', error);
      }
      // Usar fallback vacío en caso de error total
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      // Silenciar error en modo desarrollo
      if (!import.meta.env.DEV) {
        console.error('Failed to mark notification as read:', error);
      }
      // Actualizar UI optimísticamente incluso si falla
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      // Silenciar error en modo desarrollo
      if (!import.meta.env.DEV) {
        console.error('Failed to mark all notifications as read:', error);
      }
      // Actualizar UI optimísticamente incluso si falla
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      // Eliminar de la base de datos
      await offlineDB.aiNotifications.delete(notificationId);
      
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
    } catch (error) {
      // Silenciar error en modo desarrollo
      if (!import.meta.env.DEV) {
        console.error('Failed to delete notification:', error);
      }
      // Actualizar UI optimísticamente incluso si falla
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      setUnreadCount(prev => {
        const notification = notifications.find(n => n.id === notificationId);
        return notification && !notification.read ? Math.max(0, prev - 1) : prev;
      });
    }
  };

  const handleNotificationClick = async (notification: NotificationItem) => {
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    // Manejar acciones específicas
    if (notification.actions && notification.actions.length > 0) {
      const action = notification.actions[0];
      if (action.action === 'view' && notification.data?.url) {
        window.open(notification.data.url, '_blank');
      }
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'bottom-right':
        return 'bottom-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'top-right':
      default:
        return 'top-4 right-4';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  // Render deshabilitado: las notificaciones solo se muestran en la campanita del Header
  return null;

  return (
    <div className={`fixed z-50 ${getPositionClasses()} ${className}`}>
      {/* Notification Panel Container */}
      <div className="relative">

        {/* Notification Panel */}
        {isOpen && (
          <div className="w-96 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  Notificaciones
                </h3>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Marcar todas como leídas
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              {unreadCount > 0 && (
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount} notificación{unreadCount !== 1 ? 'es' : ''} sin leer
                </p>
              )}
            </div>

            {/* Notifications List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading ? (
                <div className="p-4 text-center text-gray-500">
                  Cargando notificaciones...
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Info className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notifications.slice(0, maxVisible).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                        !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className={`p-2 rounded-full ${getSeverityColor(notification.severity || 'info')}`}>
                            {getAgentIcon(notification.agentType)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {notification.title}
                              </p>
                              <span className="text-xs text-gray-500 ml-2">
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>
                            
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                              {notification.body}
                            </p>
                            
                            {notification.agentType && (
                              <span className="inline-block mt-2 px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded">
                                {getAgentName(notification.agentType)}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 ml-2">
                          {!notification.read && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 text-gray-400 hover:text-green-600"
                              title="Marcar como leída"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                          
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 text-gray-400 hover:text-red-600"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > maxVisible && (
              <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                <button
                  onClick={loadNotifications}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Ver todas las notificaciones ({notifications.length})
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Toast Notifications */}
      {autoHide && notifications.filter(n => !n.read).slice(0, 3).map((notification) => (
        <div
          key={`toast-${notification.id}`}
          className={`fixed ${getPositionClasses()} mt-16 w-80 p-4 rounded-lg shadow-lg border ${getSeverityColor(notification.severity || 'info')} animate-slide-in`}
          style={{ 
            top: position.includes('top') ? '5rem' : 'auto',
            bottom: position.includes('bottom') ? '5rem' : 'auto'
          }}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              {getAgentIcon(notification.agentType)}
              <div className="flex-1">
                <p className="font-medium text-sm">{notification.title}</p>
                <p className="text-sm mt-1">{notification.body}</p>
              </div>
            </div>
            <button
              onClick={() => markAsRead(notification.id)}
              className="text-current opacity-70 hover:opacity-100"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationCenter;
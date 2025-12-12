import React, { useState } from 'react';
import { Bell, BellRing, X, CheckCheck, AlertTriangle, Info, AlertCircle } from 'lucide-react';
import { useAINotifications } from '../hooks/useAINotifications';
import type { AIAgentType, AINotification } from '../services/aiService';

interface AINotificationIndicatorProps {
  className?: string;
  showDropdown?: boolean;
  maxNotificationsShown?: number;
}

const AINotificationIndicator: React.FC<AINotificationIndicatorProps> = ({
  className = '',
  showDropdown = true,
  maxNotificationsShown = 5
}) => {
  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearError
  } = useAINotifications();

  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Obtener icono según el tipo de agente
  const getAgentIcon = (agentType: AIAgentType) => {
    const icons = {
      phytosanitary: '🔬',
      predictive: '📊',
      rag_assistant: '🤖',
      optimization: '⚡'
    };
    return icons[agentType] || '🔔';
  };

  // Mapear color según prioridad
  const getPriorityColor = (priority: AINotification['priority']) => {
    const colors = {
      low: 'text-gray-600 bg-gray-50',
      medium: 'text-blue-600 bg-blue-50',
      high: 'text-yellow-700 bg-yellow-50',
      critical: 'text-red-700 bg-red-50'
    } as const;
    return colors[priority] || colors.medium;
  };

  // Mapear icono según prioridad
  const getPriorityIcon = (priority: AINotification['priority']) => {
    const icons = {
      low: Info,
      medium: Info,
      high: AlertTriangle,
      critical: AlertCircle
    } as const;
    const IconComponent = icons[priority] || Info;
    return <IconComponent className="w-4 h-4" />;
  };

  // Formatear tiempo relativo
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  // Manejar click en notificación
  const handleNotificationClick = async (notificationId: string | undefined) => {
    if (notificationId) {
      await markAsRead(notificationId);
    }
  };

  const recentNotifications = notifications.slice(0, maxNotificationsShown);

  return (
    <div className={`relative ${className}`}>
      {/* Botón principal */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        aria-label={`Notificaciones de IA (${unreadCount} sin leer)`}
      >
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6" />
        ) : (
          <Bell className="w-6 h-6" />
        )}
        
        {/* Badge de contador */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown de notificaciones */}
      {showDropdown && isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Notificaciones de IA
            </h3>
            <div className="flex items-center space-x-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                  title="Marcar todas como leídas"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Marcar todas</span>
                </button>
              )}
              <button
                onClick={() => setIsDropdownOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mostrar errores del hook */}
          {error && (
            <div className="p-4 bg-red-50 border-b border-red-200">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-red-600" />
                <div className="flex-1">
                  <p className="text-sm text-red-800">{error}</p>
                  <button
                    onClick={clearError}
                    className="text-sm text-red-600 hover:text-red-800 underline"
                  >
                    Ocultar
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lista de notificaciones */}
          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-sm">Cargando notificaciones...</p>
              </div>
            ) : recentNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className="text-sm">No hay notificaciones</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {recentNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      {/* Icono del agente */}
                      <div className="flex-shrink-0">
                        <span className="text-lg">
                          {getAgentIcon(notification.agentType)}
                        </span>
                      </div>

                      {/* Contenido */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className={`text-sm font-medium ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          {/* Prioridad */}
                          <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
                            getPriorityColor(notification.priority)
                          }`}>
                            {getPriorityIcon(notification.priority)}
                            <span className="capitalize">{notification.priority}</span>
                          </div>

                          {/* Tiempo */}
                          <span className="text-xs text-gray-400">
                            {formatRelativeTime(notification.timestamp)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Overlay para cerrar dropdown */}
      {isDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  );
};

export default AINotificationIndicator;
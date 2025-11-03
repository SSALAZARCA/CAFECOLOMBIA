import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Info,
  AlertCircle,
  Clock,
  User,
  CreditCard,
  Leaf,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  category: 'user' | 'payment' | 'farm' | 'system';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  metadata?: {
    userId?: string;
    paymentId?: string;
    farmId?: string;
    amount?: number;
  };
}

interface RealTimeNotificationsProps {
  className?: string;
}

const RealTimeNotifications: React.FC<RealTimeNotificationsProps> = ({ className = '' }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [filter, setFilter] = useState<'all' | 'unread' | 'user' | 'payment' | 'farm' | 'system'>('all');

  // Simular notificaciones en tiempo real
  useEffect(() => {
    const generateNotification = (): Notification => {
      const types: Notification['type'][] = ['success', 'warning', 'info', 'error'];
      const categories: Notification['category'][] = ['user', 'payment', 'farm', 'system'];
      
      const type = types[Math.floor(Math.random() * types.length)];
      const category = categories[Math.floor(Math.random() * categories.length)];
      
      const notifications = {
        user: [
          { title: 'Nuevo usuario registrado', message: 'Juan Pérez se ha registrado en la plataforma' },
          { title: 'Usuario actualizado', message: 'María García actualizó su perfil' },
          { title: 'Usuario desactivado', message: 'Carlos López fue desactivado por inactividad' }
        ],
        payment: [
          { title: 'Pago procesado', message: 'Pago de $50.000 procesado exitosamente' },
          { title: 'Pago fallido', message: 'Error al procesar pago de $25.000' },
          { title: 'Reembolso solicitado', message: 'Usuario solicita reembolso de $30.000' }
        ],
        farm: [
          { title: 'Nueva finca registrada', message: 'Finca "El Paraíso" registrada en Huila' },
          { title: 'Certificación aprobada', message: 'Finca "La Esperanza" obtuvo certificación orgánica' },
          { title: 'Inspección pendiente', message: 'Finca "San José" requiere inspección' }
        ],
        system: [
          { title: 'Backup completado', message: 'Respaldo de base de datos completado exitosamente' },
          { title: 'Mantenimiento programado', message: 'Mantenimiento del sistema programado para mañana' },
          { title: 'Actualización disponible', message: 'Nueva versión del sistema disponible' }
        ]
      };

      const categoryNotifications = notifications[category];
      const randomNotification = categoryNotifications[Math.floor(Math.random() * categoryNotifications.length)];

      return {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        type,
        category,
        title: randomNotification.title,
        message: randomNotification.message,
        timestamp: new Date().toISOString(),
        read: false,
        metadata: category === 'payment' ? { amount: Math.floor(Math.random() * 100000) + 10000 } : undefined
      };
    };

    // Generar notificación inicial
    const initialNotifications: Notification[] = [
      {
        id: '1',
        type: 'success',
        category: 'user',
        title: 'Nuevo usuario registrado',
        message: 'Ana Rodríguez se ha registrado en la plataforma',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        read: false
      },
      {
        id: '2',
        type: 'warning',
        category: 'payment',
        title: 'Pago pendiente',
        message: 'Pago de $45.000 requiere verificación manual',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        read: false,
        metadata: { amount: 45000 }
      },
      {
        id: '3',
        type: 'info',
        category: 'farm',
        title: 'Inspección completada',
        message: 'Finca "Villa María" pasó la inspección de calidad',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        read: true
      }
    ];

    setNotifications(initialNotifications);

    // Simular notificaciones en tiempo real cada 30 segundos
    const interval = setInterval(() => {
      const newNotification = generateNotification();
      setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Mantener máximo 50 notificaciones
      
      // Mostrar toast para notificaciones importantes
      if (newNotification.type === 'error' || newNotification.type === 'warning') {
        toast(newNotification.title, {
          description: newNotification.message,
          duration: 5000
        });
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getNotificationIcon = (category: Notification['category']) => {
    switch (category) {
      case 'user': return <User className="h-4 w-4" />;
      case 'payment': return <CreditCard className="h-4 w-4" />;
      case 'farm': return <Leaf className="h-4 w-4" />;
      case 'system': return <Settings className="h-4 w-4" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: Notification['type']) => {
    switch (type) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: Notification['type']) => {
    switch (type) {
      case 'success': return 'border-l-green-500 bg-green-50';
      case 'warning': return 'border-l-yellow-500 bg-yellow-50';
      case 'error': return 'border-l-red-500 bg-red-50';
      case 'info': return 'border-l-blue-500 bg-blue-50';
      default: return 'border-l-gray-500 bg-gray-50';
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const deleteNotification = (notificationId: string) => {
    setNotifications(prev =>
      prev.filter(notification => notification.id !== notificationId)
    );
  };

  const filteredNotifications = notifications.filter(notification => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !notification.read;
    return notification.category === filter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Ahora';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h`;
    return `${Math.floor(diffInMinutes / 1440)}d`;
  };

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Panel */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-96 overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Notificaciones</h3>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-blue-600 hover:text-blue-700"
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

            {/* Filters */}
            <div className="flex gap-2 mt-3">
              {['all', 'unread', 'user', 'payment', 'farm', 'system'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption as any)}
                  className={`px-2 py-1 text-xs rounded-full transition-colors ${
                    filter === filterOption
                      ? 'bg-blue-100 text-blue-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filterOption === 'all' ? 'Todas' : 
                   filterOption === 'unread' ? 'No leídas' :
                   filterOption === 'user' ? 'Usuarios' :
                   filterOption === 'payment' ? 'Pagos' :
                   filterOption === 'farm' ? 'Fincas' : 'Sistema'}
                </button>
              ))}
            </div>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No hay notificaciones</p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-l-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${getTypeColor(notification.type)} ${
                    !notification.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center gap-1">
                        {getNotificationIcon(notification.category)}
                        {getTypeIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className={`text-sm font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatTimeAgo(notification.timestamp)}
                          </span>
                          {notification.metadata?.amount && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                              ${notification.metadata.amount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 ml-2">
                      {!notification.read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="text-blue-600 hover:text-blue-700 p-1"
                          title="Marcar como leída"
                        >
                          <Eye className="h-3 w-3" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="text-gray-400 hover:text-red-600 p-1"
                        title="Eliminar notificación"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button className="w-full text-sm text-blue-600 hover:text-blue-700 font-medium">
                Ver todas las notificaciones
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealTimeNotifications;
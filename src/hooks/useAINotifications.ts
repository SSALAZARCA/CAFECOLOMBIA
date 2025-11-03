import { useState, useEffect, useCallback } from 'react';
import { aiService, AINotification, AIAgentType } from '../services/aiService';

export interface UseAINotificationsOptions {
  agentType?: AIAgentType;
  autoRefresh?: boolean;
  refreshInterval?: number; // en milisegundos
  maxNotifications?: number;
}

export interface UseAINotificationsReturn {
  notifications: AINotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  dismissNotification: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;
  clearError: () => void;
}

export const useAINotifications = (
  options: UseAINotificationsOptions = {}
): UseAINotificationsReturn => {
  const {
    agentType,
    autoRefresh = true,
    refreshInterval = 30000, // 30 segundos
    maxNotifications = 50
  } = options;

  const [notifications, setNotifications] = useState<AINotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cargar notificaciones
  const loadNotifications = useCallback(async () => {
    try {
      setError(null);
      const data = await aiService.getNotifications(agentType);
      
      // Limitar el número de notificaciones y ordenar por timestamp
      const sortedNotifications = data
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, maxNotifications);
      
      setNotifications(sortedNotifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading notifications');
      console.error('Error loading AI notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [agentType, maxNotifications]);

  // Marcar notificación como leída
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await aiService.markNotificationAsRead(notificationId);
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, read: true }
            : notification
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error marking notification as read');
      console.error('Error marking notification as read:', err);
    }
  }, []);

  // Marcar todas las notificaciones como leídas
  const markAllAsRead = useCallback(async () => {
    try {
      const unreadNotifications = notifications.filter(n => !n.read);
      
      // Marcar todas como leídas en paralelo
      await Promise.all(
        unreadNotifications.map(notification => 
          aiService.markNotificationAsRead(notification.id)
        )
      );
      
      // Actualizar estado local
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error marking all notifications as read');
      console.error('Error marking all notifications as read:', err);
    }
  }, [notifications]);

  // Descartar notificación (eliminar de la vista)
  const dismissNotification = useCallback(async (notificationId: string) => {
    try {
      // Primero marcar como leída si no lo está
      const notification = notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        await aiService.markNotificationAsRead(notificationId);
      }
      
      // Remover de la lista local
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error dismissing notification');
      console.error('Error dismissing notification:', err);
    }
  }, [notifications]);

  // Refrescar notificaciones manualmente
  const refreshNotifications = useCallback(async () => {
    setIsLoading(true);
    await loadNotifications();
  }, [loadNotifications]);

  // Limpiar error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Calcular número de notificaciones no leídas
  const unreadCount = notifications.filter(n => !n.read).length;

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  // Auto-refresh si está habilitado
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return;

    const interval = setInterval(() => {
      loadNotifications();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadNotifications]);

  // Escuchar eventos de visibilidad para refrescar cuando la página vuelve a estar visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && autoRefresh) {
        loadNotifications();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [autoRefresh, loadNotifications]);

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    dismissNotification,
    refreshNotifications,
    clearError
  };
};

// Hook especializado para notificaciones críticas
export const useCriticalNotifications = () => {
  const { notifications, ...rest } = useAINotifications({
    autoRefresh: true,
    refreshInterval: 10000 // Refrescar cada 10 segundos para notificaciones críticas
  });

  const criticalNotifications = notifications.filter(n => 
    n.priority === 'critical' || n.priority === 'high'
  );

  return {
    notifications: criticalNotifications,
    ...rest
  };
};

// Hook para notificaciones por agente específico
export const useAgentNotifications = (agentType: AIAgentType) => {
  return useAINotifications({
    agentType,
    autoRefresh: true,
    refreshInterval: 20000 // 20 segundos
  });
};

// Hook para estadísticas de notificaciones
export const useNotificationStats = () => {
  const { notifications } = useAINotifications();

  const stats = {
    total: notifications.length,
    unread: notifications.filter(n => !n.read).length,
    byPriority: {
      critical: notifications.filter(n => n.priority === 'critical').length,
      high: notifications.filter(n => n.priority === 'high').length,
      medium: notifications.filter(n => n.priority === 'medium').length,
      low: notifications.filter(n => n.priority === 'low').length
    },
    byAgent: {
      phytosanitary: notifications.filter(n => n.agentType === 'phytosanitary').length,
      predictive: notifications.filter(n => n.agentType === 'predictive').length,
      rag_assistant: notifications.filter(n => n.agentType === 'rag_assistant').length,
      optimization: notifications.filter(n => n.agentType === 'optimization').length
    },
    byType: {
      analysis_complete: notifications.filter(n => n.type === 'analysis_complete').length,
      urgent_alert: notifications.filter(n => n.type === 'urgent_alert').length,
      recommendation: notifications.filter(n => n.type === 'recommendation').length,
      system_update: notifications.filter(n => n.type === 'system_update').length
    }
  };

  return stats;
};
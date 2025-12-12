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

export const useAINotificationsBackend = (
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
      const raw = await aiService.getNotifications(agentType);

      // Normalizar estructura para evitar inconsistencias entre fuentes
      const normalized = raw.map((n: any) => ({
        id: String(n.id ?? n.notificationId ?? crypto.randomUUID()),
        agentType: n.agentType ?? n.agent_type ?? 'predictive',
        type: n.type ?? 'system_update',
        title: n.title ?? n.header ?? 'Notificación',
        message: n.message ?? n.body ?? '',
        priority: n.priority ?? (n.severity === 'error' ? 'critical' : n.severity === 'warning' ? 'high' : n.severity === 'success' ? 'low' : 'medium'),
        data: n.data ?? {},
        read: Boolean(n.read ?? n.isRead ?? false),
        timestamp: (typeof n.timestamp === 'string' ? n.timestamp : (n.createdAt instanceof Date ? n.createdAt.toISOString() : (n.createdAt ?? new Date().toISOString())))
      })) as AINotification[];

      // Limitar y ordenar por timestamp
      const sortedNotifications = normalized
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

  // Marcar notificación como leída (backend primero)
  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
      const endpoint = `${baseUrl}/api/ai/notifications/${encodeURIComponent(notificationId)}/read`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('authToken')) : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        const res = await fetch(endpoint, { method: 'POST', headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (_) {
        // Fallback: marcar localmente si falla backend
        await aiService.markNotificationAsRead(notificationId);
      }
      
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

  // Marcar todas las notificaciones como leídas (backend primero)
  const markAllAsRead = useCallback(async () => {
    try {
      const baseUrl = (import.meta as any).env?.VITE_API_BASE_URL || '';
      const endpoint = `${baseUrl}/api/ai/notifications/read-all`;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      const token = typeof localStorage !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('authToken')) : null;
      if (token) headers['Authorization'] = `Bearer ${token}`;

      try {
        const res = await fetch(endpoint, { method: 'POST', headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
      } catch (_) {
        // Fallback: marcar una por una localmente si falla backend
        const unreadNotifications = notifications.filter(n => !n.read);
        await Promise.all(
          unreadNotifications.map(notification => 
            aiService.markNotificationAsRead(notification.id)
          )
        );
      }
      
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
        await markAsRead(notificationId);
      }
      
      // Remover de la lista local
      setNotifications(prev => 
        prev.filter(notification => notification.id !== notificationId)
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error dismissing notification');
      console.error('Error dismissing notification:', err);
    }
  }, [notifications, markAsRead]);

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
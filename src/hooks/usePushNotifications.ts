import { useState, useEffect, useCallback } from 'react';
import { pushNotificationService, NotificationPreferences } from '../services/pushNotificationService';
import { notificationService } from '../services/notificationService';

export interface PushNotificationState {
  isSupported: boolean;
  isSubscribed: boolean;
  hasPermission: boolean;
  token: string | null;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  error: string | null;
  lastUpdate: Date | null;
}

export interface PushNotificationActions {
  subscribe: () => Promise<boolean>;
  unsubscribe: () => Promise<boolean>;
  updatePreferences: (preferences: Partial<NotificationPreferences>) => Promise<void>;
  sendTestNotification: () => Promise<void>;
  refreshStatus: () => Promise<void>;
  clearError: () => void;
}

export interface UsePushNotificationsReturn {
  state: PushNotificationState;
  actions: PushNotificationActions;
}

export const usePushNotifications = (): UsePushNotificationsReturn => {
  const [state, setState] = useState<PushNotificationState>({
    isSupported: false,
    isSubscribed: false,
    hasPermission: false,
    token: null,
    preferences: null,
    isLoading: false,
    error: null,
    lastUpdate: null
  });

  // Inicializar estado
  const initializeState = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const isSupported = 'serviceWorker' in navigator && 'PushManager' in window;
      
      if (!isSupported) {
        setState(prev => ({
          ...prev,
          isSupported: false,
          isLoading: false,
          lastUpdate: new Date()
        }));
        return;
      }

      const stats = await pushNotificationService.getSubscriptionStats();
      const preferences = pushNotificationService.getPreferences();
      const hasPermission = Notification.permission === 'granted';

      setState(prev => ({
        ...prev,
        isSupported: true,
        isSubscribed: stats.isSubscribed,
        hasPermission,
        token: stats.token,
        preferences,
        isLoading: false,
        lastUpdate: new Date()
      }));
    } catch (error) {
      console.error('Failed to initialize push notification state:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al inicializar las notificaciones',
        lastUpdate: new Date()
      }));
    }
  }, []);

  // Suscribirse a notificaciones
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Las notificaciones no están soportadas' }));
      return false;
    }

    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const token = await pushNotificationService.subscribe();
      
      if (token) {
        setState(prev => ({
          ...prev,
          isSubscribed: true,
          hasPermission: true,
          token,
          isLoading: false,
          lastUpdate: new Date()
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'No se pudo activar las notificaciones. Verifica los permisos del navegador.'
        }));
        return false;
      }
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al activar las notificaciones push'
      }));
      return false;
    }
  }, [state.isSupported]);

  // Desuscribirse de notificaciones
  const unsubscribe = useCallback(async (): Promise<boolean> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const success = await pushNotificationService.unsubscribe();
      
      if (success) {
        setState(prev => ({
          ...prev,
          isSubscribed: false,
          token: null,
          isLoading: false,
          lastUpdate: new Date()
        }));
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Error al desactivar las notificaciones'
        }));
        return false;
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: 'Error al desactivar las notificaciones push'
      }));
      return false;
    }
  }, []);

  // Actualizar preferencias
  const updatePreferences = useCallback(async (newPreferences: Partial<NotificationPreferences>) => {
    if (!state.preferences) return;

    const updatedPreferences = { ...state.preferences, ...newPreferences };
    
    try {
      setState(prev => ({ 
        ...prev, 
        preferences: updatedPreferences,
        error: null 
      }));

      await pushNotificationService.updatePreferences(newPreferences);
      
      setState(prev => ({ 
        ...prev, 
        lastUpdate: new Date() 
      }));
    } catch (error) {
      console.error('Failed to update preferences:', error);
      // Revertir cambios en caso de error
      setState(prev => ({
        ...prev,
        preferences: state.preferences,
        error: 'Error al actualizar las preferencias'
      }));
    }
  }, [state.preferences]);

  // Enviar notificación de prueba
  const sendTestNotification = useCallback(async () => {
    if (!state.isSubscribed) {
      setState(prev => ({ ...prev, error: 'No estás suscrito a las notificaciones' }));
      return;
    }

    try {
      setState(prev => ({ ...prev, error: null }));

      await pushNotificationService.sendTestNotification({
        title: 'Notificación de Prueba - CaféColombia',
        body: 'Esta es una notificación de prueba del sistema de IA',
        data: {
          agentType: 'system',
          priority: 'normal',
          timestamp: new Date().toISOString()
        }
      });

      // También mostrar notificación local como respaldo
      await notificationService.showNotification({
        title: 'Notificación de Prueba',
        body: 'Sistema de notificaciones funcionando correctamente',
        severity: 'info',
        actions: [
          { action: 'view', title: 'Ver' },
          { action: 'dismiss', title: 'Cerrar' }
        ]
      });

    } catch (error) {
      console.error('Failed to send test notification:', error);
      setState(prev => ({
        ...prev,
        error: 'Error al enviar la notificación de prueba'
      }));
    }
  }, [state.isSubscribed]);

  // Refrescar estado
  const refreshStatus = useCallback(async () => {
    await initializeState();
  }, [initializeState]);

  // Limpiar error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Efecto para inicializar
  useEffect(() => {
    initializeState();
  }, [initializeState]);

  // Efecto para escuchar cambios en permisos
  useEffect(() => {
    const handlePermissionChange = () => {
      setState(prev => ({
        ...prev,
        hasPermission: Notification.permission === 'granted'
      }));
    };

    // Escuchar cambios en permisos (si está disponible)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then(permission => {
          permission.addEventListener('change', handlePermissionChange);
          return () => permission.removeEventListener('change', handlePermissionChange);
        })
        .catch(console.warn);
    }
  }, []);

  // Efecto para escuchar mensajes del service worker
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'PUSH_NOTIFICATION_RECEIVED') {
        // Actualizar estado cuando se recibe una notificación
        setState(prev => ({ ...prev, lastUpdate: new Date() }));
      }
    };

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleMessage);
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, []);

  return {
    state,
    actions: {
      subscribe,
      unsubscribe,
      updatePreferences,
      sendTestNotification,
      refreshStatus,
      clearError
    }
  };
};

export default usePushNotifications;
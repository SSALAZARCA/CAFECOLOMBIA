import { notificationService } from './notificationService';
import { offlineDB } from '../utils/offlineDB';
import { AIAgentType, AINotification } from '../types';

export interface PushNotificationConfig {
  vapidKey: string;
  enableBackground: boolean;
  enableForeground: boolean;
  autoSubscribe: boolean;
  retryAttempts: number;
  retryDelay: number;
}

export interface PushSubscriptionData {
  token: string;
  endpoint: string;
  userId?: string;
  deviceId: string;
  subscribedAt: Date;
  lastActive: Date;
  preferences: NotificationPreferences;
}

export interface NotificationPreferences {
  phytosanitary: boolean;
  predictive: boolean;
  rag_assistant: boolean;
  optimization: boolean;
  critical: boolean;
  marketing: boolean;
  system: boolean;
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  tag?: string;
  data?: {
    agentType?: AIAgentType;
    notificationId?: string;
    actionUrl?: string;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    [key: string]: any;
  };
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export class PushNotificationService {
  private static instance: PushNotificationService;
  private messaging: any = null;
  private currentToken: string | null = null;
  private isInitialized = false;
  private config: PushNotificationConfig;
  private subscriptionData: PushSubscriptionData | null = null;

  private constructor() {
    this.config = this.getDefaultConfig();
    this.initialize();
  }

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  private getDefaultConfig(): PushNotificationConfig {
    return {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY || '',
      enableBackground: true,
      enableForeground: true,
      autoSubscribe: false,
      retryAttempts: 3,
      retryDelay: 1000
    };
  }

  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        return true;
      }

      // Check if messaging is supported
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        console.warn('Push messaging not supported');
        return false;
      }

      // For now, we'll use a simplified implementation without Firebase
      // This can be enhanced later when Firebase is properly configured
      this.messaging = {
        isSupported: true,
        type: 'simplified'
      };

      this.isInitialized = true;
      console.log('Push notification service initialized successfully (simplified mode)');
      
      return true;
    } catch (error) {
      console.error('Error initializing push notification service:', error);
      return false;
    }
  }

  private setupForegroundMessageListener() {
    if (!this.messaging) return;

    onMessage(this.messaging, (payload: MessagePayload) => {
      console.log('[PushNotificationService] Foreground message received:', payload);
      this.handleForegroundMessage(payload);
    });
  }

  private async handleForegroundMessage(payload: MessagePayload) {
    try {
      const { notification, data } = payload;
      
      if (!notification) return;

      // Crear notificación local usando el servicio existente
      const agentType = (data?.agentType as AIAgentType) || 'phytosanitary';
      const severity = this.mapPriorityToSeverity(data?.priority as string);

      await notificationService.sendNotification({
        title: notification.title || 'Notificación',
        message: notification.body || '',
        severity,
        agentType,
        data: data || {},
        showBrowserNotification: true,
        persistent: data?.priority === 'critical'
      });

      // Registrar estadísticas
      await this.recordNotificationReceived(payload);
    } catch (error) {
      console.error('[PushNotificationService] Failed to handle foreground message:', error);
    }
  }

  private mapPriorityToSeverity(priority?: string): 'info' | 'warning' | 'error' | 'success' {
    switch (priority) {
      case 'critical':
      case 'high':
        return 'error';
      case 'normal':
        return 'warning';
      case 'low':
        return 'info';
      default:
        return 'info';
    }
  }

  // Suscribirse a notificaciones push
  async subscribe(): Promise<string | null> {
    if (!this.messaging || !this.config.vapidKey) {
      console.warn('[PushNotificationService] Cannot subscribe - missing configuration');
      return null;
    }

    try {
      // Solicitar permisos
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.warn('[PushNotificationService] Notification permission denied');
        return null;
      }

      // Obtener token FCM
      const token = await getToken(this.messaging, {
        vapidKey: this.config.vapidKey
      });

      if (token) {
        this.currentToken = token;
        await this.saveSubscriptionData(token);
        await this.sendTokenToServer(token);
        console.log('[PushNotificationService] Successfully subscribed:', token);
        return token;
      } else {
        console.warn('[PushNotificationService] No registration token available');
        return null;
      }
    } catch (error) {
      console.error('[PushNotificationService] Failed to subscribe:', error);
      return null;
    }
  }

  // Desuscribirse de notificaciones push
  async unsubscribe(): Promise<boolean> {
    try {
      if (this.currentToken) {
        await this.removeTokenFromServer(this.currentToken);
        this.currentToken = null;
        await this.clearSubscriptionData();
      }
      return true;
    } catch (error) {
      console.error('[PushNotificationService] Failed to unsubscribe:', error);
      return false;
    }
  }

  // Obtener token actual
  getCurrentToken(): string | null {
    return this.currentToken;
  }

  // Verificar estado de suscripción
  isSubscribed(): boolean {
    return this.currentToken !== null;
  }

  // Actualizar preferencias de notificación
  async updatePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    if (!this.subscriptionData) return;

    this.subscriptionData.preferences = {
      ...this.subscriptionData.preferences,
      ...preferences
    };

    await this.saveSubscriptionData(this.currentToken!);
    await this.sendPreferencesToServer(this.subscriptionData.preferences);
  }

  // Obtener preferencias actuales
  getPreferences(): NotificationPreferences | null {
    return this.subscriptionData?.preferences || null;
  }

  // Enviar notificación push personalizada (para testing)
  async sendTestNotification(payload: PushNotificationPayload): Promise<void> {
    if (!this.isSubscribed()) {
      throw new Error('Not subscribed to push notifications');
    }

    try {
      // Simular notificación local para testing
      await notificationService.sendNotification({
        title: payload.title,
        message: payload.body,
        severity: this.mapPriorityToSeverity(payload.data?.priority),
        agentType: payload.data?.agentType || 'phytosanitary',
        data: payload.data || {},
        showBrowserNotification: true
      });
    } catch (error) {
      console.error('[PushNotificationService] Failed to send test notification:', error);
      throw error;
    }
  }

  // Métodos privados para gestión de datos

  private async saveSubscriptionData(token: string): Promise<void> {
    const deviceId = this.getDeviceId();
    
    this.subscriptionData = {
      token,
      endpoint: `https://fcm.googleapis.com/fcm/send/${token}`,
      deviceId,
      subscribedAt: new Date(),
      lastActive: new Date(),
      preferences: this.getDefaultPreferences()
    };

    // Guardar en IndexedDB
    await offlineDB.savePushSubscription(this.subscriptionData);
    
    // Guardar en localStorage como backup
    localStorage.setItem('push_subscription', JSON.stringify(this.subscriptionData));
  }

  private async loadSubscriptionData(): Promise<void> {
    try {
      // Intentar cargar desde IndexedDB primero
      this.subscriptionData = await offlineDB.getPushSubscription();
      
      if (!this.subscriptionData) {
        // Fallback a localStorage
        const stored = localStorage.getItem('push_subscription');
        if (stored) {
          this.subscriptionData = JSON.parse(stored);
        }
      }

      if (this.subscriptionData) {
        this.currentToken = this.subscriptionData.token;
        // Actualizar última actividad
        this.subscriptionData.lastActive = new Date();
        await this.saveSubscriptionData(this.currentToken);
      }
    } catch (error) {
      console.error('[PushNotificationService] Failed to load subscription data:', error);
    }
  }

  private async clearSubscriptionData(): Promise<void> {
    this.subscriptionData = null;
    await offlineDB.clearPushSubscription();
    localStorage.removeItem('push_subscription');
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      phytosanitary: true,
      predictive: true,
      rag_assistant: false,
      optimization: true,
      critical: true,
      marketing: false,
      system: true
    };
  }

  // Métodos para comunicación con el servidor

  private async sendTokenToServer(token: string): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          token,
          deviceId: this.getDeviceId(),
          preferences: this.subscriptionData?.preferences
        })
      });

      if (!response.ok) {
        throw new Error(`Server responded with ${response.status}`);
      }
    } catch (error) {
      console.error('[PushNotificationService] Failed to send token to server:', error);
      // No lanzar error para no bloquear la suscripción local
    }
  }

  private async removeTokenFromServer(token: string): Promise<void> {
    try {
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          token,
          deviceId: this.getDeviceId()
        })
      });
    } catch (error) {
      console.error('[PushNotificationService] Failed to remove token from server:', error);
    }
  }

  private async sendPreferencesToServer(preferences: NotificationPreferences): Promise<void> {
    try {
      await fetch('/api/push/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token') || ''}`
        },
        body: JSON.stringify({
          deviceId: this.getDeviceId(),
          preferences
        })
      });
    } catch (error) {
      console.error('[PushNotificationService] Failed to send preferences to server:', error);
    }
  }

  private async recordNotificationReceived(payload: MessagePayload): Promise<void> {
    try {
      await offlineDB.recordNotificationStat({
        type: 'received',
        agentType: payload.data?.agentType as AIAgentType || 'phytosanitary',
        timestamp: new Date(),
        payload: payload.data || {}
      });
    } catch (error) {
      console.error('[PushNotificationService] Failed to record notification stat:', error);
    }
  }

  // Métodos públicos para estadísticas y gestión

  async getSubscriptionStats() {
    return {
      isSubscribed: this.isSubscribed(),
      token: this.currentToken,
      subscriptionData: this.subscriptionData,
      isInitialized: this.isInitialized,
      config: this.config
    };
  }

  async refreshToken(): Promise<string | null> {
    if (!this.messaging) return null;

    try {
      const newToken = await getToken(this.messaging, {
        vapidKey: this.config.vapidKey
      });

      if (newToken && newToken !== this.currentToken) {
        const oldToken = this.currentToken;
        this.currentToken = newToken;
        
        await this.saveSubscriptionData(newToken);
        await this.sendTokenToServer(newToken);
        
        if (oldToken) {
          await this.removeTokenFromServer(oldToken);
        }
        
        console.log('[PushNotificationService] Token refreshed');
        return newToken;
      }
      
      return this.currentToken;
    } catch (error) {
      console.error('[PushNotificationService] Failed to refresh token:', error);
      return null;
    }
  }
}

// Instancia global del servicio de notificaciones push
export const pushNotificationService = PushNotificationService.getInstance();
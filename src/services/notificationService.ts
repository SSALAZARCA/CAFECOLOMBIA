import { offlineDB } from '../utils/offlineDB';
import { AgentType } from '../types/ai';

export interface NotificationOptions {
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'success';
  agentType: AgentType;
  data?: any;
  persistent?: boolean;
  expiresIn?: number; // minutos
  showBrowserNotification?: boolean;
  actionButtons?: NotificationAction[];
}

export interface NotificationAction {
  id: string;
  title: string;
  icon?: string;
  action: () => void;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  denied: boolean;
  default: boolean;
  supported: boolean;
}

export class NotificationService {
  private static instance: NotificationService;
  private listeners: ((notification: any) => void)[] = [];
  private isInitialized = false;

  private constructor() {
    this.initialize();
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private async initialize() {
    if (this.isInitialized) return;

    try {
      // Verificar soporte para notificaciones
      if (!('Notification' in window)) {
        console.warn('[NotificationService] Browser notifications not supported');
        return;
      }

      // Verificar soporte para Service Worker
      if ('serviceWorker' in navigator && window.location.protocol === 'https:' && !import.meta.env.DEV) {
        await this.registerServiceWorker();
      }

      // Limpiar notificaciones expiradas al inicializar
      await this.cleanupExpiredNotifications();

      this.isInitialized = true;
      console.log('[NotificationService] Initialized successfully');
    } catch (error) {
      console.error('[NotificationService] Failed to initialize:', error);
    }
  }

  private async registerServiceWorker() {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      console.log('[NotificationService] Service Worker registered:', registration);
      
      // Escuchar mensajes del Service Worker
      navigator.serviceWorker.addEventListener('message', this.handleServiceWorkerMessage.bind(this));
    } catch (error) {
      console.error('[NotificationService] Service Worker registration failed:', error);
    }
  }

  private handleServiceWorkerMessage(event: MessageEvent) {
    if (event.data && event.data.type === 'NOTIFICATION_CLICK') {
      const { notificationId, actionId } = event.data;
      this.handleNotificationAction(notificationId, actionId);
    }
  }

  // Verificar y solicitar permisos de notificación
  async requestPermission(): Promise<NotificationPermissionStatus> {
    const status: NotificationPermissionStatus = {
      granted: false,
      denied: false,
      default: false,
      supported: 'Notification' in window
    };

    if (!status.supported) {
      return status;
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    status.granted = permission === 'granted';
    status.denied = permission === 'denied';
    status.default = permission === 'default';

    return status;
  }

  // Obtener estado actual de permisos
  getPermissionStatus(): NotificationPermissionStatus {
    const status: NotificationPermissionStatus = {
      granted: false,
      denied: false,
      default: false,
      supported: 'Notification' in window
    };

    if (!status.supported) {
      return status;
    }

    const permission = Notification.permission;
    status.granted = permission === 'granted';
    status.denied = permission === 'denied';
    status.default = permission === 'default';

    return status;
  }

  // Enviar notificación
  async sendNotification(options: NotificationOptions): Promise<number> {
    try {
      // Calcular fecha de expiración
      const expiresAt = options.expiresIn 
        ? new Date(Date.now() + options.expiresIn * 60 * 1000)
        : undefined;

      // Guardar en IndexedDB
      const notificationId = await offlineDB.addAINotification(
        options.agentType,
        options.title,
        options.message,
        options.severity,
        options.data,
        expiresAt
      );

      // Mostrar notificación del navegador si está habilitada y hay permisos
      if (options.showBrowserNotification !== false) {
        await this.showBrowserNotification(options, notificationId);
      }

      // Notificar a los listeners
      this.notifyListeners({
        id: notificationId,
        ...options,
        createdAt: new Date(),
        isRead: false
      });

      console.log(`[NotificationService] Notification sent: ${options.title}`);
      return notificationId;
    } catch (error) {
      console.error('[NotificationService] Failed to send notification:', error);
      throw error;
    }
  }

  // Mostrar notificación del navegador
  private async showBrowserNotification(options: NotificationOptions, notificationId: number) {
    const permissionStatus = this.getPermissionStatus();
    
    if (!permissionStatus.supported || !permissionStatus.granted) {
      console.log('[NotificationService] Browser notifications not available');
      return;
    }

    try {
      const notification = new Notification(options.title, {
        body: options.message,
        icon: this.getIconForSeverity(options.severity),
        badge: '/icons/icon-96x96.svg',
        tag: `ai-${options.agentType}-${notificationId}`,
        data: {
          notificationId,
          agentType: options.agentType,
          severity: options.severity,
          ...options.data
        },
        requireInteraction: options.persistent || options.severity === 'error',
        actions: options.actionButtons?.map(action => ({
          action: action.id,
          title: action.title,
          icon: action.icon
        })) || []
      });

      // Manejar click en la notificación
      notification.onclick = () => {
        this.handleNotificationClick(notificationId);
        notification.close();
      };

      // Auto-cerrar después de 5 segundos si no es persistente
      if (!options.persistent && options.severity !== 'error') {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }
    } catch (error) {
      console.error('[NotificationService] Failed to show browser notification:', error);
    }
  }

  // Obtener icono según la severidad
  private getIconForSeverity(severity: string): string {
    const icons = {
      success: '/icons/success.svg',
      warning: '/icons/warning.svg',
      error: '/icons/error.svg',
      info: '/icons/info.svg'
    };
    return icons[severity as keyof typeof icons] || icons.info;
  }

  // Manejar click en notificación
  private async handleNotificationClick(notificationId: number) {
    try {
      // Marcar como leída
      await offlineDB.markAINotificationAsRead(notificationId);
      
      // Obtener la notificación para ejecutar acciones
      const notification = await offlineDB.aiNotifications.get(notificationId);
      if (notification) {
        // Emitir evento personalizado para que la aplicación pueda reaccionar
        window.dispatchEvent(new CustomEvent('ai-notification-click', {
          detail: notification
        }));
      }
    } catch (error) {
      console.error('[NotificationService] Failed to handle notification click:', error);
    }
  }

  // Manejar acciones de notificación
  private async handleNotificationAction(notificationId: number, actionId: string) {
    try {
      const notification = await offlineDB.aiNotifications.get(notificationId);
      if (notification) {
        // Emitir evento personalizado con la acción
        window.dispatchEvent(new CustomEvent('ai-notification-action', {
          detail: { notification, actionId }
        }));
      }
    } catch (error) {
      console.error('[NotificationService] Failed to handle notification action:', error);
    }
  }

  // Obtener notificaciones no leídas
  async getUnreadNotifications() {
    return await offlineDB.getUnreadAINotifications();
  }

  // Obtener notificaciones por agente
  async getNotificationsByAgent(agentType: AgentType) {
    return await offlineDB.getAINotificationsByAgent(agentType);
  }

  // Marcar notificación como leída
  async markAsRead(notificationId: number) {
    await offlineDB.markAINotificationAsRead(notificationId);
    
    // Notificar a los listeners
    this.notifyListeners({
      type: 'notification-read',
      notificationId
    });
  }

  // Marcar todas las notificaciones como leídas
  async markAllAsRead() {
    const unreadNotifications = await this.getUnreadNotifications();
    
    for (const notification of unreadNotifications) {
      if (notification.id) {
        await this.markAsRead(notification.id);
      }
    }
  }

  // Limpiar notificaciones expiradas
  async cleanupExpiredNotifications() {
    try {
      const deletedCount = await offlineDB.cleanupExpiredAINotifications();
      console.log(`[NotificationService] Cleaned up ${deletedCount} expired notifications`);
      return deletedCount;
    } catch (error) {
      console.error('[NotificationService] Failed to cleanup expired notifications:', error);
      return 0;
    }
  }

  // Registrar listener para notificaciones
  onNotification(callback: (notification: any) => void): () => void {
    this.listeners.push(callback);
    return () => {
      const index = this.listeners.indexOf(callback);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  // Notificar a todos los listeners
  private notifyListeners(notification: any) {
    this.listeners.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('[NotificationService] Listener error:', error);
      }
    });
  }

  // Enviar notificaciones específicas para cada agente de IA

  // Notificación de análisis fitosanitario completado
  async notifyPhytosanitaryAnalysisComplete(
    imageFilename: string, 
    results: any, 
    severity: 'info' | 'warning' | 'error' = 'info'
  ) {
    const hasProblems = results.some((r: any) => r.confidence > 0.7 && r.pestType !== 'healthy');
    
    return await this.sendNotification({
      title: 'Análisis Fitosanitario Completado',
      message: hasProblems 
        ? `Se detectaron posibles problemas en ${imageFilename}`
        : `Análisis completado para ${imageFilename} - Sin problemas detectados`,
      severity: hasProblems ? 'warning' : 'success',
      agentType: 'phytosanitary',
      data: { imageFilename, results },
      showBrowserNotification: true,
      expiresIn: 60 // 1 hora
    });
  }

  // Notificación de predicción de plagas
  async notifyPestPrediction(prediction: any, riskLevel: 'low' | 'medium' | 'high') {
    const severityMap = { low: 'info', medium: 'warning', high: 'error' } as const;
    
    return await this.sendNotification({
      title: 'Alerta Predictiva de Plagas',
      message: `Riesgo ${riskLevel} de ${prediction.pestType} en los próximos ${prediction.timeframe} días`,
      severity: severityMap[riskLevel],
      agentType: 'predictive',
      data: prediction,
      persistent: riskLevel === 'high',
      showBrowserNotification: true,
      expiresIn: riskLevel === 'high' ? 1440 : 360 // 24h para alto riesgo, 6h para otros
    });
  }

  // Notificación de respuesta del asistente virtual
  async notifyRAGResponse(query: string, hasResponse: boolean) {
    return await this.sendNotification({
      title: 'Consulta Procesada',
      message: hasResponse 
        ? 'Tu consulta ha sido respondida'
        : 'No se encontró información específica para tu consulta',
      severity: hasResponse ? 'success' : 'warning',
      agentType: 'rag_assistant',
      data: { query },
      showBrowserNotification: false, // Solo notificación interna
      expiresIn: 30 // 30 minutos
    });
  }

  // Notificación de análisis de optimización
  async notifyOptimizationAnalysis(analysis: any, hasRecommendations: boolean) {
    return await this.sendNotification({
      title: 'Análisis de Optimización Completado',
      message: hasRecommendations 
        ? 'Se han generado nuevas recomendaciones de optimización'
        : 'Análisis completado - No se requieren cambios',
      severity: hasRecommendations ? 'info' : 'success',
      agentType: 'optimization',
      data: analysis,
      showBrowserNotification: true,
      expiresIn: 720 // 12 horas
    });
  }

  // Obtener estadísticas de notificaciones
  async getNotificationStats() {
    const unreadNotifications = await this.getUnreadNotifications();
    const totalByAgent = {
      phytosanitary: 0,
      predictive: 0,
      rag_assistant: 0,
      optimization: 0
    };

    unreadNotifications.forEach(notification => {
      totalByAgent[notification.agentType]++;
    });

    return {
      total: unreadNotifications.length,
      byAgent: totalByAgent,
      permissionStatus: this.getPermissionStatus()
    };
  }
}

// Instancia global del servicio de notificaciones
export const notificationService = NotificationService.getInstance();
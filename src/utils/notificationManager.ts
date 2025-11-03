export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  actions?: NotificationAction[];
  requireInteraction?: boolean;
  silent?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export type NotificationType = 
  | 'task_reminder'
  | 'pest_alert'
  | 'harvest_ready'
  | 'input_expiry'
  | 'weather_alert'
  | 'sync_complete'
  | 'general';

export class NotificationManager {
  private permission: NotificationPermission = 'default';
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.permission = Notification.permission;
    this.initializeServiceWorker();
  }

  private async initializeServiceWorker() {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready;
        console.log('[NotificationManager] Service Worker ready');
      } catch (error) {
        console.error('[NotificationManager] Service Worker not available:', error);
      }
    }
  }

  // Solicitar permisos de notificación
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('[NotificationManager] Notifications not supported');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    try {
      this.permission = await Notification.requestPermission();
      console.log('[NotificationManager] Permission:', this.permission);
      return this.permission;
    } catch (error) {
      console.error('[NotificationManager] Permission request failed:', error);
      return 'denied';
    }
  }

  // Verificar si las notificaciones están disponibles
  isSupported(): boolean {
    return 'Notification' in window;
  }

  // Verificar si se tienen permisos
  hasPermission(): boolean {
    return this.permission === 'granted';
  }

  // Mostrar notificación local
  async showNotification(options: NotificationOptions): Promise<void> {
    if (!this.hasPermission()) {
      console.warn('[NotificationManager] No permission for notifications');
      return;
    }

    const defaultOptions: NotificationOptions = {
      title: options.title,
      body: options.body,
      icon: options.icon || '/pwa-192x192.png',
      badge: options.badge || '/pwa-192x192.png',
      tag: options.tag || 'default',
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      data: options.data || {}
    };

    try {
      if (this.registration) {
        // Usar Service Worker para notificaciones persistentes
        await this.registration.showNotification(defaultOptions.title, {
          body: defaultOptions.body,
          icon: defaultOptions.icon,
          badge: defaultOptions.badge,
          tag: defaultOptions.tag,
          data: defaultOptions.data,
          actions: options.actions,
          requireInteraction: defaultOptions.requireInteraction,
          silent: defaultOptions.silent
        });
      } else {
        // Fallback a notificación directa
        new Notification(defaultOptions.title, {
          body: defaultOptions.body,
          icon: defaultOptions.icon,
          tag: defaultOptions.tag,
          data: defaultOptions.data,
          requireInteraction: defaultOptions.requireInteraction,
          silent: defaultOptions.silent
        });
      }
    } catch (error) {
      console.error('[NotificationManager] Failed to show notification:', error);
    }
  }

  // Notificaciones específicas por tipo
  async showTaskReminder(task: any): Promise<void> {
    await this.showNotification({
      title: '⏰ Recordatorio de Tarea',
      body: `${task.title} - Vence ${task.dueDate}`,
      tag: `task_${task.id}`,
      data: { type: 'task_reminder', taskId: task.id },
      actions: [
        { action: 'complete', title: 'Marcar como completada' },
        { action: 'postpone', title: 'Posponer' }
      ],
      requireInteraction: true
    });
  }

  async showPestAlert(monitoring: any): Promise<void> {
    const severity = monitoring.severity;
    const emoji = severity === 'high' ? '🚨' : severity === 'medium' ? '⚠️' : '📋';
    
    await this.showNotification({
      title: `${emoji} Alerta de Plaga`,
      body: `${monitoring.pestType} detectada en ${monitoring.lotName} - Severidad: ${severity}`,
      tag: `pest_${monitoring.id}`,
      data: { type: 'pest_alert', monitoringId: monitoring.id },
      actions: [
        { action: 'view', title: 'Ver detalles' },
        { action: 'treat', title: 'Programar tratamiento' }
      ],
      requireInteraction: severity === 'high'
    });
  }

  async showHarvestReady(lot: any): Promise<void> {
    await this.showNotification({
      title: '🌱 Lote Listo para Cosecha',
      body: `El lote ${lot.name} está listo para la cosecha`,
      tag: `harvest_${lot.id}`,
      data: { type: 'harvest_ready', lotId: lot.id },
      actions: [
        { action: 'schedule', title: 'Programar cosecha' },
        { action: 'view', title: 'Ver lote' }
      ]
    });
  }

  async showInputExpiry(input: any): Promise<void> {
    const daysToExpiry = Math.ceil((new Date(input.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    await this.showNotification({
      title: '📦 Insumo por Vencer',
      body: `${input.name} vence en ${daysToExpiry} días`,
      tag: `expiry_${input.id}`,
      data: { type: 'input_expiry', inputId: input.id },
      actions: [
        { action: 'use', title: 'Registrar uso' },
        { action: 'reorder', title: 'Reordenar' }
      ],
      requireInteraction: daysToExpiry <= 3
    });
  }

  async showWeatherAlert(alert: any): Promise<void> {
    const emoji = alert.type === 'rain' ? '🌧️' : alert.type === 'drought' ? '☀️' : '🌤️';
    
    await this.showNotification({
      title: `${emoji} Alerta Climática`,
      body: alert.message,
      tag: `weather_${alert.id}`,
      data: { type: 'weather_alert', alertId: alert.id },
      requireInteraction: alert.severity === 'high'
    });
  }

  async showSyncComplete(result: any): Promise<void> {
    const emoji = result.success ? '✅' : '❌';
    const title = result.success ? 'Sincronización Completada' : 'Error de Sincronización';
    const body = result.success 
      ? `${result.syncedItems} elementos sincronizados`
      : `${result.failedItems} elementos fallaron`;

    await this.showNotification({
      title: `${emoji} ${title}`,
      body,
      tag: 'sync_status',
      data: { type: 'sync_complete', result },
      silent: result.success
    });
  }

  // Programar notificaciones
  async scheduleNotification(
    type: NotificationType,
    data: any,
    scheduledTime: Date
  ): Promise<void> {
    const delay = scheduledTime.getTime() - Date.now();
    
    if (delay <= 0) {
      console.warn('[NotificationManager] Cannot schedule notification in the past');
      return;
    }

    setTimeout(() => {
      switch (type) {
        case 'task_reminder':
          this.showTaskReminder(data);
          break;
        case 'pest_alert':
          this.showPestAlert(data);
          break;
        case 'harvest_ready':
          this.showHarvestReady(data);
          break;
        case 'input_expiry':
          this.showInputExpiry(data);
          break;
        case 'weather_alert':
          this.showWeatherAlert(data);
          break;
        default:
          this.showNotification(data);
      }
    }, delay);
  }

  // Cancelar notificaciones por tag
  async cancelNotification(tag: string): Promise<void> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications({ tag });
      notifications.forEach(notification => notification.close());
    }
  }

  // Obtener notificaciones activas
  async getActiveNotifications(): Promise<Notification[]> {
    if (this.registration) {
      return await this.registration.getNotifications();
    }
    return [];
  }

  // Limpiar notificaciones antiguas
  async clearOldNotifications(): Promise<void> {
    if (this.registration) {
      const notifications = await this.registration.getNotifications();
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      
      notifications.forEach(notification => {
        if (notification.timestamp && notification.timestamp < oneDayAgo) {
          notification.close();
        }
      });
    }
  }

  // Configurar manejadores de eventos
  setupEventHandlers(): void {
    if (!this.registration) return;

    // Manejar clics en notificaciones
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'notification-click') {
        this.handleNotificationClick(event.data);
      }
    });
  }

  private handleNotificationClick(data: any): void {
    const { action, notificationData } = data;
    
    switch (notificationData.type) {
      case 'task_reminder':
        if (action === 'complete') {
          // Marcar tarea como completada
          window.dispatchEvent(new CustomEvent('complete-task', { 
            detail: { taskId: notificationData.taskId } 
          }));
        } else if (action === 'postpone') {
          // Posponer tarea
          window.dispatchEvent(new CustomEvent('postpone-task', { 
            detail: { taskId: notificationData.taskId } 
          }));
        }
        break;
        
      case 'pest_alert':
        if (action === 'view') {
          // Navegar a detalles de monitoreo
          window.location.href = `/pest-monitoring/${notificationData.monitoringId}`;
        } else if (action === 'treat') {
          // Programar tratamiento
          window.dispatchEvent(new CustomEvent('schedule-treatment', { 
            detail: { monitoringId: notificationData.monitoringId } 
          }));
        }
        break;
        
      case 'harvest_ready':
        if (action === 'schedule') {
          // Programar cosecha
          window.location.href = `/lots/${notificationData.lotId}/harvest`;
        } else if (action === 'view') {
          // Ver lote
          window.location.href = `/lots/${notificationData.lotId}`;
        }
        break;
        
      case 'input_expiry':
        if (action === 'use') {
          // Registrar uso de insumo
          window.location.href = `/inventory/${notificationData.inputId}/use`;
        } else if (action === 'reorder') {
          // Reordenar insumo
          window.dispatchEvent(new CustomEvent('reorder-input', { 
            detail: { inputId: notificationData.inputId } 
          }));
        }
        break;
    }
  }

  // Configuraciones de usuario
  async getUserSettings(): Promise<any> {
    return {
      enabled: this.hasPermission(),
      taskReminders: localStorage.getItem('notifications_task_reminders') !== 'false',
      pestAlerts: localStorage.getItem('notifications_pest_alerts') !== 'false',
      harvestAlerts: localStorage.getItem('notifications_harvest_alerts') !== 'false',
      inputExpiry: localStorage.getItem('notifications_input_expiry') !== 'false',
      weatherAlerts: localStorage.getItem('notifications_weather_alerts') !== 'false',
      syncStatus: localStorage.getItem('notifications_sync_status') !== 'false'
    };
  }

  async updateUserSettings(settings: any): Promise<void> {
    Object.keys(settings).forEach(key => {
      if (key !== 'enabled') {
        localStorage.setItem(`notifications_${key}`, settings[key].toString());
      }
    });
  }
}

// Instancia global del gestor de notificaciones
export const notificationManager = new NotificationManager();
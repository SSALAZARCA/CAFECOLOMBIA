import { 
  EarlyWarningAlert, 
  RiskLevel, 
  PestType, 
  AlertThreshold,
  EarlyWarningEvent,
  NotificationPreferences,
  NotificationChannel,
  NotificationPriority
} from '../types/earlyWarning';

// Extender tipos para notificaciones inteligentes
interface SmartNotification {
  id: string;
  type: 'alert' | 'reminder' | 'update' | 'summary';
  priority: NotificationPriority;
  title: string;
  message: string;
  data: any;
  channels: NotificationChannel[];
  scheduledFor: Date;
  sentAt?: Date;
  acknowledged?: boolean;
  actions?: NotificationAction[];
  expiresAt?: Date;
  groupId?: string; // Para agrupar notificaciones relacionadas
}

interface NotificationAction {
  id: string;
  label: string;
  action: 'acknowledge' | 'snooze' | 'view_details' | 'apply_treatment' | 'custom';
  data?: any;
}

interface NotificationRule {
  id: string;
  name: string;
  pestTypes: PestType[];
  riskLevels: RiskLevel[];
  conditions: NotificationCondition[];
  actions: NotificationRuleAction[];
  enabled: boolean;
  cooldownMinutes: number; // Evitar spam de notificaciones
  maxPerDay: number;
}

interface NotificationCondition {
  type: 'risk_threshold' | 'weather_change' | 'time_based' | 'location_based';
  operator: 'greater_than' | 'less_than' | 'equals' | 'between';
  value: any;
  field: string;
}

interface NotificationRuleAction {
  type: 'send_notification' | 'create_task' | 'send_email' | 'send_sms';
  config: any;
}

interface NotificationStats {
  totalSent: number;
  acknowledged: number;
  ignored: number;
  actionsTaken: number;
  averageResponseTime: number;
  effectivenessScore: number;
}

class SmartNotificationService {
  private notifications: SmartNotification[] = [];
  private rules: NotificationRule[] = [];
  private preferences: NotificationPreferences;
  private stats: NotificationStats;
  private notificationQueue: SmartNotification[] = [];
  private isProcessing = false;

  constructor() {
    this.preferences = this.getDefaultPreferences();
    this.stats = this.initializeStats();
    this.initializeDefaultRules();
    this.startNotificationProcessor();
  }

  private getDefaultPreferences(): NotificationPreferences {
    return {
      enabled: true,
      channels: ['push', 'in_app'],
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '06:00'
      },
      riskLevelSettings: {
        low: { enabled: false, channels: [] },
        medium: { enabled: true, channels: ['in_app'] },
        high: { enabled: true, channels: ['push', 'in_app'] },
        critical: { enabled: true, channels: ['push', 'in_app', 'email'] }
      },
      pestTypeSettings: {
        roya: { enabled: true, priority: 'high' },
        broca: { enabled: true, priority: 'high' },
        minador: { enabled: true, priority: 'medium' },
        cochinilla: { enabled: true, priority: 'medium' },
        nematodos: { enabled: true, priority: 'low' },
        antracnosis: { enabled: true, priority: 'medium' },
        mancha_foliar: { enabled: true, priority: 'low' },
        ojo_gallo: { enabled: true, priority: 'low' }
      },
      groupSimilar: true,
      maxNotificationsPerHour: 5,
      intelligentTiming: true
    };
  }

  private initializeStats(): NotificationStats {
    return {
      totalSent: 0,
      acknowledged: 0,
      ignored: 0,
      actionsTaken: 0,
      averageResponseTime: 0,
      effectivenessScore: 0.75
    };
  }

  private initializeDefaultRules(): void {
    this.rules = [
      {
        id: 'critical_risk_immediate',
        name: 'Riesgo Crítico - Notificación Inmediata',
        pestTypes: ['roya', 'broca', 'minador', 'cochinilla'],
        riskLevels: ['critical'],
        conditions: [
          {
            type: 'risk_threshold',
            operator: 'greater_than',
            value: 0.8,
            field: 'probability'
          }
        ],
        actions: [
          {
            type: 'send_notification',
            config: {
              priority: 'critical',
              channels: ['push', 'in_app', 'email'],
              immediate: true
            }
          }
        ],
        enabled: true,
        cooldownMinutes: 30,
        maxPerDay: 10
      },
      {
        id: 'high_risk_scheduled',
        name: 'Riesgo Alto - Notificación Programada',
        pestTypes: ['roya', 'broca', 'minador', 'cochinilla'],
        riskLevels: ['high'],
        conditions: [
          {
            type: 'risk_threshold',
            operator: 'greater_than',
            value: 0.6,
            field: 'probability'
          }
        ],
        actions: [
          {
            type: 'send_notification',
            config: {
              priority: 'high',
              channels: ['push', 'in_app'],
              delay: 15 // minutos
            }
          }
        ],
        enabled: true,
        cooldownMinutes: 120,
        maxPerDay: 6
      },
      {
        id: 'weather_change_alert',
        name: 'Cambio Meteorológico Significativo',
        pestTypes: ['roya', 'broca', 'minador', 'cochinilla'],
        riskLevels: ['medium', 'high', 'critical'],
        conditions: [
          {
            type: 'weather_change',
            operator: 'greater_than',
            value: 20,
            field: 'humidity_change_percentage'
          }
        ],
        actions: [
          {
            type: 'send_notification',
            config: {
              priority: 'medium',
              channels: ['in_app'],
              delay: 30
            }
          }
        ],
        enabled: true,
        cooldownMinutes: 240,
        maxPerDay: 3
      },
      {
        id: 'daily_summary',
        name: 'Resumen Diario',
        pestTypes: ['roya', 'broca', 'minador', 'cochinilla'],
        riskLevels: ['low', 'medium', 'high', 'critical'],
        conditions: [
          {
            type: 'time_based',
            operator: 'equals',
            value: '08:00',
            field: 'time'
          }
        ],
        actions: [
          {
            type: 'send_notification',
            config: {
              priority: 'low',
              channels: ['in_app'],
              type: 'summary'
            }
          }
        ],
        enabled: true,
        cooldownMinutes: 1440, // 24 horas
        maxPerDay: 1
      }
    ];
  }

  // Procesar alertas y generar notificaciones inteligentes
  async processAlert(alert: EarlyWarningAlert): Promise<void> {
    try {
      // Verificar si la alerta cumple con las reglas de notificación
      const applicableRules = this.getApplicableRules(alert);
      
      for (const rule of applicableRules) {
        if (this.shouldTriggerRule(rule, alert)) {
          const notification = await this.createNotificationFromRule(rule, alert);
          if (notification) {
            await this.scheduleNotification(notification);
          }
        }
      }
    } catch (error) {
      console.error('Error processing alert for notifications:', error);
    }
  }

  private getApplicableRules(alert: EarlyWarningAlert): NotificationRule[] {
    return this.rules.filter(rule => 
      rule.enabled &&
      rule.pestTypes.includes(alert.pestType) &&
      rule.riskLevels.includes(alert.riskLevel)
    );
  }

  private shouldTriggerRule(rule: NotificationRule, alert: EarlyWarningAlert): boolean {
    // Verificar cooldown
    const lastNotification = this.getLastNotificationForRule(rule.id);
    if (lastNotification) {
      const timeSinceLastNotification = Date.now() - lastNotification.sentAt!.getTime();
      if (timeSinceLastNotification < rule.cooldownMinutes * 60 * 1000) {
        return false;
      }
    }

    // Verificar límite diario
    const todayNotifications = this.getTodayNotificationsForRule(rule.id);
    if (todayNotifications.length >= rule.maxPerDay) {
      return false;
    }

    // Verificar condiciones específicas
    return rule.conditions.every(condition => this.evaluateCondition(condition, alert));
  }

  private evaluateCondition(condition: NotificationCondition, alert: EarlyWarningAlert): boolean {
    let value: any;
    
    switch (condition.field) {
      case 'probability':
        value = alert.probability;
        break;
      case 'confidence':
        value = alert.confidence;
        break;
      case 'riskLevel':
        value = alert.riskLevel;
        break;
      default:
        return true;
    }

    switch (condition.operator) {
      case 'greater_than':
        return value > condition.value;
      case 'less_than':
        return value < condition.value;
      case 'equals':
        return value === condition.value;
      case 'between':
        return value >= condition.value[0] && value <= condition.value[1];
      default:
        return false;
    }
  }

  private async createNotificationFromRule(rule: NotificationRule, alert: EarlyWarningAlert): Promise<SmartNotification | null> {
    const ruleAction = rule.actions.find(action => action.type === 'send_notification');
    if (!ruleAction) return null;

    const config = ruleAction.config;
    const priority = config.priority || this.getPriorityFromRiskLevel(alert.riskLevel);
    
    // Determinar canales basado en preferencias y configuración de la regla
    const channels = this.determineChannels(alert.riskLevel, config.channels);
    
    // Calcular tiempo de programación
    const scheduledFor = this.calculateScheduledTime(config);
    
    // Generar mensaje inteligente
    const { title, message } = this.generateIntelligentMessage(alert, rule);

    // Crear acciones contextuales
    const actions = this.generateContextualActions(alert);

    const notification: SmartNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: config.type || 'alert',
      priority,
      title,
      message,
      data: {
        alertId: alert.id,
        ruleId: rule.id,
        pestType: alert.pestType,
        riskLevel: alert.riskLevel
      },
      channels,
      scheduledFor,
      actions,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 horas
      groupId: `${alert.pestType}_${alert.riskLevel}`
    };

    return notification;
  }

  private getPriorityFromRiskLevel(riskLevel: RiskLevel): NotificationPriority {
    const priorityMap: Record<RiskLevel, NotificationPriority> = {
      low: 'low',
      medium: 'medium',
      high: 'high',
      critical: 'critical'
    };
    return priorityMap[riskLevel];
  }

  private determineChannels(riskLevel: RiskLevel, ruleChannels?: NotificationChannel[]): NotificationChannel[] {
    const preferenceChannels = this.preferences.riskLevelSettings[riskLevel].channels;
    
    if (ruleChannels) {
      // Intersección entre canales de la regla y preferencias del usuario
      return ruleChannels.filter(channel => preferenceChannels.includes(channel));
    }
    
    return preferenceChannels;
  }

  private calculateScheduledTime(config: any): Date {
    const now = new Date();
    
    if (config.immediate) {
      return now;
    }
    
    if (config.delay) {
      return new Date(now.getTime() + config.delay * 60 * 1000);
    }
    
    // Timing inteligente basado en preferencias
    if (this.preferences.intelligentTiming) {
      return this.calculateOptimalTime(now);
    }
    
    return now;
  }

  private calculateOptimalTime(baseTime: Date): Date {
    const hour = baseTime.getHours();
    
    // Evitar horas de silencio
    if (this.preferences.quietHours.enabled) {
      const quietStart = parseInt(this.preferences.quietHours.start.split(':')[0]);
      const quietEnd = parseInt(this.preferences.quietHours.end.split(':')[0]);
      
      if (hour >= quietStart || hour < quietEnd) {
        // Programar para después de las horas de silencio
        const nextMorning = new Date(baseTime);
        nextMorning.setHours(quietEnd, 0, 0, 0);
        if (nextMorning <= baseTime) {
          nextMorning.setDate(nextMorning.getDate() + 1);
        }
        return nextMorning;
      }
    }
    
    // Verificar límite de notificaciones por hora
    const currentHourNotifications = this.getCurrentHourNotifications();
    if (currentHourNotifications.length >= this.preferences.maxNotificationsPerHour) {
      // Programar para la siguiente hora
      const nextHour = new Date(baseTime);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return nextHour;
    }
    
    return baseTime;
  }

  private generateIntelligentMessage(alert: EarlyWarningAlert, rule: NotificationRule): { title: string; message: string } {
    const pestName = alert.pestType.charAt(0).toUpperCase() + alert.pestType.slice(1);
    const riskText = this.getRiskLevelText(alert.riskLevel);
    const probability = (alert.probability * 100).toFixed(1);
    
    let title: string;
    let message: string;
    
    switch (alert.riskLevel) {
      case 'critical':
        title = `🚨 ALERTA CRÍTICA: ${pestName}`;
        message = `Se detectó riesgo crítico de ${pestName} con ${probability}% de probabilidad. Acción inmediata requerida.`;
        break;
      case 'high':
        title = `⚠️ Riesgo Alto: ${pestName}`;
        message = `Condiciones favorables para ${pestName} detectadas (${probability}% probabilidad). Revisar medidas preventivas.`;
        break;
      case 'medium':
        title = `📊 Riesgo Moderado: ${pestName}`;
        message = `Incremento en el riesgo de ${pestName} (${probability}% probabilidad). Monitoreo recomendado.`;
        break;
      default:
        title = `ℹ️ Actualización: ${pestName}`;
        message = `Estado actual del riesgo de ${pestName}: ${riskText} (${probability}% probabilidad).`;
    }
    
    // Agregar contexto temporal si está disponible
    if (alert.timeframe) {
      const daysToStart = Math.ceil((alert.timeframe.start.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToStart > 0) {
        message += ` Inicio esperado en ${daysToStart} días.`;
      } else {
        message += ` Condiciones activas ahora.`;
      }
    }
    
    return { title, message };
  }

  private generateContextualActions(alert: EarlyWarningAlert): NotificationAction[] {
    const actions: NotificationAction[] = [
      {
        id: 'acknowledge',
        label: 'Reconocer',
        action: 'acknowledge',
        data: { alertId: alert.id }
      },
      {
        id: 'view_details',
        label: 'Ver Detalles',
        action: 'view_details',
        data: { alertId: alert.id }
      }
    ];
    
    if (alert.riskLevel === 'high' || alert.riskLevel === 'critical') {
      actions.push({
        id: 'apply_treatment',
        label: 'Aplicar Tratamiento',
        action: 'apply_treatment',
        data: { 
          alertId: alert.id,
          pestType: alert.pestType,
          recommendations: alert.recommendations.immediate
        }
      });
    }
    
    if (alert.riskLevel !== 'critical') {
      actions.push({
        id: 'snooze',
        label: 'Recordar en 1h',
        action: 'snooze',
        data: { alertId: alert.id, duration: 60 }
      });
    }
    
    return actions;
  }

  private getRiskLevelText(level: RiskLevel): string {
    const levels = {
      low: 'Bajo',
      medium: 'Medio',
      high: 'Alto',
      critical: 'Crítico'
    };
    return levels[level];
  }

  // Programar notificación
  private async scheduleNotification(notification: SmartNotification): Promise<void> {
    // Verificar si debe agruparse con notificaciones existentes
    if (this.preferences.groupSimilar && notification.groupId) {
      const existingGroup = this.notificationQueue.find(n => 
        n.groupId === notification.groupId && 
        !n.sentAt &&
        Math.abs(n.scheduledFor.getTime() - notification.scheduledFor.getTime()) < 30 * 60 * 1000 // 30 minutos
      );
      
      if (existingGroup) {
        // Actualizar notificación existente en lugar de crear una nueva
        existingGroup.message += `\n\n${notification.message}`;
        existingGroup.data.alerts = existingGroup.data.alerts || [];
        existingGroup.data.alerts.push(notification.data);
        return;
      }
    }
    
    this.notificationQueue.push(notification);
    this.sortNotificationQueue();
  }

  private sortNotificationQueue(): void {
    this.notificationQueue.sort((a, b) => {
      // Primero por prioridad
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // Luego por tiempo programado
      return a.scheduledFor.getTime() - b.scheduledFor.getTime();
    });
  }

  // Procesador de notificaciones
  private startNotificationProcessor(): void {
    setInterval(() => {
      if (!this.isProcessing) {
        this.processNotificationQueue();
      }
    }, 30000); // Cada 30 segundos
  }

  private async processNotificationQueue(): Promise<void> {
    this.isProcessing = true;
    
    try {
      const now = new Date();
      const notificationsToSend = this.notificationQueue.filter(n => 
        !n.sentAt && 
        n.scheduledFor <= now &&
        (!n.expiresAt || n.expiresAt > now)
      );
      
      for (const notification of notificationsToSend) {
        await this.sendNotification(notification);
      }
      
      // Limpiar notificaciones expiradas
      this.notificationQueue = this.notificationQueue.filter(n => 
        !n.expiresAt || n.expiresAt > now
      );
      
    } catch (error) {
      console.error('Error processing notification queue:', error);
    } finally {
      this.isProcessing = false;
    }
  }

  private async sendNotification(notification: SmartNotification): Promise<void> {
    try {
      // Enviar por cada canal configurado
      for (const channel of notification.channels) {
        await this.sendToChannel(notification, channel);
      }
      
      notification.sentAt = new Date();
      this.notifications.push(notification);
      this.updateStats('sent');
      
      console.log(`Notification sent: ${notification.title}`);
      
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  private async sendToChannel(notification: SmartNotification, channel: NotificationChannel): Promise<void> {
    switch (channel) {
      case 'push':
        await this.sendPushNotification(notification);
        break;
      case 'in_app':
        await this.sendInAppNotification(notification);
        break;
      case 'email':
        await this.sendEmailNotification(notification);
        break;
      case 'sms':
        await this.sendSMSNotification(notification);
        break;
    }
  }

  private async sendPushNotification(notification: SmartNotification): Promise<void> {
    // Implementación de push notification
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(notification.title, {
          body: notification.message,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/badge-72x72.png',
          data: notification.data,
          actions: notification.actions?.slice(0, 2).map(action => ({
            action: action.id,
            title: action.label
          })),
          requireInteraction: notification.priority === 'critical',
          silent: notification.priority === 'low'
        });
      } catch (error) {
        console.error('Error sending push notification:', error);
      }
    }
  }

  private async sendInAppNotification(notification: SmartNotification): Promise<void> {
    // Enviar evento para mostrar notificación in-app
    const event = new CustomEvent('smart-notification', {
      detail: notification
    });
    window.dispatchEvent(event);
  }

  private async sendEmailNotification(notification: SmartNotification): Promise<void> {
    // Mock implementation - en producción se integraría con servicio de email
    console.log(`Email notification: ${notification.title} - ${notification.message}`);
  }

  private async sendSMSNotification(notification: SmartNotification): Promise<void> {
    // Mock implementation - en producción se integraría con servicio de SMS
    console.log(`SMS notification: ${notification.title} - ${notification.message}`);
  }

  // Métodos de utilidad
  private getLastNotificationForRule(ruleId: string): SmartNotification | undefined {
    return this.notifications
      .filter(n => n.data.ruleId === ruleId && n.sentAt)
      .sort((a, b) => b.sentAt!.getTime() - a.sentAt!.getTime())[0];
  }

  private getTodayNotificationsForRule(ruleId: string): SmartNotification[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.notifications.filter(n => 
      n.data.ruleId === ruleId && 
      n.sentAt && 
      n.sentAt >= today
    );
  }

  private getCurrentHourNotifications(): SmartNotification[] {
    const currentHour = new Date();
    currentHour.setMinutes(0, 0, 0);
    
    return this.notifications.filter(n => 
      n.sentAt && 
      n.sentAt >= currentHour
    );
  }

  private updateStats(action: 'sent' | 'acknowledged' | 'ignored' | 'action_taken'): void {
    switch (action) {
      case 'sent':
        this.stats.totalSent++;
        break;
      case 'acknowledged':
        this.stats.acknowledged++;
        break;
      case 'ignored':
        this.stats.ignored++;
        break;
      case 'action_taken':
        this.stats.actionsTaken++;
        break;
    }
    
    // Recalcular efectividad
    if (this.stats.totalSent > 0) {
      this.stats.effectivenessScore = (this.stats.acknowledged + this.stats.actionsTaken) / this.stats.totalSent;
    }
  }

  // API pública
  async acknowledgeNotification(notificationId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.acknowledged = true;
      this.updateStats('acknowledged');
    }
  }

  async executeNotificationAction(notificationId: string, actionId: string): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (!notification) return;
    
    const action = notification.actions?.find(a => a.id === actionId);
    if (!action) return;
    
    switch (action.action) {
      case 'acknowledge':
        await this.acknowledgeNotification(notificationId);
        break;
      case 'snooze':
        await this.snoozeNotification(notificationId, action.data.duration);
        break;
      case 'view_details':
        // Emitir evento para navegar a detalles
        window.dispatchEvent(new CustomEvent('view-alert-details', { detail: action.data }));
        break;
      case 'apply_treatment':
        // Emitir evento para aplicar tratamiento
        window.dispatchEvent(new CustomEvent('apply-treatment', { detail: action.data }));
        break;
    }
    
    this.updateStats('action_taken');
  }

  private async snoozeNotification(notificationId: string, minutes: number): Promise<void> {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      // Crear nueva notificación programada
      const snoozeNotification: SmartNotification = {
        ...notification,
        id: `${notification.id}_snooze_${Date.now()}`,
        scheduledFor: new Date(Date.now() + minutes * 60 * 1000),
        sentAt: undefined
      };
      
      this.notificationQueue.push(snoozeNotification);
      this.sortNotificationQueue();
    }
  }

  getNotificationStats(): NotificationStats {
    return { ...this.stats };
  }

  getActiveNotifications(): SmartNotification[] {
    return this.notifications.filter(n => n.sentAt && !n.acknowledged);
  }

  updatePreferences(preferences: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...preferences };
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }
}

// Instancia singleton
export const smartNotificationService = new SmartNotificationService();
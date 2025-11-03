import { pool } from '../config/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import emailService from './emailService.js';

interface NotificationData {
  user_id: number;
  type: 'email' | 'sms' | 'push' | 'in_app';
  title: string;
  message: string;
  data?: Record<string, any>;
}

interface NotificationSettings {
  email_enabled: boolean;
  sms_enabled: boolean;
  push_enabled: boolean;
  payment_success_email: boolean;
  payment_failed_email: boolean;
  subscription_renewal_email: boolean;
  subscription_expiry_email: boolean;
}

class NotificationService {
  private settings: NotificationSettings | null = null;

  /**
   * Inicializar el servicio con configuraciones de la base de datos
   */
  async initialize(): Promise<void> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT \`key\`, value FROM system_settings WHERE category = 'notifications'`
      );

      const settingsData: Record<string, string> = {};
      rows.forEach(row => {
        settingsData[row.key] = row.value;
      });

      this.settings = {
        email_enabled: settingsData.email_enabled === 'true',
        sms_enabled: settingsData.sms_enabled === 'true',
        push_enabled: settingsData.push_enabled === 'true',
        payment_success_email: settingsData.payment_success_email === 'true',
        payment_failed_email: settingsData.payment_failed_email === 'true',
        subscription_renewal_email: settingsData.subscription_renewal_email === 'true',
        subscription_expiry_email: settingsData.subscription_expiry_email === 'true'
      };
    } catch (error) {
      console.error('Error inicializando servicio de notificaciones:', error);
      throw error;
    }
  }

  /**
   * Crear una notificación en la base de datos
   */
  async createNotification(notificationData: NotificationData): Promise<number> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        `INSERT INTO notifications (user_id, type, title, message, data, status) 
         VALUES (?, ?, ?, ?, ?, 'pending')`,
        [
          notificationData.user_id,
          notificationData.type,
          notificationData.title,
          notificationData.message,
          JSON.stringify(notificationData.data || {})
        ]
      );

      return result.insertId;
    } catch (error) {
      console.error('Error creando notificación:', error);
      throw error;
    }
  }

  /**
   * Enviar notificación
   */
  async sendNotification(notificationData: NotificationData): Promise<boolean> {
    try {
      if (!this.settings) {
        await this.initialize();
      }

      // Crear la notificación en la base de datos
      const notificationId = await this.createNotification(notificationData);

      let success = false;

      switch (notificationData.type) {
        case 'email':
          success = await this.sendEmailNotification(notificationId, notificationData);
          break;
        case 'sms':
          success = await this.sendSMSNotification(notificationId, notificationData);
          break;
        case 'push':
          success = await this.sendPushNotification(notificationId, notificationData);
          break;
        case 'in_app':
          success = true; // Las notificaciones in-app solo se guardan en la BD
          break;
        default:
          console.error('Tipo de notificación no soportado:', notificationData.type);
          success = false;
      }

      // Actualizar el estado de la notificación
      await this.updateNotificationStatus(
        notificationId, 
        success ? 'sent' : 'failed',
        success ? null : 'Error enviando notificación'
      );

      return success;
    } catch (error) {
      console.error('Error enviando notificación:', error);
      return false;
    }
  }

  /**
   * Enviar notificación por email
   */
  private async sendEmailNotification(notificationId: number, notificationData: NotificationData): Promise<boolean> {
    try {
      if (!this.settings?.email_enabled) {
        console.log('Notificaciones por email deshabilitadas');
        return false;
      }

      // Obtener email del usuario
      const [userRows] = await pool.execute<RowDataPacket[]>(
        'SELECT email, first_name, last_name FROM users WHERE id = ?',
        [notificationData.user_id]
      );

      if (userRows.length === 0) {
        console.error('Usuario no encontrado:', notificationData.user_id);
        return false;
      }

      const user = userRows[0];
      const userName = `${user.first_name || ''} ${user.last_name || ''}`.trim() || 'Usuario';

      const success = await emailService.sendEmail({
        to: user.email,
        subject: notificationData.title,
        html: `
          <h2>${notificationData.title}</h2>
          <p>Hola ${userName},</p>
          <p>${notificationData.message}</p>
          ${notificationData.data ? `<p><strong>Detalles adicionales:</strong></p><pre>${JSON.stringify(notificationData.data, null, 2)}</pre>` : ''}
          <p>Saludos,<br>El equipo de Café Colombia</p>
        `,
        text: `${notificationData.title}\n\nHola ${userName},\n\n${notificationData.message}\n\nSaludos,\nEl equipo de Café Colombia`
      });

      if (success) {
        await this.updateNotificationStatus(notificationId, 'delivered');
      }

      return success;
    } catch (error) {
      console.error('Error enviando email:', error);
      return false;
    }
  }

  /**
   * Enviar notificación por SMS (placeholder)
   */
  private async sendSMSNotification(notificationId: number, notificationData: NotificationData): Promise<boolean> {
    try {
      if (!this.settings?.sms_enabled) {
        console.log('Notificaciones por SMS deshabilitadas');
        return false;
      }

      // TODO: Implementar integración con proveedor de SMS
      console.log('SMS notification (not implemented):', notificationData);
      
      // Por ahora, simular envío exitoso
      await this.updateNotificationStatus(notificationId, 'delivered');
      return true;
    } catch (error) {
      console.error('Error enviando SMS:', error);
      return false;
    }
  }

  /**
   * Enviar notificación push (placeholder)
   */
  private async sendPushNotification(notificationId: number, notificationData: NotificationData): Promise<boolean> {
    try {
      if (!this.settings?.push_enabled) {
        console.log('Notificaciones push deshabilitadas');
        return false;
      }

      // TODO: Implementar integración con servicio de push notifications
      console.log('Push notification (not implemented):', notificationData);
      
      // Por ahora, simular envío exitoso
      await this.updateNotificationStatus(notificationId, 'delivered');
      return true;
    } catch (error) {
      console.error('Error enviando push notification:', error);
      return false;
    }
  }

  /**
   * Actualizar estado de notificación
   */
  private async updateNotificationStatus(
    notificationId: number, 
    status: 'pending' | 'sent' | 'delivered' | 'failed' | 'read',
    errorMessage?: string | null
  ): Promise<void> {
    try {
      const updateFields = ['status = ?'];
      const updateValues = [status];

      if (status === 'sent') {
        updateFields.push('sent_at = NOW()');
      } else if (status === 'delivered') {
        updateFields.push('delivered_at = NOW()');
      } else if (status === 'read') {
        updateFields.push('read_at = NOW()');
      }

      if (errorMessage) {
        updateFields.push('error_message = ?');
        updateValues.push(errorMessage);
      }

      updateValues.push(notificationId);

      await pool.execute(
        `UPDATE notifications SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
    } catch (error) {
      console.error('Error actualizando estado de notificación:', error);
    }
  }

  /**
   * Obtener notificaciones de un usuario
   */
  async getUserNotifications(
    userId: number, 
    type?: string, 
    limit: number = 50, 
    offset: number = 0
  ): Promise<any[]> {
    try {
      let query = `
        SELECT id, type, title, message, data, status, 
               sent_at, delivered_at, read_at, created_at
        FROM notifications 
        WHERE user_id = ?
      `;
      const params: any[] = [userId];

      if (type) {
        query += ' AND type = ?';
        params.push(type);
      }

      query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(limit, offset);

      const [rows] = await pool.execute<RowDataPacket[]>(query, params);
      
      return rows.map(row => ({
        ...row,
        data: row.data ? JSON.parse(row.data) : null
      }));
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }
  }

  /**
   * Marcar notificación como leída
   */
  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    try {
      const [result] = await pool.execute<ResultSetHeader>(
        'UPDATE notifications SET status = "read", read_at = NOW() WHERE id = ? AND user_id = ?',
        [notificationId, userId]
      );

      return result.affectedRows > 0;
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      return false;
    }
  }

  /**
   * Marcar todas las notificaciones como leídas
   */
  async markAllAsRead(userId: number): Promise<boolean> {
    try {
      await pool.execute(
        'UPDATE notifications SET status = "read", read_at = NOW() WHERE user_id = ? AND status != "read"',
        [userId]
      );

      return true;
    } catch (error) {
      console.error('Error marcando todas las notificaciones como leídas:', error);
      return false;
    }
  }

  /**
   * Obtener conteo de notificaciones no leídas
   */
  async getUnreadCount(userId: number): Promise<number> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND status != "read"',
        [userId]
      );

      return rows[0]?.count || 0;
    } catch (error) {
      console.error('Error obteniendo conteo de notificaciones no leídas:', error);
      return 0;
    }
  }

  /**
   * Notificaciones específicas para eventos de pago
   */
  async notifyPaymentSuccess(userId: number, paymentData: any): Promise<void> {
    if (!this.settings?.payment_success_email) return;

    await this.sendNotification({
      user_id: userId,
      type: 'email',
      title: 'Pago Procesado Exitosamente',
      message: `Tu pago por ${paymentData.planName} ha sido procesado exitosamente.`,
      data: paymentData
    });

    await this.sendNotification({
      user_id: userId,
      type: 'in_app',
      title: 'Pago Exitoso',
      message: `Tu pago por ${paymentData.planName} ha sido procesado exitosamente.`,
      data: paymentData
    });
  }

  async notifyPaymentFailed(userId: number, paymentData: any): Promise<void> {
    if (!this.settings?.payment_failed_email) return;

    await this.sendNotification({
      user_id: userId,
      type: 'email',
      title: 'Error en el Pago',
      message: `Hemos tenido un problema procesando tu pago para ${paymentData.planName}.`,
      data: paymentData
    });

    await this.sendNotification({
      user_id: userId,
      type: 'in_app',
      title: 'Error en el Pago',
      message: `Error procesando tu pago para ${paymentData.planName}. Por favor intenta nuevamente.`,
      data: paymentData
    });
  }

  async notifySubscriptionRenewal(userId: number, subscriptionData: any): Promise<void> {
    if (!this.settings?.subscription_renewal_email) return;

    await this.sendNotification({
      user_id: userId,
      type: 'email',
      title: 'Suscripción Renovada',
      message: `Tu suscripción a ${subscriptionData.planName} ha sido renovada exitosamente.`,
      data: subscriptionData
    });

    await this.sendNotification({
      user_id: userId,
      type: 'in_app',
      title: 'Suscripción Renovada',
      message: `Tu suscripción a ${subscriptionData.planName} ha sido renovada.`,
      data: subscriptionData
    });
  }

  async notifySubscriptionExpiry(userId: number, subscriptionData: any): Promise<void> {
    if (!this.settings?.subscription_expiry_email) return;

    await this.sendNotification({
      user_id: userId,
      type: 'email',
      title: 'Tu Suscripción Expira Pronto',
      message: `Tu suscripción a ${subscriptionData.planName} expirará el ${subscriptionData.expiryDate}.`,
      data: subscriptionData
    });

    await this.sendNotification({
      user_id: userId,
      type: 'in_app',
      title: 'Suscripción por Expirar',
      message: `Tu suscripción a ${subscriptionData.planName} expirará pronto.`,
      data: subscriptionData
    });
  }
}

// Instancia singleton del servicio
export const notificationService = new NotificationService();
export default notificationService;
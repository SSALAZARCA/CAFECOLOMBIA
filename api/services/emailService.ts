import nodemailer from 'nodemailer';
import { pool } from '../config/database.js';
import { RowDataPacket } from 'mysql2';

interface EmailConfig {
  smtp_host: string;
  smtp_port: number;
  smtp_secure: boolean;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  from_name: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  template?: string;
  templateData?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private config: EmailConfig | null = null;

  /**
   * Inicializar el servicio de email con la configuración de la base de datos
   */
  async initialize(): Promise<void> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT \`key\`, value FROM system_settings WHERE category = 'email'`
      );

      const settings: Record<string, string> = {};
      rows.forEach(row => {
        settings[row.key] = row.value;
      });

      this.config = {
        smtp_host: settings.smtp_host || '',
        smtp_port: parseInt(settings.smtp_port) || 587,
        smtp_secure: settings.smtp_secure === 'true',
        smtp_user: settings.smtp_user || '',
        smtp_password: settings.smtp_password || '',
        from_email: settings.from_email || '',
        from_name: settings.from_name || 'Café Colombia'
      };

      if (this.config.smtp_host && this.config.smtp_user) {
        this.transporter = nodemailer.createTransporter({
          host: this.config.smtp_host,
          port: this.config.smtp_port,
          secure: this.config.smtp_secure,
          auth: {
            user: this.config.smtp_user,
            pass: this.config.smtp_password
          },
          tls: {
            rejectUnauthorized: false
          }
        });
      }
    } catch (error) {
      console.error('Error inicializando servicio de email:', error);
      throw error;
    }
  }

  /**
   * Verificar la conexión SMTP
   */
  async testConnection(): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      if (!this.transporter) {
        throw new Error('Transporter no configurado');
      }

      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('Error verificando conexión SMTP:', error);
      return false;
    }
  }

  /**
   * Enviar email
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.transporter) {
        await this.initialize();
      }

      if (!this.transporter || !this.config) {
        throw new Error('Servicio de email no configurado');
      }

      let { subject, html, text } = options;

      // Si se especifica un template, cargarlo y procesarlo
      if (options.template) {
        const template = await this.getTemplate(options.template);
        if (template) {
          subject = this.processTemplate(template.subject, options.templateData || {});
          html = this.processTemplate(template.html, options.templateData || {});
          text = template.text ? this.processTemplate(template.text, options.templateData || {}) : undefined;
        }
      }

      const mailOptions = {
        from: `${this.config.from_name} <${this.config.from_email}>`,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject,
        html,
        text,
        attachments: options.attachments
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email enviado exitosamente:', result.messageId);
      return true;
    } catch (error) {
      console.error('Error enviando email:', error);
      return false;
    }
  }

  /**
   * Obtener template de email desde la base de datos
   */
  private async getTemplate(templateName: string): Promise<EmailTemplate | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT subject, html_content as html, text_content as text 
         FROM email_templates 
         WHERE name = ? AND is_active = TRUE`,
        [templateName]
      );

      if (rows.length > 0) {
        return rows[0] as EmailTemplate;
      }

      // Si no existe el template en la base de datos, usar templates por defecto
      return this.getDefaultTemplate(templateName);
    } catch (error) {
      console.error('Error obteniendo template:', error);
      return this.getDefaultTemplate(templateName);
    }
  }

  /**
   * Templates por defecto
   */
  private getDefaultTemplate(templateName: string): EmailTemplate | null {
    const templates: Record<string, EmailTemplate> = {
      'payment_success': {
        subject: 'Pago Exitoso - {{planName}}',
        html: `
          <h2>¡Pago Procesado Exitosamente!</h2>
          <p>Hola {{userName}},</p>
          <p>Tu pago por <strong>{{planName}}</strong> ha sido procesado exitosamente.</p>
          <p><strong>Detalles del pago:</strong></p>
          <ul>
            <li>Monto: {{amount}} {{currency}}</li>
            <li>Fecha: {{paymentDate}}</li>
            <li>Método: {{paymentMethod}}</li>
            <li>ID de transacción: {{transactionId}}</li>
          </ul>
          <p>Tu suscripción está activa y puedes disfrutar de todos los beneficios.</p>
          <p>¡Gracias por confiar en Café Colombia!</p>
        `,
        text: 'Tu pago por {{planName}} ha sido procesado exitosamente. Monto: {{amount}} {{currency}}. Fecha: {{paymentDate}}.'
      },
      'payment_failed': {
        subject: 'Error en el Pago - {{planName}}',
        html: `
          <h2>Error en el Procesamiento del Pago</h2>
          <p>Hola {{userName}},</p>
          <p>Hemos tenido un problema procesando tu pago para <strong>{{planName}}</strong>.</p>
          <p><strong>Detalles:</strong></p>
          <ul>
            <li>Monto: {{amount}} {{currency}}</li>
            <li>Fecha del intento: {{paymentDate}}</li>
            <li>Razón: {{failureReason}}</li>
          </ul>
          <p>Por favor, verifica tu método de pago e intenta nuevamente.</p>
          <p>Si el problema persiste, contáctanos para asistencia.</p>
        `,
        text: 'Error procesando tu pago para {{planName}}. Razón: {{failureReason}}. Por favor intenta nuevamente.'
      },
      'subscription_renewal': {
        subject: 'Suscripción Renovada - {{planName}}',
        html: `
          <h2>Suscripción Renovada Exitosamente</h2>
          <p>Hola {{userName}},</p>
          <p>Tu suscripción a <strong>{{planName}}</strong> ha sido renovada exitosamente.</p>
          <p><strong>Detalles de la renovación:</strong></p>
          <ul>
            <li>Plan: {{planName}}</li>
            <li>Próxima renovación: {{nextRenewalDate}}</li>
            <li>Monto: {{amount}} {{currency}}</li>
          </ul>
          <p>Continúa disfrutando de todos los beneficios de tu suscripción.</p>
        `,
        text: 'Tu suscripción a {{planName}} ha sido renovada. Próxima renovación: {{nextRenewalDate}}.'
      },
      'subscription_expiry_warning': {
        subject: 'Tu Suscripción Expira Pronto - {{planName}}',
        html: `
          <h2>Tu Suscripción Expira Pronto</h2>
          <p>Hola {{userName}},</p>
          <p>Tu suscripción a <strong>{{planName}}</strong> expirará el {{expiryDate}}.</p>
          <p>Para continuar disfrutando de todos los beneficios, asegúrate de que tu método de pago esté actualizado.</p>
          <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
        `,
        text: 'Tu suscripción a {{planName}} expirará el {{expiryDate}}. Asegúrate de que tu método de pago esté actualizado.'
      },
      'welcome': {
        subject: 'Bienvenido a Café Colombia',
        html: `
          <h2>¡Bienvenido a Café Colombia!</h2>
          <p>Hola {{userName}},</p>
          <p>¡Gracias por unirte a nuestra comunidad de amantes del café!</p>
          <p>Estamos emocionados de tenerte con nosotros y esperamos que disfrutes de la mejor experiencia de café colombiano.</p>
          <p>Si tienes alguna pregunta, nuestro equipo está aquí para ayudarte.</p>
          <p>¡Bienvenido a bordo!</p>
        `,
        text: '¡Bienvenido a Café Colombia! Gracias por unirte a nuestra comunidad.'
      }
    };

    return templates[templateName] || null;
  }

  /**
   * Procesar template con datos
   */
  private processTemplate(template: string, data: Record<string, any>): string {
    let processed = template;
    
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      processed = processed.replace(regex, String(data[key] || ''));
    });

    return processed;
  }

  /**
   * Enviar email de bienvenida
   */
  async sendWelcomeEmail(userEmail: string, userName: string): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      template: 'welcome',
      templateData: { userName }
    });
  }

  /**
   * Enviar email de pago exitoso
   */
  async sendPaymentSuccessEmail(
    userEmail: string, 
    userName: string, 
    paymentData: {
      planName: string;
      amount: number;
      currency: string;
      paymentDate: string;
      paymentMethod: string;
      transactionId: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      template: 'payment_success',
      templateData: { userName, ...paymentData }
    });
  }

  /**
   * Enviar email de pago fallido
   */
  async sendPaymentFailedEmail(
    userEmail: string, 
    userName: string, 
    paymentData: {
      planName: string;
      amount: number;
      currency: string;
      paymentDate: string;
      failureReason: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      template: 'payment_failed',
      templateData: { userName, ...paymentData }
    });
  }

  /**
   * Enviar email de renovación de suscripción
   */
  async sendSubscriptionRenewalEmail(
    userEmail: string, 
    userName: string, 
    subscriptionData: {
      planName: string;
      nextRenewalDate: string;
      amount: number;
      currency: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      template: 'subscription_renewal',
      templateData: { userName, ...subscriptionData }
    });
  }

  /**
   * Enviar email de advertencia de expiración
   */
  async sendSubscriptionExpiryWarningEmail(
    userEmail: string, 
    userName: string, 
    subscriptionData: {
      planName: string;
      expiryDate: string;
    }
  ): Promise<boolean> {
    return this.sendEmail({
      to: userEmail,
      template: 'subscription_expiry_warning',
      templateData: { userName, ...subscriptionData }
    });
  }
}

// Instancia singleton del servicio
export const emailService = new EmailService();
export default emailService;
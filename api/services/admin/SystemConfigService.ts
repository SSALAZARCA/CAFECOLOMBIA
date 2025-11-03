import { pool } from '../../config/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import emailService from '../emailService.js';
import wompiService from '../wompiService.js';

interface SystemSetting {
  id?: number;
  category: string;
  key: string;
  value: string;
  description?: string;
  is_encrypted?: boolean;
}

interface ConfigurationTest {
  service: string;
  status: 'success' | 'error';
  message: string;
  details?: any;
}

class SystemConfigService {
  /**
   * Obtener todas las configuraciones
   */
  async getAllSettings(): Promise<Record<string, Record<string, any>>> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT category, `key`, value, description, is_encrypted FROM system_settings ORDER BY category, `key`'
      );

      const settings: Record<string, Record<string, any>> = {};
      
      rows.forEach(row => {
        if (!settings[row.category]) {
          settings[row.category] = {};
        }
        
        settings[row.category][row.key] = {
          value: row.value,
          description: row.description,
          is_encrypted: row.is_encrypted
        };
      });

      return settings;
    } catch (error) {
      console.error('Error obteniendo configuraciones:', error);
      throw error;
    }
  }

  /**
   * Obtener configuraciones por categoría
   */
  async getSettingsByCategory(category: string): Promise<Record<string, any>> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT `key`, value, description, is_encrypted FROM system_settings WHERE category = ?',
        [category]
      );

      const settings: Record<string, any> = {};
      
      rows.forEach(row => {
        settings[row.key] = {
          value: row.value,
          description: row.description,
          is_encrypted: row.is_encrypted
        };
      });

      return settings;
    } catch (error) {
      console.error('Error obteniendo configuraciones por categoría:', error);
      throw error;
    }
  }

  /**
   * Obtener una configuración específica
   */
  async getSetting(category: string, key: string): Promise<string | null> {
    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT value FROM system_settings WHERE category = ? AND `key` = ?',
        [category, key]
      );

      return rows.length > 0 ? rows[0].value : null;
    } catch (error) {
      console.error('Error obteniendo configuración:', error);
      return null;
    }
  }

  /**
   * Guardar configuración
   */
  async saveSetting(category: string, key: string, value: string, description?: string, isEncrypted: boolean = false): Promise<boolean> {
    try {
      // Verificar si la configuración ya existe
      const [existing] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM system_settings WHERE category = ? AND `key` = ?',
        [category, key]
      );

      if (existing.length > 0) {
        // Actualizar configuración existente
        await pool.execute(
          'UPDATE system_settings SET value = ?, description = ?, is_encrypted = ?, updated_at = NOW() WHERE category = ? AND `key` = ?',
          [value, description, isEncrypted, category, key]
        );
      } else {
        // Crear nueva configuración
        await pool.execute(
          'INSERT INTO system_settings (category, `key`, value, description, is_encrypted) VALUES (?, ?, ?, ?, ?)',
          [category, key, value, description, isEncrypted]
        );
      }

      return true;
    } catch (error) {
      console.error('Error guardando configuración:', error);
      return false;
    }
  }

  /**
   * Guardar múltiples configuraciones
   */
  async saveSettings(settings: SystemSetting[]): Promise<boolean> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      for (const setting of settings) {
        const [existing] = await connection.execute<RowDataPacket[]>(
          'SELECT id FROM system_settings WHERE category = ? AND `key` = ?',
          [setting.category, setting.key]
        );

        if (existing.length > 0) {
          await connection.execute(
            'UPDATE system_settings SET value = ?, description = ?, is_encrypted = ?, updated_at = NOW() WHERE category = ? AND `key` = ?',
            [setting.value, setting.description, setting.is_encrypted || false, setting.category, setting.key]
          );
        } else {
          await connection.execute(
            'INSERT INTO system_settings (category, `key`, value, description, is_encrypted) VALUES (?, ?, ?, ?, ?)',
            [setting.category, setting.key, setting.value, setting.description, setting.is_encrypted || false]
          );
        }
      }

      await connection.commit();
      return true;
    } catch (error) {
      await connection.rollback();
      console.error('Error guardando configuraciones:', error);
      return false;
    } finally {
      connection.release();
    }
  }

  /**
   * Probar configuración de email
   */
  async testEmailConfiguration(): Promise<ConfigurationTest> {
    try {
      // Reinicializar el servicio de email con la configuración actual
      await emailService.initialize();
      
      // Probar la conexión
      const isConnected = await emailService.testConnection();
      
      if (isConnected) {
        return {
          service: 'email',
          status: 'success',
          message: 'Conexión SMTP exitosa'
        };
      } else {
        return {
          service: 'email',
          status: 'error',
          message: 'Error en la conexión SMTP'
        };
      }
    } catch (error) {
      return {
        service: 'email',
        status: 'error',
        message: 'Error probando configuración de email',
        details: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Probar configuración de Wompi
   */
  async testWompiConfiguration(): Promise<ConfigurationTest> {
    try {
      const { wompiService } = await import('../wompiService');
      return await wompiService.testConnection();
    } catch (error) {
      return {
        service: 'wompi',
        status: 'error',
        message: 'Error probando configuración de Wompi',
        details: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Crear backup de configuraciones
   */
  async createBackup(): Promise<{ success: boolean; filename?: string; error?: string }> {
    try {
      const settings = await this.getAllSettings();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `system_settings_backup_${timestamp}.json`;
      
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0',
        settings
      };

      // En un entorno real, esto se guardaría en un sistema de archivos o almacenamiento en la nube
      // Por ahora, lo guardamos en la base de datos como un registro especial
      await pool.execute(
        'INSERT INTO system_logs (level, message, context) VALUES (?, ?, ?)',
        ['info', 'Backup de configuraciones creado', JSON.stringify({ filename, data: backupData })]
      );

      return {
        success: true,
        filename
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Restaurar configuraciones desde backup
   */
  async restoreBackup(backupData: any): Promise<{ success: boolean; error?: string }> {
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Validar estructura del backup
      if (!backupData.settings || typeof backupData.settings !== 'object') {
        throw new Error('Estructura de backup inválida');
      }

      // Limpiar configuraciones existentes (opcional, dependiendo de la estrategia)
      // await connection.execute('DELETE FROM system_settings');

      // Restaurar configuraciones
      for (const [category, categorySettings] of Object.entries(backupData.settings)) {
        for (const [key, settingData] of Object.entries(categorySettings as Record<string, any>)) {
          await connection.execute(
            `INSERT INTO system_settings (category, \`key\`, value, description, is_encrypted) 
             VALUES (?, ?, ?, ?, ?) 
             ON DUPLICATE KEY UPDATE 
             value = VALUES(value), 
             description = VALUES(description), 
             is_encrypted = VALUES(is_encrypted),
             updated_at = NOW()`,
            [
              category,
              key,
              settingData.value,
              settingData.description,
              settingData.is_encrypted || false
            ]
          );
        }
      }

      await connection.commit();

      // Registrar la restauración
      await pool.execute(
        'INSERT INTO system_logs (level, message, context) VALUES (?, ?, ?)',
        ['info', 'Configuraciones restauradas desde backup', JSON.stringify({ timestamp: backupData.timestamp })]
      );

      return { success: true };
    } catch (error) {
      await connection.rollback();
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    } finally {
      connection.release();
    }
  }

  /**
   * Obtener configuraciones por defecto para una categoría
   */
  getDefaultSettings(category: string): SystemSetting[] {
    const defaults: Record<string, SystemSetting[]> = {
      email: [
        { category: 'email', key: 'smtp_host', value: '', description: 'Servidor SMTP' },
        { category: 'email', key: 'smtp_port', value: '587', description: 'Puerto SMTP' },
        { category: 'email', key: 'smtp_secure', value: 'true', description: 'Usar conexión segura (TLS)' },
        { category: 'email', key: 'smtp_user', value: '', description: 'Usuario SMTP' },
        { category: 'email', key: 'smtp_password', value: '', description: 'Contraseña SMTP', is_encrypted: true },
        { category: 'email', key: 'from_email', value: '', description: 'Email remitente por defecto' },
        { category: 'email', key: 'from_name', value: 'Café Colombia', description: 'Nombre remitente por defecto' }
      ],
      payment: [
        { category: 'payment', key: 'wompi_public_key', value: '', description: 'Clave pública de Wompi' },
        { category: 'payment', key: 'wompi_private_key', value: '', description: 'Clave privada de Wompi', is_encrypted: true },
        { category: 'payment', key: 'wompi_environment', value: 'test', description: 'Entorno de Wompi (test/production)' },
        { category: 'payment', key: 'wompi_webhook_secret', value: '', description: 'Secreto del webhook de Wompi', is_encrypted: true },
        { category: 'payment', key: 'wompi_currency', value: 'COP', description: 'Moneda por defecto' },
        { category: 'payment', key: 'wompi_tax_rate', value: '19', description: 'Tasa de impuesto (%)' }
      ],
      security: [
        { category: 'security', key: 'session_timeout', value: '3600', description: 'Tiempo de expiración de sesión (segundos)' },
        { category: 'security', key: 'max_login_attempts', value: '5', description: 'Máximo intentos de login' },
        { category: 'security', key: 'lockout_duration', value: '900', description: 'Duración de bloqueo (segundos)' },
        { category: 'security', key: 'password_min_length', value: '8', description: 'Longitud mínima de contraseña' }
      ],
      notifications: [
        { category: 'notifications', key: 'email_enabled', value: 'true', description: 'Habilitar notificaciones por email' },
        { category: 'notifications', key: 'sms_enabled', value: 'false', description: 'Habilitar notificaciones por SMS' },
        { category: 'notifications', key: 'push_enabled', value: 'true', description: 'Habilitar notificaciones push' },
        { category: 'notifications', key: 'payment_success_email', value: 'true', description: 'Enviar email en pago exitoso' }
      ]
    };

    return defaults[category] || [];
  }

  /**
   * Resetear configuraciones a valores por defecto
   */
  async resetToDefaults(category: string): Promise<boolean> {
    try {
      const defaultSettings = this.getDefaultSettings(category);
      return await this.saveSettings(defaultSettings);
    } catch (error) {
      console.error('Error reseteando configuraciones:', error);
      return false;
    }
  }
}

export default new SystemConfigService();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';
import { executeQuery, executeTransaction } from '../lib/mysql.js';
import type { 
  AdminUser, 
  AdminLoginRequest, 
  AdminLoginResponse, 
  AdminCreateRequest,
  AdminUpdateRequest,
  AdminPasswordChangeRequest,
  TwoFactorSetupResponse,
  AdminSession
} from '../../shared/types/index.js';

export class AdminAuthService {
  private static readonly SALT_ROUNDS = 12;
  private static readonly MAX_LOGIN_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 30 * 60 * 1000; // 30 minutos

  /**
   * Autenticar administrador
   */
  static async login(loginData: AdminLoginRequest, ipAddress?: string, userAgent?: string): Promise<AdminLoginResponse> {
    try {
      // Buscar administrador por email
      const adminQuery = `
        SELECT * FROM admin_users 
        WHERE email = ? AND is_active = true
      `;
      const [adminRows] = await executeQuery(adminQuery, [loginData.username]);
      
      if (!adminRows || adminRows.length === 0) {
        await this.logFailedLogin(loginData.username, ipAddress, 'User not found');
        return { success: false, message: 'Credenciales inválidas' };
      }

      const admin = adminRows[0] as AdminUser;

      // Verificar si la cuenta está bloqueada
      if (admin.locked_until && new Date() < new Date(admin.locked_until)) {
        return { 
          success: false, 
          message: `Cuenta bloqueada hasta ${new Date(admin.locked_until).toLocaleString()}` 
        };
      }

      // Verificar contraseña
      const isValidPassword = await bcrypt.compare(loginData.password, admin.password_hash);
      if (!isValidPassword) {
        await this.handleFailedLogin(admin.id);
        return { success: false, message: 'Credenciales inválidas' };
      }

      // Verificar 2FA si está habilitado
      if (admin.two_factor_enabled) {
        if (!loginData.two_factor_code) {
          return { 
            success: false, 
            requires_2fa: true, 
            message: 'Código de autenticación de dos factores requerido' 
          };
        }

        const isValid2FA = speakeasy.totp.verify({
          secret: admin.two_factor_secret!,
          encoding: 'base32',
          token: loginData.two_factor_code,
          window: 2
        });

        if (!isValid2FA) {
          await this.handleFailedLogin(admin.id);
          return { success: false, message: 'Código de autenticación inválido' };
        }
      }

      // Resetear intentos fallidos y actualizar último login
      await this.resetFailedAttempts(admin.id);

      // Generar tokens
      const { token, refreshToken } = await this.generateTokens(admin);

      // Crear sesión
      await this.createSession(admin.id, token, refreshToken, ipAddress, userAgent);

      // Preparar respuesta sin datos sensibles
      const { password_hash, two_factor_secret, ...safeAdmin } = admin;

      return {
        success: true,
        token,
        refresh_token: refreshToken,
        admin: safeAdmin
      };

    } catch (error) {
      console.error('Error en login de administrador:', error);
      return { success: false, message: 'Error interno del servidor' };
    }
  }

  /**
   * Refrescar token de acceso
   */
  static async refreshToken(refreshToken: string): Promise<AdminLoginResponse> {
    try {
      // Verificar refresh token
      const decoded = jwt.verify(refreshToken, process.env.ADMIN_JWT_SECRET!) as any;
      
      // Buscar sesión activa
      const sessionQuery = `
        SELECT s.*, a.* FROM admin_sessions s
        JOIN admin_users a ON s.admin_id = a.id
        WHERE s.refresh_token = ? AND s.is_active = true AND s.expires_at > NOW()
      `;
      const [sessionRows] = await executeQuery(sessionQuery, [refreshToken]);

      if (!sessionRows || sessionRows.length === 0) {
        return { success: false, message: 'Sesión inválida o expirada' };
      }

      const admin = sessionRows[0] as AdminUser;

      // Generar permisos usando la misma lógica que en generateTokens
      const allPermissions = [
        'dashboard:view', 'dashboard:analytics', 
        'users:view', 'users:create', 'users:edit', 'users:delete', 'users:export',
        'growers:view', 'growers:create', 'growers:edit', 'growers:delete', 'growers:export',
        'farms:view', 'farms:create', 'farms:edit', 'farms:delete', 'farms:export',
        'plans:view', 'plans:create', 'plans:edit', 'plans:delete',
        'subscriptions:view', 'subscriptions:create', 'subscriptions:edit', 'subscriptions:cancel', 'subscriptions:export',
        'payments:view', 'payments:refund', 'payments:export',
        'reports:view', 'reports:export', 'reports:analytics',
        'audit:view', 'audit:export',
        'security:view', 'security:manage', 'security:roles',
        'settings:view', 'settings:edit', 'settings:system'
      ];
      
      let permissions: string[];
      if (admin.is_super_admin) {
        permissions = ['*', ...allPermissions];
      } else {
        permissions = [
          'dashboard:view', 'dashboard:analytics',
          'users:view', 'users:create', 'users:edit', 'users:export',
          'growers:view', 'growers:create', 'growers:edit', 'growers:export',
          'farms:view', 'farms:create', 'farms:edit', 'farms:export',
          'plans:view', 'plans:create', 'plans:edit',
          'subscriptions:view', 'subscriptions:create', 'subscriptions:edit', 'subscriptions:export',
          'payments:view', 'payments:export',
          'reports:view', 'reports:export',
          'settings:view'
        ];
      }

      const newToken = jwt.sign(
        { 
          id: admin.id, 
          email: admin.email, 
          permissions: permissions 
        },
        process.env.ADMIN_JWT_SECRET!,
        { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '15m' }
      );

      // Actualizar token en la sesión
      await executeQuery(
        'UPDATE admin_sessions SET token = ?, updated_at = NOW() WHERE refresh_token = ?',
        [newToken, refreshToken]
      );

      const { password_hash, two_factor_secret, ...safeAdmin } = admin;

      return {
        success: true,
        token: newToken,
        refresh_token: refreshToken,
        admin: safeAdmin
      };

    } catch (error) {
      console.error('Error al refrescar token:', error);
      return { success: false, message: 'Token inválido' };
    }
  }

  /**
   * Cerrar sesión
   */
  static async logout(token: string): Promise<{ success: boolean; message: string }> {
    try {
      await executeQuery(
        'UPDATE admin_sessions SET is_active = false, updated_at = NOW() WHERE token = ?',
        [token]
      );

      return { success: true, message: 'Sesión cerrada correctamente' };
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      return { success: false, message: 'Error al cerrar sesión' };
    }
  }

  /**
   * Configurar autenticación de dos factores
   */
  static async setup2FA(adminId: number): Promise<TwoFactorSetupResponse> {
    try {
      // Generar secreto
      const secret = speakeasy.generateSecret({
        name: `Café Colombia Admin (${adminId})`,
        issuer: 'Café Colombia'
      });

      // Generar QR code
      const qrCode = await QRCode.toDataURL(secret.otpauth_url!);

      // Generar códigos de respaldo
      const backupCodes = Array.from({ length: 8 }, () => 
        Math.random().toString(36).substring(2, 10).toUpperCase()
      );

      // Guardar secreto temporal (se activará cuando se verifique)
      await executeQuery(
        'UPDATE admin_users SET two_factor_secret = ? WHERE id = ?',
        [secret.base32, adminId]
      );

      return {
        secret: secret.base32!,
        qr_code: qrCode,
        backup_codes: backupCodes
      };

    } catch (error) {
      console.error('Error al configurar 2FA:', error);
      throw new Error('Error al configurar autenticación de dos factores');
    }
  }

  /**
   * Verificar y activar 2FA
   */
  static async verify2FA(adminId: number, token: string): Promise<{ success: boolean; message: string }> {
    try {
      // Obtener secreto temporal
      const adminQuery = 'SELECT two_factor_secret FROM admin_users WHERE id = ?';
      const [adminRows] = await executeQuery(adminQuery, [adminId]);

      if (!adminRows || adminRows.length === 0) {
        return { success: false, message: 'Administrador no encontrado' };
      }

      const admin = adminRows[0] as AdminUser;

      // Verificar token
      const isValid = speakeasy.totp.verify({
        secret: admin.two_factor_secret!,
        encoding: 'base32',
        token,
        window: 2
      });

      if (!isValid) {
        return { success: false, message: 'Código de verificación inválido' };
      }

      // Activar 2FA
      await executeQuery(
        'UPDATE admin_users SET two_factor_enabled = true WHERE id = ?',
        [adminId]
      );

      return { success: true, message: 'Autenticación de dos factores activada correctamente' };

    } catch (error) {
      console.error('Error al verificar 2FA:', error);
      return { success: false, message: 'Error al verificar código' };
    }
  }

  /**
   * Desactivar 2FA
   */
  static async disable2FA(adminId: number, password: string): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar contraseña actual
      const adminQuery = 'SELECT password_hash FROM admin_users WHERE id = ?';
      const [adminRows] = await executeQuery(adminQuery, [adminId]);

      if (!adminRows || adminRows.length === 0) {
        return { success: false, message: 'Administrador no encontrado' };
      }

      const admin = adminRows[0] as AdminUser;
      const isValidPassword = await bcrypt.compare(password, admin.password_hash);

      if (!isValidPassword) {
        return { success: false, message: 'Contraseña incorrecta' };
      }

      // Desactivar 2FA
      await executeQuery(
        'UPDATE admin_users SET two_factor_enabled = false, two_factor_secret = NULL WHERE id = ?',
        [adminId]
      );

      return { success: true, message: 'Autenticación de dos factores desactivada' };

    } catch (error) {
      console.error('Error al desactivar 2FA:', error);
      return { success: false, message: 'Error al desactivar 2FA' };
    }
  }

  /**
   * Cambiar contraseña
   */
  static async changePassword(adminId: number, passwordData: AdminPasswordChangeRequest): Promise<{ success: boolean; message: string }> {
    try {
      if (passwordData.new_password !== passwordData.confirm_password) {
        return { success: false, message: 'Las contraseñas no coinciden' };
      }

      // Verificar contraseña actual
      const adminQuery = 'SELECT password_hash FROM admin_users WHERE id = ?';
      const [adminRows] = await executeQuery(adminQuery, [adminId]);

      if (!adminRows || adminRows.length === 0) {
        return { success: false, message: 'Administrador no encontrado' };
      }

      const admin = adminRows[0] as AdminUser;
      const isValidPassword = await bcrypt.compare(passwordData.current_password, admin.password_hash);

      if (!isValidPassword) {
        return { success: false, message: 'Contraseña actual incorrecta' };
      }

      // Hashear nueva contraseña
      const hashedPassword = await bcrypt.hash(passwordData.new_password, this.SALT_ROUNDS);

      // Actualizar contraseña
      await executeQuery(
        'UPDATE admin_users SET password_hash = ?, updated_at = NOW() WHERE id = ?',
        [hashedPassword, adminId]
      );

      // Invalidar todas las sesiones activas
      await executeQuery(
        'UPDATE admin_sessions SET is_active = false WHERE admin_id = ?',
        [adminId]
      );

      return { success: true, message: 'Contraseña actualizada correctamente' };

    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      return { success: false, message: 'Error al cambiar contraseña' };
    }
  }

  /**
   * Generar tokens JWT
   */
  private static async generateTokens(admin: AdminUser): Promise<{ token: string; refreshToken: string }> {
    // Generar permisos basados en el tipo de administrador
    console.log('Admin data for token generation:', {
      id: admin.id,
      email: admin.email,
      is_super_admin: admin.is_super_admin,
      type: typeof admin.is_super_admin
    });
    
    // Definir todos los permisos disponibles
    const allPermissions = [
      'dashboard:view', 'dashboard:analytics', 
      'users:view', 'users:create', 'users:edit', 'users:delete', 'users:export',
      'growers:view', 'growers:create', 'growers:edit', 'growers:delete', 'growers:export',
      'farms:view', 'farms:create', 'farms:edit', 'farms:delete', 'farms:export',
      'plans:view', 'plans:create', 'plans:edit', 'plans:delete',
      'subscriptions:view', 'subscriptions:create', 'subscriptions:edit', 'subscriptions:cancel', 'subscriptions:export',
      'payments:view', 'payments:refund', 'payments:export',
      'reports:view', 'reports:export', 'reports:analytics',
      'audit:view', 'audit:export',
      'security:view', 'security:manage', 'security:roles',
      'settings:view', 'settings:edit', 'settings:system'
    ];
    
    // Asignar permisos basados en el rol
    let permissions: string[];
    if (admin.is_super_admin) {
      // Super admin tiene todos los permisos
      permissions = ['*', ...allPermissions];
    } else {
      // Admin regular tiene permisos limitados
      permissions = [
        'dashboard:view', 'dashboard:analytics',
        'users:view', 'users:create', 'users:edit', 'users:export',
        'growers:view', 'growers:create', 'growers:edit', 'growers:export',
        'farms:view', 'farms:create', 'farms:edit', 'farms:export',
        'plans:view', 'plans:create', 'plans:edit',
        'subscriptions:view', 'subscriptions:create', 'subscriptions:edit', 'subscriptions:export',
        'payments:view', 'payments:export',
        'reports:view', 'reports:export',
        'settings:view'
      ];
    }
    
    console.log('Generated permissions:', permissions);
    
    const payload = {
      id: admin.id,
      email: admin.email,
      permissions: permissions
    };

    const token = jwt.sign(payload, process.env.ADMIN_JWT_SECRET!, {
      expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '15m'
    });

    const refreshToken = jwt.sign(payload, process.env.ADMIN_JWT_SECRET!, {
      expiresIn: process.env.ADMIN_REFRESH_TOKEN_EXPIRES_IN || '7d'
    });

    return { token, refreshToken };
  }

  /**
   * Crear sesión de administrador
   */
  private static async createSession(
    adminId: number, 
    token: string, 
    refreshToken: string, 
    ipAddress?: string, 
    userAgent?: string
  ): Promise<void> {
    const sessionId = uuidv4();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 días

    await executeQuery(`
      INSERT INTO admin_sessions (id, admin_id, token, refresh_token, expires_at, ip_address, user_agent, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?, true)
    `, [sessionId, adminId, token, refreshToken, expiresAt, ipAddress, userAgent]);
  }

  /**
   * Manejar intento de login fallido
   */
  private static async handleFailedLogin(adminId: number): Promise<void> {
    const updateQuery = `
      UPDATE admin_users 
      SET failed_login_attempts = failed_login_attempts + 1,
          locked_until = CASE 
            WHEN failed_login_attempts + 1 >= ? THEN DATE_ADD(NOW(), INTERVAL ? MICROSECOND)
            ELSE locked_until 
          END
      WHERE id = ?
    `;
    
    await executeQuery(updateQuery, [this.MAX_LOGIN_ATTEMPTS, this.LOCKOUT_DURATION * 1000, adminId]);
  }

  /**
   * Resetear intentos fallidos
   */
  private static async resetFailedAttempts(adminId: number): Promise<void> {
    await executeQuery(`
      UPDATE admin_users 
      SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
      WHERE id = ?
    `, [adminId]);
  }

  /**
   * Registrar intento de login fallido
   */
  private static async logFailedLogin(username: string, ipAddress?: string, reason?: string): Promise<void> {
    // Aquí se podría registrar en audit_logs
    console.log(`Failed login attempt for ${username} from ${ipAddress}: ${reason}`);
  }
}
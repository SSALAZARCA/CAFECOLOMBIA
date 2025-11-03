import express from 'express';
import bcrypt from 'bcryptjs';
import { executeQuery, executeTransaction } from '../config/database.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Obtener configuración de seguridad
router.get('/config', requirePermission('security.view'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const [securitySettings] = await executeQuery(`
      SELECT 
        setting_key,
        setting_value,
        description,
        data_type
      FROM system_settings 
      WHERE category = 'security'
      ORDER BY setting_key
    `);

    // Parsear configuraciones de seguridad
    const config = (securitySettings as any[]).reduce((acc, setting) => {
      let parsedValue = setting.setting_value;
      try {
        switch (setting.data_type) {
          case 'json':
            parsedValue = JSON.parse(setting.setting_value);
            break;
          case 'boolean':
            parsedValue = setting.setting_value === 'true';
            break;
          case 'number':
            parsedValue = parseFloat(setting.setting_value);
            break;
          case 'integer':
            parsedValue = parseInt(setting.setting_value);
            break;
          default:
            parsedValue = setting.setting_value;
        }
      } catch (e) {
        parsedValue = setting.setting_value;
      }

      acc[setting.setting_key] = {
        value: parsedValue,
        description: setting.description
      };
      return acc;
    }, {});

    res.json({
      securityConfig: config
    });

  } catch (error) {
    console.error('Error obteniendo configuración de seguridad:', error);
    throw createError('Error obteniendo configuración de seguridad', 500);
  }
}));

// Actualizar configuración de seguridad
router.put('/config', requirePermission('security.manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { settings } = req.body;

  if (!settings || typeof settings !== 'object') {
    throw createError('Configuraciones de seguridad son requeridas', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      const updatedSettings = [];

      for (const [key, value] of Object.entries(settings)) {
        // Verificar que la configuración existe y es de categoría security
        const [existingSetting] = await connection.execute(`
          SELECT id, setting_value, data_type FROM system_settings 
          WHERE setting_key = ? AND category = 'security'
        `, [key]) as any[];

        if (!existingSetting || existingSetting.length === 0) {
          continue; // Saltar configuraciones que no existen
        }

        const setting = existingSetting[0];
        const previousValue = setting.setting_value;

        // Convertir valor según el tipo de dato
        let stringValue = value;
        if (typeof value === 'object') {
          stringValue = JSON.stringify(value);
        } else if (typeof value === 'boolean') {
          stringValue = value.toString();
        } else if (typeof value === 'number') {
          stringValue = value.toString();
        } else {
          stringValue = String(value);
        }

        // Actualizar configuración
        await connection.execute(`
          UPDATE system_settings 
          SET setting_value = ?, updated_at = NOW(), updated_by = ?
          WHERE setting_key = ? AND category = 'security'
        `, [stringValue, req.user!.id, key]);

        updatedSettings.push({
          key,
          previousValue,
          newValue: stringValue
        });
      }

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'update', 'security_config', NULL, ?, ?)
      `, [
        req.user!.id,
        JSON.stringify({ updatedSettings }),
        req.ip
      ]);
    });

    res.json({
      message: 'Configuración de seguridad actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando configuración de seguridad:', error);
    throw createError('Error actualizando configuración de seguridad', 500);
  }
}));

// Obtener usuarios bloqueados
router.get('/blocked-users', requirePermission('security.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    // Obtener usuarios con intentos de login fallidos
    const [blockedUsers] = await executeQuery(`
      SELECT 
        au.id,
        au.email,
        au.first_name,
        au.last_name,
        au.failed_login_attempts,
        au.locked_until,
        au.last_login_attempt,
        au.is_active,
        COUNT(se.id) as security_events_count
      FROM admin_users au
      LEFT JOIN security_events se ON au.id = se.user_id 
        AND se.event_type IN ('failed_login', 'account_locked')
        AND se.created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      WHERE au.failed_login_attempts > 0 
        OR au.locked_until > NOW()
        OR au.is_active = false
      GROUP BY au.id
      ORDER BY au.failed_login_attempts DESC, au.last_login_attempt DESC
      LIMIT ? OFFSET ?
    `, [Number(limit), offset]);

    // Obtener total para paginación
    const [countResult] = await executeQuery(`
      SELECT COUNT(DISTINCT au.id) as total
      FROM admin_users au
      WHERE au.failed_login_attempts > 0 
        OR au.locked_until > NOW()
        OR au.is_active = false
    `) as any[];

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      blockedUsers,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo usuarios bloqueados:', error);
    throw createError('Error obteniendo usuarios bloqueados', 500);
  }
}));

// Desbloquear usuario
router.post('/unblock-user/:userId', requirePermission('security.manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.params;
  const { reason } = req.body;

  try {
    await executeTransaction(async (connection) => {
      // Verificar que el usuario existe
      const [userResult] = await connection.execute(
        'SELECT id, email, failed_login_attempts, locked_until FROM admin_users WHERE id = ?',
        [userId]
      ) as any[];

      if (!userResult || userResult.length === 0) {
        throw createError('Usuario no encontrado', 404);
      }

      const user = userResult[0];

      // Desbloquear usuario
      await connection.execute(`
        UPDATE admin_users 
        SET failed_login_attempts = 0, locked_until = NULL, is_active = true
        WHERE id = ?
      `, [userId]);

      // Crear evento de seguridad
      await connection.execute(`
        INSERT INTO security_events (
          user_id, event_type, severity, description, ip_address, 
          user_agent, additional_data, created_at
        ) VALUES (?, 'account_unlocked', 'medium', ?, ?, ?, ?, NOW())
      `, [
        userId,
        `Usuario desbloqueado por administrador: ${req.user!.email}`,
        req.ip,
        req.get('User-Agent') || 'Unknown',
        JSON.stringify({ 
          unlockedBy: req.user!.id,
          reason: reason || 'No especificado',
          previousFailedAttempts: user.failed_login_attempts,
          wasLockedUntil: user.locked_until
        })
      ]);

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'unlock', 'admin_user', ?, ?, ?)
      `, [
        req.user!.id,
        userId,
        JSON.stringify({ 
          targetUser: user.email,
          reason: reason || 'No especificado',
          previousFailedAttempts: user.failed_login_attempts
        }),
        req.ip
      ]);
    });

    res.json({
      message: 'Usuario desbloqueado exitosamente'
    });

  } catch (error) {
    console.error('Error desbloqueando usuario:', error);
    throw createError('Error desbloqueando usuario', 500);
  }
}));

// Obtener IPs sospechosas
router.get('/suspicious-ips', requirePermission('security.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20, hours = 24 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    const [suspiciousIPs] = await executeQuery(`
      SELECT 
        ip_address,
        COUNT(*) as total_events,
        COUNT(CASE WHEN event_type = 'failed_login' THEN 1 END) as failed_logins,
        COUNT(CASE WHEN event_type = 'suspicious_activity' THEN 1 END) as suspicious_activities,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_severity_events,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_events,
        MIN(created_at) as first_event,
        MAX(created_at) as last_event,
        COUNT(DISTINCT user_id) as affected_users
      FROM security_events 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        AND ip_address IS NOT NULL
      GROUP BY ip_address
      HAVING total_events >= 5 OR failed_logins >= 3 OR critical_events > 0
      ORDER BY critical_events DESC, high_severity_events DESC, total_events DESC
      LIMIT ? OFFSET ?
    `, [Number(hours), Number(limit), offset]);

    // Obtener total para paginación
    const [countResult] = await executeQuery(`
      SELECT COUNT(DISTINCT ip_address) as total
      FROM security_events 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
        AND ip_address IS NOT NULL
      GROUP BY ip_address
      HAVING COUNT(*) >= 5 OR COUNT(CASE WHEN event_type = 'failed_login' THEN 1 END) >= 3 
        OR COUNT(CASE WHEN severity = 'critical' THEN 1 END) > 0
    `, [Number(hours)]) as any[];

    const total = (countResult as any[]).length;
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      suspiciousIPs,
      timeRange: `${hours} horas`,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo IPs sospechosas:', error);
    throw createError('Error obteniendo IPs sospechosas', 500);
  }
}));

// Bloquear IP
router.post('/block-ip', requirePermission('security.manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { ipAddress, reason, duration = 24 } = req.body;

  if (!ipAddress) {
    throw createError('Dirección IP es requerida', 400);
  }

  // Validar formato de IP (básico)
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  if (!ipRegex.test(ipAddress)) {
    throw createError('Formato de dirección IP inválido', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      // Verificar si la IP ya está bloqueada
      const [existingBlock] = await connection.execute(
        'SELECT id FROM blocked_ips WHERE ip_address = ? AND (expires_at IS NULL OR expires_at > NOW())',
        [ipAddress]
      ) as any[];

      if (existingBlock && existingBlock.length > 0) {
        throw createError('Esta IP ya está bloqueada', 409);
      }

      const expiresAt = duration > 0 ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;

      // Bloquear IP
      const [result] = await connection.execute(`
        INSERT INTO blocked_ips (ip_address, reason, blocked_by, blocked_at, expires_at)
        VALUES (?, ?, ?, NOW(), ?)
      `, [ipAddress, reason || 'Actividad sospechosa', req.user!.id, expiresAt]) as any[];

      const blockId = result.insertId;

      // Crear evento de seguridad
      await connection.execute(`
        INSERT INTO security_events (
          event_type, severity, description, ip_address, 
          user_agent, additional_data, created_at
        ) VALUES ('ip_blocked', 'high', ?, ?, ?, ?, NOW())
      `, [
        `IP bloqueada por administrador: ${req.user!.email}`,
        ipAddress,
        req.get('User-Agent') || 'Unknown',
        JSON.stringify({ 
          blockedBy: req.user!.id,
          reason: reason || 'Actividad sospechosa',
          duration: duration,
          expiresAt: expiresAt?.toISOString()
        })
      ]);

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'block', 'ip_address', ?, ?, ?)
      `, [
        req.user!.id,
        blockId,
        JSON.stringify({ 
          blockedIP: ipAddress,
          reason: reason || 'Actividad sospechosa',
          duration: duration
        }),
        req.ip
      ]);
    });

    res.json({
      message: 'IP bloqueada exitosamente',
      ipAddress,
      duration: duration > 0 ? `${duration} horas` : 'Permanente'
    });

  } catch (error) {
    console.error('Error bloqueando IP:', error);
    throw createError('Error bloqueando IP', 500);
  }
}));

// Obtener IPs bloqueadas
router.get('/blocked-ips', requirePermission('security.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { page = 1, limit = 20, includeExpired = false } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  try {
    let whereCondition = '1=1';
    if (!includeExpired) {
      whereCondition = '(bi.expires_at IS NULL OR bi.expires_at > NOW())';
    }

    const [blockedIPs] = await executeQuery(`
      SELECT 
        bi.id,
        bi.ip_address,
        bi.reason,
        bi.blocked_at,
        bi.expires_at,
        au.first_name as blocked_by_name,
        au.last_name as blocked_by_lastname,
        au.email as blocked_by_email,
        CASE 
          WHEN bi.expires_at IS NULL THEN 'Permanente'
          WHEN bi.expires_at > NOW() THEN 'Activo'
          ELSE 'Expirado'
        END as status
      FROM blocked_ips bi
      LEFT JOIN admin_users au ON bi.blocked_by = au.id
      WHERE ${whereCondition}
      ORDER BY bi.blocked_at DESC
      LIMIT ? OFFSET ?
    `, [Number(limit), offset]);

    // Obtener total para paginación
    const [countResult] = await executeQuery(`
      SELECT COUNT(*) as total
      FROM blocked_ips bi
      WHERE ${whereCondition}
    `) as any[];

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      blockedIPs,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo IPs bloqueadas:', error);
    throw createError('Error obteniendo IPs bloqueadas', 500);
  }
}));

// Desbloquear IP
router.delete('/blocked-ips/:blockId', requirePermission('security.manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { blockId } = req.params;
  const { reason } = req.body;

  try {
    await executeTransaction(async (connection) => {
      // Verificar que el bloqueo existe
      const [blockResult] = await connection.execute(
        'SELECT id, ip_address FROM blocked_ips WHERE id = ?',
        [blockId]
      ) as any[];

      if (!blockResult || blockResult.length === 0) {
        throw createError('Bloqueo de IP no encontrado', 404);
      }

      const block = blockResult[0];

      // Eliminar bloqueo
      await connection.execute(
        'DELETE FROM blocked_ips WHERE id = ?',
        [blockId]
      );

      // Crear evento de seguridad
      await connection.execute(`
        INSERT INTO security_events (
          event_type, severity, description, ip_address, 
          user_agent, additional_data, created_at
        ) VALUES ('ip_unblocked', 'medium', ?, ?, ?, ?, NOW())
      `, [
        `IP desbloqueada por administrador: ${req.user!.email}`,
        block.ip_address,
        req.get('User-Agent') || 'Unknown',
        JSON.stringify({ 
          unblockedBy: req.user!.id,
          reason: reason || 'No especificado'
        })
      ]);

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'unblock', 'ip_address', ?, ?, ?)
      `, [
        req.user!.id,
        blockId,
        JSON.stringify({ 
          unblockedIP: block.ip_address,
          reason: reason || 'No especificado'
        }),
        req.ip
      ]);
    });

    res.json({
      message: 'IP desbloqueada exitosamente'
    });

  } catch (error) {
    console.error('Error desbloqueando IP:', error);
    throw createError('Error desbloqueando IP', 500);
  }
}));

// Cambiar contraseña de usuario
router.post('/change-password/:userId', requirePermission('security.manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { userId } = req.params;
  const { newPassword, forcePasswordChange = true } = req.body;

  if (!newPassword || newPassword.length < 8) {
    throw createError('La nueva contraseña debe tener al menos 8 caracteres', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      // Verificar que el usuario existe
      const [userResult] = await connection.execute(
        'SELECT id, email FROM admin_users WHERE id = ?',
        [userId]
      ) as any[];

      if (!userResult || userResult.length === 0) {
        throw createError('Usuario no encontrado', 404);
      }

      const user = userResult[0];

      // Hash de la nueva contraseña
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      // Actualizar contraseña
      await connection.execute(`
        UPDATE admin_users 
        SET password_hash = ?, password_changed_at = NOW(), must_change_password = ?
        WHERE id = ?
      `, [hashedPassword, forcePasswordChange, userId]);

      // Crear evento de seguridad
      await connection.execute(`
        INSERT INTO security_events (
          user_id, event_type, severity, description, ip_address, 
          user_agent, additional_data, created_at
        ) VALUES (?, 'password_reset', 'medium', ?, ?, ?, ?, NOW())
      `, [
        userId,
        `Contraseña cambiada por administrador: ${req.user!.email}`,
        req.ip,
        req.get('User-Agent') || 'Unknown',
        JSON.stringify({ 
          changedBy: req.user!.id,
          forcePasswordChange
        })
      ]);

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'password_reset', 'admin_user', ?, ?, ?)
      `, [
        req.user!.id,
        userId,
        JSON.stringify({ 
          targetUser: user.email,
          forcePasswordChange
        }),
        req.ip
      ]);
    });

    res.json({
      message: 'Contraseña cambiada exitosamente',
      forcePasswordChange
    });

  } catch (error) {
    console.error('Error cambiando contraseña:', error);
    throw createError('Error cambiando contraseña', 500);
  }
}));

// Obtener estadísticas de seguridad
router.get('/stats', requirePermission('security.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { period = '24h' } = req.query;

  let hours = 24;
  switch (period) {
    case '1h': hours = 1; break;
    case '6h': hours = 6; break;
    case '24h': hours = 24; break;
    case '7d': hours = 168; break;
    case '30d': hours = 720; break;
    default: hours = 24;
  }

  try {
    // Estadísticas de eventos de seguridad
    const [securityStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_events,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_events,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_events,
        COUNT(CASE WHEN event_type = 'failed_login' THEN 1 END) as failed_logins,
        COUNT(CASE WHEN event_type = 'suspicious_activity' THEN 1 END) as suspicious_activities,
        COUNT(DISTINCT ip_address) as unique_ips,
        COUNT(DISTINCT user_id) as affected_users
      FROM security_events 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
    `, [hours]) as any[];

    // Usuarios bloqueados
    const [blockedUsersStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_blocked,
        COUNT(CASE WHEN locked_until > NOW() THEN 1 END) as currently_locked,
        COUNT(CASE WHEN failed_login_attempts >= 3 THEN 1 END) as high_failed_attempts
      FROM admin_users 
      WHERE failed_login_attempts > 0 OR locked_until IS NOT NULL
    `) as any[];

    // IPs bloqueadas
    const [blockedIPsStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_blocked,
        COUNT(CASE WHEN expires_at IS NULL OR expires_at > NOW() THEN 1 END) as currently_active
      FROM blocked_ips
    `) as any[];

    // Tendencias por hora
    const [hourlyTrends] = await executeQuery(`
      SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as events,
        COUNT(CASE WHEN severity IN ('critical', 'high') THEN 1 END) as high_severity_events
      FROM security_events 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? HOUR)
      GROUP BY HOUR(created_at)
      ORDER BY hour
    `, [Math.min(hours, 24)]);

    res.json({
      period: `${hours} horas`,
      securityEvents: securityStats[0],
      blockedUsers: blockedUsersStats[0],
      blockedIPs: blockedIPsStats[0],
      hourlyTrends
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de seguridad:', error);
    throw createError('Error obteniendo estadísticas de seguridad', 500);
  }
}));

export default router;
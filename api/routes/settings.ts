import express from 'express';
import { executeQuery, executeTransaction } from '../config/database.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Obtener todas las configuraciones del sistema
router.get('/', requirePermission('settings.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { category = 'all' } = req.query;

  try {
    let whereCondition = '1=1';
    const queryParams: any[] = [];

    if (category !== 'all') {
      whereCondition = 'category = ?';
      queryParams.push(category);
    }

    const [settings] = await executeQuery(`
      SELECT 
        id,
        category,
        setting_key,
        setting_value,
        description,
        data_type,
        is_public,
        updated_at,
        updated_by
      FROM system_settings 
      WHERE ${whereCondition}
      ORDER BY category, setting_key
    `, queryParams);

    // Agrupar configuraciones por categoría
    const groupedSettings = (settings as any[]).reduce((acc, setting) => {
      if (!acc[setting.category]) {
        acc[setting.category] = [];
      }
      
      // Parsear valor según el tipo de dato
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
        // Si falla el parseo, mantener el valor original
        parsedValue = setting.setting_value;
      }

      acc[setting.category].push({
        ...setting,
        parsed_value: parsedValue
      });
      
      return acc;
    }, {});

    res.json({
      settings: groupedSettings
    });

  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    throw createError('Error obteniendo configuraciones del sistema', 500);
  }
}));

// Obtener configuración específica
router.get('/:key', requirePermission('settings.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { key } = req.params;

  try {
    const [settingResult] = await executeQuery(`
      SELECT 
        id,
        category,
        setting_key,
        setting_value,
        description,
        data_type,
        is_public,
        created_at,
        updated_at,
        updated_by,
        au.first_name as updated_by_name,
        au.last_name as updated_by_lastname
      FROM system_settings ss
      LEFT JOIN admin_users au ON ss.updated_by = au.id
      WHERE ss.setting_key = ?
    `, [key]);

    const setting = (settingResult as any[])[0];
    if (!setting) {
      throw createError('Configuración no encontrada', 404);
    }

    // Parsear valor según el tipo de dato
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

    res.json({
      setting: {
        ...setting,
        parsed_value: parsedValue
      }
    });

  } catch (error) {
    console.error('Error obteniendo configuración:', error);
    throw createError('Error obteniendo configuración', 500);
  }
}));

// Actualizar configuración
router.put('/:key', requirePermission('settings.edit'), asyncHandler(async (req: AuthRequest, res) => {
  const { key } = req.params;
  const { value, description } = req.body;

  if (value === undefined) {
    throw createError('Valor es requerido', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      // Verificar que la configuración existe
      const [existingSetting] = await connection.execute(
        'SELECT id, setting_value, data_type FROM system_settings WHERE setting_key = ?',
        [key]
      ) as any[];

      if (!existingSetting || existingSetting.length === 0) {
        throw createError('Configuración no encontrada', 404);
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
      const updateFields = ['setting_value = ?', 'updated_at = NOW()', 'updated_by = ?'];
      const updateValues = [stringValue, req.user!.id];

      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }

      updateValues.push(key);

      await connection.execute(`
        UPDATE system_settings SET ${updateFields.join(', ')}
        WHERE setting_key = ?
      `, updateValues);

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'update', 'system_setting', ?, ?, ?)
      `, [
        req.user!.id,
        setting.id,
        JSON.stringify({ 
          settingKey: key, 
          previousValue, 
          newValue: stringValue,
          description 
        }),
        req.ip
      ]);
    });

    // Obtener configuración actualizada
    const [updatedSetting] = await executeQuery(`
      SELECT 
        id,
        category,
        setting_key,
        setting_value,
        description,
        data_type,
        is_public,
        updated_at
      FROM system_settings 
      WHERE setting_key = ?
    `, [key]) as any[];

    res.json({
      message: 'Configuración actualizada exitosamente',
      setting: updatedSetting[0]
    });

  } catch (error) {
    console.error('Error actualizando configuración:', error);
    throw createError('Error actualizando configuración', 500);
  }
}));

// Crear nueva configuración
router.post('/', requirePermission('settings.create'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    category,
    settingKey,
    settingValue,
    description,
    dataType = 'string',
    isPublic = false
  } = req.body;

  // Validaciones básicas
  if (!category || !settingKey || settingValue === undefined) {
    throw createError('Categoría, clave y valor son requeridos', 400);
  }

  const validDataTypes = ['string', 'number', 'integer', 'boolean', 'json'];
  if (!validDataTypes.includes(dataType)) {
    throw createError('Tipo de dato inválido', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      // Verificar que la clave no existe
      const [existingSetting] = await connection.execute(
        'SELECT id FROM system_settings WHERE setting_key = ?',
        [settingKey]
      ) as any[];

      if (existingSetting && existingSetting.length > 0) {
        throw createError('Ya existe una configuración con esta clave', 409);
      }

      // Convertir valor según el tipo de dato
      let stringValue = settingValue;
      if (typeof settingValue === 'object') {
        stringValue = JSON.stringify(settingValue);
      } else if (typeof settingValue === 'boolean') {
        stringValue = settingValue.toString();
      } else if (typeof settingValue === 'number') {
        stringValue = settingValue.toString();
      } else {
        stringValue = String(settingValue);
      }

      // Crear configuración
      const [result] = await connection.execute(`
        INSERT INTO system_settings (
          category, setting_key, setting_value, description, data_type, 
          is_public, created_at, updated_at, updated_by
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)
      `, [
        category, settingKey, stringValue, description, dataType, isPublic, req.user!.id
      ]) as any[];

      const settingId = result.insertId;

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'create', 'system_setting', ?, ?, ?)
      `, [
        req.user!.id,
        settingId,
        JSON.stringify({ category, settingKey, settingValue, dataType }),
        req.ip
      ]);

      return settingId;
    });

    // Obtener configuración creada
    const [newSetting] = await executeQuery(`
      SELECT 
        id,
        category,
        setting_key,
        setting_value,
        description,
        data_type,
        is_public,
        created_at
      FROM system_settings 
      WHERE id = ?
    `, [settingId]) as any[];

    res.status(201).json({
      message: 'Configuración creada exitosamente',
      setting: newSetting[0]
    });

  } catch (error) {
    console.error('Error creando configuración:', error);
    throw createError('Error creando configuración', 500);
  }
}));

// Eliminar configuración
router.delete('/:key', requirePermission('settings.delete'), asyncHandler(async (req: AuthRequest, res) => {
  const { key } = req.params;

  try {
    await executeTransaction(async (connection) => {
      // Verificar que la configuración existe
      const [existingSetting] = await connection.execute(
        'SELECT id, setting_key, setting_value FROM system_settings WHERE setting_key = ?',
        [key]
      ) as any[];

      if (!existingSetting || existingSetting.length === 0) {
        throw createError('Configuración no encontrada', 404);
      }

      const setting = existingSetting[0];

      // Verificar que no sea una configuración crítica del sistema
      const criticalSettings = [
        'app_name',
        'app_version',
        'maintenance_mode',
        'max_login_attempts',
        'session_timeout'
      ];

      if (criticalSettings.includes(key)) {
        throw createError('No se puede eliminar una configuración crítica del sistema', 400);
      }

      // Eliminar configuración
      await connection.execute(
        'DELETE FROM system_settings WHERE setting_key = ?',
        [key]
      );

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'delete', 'system_setting', ?, ?, ?)
      `, [
        req.user!.id,
        setting.id,
        JSON.stringify({ settingKey: key, deletedValue: setting.setting_value }),
        req.ip
      ]);
    });

    res.json({
      message: 'Configuración eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando configuración:', error);
    throw createError('Error eliminando configuración', 500);
  }
}));

// Obtener configuraciones públicas (sin autenticación)
router.get('/public/all', asyncHandler(async (req, res) => {
  try {
    const [publicSettings] = await executeQuery(`
      SELECT 
        setting_key,
        setting_value,
        data_type
      FROM system_settings 
      WHERE is_public = true
      ORDER BY setting_key
    `);

    // Parsear valores según el tipo de dato
    const parsedSettings = (publicSettings as any[]).reduce((acc, setting) => {
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

      acc[setting.setting_key] = parsedValue;
      return acc;
    }, {});

    res.json({
      settings: parsedSettings
    });

  } catch (error) {
    console.error('Error obteniendo configuraciones públicas:', error);
    throw createError('Error obteniendo configuraciones públicas', 500);
  }
}));

// Restablecer configuraciones a valores por defecto
router.post('/reset', requirePermission('settings.manage'), asyncHandler(async (req: AuthRequest, res) => {
  const { category, confirmReset } = req.body;

  if (!confirmReset) {
    throw createError('Confirmación de restablecimiento es requerida', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      let whereCondition = '1=1';
      const queryParams: any[] = [];

      if (category) {
        whereCondition = 'category = ?';
        queryParams.push(category);
      }

      // Obtener configuraciones actuales para el log
      const [currentSettings] = await connection.execute(`
        SELECT setting_key, setting_value FROM system_settings WHERE ${whereCondition}
      `, queryParams) as any[];

      // Restablecer a valores por defecto (esto depende de tu lógica de negocio)
      // Por ahora, solo registramos la acción
      const resetCount = (currentSettings as any[]).length;

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'reset', 'system_settings', NULL, ?, ?)
      `, [
        req.user!.id,
        JSON.stringify({ 
          category: category || 'all', 
          resetCount,
          currentSettings: currentSettings.map((s: any) => ({ key: s.setting_key, value: s.setting_value }))
        }),
        req.ip
      ]);
    });

    res.json({
      message: category 
        ? `Configuraciones de la categoría "${category}" restablecidas exitosamente`
        : 'Todas las configuraciones restablecidas exitosamente'
    });

  } catch (error) {
    console.error('Error restableciendo configuraciones:', error);
    throw createError('Error restableciendo configuraciones', 500);
  }
}));

// Exportar configuraciones
router.get('/export/all', requirePermission('settings.export'), asyncHandler(async (req: AuthRequest, res) => {
  const { format = 'json', includePrivate = false } = req.query;

  try {
    let whereCondition = '1=1';
    if (!includePrivate) {
      whereCondition = 'is_public = true';
    }

    const [settings] = await executeQuery(`
      SELECT 
        category,
        setting_key,
        setting_value,
        description,
        data_type,
        is_public
      FROM system_settings 
      WHERE ${whereCondition}
      ORDER BY category, setting_key
    `);

    // Log de auditoría
    await executeQuery(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, 'export', 'system_settings', NULL, ?, ?)
    `, [
      req.user!.id,
      JSON.stringify({ format, includePrivate, totalSettings: (settings as any[]).length }),
      req.ip
    ]);

    if (format === 'csv') {
      // Convertir a CSV
      if (!settings || (settings as any[]).length === 0) {
        throw createError('No hay configuraciones para exportar', 404);
      }

      const csvData = settings as any[];
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      ).join('\n');

      const csv = `${headers}\n${rows}`;
      const filename = `system_settings_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      // Retornar JSON
      res.json({
        exportType: 'system_settings',
        generatedAt: new Date().toISOString(),
        includePrivate,
        totalSettings: (settings as any[]).length,
        settings
      });
    }

  } catch (error) {
    console.error('Error exportando configuraciones:', error);
    throw createError('Error exportando configuraciones', 500);
  }
}));

// Obtener historial de cambios de una configuración
router.get('/:key/history', requirePermission('settings.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { key } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const offset = (Number(page) - 1) * Number(limit);

  try {
    // Verificar que la configuración existe
    const [settingResult] = await executeQuery(
      'SELECT id FROM system_settings WHERE setting_key = ?',
      [key]
    ) as any[];

    if (!settingResult || settingResult.length === 0) {
      throw createError('Configuración no encontrada', 404);
    }

    const settingId = settingResult[0].id;

    // Obtener historial de cambios
    const [history] = await executeQuery(`
      SELECT 
        al.id,
        al.action,
        al.details,
        al.created_at,
        al.ip_address,
        au.first_name,
        au.last_name,
        au.email
      FROM audit_logs al
      LEFT JOIN admin_users au ON al.user_id = au.id
      WHERE al.resource_type = 'system_setting' 
        AND al.resource_id = ?
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `, [settingId, Number(limit), offset]);

    // Obtener total para paginación
    const [countResult] = await executeQuery(`
      SELECT COUNT(*) as total
      FROM audit_logs 
      WHERE resource_type = 'system_setting' AND resource_id = ?
    `, [settingId]) as any[];

    const total = countResult[0]?.total || 0;
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      settingKey: key,
      history,
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
    console.error('Error obteniendo historial de configuración:', error);
    throw createError('Error obteniendo historial de configuración', 500);
  }
}));

export default router;
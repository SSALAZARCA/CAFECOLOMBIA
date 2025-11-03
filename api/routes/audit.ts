import express from 'express';
import { executeQuery } from '../config/database.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Obtener logs de auditoría
router.get('/logs', requirePermission('audit.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = 1,
    limit = 50,
    search = '',
    action = 'all',
    resourceType = 'all',
    userId = '',
    dateFrom = '',
    dateTo = '',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  
  // Construir condiciones WHERE
  let whereConditions = ['1=1'];
  const queryParams: any[] = [];

  if (search) {
    whereConditions.push(`(
      au.first_name LIKE ? OR 
      au.last_name LIKE ? OR 
      au.email LIKE ? OR
      al.details LIKE ? OR
      al.ip_address LIKE ?
    )`);
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (action !== 'all') {
    whereConditions.push('al.action = ?');
    queryParams.push(action);
  }

  if (resourceType !== 'all') {
    whereConditions.push('al.resource_type = ?');
    queryParams.push(resourceType);
  }

  if (userId) {
    whereConditions.push('al.user_id = ?');
    queryParams.push(userId);
  }

  if (dateFrom) {
    whereConditions.push('DATE(al.created_at) >= ?');
    queryParams.push(dateFrom);
  }

  if (dateTo) {
    whereConditions.push('DATE(al.created_at) <= ?');
    queryParams.push(dateTo);
  }

  const whereClause = whereConditions.join(' AND ');
  
  // Validar campos de ordenamiento
  const validSortFields = ['created_at', 'action', 'resource_type', 'user_id'];
  const validSortOrders = ['asc', 'desc'];
  
  const finalSortBy = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
  const finalSortOrder = validSortOrders.includes(sortOrder as string) ? sortOrder : 'desc';

  try {
    // Obtener logs con información del usuario
    const logsQuery = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.details,
        al.ip_address,
        al.created_at,
        au.first_name,
        au.last_name,
        au.email,
        au.role
      FROM audit_logs al
      LEFT JOIN admin_users au ON al.user_id = au.id
      WHERE ${whereClause}
      ORDER BY al.${finalSortBy} ${finalSortOrder}
      LIMIT ? OFFSET ?
    `;

    // Obtener total de registros para paginación
    const countQuery = `
      SELECT COUNT(al.id) as total
      FROM audit_logs al
      LEFT JOIN admin_users au ON al.user_id = au.id
      WHERE ${whereClause}
    `;

    const [logs, countResult] = await Promise.all([
      executeQuery(logsQuery, [...queryParams, Number(limit), offset]),
      executeQuery(countQuery, queryParams)
    ]);

    const total = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      logs,
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
    console.error('Error obteniendo logs de auditoría:', error);
    throw createError('Error obteniendo logs de auditoría', 500);
  }
}));

// Obtener log específico
router.get('/logs/:id', requirePermission('audit.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const [logResult] = await executeQuery(`
      SELECT 
        al.*,
        au.first_name,
        au.last_name,
        au.email,
        au.role
      FROM audit_logs al
      LEFT JOIN admin_users au ON al.user_id = au.id
      WHERE al.id = ?
    `, [id]);

    const log = (logResult as any[])[0];
    if (!log) {
      throw createError('Log de auditoría no encontrado', 404);
    }

    // Parsear detalles JSON si existen
    if (log.details) {
      try {
        log.parsedDetails = JSON.parse(log.details);
      } catch (e) {
        log.parsedDetails = log.details;
      }
    }

    res.json({
      log
    });

  } catch (error) {
    console.error('Error obteniendo log de auditoría:', error);
    throw createError('Error obteniendo log de auditoría', 500);
  }
}));

// Obtener estadísticas de auditoría
router.get('/stats/overview', requirePermission('audit.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    dateFrom = '',
    dateTo = ''
  } = req.query;

  try {
    // Construir condiciones WHERE para filtros de fecha
    let whereConditions = ['1=1'];
    const queryParams: any[] = [];

    if (dateFrom) {
      whereConditions.push('DATE(al.created_at) >= ?');
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(al.created_at) <= ?');
      queryParams.push(dateTo);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener estadísticas generales
    const [generalStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_logs,
        COUNT(DISTINCT al.user_id) as unique_users,
        COUNT(DISTINCT al.ip_address) as unique_ips,
        COUNT(DISTINCT DATE(al.created_at)) as active_days
      FROM audit_logs al
      WHERE ${whereClause}
    `, queryParams);

    // Obtener distribución por acción
    const [actionDistribution] = await executeQuery(`
      SELECT 
        al.action,
        COUNT(*) as count,
        COUNT(DISTINCT al.user_id) as unique_users
      FROM audit_logs al
      WHERE ${whereClause}
      GROUP BY al.action
      ORDER BY count DESC
    `, queryParams);

    // Obtener distribución por tipo de recurso
    const [resourceDistribution] = await executeQuery(`
      SELECT 
        al.resource_type,
        COUNT(*) as count,
        COUNT(DISTINCT al.user_id) as unique_users
      FROM audit_logs al
      WHERE ${whereClause}
      GROUP BY al.resource_type
      ORDER BY count DESC
    `, queryParams);

    // Obtener actividad por usuario
    const [userActivity] = await executeQuery(`
      SELECT 
        au.first_name,
        au.last_name,
        au.email,
        au.role,
        COUNT(al.id) as total_actions,
        COUNT(DISTINCT al.action) as unique_actions,
        MAX(al.created_at) as last_activity
      FROM audit_logs al
      LEFT JOIN admin_users au ON al.user_id = au.id
      WHERE ${whereClause}
      GROUP BY al.user_id, au.first_name, au.last_name, au.email, au.role
      ORDER BY total_actions DESC
      LIMIT 10
    `, queryParams);

    // Obtener actividad diaria de los últimos 30 días
    const [dailyActivity] = await executeQuery(`
      SELECT 
        DATE(al.created_at) as date,
        COUNT(*) as total_actions,
        COUNT(DISTINCT al.user_id) as unique_users,
        COUNT(DISTINCT al.action) as unique_actions
      FROM audit_logs al
      WHERE al.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ${dateFrom || dateTo ? `AND ${whereClause}` : ''}
      GROUP BY DATE(al.created_at)
      ORDER BY date ASC
    `, dateFrom || dateTo ? queryParams : []);

    // Obtener IPs más activas
    const [topIPs] = await executeQuery(`
      SELECT 
        al.ip_address,
        COUNT(*) as total_actions,
        COUNT(DISTINCT al.user_id) as unique_users,
        MIN(al.created_at) as first_seen,
        MAX(al.created_at) as last_seen
      FROM audit_logs al
      WHERE ${whereClause}
      GROUP BY al.ip_address
      ORDER BY total_actions DESC
      LIMIT 10
    `, queryParams);

    res.json({
      summary: (generalStats as any[])[0],
      actionDistribution,
      resourceDistribution,
      userActivity,
      dailyActivity,
      topIPs
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de auditoría:', error);
    throw createError('Error obteniendo estadísticas de auditoría', 500);
  }
}));

// Obtener eventos de seguridad
router.get('/security-events', requirePermission('security.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = 1,
    limit = 20,
    eventType = 'all',
    severity = 'all',
    dateFrom = '',
    dateTo = '',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  
  // Construir condiciones WHERE
  let whereConditions = ['1=1'];
  const queryParams: any[] = [];

  if (eventType !== 'all') {
    whereConditions.push('se.event_type = ?');
    queryParams.push(eventType);
  }

  if (severity !== 'all') {
    whereConditions.push('se.severity = ?');
    queryParams.push(severity);
  }

  if (dateFrom) {
    whereConditions.push('DATE(se.created_at) >= ?');
    queryParams.push(dateFrom);
  }

  if (dateTo) {
    whereConditions.push('DATE(se.created_at) <= ?');
    queryParams.push(dateTo);
  }

  const whereClause = whereConditions.join(' AND ');
  
  // Validar campos de ordenamiento
  const validSortFields = ['created_at', 'event_type', 'severity'];
  const validSortOrders = ['asc', 'desc'];
  
  const finalSortBy = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
  const finalSortOrder = validSortOrders.includes(sortOrder as string) ? sortOrder : 'desc';

  try {
    // Obtener eventos de seguridad
    const eventsQuery = `
      SELECT 
        se.id,
        se.event_type,
        se.severity,
        se.description,
        se.ip_address,
        se.user_agent,
        se.details,
        se.created_at,
        au.first_name,
        au.last_name,
        au.email
      FROM security_events se
      LEFT JOIN admin_users au ON se.user_id = au.id
      WHERE ${whereClause}
      ORDER BY se.${finalSortBy} ${finalSortOrder}
      LIMIT ? OFFSET ?
    `;

    // Obtener total de registros para paginación
    const countQuery = `
      SELECT COUNT(se.id) as total
      FROM security_events se
      WHERE ${whereClause}
    `;

    const [events, countResult] = await Promise.all([
      executeQuery(eventsQuery, [...queryParams, Number(limit), offset]),
      executeQuery(countQuery, queryParams)
    ]);

    const total = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      events,
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
    console.error('Error obteniendo eventos de seguridad:', error);
    throw createError('Error obteniendo eventos de seguridad', 500);
  }
}));

// Crear evento de seguridad
router.post('/security-events', requirePermission('security.manage'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    eventType,
    severity,
    description,
    details,
    affectedUserId
  } = req.body;

  // Validaciones básicas
  if (!eventType || !severity || !description) {
    throw createError('Tipo de evento, severidad y descripción son requeridos', 400);
  }

  const validEventTypes = ['login_failure', 'suspicious_activity', 'data_breach', 'unauthorized_access', 'system_error'];
  const validSeverities = ['low', 'medium', 'high', 'critical'];

  if (!validEventTypes.includes(eventType)) {
    throw createError('Tipo de evento inválido', 400);
  }

  if (!validSeverities.includes(severity)) {
    throw createError('Severidad inválida', 400);
  }

  try {
    // Crear evento de seguridad
    const result = await executeQuery(`
      INSERT INTO security_events (
        event_type, severity, description, ip_address, user_agent, 
        details, user_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      eventType, severity, description, req.ip, req.get('User-Agent'),
      details ? JSON.stringify(details) : null, affectedUserId
    ]);

    const eventId = (result as any).insertId;

    // Log de auditoría
    await executeQuery(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, 'create', 'security_event', ?, ?, ?)
    `, [
      req.user!.id,
      eventId,
      JSON.stringify({ eventType, severity, description }),
      req.ip
    ]);

    res.status(201).json({
      message: 'Evento de seguridad creado exitosamente',
      eventId
    });

  } catch (error) {
    console.error('Error creando evento de seguridad:', error);
    throw createError('Error creando evento de seguridad', 500);
  }
}));

// Obtener estadísticas de eventos de seguridad
router.get('/security-events/stats', requirePermission('security.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    dateFrom = '',
    dateTo = ''
  } = req.query;

  try {
    // Construir condiciones WHERE para filtros de fecha
    let whereConditions = ['1=1'];
    const queryParams: any[] = [];

    if (dateFrom) {
      whereConditions.push('DATE(se.created_at) >= ?');
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(se.created_at) <= ?');
      queryParams.push(dateTo);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener estadísticas generales
    const [generalStats] = await executeQuery(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_events,
        COUNT(CASE WHEN severity = 'medium' THEN 1 END) as medium_events,
        COUNT(CASE WHEN severity = 'low' THEN 1 END) as low_events,
        COUNT(DISTINCT ip_address) as unique_ips
      FROM security_events se
      WHERE ${whereClause}
    `, queryParams);

    // Obtener distribución por tipo de evento
    const [eventTypeDistribution] = await executeQuery(`
      SELECT 
        se.event_type,
        COUNT(*) as count,
        COUNT(CASE WHEN severity IN ('critical', 'high') THEN 1 END) as high_severity_count
      FROM security_events se
      WHERE ${whereClause}
      GROUP BY se.event_type
      ORDER BY count DESC
    `, queryParams);

    // Obtener tendencia diaria de los últimos 30 días
    const [dailyTrend] = await executeQuery(`
      SELECT 
        DATE(se.created_at) as date,
        COUNT(*) as total_events,
        COUNT(CASE WHEN severity = 'critical' THEN 1 END) as critical_events,
        COUNT(CASE WHEN severity = 'high' THEN 1 END) as high_events
      FROM security_events se
      WHERE se.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        ${dateFrom || dateTo ? `AND ${whereClause}` : ''}
      GROUP BY DATE(se.created_at)
      ORDER BY date ASC
    `, dateFrom || dateTo ? queryParams : []);

    // Obtener IPs más problemáticas
    const [problematicIPs] = await executeQuery(`
      SELECT 
        se.ip_address,
        COUNT(*) as total_events,
        COUNT(CASE WHEN severity IN ('critical', 'high') THEN 1 END) as high_severity_events,
        MAX(se.created_at) as last_event
      FROM security_events se
      WHERE ${whereClause}
      GROUP BY se.ip_address
      ORDER BY high_severity_events DESC, total_events DESC
      LIMIT 10
    `, queryParams);

    res.json({
      summary: (generalStats as any[])[0],
      eventTypeDistribution,
      dailyTrend,
      problematicIPs
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de eventos de seguridad:', error);
    throw createError('Error obteniendo estadísticas de eventos de seguridad', 500);
  }
}));

// Exportar logs de auditoría
router.get('/export/logs', requirePermission('audit.export'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    action = 'all',
    resourceType = 'all',
    dateFrom = '',
    dateTo = '',
    format = 'csv'
  } = req.query;

  try {
    // Construir condiciones WHERE
    let whereConditions = ['1=1'];
    const queryParams: any[] = [];

    if (action !== 'all') {
      whereConditions.push('al.action = ?');
      queryParams.push(action);
    }

    if (resourceType !== 'all') {
      whereConditions.push('al.resource_type = ?');
      queryParams.push(resourceType);
    }

    if (dateFrom) {
      whereConditions.push('DATE(al.created_at) >= ?');
      queryParams.push(dateFrom);
    }

    if (dateTo) {
      whereConditions.push('DATE(al.created_at) <= ?');
      queryParams.push(dateTo);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener logs para exportación
    const [logs] = await executeQuery(`
      SELECT 
        al.id,
        al.user_id,
        COALESCE(CONCAT(au.first_name, ' ', au.last_name), 'Usuario desconocido') as user_name,
        au.email as user_email,
        al.action,
        al.resource_type,
        al.resource_id,
        al.details,
        al.ip_address,
        al.created_at
      FROM audit_logs al
      LEFT JOIN admin_users au ON al.user_id = au.id
      WHERE ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT 10000
    `, queryParams);

    // Log de auditoría para exportación
    await executeQuery(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, 'export', 'audit_logs', NULL, ?, ?)
    `, [
      req.user!.id,
      JSON.stringify({ action, resourceType, dateFrom, dateTo, format }),
      req.ip
    ]);

    if (format === 'csv') {
      // Convertir a CSV
      if (!logs || (logs as any[]).length === 0) {
        throw createError('No hay datos para exportar', 404);
      }

      const csvData = logs as any[];
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      ).join('\n');

      const csv = `${headers}\n${rows}`;
      const filename = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      // Retornar JSON
      res.json({
        exportType: 'audit_logs',
        generatedAt: new Date().toISOString(),
        totalRecords: (logs as any[]).length,
        data: logs
      });
    }

  } catch (error) {
    console.error('Error exportando logs de auditoría:', error);
    throw createError('Error exportando logs de auditoría', 500);
  }
}));

export default router;
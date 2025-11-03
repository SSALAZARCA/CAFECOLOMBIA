import { executeQuery, executeTransaction } from '../config/database.js';
import type { 
  AuditLog, 
  AuditLogCreateRequest,
  AuditLogListFilters,
  AuditLogListResponse,
  AuditLogStats,
  PaginationParams 
} from '../../shared/types/index.js';

export class AdminAuditService {
  /**
   * Crear un nuevo registro de auditoría
   */
  static async createAuditLog(auditData: AuditLogCreateRequest): Promise<AuditLog> {
    const query = `
      INSERT INTO audit_logs (
        user_id, action, resource_type, resource_id, 
        old_values, new_values, ip_address, user_agent, 
        description, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `;

    const values = [
      auditData.user_id,
      auditData.action,
      auditData.resource_type,
      auditData.resource_id || null,
      auditData.old_values ? JSON.stringify(auditData.old_values) : null,
      auditData.new_values ? JSON.stringify(auditData.new_values) : null,
      auditData.ip_address || null,
      auditData.user_agent || null,
      auditData.description || null
    ];

    const result = await executeQuery(query, values);
    const auditId = result.insertId;

    // Obtener el registro creado
    const createdAudit = await this.getAuditLogById(auditId);
    if (!createdAudit) {
      throw new Error('Error al crear el registro de auditoría');
    }

    return createdAudit;
  }

  /**
   * Obtener registros de auditoría con filtros y paginación
   */
  static async getAuditLogs(filters: AuditLogListFilters): Promise<AuditLogListResponse> {
    const { page = 1, limit = 10 } = filters;
    const offset = (page - 1) * limit;

    // Construir condiciones WHERE
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters.search) {
      conditions.push(`(
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.email LIKE ? OR 
        al.description LIKE ? OR
        al.resource_type LIKE ?
      )`);
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.user_id) {
      conditions.push('al.user_id = ?');
      values.push(filters.user_id);
    }

    if (filters.action) {
      conditions.push('al.action = ?');
      values.push(filters.action);
    }

    if (filters.resource_type) {
      conditions.push('al.resource_type = ?');
      values.push(filters.resource_type);
    }

    if (filters.resource_id) {
      conditions.push('al.resource_id = ?');
      values.push(filters.resource_id);
    }

    if (filters.date_range) {
      conditions.push('DATE(al.created_at) BETWEEN ? AND ?');
      values.push(filters.date_range.start_date, filters.date_range.end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para obtener el total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
    `;

    const totalResult = await executeQuery(countQuery, values);
    const total = totalResult[0].total;

    // Query para obtener los registros
    const dataQuery = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.description,
        al.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY ${filters.sort_by || 'al.created_at'} ${filters.sort_order || 'DESC'}
      LIMIT ? OFFSET ?
    `;

    const dataValues = [...values, limit, offset];
    const auditLogs = await executeQuery(dataQuery, dataValues);

    // Procesar los resultados
    const processedLogs: AuditLog[] = auditLogs.map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      description: log.description,
      created_at: log.created_at,
      user_name: log.user_name,
      user_email: log.user_email,
      user_role: log.user_role
    }));

    return {
      data: processedLogs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener registro de auditoría por ID
   */
  static async getAuditLogById(id: number): Promise<AuditLog | null> {
    const query = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.description,
        al.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE al.id = ?
    `;

    const result = await executeQuery(query, [id]);
    
    if (result.length === 0) {
      return null;
    }

    const log = result[0];
    return {
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      description: log.description,
      created_at: log.created_at,
      user_name: log.user_name,
      user_email: log.user_email,
      user_role: log.user_role
    };
  }

  /**
   * Obtener estadísticas de auditoría
   */
  static async getAuditStats(): Promise<AuditLogStats> {
    const queries = {
      total: `SELECT COUNT(*) as count FROM audit_logs`,
      
      today: `
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE DATE(created_at) = CURDATE()
      `,
      
      this_week: `
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)
      `,
      
      this_month: `
        SELECT COUNT(*) as count 
        FROM audit_logs 
        WHERE YEAR(created_at) = YEAR(CURDATE()) 
        AND MONTH(created_at) = MONTH(CURDATE())
      `,
      
      by_action: `
        SELECT action, COUNT(*) as count
        FROM audit_logs
        GROUP BY action
        ORDER BY count DESC
      `,
      
      by_resource_type: `
        SELECT resource_type, COUNT(*) as count
        FROM audit_logs
        GROUP BY resource_type
        ORDER BY count DESC
      `,
      
      by_user: `
        SELECT 
          al.user_id,
          CONCAT(u.first_name, ' ', u.last_name) as user_name,
          u.email,
          COUNT(*) as count
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        GROUP BY al.user_id, u.first_name, u.last_name, u.email
        ORDER BY count DESC
        LIMIT 10
      `,
      
      recent_activities: `
        SELECT 
          al.id,
          al.action,
          al.resource_type,
          al.resource_id,
          al.description,
          al.created_at,
          CONCAT(u.first_name, ' ', u.last_name) as user_name
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT 10
      `,
      
      daily_activity: `
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM audit_logs
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `
    };

    const [
      totalResult,
      todayResult,
      thisWeekResult,
      thisMonthResult,
      byActionResult,
      byResourceTypeResult,
      byUserResult,
      recentActivitiesResult,
      dailyActivityResult
    ] = await Promise.all([
      executeQuery(queries.total),
      executeQuery(queries.today),
      executeQuery(queries.this_week),
      executeQuery(queries.this_month),
      executeQuery(queries.by_action),
      executeQuery(queries.by_resource_type),
      executeQuery(queries.by_user),
      executeQuery(queries.recent_activities),
      executeQuery(queries.daily_activity)
    ]);

    return {
      total: totalResult[0].count,
      today: todayResult[0].count,
      this_week: thisWeekResult[0].count,
      this_month: thisMonthResult[0].count,
      by_action: byActionResult.map((item: any) => ({
        action: item.action,
        count: item.count
      })),
      by_resource_type: byResourceTypeResult.map((item: any) => ({
        resource_type: item.resource_type,
        count: item.count
      })),
      by_user: byUserResult.map((item: any) => ({
        user_id: item.user_id,
        user_name: item.user_name,
        email: item.email,
        count: item.count
      })),
      recent_activities: recentActivitiesResult.map((item: any) => ({
        id: item.id,
        action: item.action,
        resource_type: item.resource_type,
        resource_id: item.resource_id,
        description: item.description,
        created_at: item.created_at,
        user_name: item.user_name
      })),
      daily_activity: dailyActivityResult.map((item: any) => ({
        date: item.date,
        count: item.count
      }))
    };
  }

  /**
   * Limpiar registros de auditoría antiguos
   */
  static async cleanOldAuditLogs(daysToKeep: number = 365): Promise<number> {
    const query = `
      DELETE FROM audit_logs 
      WHERE created_at < DATE_SUB(NOW(), INTERVAL ? DAY)
    `;

    const result = await executeQuery(query, [daysToKeep]);
    return result.affectedRows;
  }

  /**
   * Exportar registros de auditoría
   */
  static async exportAuditLogs(filters: AuditLogListFilters): Promise<AuditLog[]> {
    // Construir condiciones WHERE
    const conditions: string[] = [];
    const values: any[] = [];

    if (filters.search) {
      conditions.push(`(
        u.first_name LIKE ? OR 
        u.last_name LIKE ? OR 
        u.email LIKE ? OR 
        al.description LIKE ? OR
        al.resource_type LIKE ?
      )`);
      const searchTerm = `%${filters.search}%`;
      values.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (filters.user_id) {
      conditions.push('al.user_id = ?');
      values.push(filters.user_id);
    }

    if (filters.action) {
      conditions.push('al.action = ?');
      values.push(filters.action);
    }

    if (filters.resource_type) {
      conditions.push('al.resource_type = ?');
      values.push(filters.resource_type);
    }

    if (filters.date_range) {
      conditions.push('DATE(al.created_at) BETWEEN ? AND ?');
      values.push(filters.date_range.start_date, filters.date_range.end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource_type,
        al.resource_id,
        al.old_values,
        al.new_values,
        al.ip_address,
        al.user_agent,
        al.description,
        al.created_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        u.role as user_role
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY ${filters.sort_by || 'al.created_at'} ${filters.sort_order || 'DESC'}
    `;

    const auditLogs = await executeQuery(query, values);

    return auditLogs.map((log: any) => ({
      id: log.id,
      user_id: log.user_id,
      action: log.action,
      resource_type: log.resource_type,
      resource_id: log.resource_id,
      old_values: log.old_values ? JSON.parse(log.old_values) : null,
      new_values: log.new_values ? JSON.parse(log.new_values) : null,
      ip_address: log.ip_address,
      user_agent: log.user_agent,
      description: log.description,
      created_at: log.created_at,
      user_name: log.user_name,
      user_email: log.user_email,
      user_role: log.user_role
    }));
  }
}
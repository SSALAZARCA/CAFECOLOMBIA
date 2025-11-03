import express from 'express';
import { AdminAuditService } from '../../services/adminAuditService.js';
import { authenticateAdmin, requireRole } from '../../middleware/adminAuth.js';
import type { AuditLogListFilters } from '../../../shared/types/index.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateAdmin);

/**
 * GET /api/admin/audit
 * Obtener registros de auditoría con filtros y paginación
 */
router.get('/', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const filters: AuditLogListFilters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
      action: req.query.action as any,
      resource_type: req.query.resource_type as string,
      resource_id: req.query.resource_id as string,
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string
      } : undefined,
      sort_by: req.query.sort_by as string || 'created_at',
      sort_order: req.query.sort_order as 'asc' | 'desc' || 'desc'
    };

    const result = await AdminAuditService.getAuditLogs(filters);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo registros de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/audit/stats
 * Obtener estadísticas de auditoría
 */
router.get('/stats', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const stats = await AdminAuditService.getAuditStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/audit/:id
 * Obtener registro de auditoría por ID
 */
router.get('/:id', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const auditId = parseInt(req.params.id);
    
    if (isNaN(auditId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de registro de auditoría inválido'
      });
    }

    const auditLog = await AdminAuditService.getAuditLogById(auditId);

    if (!auditLog) {
      return res.status(404).json({
        success: false,
        message: 'Registro de auditoría no encontrado'
      });
    }

    res.json({
      success: true,
      data: auditLog
    });

  } catch (error) {
    console.error('Error obteniendo registro de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/audit/export
 * Exportar registros de auditoría
 */
router.get('/export', requireRole(['super_admin']), async (req, res) => {
  try {
    const filters: AuditLogListFilters = {
      search: req.query.search as string,
      user_id: req.query.user_id ? parseInt(req.query.user_id as string) : undefined,
      action: req.query.action as any,
      resource_type: req.query.resource_type as string,
      resource_id: req.query.resource_id as string,
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string
      } : undefined,
      sort_by: req.query.sort_by as string || 'created_at',
      sort_order: req.query.sort_order as 'asc' | 'desc' || 'desc'
    };

    const auditLogs = await AdminAuditService.exportAuditLogs(filters);

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.json"`);

    res.json({
      success: true,
      data: auditLogs,
      exported_at: new Date().toISOString(),
      total_records: auditLogs.length
    });

  } catch (error) {
    console.error('Error exportando registros de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * DELETE /api/admin/audit/cleanup
 * Limpiar registros de auditoría antiguos
 */
router.delete('/cleanup', requireRole(['super_admin']), async (req, res) => {
  try {
    const daysToKeep = parseInt(req.query.days as string) || 365;

    if (daysToKeep < 30) {
      return res.status(400).json({
        success: false,
        message: 'Debe mantener al menos 30 días de registros'
      });
    }

    const deletedCount = await AdminAuditService.cleanOldAuditLogs(daysToKeep);

    res.json({
      success: true,
      message: `Se eliminaron ${deletedCount} registros de auditoría`,
      data: {
        deleted_records: deletedCount,
        days_kept: daysToKeep
      }
    });

  } catch (error) {
    console.error('Error limpiando registros de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;
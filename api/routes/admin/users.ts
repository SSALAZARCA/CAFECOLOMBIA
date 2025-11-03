import express from 'express';
import { AdminUserManagementService } from '../../services/adminUserManagement.js';
import { 
  authenticateAdmin, 
  requireSuperAdmin, 
  requireAdmin,
  logAdminActivity 
} from '../../middleware/adminAuth.js';
import type { 
  AdminCreateRequest, 
  AdminUpdateRequest, 
  AdminListFilters 
} from '../../../shared/types/index.js';

const router = express.Router();

/**
 * GET /api/admin/users
 * Obtener lista de administradores
 */
router.get('/', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('READ', 'admin_user'),
  async (req, res) => {
    try {
      const filters: AdminListFilters = {
        role: req.query.role as any,
        is_active: req.query.is_active ? req.query.is_active === 'true' : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sort_by: req.query.sort_by as any || 'created_at',
        sort_order: req.query.sort_order as any || 'desc'
      };

      const result = await AdminUserManagementService.getAdmins(filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error obteniendo administradores:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo lista de administradores'
      });
    }
  }
);

/**
 * GET /api/admin/users/stats
 * Obtener estadísticas de administradores
 */
router.get('/stats', 
  authenticateAdmin, 
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await AdminUserManagementService.getAdminStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas'
      });
    }
  }
);

/**
 * GET /api/admin/users/:id
 * Obtener administrador por ID
 */
router.get('/:id', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('READ', 'admin_user'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      const admin = await AdminUserManagementService.getAdminById(id);

      if (!admin) {
        return res.status(404).json({
          success: false,
          message: 'Administrador no encontrado'
        });
      }

      res.json({
        success: true,
        data: admin
      });

    } catch (error) {
      console.error('Error obteniendo administrador:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo administrador'
      });
    }
  }
);

/**
 * POST /api/admin/users
 * Crear nuevo administrador
 */
router.post('/', 
  authenticateAdmin, 
  requireSuperAdmin,
  logAdminActivity('CREATE', 'admin_user'),
  async (req, res) => {
    try {
      const adminData: AdminCreateRequest = req.body;

      // Validar datos requeridos
      if (!adminData.username || !adminData.email || !adminData.password || !adminData.full_name || !adminData.role) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(adminData.email)) {
        return res.status(400).json({
          success: false,
          message: 'Formato de email inválido'
        });
      }

      // Validar longitud de contraseña
      if (adminData.password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres'
        });
      }

      // Validar rol
      const validRoles = ['super_admin', 'admin', 'moderator'];
      if (!validRoles.includes(adminData.role)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido'
        });
      }

      const result = await AdminUserManagementService.createAdmin(adminData, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);

    } catch (error) {
      console.error('Error creando administrador:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando administrador'
      });
    }
  }
);

/**
 * PUT /api/admin/users/:id
 * Actualizar administrador
 */
router.put('/:id', 
  authenticateAdmin, 
  requireSuperAdmin,
  logAdminActivity('UPDATE', 'admin_user'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData: AdminUpdateRequest = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      // Validar formato de email si se proporciona
      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          return res.status(400).json({
            success: false,
            message: 'Formato de email inválido'
          });
        }
      }

      // Validar rol si se proporciona
      if (updateData.role) {
        const validRoles = ['super_admin', 'admin', 'moderator'];
        if (!validRoles.includes(updateData.role)) {
          return res.status(400).json({
            success: false,
            message: 'Rol inválido'
          });
        }
      }

      const result = await AdminUserManagementService.updateAdmin(id, updateData, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error actualizando administrador:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando administrador'
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:id
 * Eliminar administrador
 */
router.delete('/:id', 
  authenticateAdmin, 
  requireSuperAdmin,
  logAdminActivity('DELETE', 'admin_user'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      // No permitir que un admin se elimine a sí mismo
      if (id === req.admin!.id) {
        return res.status(400).json({
          success: false,
          message: 'No puedes eliminarte a ti mismo'
        });
      }

      const result = await AdminUserManagementService.deleteAdmin(id, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error eliminando administrador:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando administrador'
      });
    }
  }
);

/**
 * POST /api/admin/users/:id/unlock
 * Desbloquear administrador
 */
router.post('/:id/unlock', 
  authenticateAdmin, 
  requireSuperAdmin,
  logAdminActivity('UPDATE', 'admin_user'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      const result = await AdminUserManagementService.unlockAdmin(id, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error desbloqueando administrador:', error);
      res.status(500).json({
        success: false,
        message: 'Error desbloqueando administrador'
      });
    }
  }
);

/**
 * POST /api/admin/users/:id/reset-password
 * Resetear contraseña de administrador
 */
router.post('/:id/reset-password', 
  authenticateAdmin, 
  requireSuperAdmin,
  logAdminActivity('PASSWORD_CHANGE', 'admin_user'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { new_password } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      if (!new_password) {
        return res.status(400).json({
          success: false,
          message: 'Nueva contraseña requerida'
        });
      }

      if (new_password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La contraseña debe tener al menos 8 caracteres'
        });
      }

      const result = await AdminUserManagementService.resetPassword(id, new_password, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error restableciendo contraseña'
      });
    }
  }
);

/**
 * GET /api/admin/users/:id/sessions
 * Obtener sesiones activas de un administrador
 */
router.get('/:id/sessions', 
  authenticateAdmin, 
  requireAdmin,
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      // Solo super admin puede ver sesiones de otros, o el mismo admin sus propias sesiones
      if (req.admin!.role !== 'super_admin' && req.admin!.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver estas sesiones'
        });
      }

      const sessions = await AdminUserManagementService.getAdminSessions(id);

      res.json({
        success: true,
        data: sessions
      });

    } catch (error) {
      console.error('Error obteniendo sesiones:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sesiones'
      });
    }
  }
);

/**
 * DELETE /api/admin/users/:id/sessions/:sessionId
 * Invalidar sesión específica
 */
router.delete('/:id/sessions/:sessionId', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('DELETE', 'session'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const sessionId = req.params.sessionId;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      // Solo super admin puede invalidar sesiones de otros, o el mismo admin sus propias sesiones
      if (req.admin!.role !== 'super_admin' && req.admin!.id !== id) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para invalidar esta sesión'
        });
      }

      const result = await AdminUserManagementService.invalidateSession(sessionId, id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error invalidando sesión:', error);
      res.status(500).json({
        success: false,
        message: 'Error invalidando sesión'
      });
    }
  }
);

export default router;
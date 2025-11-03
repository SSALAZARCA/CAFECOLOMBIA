import express from 'express';
import { AdminSubscriptionPlansManagementService } from '../../services/adminSubscriptionPlansManagement.js';
import { authenticateAdmin, requireRole, logAdminActivity } from '../../middleware/adminAuth.js';
import type { 
  SubscriptionPlanCreateRequest, 
  SubscriptionPlanUpdateRequest,
  SubscriptionPlanListFilters 
} from '../../../shared/types/index.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateAdmin);

/**
 * GET /api/admin/subscription-plans
 * Obtener lista de planes de suscripción con filtros y paginación
 */
router.get('/', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const filters: SubscriptionPlanListFilters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      is_active: req.query.is_active === 'true' ? true : req.query.is_active === 'false' ? false : undefined,
      billing_cycle: req.query.billing_cycle as any,
      sort_by: req.query.sort_by as string || 'created_at',
      sort_order: req.query.sort_order as 'asc' | 'desc' || 'desc'
    };

    const result = await AdminSubscriptionPlansManagementService.getPlans(filters);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo planes de suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/subscription-plans/stats
 * Obtener estadísticas de planes de suscripción
 */
router.get('/stats', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const stats = await AdminSubscriptionPlansManagementService.getPlansStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de planes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/subscription-plans/:id
 * Obtener plan de suscripción por ID
 */
router.get('/:id', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plan inválido'
      });
    }

    const plan = await AdminSubscriptionPlansManagementService.getPlanById(planId);

    if (!plan) {
      return res.status(404).json({
        success: false,
        message: 'Plan de suscripción no encontrado'
      });
    }

    res.json({
      success: true,
      data: plan
    });

  } catch (error) {
    console.error('Error obteniendo plan de suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/admin/subscription-plans
 * Crear nuevo plan de suscripción
 */
router.post('/', requireRole(['super_admin', 'admin']), logAdminActivity('create', 'subscription_plan'), async (req, res) => {
  try {
    const planData: SubscriptionPlanCreateRequest = req.body;

    // Validaciones básicas
    if (!planData.name || !planData.price || !planData.billing_cycle) {
      return res.status(400).json({
        success: false,
        message: 'Nombre, precio y ciclo de facturación son requeridos'
      });
    }

    if (planData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    if (!['monthly', 'quarterly', 'yearly'].includes(planData.billing_cycle)) {
      return res.status(400).json({
        success: false,
        message: 'Ciclo de facturación inválido'
      });
    }

    const newPlan = await AdminSubscriptionPlansManagementService.createPlan(planData);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: newPlan.id.toString(),
      new_values: newPlan
    };

    res.status(201).json({
      success: true,
      message: 'Plan de suscripción creado exitosamente',
      data: newPlan
    });

  } catch (error) {
    console.error('Error creando plan de suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * PUT /api/admin/subscription-plans/:id
 * Actualizar plan de suscripción
 */
router.put('/:id', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'subscription_plan'), async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plan inválido'
      });
    }

    const planData: SubscriptionPlanUpdateRequest = req.body;

    // Validaciones
    if (planData.price !== undefined && planData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    if (planData.billing_cycle && !['monthly', 'quarterly', 'yearly'].includes(planData.billing_cycle)) {
      return res.status(400).json({
        success: false,
        message: 'Ciclo de facturación inválido'
      });
    }

    // Obtener valores anteriores para auditoría
    const oldPlan = await AdminSubscriptionPlansManagementService.getPlanById(planId);

    const updatedPlan = await AdminSubscriptionPlansManagementService.updatePlan(planId, planData);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: planId.toString(),
      old_values: oldPlan,
      new_values: updatedPlan
    };

    res.json({
      success: true,
      message: 'Plan de suscripción actualizado exitosamente',
      data: updatedPlan
    });

  } catch (error) {
    console.error('Error actualizando plan de suscripción:', error);
    
    if (error instanceof Error && error.message === 'Plan de suscripción no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * DELETE /api/admin/subscription-plans/:id
 * Eliminar plan de suscripción
 */
router.delete('/:id', requireRole(['super_admin']), logAdminActivity('delete', 'subscription_plan'), async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plan inválido'
      });
    }

    // Obtener plan para auditoría
    const plan = await AdminSubscriptionPlansManagementService.getPlanById(planId);

    await AdminSubscriptionPlansManagementService.deletePlan(planId);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: planId.toString(),
      old_values: plan
    };

    res.json({
      success: true,
      message: 'Plan de suscripción eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando plan de suscripción:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Plan de suscripción no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('suscripciones activas')) {
        return res.status(400).json({
          success: false,
          message: error.message
        });
      }
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * PATCH /api/admin/subscription-plans/:id/toggle-status
 * Cambiar estado del plan (activar/desactivar)
 */
router.patch('/:id/toggle-status', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'subscription_plan'), async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plan inválido'
      });
    }

    // Obtener valores anteriores para auditoría
    const oldPlan = await AdminSubscriptionPlansManagementService.getPlanById(planId);

    const updatedPlan = await AdminSubscriptionPlansManagementService.togglePlanStatus(planId);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: planId.toString(),
      old_values: oldPlan,
      new_values: updatedPlan,
      description: `Estado cambiado a ${updatedPlan.is_active ? 'activo' : 'inactivo'}`
    };

    res.json({
      success: true,
      message: `Plan ${updatedPlan.is_active ? 'activado' : 'desactivado'} exitosamente`,
      data: updatedPlan
    });

  } catch (error) {
    console.error('Error cambiando estado del plan:', error);
    
    if (error instanceof Error && error.message === 'Plan de suscripción no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * PATCH /api/admin/subscription-plans/:id/toggle-featured
 * Marcar/desmarcar plan como destacado
 */
router.patch('/:id/toggle-featured', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'subscription_plan'), async (req, res) => {
  try {
    const planId = parseInt(req.params.id);
    
    if (isNaN(planId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de plan inválido'
      });
    }

    // Obtener valores anteriores para auditoría
    const oldPlan = await AdminSubscriptionPlansManagementService.getPlanById(planId);

    const updatedPlan = await AdminSubscriptionPlansManagementService.toggleFeaturedStatus(planId);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: planId.toString(),
      old_values: oldPlan,
      new_values: updatedPlan,
      description: `Plan ${updatedPlan.is_featured ? 'marcado como destacado' : 'desmarcado como destacado'}`
    };

    res.json({
      success: true,
      message: `Plan ${updatedPlan.is_featured ? 'marcado como destacado' : 'desmarcado como destacado'} exitosamente`,
      data: updatedPlan
    });

  } catch (error) {
    console.error('Error cambiando estado destacado del plan:', error);
    
    if (error instanceof Error && error.message === 'Plan de suscripción no encontrado') {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/admin/subscription-plans/reorder
 * Reordenar planes de suscripción
 */
router.post('/reorder', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'subscription_plan'), async (req, res) => {
  try {
    const { plan_orders } = req.body;

    if (!Array.isArray(plan_orders)) {
      return res.status(400).json({
        success: false,
        message: 'plan_orders debe ser un array'
      });
    }

    // Validar estructura
    for (const order of plan_orders) {
      if (!order.id || typeof order.sort_order !== 'number') {
        return res.status(400).json({
          success: false,
          message: 'Cada elemento debe tener id y sort_order'
        });
      }
    }

    await AdminSubscriptionPlansManagementService.reorderPlans(plan_orders);

    // Agregar información para auditoría
    req.auditInfo = {
      description: 'Planes reordenados',
      new_values: { plan_orders }
    };

    res.json({
      success: true,
      message: 'Planes reordenados exitosamente'
    });

  } catch (error) {
    console.error('Error reordenando planes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;
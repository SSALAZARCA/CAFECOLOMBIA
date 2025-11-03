import express from 'express';
import { AdminSubscriptionsManagementService } from '../../services/adminSubscriptionsManagement.js';
import { authenticateAdmin, requireRole, logAdminActivity } from '../../middleware/adminAuth.js';
import type { 
  SubscriptionCreateRequest, 
  SubscriptionUpdateRequest,
  SubscriptionListFilters 
} from '../../../shared/types/index.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateAdmin);

/**
 * GET /api/admin/subscriptions
 * Obtener lista de suscripciones con filtros y paginación
 */
router.get('/', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const filters: SubscriptionListFilters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      status: req.query.status as any,
      plan_id: req.query.plan_id ? parseInt(req.query.plan_id as string) : undefined,
      billing_cycle: req.query.billing_cycle as any,
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string
      } : undefined,
      sort_by: req.query.sort_by as string || 'created_at',
      sort_order: req.query.sort_order as 'asc' | 'desc' || 'desc'
    };

    const result = await AdminSubscriptionsManagementService.getSubscriptions(filters);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo suscripciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/subscriptions/stats
 * Obtener estadísticas de suscripciones
 */
router.get('/stats', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const stats = await AdminSubscriptionsManagementService.getSubscriptionsStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de suscripciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/subscriptions/metrics
 * Obtener métricas de suscripciones
 */
router.get('/metrics', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const metrics = await AdminSubscriptionsManagementService.getSubscriptionsMetrics();

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error obteniendo métricas de suscripciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/subscriptions/:id
 * Obtener suscripción por ID
 */
router.get('/:id', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    
    if (isNaN(subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de suscripción inválido'
      });
    }

    const subscription = await AdminSubscriptionsManagementService.getSubscriptionById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Suscripción no encontrada'
      });
    }

    res.json({
      success: true,
      data: subscription
    });

  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/admin/subscriptions
 * Crear nueva suscripción
 */
router.post('/', requireRole(['super_admin', 'admin']), logAdminActivity('create', 'subscription'), async (req, res) => {
  try {
    const subscriptionData: SubscriptionCreateRequest = req.body;

    // Validaciones básicas
    if (!subscriptionData.coffee_grower_id || !subscriptionData.plan_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de caficultor y plan son requeridos'
      });
    }

    if (!subscriptionData.start_date || !subscriptionData.end_date) {
      return res.status(400).json({
        success: false,
        message: 'Fechas de inicio y fin son requeridas'
      });
    }

    if (!subscriptionData.billing_cycle || !['monthly', 'quarterly', 'yearly'].includes(subscriptionData.billing_cycle)) {
      return res.status(400).json({
        success: false,
        message: 'Ciclo de facturación inválido'
      });
    }

    if (subscriptionData.price !== undefined && subscriptionData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    const newSubscription = await AdminSubscriptionsManagementService.createSubscription(subscriptionData);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: newSubscription.id.toString(),
      new_values: newSubscription
    };

    res.status(201).json({
      success: true,
      message: 'Suscripción creada exitosamente',
      data: newSubscription
    });

  } catch (error) {
    console.error('Error creando suscripción:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('no encontrado') || error.message.includes('suscripción activa')) {
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
 * PUT /api/admin/subscriptions/:id
 * Actualizar suscripción
 */
router.put('/:id', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'subscription'), async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    
    if (isNaN(subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de suscripción inválido'
      });
    }

    const subscriptionData: SubscriptionUpdateRequest = req.body;

    // Validaciones
    if (subscriptionData.price !== undefined && subscriptionData.price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El precio debe ser mayor a 0'
      });
    }

    if (subscriptionData.billing_cycle && !['monthly', 'quarterly', 'yearly'].includes(subscriptionData.billing_cycle)) {
      return res.status(400).json({
        success: false,
        message: 'Ciclo de facturación inválido'
      });
    }

    if (subscriptionData.status && !['active', 'inactive', 'cancelled', 'expired', 'suspended'].includes(subscriptionData.status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de suscripción inválido'
      });
    }

    // Obtener valores anteriores para auditoría
    const oldSubscription = await AdminSubscriptionsManagementService.getSubscriptionById(subscriptionId);

    const updatedSubscription = await AdminSubscriptionsManagementService.updateSubscription(subscriptionId, subscriptionData);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: subscriptionId.toString(),
      old_values: oldSubscription,
      new_values: updatedSubscription
    };

    res.json({
      success: true,
      message: 'Suscripción actualizada exitosamente',
      data: updatedSubscription
    });

  } catch (error) {
    console.error('Error actualizando suscripción:', error);
    
    if (error instanceof Error && error.message === 'Suscripción no encontrada') {
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
 * PATCH /api/admin/subscriptions/:id/cancel
 * Cancelar suscripción
 */
router.patch('/:id/cancel', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'subscription'), async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    
    if (isNaN(subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de suscripción inválido'
      });
    }

    const { reason } = req.body;

    // Obtener valores anteriores para auditoría
    const oldSubscription = await AdminSubscriptionsManagementService.getSubscriptionById(subscriptionId);

    const cancelledSubscription = await AdminSubscriptionsManagementService.cancelSubscription(subscriptionId, reason);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: subscriptionId.toString(),
      old_values: oldSubscription,
      new_values: cancelledSubscription,
      description: `Suscripción cancelada. Razón: ${reason || 'No especificada'}`
    };

    res.json({
      success: true,
      message: 'Suscripción cancelada exitosamente',
      data: cancelledSubscription
    });

  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Suscripción no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('ya está cancelada')) {
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
 * PATCH /api/admin/subscriptions/:id/reactivate
 * Reactivar suscripción
 */
router.patch('/:id/reactivate', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'subscription'), async (req, res) => {
  try {
    const subscriptionId = parseInt(req.params.id);
    
    if (isNaN(subscriptionId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de suscripción inválido'
      });
    }

    const { new_end_date } = req.body;

    // Obtener valores anteriores para auditoría
    const oldSubscription = await AdminSubscriptionsManagementService.getSubscriptionById(subscriptionId);

    const reactivatedSubscription = await AdminSubscriptionsManagementService.reactivateSubscription(subscriptionId, new_end_date);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: subscriptionId.toString(),
      old_values: oldSubscription,
      new_values: reactivatedSubscription,
      description: 'Suscripción reactivada'
    };

    res.json({
      success: true,
      message: 'Suscripción reactivada exitosamente',
      data: reactivatedSubscription
    });

  } catch (error) {
    console.error('Error reactivando suscripción:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Suscripción no encontrada') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('ya está activa')) {
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

export default router;
import express from 'express';
import { AdminPaymentsManagementService } from '../../services/adminPaymentsManagement.js';
import { authenticateAdmin, requireRole, logAdminActivity } from '../../middleware/adminAuth.js';
import type { 
  PaymentCreateRequest, 
  PaymentUpdateRequest,
  PaymentListFilters 
} from '../../../shared/types/index.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateAdmin);

/**
 * GET /api/admin/payments
 * Obtener lista de pagos con filtros y paginación
 */
router.get('/', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const filters: PaymentListFilters = {
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
      search: req.query.search as string,
      status: req.query.status as any,
      method: req.query.method as any,
      subscription_id: req.query.subscription_id ? parseInt(req.query.subscription_id as string) : undefined,
      date_range: req.query.start_date && req.query.end_date ? {
        start_date: req.query.start_date as string,
        end_date: req.query.end_date as string
      } : undefined,
      amount_range: req.query.min_amount && req.query.max_amount ? {
        min: parseFloat(req.query.min_amount as string),
        max: parseFloat(req.query.max_amount as string)
      } : undefined,
      sort_by: req.query.sort_by as string || 'created_at',
      sort_order: req.query.sort_order as 'asc' | 'desc' || 'desc'
    };

    const result = await AdminPaymentsManagementService.getPayments(filters);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Error obteniendo pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/payments/stats
 * Obtener estadísticas de pagos
 */
router.get('/stats', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const stats = await AdminPaymentsManagementService.getPaymentsStats();

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/payments/metrics
 * Obtener métricas de pagos
 */
router.get('/metrics', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const metrics = await AdminPaymentsManagementService.getPaymentsMetrics();

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error obteniendo métricas de pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/payments/:id
 * Obtener pago por ID
 */
router.get('/:id', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de pago inválido'
      });
    }

    const payment = await AdminPaymentsManagementService.getPaymentById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Pago no encontrado'
      });
    }

    res.json({
      success: true,
      data: payment
    });

  } catch (error) {
    console.error('Error obteniendo pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/admin/payments
 * Crear nuevo pago
 */
router.post('/', requireRole(['super_admin', 'admin']), logAdminActivity('create', 'payment'), async (req, res) => {
  try {
    const paymentData: PaymentCreateRequest = req.body;

    // Validaciones básicas
    if (!paymentData.coffee_grower_id || !paymentData.subscription_id) {
      return res.status(400).json({
        success: false,
        message: 'ID de caficultor y suscripción son requeridos'
      });
    }

    if (!paymentData.amount || paymentData.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    if (!paymentData.method || !['credit_card', 'debit_card', 'bank_transfer', 'pse', 'nequi', 'daviplata'].includes(paymentData.method)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pago inválido'
      });
    }

    if (!paymentData.currency || !['COP', 'USD'].includes(paymentData.currency)) {
      return res.status(400).json({
        success: false,
        message: 'Moneda inválida'
      });
    }

    const newPayment = await AdminPaymentsManagementService.createPayment(paymentData);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: newPayment.id.toString(),
      new_values: newPayment
    };

    res.status(201).json({
      success: true,
      message: 'Pago creado exitosamente',
      data: newPayment
    });

  } catch (error) {
    console.error('Error creando pago:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('no encontrado')) {
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
 * PUT /api/admin/payments/:id
 * Actualizar pago
 */
router.put('/:id', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'payment'), async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de pago inválido'
      });
    }

    const paymentData: PaymentUpdateRequest = req.body;

    // Validaciones
    if (paymentData.amount !== undefined && paymentData.amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto debe ser mayor a 0'
      });
    }

    if (paymentData.method && !['credit_card', 'debit_card', 'bank_transfer', 'pse', 'nequi', 'daviplata'].includes(paymentData.method)) {
      return res.status(400).json({
        success: false,
        message: 'Método de pago inválido'
      });
    }

    if (paymentData.status && !['pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'].includes(paymentData.status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado de pago inválido'
      });
    }

    if (paymentData.currency && !['COP', 'USD'].includes(paymentData.currency)) {
      return res.status(400).json({
        success: false,
        message: 'Moneda inválida'
      });
    }

    // Obtener valores anteriores para auditoría
    const oldPayment = await AdminPaymentsManagementService.getPaymentById(paymentId);

    const updatedPayment = await AdminPaymentsManagementService.updatePayment(paymentId, paymentData);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: paymentId.toString(),
      old_values: oldPayment,
      new_values: updatedPayment
    };

    res.json({
      success: true,
      message: 'Pago actualizado exitosamente',
      data: updatedPayment
    });

  } catch (error) {
    console.error('Error actualizando pago:', error);
    
    if (error instanceof Error && error.message === 'Pago no encontrado') {
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
 * POST /api/admin/payments/:id/process
 * Procesar pago con Wompi
 */
router.post('/:id/process', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'payment'), async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de pago inválido'
      });
    }

    const { payment_method_data } = req.body;

    // Obtener valores anteriores para auditoría
    const oldPayment = await AdminPaymentsManagementService.getPaymentById(paymentId);

    const processedPayment = await AdminPaymentsManagementService.processPaymentWithWompi(paymentId, payment_method_data);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: paymentId.toString(),
      old_values: oldPayment,
      new_values: processedPayment,
      description: 'Pago procesado con Wompi'
    };

    res.json({
      success: true,
      message: 'Pago procesado exitosamente',
      data: processedPayment
    });

  } catch (error) {
    console.error('Error procesando pago:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Pago no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('ya fue procesado') || error.message.includes('no puede ser procesado')) {
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
 * POST /api/admin/payments/:id/refund
 * Procesar reembolso
 */
router.post('/:id/refund', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'payment'), async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de pago inválido'
      });
    }

    const { amount, reason } = req.body;

    // Validaciones
    if (amount !== undefined && amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'El monto del reembolso debe ser mayor a 0'
      });
    }

    // Obtener valores anteriores para auditoría
    const oldPayment = await AdminPaymentsManagementService.getPaymentById(paymentId);

    const refundedPayment = await AdminPaymentsManagementService.processRefund(paymentId, amount, reason);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: paymentId.toString(),
      old_values: oldPayment,
      new_values: refundedPayment,
      description: `Reembolso procesado. Monto: ${amount || 'total'}. Razón: ${reason || 'No especificada'}`
    };

    res.json({
      success: true,
      message: 'Reembolso procesado exitosamente',
      data: refundedPayment
    });

  } catch (error) {
    console.error('Error procesando reembolso:', error);
    
    if (error instanceof Error) {
      if (error.message === 'Pago no encontrado') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      
      if (error.message.includes('no puede ser reembolsado') || error.message.includes('mayor al monto')) {
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
 * POST /api/admin/payments/:id/refresh
 * Actualizar estado del pago desde Wompi
 */
router.post('/:id/refresh', requireRole(['super_admin', 'admin']), logAdminActivity('update', 'payment'), async (req, res) => {
  try {
    const paymentId = parseInt(req.params.id);
    
    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de pago inválido'
      });
    }

    // Obtener valores anteriores para auditoría
    const oldPayment = await AdminPaymentsManagementService.getPaymentById(paymentId);

    const refreshedPayment = await AdminPaymentsManagementService.refreshPaymentStatus(paymentId);

    // Agregar información para auditoría
    req.auditInfo = {
      resource_id: paymentId.toString(),
      old_values: oldPayment,
      new_values: refreshedPayment,
      description: 'Estado del pago actualizado desde Wompi'
    };

    res.json({
      success: true,
      message: 'Estado del pago actualizado exitosamente',
      data: refreshedPayment
    });

  } catch (error) {
    console.error('Error actualizando estado del pago:', error);
    
    if (error instanceof Error && error.message === 'Pago no encontrado') {
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
 * GET /api/admin/payments/wompi/config
 * Obtener configuración pública de Wompi
 */
router.get('/wompi/config', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const config = await AdminPaymentsManagementService.getWompiPublicConfig();

    res.json({
      success: true,
      data: config
    });

  } catch (error) {
    console.error('Error obteniendo configuración de Wompi:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/admin/payments/wompi/test
 * Probar conexión con Wompi
 */
router.post('/wompi/test', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const testResult = await AdminPaymentsManagementService.testWompiConnection();

    res.json({
      success: testResult.success,
      message: testResult.message
    });

  } catch (error) {
    console.error('Error probando conexión con Wompi:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * POST /api/admin/payments/wompi/webhook
 * Webhook de Wompi (endpoint público)
 */
router.post('/wompi/webhook', async (req, res) => {
  try {
    const signature = req.headers['x-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Procesar webhook
    await AdminPaymentsManagementService.processWompiWebhook(payload, signature, req.body);

    res.status(200).json({
      success: true,
      message: 'Webhook procesado exitosamente'
    });

  } catch (error) {
    console.error('Error procesando webhook de Wompi:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando webhook',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;
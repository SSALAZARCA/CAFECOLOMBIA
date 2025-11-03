import express from 'express';
import { executeQuery, executeTransaction } from '../config/database.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Obtener lista de suscripciones
router.get('/', requirePermission('subscriptions.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = 'all',
    planId = '',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  
  // Construir condiciones WHERE
  let whereConditions = ['1=1'];
  const queryParams: any[] = [];

  if (search) {
    whereConditions.push(`(
      u.first_name LIKE ? OR 
      u.last_name LIKE ? OR 
      u.email LIKE ? OR
      sp.name LIKE ?
    )`);
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (status !== 'all') {
    whereConditions.push('s.status = ?');
    queryParams.push(status);
  }

  if (planId) {
    whereConditions.push('s.plan_id = ?');
    queryParams.push(planId);
  }

  const whereClause = whereConditions.join(' AND ');
  
  // Validar campos de ordenamiento
  const validSortFields = ['created_at', 'start_date', 'end_date', 'status'];
  const validSortOrders = ['asc', 'desc'];
  
  const finalSortBy = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
  const finalSortOrder = validSortOrders.includes(sortOrder as string) ? sortOrder : 'desc';

  try {
    // Obtener suscripciones con información del usuario y plan
    const subscriptionsQuery = `
      SELECT 
        s.id,
        s.status,
        s.start_date,
        s.end_date,
        s.auto_renew,
        s.created_at,
        s.updated_at,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        sp.id as plan_id,
        sp.name as plan_name,
        sp.price as plan_price,
        sp.duration_months,
        COUNT(p.id) as total_payments,
        COALESCE(SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END), 0) as total_paid
      FROM subscriptions s
      INNER JOIN users u ON s.user_id = u.id
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      LEFT JOIN payments p ON s.id = p.subscription_id
      WHERE ${whereClause}
      GROUP BY s.id
      ORDER BY s.${finalSortBy} ${finalSortOrder}
      LIMIT ? OFFSET ?
    `;

    // Obtener total de registros para paginación
    const countQuery = `
      SELECT COUNT(s.id) as total
      FROM subscriptions s
      INNER JOIN users u ON s.user_id = u.id
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE ${whereClause}
    `;

    const [subscriptions, countResult] = await Promise.all([
      executeQuery(subscriptionsQuery, [...queryParams, Number(limit), offset]),
      executeQuery(countQuery, queryParams)
    ]);

    const total = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      subscriptions,
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
    console.error('Error obteniendo suscripciones:', error);
    throw createError('Error obteniendo lista de suscripciones', 500);
  }
}));

// Obtener suscripción específica
router.get('/:id', requirePermission('subscriptions.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const [subscriptionResult, paymentsResult] = await Promise.all([
      // Información de la suscripción
      executeQuery(`
        SELECT 
          s.*,
          u.first_name,
          u.last_name,
          u.email,
          u.phone,
          sp.name as plan_name,
          sp.description as plan_description,
          sp.price as plan_price,
          sp.duration_months,
          sp.features as plan_features
        FROM subscriptions s
        INNER JOIN users u ON s.user_id = u.id
        INNER JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.id = ?
      `, [id]),

      // Historial de pagos de la suscripción
      executeQuery(`
        SELECT 
          p.id,
          p.amount,
          p.status,
          p.payment_method,
          p.transaction_id,
          p.wompi_transaction_id,
          p.created_at,
          p.completed_at,
          p.failure_reason
        FROM payments p
        WHERE p.subscription_id = ?
        ORDER BY p.created_at DESC
      `, [id])
    ]);

    const subscription = (subscriptionResult as any[])[0];
    if (!subscription) {
      throw createError('Suscripción no encontrada', 404);
    }

    res.json({
      subscription,
      payments: paymentsResult
    });

  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    throw createError('Error obteniendo información de la suscripción', 500);
  }
}));

// Crear nueva suscripción
router.post('/', requirePermission('subscriptions.create'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    userId,
    planId,
    startDate,
    autoRenew = true
  } = req.body;

  // Validaciones básicas
  if (!userId || !planId) {
    throw createError('ID de usuario y plan son requeridos', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      // Verificar que el usuario existe y está activo
      const [userResult] = await connection.execute(
        'SELECT id, email FROM users WHERE id = ? AND is_active = true',
        [userId]
      ) as any[];

      if (!userResult || userResult.length === 0) {
        throw createError('Usuario no encontrado o inactivo', 404);
      }

      // Verificar que el plan existe y está activo
      const [planResult] = await connection.execute(
        'SELECT id, name, price, duration_months FROM subscription_plans WHERE id = ? AND is_active = true',
        [planId]
      ) as any[];

      if (!planResult || planResult.length === 0) {
        throw createError('Plan de suscripción no encontrado o inactivo', 404);
      }

      const plan = planResult[0];

      // Verificar que el usuario no tenga una suscripción activa
      const [activeSubscription] = await connection.execute(
        'SELECT id FROM subscriptions WHERE user_id = ? AND status = "active"',
        [userId]
      ) as any[];

      if (activeSubscription && activeSubscription.length > 0) {
        throw createError('El usuario ya tiene una suscripción activa', 409);
      }

      // Calcular fechas
      const start = startDate ? new Date(startDate) : new Date();
      const end = new Date(start);
      end.setMonth(end.getMonth() + plan.duration_months);

      // Crear suscripción
      const [subscriptionResult] = await connection.execute(`
        INSERT INTO subscriptions (
          user_id, plan_id, status, start_date, end_date, auto_renew, created_at, updated_at
        ) VALUES (?, ?, 'active', ?, ?, ?, NOW(), NOW())
      `, [userId, planId, start, end, autoRenew]) as any[];

      const subscriptionId = subscriptionResult.insertId;

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'create', 'subscription', ?, ?, ?)
      `, [
        req.user!.id,
        subscriptionId,
        JSON.stringify({ userId, planId, planName: plan.name }),
        req.ip
      ]);

      return subscriptionId;
    });

    // Obtener la suscripción creada
    const [newSubscription] = await executeQuery(`
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        sp.name as plan_name,
        sp.price as plan_price
      FROM subscriptions s
      INNER JOIN users u ON s.user_id = u.id
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.id = ?
    `, [subscriptionId]) as any[];

    res.status(201).json({
      message: 'Suscripción creada exitosamente',
      subscription: newSubscription[0]
    });

  } catch (error) {
    console.error('Error creando suscripción:', error);
    throw createError('Error creando suscripción', 500);
  }
}));

// Actualizar suscripción
router.put('/:id', requirePermission('subscriptions.edit'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const {
    status,
    endDate,
    autoRenew,
    cancellationReason
  } = req.body;

  try {
    // Verificar que la suscripción existe
    const [existingSubscription] = await executeQuery(
      'SELECT id, status, user_id FROM subscriptions WHERE id = ?',
      [id]
    ) as any[];

    if (!existingSubscription || existingSubscription.length === 0) {
      throw createError('Suscripción no encontrada', 404);
    }

    const subscription = existingSubscription[0];

    // Validaciones de estado
    if (status && !['active', 'cancelled', 'expired', 'suspended'].includes(status)) {
      throw createError('Estado de suscripción inválido', 400);
    }

    // Si se está cancelando, verificar razón
    if (status === 'cancelled' && !cancellationReason) {
      throw createError('Razón de cancelación es requerida', 400);
    }

    // Actualizar suscripción
    const updateFields = [];
    const updateValues = [];

    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
    }

    if (endDate !== undefined) {
      updateFields.push('end_date = ?');
      updateValues.push(endDate);
    }

    if (autoRenew !== undefined) {
      updateFields.push('auto_renew = ?');
      updateValues.push(autoRenew);
    }

    if (cancellationReason !== undefined) {
      updateFields.push('cancellation_reason = ?');
      updateValues.push(cancellationReason);
    }

    updateFields.push('updated_at = NOW()');
    updateValues.push(id);

    await executeQuery(`
      UPDATE subscriptions SET ${updateFields.join(', ')}
      WHERE id = ?
    `, updateValues);

    // Log de auditoría
    await executeQuery(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, 'update', 'subscription', ?, ?, ?)
    `, [
      req.user!.id,
      id,
      JSON.stringify({ 
        updatedFields: Object.keys(req.body),
        previousStatus: subscription.status,
        newStatus: status 
      }),
      req.ip
    ]);

    // Obtener suscripción actualizada
    const [updatedSubscription] = await executeQuery(`
      SELECT 
        s.*,
        u.first_name,
        u.last_name,
        u.email,
        sp.name as plan_name
      FROM subscriptions s
      INNER JOIN users u ON s.user_id = u.id
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.id = ?
    `, [id]) as any[];

    res.json({
      message: 'Suscripción actualizada exitosamente',
      subscription: updatedSubscription[0]
    });

  } catch (error) {
    console.error('Error actualizando suscripción:', error);
    throw createError('Error actualizando suscripción', 500);
  }
}));

// Cancelar suscripción
router.post('/:id/cancel', requirePermission('subscriptions.edit'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason, immediate = false } = req.body;

  if (!reason) {
    throw createError('Razón de cancelación es requerida', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      // Verificar que la suscripción existe y está activa
      const [subscriptionResult] = await connection.execute(
        'SELECT id, status, end_date, user_id FROM subscriptions WHERE id = ?',
        [id]
      ) as any[];

      if (!subscriptionResult || subscriptionResult.length === 0) {
        throw createError('Suscripción no encontrada', 404);
      }

      const subscription = subscriptionResult[0];

      if (subscription.status !== 'active') {
        throw createError('Solo se pueden cancelar suscripciones activas', 400);
      }

      // Determinar fecha de cancelación
      const cancellationDate = immediate ? new Date() : new Date(subscription.end_date);

      // Actualizar suscripción
      await connection.execute(`
        UPDATE subscriptions SET 
          status = ?, 
          end_date = ?, 
          auto_renew = false,
          cancellation_reason = ?,
          cancelled_at = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `, [
        immediate ? 'cancelled' : 'active',
        cancellationDate,
        reason,
        id
      ]);

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'cancel', 'subscription', ?, ?, ?)
      `, [
        req.user!.id,
        id,
        JSON.stringify({ reason, immediate, userId: subscription.user_id }),
        req.ip
      ]);
    });

    res.json({
      message: immediate 
        ? 'Suscripción cancelada inmediatamente' 
        : 'Suscripción programada para cancelación al final del período'
    });

  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    throw createError('Error cancelando suscripción', 500);
  }
}));

// Renovar suscripción
router.post('/:id/renew', requirePermission('subscriptions.edit'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { planId } = req.body;

  try {
    await executeTransaction(async (connection) => {
      // Verificar que la suscripción existe
      const [subscriptionResult] = await connection.execute(
        'SELECT id, status, plan_id, end_date, user_id FROM subscriptions WHERE id = ?',
        [id]
      ) as any[];

      if (!subscriptionResult || subscriptionResult.length === 0) {
        throw createError('Suscripción no encontrada', 404);
      }

      const subscription = subscriptionResult[0];

      // Obtener información del plan (actual o nuevo)
      const targetPlanId = planId || subscription.plan_id;
      const [planResult] = await connection.execute(
        'SELECT id, name, duration_months FROM subscription_plans WHERE id = ? AND is_active = true',
        [targetPlanId]
      ) as any[];

      if (!planResult || planResult.length === 0) {
        throw createError('Plan de suscripción no encontrado o inactivo', 404);
      }

      const plan = planResult[0];

      // Calcular nueva fecha de fin
      const currentEndDate = new Date(subscription.end_date);
      const newEndDate = new Date(currentEndDate);
      newEndDate.setMonth(newEndDate.getMonth() + plan.duration_months);

      // Actualizar suscripción
      await connection.execute(`
        UPDATE subscriptions SET 
          plan_id = ?,
          status = 'active',
          end_date = ?,
          auto_renew = true,
          updated_at = NOW()
        WHERE id = ?
      `, [targetPlanId, newEndDate, id]);

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'renew', 'subscription', ?, ?, ?)
      `, [
        req.user!.id,
        id,
        JSON.stringify({ 
          planId: targetPlanId, 
          planName: plan.name,
          newEndDate,
          userId: subscription.user_id 
        }),
        req.ip
      ]);
    });

    res.json({
      message: 'Suscripción renovada exitosamente'
    });

  } catch (error) {
    console.error('Error renovando suscripción:', error);
    throw createError('Error renovando suscripción', 500);
  }
}));

// Estadísticas de suscripciones
router.get('/stats/overview', requirePermission('subscriptions.view'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const [stats] = await Promise.all([
      executeQuery(`
        SELECT 
          COUNT(*) as total_subscriptions,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
          COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
          COUNT(CASE WHEN status = 'expired' THEN 1 END) as expired_subscriptions,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended_subscriptions,
          COUNT(CASE WHEN auto_renew = true AND status = 'active' THEN 1 END) as auto_renew_subscriptions,
          COALESCE(AVG(DATEDIFF(end_date, start_date)), 0) as avg_duration_days
        FROM subscriptions
      `)
    ]);

    // Obtener distribución por plan
    const [planDistribution] = await executeQuery(`
      SELECT 
        sp.name as plan_name,
        COUNT(s.id) as subscription_count,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_count
      FROM subscription_plans sp
      LEFT JOIN subscriptions s ON sp.id = s.plan_id
      WHERE sp.is_active = true
      GROUP BY sp.id, sp.name
      ORDER BY subscription_count DESC
    `);

    // Obtener tendencia mensual
    const [monthlyTrend] = await executeQuery(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        COUNT(*) as new_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_new
      FROM subscriptions
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month ASC
    `);

    res.json({
      ...(stats as any[])[0],
      planDistribution,
      monthlyTrend
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de suscripciones:', error);
    throw createError('Error obteniendo estadísticas de suscripciones', 500);
  }
}));

export default router;
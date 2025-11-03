import express from 'express';
import { executeQuery, executeTransaction } from '../config/database.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Obtener lista de pagos
router.get('/', requirePermission('payments.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = 'all',
    paymentMethod = 'all',
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
      u.first_name LIKE ? OR 
      u.last_name LIKE ? OR 
      u.email LIKE ? OR
      p.transaction_id LIKE ? OR
      p.wompi_transaction_id LIKE ?
    )`);
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
  }

  if (status !== 'all') {
    whereConditions.push('p.status = ?');
    queryParams.push(status);
  }

  if (paymentMethod !== 'all') {
    whereConditions.push('p.payment_method = ?');
    queryParams.push(paymentMethod);
  }

  if (dateFrom) {
    whereConditions.push('DATE(p.created_at) >= ?');
    queryParams.push(dateFrom);
  }

  if (dateTo) {
    whereConditions.push('DATE(p.created_at) <= ?');
    queryParams.push(dateTo);
  }

  const whereClause = whereConditions.join(' AND ');
  
  // Validar campos de ordenamiento
  const validSortFields = ['created_at', 'amount', 'status', 'completed_at'];
  const validSortOrders = ['asc', 'desc'];
  
  const finalSortBy = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
  const finalSortOrder = validSortOrders.includes(sortOrder as string) ? sortOrder : 'desc';

  try {
    // Obtener pagos con información del usuario y suscripción
    const paymentsQuery = `
      SELECT 
        p.id,
        p.amount,
        p.status,
        p.payment_method,
        p.transaction_id,
        p.wompi_transaction_id,
        p.created_at,
        p.completed_at,
        p.failure_reason,
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        s.id as subscription_id,
        sp.name as plan_name,
        sp.price as plan_price
      FROM payments p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE ${whereClause}
      ORDER BY p.${finalSortBy} ${finalSortOrder}
      LIMIT ? OFFSET ?
    `;

    // Obtener total de registros para paginación
    const countQuery = `
      SELECT COUNT(p.id) as total
      FROM payments p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE ${whereClause}
    `;

    const [payments, countResult] = await Promise.all([
      executeQuery(paymentsQuery, [...queryParams, Number(limit), offset]),
      executeQuery(countQuery, queryParams)
    ]);

    const total = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      payments,
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
    console.error('Error obteniendo pagos:', error);
    throw createError('Error obteniendo lista de pagos', 500);
  }
}));

// Obtener pago específico
router.get('/:id', requirePermission('payments.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const [paymentResult] = await executeQuery(`
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.email,
        u.phone,
        s.id as subscription_id,
        s.status as subscription_status,
        s.start_date,
        s.end_date,
        sp.name as plan_name,
        sp.description as plan_description,
        sp.price as plan_price,
        sp.duration_months
      FROM payments p
      INNER JOIN users u ON p.user_id = u.id
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE p.id = ?
    `, [id]);

    const payment = (paymentResult as any[])[0];
    if (!payment) {
      throw createError('Pago no encontrado', 404);
    }

    res.json({
      payment
    });

  } catch (error) {
    console.error('Error obteniendo pago:', error);
    throw createError('Error obteniendo información del pago', 500);
  }
}));

// Crear nuevo pago
router.post('/', requirePermission('payments.create'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    userId,
    subscriptionId,
    amount,
    paymentMethod,
    transactionId,
    wompiTransactionId
  } = req.body;

  // Validaciones básicas
  if (!userId || !amount || !paymentMethod) {
    throw createError('ID de usuario, monto y método de pago son requeridos', 400);
  }

  if (amount <= 0) {
    throw createError('El monto debe ser mayor a 0', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      // Verificar que el usuario existe
      const [userResult] = await connection.execute(
        'SELECT id, email FROM users WHERE id = ? AND is_active = true',
        [userId]
      ) as any[];

      if (!userResult || userResult.length === 0) {
        throw createError('Usuario no encontrado o inactivo', 404);
      }

      // Si hay suscripción, verificar que existe
      if (subscriptionId) {
        const [subscriptionResult] = await connection.execute(
          'SELECT id, user_id FROM subscriptions WHERE id = ?',
          [subscriptionId]
        ) as any[];

        if (!subscriptionResult || subscriptionResult.length === 0) {
          throw createError('Suscripción no encontrada', 404);
        }

        if (subscriptionResult[0].user_id !== userId) {
          throw createError('La suscripción no pertenece al usuario especificado', 400);
        }
      }

      // Crear pago
      const [paymentResult] = await connection.execute(`
        INSERT INTO payments (
          user_id, subscription_id, amount, status, payment_method, 
          transaction_id, wompi_transaction_id, created_at, updated_at
        ) VALUES (?, ?, ?, 'pending', ?, ?, ?, NOW(), NOW())
      `, [
        userId, subscriptionId, amount, paymentMethod, 
        transactionId, wompiTransactionId
      ]) as any[];

      const paymentId = paymentResult.insertId;

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'create', 'payment', ?, ?, ?)
      `, [
        req.user!.id,
        paymentId,
        JSON.stringify({ userId, amount, paymentMethod, subscriptionId }),
        req.ip
      ]);

      return paymentId;
    });

    // Obtener el pago creado
    const [newPayment] = await executeQuery(`
      SELECT 
        p.*,
        u.first_name,
        u.last_name,
        u.email
      FROM payments p
      INNER JOIN users u ON p.user_id = u.id
      WHERE p.id = ?
    `, [paymentId]) as any[];

    res.status(201).json({
      message: 'Pago creado exitosamente',
      payment: newPayment[0]
    });

  } catch (error) {
    console.error('Error creando pago:', error);
    throw createError('Error creando pago', 500);
  }
}));

// Actualizar estado de pago
router.put('/:id/status', requirePermission('payments.edit'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { status, failureReason, wompiTransactionId } = req.body;

  // Validaciones
  if (!status || !['pending', 'completed', 'failed', 'refunded'].includes(status)) {
    throw createError('Estado de pago inválido', 400);
  }

  if (status === 'failed' && !failureReason) {
    throw createError('Razón de falla es requerida para pagos fallidos', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      // Verificar que el pago existe
      const [paymentResult] = await connection.execute(
        'SELECT id, status, user_id, subscription_id FROM payments WHERE id = ?',
        [id]
      ) as any[];

      if (!paymentResult || paymentResult.length === 0) {
        throw createError('Pago no encontrado', 404);
      }

      const payment = paymentResult[0];

      // Actualizar pago
      const updateFields = ['status = ?', 'updated_at = NOW()'];
      const updateValues = [status];

      if (status === 'completed') {
        updateFields.push('completed_at = NOW()');
      }

      if (status === 'failed' && failureReason) {
        updateFields.push('failure_reason = ?');
        updateValues.push(failureReason);
      }

      if (wompiTransactionId) {
        updateFields.push('wompi_transaction_id = ?');
        updateValues.push(wompiTransactionId);
      }

      updateValues.push(id);

      await connection.execute(`
        UPDATE payments SET ${updateFields.join(', ')}
        WHERE id = ?
      `, updateValues);

      // Si el pago se completó y hay suscripción, activarla si está pendiente
      if (status === 'completed' && payment.subscription_id) {
        await connection.execute(`
          UPDATE subscriptions SET 
            status = CASE 
              WHEN status = 'pending' THEN 'active'
              ELSE status
            END,
            updated_at = NOW()
          WHERE id = ?
        `, [payment.subscription_id]);
      }

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'update_status', 'payment', ?, ?, ?)
      `, [
        req.user!.id,
        id,
        JSON.stringify({ 
          previousStatus: payment.status, 
          newStatus: status,
          failureReason,
          userId: payment.user_id 
        }),
        req.ip
      ]);
    });

    res.json({
      message: 'Estado del pago actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando estado del pago:', error);
    throw createError('Error actualizando estado del pago', 500);
  }
}));

// Procesar reembolso
router.post('/:id/refund', requirePermission('payments.refund'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const { reason, amount } = req.body;

  if (!reason) {
    throw createError('Razón del reembolso es requerida', 400);
  }

  try {
    await executeTransaction(async (connection) => {
      // Verificar que el pago existe y está completado
      const [paymentResult] = await connection.execute(
        'SELECT id, status, amount as original_amount, user_id FROM payments WHERE id = ?',
        [id]
      ) as any[];

      if (!paymentResult || paymentResult.length === 0) {
        throw createError('Pago no encontrado', 404);
      }

      const payment = paymentResult[0];

      if (payment.status !== 'completed') {
        throw createError('Solo se pueden reembolsar pagos completados', 400);
      }

      const refundAmount = amount || payment.original_amount;

      if (refundAmount > payment.original_amount) {
        throw createError('El monto del reembolso no puede ser mayor al pago original', 400);
      }

      // Actualizar estado del pago
      await connection.execute(`
        UPDATE payments SET 
          status = 'refunded',
          refund_amount = ?,
          refund_reason = ?,
          refunded_at = NOW(),
          updated_at = NOW()
        WHERE id = ?
      `, [refundAmount, reason, id]);

      // Log de auditoría
      await connection.execute(`
        INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
        VALUES (?, 'refund', 'payment', ?, ?, ?)
      `, [
        req.user!.id,
        id,
        JSON.stringify({ 
          reason, 
          refundAmount, 
          originalAmount: payment.original_amount,
          userId: payment.user_id 
        }),
        req.ip
      ]);
    });

    res.json({
      message: 'Reembolso procesado exitosamente'
    });

  } catch (error) {
    console.error('Error procesando reembolso:', error);
    throw createError('Error procesando reembolso', 500);
  }
}));

// Estadísticas de pagos
router.get('/stats/overview', requirePermission('payments.view'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const [stats] = await Promise.all([
      executeQuery(`
        SELECT 
          COUNT(*) as total_payments,
          COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments,
          COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_payments,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_payments,
          COUNT(CASE WHEN status = 'refunded' THEN 1 END) as refunded_payments,
          COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as total_revenue,
          COALESCE(SUM(CASE WHEN status = 'refunded' THEN refund_amount ELSE 0 END), 0) as total_refunds,
          COALESCE(AVG(CASE WHEN status = 'completed' THEN amount ELSE NULL END), 0) as avg_payment_amount
        FROM payments
      `)
    ]);

    // Obtener distribución por método de pago
    const [paymentMethodDistribution] = await executeQuery(`
      SELECT 
        payment_method,
        COUNT(*) as payment_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as revenue
      FROM payments
      GROUP BY payment_method
      ORDER BY payment_count DESC
    `);

    // Obtener tendencia mensual de ingresos
    const [monthlyRevenue] = await executeQuery(`
      SELECT 
        DATE_FORMAT(completed_at, '%Y-%m') as month,
        COUNT(*) as payment_count,
        COALESCE(SUM(amount), 0) as revenue
      FROM payments
      WHERE status = 'completed' 
        AND completed_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(completed_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Obtener estadísticas diarias de la semana actual
    const [dailyStats] = await executeQuery(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as payment_count,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_count,
        COALESCE(SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END), 0) as revenue
      FROM payments
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date ASC
    `);

    res.json({
      ...(stats as any[])[0],
      paymentMethodDistribution,
      monthlyRevenue,
      dailyStats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de pagos:', error);
    throw createError('Error obteniendo estadísticas de pagos', 500);
  }
}));

// Webhook para Wompi (sin autenticación)
router.post('/webhook/wompi', asyncHandler(async (req, res) => {
  const { event, data } = req.body;

  try {
    if (event === 'transaction.updated') {
      const { id: wompiTransactionId, status, reference } = data;

      // Buscar el pago por referencia o ID de transacción de Wompi
      const [paymentResult] = await executeQuery(`
        SELECT id, status as current_status, user_id 
        FROM payments 
        WHERE wompi_transaction_id = ? OR transaction_id = ?
      `, [wompiTransactionId, reference]) as any[];

      if (paymentResult && paymentResult.length > 0) {
        const payment = paymentResult[0];
        let newStatus = payment.current_status;

        // Mapear estados de Wompi a nuestros estados
        switch (status) {
          case 'APPROVED':
            newStatus = 'completed';
            break;
          case 'DECLINED':
          case 'ERROR':
            newStatus = 'failed';
            break;
          case 'PENDING':
            newStatus = 'pending';
            break;
        }

        // Actualizar solo si el estado cambió
        if (newStatus !== payment.current_status) {
          await executeTransaction(async (connection) => {
            await connection.execute(`
              UPDATE payments SET 
                status = ?,
                wompi_transaction_id = ?,
                completed_at = CASE WHEN ? = 'completed' THEN NOW() ELSE completed_at END,
                updated_at = NOW()
              WHERE id = ?
            `, [newStatus, wompiTransactionId, newStatus, payment.id]);

            // Log de auditoría para webhook
            await connection.execute(`
              INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
              VALUES (?, 'webhook_update', 'payment', ?, ?, ?)
            `, [
              payment.user_id,
              payment.id,
              JSON.stringify({ 
                event, 
                wompiStatus: status, 
                newStatus,
                wompiTransactionId 
              }),
              req.ip
            ]);
          });
        }
      }
    }

    res.status(200).json({ received: true });

  } catch (error) {
    console.error('Error procesando webhook de Wompi:', error);
    res.status(500).json({ error: 'Error procesando webhook' });
  }
}));

export default router;
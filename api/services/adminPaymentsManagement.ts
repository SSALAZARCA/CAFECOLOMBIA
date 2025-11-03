import { executeQuery, executeTransaction } from '../config/database.js';
import type {
  Payment,
  PaymentCreateRequest,
  PaymentUpdateRequest,
  PaymentListFilters,
  PaymentListResponse,
  PaymentStats,
  PaymentMetrics
} from '../../shared/types/index.js';

export class AdminPaymentsManagementService {
  
  /**
   * Obtener lista de pagos con filtros y paginación
   */
  static async getPayments(filters: PaymentListFilters): Promise<PaymentListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      payment_method,
      payment_provider,
      date_range,
      amount_range,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    const offset = (page - 1) * limit;
    
    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push(`(
        cg.first_name LIKE ? OR 
        cg.last_name LIKE ? OR 
        cg.email LIKE ? OR 
        cg.identification_number LIKE ? OR
        p.provider_transaction_id LIKE ? OR
        p.provider_reference LIKE ?
      )`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      conditions.push('p.status = ?');
      params.push(status);
    }

    if (payment_method) {
      conditions.push('p.payment_method = ?');
      params.push(payment_method);
    }

    if (payment_provider) {
      conditions.push('p.payment_provider = ?');
      params.push(payment_provider);
    }

    if (date_range?.start_date) {
      conditions.push('p.created_at >= ?');
      params.push(date_range.start_date);
    }

    if (date_range?.end_date) {
      conditions.push('p.created_at <= ?');
      params.push(date_range.end_date);
    }

    if (amount_range?.min_amount) {
      conditions.push('p.amount >= ?');
      params.push(amount_range.min_amount);
    }

    if (amount_range?.max_amount) {
      conditions.push('p.amount <= ?');
      params.push(amount_range.max_amount);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para obtener el total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM payments p
      INNER JOIN coffee_growers cg ON p.coffee_grower_id = cg.id
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      ${whereClause}
    `;

    const [countResult] = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult.total;

    // Query para obtener los pagos
    const paymentsQuery = `
      SELECT 
        p.id,
        p.subscription_id,
        p.coffee_grower_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_provider,
        p.provider_transaction_id,
        p.provider_reference,
        p.status,
        p.payment_date,
        p.description,
        p.metadata,
        p.failure_reason,
        p.refund_amount,
        p.refund_date,
        p.created_at,
        p.updated_at,
        cg.first_name as grower_first_name,
        cg.last_name as grower_last_name,
        cg.email as grower_email,
        cg.identification_number as grower_identification,
        s.id as subscription_id,
        sp.name as plan_name
      FROM payments p
      INNER JOIN coffee_growers cg ON p.coffee_grower_id = cg.id
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      ${whereClause}
      ORDER BY p.${sort_by} ${sort_order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const payments = await executeQuery<any>(paymentsQuery, [...params, limit, offset]);

    // Procesar los resultados
    const processedPayments = payments.map(payment => ({
      id: payment.id,
      subscription_id: payment.subscription_id,
      coffee_grower_id: payment.coffee_grower_id,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      payment_provider: payment.payment_provider,
      provider_transaction_id: payment.provider_transaction_id,
      provider_reference: payment.provider_reference,
      status: payment.status,
      payment_date: payment.payment_date,
      description: payment.description,
      metadata: typeof payment.metadata === 'string' ? JSON.parse(payment.metadata || '{}') : payment.metadata,
      failure_reason: payment.failure_reason,
      refund_amount: payment.refund_amount,
      refund_date: payment.refund_date,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      coffee_grower: {
        id: payment.coffee_grower_id,
        first_name: payment.grower_first_name,
        last_name: payment.grower_last_name,
        email: payment.grower_email,
        identification_number: payment.grower_identification
      },
      subscription: payment.subscription_id ? {
        id: payment.subscription_id,
        plan_name: payment.plan_name
      } : null
    }));

    return {
      payments: processedPayments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener pago por ID
   */
  static async getPaymentById(id: number): Promise<Payment | null> {
    const query = `
      SELECT 
        p.id,
        p.subscription_id,
        p.coffee_grower_id,
        p.amount,
        p.currency,
        p.payment_method,
        p.payment_provider,
        p.provider_transaction_id,
        p.provider_reference,
        p.status,
        p.payment_date,
        p.description,
        p.metadata,
        p.failure_reason,
        p.refund_amount,
        p.refund_date,
        p.created_at,
        p.updated_at,
        cg.first_name as grower_first_name,
        cg.last_name as grower_last_name,
        cg.email as grower_email,
        cg.identification_number as grower_identification,
        s.id as subscription_id,
        sp.name as plan_name,
        sp.description as plan_description
      FROM payments p
      INNER JOIN coffee_growers cg ON p.coffee_grower_id = cg.id
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE p.id = ?
    `;

    const [payment] = await executeQuery<any>(query, [id]);
    
    if (!payment) return null;

    return {
      id: payment.id,
      subscription_id: payment.subscription_id,
      coffee_grower_id: payment.coffee_grower_id,
      amount: payment.amount,
      currency: payment.currency,
      payment_method: payment.payment_method,
      payment_provider: payment.payment_provider,
      provider_transaction_id: payment.provider_transaction_id,
      provider_reference: payment.provider_reference,
      status: payment.status,
      payment_date: payment.payment_date,
      description: payment.description,
      metadata: typeof payment.metadata === 'string' ? JSON.parse(payment.metadata || '{}') : payment.metadata,
      failure_reason: payment.failure_reason,
      refund_amount: payment.refund_amount,
      refund_date: payment.refund_date,
      created_at: payment.created_at,
      updated_at: payment.updated_at,
      coffee_grower: {
        id: payment.coffee_grower_id,
        first_name: payment.grower_first_name,
        last_name: payment.grower_last_name,
        email: payment.grower_email,
        identification_number: payment.grower_identification
      },
      subscription: payment.subscription_id ? {
        id: payment.subscription_id,
        plan_name: payment.plan_name,
        plan_description: payment.plan_description
      } : null
    };
  }

  /**
   * Crear nuevo pago
   */
  static async createPayment(paymentData: PaymentCreateRequest): Promise<Payment> {
    const {
      subscription_id,
      coffee_grower_id,
      amount,
      currency = 'COP',
      payment_method,
      payment_provider = 'wompi',
      description,
      metadata = {}
    } = paymentData;

    // Verificar que el caficultor existe
    const growerQuery = 'SELECT id FROM coffee_growers WHERE id = ? AND deleted_at IS NULL';
    const [grower] = await executeQuery(growerQuery, [coffee_grower_id]);
    if (!grower) {
      throw new Error('Caficultor no encontrado');
    }

    // Si hay subscription_id, verificar que existe
    if (subscription_id) {
      const subscriptionQuery = 'SELECT id FROM subscriptions WHERE id = ?';
      const [subscription] = await executeQuery(subscriptionQuery, [subscription_id]);
      if (!subscription) {
        throw new Error('Suscripción no encontrada');
      }
    }

    const query = `
      INSERT INTO payments (
        subscription_id, coffee_grower_id, amount, currency,
        payment_method, payment_provider, status, description, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `;

    const params = [
      subscription_id,
      coffee_grower_id,
      amount,
      currency,
      payment_method,
      payment_provider,
      description,
      JSON.stringify(metadata)
    ];

    const [result] = await executeQuery<any>(query, params);
    const paymentId = result.insertId;

    const createdPayment = await this.getPaymentById(paymentId);
    if (!createdPayment) {
      throw new Error('Error al crear el pago');
    }

    return createdPayment;
  }

  /**
   * Actualizar pago
   */
  static async updatePayment(id: number, paymentData: PaymentUpdateRequest): Promise<Payment> {
    // Verificar que el pago existe
    const existingPayment = await this.getPaymentById(id);
    if (!existingPayment) {
      throw new Error('Pago no encontrado');
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    // Construir query dinámicamente
    Object.entries(paymentData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'metadata') {
          updateFields.push(`${key} = ?`);
          params.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = ?`);
          params.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      return existingPayment;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `
      UPDATE payments 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await executeQuery(query, params);

    const updatedPayment = await this.getPaymentById(id);
    if (!updatedPayment) {
      throw new Error('Error al actualizar el pago');
    }

    return updatedPayment;
  }

  /**
   * Procesar pago con Wompi
   */
  static async processPaymentWithWompi(paymentId: number, paymentData: any): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Pago no encontrado');
    }

    if (payment.status !== 'pending') {
      throw new Error('El pago no está en estado pendiente');
    }

    try {
      // Aquí iría la integración real con Wompi
      // Por ahora simulamos el proceso
      const wompiResponse = await this.callWompiAPI(payment, paymentData);

      // Actualizar el pago con la respuesta de Wompi
      const updateData: PaymentUpdateRequest = {
        status: wompiResponse.status === 'APPROVED' ? 'completed' : 'failed',
        provider_transaction_id: wompiResponse.id,
        provider_reference: wompiResponse.reference,
        payment_date: wompiResponse.status === 'APPROVED' ? new Date().toISOString() : undefined,
        failure_reason: wompiResponse.status !== 'APPROVED' ? wompiResponse.status_message : undefined,
        metadata: {
          ...payment.metadata,
          wompi_response: wompiResponse
        }
      };

      return await this.updatePayment(paymentId, updateData);

    } catch (error) {
      // Marcar el pago como fallido
      await this.updatePayment(paymentId, {
        status: 'failed',
        failure_reason: error instanceof Error ? error.message : 'Error desconocido'
      });
      throw error;
    }
  }

  /**
   * Procesar reembolso
   */
  static async processRefund(paymentId: number, refundAmount?: number, reason?: string): Promise<Payment> {
    const payment = await this.getPaymentById(paymentId);
    if (!payment) {
      throw new Error('Pago no encontrado');
    }

    if (payment.status !== 'completed') {
      throw new Error('Solo se pueden reembolsar pagos completados');
    }

    if (payment.refund_amount && payment.refund_amount > 0) {
      throw new Error('Este pago ya tiene un reembolso procesado');
    }

    const finalRefundAmount = refundAmount || payment.amount;

    if (finalRefundAmount > payment.amount) {
      throw new Error('El monto del reembolso no puede ser mayor al monto del pago');
    }

    try {
      // Aquí iría la integración real con Wompi para el reembolso
      const wompiRefundResponse = await this.callWompiRefundAPI(payment, finalRefundAmount, reason);

      // Actualizar el pago con el reembolso
      const updateData: PaymentUpdateRequest = {
        status: finalRefundAmount === payment.amount ? 'refunded' : 'completed',
        refund_amount: finalRefundAmount,
        refund_date: new Date().toISOString(),
        metadata: {
          ...payment.metadata,
          refund_response: wompiRefundResponse,
          refund_reason: reason
        }
      };

      return await this.updatePayment(paymentId, updateData);

    } catch (error) {
      throw new Error(`Error procesando reembolso: ${error instanceof Error ? error.message : 'Error desconocido'}`);
    }
  }

  /**
   * Obtener estadísticas de pagos
   */
  static async getPaymentsStats(): Promise<PaymentStats> {
    const queries = [
      // Total de pagos
      'SELECT COUNT(*) as total FROM payments',
      
      // Pagos por estado
      `SELECT 
        status,
        COUNT(*) as count,
        SUM(amount) as total_amount
       FROM payments 
       GROUP BY status`,
      
      // Pagos por método
      `SELECT 
        payment_method,
        COUNT(*) as count,
        SUM(amount) as total_amount
       FROM payments 
       WHERE status = 'completed'
       GROUP BY payment_method`,
      
      // Ingresos por mes (últimos 12 meses)
      `SELECT 
        DATE_FORMAT(payment_date, '%Y-%m') as month,
        SUM(amount) as revenue,
        COUNT(*) as transactions
       FROM payments 
       WHERE status = 'completed' 
       AND payment_date >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(payment_date, '%Y-%m')
       ORDER BY month`,
      
      // Pagos fallidos hoy
      `SELECT COUNT(*) as failed_today
       FROM payments 
       WHERE status = 'failed' 
       AND DATE(created_at) = CURDATE()`,
      
      // Reembolsos
      `SELECT 
        COUNT(*) as total_refunds,
        SUM(refund_amount) as total_refund_amount
       FROM payments 
       WHERE refund_amount > 0`,
      
      // Promedio de transacción
      `SELECT AVG(amount) as avg_transaction
       FROM payments 
       WHERE status = 'completed'`
    ];

    const [
      totalResult,
      statusResult,
      methodResult,
      revenueResult,
      failedTodayResult,
      refundsResult,
      avgTransactionResult
    ] = await Promise.all(queries.map(query => executeQuery(query)));

    const statusDistribution = (statusResult as any[]).reduce((acc, row) => {
      acc[row.status] = {
        count: row.count,
        amount: row.total_amount || 0
      };
      return acc;
    }, {});

    const methodDistribution = (methodResult as any[]).reduce((acc, row) => {
      acc[row.payment_method] = {
        count: row.count,
        amount: row.total_amount || 0
      };
      return acc;
    }, {});

    const refundsData = refundsResult[0] as any;

    return {
      total: (totalResult[0] as any).total,
      completed: statusDistribution.completed?.count || 0,
      pending: statusDistribution.pending?.count || 0,
      failed: statusDistribution.failed?.count || 0,
      refunded: statusDistribution.refunded?.count || 0,
      failed_today: (failedTodayResult[0] as any).failed_today,
      total_revenue: statusDistribution.completed?.amount || 0,
      total_refunds: refundsData?.total_refunds || 0,
      total_refund_amount: refundsData?.total_refund_amount || 0,
      average_transaction: (avgTransactionResult[0] as any)?.avg_transaction || 0,
      status_distribution: statusDistribution,
      method_distribution: methodDistribution,
      monthly_revenue: revenueResult as any[]
    };
  }

  /**
   * Obtener métricas de pagos
   */
  static async getPaymentsMetrics(): Promise<PaymentMetrics> {
    const queries = [
      // Tasa de éxito
      `SELECT 
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
        COUNT(*) as total
       FROM payments 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)`,
      
      // Tiempo promedio de procesamiento
      `SELECT AVG(TIMESTAMPDIFF(MINUTE, created_at, payment_date)) as avg_processing_time
       FROM payments 
       WHERE status = 'completed' 
       AND payment_date IS NOT NULL`,
      
      // Volumen de transacciones por día (últimos 30 días)
      `SELECT 
        DATE(created_at) as date,
        COUNT(*) as transactions,
        SUM(amount) as volume
       FROM payments 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`,
      
      // Tasa de reembolso
      `SELECT 
        COUNT(CASE WHEN refund_amount > 0 THEN 1 END) as refunded,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
       FROM payments`
    ];

    const [
      successRateResult,
      processingTimeResult,
      volumeResult,
      refundRateResult
    ] = await Promise.all(queries.map(query => executeQuery(query)));

    const successData = successRateResult[0] as any;
    const successRate = successData.total > 0 ? (successData.successful / successData.total) * 100 : 0;

    const refundData = refundRateResult[0] as any;
    const refundRate = refundData.completed > 0 ? (refundData.refunded / refundData.completed) * 100 : 0;

    const avgProcessingTime = (processingTimeResult[0] as any)?.avg_processing_time || 0;

    return {
      success_rate: Math.round(successRate * 100) / 100,
      average_processing_time: Math.round(avgProcessingTime * 100) / 100,
      refund_rate: Math.round(refundRate * 100) / 100,
      daily_volume: volumeResult as any[]
    };
  }

  /**
   * Simular llamada a API de Wompi
   */
  private static async callWompiAPI(payment: Payment, paymentData: any): Promise<any> {
    // Simulación de respuesta de Wompi
    // En producción, aquí iría la llamada real a la API de Wompi
    return new Promise((resolve) => {
      setTimeout(() => {
        const isSuccess = Math.random() > 0.1; // 90% de éxito
        resolve({
          id: `wompi_${Date.now()}`,
          reference: `ref_${payment.id}_${Date.now()}`,
          status: isSuccess ? 'APPROVED' : 'DECLINED',
          status_message: isSuccess ? 'Transacción aprobada' : 'Transacción declinada',
          amount_in_cents: payment.amount * 100,
          currency: payment.currency
        });
      }, 1000);
    });
  }

  /**
   * Simular llamada a API de reembolso de Wompi
   */
  private static async callWompiRefundAPI(payment: Payment, amount: number, reason?: string): Promise<any> {
    // Simulación de respuesta de reembolso de Wompi
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          id: `refund_${Date.now()}`,
          transaction_id: payment.provider_transaction_id,
          amount_in_cents: amount * 100,
          status: 'APPROVED',
          reason: reason || 'Reembolso solicitado por administrador'
        });
      }, 1000);
    });
  }
}
import { executeQuery, executeTransaction } from '../config/database.js';
import type {
  Subscription,
  SubscriptionCreateRequest,
  SubscriptionUpdateRequest,
  SubscriptionListFilters,
  SubscriptionListResponse,
  SubscriptionStats,
  SubscriptionMetrics
} from '../../shared/types/index.js';

export class AdminSubscriptionsManagementService {
  
  /**
   * Obtener lista de suscripciones con filtros y paginación
   */
  static async getSubscriptions(filters: SubscriptionListFilters): Promise<SubscriptionListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      plan_id,
      billing_cycle,
      date_range,
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
        sp.name LIKE ?
      )`);
      params.push(`%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status) {
      conditions.push('s.status = ?');
      params.push(status);
    }

    if (plan_id) {
      conditions.push('s.plan_id = ?');
      params.push(plan_id);
    }

    if (billing_cycle) {
      conditions.push('s.billing_cycle = ?');
      params.push(billing_cycle);
    }

    if (date_range?.start_date) {
      conditions.push('s.created_at >= ?');
      params.push(date_range.start_date);
    }

    if (date_range?.end_date) {
      conditions.push('s.created_at <= ?');
      params.push(date_range.end_date);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para obtener el total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM subscriptions s
      INNER JOIN coffee_growers cg ON s.coffee_grower_id = cg.id
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      ${whereClause}
    `;

    const [countResult] = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult.total;

    // Query para obtener las suscripciones
    const subscriptionsQuery = `
      SELECT 
        s.id,
        s.coffee_grower_id,
        s.plan_id,
        s.status,
        s.start_date,
        s.end_date,
        s.auto_renew,
        s.price,
        s.currency,
        s.billing_cycle,
        s.next_billing_date,
        s.cancellation_reason,
        s.cancelled_at,
        s.created_at,
        s.updated_at,
        cg.first_name as grower_first_name,
        cg.last_name as grower_last_name,
        cg.email as grower_email,
        cg.identification_number as grower_identification,
        sp.name as plan_name,
        sp.description as plan_description
      FROM subscriptions s
      INNER JOIN coffee_growers cg ON s.coffee_grower_id = cg.id
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      ${whereClause}
      ORDER BY s.${sort_by} ${sort_order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const subscriptions = await executeQuery<any>(subscriptionsQuery, [...params, limit, offset]);

    // Procesar los resultados
    const processedSubscriptions = subscriptions.map(sub => ({
      id: sub.id,
      coffee_grower_id: sub.coffee_grower_id,
      plan_id: sub.plan_id,
      status: sub.status,
      start_date: sub.start_date,
      end_date: sub.end_date,
      auto_renew: sub.auto_renew,
      price: sub.price,
      currency: sub.currency,
      billing_cycle: sub.billing_cycle,
      next_billing_date: sub.next_billing_date,
      cancellation_reason: sub.cancellation_reason,
      cancelled_at: sub.cancelled_at,
      created_at: sub.created_at,
      updated_at: sub.updated_at,
      coffee_grower: {
        id: sub.coffee_grower_id,
        first_name: sub.grower_first_name,
        last_name: sub.grower_last_name,
        email: sub.grower_email,
        identification_number: sub.grower_identification
      },
      plan: {
        id: sub.plan_id,
        name: sub.plan_name,
        description: sub.plan_description
      }
    }));

    return {
      subscriptions: processedSubscriptions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener suscripción por ID
   */
  static async getSubscriptionById(id: number): Promise<Subscription | null> {
    const query = `
      SELECT 
        s.id,
        s.coffee_grower_id,
        s.plan_id,
        s.status,
        s.start_date,
        s.end_date,
        s.auto_renew,
        s.price,
        s.currency,
        s.billing_cycle,
        s.next_billing_date,
        s.cancellation_reason,
        s.cancelled_at,
        s.created_at,
        s.updated_at,
        cg.first_name as grower_first_name,
        cg.last_name as grower_last_name,
        cg.email as grower_email,
        cg.identification_number as grower_identification,
        sp.name as plan_name,
        sp.description as plan_description,
        sp.features as plan_features,
        sp.limits_config as plan_limits
      FROM subscriptions s
      INNER JOIN coffee_growers cg ON s.coffee_grower_id = cg.id
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE s.id = ?
    `;

    const [subscription] = await executeQuery<any>(query, [id]);
    
    if (!subscription) return null;

    return {
      id: subscription.id,
      coffee_grower_id: subscription.coffee_grower_id,
      plan_id: subscription.plan_id,
      status: subscription.status,
      start_date: subscription.start_date,
      end_date: subscription.end_date,
      auto_renew: subscription.auto_renew,
      price: subscription.price,
      currency: subscription.currency,
      billing_cycle: subscription.billing_cycle,
      next_billing_date: subscription.next_billing_date,
      cancellation_reason: subscription.cancellation_reason,
      cancelled_at: subscription.cancelled_at,
      created_at: subscription.created_at,
      updated_at: subscription.updated_at,
      coffee_grower: {
        id: subscription.coffee_grower_id,
        first_name: subscription.grower_first_name,
        last_name: subscription.grower_last_name,
        email: subscription.grower_email,
        identification_number: subscription.grower_identification
      },
      plan: {
        id: subscription.plan_id,
        name: subscription.plan_name,
        description: subscription.plan_description,
        features: typeof subscription.plan_features === 'string' ? 
          JSON.parse(subscription.plan_features) : subscription.plan_features,
        limits_config: typeof subscription.plan_limits === 'string' ? 
          JSON.parse(subscription.plan_limits) : subscription.plan_limits
      }
    };
  }

  /**
   * Crear nueva suscripción
   */
  static async createSubscription(subscriptionData: SubscriptionCreateRequest): Promise<Subscription> {
    const {
      coffee_grower_id,
      plan_id,
      start_date,
      end_date,
      auto_renew = true,
      price,
      currency = 'COP',
      billing_cycle
    } = subscriptionData;

    // Verificar que el caficultor existe
    const growerQuery = 'SELECT id FROM coffee_growers WHERE id = ? AND deleted_at IS NULL';
    const [grower] = await executeQuery(growerQuery, [coffee_grower_id]);
    if (!grower) {
      throw new Error('Caficultor no encontrado');
    }

    // Verificar que el plan existe y está activo
    const planQuery = 'SELECT id, price, billing_cycle FROM subscription_plans WHERE id = ? AND is_active = true';
    const [plan] = await executeQuery<any>(planQuery, [plan_id]);
    if (!plan) {
      throw new Error('Plan de suscripción no encontrado o inactivo');
    }

    // Verificar que no hay suscripción activa para este caficultor
    const activeSubscriptionQuery = `
      SELECT id FROM subscriptions 
      WHERE coffee_grower_id = ? AND status IN ('active', 'suspended')
    `;
    const [activeSubscription] = await executeQuery(activeSubscriptionQuery, [coffee_grower_id]);
    if (activeSubscription) {
      throw new Error('El caficultor ya tiene una suscripción activa');
    }

    // Calcular próxima fecha de facturación
    const nextBillingDate = this.calculateNextBillingDate(new Date(start_date), billing_cycle);

    const query = `
      INSERT INTO subscriptions (
        coffee_grower_id, plan_id, status, start_date, end_date,
        auto_renew, price, currency, billing_cycle, next_billing_date
      ) VALUES (?, ?, 'active', ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      coffee_grower_id,
      plan_id,
      start_date,
      end_date,
      auto_renew,
      price || plan.price,
      currency,
      billing_cycle || plan.billing_cycle,
      nextBillingDate
    ];

    const [result] = await executeQuery<any>(query, params);
    const subscriptionId = result.insertId;

    const createdSubscription = await this.getSubscriptionById(subscriptionId);
    if (!createdSubscription) {
      throw new Error('Error al crear la suscripción');
    }

    return createdSubscription;
  }

  /**
   * Actualizar suscripción
   */
  static async updateSubscription(id: number, subscriptionData: SubscriptionUpdateRequest): Promise<Subscription> {
    // Verificar que la suscripción existe
    const existingSubscription = await this.getSubscriptionById(id);
    if (!existingSubscription) {
      throw new Error('Suscripción no encontrada');
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    // Construir query dinámicamente
    Object.entries(subscriptionData).forEach(([key, value]) => {
      if (value !== undefined) {
        updateFields.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (updateFields.length === 0) {
      return existingSubscription;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `
      UPDATE subscriptions 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await executeQuery(query, params);

    const updatedSubscription = await this.getSubscriptionById(id);
    if (!updatedSubscription) {
      throw new Error('Error al actualizar la suscripción');
    }

    return updatedSubscription;
  }

  /**
   * Cancelar suscripción
   */
  static async cancelSubscription(id: number, reason?: string): Promise<Subscription> {
    const existingSubscription = await this.getSubscriptionById(id);
    if (!existingSubscription) {
      throw new Error('Suscripción no encontrada');
    }

    if (existingSubscription.status === 'cancelled') {
      throw new Error('La suscripción ya está cancelada');
    }

    const query = `
      UPDATE subscriptions 
      SET status = 'cancelled', 
          cancellation_reason = ?,
          cancelled_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await executeQuery(query, [reason, id]);

    const updatedSubscription = await this.getSubscriptionById(id);
    if (!updatedSubscription) {
      throw new Error('Error al cancelar la suscripción');
    }

    return updatedSubscription;
  }

  /**
   * Reactivar suscripción
   */
  static async reactivateSubscription(id: number, newEndDate?: string): Promise<Subscription> {
    const existingSubscription = await this.getSubscriptionById(id);
    if (!existingSubscription) {
      throw new Error('Suscripción no encontrada');
    }

    if (existingSubscription.status === 'active') {
      throw new Error('La suscripción ya está activa');
    }

    const endDate = newEndDate || this.calculateEndDate(new Date(), existingSubscription.billing_cycle);
    const nextBillingDate = this.calculateNextBillingDate(new Date(), existingSubscription.billing_cycle);

    const query = `
      UPDATE subscriptions 
      SET status = 'active',
          end_date = ?,
          next_billing_date = ?,
          cancellation_reason = NULL,
          cancelled_at = NULL,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await executeQuery(query, [endDate, nextBillingDate, id]);

    const updatedSubscription = await this.getSubscriptionById(id);
    if (!updatedSubscription) {
      throw new Error('Error al reactivar la suscripción');
    }

    return updatedSubscription;
  }

  /**
   * Obtener estadísticas de suscripciones
   */
  static async getSubscriptionsStats(): Promise<SubscriptionStats> {
    const queries = [
      // Total de suscripciones
      'SELECT COUNT(*) as total FROM subscriptions',
      
      // Suscripciones por estado
      `SELECT 
        status,
        COUNT(*) as count
       FROM subscriptions 
       GROUP BY status`,
      
      // Suscripciones por plan
      `SELECT 
        sp.name as plan_name,
        COUNT(s.id) as count
       FROM subscriptions s
       INNER JOIN subscription_plans sp ON s.plan_id = sp.id
       GROUP BY sp.id, sp.name
       ORDER BY count DESC`,
      
      // Ingresos por mes (últimos 12 meses)
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(price) as revenue,
        COUNT(*) as subscriptions
       FROM subscriptions 
       WHERE created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
       GROUP BY DATE_FORMAT(created_at, '%Y-%m')
       ORDER BY month`,
      
      // Suscripciones que vencen pronto (próximos 30 días)
      `SELECT COUNT(*) as expiring_soon
       FROM subscriptions 
       WHERE status = 'active' 
       AND end_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 30 DAY)`,
      
      // Tasa de renovación
      `SELECT 
        COUNT(CASE WHEN auto_renew = true THEN 1 END) as auto_renew_count,
        COUNT(*) as total_active
       FROM subscriptions 
       WHERE status = 'active'`,
      
      // Distribución por ciclo de facturación
      `SELECT 
        billing_cycle,
        COUNT(*) as count
       FROM subscriptions 
       WHERE status = 'active'
       GROUP BY billing_cycle`
    ];

    const [
      totalResult,
      statusResult,
      planResult,
      revenueResult,
      expiringResult,
      renewalResult,
      billingCycleResult
    ] = await Promise.all(queries.map(query => executeQuery(query)));

    const statusDistribution = (statusResult as any[]).reduce((acc, row) => {
      acc[row.status] = row.count;
      return acc;
    }, {});

    const planDistribution = (planResult as any[]).reduce((acc, row) => {
      acc[row.plan_name] = row.count;
      return acc;
    }, {});

    const billingCycleDistribution = (billingCycleResult as any[]).reduce((acc, row) => {
      acc[row.billing_cycle] = row.count;
      return acc;
    }, {});

    const renewalData = renewalResult[0] as any;
    const renewalRate = renewalData.total_active > 0 ? 
      (renewalData.auto_renew_count / renewalData.total_active) * 100 : 0;

    return {
      total: (totalResult[0] as any).total,
      active: statusDistribution.active || 0,
      inactive: statusDistribution.inactive || 0,
      cancelled: statusDistribution.cancelled || 0,
      expired: statusDistribution.expired || 0,
      suspended: statusDistribution.suspended || 0,
      expiring_soon: (expiringResult[0] as any).expiring_soon,
      renewal_rate: Math.round(renewalRate * 100) / 100,
      status_distribution: statusDistribution,
      plan_distribution: planDistribution,
      billing_cycle_distribution: billingCycleDistribution,
      monthly_revenue: revenueResult as any[]
    };
  }

  /**
   * Obtener métricas de suscripciones
   */
  static async getSubscriptionsMetrics(): Promise<SubscriptionMetrics> {
    const queries = [
      // MRR (Monthly Recurring Revenue)
      `SELECT SUM(
        CASE 
          WHEN billing_cycle = 'monthly' THEN price
          WHEN billing_cycle = 'quarterly' THEN price / 3
          WHEN billing_cycle = 'yearly' THEN price / 12
        END
       ) as mrr
       FROM subscriptions 
       WHERE status = 'active'`,
      
      // ARR (Annual Recurring Revenue)
      `SELECT SUM(
        CASE 
          WHEN billing_cycle = 'monthly' THEN price * 12
          WHEN billing_cycle = 'quarterly' THEN price * 4
          WHEN billing_cycle = 'yearly' THEN price
        END
       ) as arr
       FROM subscriptions 
       WHERE status = 'active'`,
      
      // Churn rate (últimos 30 días)
      `SELECT 
        COUNT(CASE WHEN status = 'cancelled' AND cancelled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as churned,
        COUNT(CASE WHEN status = 'active' OR (status = 'cancelled' AND cancelled_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) THEN 1 END) as total_at_start
       FROM subscriptions`,
      
      // ARPU (Average Revenue Per User)
      `SELECT AVG(price) as arpu
       FROM subscriptions 
       WHERE status = 'active'`,
      
      // LTV (Customer Lifetime Value) estimado
      `SELECT 
        AVG(DATEDIFF(COALESCE(cancelled_at, NOW()), start_date)) as avg_lifetime_days,
        AVG(price) as avg_price
       FROM subscriptions`
    ];

    const [
      mrrResult,
      arrResult,
      churnResult,
      arpuResult,
      ltvResult
    ] = await Promise.all(queries.map(query => executeQuery(query)));

    const mrr = (mrrResult[0] as any)?.mrr || 0;
    const arr = (arrResult[0] as any)?.arr || 0;
    const churnData = churnResult[0] as any;
    const churnRate = churnData.total_at_start > 0 ? 
      (churnData.churned / churnData.total_at_start) * 100 : 0;
    const arpu = (arpuResult[0] as any)?.arpu || 0;
    const ltvData = ltvResult[0] as any;
    const avgLifetimeMonths = ltvData.avg_lifetime_days ? ltvData.avg_lifetime_days / 30 : 0;
    const ltv = avgLifetimeMonths * (ltvData.avg_price || 0);

    return {
      mrr: Math.round(mrr * 100) / 100,
      arr: Math.round(arr * 100) / 100,
      churn_rate: Math.round(churnRate * 100) / 100,
      arpu: Math.round(arpu * 100) / 100,
      ltv: Math.round(ltv * 100) / 100,
      growth_rate: 0 // Se calcularía comparando con el mes anterior
    };
  }

  /**
   * Calcular próxima fecha de facturación
   */
  private static calculateNextBillingDate(startDate: Date, billingCycle: string): string {
    const nextDate = new Date(startDate);
    
    switch (billingCycle) {
      case 'monthly':
        nextDate.setMonth(nextDate.getMonth() + 1);
        break;
      case 'quarterly':
        nextDate.setMonth(nextDate.getMonth() + 3);
        break;
      case 'yearly':
        nextDate.setFullYear(nextDate.getFullYear() + 1);
        break;
    }
    
    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Calcular fecha de finalización
   */
  private static calculateEndDate(startDate: Date, billingCycle: string): string {
    return this.calculateNextBillingDate(startDate, billingCycle);
  }
}
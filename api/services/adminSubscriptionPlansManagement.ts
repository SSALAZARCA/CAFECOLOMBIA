import { executeQuery, executeTransaction } from '../config/database.js';
import type {
  SubscriptionPlan,
  SubscriptionPlanCreateRequest,
  SubscriptionPlanUpdateRequest,
  SubscriptionPlanListFilters,
  SubscriptionPlanListResponse,
  SubscriptionPlanStats
} from '../../shared/types/index.js';

export class AdminSubscriptionPlansManagementService {
  
  /**
   * Obtener lista de planes de suscripción con filtros y paginación
   */
  static async getPlans(filters: SubscriptionPlanListFilters): Promise<SubscriptionPlanListResponse> {
    const {
      page = 1,
      limit = 10,
      search,
      is_active,
      billing_cycle,
      sort_by = 'created_at',
      sort_order = 'desc'
    } = filters;

    const offset = (page - 1) * limit;
    
    // Construir condiciones WHERE
    const conditions: string[] = [];
    const params: any[] = [];

    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    if (is_active !== undefined) {
      conditions.push('is_active = ?');
      params.push(is_active);
    }

    if (billing_cycle) {
      conditions.push('billing_cycle = ?');
      params.push(billing_cycle);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Query para obtener el total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM subscription_plans
      ${whereClause}
    `;

    const [countResult] = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult.total;

    // Query para obtener los planes
    const plansQuery = `
      SELECT 
        id,
        name,
        description,
        price,
        currency,
        billing_cycle,
        features,
        limits_config,
        is_active,
        is_featured,
        sort_order,
        created_at,
        updated_at
      FROM subscription_plans
      ${whereClause}
      ORDER BY ${sort_by} ${sort_order.toUpperCase()}
      LIMIT ? OFFSET ?
    `;

    const plans = await executeQuery<SubscriptionPlan>(plansQuery, [...params, limit, offset]);

    // Procesar features y limits_config como JSON
    const processedPlans = plans.map(plan => ({
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      limits_config: typeof plan.limits_config === 'string' ? JSON.parse(plan.limits_config) : plan.limits_config
    }));

    return {
      plans: processedPlans,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Obtener plan por ID
   */
  static async getPlanById(id: number): Promise<SubscriptionPlan | null> {
    const query = `
      SELECT 
        id,
        name,
        description,
        price,
        currency,
        billing_cycle,
        features,
        limits_config,
        is_active,
        is_featured,
        sort_order,
        created_at,
        updated_at
      FROM subscription_plans
      WHERE id = ?
    `;

    const [plan] = await executeQuery<SubscriptionPlan>(query, [id]);
    
    if (!plan) return null;

    return {
      ...plan,
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : plan.features,
      limits_config: typeof plan.limits_config === 'string' ? JSON.parse(plan.limits_config) : plan.limits_config
    };
  }

  /**
   * Crear nuevo plan de suscripción
   */
  static async createPlan(planData: SubscriptionPlanCreateRequest): Promise<SubscriptionPlan> {
    const {
      name,
      description,
      price,
      currency = 'COP',
      billing_cycle,
      features = [],
      limits_config = {},
      is_active = true,
      is_featured = false,
      sort_order = 0
    } = planData;

    const query = `
      INSERT INTO subscription_plans (
        name, description, price, currency, billing_cycle,
        features, limits_config, is_active, is_featured, sort_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      name,
      description,
      price,
      currency,
      billing_cycle,
      JSON.stringify(features),
      JSON.stringify(limits_config),
      is_active,
      is_featured,
      sort_order
    ];

    const [result] = await executeQuery<any>(query, params);
    const planId = result.insertId;

    const createdPlan = await this.getPlanById(planId);
    if (!createdPlan) {
      throw new Error('Error al crear el plan de suscripción');
    }

    return createdPlan;
  }

  /**
   * Actualizar plan de suscripción
   */
  static async updatePlan(id: number, planData: SubscriptionPlanUpdateRequest): Promise<SubscriptionPlan> {
    // Verificar que el plan existe
    const existingPlan = await this.getPlanById(id);
    if (!existingPlan) {
      throw new Error('Plan de suscripción no encontrado');
    }

    const updateFields: string[] = [];
    const params: any[] = [];

    // Construir query dinámicamente
    Object.entries(planData).forEach(([key, value]) => {
      if (value !== undefined) {
        if (key === 'features' || key === 'limits_config') {
          updateFields.push(`${key} = ?`);
          params.push(JSON.stringify(value));
        } else {
          updateFields.push(`${key} = ?`);
          params.push(value);
        }
      }
    });

    if (updateFields.length === 0) {
      return existingPlan;
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    const query = `
      UPDATE subscription_plans 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;

    await executeQuery(query, params);

    const updatedPlan = await this.getPlanById(id);
    if (!updatedPlan) {
      throw new Error('Error al actualizar el plan de suscripción');
    }

    return updatedPlan;
  }

  /**
   * Eliminar plan de suscripción
   */
  static async deletePlan(id: number): Promise<void> {
    // Verificar que el plan existe
    const existingPlan = await this.getPlanById(id);
    if (!existingPlan) {
      throw new Error('Plan de suscripción no encontrado');
    }

    // Verificar que no hay suscripciones activas con este plan
    const activeSubscriptionsQuery = `
      SELECT COUNT(*) as count
      FROM subscriptions
      WHERE plan_id = ? AND status IN ('active', 'suspended')
    `;

    const [result] = await executeQuery<{ count: number }>(activeSubscriptionsQuery, [id]);
    
    if (result.count > 0) {
      throw new Error('No se puede eliminar el plan porque tiene suscripciones activas');
    }

    const deleteQuery = 'DELETE FROM subscription_plans WHERE id = ?';
    await executeQuery(deleteQuery, [id]);
  }

  /**
   * Cambiar estado de plan (activar/desactivar)
   */
  static async togglePlanStatus(id: number): Promise<SubscriptionPlan> {
    const existingPlan = await this.getPlanById(id);
    if (!existingPlan) {
      throw new Error('Plan de suscripción no encontrado');
    }

    const newStatus = !existingPlan.is_active;
    
    const query = `
      UPDATE subscription_plans 
      SET is_active = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await executeQuery(query, [newStatus, id]);

    const updatedPlan = await this.getPlanById(id);
    if (!updatedPlan) {
      throw new Error('Error al actualizar el estado del plan');
    }

    return updatedPlan;
  }

  /**
   * Marcar/desmarcar plan como destacado
   */
  static async toggleFeaturedStatus(id: number): Promise<SubscriptionPlan> {
    const existingPlan = await this.getPlanById(id);
    if (!existingPlan) {
      throw new Error('Plan de suscripción no encontrado');
    }

    const newStatus = !existingPlan.is_featured;
    
    const query = `
      UPDATE subscription_plans 
      SET is_featured = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `;

    await executeQuery(query, [newStatus, id]);

    const updatedPlan = await this.getPlanById(id);
    if (!updatedPlan) {
      throw new Error('Error al actualizar el estado destacado del plan');
    }

    return updatedPlan;
  }

  /**
   * Obtener estadísticas de planes
   */
  static async getPlansStats(): Promise<SubscriptionPlanStats> {
    const queries = [
      // Total de planes
      'SELECT COUNT(*) as total FROM subscription_plans',
      
      // Planes activos
      'SELECT COUNT(*) as active FROM subscription_plans WHERE is_active = true',
      
      // Planes inactivos
      'SELECT COUNT(*) as inactive FROM subscription_plans WHERE is_active = false',
      
      // Planes destacados
      'SELECT COUNT(*) as featured FROM subscription_plans WHERE is_featured = true',
      
      // Distribución por ciclo de facturación
      `SELECT 
        billing_cycle,
        COUNT(*) as count
       FROM subscription_plans 
       WHERE is_active = true
       GROUP BY billing_cycle`,
      
      // Rango de precios
      `SELECT 
        MIN(price) as min_price,
        MAX(price) as max_price,
        AVG(price) as avg_price
       FROM subscription_plans 
       WHERE is_active = true`,
      
      // Planes con más suscripciones
      `SELECT 
        sp.id,
        sp.name,
        COUNT(s.id) as subscription_count
       FROM subscription_plans sp
       LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
       GROUP BY sp.id, sp.name
       ORDER BY subscription_count DESC
       LIMIT 5`
    ];

    const [
      totalResult,
      activeResult,
      inactiveResult,
      featuredResult,
      billingCycleResult,
      priceRangeResult,
      popularPlansResult
    ] = await Promise.all(queries.map(query => executeQuery(query)));

    const billingCycleDistribution = (billingCycleResult as any[]).reduce((acc, row) => {
      acc[row.billing_cycle] = row.count;
      return acc;
    }, {});

    const priceRange = priceRangeResult[0] as any;

    return {
      total: (totalResult[0] as any).total,
      active: (activeResult[0] as any).active,
      inactive: (inactiveResult[0] as any).inactive,
      featured: (featuredResult[0] as any).featured,
      billing_cycle_distribution: billingCycleDistribution,
      price_range: {
        min: priceRange?.min_price || 0,
        max: priceRange?.max_price || 0,
        average: priceRange?.avg_price || 0
      },
      popular_plans: popularPlansResult as any[]
    };
  }

  /**
   * Reordenar planes
   */
  static async reorderPlans(planOrders: Array<{ id: number; sort_order: number }>): Promise<void> {
    const queries = planOrders.map(({ id, sort_order }) => ({
      query: 'UPDATE subscription_plans SET sort_order = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      params: [sort_order, id]
    }));

    await executeTransaction(queries);
  }
}
import express from 'express';
import { executeQuery } from '../config/database.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Reporte de ingresos
router.get('/revenue', requirePermission('reports.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    period = 'monthly',
    startDate = '',
    endDate = '',
    planId = ''
  } = req.query;

  try {
    let dateFormat = '%Y-%m';
    let dateInterval = 'MONTH';
    
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        dateInterval = 'DAY';
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        dateInterval = 'WEEK';
        break;
      case 'yearly':
        dateFormat = '%Y';
        dateInterval = 'YEAR';
        break;
      default:
        dateFormat = '%Y-%m';
        dateInterval = 'MONTH';
    }

    // Construir condiciones WHERE
    let whereConditions = ['p.status = "completed"'];
    const queryParams: any[] = [];

    if (startDate) {
      whereConditions.push('DATE(p.completed_at) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(p.completed_at) <= ?');
      queryParams.push(endDate);
    }

    if (planId) {
      whereConditions.push('s.plan_id = ?');
      queryParams.push(planId);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener datos de ingresos
    const [revenueData] = await executeQuery(`
      SELECT 
        DATE_FORMAT(p.completed_at, '${dateFormat}') as period,
        COUNT(p.id) as payment_count,
        SUM(p.amount) as total_revenue,
        AVG(p.amount) as avg_payment,
        COUNT(DISTINCT p.user_id) as unique_customers,
        COUNT(DISTINCT s.plan_id) as plans_sold
      FROM payments p
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      WHERE ${whereClause}
      GROUP BY DATE_FORMAT(p.completed_at, '${dateFormat}')
      ORDER BY period ASC
    `, queryParams);

    // Obtener resumen total
    const [summary] = await executeQuery(`
      SELECT 
        COUNT(p.id) as total_payments,
        SUM(p.amount) as total_revenue,
        AVG(p.amount) as avg_payment,
        COUNT(DISTINCT p.user_id) as unique_customers,
        MIN(p.completed_at) as first_payment,
        MAX(p.completed_at) as last_payment
      FROM payments p
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      WHERE ${whereClause}
    `, queryParams);

    // Obtener distribución por plan
    const [planBreakdown] = await executeQuery(`
      SELECT 
        sp.name as plan_name,
        sp.price as plan_price,
        COUNT(p.id) as payment_count,
        SUM(p.amount) as revenue,
        COUNT(DISTINCT p.user_id) as unique_customers
      FROM payments p
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE ${whereClause}
      GROUP BY sp.id, sp.name, sp.price
      ORDER BY revenue DESC
    `, queryParams);

    res.json({
      period,
      summary: (summary as any[])[0],
      data: revenueData,
      planBreakdown
    });

  } catch (error) {
    console.error('Error generando reporte de ingresos:', error);
    throw createError('Error generando reporte de ingresos', 500);
  }
}));

// Reporte de usuarios
router.get('/users', requirePermission('reports.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    period = 'monthly',
    startDate = '',
    endDate = ''
  } = req.query;

  try {
    let dateFormat = '%Y-%m';
    
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        break;
      case 'yearly':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m';
    }

    // Construir condiciones WHERE
    let whereConditions = ['1=1'];
    const queryParams: any[] = [];

    if (startDate) {
      whereConditions.push('DATE(u.created_at) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(u.created_at) <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener datos de registro de usuarios
    const [userData] = await executeQuery(`
      SELECT 
        DATE_FORMAT(u.created_at, '${dateFormat}') as period,
        COUNT(u.id) as new_users,
        COUNT(CASE WHEN u.is_active = true THEN 1 END) as active_users,
        COUNT(CASE WHEN u.user_type = 'coffee_grower' THEN 1 END) as new_growers,
        COUNT(CASE WHEN u.user_type = 'consumer' THEN 1 END) as new_consumers
      FROM users u
      WHERE ${whereClause}
      GROUP BY DATE_FORMAT(u.created_at, '${dateFormat}')
      ORDER BY period ASC
    `, queryParams);

    // Obtener estadísticas de actividad
    const [activityStats] = await executeQuery(`
      SELECT 
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT CASE WHEN u.is_active = true THEN u.id END) as active_users,
        COUNT(DISTINCT CASE WHEN u.user_type = 'coffee_grower' THEN u.id END) as total_growers,
        COUNT(DISTINCT CASE WHEN u.user_type = 'consumer' THEN u.id END) as total_consumers,
        COUNT(DISTINCT CASE WHEN s.status = 'active' THEN u.id END) as subscribed_users,
        COUNT(DISTINCT CASE WHEN p.status = 'completed' THEN u.id END) as paying_users
      FROM users u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      LEFT JOIN payments p ON u.id = p.user_id
      WHERE ${whereClause}
    `, queryParams);

    // Obtener distribución geográfica (si hay datos de ubicación)
    const [geographicData] = await executeQuery(`
      SELECT 
        COALESCE(u.city, 'No especificado') as city,
        COALESCE(u.state, 'No especificado') as state,
        COUNT(u.id) as user_count,
        COUNT(CASE WHEN u.user_type = 'coffee_grower' THEN 1 END) as grower_count
      FROM users u
      WHERE ${whereClause}
      GROUP BY u.city, u.state
      ORDER BY user_count DESC
      LIMIT 10
    `, queryParams);

    res.json({
      period,
      summary: (activityStats as any[])[0],
      data: userData,
      geographicDistribution: geographicData
    });

  } catch (error) {
    console.error('Error generando reporte de usuarios:', error);
    throw createError('Error generando reporte de usuarios', 500);
  }
}));

// Reporte de suscripciones
router.get('/subscriptions', requirePermission('reports.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    period = 'monthly',
    startDate = '',
    endDate = '',
    planId = ''
  } = req.query;

  try {
    let dateFormat = '%Y-%m';
    
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        break;
      case 'yearly':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m';
    }

    // Construir condiciones WHERE
    let whereConditions = ['1=1'];
    const queryParams: any[] = [];

    if (startDate) {
      whereConditions.push('DATE(s.created_at) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(s.created_at) <= ?');
      queryParams.push(endDate);
    }

    if (planId) {
      whereConditions.push('s.plan_id = ?');
      queryParams.push(planId);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener datos de suscripciones
    const [subscriptionData] = await executeQuery(`
      SELECT 
        DATE_FORMAT(s.created_at, '${dateFormat}') as period,
        COUNT(s.id) as new_subscriptions,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
        COUNT(CASE WHEN s.auto_renew = true THEN 1 END) as auto_renew_subscriptions,
        AVG(sp.price) as avg_plan_price
      FROM subscriptions s
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE ${whereClause}
      GROUP BY DATE_FORMAT(s.created_at, '${dateFormat}')
      ORDER BY period ASC
    `, queryParams);

    // Obtener métricas de retención y churn
    const [retentionMetrics] = await executeQuery(`
      SELECT 
        COUNT(s.id) as total_subscriptions,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
        COUNT(CASE WHEN s.status = 'expired' THEN 1 END) as expired_subscriptions,
        AVG(DATEDIFF(COALESCE(s.cancelled_at, s.end_date), s.start_date)) as avg_subscription_days,
        COUNT(CASE WHEN s.auto_renew = true AND s.status = 'active' THEN 1 END) as auto_renew_count
      FROM subscriptions s
      WHERE ${whereClause}
    `, queryParams);

    // Obtener distribución por plan
    const [planDistribution] = await executeQuery(`
      SELECT 
        sp.name as plan_name,
        sp.price as plan_price,
        sp.duration_months,
        COUNT(s.id) as subscription_count,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_count,
        COUNT(CASE WHEN s.status = 'cancelled' THEN 1 END) as cancelled_count,
        AVG(DATEDIFF(COALESCE(s.cancelled_at, NOW()), s.start_date)) as avg_duration_days
      FROM subscriptions s
      INNER JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE ${whereClause}
      GROUP BY sp.id, sp.name, sp.price, sp.duration_months
      ORDER BY subscription_count DESC
    `, queryParams);

    // Calcular tasa de churn
    const metrics = (retentionMetrics as any[])[0];
    const churnRate = metrics.total_subscriptions > 0 
      ? (metrics.cancelled_subscriptions / metrics.total_subscriptions) * 100 
      : 0;

    res.json({
      period,
      summary: {
        ...metrics,
        churnRate: parseFloat(churnRate.toFixed(2))
      },
      data: subscriptionData,
      planDistribution
    });

  } catch (error) {
    console.error('Error generando reporte de suscripciones:', error);
    throw createError('Error generando reporte de suscripciones', 500);
  }
}));

// Reporte de caficultores y fincas
router.get('/coffee-growers', requirePermission('reports.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    period = 'monthly',
    startDate = '',
    endDate = '',
    region = ''
  } = req.query;

  try {
    let dateFormat = '%Y-%m';
    
    switch (period) {
      case 'daily':
        dateFormat = '%Y-%m-%d';
        break;
      case 'weekly':
        dateFormat = '%Y-%u';
        break;
      case 'yearly':
        dateFormat = '%Y';
        break;
      default:
        dateFormat = '%Y-%m';
    }

    // Construir condiciones WHERE
    let whereConditions = ['1=1'];
    const queryParams: any[] = [];

    if (startDate) {
      whereConditions.push('DATE(cg.created_at) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(cg.created_at) <= ?');
      queryParams.push(endDate);
    }

    if (region) {
      whereConditions.push('cg.region = ?');
      queryParams.push(region);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener datos de caficultores
    const [growerData] = await executeQuery(`
      SELECT 
        DATE_FORMAT(cg.created_at, '${dateFormat}') as period,
        COUNT(cg.id) as new_growers,
        COUNT(CASE WHEN cg.is_active = true THEN 1 END) as active_growers,
        COUNT(CASE WHEN cg.certification_type IS NOT NULL THEN 1 END) as certified_growers,
        AVG(cg.experience_years) as avg_experience
      FROM coffee_growers cg
      WHERE ${whereClause}
      GROUP BY DATE_FORMAT(cg.created_at, '${dateFormat}')
      ORDER BY period ASC
    `, queryParams);

    // Obtener estadísticas de fincas
    const [farmStats] = await executeQuery(`
      SELECT 
        COUNT(f.id) as total_farms,
        COUNT(CASE WHEN f.is_active = true THEN 1 END) as active_farms,
        AVG(f.area_hectares) as avg_farm_size,
        AVG(f.altitude_meters) as avg_altitude,
        SUM(f.annual_production_kg) as total_production,
        COUNT(DISTINCT f.coffee_grower_id) as growers_with_farms
      FROM farms f
      INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
      WHERE ${whereClause.replace('cg.created_at', 'f.created_at')}
    `, queryParams);

    // Obtener distribución por región
    const [regionDistribution] = await executeQuery(`
      SELECT 
        cg.region,
        COUNT(cg.id) as grower_count,
        COUNT(f.id) as farm_count,
        AVG(f.area_hectares) as avg_farm_size,
        SUM(f.annual_production_kg) as total_production
      FROM coffee_growers cg
      LEFT JOIN farms f ON cg.id = f.coffee_grower_id
      WHERE ${whereClause}
      GROUP BY cg.region
      ORDER BY grower_count DESC
    `, queryParams);

    // Obtener distribución por tipo de certificación
    const [certificationDistribution] = await executeQuery(`
      SELECT 
        COALESCE(cg.certification_type, 'Sin certificación') as certification,
        COUNT(cg.id) as grower_count,
        COUNT(f.id) as farm_count,
        AVG(f.area_hectares) as avg_farm_size
      FROM coffee_growers cg
      LEFT JOIN farms f ON cg.id = f.coffee_grower_id
      WHERE ${whereClause}
      GROUP BY cg.certification_type
      ORDER BY grower_count DESC
    `, queryParams);

    res.json({
      period,
      summary: (farmStats as any[])[0],
      data: growerData,
      regionDistribution,
      certificationDistribution
    });

  } catch (error) {
    console.error('Error generando reporte de caficultores:', error);
    throw createError('Error generando reporte de caficultores', 500);
  }
}));

// Reporte financiero consolidado
router.get('/financial', requirePermission('reports.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    startDate = '',
    endDate = ''
  } = req.query;

  try {
    // Construir condiciones WHERE
    let whereConditions = ['1=1'];
    const queryParams: any[] = [];

    if (startDate) {
      whereConditions.push('DATE(p.completed_at) >= ?');
      queryParams.push(startDate);
    }

    if (endDate) {
      whereConditions.push('DATE(p.completed_at) <= ?');
      queryParams.push(endDate);
    }

    const whereClause = whereConditions.join(' AND ');

    // Obtener resumen financiero
    const [financialSummary] = await executeQuery(`
      SELECT 
        COUNT(p.id) as total_transactions,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as gross_revenue,
        SUM(CASE WHEN p.status = 'refunded' THEN p.refund_amount ELSE 0 END) as total_refunds,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) - 
        SUM(CASE WHEN p.status = 'refunded' THEN p.refund_amount ELSE 0 END) as net_revenue,
        AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END) as avg_transaction_value,
        COUNT(DISTINCT p.user_id) as unique_customers,
        COUNT(DISTINCT s.plan_id) as active_plans
      FROM payments p
      LEFT JOIN subscriptions s ON p.subscription_id = s.id
      WHERE p.status IN ('completed', 'refunded') AND ${whereClause}
    `, queryParams);

    // Obtener ingresos mensuales de los últimos 12 meses
    const [monthlyRevenue] = await executeQuery(`
      SELECT 
        DATE_FORMAT(p.completed_at, '%Y-%m') as month,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as revenue,
        COUNT(CASE WHEN p.status = 'completed' THEN 1 END) as transactions,
        SUM(CASE WHEN p.status = 'refunded' THEN p.refund_amount ELSE 0 END) as refunds
      FROM payments p
      WHERE p.completed_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        AND p.status IN ('completed', 'refunded')
      GROUP BY DATE_FORMAT(p.completed_at, '%Y-%m')
      ORDER BY month ASC
    `);

    // Obtener métricas de rendimiento por plan
    const [planPerformance] = await executeQuery(`
      SELECT 
        sp.name as plan_name,
        sp.price as plan_price,
        COUNT(s.id) as total_subscriptions,
        COUNT(CASE WHEN s.status = 'active' THEN 1 END) as active_subscriptions,
        SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_revenue,
        AVG(CASE WHEN p.status = 'completed' THEN p.amount ELSE NULL END) as avg_payment,
        COUNT(DISTINCT s.user_id) as unique_subscribers
      FROM subscription_plans sp
      LEFT JOIN subscriptions s ON sp.id = s.plan_id
      LEFT JOIN payments p ON s.id = p.subscription_id
      WHERE sp.is_active = true
      GROUP BY sp.id, sp.name, sp.price
      ORDER BY total_revenue DESC
    `);

    // Calcular métricas clave
    const summary = (financialSummary as any[])[0];
    const arpu = summary.unique_customers > 0 
      ? summary.net_revenue / summary.unique_customers 
      : 0;

    res.json({
      summary: {
        ...summary,
        arpu: parseFloat(arpu.toFixed(2))
      },
      monthlyRevenue,
      planPerformance
    });

  } catch (error) {
    console.error('Error generando reporte financiero:', error);
    throw createError('Error generando reporte financiero', 500);
  }
}));

// Exportar reporte en CSV
router.get('/export/:reportType', requirePermission('reports.export'), asyncHandler(async (req: AuthRequest, res) => {
  const { reportType } = req.params;
  const { startDate = '', endDate = '', format = 'csv' } = req.query;

  if (!['revenue', 'users', 'subscriptions', 'coffee-growers'].includes(reportType)) {
    throw createError('Tipo de reporte inválido', 400);
  }

  try {
    let query = '';
    let filename = '';
    const queryParams: any[] = [];

    switch (reportType) {
      case 'revenue':
        filename = `revenue_report_${new Date().toISOString().split('T')[0]}.csv`;
        query = `
          SELECT 
            DATE(p.completed_at) as date,
            p.amount,
            p.payment_method,
            u.email as customer_email,
            sp.name as plan_name
          FROM payments p
          INNER JOIN users u ON p.user_id = u.id
          LEFT JOIN subscriptions s ON p.subscription_id = s.id
          LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
          WHERE p.status = 'completed'
        `;
        break;

      case 'users':
        filename = `users_report_${new Date().toISOString().split('T')[0]}.csv`;
        query = `
          SELECT 
            u.id,
            u.first_name,
            u.last_name,
            u.email,
            u.user_type,
            u.is_active,
            DATE(u.created_at) as registration_date,
            COUNT(s.id) as total_subscriptions,
            COUNT(p.id) as total_payments
          FROM users u
          LEFT JOIN subscriptions s ON u.id = s.user_id
          LEFT JOIN payments p ON u.id = p.user_id
        `;
        break;

      case 'subscriptions':
        filename = `subscriptions_report_${new Date().toISOString().split('T')[0]}.csv`;
        query = `
          SELECT 
            s.id,
            u.email as customer_email,
            sp.name as plan_name,
            s.status,
            DATE(s.start_date) as start_date,
            DATE(s.end_date) as end_date,
            s.auto_renew,
            DATE(s.created_at) as created_date
          FROM subscriptions s
          INNER JOIN users u ON s.user_id = u.id
          INNER JOIN subscription_plans sp ON s.plan_id = sp.id
        `;
        break;

      case 'coffee-growers':
        filename = `coffee_growers_report_${new Date().toISOString().split('T')[0]}.csv`;
        query = `
          SELECT 
            cg.id,
            cg.farm_name,
            cg.region,
            cg.certification_type,
            cg.experience_years,
            cg.is_active,
            COUNT(f.id) as total_farms,
            SUM(f.area_hectares) as total_area,
            SUM(f.annual_production_kg) as total_production
          FROM coffee_growers cg
          LEFT JOIN farms f ON cg.id = f.coffee_grower_id
        `;
        break;
    }

    // Agregar filtros de fecha si se proporcionan
    if (startDate) {
      query += ` AND DATE(${reportType === 'revenue' ? 'p.completed_at' : 
                           reportType === 'users' ? 'u.created_at' :
                           reportType === 'subscriptions' ? 's.created_at' : 'cg.created_at'}) >= ?`;
      queryParams.push(startDate);
    }

    if (endDate) {
      query += ` AND DATE(${reportType === 'revenue' ? 'p.completed_at' : 
                           reportType === 'users' ? 'u.created_at' :
                           reportType === 'subscriptions' ? 's.created_at' : 'cg.created_at'}) <= ?`;
      queryParams.push(endDate);
    }

    if (reportType === 'users' || reportType === 'coffee-growers') {
      query += ' GROUP BY ' + (reportType === 'users' ? 'u.id' : 'cg.id');
    }

    query += ' ORDER BY ' + (reportType === 'revenue' ? 'p.completed_at' : 
                            reportType === 'users' ? 'u.created_at' :
                            reportType === 'subscriptions' ? 's.created_at' : 'cg.created_at') + ' DESC';

    const [data] = await executeQuery(query, queryParams);

    // Log de auditoría para exportación
    await executeQuery(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, 'export', 'report', NULL, ?, ?)
    `, [
      req.user!.id,
      JSON.stringify({ reportType, startDate, endDate, format }),
      req.ip
    ]);

    if (format === 'csv') {
      // Convertir a CSV
      if (!data || (data as any[]).length === 0) {
        throw createError('No hay datos para exportar', 404);
      }

      const csvData = data as any[];
      const headers = Object.keys(csvData[0]).join(',');
      const rows = csvData.map(row => 
        Object.values(row).map(value => 
          typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value
        ).join(',')
      ).join('\n');

      const csv = `${headers}\n${rows}`;

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    } else {
      // Retornar JSON
      res.json({
        reportType,
        generatedAt: new Date().toISOString(),
        data
      });
    }

  } catch (error) {
    console.error('Error exportando reporte:', error);
    throw createError('Error exportando reporte', 500);
  }
}));

export default router;
import express from 'express';
import { executeQuery } from '../config/database.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Dashboard - Métricas principales
router.get('/dashboard/metrics', requirePermission('dashboard.view'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    // Obtener métricas en paralelo
    const [
      totalUsersResult,
      totalCoffeeGrowersResult,
      totalFarmsResult,
      activeSubscriptionsResult,
      totalRevenueResult,
      recentPaymentsResult,
      userGrowthResult,
      subscriptionDistributionResult
    ] = await Promise.all([
      // Total de usuarios
      executeQuery('SELECT COUNT(*) as count FROM users WHERE is_active = true'),
      
      // Total de caficultores
      executeQuery('SELECT COUNT(*) as count FROM coffee_growers WHERE is_active = true'),
      
      // Total de fincas
      executeQuery('SELECT COUNT(*) as count FROM farms WHERE is_active = true'),
      
      // Suscripciones activas
      executeQuery(`
        SELECT COUNT(*) as count 
        FROM subscriptions 
        WHERE status = 'active' AND end_date > NOW()
      `),
      
      // Ingresos totales del mes actual
      executeQuery(`
        SELECT COALESCE(SUM(amount), 0) as total
        FROM payments 
        WHERE status = 'completed' 
        AND MONTH(created_at) = MONTH(NOW()) 
        AND YEAR(created_at) = YEAR(NOW())
      `),
      
      // Pagos recientes (últimos 5)
      executeQuery(`
        SELECT p.id, p.amount, p.status, p.created_at, p.payment_method,
               u.first_name, u.last_name, u.email,
               sp.name as plan_name
        FROM payments p
        LEFT JOIN subscriptions s ON p.subscription_id = s.id
        LEFT JOIN users u ON s.user_id = u.id
        LEFT JOIN subscription_plans sp ON s.plan_id = sp.id
        ORDER BY p.created_at DESC
        LIMIT 5
      `),
      
      // Crecimiento de usuarios (últimos 6 meses)
      executeQuery(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as count
        FROM users 
        WHERE created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
      `),
      
      // Distribución de suscripciones por plan
      executeQuery(`
        SELECT 
          sp.name,
          sp.price,
          COUNT(s.id) as count,
          SUM(sp.price) as revenue
        FROM subscription_plans sp
        LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
        WHERE sp.is_active = true
        GROUP BY sp.id, sp.name, sp.price
        ORDER BY count DESC
      `)
    ]);

    // Procesar resultados
    const metrics = {
      totalUsers: (totalUsersResult as any[])[0]?.count || 0,
      totalCoffeeGrowers: (totalCoffeeGrowersResult as any[])[0]?.count || 0,
      totalFarms: (totalFarmsResult as any[])[0]?.count || 0,
      activeSubscriptions: (activeSubscriptionsResult as any[])[0]?.count || 0,
      monthlyRevenue: (totalRevenueResult as any[])[0]?.total || 0,
      recentPayments: recentPaymentsResult as any[],
      userGrowth: userGrowthResult as any[],
      subscriptionDistribution: subscriptionDistributionResult as any[]
    };

    // Calcular métricas adicionales
    const previousMonthRevenue = await executeQuery(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM payments 
      WHERE status = 'completed' 
      AND MONTH(created_at) = MONTH(DATE_SUB(NOW(), INTERVAL 1 MONTH))
      AND YEAR(created_at) = YEAR(DATE_SUB(NOW(), INTERVAL 1 MONTH))
    `);

    const revenueGrowth = calculateGrowthPercentage(
      metrics.monthlyRevenue,
      (previousMonthRevenue as any[])[0]?.total || 0
    );

    res.json({
      ...metrics,
      revenueGrowth,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo métricas del dashboard:', error);
    throw createError('Error obteniendo métricas del dashboard', 500);
  }
}));

// Dashboard - Actividad reciente
router.get('/dashboard/activity', requirePermission('dashboard.view'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const [recentActivity] = await Promise.all([
      executeQuery(`
        SELECT 
          'user_registration' as type,
          u.id as resource_id,
          CONCAT(u.first_name, ' ', u.last_name) as description,
          u.created_at as timestamp
        FROM users u
        WHERE u.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        
        UNION ALL
        
        SELECT 
          'subscription_created' as type,
          s.id as resource_id,
          CONCAT('Nueva suscripción: ', sp.name) as description,
          s.created_at as timestamp
        FROM subscriptions s
        JOIN subscription_plans sp ON s.plan_id = sp.id
        WHERE s.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        
        UNION ALL
        
        SELECT 
          'payment_completed' as type,
          p.id as resource_id,
          CONCAT('Pago completado: $', FORMAT(p.amount, 2)) as description,
          p.created_at as timestamp
        FROM payments p
        WHERE p.status = 'completed' AND p.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
        
        ORDER BY timestamp DESC
        LIMIT 20
      `)
    ]);

    res.json({
      activities: recentActivity,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    throw createError('Error obteniendo actividad reciente', 500);
  }
}));

// Dashboard - Estadísticas de rendimiento
router.get('/dashboard/performance', requirePermission('dashboard.view'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const [
      conversionRateResult,
      averageRevenueResult,
      churnRateResult,
      topPlansResult
    ] = await Promise.all([
      // Tasa de conversión (usuarios que se suscriben)
      executeQuery(`
        SELECT 
          (SELECT COUNT(*) FROM subscriptions WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as subscriptions,
          (SELECT COUNT(*) FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as users
      `),
      
      // Ingreso promedio por usuario
      executeQuery(`
        SELECT AVG(amount) as average
        FROM payments 
        WHERE status = 'completed' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      `),
      
      // Tasa de cancelación
      executeQuery(`
        SELECT 
          (SELECT COUNT(*) FROM subscriptions WHERE status = 'cancelled' AND updated_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)) as cancelled,
          (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active
      `),
      
      // Planes más populares
      executeQuery(`
        SELECT 
          sp.name,
          COUNT(s.id) as subscriptions,
          SUM(p.amount) as revenue
        FROM subscription_plans sp
        LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
        LEFT JOIN payments p ON s.id = p.subscription_id AND p.status = 'completed'
        WHERE sp.is_active = true
        GROUP BY sp.id, sp.name
        ORDER BY subscriptions DESC
        LIMIT 5
      `)
    ]);

    const conversionData = (conversionRateResult as any[])[0];
    const conversionRate = conversionData.users > 0 
      ? (conversionData.subscriptions / conversionData.users) * 100 
      : 0;

    const churnData = (churnRateResult as any[])[0];
    const churnRate = churnData.active > 0 
      ? (churnData.cancelled / churnData.active) * 100 
      : 0;

    res.json({
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageRevenue: (averageRevenueResult as any[])[0]?.average || 0,
      churnRate: Math.round(churnRate * 100) / 100,
      topPlans: topPlansResult,
      lastUpdated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de rendimiento:', error);
    throw createError('Error obteniendo estadísticas de rendimiento', 500);
  }
}));

// Función auxiliar para calcular porcentaje de crecimiento
function calculateGrowthPercentage(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100 * 100) / 100;
}

export default router;
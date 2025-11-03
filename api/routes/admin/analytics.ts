import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { query, validationResult } from 'express-validator';
import { pool } from '../../lib/database.js';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(adminAuth);

// GET /admin/analytics/overview - Resumen general
router.get('/overview', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Período inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array()
      });
    }

    const period = req.query.period as string || '30d';
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = daysMap[period];

    // Obtener métricas generales
    const [totalUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );

    const [totalRevenue] = await pool.execute<RowDataPacket[]>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = "completed" AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );

    const [totalSubscriptions] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM subscriptions WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );

    const [activeSubscriptions] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM subscriptions WHERE status = "active"'
    );

    const [totalPayments] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM payments WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );

    const [successfulPayments] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM payments WHERE status = "completed" AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );

    const successRate = totalPayments[0].count > 0 
      ? (successfulPayments[0].count / totalPayments[0].count) * 100 
      : 0;

    // Obtener datos de crecimiento (comparación con período anterior)
    const [previousUsers] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days * 2, days]
    );

    const [previousRevenue] = await pool.execute<RowDataPacket[]>(
      'SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE status = "completed" AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days * 2, days]
    );

    const userGrowth = previousUsers[0].count > 0 
      ? ((totalUsers[0].count - previousUsers[0].count) / previousUsers[0].count) * 100 
      : 100;

    const revenueGrowth = previousRevenue[0].total > 0 
      ? ((totalRevenue[0].total - previousRevenue[0].total) / previousRevenue[0].total) * 100 
      : 100;

    res.json({
      success: true,
      data: {
        period,
        metrics: {
          totalUsers: totalUsers[0].count,
          totalRevenue: totalRevenue[0].total,
          totalSubscriptions: totalSubscriptions[0].count,
          activeSubscriptions: activeSubscriptions[0].count,
          successRate: Math.round(successRate * 100) / 100,
          userGrowth: Math.round(userGrowth * 100) / 100,
          revenueGrowth: Math.round(revenueGrowth * 100) / 100
        }
      }
    });
  } catch (error) {
    console.error('Error fetching overview analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las analíticas generales'
    });
  }
});

// GET /admin/analytics/revenue - Analíticas de ingresos
router.get('/revenue', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Período inválido'),
  query('groupBy').optional().isIn(['day', 'week', 'month']).withMessage('Agrupación inválida'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array()
      });
    }

    const period = req.query.period as string || '30d';
    const groupBy = req.query.groupBy as string || 'day';
    
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = daysMap[period];

    let dateFormat: string;
    switch (groupBy) {
      case 'week':
        dateFormat = '%Y-%u';
        break;
      case 'month':
        dateFormat = '%Y-%m';
        break;
      default:
        dateFormat = '%Y-%m-%d';
    }

    // Obtener ingresos agrupados por período
    const [revenueData] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE_FORMAT(created_at, ?) as period,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(*) as transactions
      FROM payments 
      WHERE status = "completed" 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(created_at, ?)
      ORDER BY period`,
      [dateFormat, days, dateFormat]
    );

    // Obtener ingresos por método de pago
    const [paymentMethods] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        payment_method,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(*) as transactions
      FROM payments 
      WHERE status = "completed" 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY payment_method
      ORDER BY revenue DESC`,
      [days]
    );

    // Obtener top productos/planes
    const [topPlans] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        sp.name,
        COALESCE(SUM(p.amount), 0) as revenue,
        COUNT(p.id) as sales
      FROM payments p
      JOIN subscriptions s ON p.subscription_id = s.id
      JOIN subscription_plans sp ON s.plan_id = sp.id
      WHERE p.status = "completed" 
        AND p.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY sp.id, sp.name
      ORDER BY revenue DESC
      LIMIT 10`,
      [days]
    );

    res.json({
      success: true,
      data: {
        period,
        groupBy,
        revenueOverTime: revenueData,
        paymentMethods,
        topPlans
      }
    });
  } catch (error) {
    console.error('Error fetching revenue analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las analíticas de ingresos'
    });
  }
});

// GET /admin/analytics/subscriptions - Analíticas de suscripciones
router.get('/subscriptions', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Período inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array()
      });
    }

    const period = req.query.period as string || '30d';
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = daysMap[period];

    // Obtener distribución por estado
    const [statusDistribution] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        status,
        COUNT(*) as count
      FROM subscriptions 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY status`,
      [days]
    );

    // Obtener distribución por plan
    const [planDistribution] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        sp.name,
        sp.price,
        COUNT(s.id) as subscribers,
        COALESCE(SUM(CASE WHEN s.status = 'active' THEN sp.price ELSE 0 END), 0) as mrr
      FROM subscription_plans sp
      LEFT JOIN subscriptions s ON sp.id = s.plan_id 
        AND s.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY sp.id, sp.name, sp.price
      ORDER BY subscribers DESC`,
      [days]
    );

    // Obtener tasa de churn
    const [churnData] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(*) as total
      FROM subscriptions 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    const churnRate = churnData[0].total > 0 
      ? (churnData[0].cancelled / churnData[0].total) * 100 
      : 0;

    // Obtener nuevas suscripciones por día
    const [newSubscriptions] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as count
      FROM subscriptions 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date`,
      [days]
    );

    res.json({
      success: true,
      data: {
        period,
        statusDistribution,
        planDistribution,
        churnRate: Math.round(churnRate * 100) / 100,
        newSubscriptions
      }
    });
  } catch (error) {
    console.error('Error fetching subscription analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las analíticas de suscripciones'
    });
  }
});

// GET /admin/analytics/users - Analíticas de usuarios
router.get('/users', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Período inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array()
      });
    }

    const period = req.query.period as string || '30d';
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = daysMap[period];

    // Obtener registros de usuarios por día
    const [userRegistrations] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date`,
      [days]
    );

    // Obtener usuarios activos
    const [activeUsers] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(DISTINCT user_id) as count
      FROM user_sessions 
      WHERE last_activity >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    // Obtener distribución geográfica (si tienes datos de ubicación)
    const [geographicDistribution] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COALESCE(country, 'Unknown') as country,
        COUNT(*) as count
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY country
      ORDER BY count DESC
      LIMIT 10`,
      [days]
    );

    // Obtener retención de usuarios
    const [retentionData] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATEDIFF(NOW(), created_at) as days_since_registration,
        COUNT(*) as users,
        COUNT(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 END) as active_users
      FROM users 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATEDIFF(NOW(), created_at)
      ORDER BY days_since_registration`,
      [days]
    );

    res.json({
      success: true,
      data: {
        period,
        userRegistrations,
        activeUsers: activeUsers[0]?.count || 0,
        geographicDistribution,
        retentionData
      }
    });
  } catch (error) {
    console.error('Error fetching user analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las analíticas de usuarios'
    });
  }
});

// GET /admin/analytics/payments - Analíticas de pagos
router.get('/payments', [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Período inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array()
      });
    }

    const period = req.query.period as string || '30d';
    const daysMap: Record<string, number> = {
      '7d': 7,
      '30d': 30,
      '90d': 90,
      '1y': 365
    };
    const days = daysMap[period];

    // Obtener distribución por estado de pago
    const [statusDistribution] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        status,
        COUNT(*) as count,
        COALESCE(SUM(amount), 0) as total_amount
      FROM payments 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY status`,
      [days]
    );

    // Obtener transacciones por día
    const [dailyTransactions] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        DATE_FORMAT(created_at, '%Y-%m-%d') as date,
        COUNT(*) as transactions,
        COALESCE(SUM(amount), 0) as revenue,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM payments 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m-%d')
      ORDER BY date`,
      [days]
    );

    // Obtener métodos de pago más utilizados
    const [paymentMethodStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        payment_method,
        COUNT(*) as transactions,
        COALESCE(SUM(amount), 0) as revenue,
        AVG(amount) as avg_amount,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as successful,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed
      FROM payments 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
      GROUP BY payment_method
      ORDER BY transactions DESC`,
      [days]
    );

    // Obtener estadísticas de reembolsos
    const [refundStats] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        COUNT(*) as total_refunds,
        COALESCE(SUM(amount), 0) as total_refunded
      FROM payments 
      WHERE status = 'refunded' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)`,
      [days]
    );

    res.json({
      success: true,
      data: {
        period,
        statusDistribution,
        dailyTransactions,
        paymentMethodStats,
        refundStats: refundStats[0]
      }
    });
  } catch (error) {
    console.error('Error fetching payment analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las analíticas de pagos'
    });
  }
});

// POST /admin/analytics/export - Exportar reportes
router.post('/export', [
  query('type').isIn(['overview', 'revenue', 'subscriptions', 'users', 'payments']).withMessage('Tipo de reporte inválido'),
  query('format').isIn(['csv', 'excel', 'pdf']).withMessage('Formato inválido'),
  query('period').optional().isIn(['7d', '30d', '90d', '1y']).withMessage('Período inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array()
      });
    }

    const { type, format, period = '30d' } = req.query;

    // Aquí implementarías la lógica real de exportación
    // Por ahora simulamos la generación del archivo
    
    const filename = `${type}_report_${period}_${Date.now()}.${format}`;
    
    res.json({
      success: true,
      data: {
        filename,
        downloadUrl: `/api/admin/analytics/download/${filename}`,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      },
      message: 'Reporte generado exitosamente'
    });
  } catch (error) {
    console.error('Error exporting report:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar el reporte'
    });
  }
});

export default router;
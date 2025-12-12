const express = require('express');
const { pool } = require('../config/database.cjs');
const bcrypt = require('bcryptjs');

const router = express.Router();

<<<<<<< HEAD
// Middleware de autenticación para admin
=======
// Configuración de la base de datos (reutilizar del servidor principal)
const dbConfig = {
  host: process.env.DB_HOST || 'srv1196.hstgr.io',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'u689528678_SSALAZARCA',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA',
  charset: 'utf8mb4',
  timezone: '+00:00',
  ssl: {
    rejectUnauthorized: false
  }
};

// Middleware de autenticación para admin (acepta JWT y token simple admin-token-*)
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
    }

    const token = authHeader.substring(7);

<<<<<<< HEAD
    // Verificar token simple por ahora
=======
    // Permitir tokens de prueba con prefijo admin-token-
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
    if (token.startsWith('admin-token-')) {
      req.admin = { id: 1, email: 'admin@cafecolombia.com', role: 'admin' };
      return next();
    }

    // Intentar verificar JWT con la misma secret usada en server.cjs
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'admin-secret-key');
      req.admin = { id: decoded.id, email: decoded.email, role: 'admin', permissions: decoded.permissions || [] };
      return next();
    } catch (jwtErr) {
      return res.status(401).json({ success: false, message: 'Token inválido' });
    }
  } catch (error) {
    console.error('Error en autenticación admin:', error);
    return res.status(401).json({ success: false, message: 'Error de autenticación' });
  }
};

// =====================
// RUTAS DE CONFIGURACIÓN
// =====================

// GET /admin/settings - Obtener todas las configuraciones
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
<<<<<<< HEAD
=======
    const connection = await mysql.createConnection(dbConfig);
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
    try {
      const [settings] = await pool.execute(`
        SELECT 
          id,
          category,
          setting_key,
          setting_value,
          description,
          data_type,
          is_public,
          updated_at
        FROM system_settings 
        ORDER BY category, setting_key
      `);

      // Agrupar configuraciones por categoría
      const groupedSettings = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = {};
        }
<<<<<<< HEAD

        // Parsear valor según el tipo de dato
=======
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
        let parsedValue = setting.setting_value;
        try {
          if (setting.data_type === 'json') parsedValue = JSON.parse(setting.setting_value);
          else if (setting.data_type === 'boolean') parsedValue = setting.setting_value === 'true';
          else if (setting.data_type === 'number') parsedValue = parseFloat(setting.setting_value);
        } catch (_) {}
        acc[setting.category][setting.setting_key] = {
          value: parsedValue,
          description: setting.description,
          data_type: setting.data_type,
          is_public: setting.is_public,
          updated_at: setting.updated_at
        };
<<<<<<< HEAD

        return acc;
      }, {});

      res.json({
        success: true,
        data: groupedSettings
      });
=======
        return acc;
      }, {});

      await connection.end();
      res.json({ success: true, data: groupedSettings });
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad

    } catch (dbError) {
      throw dbError;
    }
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// GET /admin/settings/payment - Obtener configuraciones de pago específicamente
router.get('/settings/payment', authenticateAdmin, async (req, res) => {
  try {
<<<<<<< HEAD
=======
    const connection = await mysql.createConnection(dbConfig);
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
    try {
      const [settings] = await pool.execute(`
        SELECT 
          setting_key,
          setting_value,
          description,
          data_type,
          updated_at
        FROM system_settings 
        WHERE category = 'payment'
        ORDER BY setting_key
      `);

      const paymentSettings = {};
      settings.forEach(setting => {
        let parsedValue = setting.setting_value;
        try {
          if (setting.data_type === 'json') parsedValue = JSON.parse(setting.setting_value);
          else if (setting.data_type === 'boolean') parsedValue = setting.setting_value === 'true';
          else if (setting.data_type === 'number') parsedValue = parseFloat(setting.setting_value);
        } catch (_) {}
        paymentSettings[setting.setting_key] = parsedValue;
      });

<<<<<<< HEAD
      res.json({
        success: true,
        data: paymentSettings
      });
=======
      await connection.end();
      res.json({ success: true, data: paymentSettings });
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad

    } catch (dbError) {
      throw dbError;
    }
  } catch (error) {
    console.error('Error obteniendo configuraciones de pago:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// =====================
// RUTAS DE ANALÍTICAS
// =====================

// GET /admin/analytics/totals - Métricas totales
router.get('/analytics/totals', authenticateAdmin, async (req, res) => {
  let connection = null;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [[totalUsers]] = await connection.execute("SELECT COUNT(*) AS count FROM users");
    const [[totalRevenue]] = await connection.execute("SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed'");
    const [[totalSubscriptions]] = await connection.execute("SELECT COUNT(*) AS count FROM subscriptions");
    const [[activeSubscriptions]] = await connection.execute("SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'active'");
    const [[totalPayments]] = await connection.execute("SELECT COUNT(*) AS count FROM payments");
    const [[successfulPayments]] = await connection.execute("SELECT COUNT(*) AS count FROM payments WHERE status = 'completed'");

    const successRate = totalPayments.count > 0
      ? Math.round(((successfulPayments.count / totalPayments.count) * 100) * 100) / 100
      : 0;

    await connection.end();

    return res.json({
      success: true,
      data: {
        metrics: {
          totalUsers: totalUsers.count || 0,
          totalRevenue: Number(totalRevenue.total) || 0,
          totalSubscriptions: totalSubscriptions.count || 0,
          activeSubscriptions: activeSubscriptions.count || 0,
          totalPayments: totalPayments.count || 0,
          successfulPayments: successfulPayments.count || 0,
          successRate
        }
      }
    });
  } catch (error) {
    if (connection) { try { await connection.end(); } catch (_) {} }
    console.error('Error fetching totals analytics (admin.cjs):', error);
    return res.status(500).json({ success: false, message: 'Error al obtener las métricas totales' });
  }
});

// GET /admin/analytics/overview - Resumen general
router.get('/analytics/overview', authenticateAdmin, async (req, res) => {
  let connection = null;
  try {
    const period = (req.query.period || '30d').toString();
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
    const days = daysMap[period] || 30;

    connection = await mysql.createConnection(dbConfig);

    const [[totalUsers]] = await connection.execute(
      'SELECT COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );
    const [[totalRevenue]] = await connection.execute(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)",
      [days]
    );
    const [[totalSubscriptions]] = await connection.execute(
      'SELECT COUNT(*) AS count FROM subscriptions WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );
    const [[activeSubscriptions]] = await connection.execute(
      "SELECT COUNT(*) AS count FROM subscriptions WHERE status = 'active'"
    );
    const [[totalPayments]] = await connection.execute(
      'SELECT COUNT(*) AS count FROM payments WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days]
    );
    const [[successfulPayments]] = await connection.execute(
      "SELECT COUNT(*) AS count FROM payments WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)",
      [days]
    );

    const successRate = totalPayments.count > 0
      ? Math.round(((successfulPayments.count / totalPayments.count) * 100) * 100) / 100
      : 0;

    const [[previousUsers]] = await connection.execute(
      'SELECT COUNT(*) AS count FROM users WHERE created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)',
      [days * 2, days]
    );
    const [[previousRevenue]] = await connection.execute(
      "SELECT COALESCE(SUM(amount), 0) AS total FROM payments WHERE status = 'completed' AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY) AND created_at < DATE_SUB(NOW(), INTERVAL ? DAY)",
      [days * 2, days]
    );

    await connection.end();

    const userGrowth = previousUsers.count > 0
      ? Math.round((((totalUsers.count - previousUsers.count) / previousUsers.count) * 100) * 100) / 100
      : 100;
    const revenueGrowth = Number(previousRevenue.total) > 0
      ? Math.round((((Number(totalRevenue.total) - Number(previousRevenue.total)) / Number(previousRevenue.total)) * 100) * 100) / 100
      : 100;

    return res.json({
      success: true,
      data: {
        period,
        metrics: {
          totalUsers: totalUsers.count || 0,
          totalRevenue: Number(totalRevenue.total) || 0,
          totalSubscriptions: totalSubscriptions.count || 0,
          activeSubscriptions: activeSubscriptions.count || 0,
          successRate,
          userGrowth,
          revenueGrowth
        }
      }
    });
  } catch (error) {
    if (connection) { try { await connection.end(); } catch (_) {} }
    console.error('Error fetching overview analytics (admin.cjs):', error);
    return res.status(500).json({ success: false, message: 'Error al obtener las analíticas generales' });
  }
});

// =====================
// GRÁFICOS DEL DASHBOARD
// =====================

// GET /admin/dashboard/charts - Datos para gráficos (respuesta con envoltura estándar)
router.get('/dashboard/charts', authenticateAdmin, async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const chartData = {
      user_registrations: [
        { month: 'Ene', count: 12 },
        { month: 'Feb', count: 18 },
        { month: 'Mar', count: 25 }
      ],
      monthly_revenue: [
        { month: 'Ene', revenue: 1200 },
        { month: 'Feb', revenue: 1800 },
        { month: 'Mar', revenue: 2400 }
      ],
      subscriptions_by_plan: [
        { plan_name: 'Básico', count: 30 },
        { plan_name: 'Premium', count: 45 },
        { plan_name: 'Enterprise', count: 10 }
      ],
      payment_methods: [
        { method: 'card', count: 40 },
        { method: 'pse', count: 20 },
        { method: 'nequi', count: 10 }
      ],
      period,
      lastUpdate: new Date().toISOString()
    };

    return res.json({ success: true, data: chartData });
  } catch (error) {
    console.error('Error obteniendo datos de gráficos (admin.cjs):', error);
    return res.status(500).json({ success: false, message: 'Error obteniendo datos de gráficos' });
  }
});

module.exports = router;
const express = require('express');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const router = express.Router();

// Middleware de autenticación para admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Token de acceso requerido' });
    }

    const token = authHeader.substring(7);

    // Verificar token simple por ahora (Dev mode)
    if (token.startsWith('admin-token-')) {
      req.admin = { id: 1, email: 'admin@test.com', role: 'admin' };
      return next();
    }

    try {
      const jwt = require('jsonwebtoken');
      // Usar la misma clave que en authController
      const secret = process.env.JWT_SECRET || 'cafe_colombia_jwt_secret_key_2024';
      const decoded = jwt.verify(token, secret);
      req.admin = decoded;
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
// RUTAS DE CONFIGURACIÓN (MOCK LOCAL)
// =====================

router.get('/settings', authenticateAdmin, async (req, res) => {
  // Mock settings for local dev
  const mockSettings = {
    general: {
      site_name: { value: 'Café Colombia (Local)', data_type: 'string', is_public: 1 },
      maintenance_mode: { value: false, data_type: 'boolean', is_public: 1 }
    }
  };
  return res.json({ success: true, data: mockSettings });
});

router.get('/settings/payment', authenticateAdmin, async (req, res) => {
  const mockPaymentSettings = {
    currency: 'COP',
    allow_partial_payments: true
  };
  return res.json({ success: true, data: mockPaymentSettings });
});

// =====================
// RUTAS DE ANALÍTICAS (MOCK/PRISMA HYBRID)
// =====================

router.get('/analytics/totals', authenticateAdmin, async (req, res) => {
  try {
    // Intentar contar usuarios reales desde SQLite
    const totalUsers = await prisma.user.count();
    // Si no hay usuarios en la tabla 'User', usar conteo de Caficultores
    const totalGrowers = await prisma.coffeeGrower.count();

    // Datos financieros simulados para local
    return res.json({
      success: true,
      data: {
        metrics: {
          totalUsers: totalUsers + totalGrowers,
          totalRevenue: 154000000,
          totalSubscriptions: 12,
          activeSubscriptions: 10,
          totalPayments: 450,
          successfulPayments: 442,
          successRate: 98.2
        }
      }
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    // Fallback Mock total
    return res.json({
      success: true,
      data: {
        metrics: {
          totalUsers: 5,
          totalRevenue: 0,
          totalSubscriptions: 0,
          activeSubscriptions: 0,
          totalPayments: 0,
          successfulPayments: 0,
          successRate: 0
        }
      }
    });
  }
});

router.get('/analytics/overview', authenticateAdmin, async (req, res) => {
  const period = req.query.period || '30d';

  return res.json({
    success: true,
    data: {
      period,
      metrics: {
        totalUsers: 150,
        totalRevenue: 5000000,
        totalSubscriptions: 10,
        activeSubscriptions: 8,
        successRate: 95,
        userGrowth: 12.5,
        revenueGrowth: 8.4
      }
    }
  });
});

// =====================
// GRÁFICOS DEL DASHBOARD
// =====================

router.get('/dashboard/charts', authenticateAdmin, async (req, res) => {
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
});

module.exports = router;
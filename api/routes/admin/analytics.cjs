const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Mock Analytics Data for Local Dev
const mockAnalytics = {
  userGrowth: [
    { date: '2024-01-01', newUsers: 5, activeUsers: 4, totalUsers: 5 },
    { date: '2024-01-08', newUsers: 8, activeUsers: 6, totalUsers: 13 },
    { date: '2024-01-15', newUsers: 12, activeUsers: 10, totalUsers: 25 },
    { date: '2024-01-22', newUsers: 15, activeUsers: 12, totalUsers: 40 },
    { date: '2024-01-29', newUsers: 20, activeUsers: 18, totalUsers: 60 }
  ],
  revenueData: [
    { date: '2024-01-01', revenue: 50000, subscriptions: 2 },
    { date: '2024-01-08', revenue: 75000, subscriptions: 3 },
    { date: '2024-01-15', revenue: 120000, subscriptions: 5 },
    { date: '2024-01-22', revenue: 180000, subscriptions: 7 },
    { date: '2024-01-29', revenue: 250000, subscriptions: 10 }
  ],
  summary: {
    totalRevenue: 675000,
    totalUsers: 60,
    activeUsers: 50,
    averageRevenue: 135000,
    growthRate: '25.5'
  },
  topMetrics: [
    { name: 'Usuarios Activos', value: 50, change: 12.5, trend: 'up' },
    { name: 'Total Fincas', value: 45, change: 8.3, trend: 'up' },
    { name: 'Usuarios Totales', value: 60, change: 15.2, trend: 'up' },
    { name: 'Crecimiento', value: 25.5, change: 5.0, trend: 'up' }
  ],
  deviceStats: [
    { device: 'Desktop', users: 30, percentage: 50 },
    { device: 'Mobile', users: 24, percentage: 40 },
    { device: 'Tablet', users: 6, percentage: 10 }
  ],
  geographicData: [
    { region: 'Huila', users: 25, revenue: 250000 },
    { region: 'Antioquia', users: 20, revenue: 200000 },
    { region: 'Nariño', users: 15, revenue: 150000 }
  ]
};

// GET /api/admin/analytics - Obtener datos de analíticas
router.get('/', async (req, res) => {
  try {
    const { period = '30d' } = req.query;
    res.json({
      success: true,
      period,
      data: mockAnalytics
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Error obteniendo analíticas' });
  }
});

// GET /api/admin/analytics/export - Exportar datos
router.get('/export', async (req, res) => {
  try {
    const { period = '30d', format = 'json' } = req.query;

    if (format === 'csv') {
      let csv = 'Fecha,Nuevos Usuarios,Usuarios Activos,Ingresos\n';
      mockAnalytics.userGrowth.forEach((item, index) => {
        const revenue = mockAnalytics.revenueData[index]?.revenue || 0;
        csv += `${item.date},${item.newUsers},${item.activeUsers},${revenue}\n`;
      });
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${period}.csv`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        period,
        exportedAt: new Date().toISOString(),
        data: mockAnalytics
      });
    }
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({ error: 'Error exportando datos' });
  }
});

// GET /api/admin/analytics/totals - Totales para dashboard (Real Data)
router.get('/totals', async (req, res) => {
  try {
    const [usersCount, growersCount, farmsCount, adminsCount] = await Promise.all([
      prisma.user.count(),
      prisma.coffeeGrower.count(),
      prisma.farm.count(), // Using modern Farm table
      prisma.adminUser.count()
    ]);

    // Calcular total de "Usuarios del Sistema" como suma o específicos
    const totalSystemUsers = usersCount + growersCount + adminsCount;

    res.json({
      metrics: {
        totalUsers: totalSystemUsers, // Sum of all user types
        activeUsers: growersCount, // Proxied by growers for now
        totalCoffeeGrowers: growersCount,
        totalFarms: farmsCount,
        totalSubscriptions: 0, // No subscription table yet?
        totalRevenue: 0, // Needs payment logic
        admins: adminsCount
      }
    });
  } catch (error) {
    console.error('Error fetching analytics totals:', error);
    // Expose error to frontend to diagnose "0" issue
    res.status(500).json({
      success: false,
      error: 'Error de conexión a Base de Datos',
      details: error.message
    });
  }
});

// GET /api/admin/analytics/overview - Vista general
router.get('/overview', (req, res) => {
  res.json({
    metrics: {
      userGrowth: 15,
      revenueGrowth: 20,
      subscriptionsGrowth: 10
    }
  });
});

module.exports = router;

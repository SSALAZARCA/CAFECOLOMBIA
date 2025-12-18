const express = require('express');
const router = express.Router();
// MySQL imports removed for local dev safety
// const mysql = require('mysql2/promise');


// GET /api/admin/reports - Generar reporte completo
router.get('/', async (req, res) => {
    try {
        const { period = '12months', type = 'overview' } = req.query;

        // Mock Data Safe for Local Dev
        res.json({
            userGrowth: [
                { month: 'Jan', users: 10, growth: 5 },
                { month: 'Feb', users: 15, growth: 50 },
                { month: 'Mar', users: 20, growth: 33 },
                { month: 'Apr', users: 25, growth: 25 },
                { month: 'May', users: 40, growth: 60 },
                { month: 'Jun', users: 45, growth: 12 }
            ],
            revenueAnalysis: [
                { month: 'Jan', revenue: 100000, subscriptions: 10 },
                { month: 'Feb', revenue: 150000, subscriptions: 15 },
                { month: 'Mar', revenue: 200000, subscriptions: 20 },
                { month: 'Apr', revenue: 250000, subscriptions: 25 },
                { month: 'May', revenue: 400000, subscriptions: 40 },
                { month: 'Jun', revenue: 450000, subscriptions: 45 }
            ],
            subscriptionDistribution: [
                { plan: 'ADMINISTRADOR', count: 1, revenue: 0 },
                { plan: 'TRABAJADOR', count: 5, revenue: 0 },
                { plan: 'CAFICULTOR', count: 40, revenue: 4000000 }
            ],
            paymentMethods: [
                { method: 'Tarjeta de Crédito', count: 20, percentage: 50 },
                { method: 'Transferencia', count: 15, percentage: 37.5 },
                { method: 'Efectivo', count: 5, percentage: 12.5 }
            ],
            coffeeGrowerStats: [
                { region: 'Antioquia', growers: 10, farms: 12 },
                { region: 'Huila', growers: 15, farms: 20 },
                { region: 'Caldas', growers: 8, farms: 8 }
            ],
            topPerformingPlans: [
                { plan: 'Plan Pro', subscribers: 25, revenue: 1250000, churnRate: 2.1 },
                { plan: 'Plan Básico', subscribers: 15, revenue: 450000, churnRate: 4.5 }
            ],
            monthlyMetrics: {
                totalUsers: 46,
                activeSubscriptions: 40,
                totalRevenue: 1700000,
                churnRate: 3.2,
                averageRevenuePerUser: 37000,
                conversionRate: 12.5
            },
            trends: {
                userGrowthRate: 12.5,
                revenueGrowthRate: 8.3,
                subscriptionGrowthRate: 15.2,
                churnTrend: -2.1
            }
        });
    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Error generando reporte' });
    }
});

// GET /api/admin/reports/export - Exportar reporte
router.get('/export', async (req, res) => {
    try {
        const { format = 'pdf' } = req.query;

        // Por ahora retornar mensaje de éxito
        res.json({
            success: true,
            message: `Exportación en formato ${format} simulada correctamente`,
            format: format
        });
    } catch (error) {
        res.status(500).json({ error: 'Error exportando reporte' });
    }
});

module.exports = router;

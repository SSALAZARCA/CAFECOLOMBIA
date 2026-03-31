const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/reports - Reportes combinados de sistema
router.get('/', async (req, res) => {
    try {
        const { period = '12months' } = req.query;

        // 1. Crecimiento de Usuarios (Basado en CoffeeGrowers Reales)
        const growers = await prisma.coffeeGrower.findMany({ 
            select: { created_at: true },
            orderBy: { created_at: 'asc' }
        });

        const monthlyStats = {};
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

        growers.forEach(g => {
            if (!g.created_at) return;
            const d = new Date(g.created_at);
            const monthKey = `${months[d.getMonth()]} ${d.getFullYear()}`;
            if (!monthlyStats[monthKey]) monthlyStats[monthKey] = 0;
            monthlyStats[monthKey]++;
        });

        const userGrowth = Object.entries(monthlyStats).map(([month, count]) => ({
            month: month.split(' ')[0],
            users: count,
            growth: 0 
        })).slice(-6);

        // 2. Estadísticas Geográficas (Fincas Reales - Legacy y Modern)
        const farmsLegacy = await prisma.farmLegacy.findMany({ select: { id: true } });
        const farmsModern = await prisma.farm.findMany({ select: { department: true } });
        
        const regionMap = {};
        farmsModern.forEach(f => {
            const region = f.department || 'Desconocido';
            if (!regionMap[region]) regionMap[region] = 0;
            regionMap[region]++;
        });

        const coffeeGrowerStats = Object.entries(regionMap).map(([region, count]) => ({
            region,
            farms: count,
            growers: count
        })).sort((a, b) => b.farms - a.farms).slice(0, 5);

        // 3. Totales Financieros Reales (Basados en el nuevo modelo Payment)
        const [totalGrowers, totalFarms, paymentStats, subscriptionStats] = await Promise.all([
            prisma.coffeeGrower.count(),
            prisma.farmLegacy.count() + prisma.farm.count(),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'completed' }
            }),
            prisma.subscription.count({ where: { status: 'active' } })
        ]);

        const totalRevenue = paymentStats._sum.amount || 0;

        res.json({
            userGrowth: userGrowth.length ? userGrowth : [{ month: months[new Date().getMonth()], users: totalGrowers, growth: 0 }],
            revenueAnalysis: [], // TODO: Agregar agregación por mes cuando haya datos
            subscriptionDistribution: [
                { plan: 'Activas', count: subscriptionStats, revenue: totalRevenue }
            ],
            paymentMethods: [],
            coffeeGrowerStats: coffeeGrowerStats,
            topPerformingPlans: [],
            monthlyMetrics: {
                totalUsers: totalGrowers,
                activeSubscriptions: subscriptionStats,
                totalRevenue: totalRevenue,
                churnRate: 0,
                averageRevenuePerUser: totalGrowers ? (totalRevenue / totalGrowers).toFixed(2) : 0,
                conversionRate: 0
            },
            trends: {
                userGrowthRate: 0,
                revenueGrowthRate: 0,
                subscriptionGrowthRate: 0,
                churnTrend: 0
            }
        });

    } catch (error) {
        console.error('Error generando reporte real:', error);
        res.status(500).json({ error: 'Error generando reporte', details: error.message });
    }
});

// GET /api/admin/reports/export
router.get('/export', async (req, res) => {
    res.json({ success: true, message: 'Función de exportación pendiente de implementación con datos reales' });
});

module.exports = router;

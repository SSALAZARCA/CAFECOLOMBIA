const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/admin/reports
router.get('/', async (req, res) => {
    try {
        const { period = '12months' } = req.query;

        // 1. User Growth (Last 6-12 months)
        // Group CoffeeGrowers and Users by created_at month
        const growers = await prisma.coffeeGrower.findMany({ select: { created_at: true } });
        // const genericUsers = await prisma.user.findMany({ select: { createdAt: true } }); // Optional merge

        const monthlyStats = {};
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

        growers.forEach(g => {
            if (!g.created_at) return;
            const d = new Date(g.created_at);
            const monthKey = `${months[d.getMonth()]} ${d.getFullYear()}`; // Unique key
            if (!monthlyStats[monthKey]) monthlyStats[monthKey] = 0;
            monthlyStats[monthKey]++;
        });

        const userGrowth = Object.entries(monthlyStats).map(([month, count]) => ({
            month: month.split(' ')[0], // Simpler label
            users: count,
            growth: 0 // Placeholder or calculate diff
        })).slice(-6); // Last 6 months

        // 2. Geographic Stats (Farms by Department)
        // Check if Farm has department
        const farms = await prisma.farm.findMany({ select: { department: true } });
        const regionMap = {};
        farms.forEach(f => {
            const region = f.department || 'Desconocido';
            if (!regionMap[region]) regionMap[region] = 0;
            regionMap[region]++;
        });

        const coffeeGrowerStats = Object.entries(regionMap).map(([region, count]) => ({
            region,
            farms: count, // Using farm count as proxy for grower density
            growers: count
        })).sort((a, b) => b.farms - a.farms).slice(0, 5);

        // 3. Real Totals
        const totalGrowers = await prisma.coffeeGrower.count();
        const totalFarms = await prisma.farm.count();

        res.json({
            userGrowth: userGrowth.length ? userGrowth : [{ month: 'N/A', users: 0, growth: 0 }],
            // Mocking revenue/subscriptions as those tables are not populated yet
            revenueAnalysis: [],
            subscriptionDistribution: [
                { plan: 'TRABAJADOR', count: 0, revenue: 0 },
                { plan: 'CAFICULTOR', count: totalGrowers, revenue: 0 }
            ],
            paymentMethods: [],
            coffeeGrowerStats: coffeeGrowerStats,
            topPerformingPlans: [],
            monthlyMetrics: {
                totalUsers: totalGrowers,
                activeSubscriptions: 0,
                totalRevenue: 0,
                churnRate: 0,
                averageRevenuePerUser: 0,
                conversionRate: 0
            },
            trends: {
                userGrowthRate: 0, // Calculate if needed
                revenueGrowthRate: 0,
                subscriptionGrowthRate: 0,
                churnTrend: 0
            }
        });

    } catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Error generando reporte', details: error.message });
    }
});

// GET /api/admin/reports/export
router.get('/export', async (req, res) => {
    res.json({ success: true, message: 'Función de exportación pendiente de implementación real' });
});

module.exports = router;

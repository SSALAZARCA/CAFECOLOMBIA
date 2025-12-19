const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/admin/dashboard/metrics
router.get('/metrics', async (req, res) => {
    try {
        const [usersCount, growersCount, farmsCount, adminsCount, activeGrowers] = await Promise.all([
            prisma.user.count(),
            prisma.coffeeGrower.count(),
            prisma.farm.count(),
            prisma.adminUser.count(),
            prisma.coffeeGrower.count({ where: { status: 'active' } })
        ]);

        const totalSystemUsers = usersCount + growersCount + adminsCount;

        // Fetch real subscriptions (if schema allows, otherwise 0)
        // Assuming subscription plans are managed via a relation or external service not yet fully modeled or used
        // For now, 0 is correct reality.

        // Revenue logic placeholder (zero for now until Payment model populated)

        res.json({
            users: { total: totalSystemUsers, active: activeGrowers }, // Using Active Growers as proxy for activity
            coffee_growers: { total: growersCount },
            farms: { total: farmsCount },
            subscriptions: { total: 0 },
            payments: { revenue_this_month: 0, successful: 0 },
            admins: { total: adminsCount }
        });
    } catch (error) {
        console.error('Error fetching dashboard metrics:', error);
        res.status(500).json({ error: 'Error fetching dashboard metrics', details: error.message });
    }
});

// GET /api/admin/dashboard/charts
router.get('/charts', async (req, res) => {
    try {
        // Generate real chart data based on DB
        // For now, simpler implementation:

        // 1. User Registrations (Growers by month)
        // Group by created_at

        // Since sqlite/mysql differences in date grouping, and for speed, we fetch recent growers and aggregate in JS
        const recentGrowers = await prisma.coffeeGrower.findMany({
            select: { created_at: true },
            orderBy: { created_at: 'asc' },
            take: 100
        });

        // Simple aggregation map
        const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        const registrationsMap = {};

        recentGrowers.forEach(g => {
            const date = new Date(g.created_at);
            const key = months[date.getMonth()];
            if (!registrationsMap[key]) registrationsMap[key] = 0;
            registrationsMap[key]++;
        });

        const user_registrations = Object.keys(registrationsMap).map(key => ({
            month: key,
            count: registrationsMap[key]
        }));

        // Fallback for empty data to show empty chart instead of breaking
        if (user_registrations.length === 0) {
            user_registrations.push({ month: months[new Date().getMonth()], count: 0 });
        }

        res.json({
            monthly_revenue: [],
            subscriptions_by_plan: [],
            user_registrations: user_registrations,
            payment_methods: []
        });

    } catch (error) {
        console.error('Error fetching dashboard charts:', error);
        res.status(500).json({ error: 'Error fetching chart data' });
    }
});

module.exports = router;

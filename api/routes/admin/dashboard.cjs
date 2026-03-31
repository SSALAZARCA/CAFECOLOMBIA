const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/dashboard/metrics
router.get('/metrics', async (req, res) => {
    try {
        const [
            usersCount, 
            growersCount, 
            farmsCount, 
            adminsCount, 
            activeGrowers,
            activeSubs,
            revenueStats
        ] = await Promise.all([
            prisma.user.count(),
            prisma.coffeeGrower.count(),
            prisma.farmLegacy.count() + prisma.farm.count(),
            prisma.adminUser.count(),
            prisma.coffeeGrower.count({ where: { status: 'active' } }),
            prisma.subscription.count({ where: { status: 'active' } }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'completed' }
            })
        ]);

        const totalSystemUsers = usersCount + growersCount + adminsCount;

        res.json({
            users: { total: totalSystemUsers, active: activeGrowers },
            coffee_growers: { total: growersCount },
            farms: { total: farmsCount },
            subscriptions: { total: activeSubs },
            payments: { revenue_this_month: revenueStats._sum.amount || 0, successful: 0 },
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
        const recentGrowers = await prisma.coffeeGrower.findMany({
            select: { created_at: true },
            orderBy: { created_at: 'asc' },
            take: 100
        });

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

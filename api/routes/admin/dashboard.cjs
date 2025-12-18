const express = require('express');
const router = express.Router();

const mockMetrics = {
    users: { total: 150, active: 120 },
    coffee_growers: { total: 45 },
    farms: { total: 30 },
    subscriptions: { total: 25 },
    payments: { revenue_this_month: 5000000, successful: 15 }
};

const mockCharts = {
    monthly_revenue: [
        { month: 'Ene', revenue: 1200000 },
        { month: 'Feb', revenue: 1500000 },
        { month: 'Mar', revenue: 1800000 },
        { month: 'Abr', revenue: 2000000 },
        { month: 'May', revenue: 2500000 },
        { month: 'Jun', revenue: 3000000 }
    ],
    subscriptions_by_plan: [
        { plan_name: 'Básico', count: 10 },
        { plan_name: 'Premium', count: 12 },
        { plan_name: 'Empresarial', count: 3 }
    ],
    user_registrations: [
        { month: 'Ene', count: 5 },
        { month: 'Feb', count: 8 },
        { month: 'Mar', count: 12 },
        { month: 'Abr', count: 15 },
        { month: 'May', count: 20 },
        { month: 'Jun', count: 25 }
    ],
    payment_methods: [
        { method: 'Tarjeta', count: 15 },
        { method: 'Transferencia', count: 5 },
        { method: 'Efectivo', count: 2 }
    ]
};

// GET /api/admin/dashboard/metrics
router.get('/metrics', (req, res) => {
    res.json(mockMetrics);
});

// GET /api/admin/dashboard/charts
router.get('/charts', (req, res) => {
    res.json(mockCharts);
});

module.exports = router;

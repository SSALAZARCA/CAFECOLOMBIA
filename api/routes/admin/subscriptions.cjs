const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/subscriptions - Listar suscripciones reales (Prisma)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, status = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        if (status) {
            where.status = status;
        }

        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    plan: true
                },
                orderBy: { createdAt: 'desc' }
            }),
            prisma.subscription.count({ where })
        ]);

        res.json({
            success: true, 
            data: {
                subscriptions: subscriptions,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching real subscriptions:', error);
        res.status(500).json({ error: 'Error obteniendo suscripciones' });
    }
});

// GET /api/admin/subscriptions/stats - Estadísticas reales
router.get('/stats', async (req, res) => {
    try {
        const [total, active, revenue] = await Promise.all([
            prisma.subscription.count(),
            prisma.subscription.count({ where: { status: 'active' } }),
            prisma.payment.aggregate({
                _sum: { amount: true },
                where: { status: 'completed' }
            })
        ]);

        res.json({
            success: true, 
            data: {
                total,
                active,
                monthlyRevenue: revenue._sum.amount || 0,
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

module.exports = router;

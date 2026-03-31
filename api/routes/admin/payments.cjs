const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/payments - Listar pagos reales
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, status = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        if (status) {
            where.status = status;
        }

        const [payments, total] = await Promise.all([
            prisma.payment.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.payment.count({ where })
        ]);

        res.json({
            success: true, 
            data: {
                payments: payments,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ error: 'Error obteniendo pagos' });
    }
});

// GET /api/admin/payments/stats - Estadísticas reales de pagos
router.get('/stats', async (req, res) => {
    try {
        const stats = await prisma.payment.aggregate({
            _sum: { amount: true },
            _count: { id: true },
            where: { status: 'completed' }
        });

        const pendingCount = await prisma.payment.count({ where: { status: 'pending' } });

        res.json({
            success: true, 
            data: {
                totalRevenue: stats._sum.amount || 0,
                completedPayments: stats._count.id || 0,
                pendingPayments: pendingCount,
                averagePayment: stats._count.id ? Math.round(stats._sum.amount / stats._count.id) : 0
            }
        });
    } catch (error) {
        console.error('Error fetching payment stats:', error);
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// GET /api/admin/payments/:id - Ver pago real
router.get('/:id', async (req, res) => {
    try {
        const payment = await prisma.payment.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!payment) {
            return res.status(404).json({ error: 'Pago no encontrado' });
        }
        res.json({ success: true, data: payment });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo pago' });
    }
});

module.exports = router;

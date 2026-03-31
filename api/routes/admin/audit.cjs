const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/audit - Listar logs de auditoría reales
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, action = '', resource = '' } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);
        const take = parseInt(limit);

        const where = {};
        if (action) where.action = action;
        if (resource) where.resource = resource;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' }
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    page: parseInt(page),
                    limit: take,
                    total,
                    totalPages: Math.ceil(total / take)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        res.status(500).json({ error: 'Error obteniendo logs reales' });
    }
});

// GET /api/admin/audit/stats - Estadísticas de auditoría reales
router.get('/stats', async (req, res) => {
    try {
        const [totalLogs, uniqueUsers] = await Promise.all([
            prisma.auditLog.count(),
            prisma.auditLog.groupBy({
                by: ['userId'],
                _count: true
            })
        ]);

        res.json({
            success: true,
            data: {
                totalLogs,
                uniqueUsers: uniqueUsers.length,
                lastRefresh: new Date()
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// Helper function to log events (can be exported or used via middleware)
router.post('/log-manual', async (req, res) => {
    try {
        const { userId, userName, action, resource, details } = req.body;
        const log = await prisma.auditLog.create({
            data: {
                userId: parseInt(userId),
                userName,
                action,
                resource,
                details,
                ip: req.ip,
                userAgent: req.headers['user-agent']
            }
        });
        res.json({ success: true, log });
    } catch (error) {
        res.status(500).json({ error: 'Error registrando log' });
    }
});

module.exports = router;

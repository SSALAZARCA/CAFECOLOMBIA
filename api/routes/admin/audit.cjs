const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/audit/logs - Alias para listar logs (compatibilidad con AdminAudit.tsx)
router.get('/logs', async (req, res) => {
    try {
        const { page = 1, limit = 50, dateRange = 'today', action = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;
        const take = limitNum;

        const where = {};
        if (action) where.action = action;
        
        // Filtro por fecha (Audit Audit)
        const now = new Date();
        const today = new Date(now.setHours(0,0,0,0));
        
        if (dateRange === 'today') {
            where.createdAt = { gte: today };
        } else if (dateRange === 'week') {
            const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            where.createdAt = { gte: lastWeek };
        } else if (dateRange === 'month') {
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            where.createdAt = { gte: lastMonth };
        }

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: 'desc' },
                include: { admin: true } // Opcional si hay relación
            }),
            prisma.auditLog.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                logs,
                pagination: { page: pageNum, limit: take, total }
            }
        });
    } catch (error) {
        console.error('Audit Logs Error:', error);
        res.status(500).json({ error: 'Error en logs de auditoría' });
    }
});

// GET /api/admin/audit/security-events - Eventos de seguridad (compatibilidad con AdminAudit.tsx)
router.get('/security-events', async (req, res) => {
    try {
        const { dateRange = 'today' } = req.query;
        const where = {
            action: { in: ['LOGIN', 'LOGOUT', 'AUTH_ERROR', 'PASSWORD_CHANGE', 'UNAUTHORIZED_ACCESS'] }
        };

        const now = new Date();
        if (dateRange === 'today') {
            where.createdAt = { gte: new Date(now.setHours(0,0,0,0)) };
        }

        const logs = await prisma.auditLog.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        res.json({ success: true, data: logs });
    } catch (error) {
        res.status(500).json({ error: 'Error en eventos de seguridad' });
    }
});

// GET /api/admin/audit/export - Exportar logs
router.get('/export', async (req, res) => {
    try {
        // En producción se generaría un CSV real aquí
        res.json({ success: true, data: { download_url: '#' } });
    } catch (error) {
        res.status(500).json({ error: 'Error exportando logs' });
    }
});

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

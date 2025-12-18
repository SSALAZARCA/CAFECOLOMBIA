const express = require('express');
const router = express.Router();

// Mock data para logs de auditoría
const mockAuditLogs = [
    {
        id: 1,
        userId: 1,
        userName: 'Admin Principal',
        action: 'LOGIN',
        resource: 'auth',
        details: 'Inicio de sesión exitoso',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(Date.now() - 3600000).toISOString()
    },
    {
        id: 2,
        userId: 1,
        userName: 'Admin Principal',
        action: 'UPDATE',
        resource: 'users',
        resourceId: 5,
        details: 'Actualización de usuario #5',
        ip: '192.168.1.100',
        timestamp: new Date(Date.now() - 7200000).toISOString()
    }
];

// GET /api/admin/audit - Listar logs de auditoría
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, action = '', userId = '' } = req.query;

        let filtered = [...mockAuditLogs];

        if (action) {
            filtered = filtered.filter(log => log.action === action);
        }

        if (userId) {
            filtered = filtered.filter(log => log.userId === parseInt(userId));
        }

        const total = filtered.length;
        const startIndex = (page - 1) * limit;
        const paginated = filtered.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: {
                logs: paginated,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo logs' });
    }
});


// GET /api/admin/audit/logs - Alias para listar logs
router.get('/logs', async (req, res) => {
    // Reutilizar lógica de filtrado de /
    try {
        const { page = 1, limit = 20, action = '', userId = '' } = req.query;
        let filtered = [...mockAuditLogs];

        if (action) filtered = filtered.filter(log => log.action === action);
        if (userId) filtered = filtered.filter(log => log.userId === parseInt(userId));

        const total = filtered.length;
        const startIndex = (page - 1) * limit;
        const paginated = filtered.slice(startIndex, startIndex + parseInt(limit));

        res.json({
            success: true,
            data: {
                logs: paginated,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    totalPages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo logs' });
    }
});

// GET /api/admin/audit/security-events - Logs de seguridad
router.get('/security-events', async (req, res) => {
    try {
        // Mock security events (subset of logs)
        const securityEvents = mockAuditLogs.filter(l => l.resource === 'auth' || l.resource === 'security');
        res.json({
            success: true,
            data: {
                events: securityEvents,
                pagination: { page: 1, limit: 10, total: securityEvents.length, totalPages: 1 }
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo eventos de seguridad' });
    }
});

// GET /api/admin/audit/stats - Estadísticas de auditoría
router.get('/stats', async (req, res) => {
    try {
        const actions = mockAuditLogs.reduce((acc, log) => {
            acc[log.action] = (acc[log.action] || 0) + 1;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                totalLogs: mockAuditLogs.length,
                actionBreakdown: actions,
                uniqueUsers: new Set(mockAuditLogs.map(l => l.userId)).size
            }
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

module.exports = router;

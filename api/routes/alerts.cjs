const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma.cjs');

// GET /api/alerts/smart - Obtener alertas inteligentes reales
router.get('/smart', async (req, res) => {
    try {
        const { farmId, type, severity, isActive } = req.query;
        const where = {};
        if (farmId) where.farmId = parseInt(farmId);
        if (type) where.type = type;
        if (severity) where.severity = severity;
        if (isActive !== undefined) where.isActive = isActive === 'true';

        const alerts = await prisma.alert.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: alerts,
            total: alerts.length
        });
    } catch (error) {
        console.error('Error fetching smart alerts:', error);
        res.status(500).json({ error: 'Error obteniendo alertas reales' });
    }
});

// POST /api/alerts/smart - Crear nueva alerta real
router.post('/smart', async (req, res) => {
    try {
        const { type, severity, title, message, farmId, metadata } = req.body;
        
        const alert = await prisma.alert.create({
            data: {
                type,
                severity,
                title,
                message,
                farmId: farmId ? parseInt(farmId) : null,
                metadata: metadata ? JSON.stringify(metadata) : null
            }
        });

        res.status(201).json({ success: true, data: alert });
    } catch (error) {
        console.error('Error creating smart alert:', error);
        res.status(500).json({ error: 'Error creando alerta real' });
    }
});

// PUT /api/alerts/smart/:id/acknowledge - Reconocer alerta real
router.put('/smart/:id/acknowledge', async (req, res) => {
    try {
        const { id } = req.params;
        const alert = await prisma.alert.update({
            where: { id: parseInt(id) },
            data: { 
                isActive: false, 
                acknowledgedAt: new Date() 
            }
        });
        res.json({ success: true, data: alert });
    } catch (error) {
        res.status(500).json({ error: 'Error reconociendo alerta' });
    }
});

module.exports = router;
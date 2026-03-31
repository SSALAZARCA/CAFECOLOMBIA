const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/settings - Obtener configuración real
router.get('/', async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany();
        
        // Convert to key-value object for easy use
        const formatted = settings.reduce((acc, s) => {
            if (!acc[s.section]) acc[s.section] = {};
            acc[s.section][s.key] = s.value;
            return acc;
        }, {});

        res.json(formatted);
    } catch (error) {
        console.error('Error fetching system settings:', error);
        res.status(500).json({ error: 'Error obteniendo configuración' });
    }
});

// PUT /api/admin/settings - Actualizar configuración real
router.put('/', async (req, res) => {
    try {
        const { section = 'general', data } = req.body;
        
        // Map and upsert each key
        const updates = Object.keys(data).map(key => {
            return prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(data[key]), section },
                create: { key, value: String(data[key]), section }
            });
        });

        await Promise.all(updates);

        res.json({
            success: true,
            message: 'Configuración actualizada en base de datos'
        });
    } catch (error) {
        console.error('Error updating system settings:', error);
        res.status(500).json({ error: 'Error actualizando configuración' });
    }
});

// GET /api/admin/settings/:section - Obtener sección específica real
router.get('/:section', async (req, res) => {
    try {
        const { section } = req.params;
        const settings = await prisma.systemSetting.findMany({
            where: { section }
        });

        const formatted = settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        res.json(formatted);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo sección' });
    }
});

module.exports = router;

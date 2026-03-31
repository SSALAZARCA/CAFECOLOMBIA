const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/security/settings - Obtener configuración de seguridad real
router.get('/settings', async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: { section: 'security' }
        });

        // Convert key-value
        const formatted = settings.reduce((acc, s) => {
            acc[s.key] = s.value;
            return acc;
        }, {});

        // Return real if exists, otherwise fallback to basic structure
        res.json({
            success: true,
            settings: Object.keys(formatted).length > 0 ? formatted : { minLength: 8, requireNumbers: true }
        });
    } catch (error) {
        console.error('Error getting security settings:', error);
        res.status(500).json({ error: 'Error obteniendo configuración' });
    }
});

// PUT /api/admin/security/settings - Actualizar configuración real
router.put('/settings', async (req, res) => {
    try {
        const data = req.body;
        
        const updates = Object.keys(data).map(key => {
            return prisma.systemSetting.upsert({
                where: { key },
                update: { value: String(data[key]), section: 'security' },
                create: { key, value: String(data[key]), section: 'security' }
            });
        });

        await Promise.all(updates);

        res.json({
            success: true,
            message: 'Política de seguridad guardada en base de datos'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error actualizando política' });
    }
});

// GET /api/admin/security/roles - Obtener roles reales (Desde el esquema User)
router.get('/roles', async (req, res) => {
    try {
        // En este esquema, los roles son strings en la tabla User
        // Agrupamos para ver qué roles existen
        const rolesGroups = await prisma.user.groupBy({
            by: ['role'],
            _count: true
        });

        const roles = rolesGroups.map(g => ({
            id: g.role,
            name: g.role,
            userCount: g._count
        }));

        res.json({
            success: true,
            roles
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo roles' });
    }
});

module.exports = router;

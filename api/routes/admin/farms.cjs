const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/farms - Listar fincas reales
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search } },
                { status: { contains: search } }
            ];
        }

        const [farms, total] = await Promise.all([
            prisma.farmLegacy.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    coffeeGrower: true
                },
                orderBy: { id: 'desc' }
            }),
            prisma.farmLegacy.count({ where })
        ]);

        const formattedFarms = farms.map(f => ({
            id: f.id,
            name: f.name,
            ownerId: f.coffee_grower_id,
            ownerName: f.coffeeGrower ? f.coffeeGrower.full_name : 'Desconocido',
            location: f.coffeeGrower ? f.coffeeGrower.location : 'Sin ubicación',
            area: 0, // Legacy no tiene área directamente
            altitude: 0,
            varieties: [],
            certifications: [],
            isActive: f.status === 'active',
            createdAt: new Date().toISOString() // Placeholder para legacy
        }));

        res.json({
            success: true,
            data: {
                farms: formattedFarms,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching farms:', error);
        res.status(500).json({ error: 'Error obteniendo fincas' });
    }
});

// GET /api/admin/farms/stats - Estadísticas reales
router.get('/stats', async (req, res) => {
    try {
        const total = await prisma.farmLegacy.count();
        res.json({
            total: total,
            totalArea: 0,
            averageAltitude: 0,
            certified: 0
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// GET /api/admin/farms/:id - Ver finca real
router.get('/:id', async (req, res) => {
    try {
        const farm = await prisma.farmLegacy.findUnique({
            where: { id: parseInt(req.params.id) },
            include: { coffeeGrower: true }
        });
        
        if (!farm) {
            return res.status(404).json({ error: 'Finca no encontrada' });
        }
        res.json({
            ...farm,
            ownerName: farm.coffeeGrower ? farm.coffeeGrower.full_name : 'Desconocido',
            isActive: farm.status === 'active'
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo finca' });
    }
});

// POST /api/admin/farms - Crear finca real
router.post('/', async (req, res) => {
    try {
        const { name, coffee_grower_id, status } = req.body;
        const farm = await prisma.farmLegacy.create({
            data: {
                name,
                coffee_grower_id: parseInt(coffee_grower_id),
                status: status || 'active'
            }
        });
        res.status(201).json({ success: true, data: farm });
    } catch (error) {
        res.status(500).json({ error: 'Error creando finca' });
    }
});

// PUT /api/admin/farms/:id - Actualizar finca real
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updateData = req.body;
        delete updateData.id;
        delete updateData.ownerName;

        const farm = await prisma.farmLegacy.update({
            where: { id },
            data: updateData
        });
        res.json({ success: true, data: farm });
    } catch (error) {
        res.status(500).json({ error: 'Error actualizando finca' });
    }
});

// DELETE /api/admin/farms/:id - Desactivar finca
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.farmLegacy.update({
            where: { id },
            data: { status: 'inactive' }
        });
        res.json({ success: true, message: 'Finca desactivada' });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando finca' });
    }
});

module.exports = router;

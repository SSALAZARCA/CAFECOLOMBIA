const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/coffee-growers - Listar caficultores (Real Data)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', status = '' } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const where = {};
        if (search) {
            where.OR = [
                { full_name: { contains: search } },
                { email: { contains: search } }
            ];
        }
        if (status) {
            where.status = status;
        }

        const [growers, total] = await Promise.all([
            prisma.coffeeGrower.findMany({
                where,
                skip: (pageNum - 1) * limitNum,
                take: limitNum,
                include: {
                    farms: true // Incluye sus fincas para el contador
                },
                orderBy: { created_at: 'desc' }
            }),
            prisma.coffeeGrower.count({ where })
        ]);

        // Mapear al formato esperado por el frontend
        const formattedGrowers = growers.map(g => ({
            id: g.id,
            firstName: g.full_name.split(' ')[0],
            lastName: g.full_name.split(' ').slice(1).join(' '),
            email: g.email,
            phone: g.phone || 'N/A',
            farms: g.farms.length,
            totalArea: 0, // No hay área en el modelo legacy CoffeeGrower directamente
            certifications: [],
            isActive: g.status === 'active',
            createdAt: g.created_at
        }));

        res.json({
            success: true,
            data: {
                growers: formattedGrowers,
                pagination: {
                    page: pageNum,
                    limit: limitNum,
                    total,
                    totalPages: Math.ceil(total / limitNum)
                }
            }
        });
    } catch (error) {
        console.error('Error fetching coffee growers:', error);
        res.status(500).json({ error: 'Error obteniendo caficultores', details: error.message });
    }
});

// GET /api/admin/coffee-growers/stats - Estadísticas Reales
router.get('/stats', async (req, res) => {
    try {
        const [total, active, totalFarms] = await Promise.all([
            prisma.coffeeGrower.count(),
            prisma.coffeeGrower.count({ where: { status: 'active' } }),
            prisma.farmLegacy.count()
        ]);

        res.json({
            success: true,
            data: {
                total,
                active,
                totalFarms,
                totalArea: 0, // Placeholder ya que legacy no tiene área agregada fácil
                certified: 0
            }
        });
    } catch (error) {
        console.error('Error fetching grower stats:', error);
        res.status(500).json({ error: 'Error obteniendo estadísticas' });
    }
});

// GET /api/admin/coffee-growers/:id - Ver caficultor real
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const grower = await prisma.coffeeGrower.findUnique({
            where: { id },
            include: { farms: true }
        });

        if (!grower) {
            return res.status(404).json({ error: 'Caficultor no encontrado' });
        }

        res.json({ 
            success: true, 
            data: {
                ...grower,
                firstName: grower.full_name.split(' ')[0],
                lastName: grower.full_name.split(' ').slice(1).join(' '),
                farms: grower.farms.length,
                isActive: grower.status === 'active'
            } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo caficultor' });
    }
});

// POST /api/admin/coffee-growers - Crear caficultor real
router.post('/', async (req, res) => {
    try {
        const { full_name, email, password, phone, location } = req.body;
        // En un sistema real, cifraríamos la contraseña aquí
        const grower = await prisma.coffeeGrower.create({
            data: {
                full_name,
                email,
                password_hash: password || 'dummy_hash', 
                phone,
                location,
                status: 'active'
            }
        });
        res.status(201).json({ success: true, data: grower });
    } catch (error) {
        res.status(500).json({ error: 'Error creando caficultor', details: error.message });
    }
});

// PUT /api/admin/coffee-growers/:id - Actualizar caficultor real
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const updateData = req.body;
        
        // Limpiar datos para Prisma
        delete updateData.id;
        delete updateData.farms;

        const grower = await prisma.coffeeGrower.update({
            where: { id },
            data: updateData
        });
        res.json({ success: true, data: grower });
    } catch (error) {
        res.status(500).json({ error: 'Error actualizando caficultor' });
    }
});

// DELETE /api/admin/coffee-growers/:id - Desactivar/Borrar caficultor
router.delete('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        // Soft delete preferido
        await prisma.coffeeGrower.update({
            where: { id },
            data: { status: 'inactive' }
        });
        res.json({ success: true, message: 'Caficultor desactivado' });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando caficultor' });
    }
});

module.exports = router;

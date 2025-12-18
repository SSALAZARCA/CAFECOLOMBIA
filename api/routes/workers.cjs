const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cafe_colombia_jwt_secret_key_2024';

// Middleware de autenticación local (duplicado temporalmente para evitar dependencias externas, idealmente importar de middleware)
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'No autenticado' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Token inválido' });
    }
};

// GET / - Listar trabajadores de la finca del usuario
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Buscar finca del usuario
        // Nota: Asumimos que el usuario tiene al menos una finca moderna (Farm)
        const farm = await prisma.farm.findFirst({
            where: { ownerId: userId }
        });

        if (!farm) {
            return res.json({ success: true, data: [] });
        }

        const workers = await prisma.farmWorker.findMany({
            where: { farmId: farm.id, isActive: true },
            orderBy: { name: 'asc' },
            include: {
                _count: {
                    select: { collections: true, tasks: true }
                }
            }
        });

        res.json({ success: true, data: workers });
    } catch (error) {
        console.error('Error fetching workers:', error);
        res.status(500).json({ success: false, error: 'Error interno obteniendo trabajadores' });
    }
});

// POST / - Crear trabajador
router.post('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, role, phone } = req.body;

        if (!name || !role) {
            return res.status(400).json({ success: false, error: 'Nombre y rol requeridos' });
        }

        // Buscar finca del usuario
        const farm = await prisma.farm.findFirst({
            where: { ownerId: userId }
        });

        if (!farm) {
            return res.status(404).json({ success: false, error: 'No tienes una finca registrada para asociar trabajadores.' });
        }

        const worker = await prisma.farmWorker.create({
            data: {
                farmId: farm.id,
                name,
                role,
                phone: phone || null
            }
        });

        res.status(201).json({
            success: true,
            data: worker,
            message: 'Trabajador creado exitosamente'
        });
    } catch (error) {
        console.error('Error creating worker:', error);
        res.status(500).json({ success: false, error: 'Error interno creando trabajador' });
    }
});

// POST /collections - Registrar Recolección
router.post('/collections', verifyToken, async (req, res) => {
    try {
        const { workerId, lotId, quantityKg, method, notes, collectionDate } = req.body;

        if (!workerId || !lotId || !quantityKg) {
            return res.status(400).json({ success: false, error: 'Datos incompletos' });
        }

        const collection = await prisma.coffeeCollection.create({
            data: {
                workerId,
                lotId: String(lotId), // Asegurar string si viene number
                quantityKg: Number(quantityKg),
                method: method || 'MANUAL',
                notes: notes || '',
                collectionDate: collectionDate ? new Date(collectionDate) : new Date()
            }
        });

        // Opcional: Crear evento de trazabilidad si se desea, o dejar que el sistema de trazabilidad lo maneje aparte.
        // Por ahora solo registro de nómina/pago.

        res.status(201).json({ success: true, data: collection, message: 'Recolección registrada' });
    } catch (error) {
        console.error('Error saving collection:', error);
        res.status(500).json({ success: false, error: 'Error registrando recolección' });
    }
});

// GET /:workerId/collections - Historial
router.get('/:workerId/collections', verifyToken, async (req, res) => {
    try {
        const { workerId } = req.params;
        const collections = await prisma.coffeeCollection.findMany({
            where: { workerId },
            orderBy: { collectionDate: 'desc' },
            take: 50 // Limit 50 recents
        });

        // Enriquecer con nombre de Lote (opcional si se requiere join, pero aqui lo haremos simple)
        // Podríamos hacer un Promise.all para buscar nombres de lotes si Lot no está en relación directa (como dejé comentado en schema)
        // Para eficiencia, mejor hacer un map después

        // Obtener lotes únicos
        const lotIds = [...new Set(collections.map(c => c.lotId))];
        const lots = await prisma.lot.findMany({
            where: { id: { in: lotIds.map(id => parseInt(id) || -1) } }, // Intento de parsear si son legacy numbers
            select: { id: true, name: true }
        }).catch(() => []); // Si falla por tipo de dato, retornar vacío

        // Mapear nombres
        const result = collections.map(c => {
            const lot = lots.find(l => String(l.id) === String(c.lotId));
            return {
                ...c,
                lotName: lot ? lot.name : `Lote ${c.lotId}`
            };
        });

        res.json(result);
    } catch (error) {
        console.error('Error fetching history:', error);
        res.status(500).json({ success: false, error: 'Error obteniendo historial' });
    }
});

// POST /tasks - Asignar Tarea
router.post('/tasks', verifyToken, async (req, res) => {
    try {
        const { workerId, type, description, dueDate } = req.body;

        const task = await prisma.workerTask.create({
            data: {
                workerId,
                type,
                description,
                dueDate: dueDate ? new Date(dueDate) : null,
                status: 'PENDING'
            }
        });

        res.status(201).json({ success: true, data: task });
    } catch (error) {
        console.error('Error assigning task:', error);
        res.status(500).json({ success: false, error: 'Error asignando tarea' });
    }
});

module.exports = router;

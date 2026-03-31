const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma.cjs');

// GET /api/market-prices - Obtener precios reales con Prisma
router.get('/', async (req, res) => {
    try {
        const prices = await prisma.marketPrice.findMany({
            orderBy: { date: 'desc' },
            take: 50
        });
        res.json(prices);
    } catch (error) {
        console.error('Error fetching market prices:', error);
        res.status(500).json({ error: 'Error obteniendo precios del mercado' });
    }
});

// POST /api/market-prices - Crear nuevo precio real
router.post('/', async (req, res) => {
    try {
        const { date, price, source, coffeeType, region, notes } = req.body;
        const newPrice = await prisma.marketPrice.create({
            data: {
                date: date ? new Date(date) : new Date(),
                price: parseFloat(price),
                source,
                coffeeType,
                region,
                notes
            }
        });
        res.status(201).json({ success: true, data: newPrice });
    } catch (error) {
        res.status(500).json({ error: 'Error registrando precio' });
    }
});

// PUT /api/market-prices/:id - Actualizar precio
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { price, source, notes } = req.body;
        const updated = await prisma.marketPrice.update({
            where: { id },
            data: { price: parseFloat(price), source, notes }
        });
        res.json({ success: true, data: updated });
    } catch (error) {
        res.status(500).json({ error: 'Error actualizando precio' });
    }
});

module.exports = router;

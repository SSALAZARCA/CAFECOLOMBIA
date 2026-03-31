const express = require('express');
const router = express.Router();
const prisma = require('../../lib/prisma.cjs');

// GET /api/admin/subscription-plans - Listar planes reales
router.get('/', async (req, res) => {
    try {
        const plans = await prisma.subscriptionPlan.findMany({
            where: { isActive: true },
            orderBy: { price: 'asc' }
        });
        
        // Parse features string back to array for frontend
        const formattedPlans = plans.map(p => ({
            ...p,
            features: p.features ? JSON.parse(p.features) : []
        }));

        res.json({ success: true, data: formattedPlans });
    } catch (error) {
        console.error('Error fetching real plans:', error);
        res.status(500).json({ error: 'Error obteniendo planes' });
    }
});

// GET /api/admin/subscription-plans/:id - Ver plan real
router.get('/:id', async (req, res) => {
    try {
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: parseInt(req.params.id) }
        });
        if (!plan) {
            return res.status(404).json({ error: 'Plan no encontrado' });
        }
        
        res.json({ 
            success: true, 
            data: {
                ...plan,
                features: plan.features ? JSON.parse(plan.features) : []
            } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo plan' });
    }
});

// POST /api/admin/subscription-plans - Crear plan real
router.post('/', async (req, res) => {
    try {
        const { name, description, price, currency, interval, features } = req.body;
        const newPlan = await prisma.subscriptionPlan.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                currency,
                interval,
                features: JSON.stringify(features || []),
                isActive: true
            }
        });
        res.status(201).json({ success: true, data: newPlan });
    } catch (error) {
        console.error('Error creating real plan:', error);
        res.status(500).json({ error: 'Error creando plan' });
    }
});

module.exports = router;

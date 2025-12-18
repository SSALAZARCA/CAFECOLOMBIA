const express = require('express');
const router = express.Router();

// Mock data para planes de suscripción
const mockPlans = [
    {
        id: 1,
        name: 'Plan Básico',
        description: 'Ideal para pequeños caficultores',
        price: 30000,
        currency_code: 'COP',
        billing_cycle: 'monthly',
        features: ['Hasta 2 fincas', 'Reportes básicos', 'Soporte por email'],
        is_active: true,
        is_featured: false,
        max_farms: 2,
        max_users: 1,
        max_storage_gb: 1,
        trial_days: 14,
        active_subscriptions: 5,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 2,
        name: 'Plan Pro',
        description: 'Para caficultores profesionales',
        price: 50000,
        currency_code: 'COP',
        billing_cycle: 'monthly',
        features: ['Hasta 5 fincas', 'Reportes avanzados', 'Soporte prioritario', 'Analíticas'],
        is_active: true,
        is_featured: true,
        max_farms: 5,
        max_users: 3,
        max_storage_gb: 5,
        trial_days: 30,
        active_subscriptions: 12,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    },
    {
        id: 3,
        name: 'Plan Enterprise',
        description: 'Para cooperativas y grandes productores',
        price: 100000,
        currency_code: 'COP',
        billing_cycle: 'monthly',
        features: ['Fincas ilimitadas', 'Reportes personalizados', 'Soporte 24/7', 'API access'],
        is_active: true,
        is_featured: false,
        max_farms: 999,
        max_users: 999,
        max_storage_gb: 100,
        trial_days: 0,
        active_subscriptions: 3,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
];

// GET /api/admin/subscription-plans - Listar planes
router.get('/', async (req, res) => {
    try {
        res.json({ success: true, data: mockPlans });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo planes' });
    }
});

// GET /api/admin/subscription-plans/:id - Ver plan
router.get('/:id', async (req, res) => {
    try {
        const plan = mockPlans.find(p => p.id === parseInt(req.params.id));
        if (!plan) {
            return res.status(404).json({ error: 'Plan no encontrado' });
        }
        res.json({ success: true, data: plan });
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo plan' });
    }
});

// POST /api/admin/subscription-plans - Crear plan
router.post('/', async (req, res) => {
    try {
        const newPlan = {
            id: mockPlans.length + 1,
            ...req.body,
            isActive: true
        };
        mockPlans.push(newPlan);
        res.status(201).json({ success: true, data: newPlan });
    } catch (error) {
        res.status(500).json({ error: 'Error creando plan' });
    }
});

// PUT /api/admin/subscription-plans/:id - Actualizar plan
router.put('/:id', async (req, res) => {
    try {
        const index = mockPlans.findIndex(p => p.id === parseInt(req.params.id));
        if (index === -1) {
            return res.status(404).json({ error: 'Plan no encontrado' });
        }
        mockPlans[index] = { ...mockPlans[index], ...req.body };
        res.json({ success: true, data: mockPlans[index] });
    } catch (error) {
        res.status(500).json({ error: 'Error actualizando plan' });
    }
});

// DELETE /api/admin/subscription-plans/:id - Eliminar plan
router.delete('/:id', async (req, res) => {
    try {
        const index = mockPlans.findIndex(p => p.id === parseInt(req.params.id));
        if (index === -1) {
            return res.status(404).json({ error: 'Plan no encontrado' });
        }
        mockPlans[index].isActive = false;
        res.json({ success: true, message: 'Plan desactivado' });
    } catch (error) {
        res.status(500).json({ error: 'Error eliminando plan' });
    }
});

module.exports = router;

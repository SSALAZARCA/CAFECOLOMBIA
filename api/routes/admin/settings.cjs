const express = require('express');
const router = express.Router();

// Mock data para configuración
const mockSettings = {
    general: {
        siteName: 'Café Colombia',
        siteUrl: 'https://cafecolombia.com',
        contactEmail: 'contacto@cafecolombia.com',
        supportEmail: 'soporte@cafecolombia.com',
        timezone: 'America/Bogota',
        language: 'es',
        currency: 'COP'
    },
    features: {
        registrationEnabled: true,
        maintenanceMode: false,
        analyticsEnabled: true,
        notificationsEnabled: true,
        twoFactorRequired: false
    },
    limits: {
        maxFarmsPerUser: 5,
        maxFileSize: 10485760, // 10MB
        sessionTimeout: 3600 // 1 hour
    },
    integrations: {
        emailProvider: 'sendgrid',
        smsProvider: 'twilio',
        paymentGateway: 'stripe',
        storageProvider: 's3'
    },
    payment: {
        provider: 'stripe',
        currency: 'COP',
        publicKey: 'pk_test_sample',
        autoRenew: true
    }
};

// GET /api/admin/settings - Obtener configuración
router.get('/', async (req, res) => {
    try {
        res.json(mockSettings);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo configuración' });
    }
});

// PUT /api/admin/settings - Actualizar configuración
router.put('/', async (req, res) => {
    try {
        const { section, data } = req.body;

        if (section && mockSettings[section]) {
            mockSettings[section] = { ...mockSettings[section], ...data };
        } else {
            Object.assign(mockSettings, req.body);
        }

        res.json({
            success: true,
            message: 'Configuración actualizada',
            settings: mockSettings
        });
    } catch (error) {
        res.status(500).json({ error: 'Error actualizando configuración' });
    }
});

// GET /api/admin/settings/:section - Obtener sección específica
router.get('/:section', async (req, res) => {
    try {
        const { section } = req.params;

        if (!mockSettings[section]) {
            return res.status(404).json({ error: 'Sección no encontrada' });
        }

        res.json(mockSettings[section]);
    } catch (error) {
        res.status(500).json({ error: 'Error obteniendo sección' });
    }
});

module.exports = router;

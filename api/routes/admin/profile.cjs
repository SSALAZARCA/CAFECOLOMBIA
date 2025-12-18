const express = require('express');
const router = express.Router();
// MySQL imports removed for local dev safety
// const mysql = require('mysql2/promise');


const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/admin/profile - Obtener perfil del admin
router.get('/', async (req, res) => {
    try {
        const adminUser = {
            id: 1,
            firstName: 'Super',
            lastName: 'Admin',
            email: 'admin@test.com',
            role: 'ADMINISTRADOR',
            phone: '+57 300 123 4567',
            avatar: null,
            twoFactorEnabled: false,
            emailNotifications: true,
            smsNotifications: false,
            loginAlerts: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        };

        res.json(adminUser); // Frontend expects direct object based on AdminProfile.tsx
    } catch (error) {
        console.error('Error fetching admin profile:', error);
        res.status(500).json({ error: 'Error obteniendo perfil' });
    }
});

// PUT /api/admin/profile - Actualizar perfil
router.put('/', async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        // Mock update
        res.json({
            id: 1,
            firstName,
            lastName,
            email: 'admin@test.com',
            role: 'ADMINISTRADOR',
            phone,
            avatar: null,
            twoFactorEnabled: false,
            emailNotifications: true,
            smsNotifications: false,
            loginAlerts: true,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error updating admin profile:', error);
        res.status(500).json({ error: 'Error actualizando perfil' });
    }
});

// PUT /api/admin/profile/password - Cambiar contraseña
router.put('/password', async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    } catch (error) {
        console.error('Error changing password:', error);
        res.status(500).json({ error: 'Error cambiando contraseña' });
    }
});

// PUT /api/admin/profile/2fa - Configurar 2FA
router.put('/2fa', async (req, res) => {
    try {
        const { enabled } = req.body;
        res.json({
            success: true,
            message: enabled ? '2FA habilitado' : '2FA deshabilitado',
            twoFactorEnabled: enabled
        });
    } catch (error) {
        console.error('Error updating 2FA:', error);
        res.status(500).json({ error: 'Error configurando 2FA' });
    }
});

// PUT /api/admin/profile/notifications - Configurar notificaciones
router.put('/notifications', async (req, res) => {
    try {
        const { email, push, sms } = req.body;
        res.json({
            success: true,
            message: 'Preferencias de notificación actualizadas',
            notifications: { email, push, sms }
        });
    } catch (error) {
        console.error('Error updating notifications:', error);
        res.status(500).json({ error: 'Error configurando notificaciones' });
    }
});

module.exports = router;

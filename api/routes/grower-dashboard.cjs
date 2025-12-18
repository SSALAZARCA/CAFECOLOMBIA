const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cafe_colombia_jwt_secret_key_2024';

// Middleware de autenticación local
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

// GET /api/dashboard - Dashboard Completo para Caficultores
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; // ID del coffee_grower

        // 1. Obtener Caficultor con sus fincas
        const grower = await prisma.coffeeGrower.findUnique({
            where: { id: userId },
            include: { farms: true }
        });

        if (!grower) {
            return res.status(404).json({ success: false, error: 'Caficultor no encontrado' });
        }

        // 2. Obtener Finca Principal (la primera por ahora)
        const farm = grower.farms[0];

        // 3. Preparar datos base
        let dashboardData = {
            user: {
                name: grower.full_name,
                email: grower.email,
                farmName: farm ? farm.name : 'Sin finca registrada'
            },
            farm: {
                totalArea: 0,
                coffeeArea: 0,
                location: 'No registrada',
                altitude: 0,
                address: ''
            },
            production: {
                currentSeason: 0,
                lastSeason: 0,
                trend: 'stable'
            },
            weather: {
                temperature: 24, // Mock por defecto hasta integrar API
                humidity: 75,
                rainfall: 0
            },
            alerts: [],
            tasks: []
        };

        if (farm) {
            // Mapear datos de FarmLegacy si existen propiedades extra o dejarlas por defecto
            // FarmLegacy tiene: id, name, status. Faltan area, altitude, etc en el esquema actual.
            dashboardData.farm.location = 'Colombia'; // Placeholder
        }

        // 4. Buscar Alertas y Tareas (Si existieran tablas reales vinculadas)
        // Por ahora devolvemos arrays vacíos o simulados si la tabla no existe en Prisma.
        // Dado que migramos a SQLite y el schema.prisma es limitado, mantenemos la estructura vacía
        // para no romper el frontend, pero lista para conectar.

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Error en dashboard:', error);
        res.status(500).json({ success: false, error: 'Error interno' });
    }
});

module.exports = router;

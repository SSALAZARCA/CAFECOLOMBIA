const express = require('express');
const router = express.Router();
const prisma = require('../lib/prisma.cjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'cafe_colombia_jwt_secret_key_2024';

// Authentication Middleware
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

// GET /api/dashboard - Dashboard Real para Caficultores
router.get('/', verifyToken, async (req, res) => {
    try {
        const userId = req.user.id; // Corrected: This comes from the JWT payload

        // 1. Fetch Grower and their farms
        const grower = await prisma.coffeeGrower.findUnique({
            where: { id: parseInt(userId) },
            include: { farms: true }
        });

        if (!grower) return res.status(404).json({ success: false, error: 'Caficultor no encontrado' });

        const firstFarm = grower.farms[0];
        const farmId = firstFarm ? firstFarm.id : null;

        // 2. Aggregate Production (Sum of collections)
        const collections = await prisma.coffeeCollection.findMany({
            where: { 
                worker: { 
                    farm: { ownerId: String(userId) } 
                } 
            },
            select: { quantityKg: true }
        });

        const totalProduction = collections.reduce((acc, c) => acc + c.quantityKg, 0);

        // 3. Fetch Real Alerts
        const alerts = await prisma.alert.findMany({
            where: { farmId: farmId, isActive: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        // 4. Construct Dashboard Response
        const dashboardData = {
            user: {
                name: grower.full_name,
                email: grower.email,
                farmName: firstFarm ? firstFarm.name : 'Sin finca'
            },
            farm: {
                location: grower.location || 'Colombia',
                status: firstFarm ? firstFarm.status : 'inactive'
            },
            production: {
                totalAccumulated: totalProduction,
                unit: 'kg',
                status: totalProduction > 0 ? 'active' : 'no_data'
            },
            weather: {
                temperature: 24, // Mock until external API integrated
                humidity: 78
            },
            alerts: alerts.map(a => ({
                id: a.id,
                title: a.title,
                severity: a.severity,
                message: a.message,
                timestamp: a.createdAt
            })),
            tasks: [] // Could add real tasks here if needed
        };

        res.json({
            success: true,
            data: dashboardData
        });

    } catch (error) {
        console.error('Error en dashboard real:', error);
        res.status(500).json({ success: false, error: 'Error obteniendo dashboard real' });
    }
});

module.exports = router;

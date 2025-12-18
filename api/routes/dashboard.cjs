const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticateToken } = require('../middleware/auth.cjs');

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard - Get coffee grower dashboard data
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    // Note: Role check might need adjustment if roles are stored differently in modern User
    // But req.user comes from token which usually has role.

    if (!userId) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado' });
    }

    // 1. Get User
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'Usuario no encontrado' });
    }

    // 2. Get Farm
    const farm = await prisma.farm.findFirst({
      where: { ownerId: userId, isActive: true }
    });

    // 3. Calculate Production History from CoffeeCollections (Modern)
    // We aggregate quantityKg by year
    const currentYear = new Date().getFullYear();
    const lastYear = currentYear - 1;

    // Fetch collections for this farm
    // Since Collection -> Worker -> Farm, we filter by worker's farmId
    const collections = await prisma.coffeeCollection.findMany({
      where: {
        worker: {
          farmId: farm?.id // If farm is null, this returns empty
        },
        collectionDate: {
          gte: new Date(`${lastYear}-01-01`),
          lte: new Date(`${currentYear}-12-31`)
        }
      },
      select: {
        quantityKg: true,
        collectionDate: true
      }
    });

    let currentSeason = 0;
    let lastSeason = 0;

    collections.forEach(c => {
      const year = new Date(c.collectionDate).getFullYear();
      if (year === currentYear) currentSeason += c.quantityKg;
      if (year === lastYear) lastSeason += c.quantityKg;
    });

    let trend = 'stable';
    if (lastSeason > 0) {
      if (currentSeason > lastSeason * 1.05) trend = 'up';
      else if (currentSeason < lastSeason * 0.95) trend = 'down';
    }

    // 4. Construct Response matching Configuracion.tsx interface
    // FarmConfig: name, department, municipality, address, sizeHectares, altitude, soilType, coffeeVarieties, processingMethod
    // ProfileConfig: fullName, email, phone

    const dashboardData = {
      user: {
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || '',
        farmName: farm?.name || 'Sin finca registrada'
      },
      // "grower" object for backward compatibility with frontend if it checks that
      grower: {
        full_name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        phone: user.phone || ''
      },
      farm: {
        name: farm?.name || '',
        department: farm?.department || '',
        municipality: farm?.municipality || '',
        address: farm?.address || farm?.location || '', // Fallback to location
        total_area: farm?.area || '',
        altitude: farm?.altitude || '',
        soil_type: farm?.soilType || 'volcánico',
        processing_method: farm?.processingMethod || 'lavado',
        coffee_varieties: farm?.coffeeVarieties || '' // CSV string
      },
      production: {
        currentSeason,
        lastSeason,
        trend
      },
      // Mocked data for parts not yet fully migrated or optional
      weather: {
        temperature: 24,
        humidity: 75,
        rainfall: 100
      },
      alerts: [],
      tasks: []
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Dashboard Error:', error);
    res.status(500).json({ success: false, error: 'Error interno del servidor' });
  }
});

// PUT /api/dashboard - Update grower profile and farm settings
router.put('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, error: 'No autorizado' });

    const { profile, farm } = req.body;

    // transaction to ensure consistency
    await prisma.$transaction(async (tx) => {
      // 1. Update User
      if (profile) {
        const fullName = profile.fullName || '';
        const parts = fullName.split(' ');
        const firstName = parts[0] || '';
        const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';

        await tx.user.update({
          where: { id: userId },
          data: {
            firstName: firstName,
            lastName: lastName,
            phone: profile.phone
          }
        });
      }

      // 2. Upsert Farm
      if (farm) {
        // Find existing farm to update or create new
        const existingFarm = await tx.farm.findFirst({
          where: { ownerId: userId }
        });

        const varietiesStr = Array.isArray(farm.coffeeVarieties)
          ? farm.coffeeVarieties.join(',')
          : farm.coffeeVarieties;

        const farmData = {
          name: farm.name || 'Mi Finca',
          location: `${farm.department || ''}, ${farm.municipality || ''}`, // Construct location string
          department: farm.department,
          municipality: farm.municipality,
          address: farm.address,
          area: parseFloat(farm.sizeHectares) || 0,
          altitude: parseFloat(farm.altitude) || 0,
          soilType: farm.soilType,
          processingMethod: farm.processingMethod,
          coffeeVarieties: varietiesStr,
          description: 'Actualizado desde Configuración'
        };

        if (existingFarm) {
          await tx.farm.update({
            where: { id: existingFarm.id },
            data: farmData
          });
        } else {
          await tx.farm.create({
            data: {
              ...farmData,
              ownerId: userId,
              isActive: true
            }
          });
        }
      }
    });

    res.json({ success: true, message: 'Configuración actualizada correctamente' });

  } catch (error) {
    console.error('Dashboard Update Error:', error);
    res.status(500).json({ success: false, error: 'Error al guardar configuración' });
  }
});

module.exports = router;
const express = require('express');
const { authenticateToken } = require('../middleware/auth.cjs');
const { pool } = require('../config/database.cjs');

const router = express.Router();

// GET /api/dashboard - Obtener datos del dashboard del caficultor
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Usuario no autenticado'
      });
    }

    // Solo permitir acceso a caficultores
    if (userRole !== 'coffee_grower') {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Solo para caficultores.'
      });
    }

    const connection = await pool.getConnection();

    try {
      // Obtener información del caficultor
      const [coffeeGrowerRows] = await connection.execute(
        `SELECT 
          cg.id,
          cg.full_name,
          u.email,
          cg.department,
          cg.municipality
        FROM coffee_growers cg
        JOIN users u ON cg.user_id = u.id
        WHERE u.id = ? AND cg.deleted_at IS NULL`,
        [userId]
      );

      if (coffeeGrowerRows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Caficultor no encontrado'
        });
      }

      const coffeeGrower = coffeeGrowerRows[0];

      // Obtener información de la finca principal
      const [farmRows] = await connection.execute(
        `SELECT 
          f.id,
          f.name,
          f.total_area,
          f.coffee_area,
          f.altitude,
          f.department,
          f.municipality,
          f.annual_production
        FROM farms f
        WHERE f.coffee_grower_id = ? AND f.deleted_at IS NULL
        ORDER BY f.created_at ASC
        LIMIT 1`,
        [coffeeGrower.id]
      );

      const farm = farmRows.length > 0 ? farmRows[0] : null;

      // Obtener producción histórica (últimas 2 temporadas)
      const [productionRows] = await connection.execute(
        `SELECT 
          YEAR(harvest_date) as year,
          SUM(quantity_kg) as total_production
        FROM production_records pr
        JOIN farms f ON pr.farm_id = f.id
        WHERE f.coffee_grower_id = ? AND pr.deleted_at IS NULL
        GROUP BY YEAR(harvest_date)
        ORDER BY year DESC
        LIMIT 2`,
        [coffeeGrower.id]
      );

      // Calcular tendencia de producción
      let trend = 'stable';
      let currentSeason = farm?.annual_production || 0;
      let lastSeason = 0;

      if (productionRows.length >= 2) {
        currentSeason = productionRows[0].total_production;
        lastSeason = productionRows[1].total_production;
        
        if (currentSeason > lastSeason * 1.05) {
          trend = 'up';
        } else if (currentSeason < lastSeason * 0.95) {
          trend = 'down';
        }
      } else if (productionRows.length === 1) {
        currentSeason = productionRows[0].total_production;
      }

      // Obtener alertas recientes (simuladas por ahora)
      const alerts = [
        {
          id: '1',
          type: 'warning',
          message: 'Riesgo de roya detectado en lote 3',
          date: new Date().toISOString().split('T')[0]
        },
        {
          id: '2',
          type: 'info',
          message: 'Próxima fertilización programada',
          date: new Date().toISOString().split('T')[0]
        }
      ];

      // Obtener tareas pendientes (simuladas por ahora)
      const tasks = [
        {
          id: '1',
          title: 'Aplicar fungicida preventivo',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'high',
          completed: false
        },
        {
          id: '2',
          title: 'Revisar sistema de riego',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'medium',
          completed: false
        }
      ];

      // Preparar datos del dashboard
      const dashboardData = {
        user: {
          name: coffeeGrower.full_name,
          email: coffeeGrower.email,
          farmName: farm?.name || 'Sin finca registrada'
        },
        farm: {
          totalArea: farm?.total_area || 0,
          coffeeArea: farm?.coffee_area || 0,
          location: `${coffeeGrower.department}, ${coffeeGrower.municipality}`,
          altitude: farm?.altitude || 0
        },
        production: {
          currentSeason,
          lastSeason,
          trend
        },
        weather: {
          // Datos simulados - en producción se conectaría a API meteorológica
          temperature: 22 + Math.random() * 6, // 22-28°C
          humidity: 70 + Math.random() * 20,   // 70-90%
          rainfall: 80 + Math.random() * 80    // 80-160mm
        },
        alerts,
        tasks
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error en dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

module.exports = router;
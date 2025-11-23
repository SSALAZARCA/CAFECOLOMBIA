import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { pool } from '../config/database';
import { RowDataPacket } from 'mysql2';

const router = express.Router();

interface DashboardData {
  user: {
    name: string;
    email: string;
    farmName: string;
  };
  farm: {
    totalArea: number;
    coffeeArea: number;
    location: string;
    altitude: number;
  };
  production: {
    currentSeason: number;
    lastSeason: number;
    trend: 'up' | 'down' | 'stable';
  };
  weather: {
    temperature: number;
    humidity: number;
    rainfall: number;
  };
  alerts: Array<{
    id: string;
    type: 'warning' | 'info' | 'success';
    message: string;
    date: string;
  }>;
  tasks: Array<{
    id: string;
    title: string;
    dueDate: string;
    priority: 'high' | 'medium' | 'low';
    completed: boolean;
  }>;
}

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

    // Solo permitir acceso a caficultores (aceptar múltiples variantes de roles)
    const validCoffeeGrowerRoles = ['coffee_grower', 'coffee-grower', 'farmer', 'user', 'caficultor'];
    if (!validCoffeeGrowerRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: 'Acceso denegado. Solo para caficultores.'
      });
    }

    const connection = await pool.getConnection();

    try {
      // Obtener información del caficultor
      const [coffeeGrowerRows] = await connection.execute<RowDataPacket[]>(
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
      const [farmRows] = await connection.execute<RowDataPacket[]>(
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
      const [productionRows] = await connection.execute<RowDataPacket[]>(
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
      let trend: 'up' | 'down' | 'stable' = 'stable';
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

      // Obtener alertas recientes
      const [alertRows] = await connection.execute<RowDataPacket[]>(
        `SELECT 
          a.id,
          a.type,
          a.message,
          a.created_at
        FROM alerts a
        JOIN farms f ON a.farm_id = f.id
        WHERE f.coffee_grower_id = ? AND a.status = 'active'
        ORDER BY a.created_at DESC
        LIMIT 5`,
        [coffeeGrower.id]
      );

      // Obtener tareas pendientes
      const [taskRows] = await connection.execute<RowDataPacket[]>(
        `SELECT 
          t.id,
          t.title,
          t.due_date,
          t.priority,
          t.completed
        FROM tasks t
        JOIN farms f ON t.farm_id = f.id
        WHERE f.coffee_grower_id = ? AND t.deleted_at IS NULL
        ORDER BY t.due_date ASC
        LIMIT 10`,
        [coffeeGrower.id]
      );

      // Preparar datos del dashboard
      const dashboardData: DashboardData = {
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
        alerts: alertRows.map(alert => ({
          id: alert.id.toString(),
          type: alert.type as 'warning' | 'info' | 'success',
          message: alert.message,
          date: alert.created_at.toISOString().split('T')[0]
        })),
        tasks: taskRows.map(task => ({
          id: task.id.toString(),
          title: task.title,
          dueDate: task.due_date.toISOString().split('T')[0],
          priority: task.priority as 'high' | 'medium' | 'low',
          completed: task.completed
        }))
      };

      res.json({
        success: true,
        data: dashboardData
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
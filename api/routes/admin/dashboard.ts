import express from 'express';
import { AdminDashboardService } from '../../services/adminDashboardService.js';
import { authenticateAdmin, requireRole } from '../../middleware/adminAuth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateAdmin);

/**
 * GET /api/admin/dashboard/metrics
 * Obtener métricas principales del dashboard
 */
router.get('/metrics', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const metrics = await AdminDashboardService.getDashboardMetrics();

    res.json({
      success: true,
      data: metrics
    });

  } catch (error) {
    console.error('Error obteniendo métricas del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/dashboard/charts
 * Obtener datos para gráficos del dashboard
 */
router.get('/charts', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const chartData = await AdminDashboardService.getDashboardChartData();

    res.json({
      success: true,
      data: chartData
    });

  } catch (error) {
    console.error('Error obteniendo datos de gráficos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/dashboard/activity
 * Obtener actividad reciente del sistema
 */
router.get('/activity', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const recentActivity = await AdminDashboardService.getRecentActivity();

    res.json({
      success: true,
      data: recentActivity
    });

  } catch (error) {
    console.error('Error obteniendo actividad reciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/dashboard/health
 * Obtener estado de salud del sistema
 */
router.get('/health', requireRole(['super_admin', 'admin']), async (req, res) => {
  try {
    const systemHealth = await AdminDashboardService.getSystemHealth();

    res.json({
      success: true,
      data: systemHealth
    });

  } catch (error) {
    console.error('Error obteniendo estado de salud del sistema:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/dashboard/top-metrics
 * Obtener métricas principales destacadas
 */
router.get('/top-metrics', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const topMetrics = await AdminDashboardService.getTopMetrics();

    res.json({
      success: true,
      data: topMetrics
    });

  } catch (error) {
    console.error('Error obteniendo métricas destacadas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

/**
 * GET /api/admin/dashboard/overview
 * Obtener resumen completo del dashboard
 */
router.get('/overview', requireRole(['super_admin', 'admin', 'moderator']), async (req, res) => {
  try {
    const [metrics, chartData, recentActivity, systemHealth, topMetrics] = await Promise.all([
      AdminDashboardService.getDashboardMetrics(),
      AdminDashboardService.getDashboardChartData(),
      AdminDashboardService.getRecentActivity(),
      AdminDashboardService.getSystemHealth(),
      AdminDashboardService.getTopMetrics()
    ]);

    res.json({
      success: true,
      data: {
        metrics,
        charts: chartData,
        recent_activity: recentActivity,
        system_health: systemHealth,
        top_metrics: topMetrics,
        last_updated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo resumen del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error instanceof Error ? error.message : 'Error desconocido'
    });
  }
});

export default router;
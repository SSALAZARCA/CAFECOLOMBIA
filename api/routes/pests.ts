import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validation';
import {
  getPestMonitoring,
  getPestMonitoringById,
  createPestMonitoring,
  updatePestMonitoring,
  deletePestMonitoring,
  getPestAlerts,
  getPestStats,
  getTreatmentRecommendations
} from '../controllers/pestController';

const router = Router();

// Esquemas de validación para parámetros
const pestIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
});

// Esquemas de validación para query parameters
const pestQuerySchema = z.object({
  lotId: z.string().regex(/^\d+$/).transform(Number).optional(),
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  pestType: z.enum(['BROCA', 'ROYA', 'MINADOR', 'COCHINILLA', 'NEMATODOS', 'OTROS']).optional(),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  status: z.enum(['ACTIVE', 'CONTROLLED', 'RESOLVED']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

const alertsQuerySchema = z.object({
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  severity: z.enum(['HIGH', 'CRITICAL']).optional(),
  active: z.enum(['true', 'false']).optional()
});

const statsQuerySchema = z.object({
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  lotId: z.string().regex(/^\d+$/).transform(Number).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

const recommendationsQuerySchema = z.object({
  pestType: z.enum(['BROCA', 'ROYA', 'MINADOR', 'COCHINILLA', 'NEMATODOS', 'OTROS']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  farmId: z.string().regex(/^\d+$/).transform(Number).optional()
});

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/pests - Obtener todos los registros de monitoreo de plagas
router.get('/', validateQuery(pestQuerySchema), getPestMonitoring);

// GET /api/pests/alerts - Obtener alertas de plagas
router.get('/alerts', validateQuery(alertsQuerySchema), getPestAlerts);

// GET /api/pests/stats - Obtener estadísticas de plagas
router.get('/stats', validateQuery(statsQuerySchema), getPestStats);

// GET /api/pests/recommendations - Obtener recomendaciones de tratamiento
router.get('/recommendations', validateQuery(recommendationsQuerySchema), getTreatmentRecommendations);

// GET /api/pests/:id - Obtener registro específico de monitoreo
router.get('/:id', validateParams(pestIdSchema), getPestMonitoringById);

// POST /api/pests - Crear nuevo registro de monitoreo
router.post('/', createPestMonitoring);

// PUT /api/pests/:id - Actualizar registro de monitoreo
router.put('/:id', validateParams(pestIdSchema), updatePestMonitoring);

// DELETE /api/pests/:id - Eliminar registro de monitoreo
router.delete('/:id', validateParams(pestIdSchema), deletePestMonitoring);

export default router;

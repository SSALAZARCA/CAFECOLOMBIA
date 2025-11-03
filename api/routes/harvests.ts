import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validation';
import {
  getHarvests,
  getHarvestById,
  createHarvest,
  updateHarvest,
  deleteHarvest,
  getProcessing,
  getProcessingById,
  createProcessing,
  updateProcessing,
  finishProcessing,
  deleteProcessing,
  getHarvestStats
} from '../controllers/harvestController';

const router = Router();

// Esquemas de validación para parámetros
const harvestIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
});

const processingIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
});

// Esquemas de validación para query parameters
const harvestQuerySchema = z.object({
  lotId: z.string().regex(/^\d+$/).transform(Number).optional(),
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  quality: z.enum(['PREMIUM', 'GOOD', 'REGULAR', 'DEFECTIVE']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

const processingQuerySchema = z.object({
  lotId: z.string().regex(/^\d+$/).transform(Number).optional(),
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  type: z.enum(['WASHED', 'NATURAL', 'HONEY', 'FERMENTED']).optional(),
  active: z.enum(['true', 'false']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

const statsQuerySchema = z.object({
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  lotId: z.string().regex(/^\d+$/).transform(Number).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// RUTAS PARA COSECHAS

// GET /api/harvests - Obtener todas las cosechas
router.get('/', validateQuery(harvestQuerySchema), getHarvests);

// GET /api/harvests/stats - Obtener estadísticas de cosecha
router.get('/stats', validateQuery(statsQuerySchema), getHarvestStats);

// GET /api/harvests/:id - Obtener cosecha específica
router.get('/:id', validateParams(harvestIdSchema), getHarvestById);

// POST /api/harvests - Crear nueva cosecha
router.post('/', createHarvest);

// PUT /api/harvests/:id - Actualizar cosecha
router.put('/:id', validateParams(harvestIdSchema), updateHarvest);

// DELETE /api/harvests/:id - Eliminar cosecha
router.delete('/:id', validateParams(harvestIdSchema), deleteHarvest);

// RUTAS PARA PROCESAMIENTO

// GET /api/harvests/processing - Obtener todos los procesamientos
router.get('/processing', validateQuery(processingQuerySchema), getProcessing);

// GET /api/harvests/processing/:id - Obtener procesamiento específico
router.get('/processing/:id', validateParams(processingIdSchema), getProcessingById);

// POST /api/harvests/processing - Crear nuevo procesamiento
router.post('/processing', createProcessing);

// PUT /api/harvests/processing/:id - Actualizar procesamiento
router.put('/processing/:id', validateParams(processingIdSchema), updateProcessing);

// PUT /api/harvests/processing/:id/finish - Finalizar procesamiento
router.put('/processing/:id/finish', validateParams(processingIdSchema), finishProcessing);

// DELETE /api/harvests/processing/:id - Eliminar procesamiento
router.delete('/processing/:id', validateParams(processingIdSchema), deleteProcessing);

export default router;

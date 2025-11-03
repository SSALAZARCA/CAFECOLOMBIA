import { Router } from 'express';
import {
  getLotsByFarm,
  getLotById,
  createLot,
  updateLot,
  deleteLot,
  getLotStats,
  getLotHistory
} from '../controllers/lotController';
import { authenticateToken } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Esquemas de validación
const lotIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
});

const farmIdSchema = z.object({
  farmId: z.string().regex(/^\d+$/, 'Farm ID debe ser un número').transform(Number)
});

const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/lots/farm/:farmId - Obtener todos los lotes de una finca
router.get('/farm/:farmId', validateParams(farmIdSchema), getLotsByFarm);

// GET /api/lots/:id - Obtener un lote específico
router.get('/:id', validateParams(lotIdSchema), getLotById);

// POST /api/lots - Crear nuevo lote
router.post('/', createLot);

// PUT /api/lots/:id - Actualizar lote
router.put('/:id', validateParams(lotIdSchema), updateLot);

// DELETE /api/lots/:id - Eliminar lote
router.delete('/:id', validateParams(lotIdSchema), deleteLot);

// GET /api/lots/:id/stats - Obtener estadísticas del lote
router.get('/:id/stats', validateParams(lotIdSchema), getLotStats);

// GET /api/lots/:id/history - Obtener historial de actividades del lote
router.get('/:id/history', 
  validateParams(lotIdSchema), 
  validateQuery(paginationSchema), 
  getLotHistory
);

export default router;

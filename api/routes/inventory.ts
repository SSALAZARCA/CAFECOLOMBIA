import { Router } from 'express';
import {
  // Controladores de insumos
  getInputs,
  getInputById,
  createInput,
  updateInput,
  deleteInput,
  // Controladores de inventario
  getInventory,
  getInventoryById,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryAlerts,
  getInputUsageReport
} from '../controllers/inventoryController';
import { authenticateToken, requireRole } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validation';
import { UserRole } from '@prisma/client';
import { z } from 'zod';

const router = Router();

// Esquemas de validación
const idSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
});

const inputQuerySchema = z.object({
  type: z.enum(['FERTILIZER', 'HERBICIDE', 'FUNGICIDE', 'PESTICIDE', 'ORGANIC']).optional(),
  search: z.string().optional()
});

const inventoryQuerySchema = z.object({
  inputType: z.enum(['FERTILIZER', 'HERBICIDE', 'FUNGICIDE', 'PESTICIDE', 'ORGANIC']).optional(),
  lowStock: z.enum(['true', 'false']).optional(),
  expired: z.enum(['true', 'false']).optional()
});

const usageReportQuerySchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  inputId: z.string().regex(/^\d+$/).transform(Number).optional(),
  farmId: z.string().regex(/^\d+$/).transform(Number).optional()
});

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// RUTAS PARA INSUMOS

// GET /api/inventory/inputs - Obtener todos los insumos
router.get('/inputs', validateQuery(inputQuerySchema), getInputs);

// GET /api/inventory/inputs/:id - Obtener un insumo específico
router.get('/inputs/:id', validateParams(idSchema), getInputById);

// POST /api/inventory/inputs - Crear nuevo insumo (solo administradores)
router.post('/inputs', requireRole(UserRole.ADMINISTRADOR), createInput);

// PUT /api/inventory/inputs/:id - Actualizar insumo (solo administradores)
router.put('/inputs/:id', 
  requireRole(UserRole.ADMINISTRADOR), 
  validateParams(idSchema), 
  updateInput
);

// DELETE /api/inventory/inputs/:id - Eliminar insumo (solo administradores)
router.delete('/inputs/:id', 
  requireRole(UserRole.ADMINISTRADOR), 
  validateParams(idSchema), 
  deleteInput
);

// RUTAS PARA INVENTARIO

// GET /api/inventory - Obtener inventario
router.get('/', validateQuery(inventoryQuerySchema), getInventory);

// GET /api/inventory/:id - Obtener entrada de inventario específica
router.get('/:id', validateParams(idSchema), getInventoryById);

// POST /api/inventory - Crear entrada de inventario
router.post('/', createInventory);

// PUT /api/inventory/:id - Actualizar entrada de inventario
router.put('/:id', validateParams(idSchema), updateInventory);

// DELETE /api/inventory/:id - Eliminar entrada de inventario
router.delete('/:id', validateParams(idSchema), deleteInventory);

// GET /api/inventory/alerts - Obtener alertas de inventario
router.get('/alerts', getInventoryAlerts);

// GET /api/inventory/usage-report - Obtener reporte de uso de insumos
router.get('/usage-report', validateQuery(usageReportQuerySchema), getInputUsageReport);

export default router;

import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  completeTask,
  getPendingTasks,
  getTaskStats
} from '../controllers/taskController';
import { authenticateToken } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validation';
import { z } from 'zod';

const router = Router();

// Esquemas de validación
const taskIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
});

const taskQuerySchema = z.object({
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  lotId: z.string().regex(/^\d+$/).transform(Number).optional(),
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  type: z.enum(['PLANTING', 'FERTILIZATION', 'PEST_CONTROL', 'PRUNING', 'HARVESTING', 'IRRIGATION', 'SOIL_PREPARATION', 'MAINTENANCE']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

const pendingTasksQuerySchema = z.object({
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional()
});

const statsQuerySchema = z.object({
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional()
});

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// GET /api/tasks - Obtener tareas con filtros y paginación
router.get('/', validateQuery(taskQuerySchema), getTasks);

// GET /api/tasks/pending - Obtener tareas pendientes
router.get('/pending', validateQuery(pendingTasksQuerySchema), getPendingTasks);

// GET /api/tasks/stats - Obtener estadísticas de tareas
router.get('/stats', validateQuery(statsQuerySchema), getTaskStats);

// GET /api/tasks/:id - Obtener una tarea específica
router.get('/:id', validateParams(taskIdSchema), getTaskById);

// POST /api/tasks - Crear nueva tarea
router.post('/', createTask);

// PUT /api/tasks/:id - Actualizar tarea
router.put('/:id', validateParams(taskIdSchema), updateTask);

// POST /api/tasks/:id/complete - Marcar tarea como completada
router.post('/:id/complete', validateParams(taskIdSchema), completeTask);

// DELETE /api/tasks/:id - Eliminar tarea
router.delete('/:id', validateParams(taskIdSchema), deleteTask);

export default router;

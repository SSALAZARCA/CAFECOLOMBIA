import { Router } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { validateParams, validateQuery } from '../middleware/validation';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getFinancialStats,
  getCashFlowReport
} from '../controllers/financeController';

const router = Router();

// Esquemas de validación para parámetros
const transactionIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
});

const budgetIdSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID debe ser un número').transform(Number)
});

// Esquemas de validación para query parameters
const transactionQuerySchema = z.object({
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  type: z.enum(['INCOME', 'EXPENSE']).optional(),
  category: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'OTHER']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  maxAmount: z.string().regex(/^\d+(\.\d+)?$/).transform(Number).optional(),
  search: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

const budgetQuerySchema = z.object({
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  category: z.string().optional(),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']).optional(),
  active: z.enum(['true', 'false']).optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional()
});

const statsQuerySchema = z.object({
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']).optional()
});

const cashFlowQuerySchema = z.object({
  farmId: z.string().regex(/^\d+$/).transform(Number).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime()
});

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// RUTAS PARA TRANSACCIONES

// GET /api/finance/transactions - Obtener todas las transacciones
router.get('/transactions', validateQuery(transactionQuerySchema), getTransactions);

// GET /api/finance/transactions/:id - Obtener transacción específica
router.get('/transactions/:id', validateParams(transactionIdSchema), getTransactionById);

// POST /api/finance/transactions - Crear nueva transacción
router.post('/transactions', createTransaction);

// PUT /api/finance/transactions/:id - Actualizar transacción
router.put('/transactions/:id', validateParams(transactionIdSchema), updateTransaction);

// DELETE /api/finance/transactions/:id - Eliminar transacción
router.delete('/transactions/:id', validateParams(transactionIdSchema), deleteTransaction);

// RUTAS PARA PRESUPUESTOS

// GET /api/finance/budgets - Obtener todos los presupuestos
router.get('/budgets', validateQuery(budgetQuerySchema), getBudgets);

// GET /api/finance/budgets/:id - Obtener presupuesto específico
router.get('/budgets/:id', validateParams(budgetIdSchema), getBudgetById);

// POST /api/finance/budgets - Crear nuevo presupuesto
router.post('/budgets', createBudget);

// PUT /api/finance/budgets/:id - Actualizar presupuesto
router.put('/budgets/:id', validateParams(budgetIdSchema), updateBudget);

// DELETE /api/finance/budgets/:id - Eliminar presupuesto
router.delete('/budgets/:id', validateParams(budgetIdSchema), deleteBudget);

// RUTAS PARA REPORTES Y ESTADÍSTICAS

// GET /api/finance/stats - Obtener estadísticas financieras
router.get('/stats', validateQuery(statsQuerySchema), getFinancialStats);

// GET /api/finance/cash-flow - Obtener reporte de flujo de caja
router.get('/cash-flow', validateQuery(cashFlowQuerySchema), getCashFlowReport);

export default router;

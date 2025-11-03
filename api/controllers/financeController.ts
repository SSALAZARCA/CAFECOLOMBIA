import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { ApplicationError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

// Esquemas de validación
const createTransactionSchema = z.object({
  farmId: z.number().int().positive(),
  type: z.enum(['INCOME', 'EXPENSE']),
  category: z.string().min(1, 'La categoría es requerida'),
  amount: z.number().positive('El monto debe ser positivo'),
  description: z.string().min(1, 'La descripción es requerida'),
  date: z.string().datetime(),
  reference: z.string().optional(),
  paymentMethod: z.enum(['CASH', 'BANK_TRANSFER', 'CHECK', 'CREDIT_CARD', 'OTHER']).optional(),
  tags: z.array(z.string()).optional(),
  attachments: z.array(z.string()).optional()
});

const updateTransactionSchema = createTransactionSchema.partial();

const createBudgetSchema = z.object({
  farmId: z.number().int().positive(),
  category: z.string().min(1, 'La categoría es requerida'),
  amount: z.number().positive('El monto debe ser positivo'),
  period: z.enum(['MONTHLY', 'QUARTERLY', 'YEARLY']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  description: z.string().optional()
});

const updateBudgetSchema = createBudgetSchema.partial();

// CONTROLADORES PARA TRANSACCIONES

// Obtener transacciones
export const getTransactions = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { 
    farmId, 
    type,
    category,
    paymentMethod,
    startDate, 
    endDate,
    minAmount,
    maxAmount,
    search,
    page = 1, 
    limit = 20 
  } = req.query;

  const where: any = {
    farm: { userId }
  };

  if (farmId) {
    where.farmId = parseInt(farmId as string);
  }

  if (type) {
    where.type = type;
  }

  if (category) {
    where.category = { contains: category as string, mode: 'insensitive' };
  }

  if (paymentMethod) {
    where.paymentMethod = paymentMethod;
  }

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  if (minAmount || maxAmount) {
    where.amount = {};
    if (minAmount) where.amount.gte = parseFloat(minAmount as string);
    if (maxAmount) where.amount.lte = parseFloat(maxAmount as string);
  }

  if (search) {
    where.OR = [
      { description: { contains: search as string, mode: 'insensitive' } },
      { reference: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: {
        farm: {
          select: { id: true, name: true }
        }
      },
      orderBy: { date: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    },
    message: 'Transacciones obtenidas exitosamente'
  });
});

// Obtener transacción específica
export const getTransactionById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const transaction = await prisma.transaction.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    },
    include: {
      farm: {
        select: { id: true, name: true, location: true }
      }
    }
  });

  if (!transaction) {
    throw new NotFoundError('Transacción no encontrada');
  }

  res.json({
    success: true,
    data: transaction,
    message: 'Transacción obtenida exitosamente'
  });
});

// Crear nueva transacción
export const createTransaction = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const validatedData = createTransactionSchema.parse(req.body);

  // Verificar que la finca pertenece al usuario
  const farm = await prisma.farm.findFirst({
    where: { 
      id: validatedData.farmId,
      userId
    }
  });

  if (!farm) {
    throw new NotFoundError('Finca no encontrada');
  }

  const transaction = await prisma.transaction.create({
    data: {
      ...validatedData,
      date: new Date(validatedData.date),
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : null,
      attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : null
    },
    include: {
      farm: {
        select: { id: true, name: true }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: transaction,
    message: 'Transacción registrada exitosamente'
  });
});

// Actualizar transacción
export const updateTransaction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const validatedData = updateTransactionSchema.parse(req.body);

  // Verificar que la transacción existe y pertenece al usuario
  const existingTransaction = await prisma.transaction.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    }
  });

  if (!existingTransaction) {
    throw new NotFoundError('Transacción no encontrada');
  }

  // Verificar que la finca pertenece al usuario (si se está actualizando)
  if (validatedData.farmId) {
    const farm = await prisma.farm.findFirst({
      where: { 
        id: validatedData.farmId,
        userId
      }
    });

    if (!farm) {
      throw new NotFoundError('Finca no encontrada');
    }
  }

  const transaction = await prisma.transaction.update({
    where: { id: parseInt(id) },
    data: {
      ...validatedData,
      date: validatedData.date ? new Date(validatedData.date) : undefined,
      tags: validatedData.tags ? JSON.stringify(validatedData.tags) : undefined,
      attachments: validatedData.attachments ? JSON.stringify(validatedData.attachments) : undefined
    },
    include: {
      farm: {
        select: { id: true, name: true }
      }
    }
  });

  res.json({
    success: true,
    data: transaction,
    message: 'Transacción actualizada exitosamente'
  });
});

// Eliminar transacción
export const deleteTransaction = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar que la transacción existe y pertenece al usuario
  const transaction = await prisma.transaction.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    }
  });

  if (!transaction) {
    throw new NotFoundError('Transacción no encontrada');
  }

  await prisma.transaction.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Transacción eliminada exitosamente'
  });
});

// CONTROLADORES PARA PRESUPUESTOS

// Obtener presupuestos
export const getBudgets = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { 
    farmId, 
    category,
    period,
    active,
    page = 1, 
    limit = 20 
  } = req.query;

  const where: any = {
    farm: { userId }
  };

  if (farmId) {
    where.farmId = parseInt(farmId as string);
  }

  if (category) {
    where.category = { contains: category as string, mode: 'insensitive' };
  }

  if (period) {
    where.period = period;
  }

  if (active === 'true') {
    const now = new Date();
    where.startDate = { lte: now };
    where.endDate = { gte: now };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [budgets, total] = await Promise.all([
    prisma.budget.findMany({
      where,
      include: {
        farm: {
          select: { id: true, name: true }
        }
      },
      orderBy: { startDate: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.budget.count({ where })
  ]);

  // Calcular gastos actuales para cada presupuesto
  const budgetsWithSpent = await Promise.all(
    budgets.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          farmId: budget.farmId,
          type: 'EXPENSE',
          category: { contains: budget.category, mode: 'insensitive' },
          date: {
            gte: budget.startDate,
            lte: budget.endDate
          }
        },
        _sum: { amount: true }
      });

      return {
        ...budget,
        spent: spent._sum.amount || 0,
        remaining: budget.amount - (spent._sum.amount || 0),
        percentage: ((spent._sum.amount || 0) / budget.amount) * 100
      };
    })
  );

  res.json({
    success: true,
    data: {
      budgets: budgetsWithSpent,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    },
    message: 'Presupuestos obtenidos exitosamente'
  });
});

// Obtener presupuesto específico
export const getBudgetById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const budget = await prisma.budget.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    },
    include: {
      farm: {
        select: { id: true, name: true, location: true }
      }
    }
  });

  if (!budget) {
    throw new NotFoundError('Presupuesto no encontrado');
  }

  // Calcular gastos actuales
  const spent = await prisma.transaction.aggregate({
    where: {
      farmId: budget.farmId,
      type: 'EXPENSE',
      category: { contains: budget.category, mode: 'insensitive' },
      date: {
        gte: budget.startDate,
        lte: budget.endDate
      }
    },
    _sum: { amount: true }
  });

  const budgetWithSpent = {
    ...budget,
    spent: spent._sum.amount || 0,
    remaining: budget.amount - (spent._sum.amount || 0),
    percentage: ((spent._sum.amount || 0) / budget.amount) * 100
  };

  res.json({
    success: true,
    data: budgetWithSpent,
    message: 'Presupuesto obtenido exitosamente'
  });
});

// Crear nuevo presupuesto
export const createBudget = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const validatedData = createBudgetSchema.parse(req.body);

  // Verificar que la finca pertenece al usuario
  const farm = await prisma.farm.findFirst({
    where: { 
      id: validatedData.farmId,
      userId
    }
  });

  if (!farm) {
    throw new NotFoundError('Finca no encontrada');
  }

  // Verificar que no existe un presupuesto activo para la misma categoría y período
  const existingBudget = await prisma.budget.findFirst({
    where: {
      farmId: validatedData.farmId,
      category: validatedData.category,
      OR: [
        {
          startDate: { lte: new Date(validatedData.endDate) },
          endDate: { gte: new Date(validatedData.startDate) }
        }
      ]
    }
  });

  if (existingBudget) {
    throw new ApplicationError(
      'Ya existe un presupuesto para esta categoría en el período especificado',
      400
    );
  }

  const budget = await prisma.budget.create({
    data: {
      ...validatedData,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate)
    },
    include: {
      farm: {
        select: { id: true, name: true }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: budget,
    message: 'Presupuesto creado exitosamente'
  });
});

// Actualizar presupuesto
export const updateBudget = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const validatedData = updateBudgetSchema.parse(req.body);

  // Verificar que el presupuesto existe y pertenece al usuario
  const existingBudget = await prisma.budget.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    }
  });

  if (!existingBudget) {
    throw new NotFoundError('Presupuesto no encontrado');
  }

  const budget = await prisma.budget.update({
    where: { id: parseInt(id) },
    data: {
      ...validatedData,
      startDate: validatedData.startDate ? new Date(validatedData.startDate) : undefined,
      endDate: validatedData.endDate ? new Date(validatedData.endDate) : undefined
    },
    include: {
      farm: {
        select: { id: true, name: true }
      }
    }
  });

  res.json({
    success: true,
    data: budget,
    message: 'Presupuesto actualizado exitosamente'
  });
});

// Eliminar presupuesto
export const deleteBudget = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar que el presupuesto existe y pertenece al usuario
  const budget = await prisma.budget.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    }
  });

  if (!budget) {
    throw new NotFoundError('Presupuesto no encontrado');
  }

  await prisma.budget.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Presupuesto eliminado exitosamente'
  });
});

// Obtener estadísticas financieras
export const getFinancialStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { farmId, startDate, endDate, period = 'monthly' } = req.query;

  const where: any = {
    farm: { userId }
  };

  if (farmId) {
    where.farmId = parseInt(farmId as string);
  }

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const [
    totalIncome,
    totalExpenses,
    transactionsByCategory,
    transactionsByMonth,
    budgetStatus
  ] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...where, type: 'INCOME' },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.transaction.aggregate({
      where: { ...where, type: 'EXPENSE' },
      _sum: { amount: true },
      _count: { id: true }
    }),
    prisma.transaction.groupBy({
      by: ['category', 'type'],
      where,
      _sum: { amount: true },
      _count: { id: true }
    }),
    // Transacciones por mes (últimos 12 meses)
    prisma.transaction.findMany({
      where: {
        ...where,
        date: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        date: true,
        amount: true,
        type: true
      }
    }),
    // Estado de presupuestos activos
    prisma.budget.findMany({
      where: {
        farm: { userId },
        ...(farmId && { farmId: parseInt(farmId as string) }),
        startDate: { lte: new Date() },
        endDate: { gte: new Date() }
      }
    })
  ]);

  // Agrupar transacciones por mes
  const monthlyData = transactionsByMonth.reduce((acc, transaction) => {
    const month = transaction.date.toISOString().slice(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { income: 0, expenses: 0 };
    }
    if (transaction.type === 'INCOME') {
      acc[month].income += transaction.amount;
    } else {
      acc[month].expenses += transaction.amount;
    }
    return acc;
  }, {} as any);

  // Calcular estado de presupuestos
  const budgetStatusWithSpent = await Promise.all(
    budgetStatus.map(async (budget) => {
      const spent = await prisma.transaction.aggregate({
        where: {
          farmId: budget.farmId,
          type: 'EXPENSE',
          category: { contains: budget.category, mode: 'insensitive' },
          date: {
            gte: budget.startDate,
            lte: budget.endDate
          }
        },
        _sum: { amount: true }
      });

      return {
        ...budget,
        spent: spent._sum.amount || 0,
        remaining: budget.amount - (spent._sum.amount || 0),
        percentage: ((spent._sum.amount || 0) / budget.amount) * 100
      };
    })
  );

  const stats = {
    summary: {
      totalIncome: totalIncome._sum.amount || 0,
      totalExpenses: totalExpenses._sum.amount || 0,
      netProfit: (totalIncome._sum.amount || 0) - (totalExpenses._sum.amount || 0),
      incomeTransactions: totalIncome._count.id,
      expenseTransactions: totalExpenses._count.id
    },
    categoryBreakdown: transactionsByCategory.reduce((acc, item) => {
      if (!acc[item.type]) {
        acc[item.type] = {};
      }
      acc[item.type][item.category] = {
        amount: item._sum.amount || 0,
        count: item._count.id
      };
      return acc;
    }, {} as any),
    monthlyTrends: Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: (data as any).income,
      expenses: (data as any).expenses,
      profit: (data as any).income - (data as any).expenses
    })).sort((a, b) => a.month.localeCompare(b.month)),
    budgetStatus: budgetStatusWithSpent
  };

  res.json({
    success: true,
    data: stats,
    message: 'Estadísticas financieras obtenidas exitosamente'
  });
});

// Obtener reporte de flujo de caja
export const getCashFlowReport = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { farmId, startDate, endDate } = req.query;

  if (!startDate || !endDate) {
    throw new ValidationError('Las fechas de inicio y fin son requeridas');
  }

  const where: any = {
    farm: { userId },
    date: {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    }
  };

  if (farmId) {
    where.farmId = parseInt(farmId as string);
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: 'asc' },
    select: {
      id: true,
      date: true,
      type: true,
      amount: true,
      description: true,
      category: true
    }
  });

  let runningBalance = 0;
  const cashFlow = transactions.map(transaction => {
    if (transaction.type === 'INCOME') {
      runningBalance += transaction.amount;
    } else {
      runningBalance -= transaction.amount;
    }

    return {
      ...transaction,
      balance: runningBalance
    };
  });

  res.json({
    success: true,
    data: {
      transactions: cashFlow,
      summary: {
        startDate: new Date(startDate as string),
        endDate: new Date(endDate as string),
        finalBalance: runningBalance,
        totalIncome: transactions
          .filter(t => t.type === 'INCOME')
          .reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: transactions
          .filter(t => t.type === 'EXPENSE')
          .reduce((sum, t) => sum + t.amount, 0)
      }
    },
    message: 'Reporte de flujo de caja generado exitosamente'
  });
});

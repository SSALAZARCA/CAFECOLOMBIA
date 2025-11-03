import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { ApplicationError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

// Esquemas de validación
const createInventorySchema = z.object({
  inputId: z.number().int().positive(),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  unitCost: z.number().positive('El costo unitario debe ser positivo'),
  supplier: z.string().min(1, 'El proveedor es requerido'),
  purchaseDate: z.string().datetime(),
  expirationDate: z.string().datetime().optional(),
  batchNumber: z.string().optional(),
  location: z.string().optional(),
  notes: z.string().optional()
});

const updateInventorySchema = createInventorySchema.partial();

const createInputSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  type: z.enum(['FERTILIZER', 'HERBICIDE', 'FUNGICIDE', 'PESTICIDE', 'ORGANIC']),
  activeIngredient: z.string().optional(),
  concentration: z.string().optional(),
  unit: z.string().min(1, 'La unidad es requerida'),
  carencyPeriod: z.number().int().min(0, 'El período de carencia debe ser positivo o cero'),
  reentryPeriod: z.number().int().min(0, 'El período de reingreso debe ser positivo o cero'),
  maxApplicationsPerCycle: z.number().int().positive().optional(),
  dosagePerHectare: z.number().positive().optional(),
  description: z.string().optional(),
  safetyInstructions: z.string().optional()
});

const updateInputSchema = createInputSchema.partial();

// CONTROLADORES PARA INSUMOS

// Obtener todos los insumos
export const getInputs = asyncHandler(async (req: Request, res: Response) => {
  const { type, search } = req.query;
  
  const where: any = {};
  
  if (type) {
    where.type = type;
  }
  
  if (search) {
    where.OR = [
      { name: { contains: search as string, mode: 'insensitive' } },
      { activeIngredient: { contains: search as string, mode: 'insensitive' } }
    ];
  }

  const inputs = await prisma.input.findMany({
    where,
    include: {
      inventory: {
        select: {
          id: true,
          quantity: true,
          unitCost: true,
          supplier: true,
          purchaseDate: true,
          expirationDate: true
        }
      },
      _count: {
        select: {
          inventory: true,
          inputUsage: true
        }
      }
    },
    orderBy: { name: 'asc' }
  });

  res.json({
    success: true,
    data: inputs,
    message: 'Insumos obtenidos exitosamente'
  });
});

// Obtener un insumo específico
export const getInputById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const input = await prisma.input.findUnique({
    where: { id: parseInt(id) },
    include: {
      inventory: {
        orderBy: { purchaseDate: 'desc' }
      },
      inputUsage: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          agriculturalTask: {
            include: {
              lot: {
                select: {
                  name: true,
                  farm: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!input) {
    throw new NotFoundError('Insumo no encontrado');
  }

  res.json({
    success: true,
    data: input,
    message: 'Insumo obtenido exitosamente'
  });
});

// Crear nuevo insumo
export const createInput = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createInputSchema.parse(req.body);

  // Verificar que no existe un insumo con el mismo nombre
  const existingInput = await prisma.input.findFirst({
    where: { name: validatedData.name }
  });

  if (existingInput) {
    throw new ValidationError('Ya existe un insumo con ese nombre');
  }

  const input = await prisma.input.create({
    data: validatedData,
    include: {
      _count: {
        select: {
          inventory: true,
          inputUsage: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: input,
    message: 'Insumo creado exitosamente'
  });
});

// Actualizar insumo
export const updateInput = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateInputSchema.parse(req.body);

  const existingInput = await prisma.input.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingInput) {
    throw new NotFoundError('Insumo no encontrado');
  }

  // Verificar que no existe otro insumo con el mismo nombre
  if (validatedData.name) {
    const duplicateInput = await prisma.input.findFirst({
      where: { 
        name: validatedData.name,
        id: { not: parseInt(id) }
      }
    });

    if (duplicateInput) {
      throw new ValidationError('Ya existe un insumo con ese nombre');
    }
  }

  const input = await prisma.input.update({
    where: { id: parseInt(id) },
    data: validatedData,
    include: {
      _count: {
        select: {
          inventory: true,
          inputUsage: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: input,
    message: 'Insumo actualizado exitosamente'
  });
});

// Eliminar insumo
export const deleteInput = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const input = await prisma.input.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: {
          inventory: true,
          inputUsage: true
        }
      }
    }
  });

  if (!input) {
    throw new NotFoundError('Insumo no encontrado');
  }

  // Verificar si tiene inventario o uso registrado
  if (input._count.inventory > 0 || input._count.inputUsage > 0) {
    throw new ApplicationError(
      'No se puede eliminar el insumo porque tiene inventario o registros de uso',
      400
    );
  }

  await prisma.input.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Insumo eliminado exitosamente'
  });
});

// CONTROLADORES PARA INVENTARIO

// Obtener inventario
export const getInventory = asyncHandler(async (req: Request, res: Response) => {
  const { inputType, lowStock, expired } = req.query;
  
  const where: any = {};
  
  if (inputType) {
    where.input = { type: inputType };
  }
  
  if (lowStock === 'true') {
    where.quantity = { lte: 10 }; // Considerar stock bajo cuando hay 10 unidades o menos
  }
  
  if (expired === 'true') {
    where.expirationDate = { lte: new Date() };
  }

  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      input: true,
      _count: {
        select: {
          inputUsage: true
        }
      }
    },
    orderBy: [
      { input: { name: 'asc' } },
      { purchaseDate: 'desc' }
    ]
  });

  // Calcular stock total por insumo
  const stockByInput = inventory.reduce((acc, item) => {
    const inputId = item.input.id;
    if (!acc[inputId]) {
      acc[inputId] = {
        input: item.input,
        totalStock: 0,
        batches: []
      };
    }
    acc[inputId].totalStock += item.quantity;
    acc[inputId].batches.push(item);
    return acc;
  }, {} as any);

  res.json({
    success: true,
    data: {
      inventory,
      stockSummary: Object.values(stockByInput)
    },
    message: 'Inventario obtenido exitosamente'
  });
});

// Obtener entrada de inventario específica
export const getInventoryById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const inventory = await prisma.inventory.findUnique({
    where: { id: parseInt(id) },
    include: {
      input: true,
      inputUsage: {
        include: {
          agriculturalTask: {
            include: {
              lot: {
                select: {
                  name: true,
                  farm: {
                    select: { name: true }
                  }
                }
              }
            }
          }
        }
      }
    }
  });

  if (!inventory) {
    throw new NotFoundError('Entrada de inventario no encontrada');
  }

  res.json({
    success: true,
    data: inventory,
    message: 'Entrada de inventario obtenida exitosamente'
  });
});

// Crear entrada de inventario
export const createInventory = asyncHandler(async (req: Request, res: Response) => {
  const validatedData = createInventorySchema.parse(req.body);

  // Verificar que el insumo existe
  const input = await prisma.input.findUnique({
    where: { id: validatedData.inputId }
  });

  if (!input) {
    throw new NotFoundError('Insumo no encontrado');
  }

  const inventory = await prisma.inventory.create({
    data: {
      ...validatedData,
      purchaseDate: new Date(validatedData.purchaseDate),
      expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : null
    },
    include: {
      input: true
    }
  });

  res.status(201).json({
    success: true,
    data: inventory,
    message: 'Entrada de inventario creada exitosamente'
  });
});

// Actualizar entrada de inventario
export const updateInventory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const validatedData = updateInventorySchema.parse(req.body);

  const existingInventory = await prisma.inventory.findUnique({
    where: { id: parseInt(id) }
  });

  if (!existingInventory) {
    throw new NotFoundError('Entrada de inventario no encontrada');
  }

  // Verificar que el insumo existe si se está actualizando
  if (validatedData.inputId) {
    const input = await prisma.input.findUnique({
      where: { id: validatedData.inputId }
    });

    if (!input) {
      throw new NotFoundError('Insumo no encontrado');
    }
  }

  const inventory = await prisma.inventory.update({
    where: { id: parseInt(id) },
    data: {
      ...validatedData,
      purchaseDate: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : undefined,
      expirationDate: validatedData.expirationDate ? new Date(validatedData.expirationDate) : undefined
    },
    include: {
      input: true
    }
  });

  res.json({
    success: true,
    data: inventory,
    message: 'Entrada de inventario actualizada exitosamente'
  });
});

// Eliminar entrada de inventario
export const deleteInventory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;

  const inventory = await prisma.inventory.findUnique({
    where: { id: parseInt(id) },
    include: {
      _count: {
        select: {
          inputUsage: true
        }
      }
    }
  });

  if (!inventory) {
    throw new NotFoundError('Entrada de inventario no encontrada');
  }

  // Verificar si tiene uso registrado
  if (inventory._count.inputUsage > 0) {
    throw new ApplicationError(
      'No se puede eliminar la entrada de inventario porque tiene registros de uso',
      400
    );
  }

  await prisma.inventory.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Entrada de inventario eliminada exitosamente'
  });
});

// Obtener alertas de inventario
export const getInventoryAlerts = asyncHandler(async (req: Request, res: Response) => {
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [lowStock, expiringSoon, expired] = await Promise.all([
    // Stock bajo
    prisma.inventory.findMany({
      where: { quantity: { lte: 10 } },
      include: { input: true },
      orderBy: { quantity: 'asc' }
    }),
    // Próximos a vencer (30 días)
    prisma.inventory.findMany({
      where: {
        expirationDate: {
          gte: now,
          lte: thirtyDaysFromNow
        }
      },
      include: { input: true },
      orderBy: { expirationDate: 'asc' }
    }),
    // Vencidos
    prisma.inventory.findMany({
      where: {
        expirationDate: { lte: now }
      },
      include: { input: true },
      orderBy: { expirationDate: 'asc' }
    })
  ]);

  res.json({
    success: true,
    data: {
      lowStock,
      expiringSoon,
      expired,
      summary: {
        lowStockCount: lowStock.length,
        expiringSoonCount: expiringSoon.length,
        expiredCount: expired.length
      }
    },
    message: 'Alertas de inventario obtenidas exitosamente'
  });
});

// Obtener reporte de uso de insumos
export const getInputUsageReport = asyncHandler(async (req: Request, res: Response) => {
  const { startDate, endDate, inputId, farmId } = req.query;
  
  const where: any = {};
  
  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }
  
  if (inputId) {
    where.inventory = { inputId: parseInt(inputId as string) };
  }
  
  if (farmId) {
    where.agriculturalTask = { farmId: parseInt(farmId as string) };
  }

  const usage = await prisma.inputUsage.findMany({
    where,
    include: {
      inventory: {
        include: {
          input: true
        }
      },
      agriculturalTask: {
        include: {
          lot: {
            include: {
              farm: {
                select: { name: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  // Agrupar por insumo
  const usageByInput = usage.reduce((acc, item) => {
    const inputId = item.inventory.input.id;
    if (!acc[inputId]) {
      acc[inputId] = {
        input: item.inventory.input,
        totalQuantity: 0,
        totalCost: 0,
        applications: []
      };
    }
    acc[inputId].totalQuantity += item.quantityUsed;
    acc[inputId].totalCost += item.quantityUsed * item.inventory.unitCost;
    acc[inputId].applications.push(item);
    return acc;
  }, {} as any);

  res.json({
    success: true,
    data: {
      usage,
      summary: Object.values(usageByInput),
      totalApplications: usage.length,
      totalCost: usage.reduce((sum, item) => sum + (item.quantityUsed * item.inventory.unitCost), 0)
    },
    message: 'Reporte de uso de insumos obtenido exitosamente'
  });
});

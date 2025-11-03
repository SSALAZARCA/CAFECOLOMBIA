import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { ApplicationError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

// Esquemas de validación
const createTaskSchema = z.object({
  farmId: z.number().int().positive(),
  lotId: z.number().int().positive().optional(),
  type: z.enum(['PLANTING', 'FERTILIZATION', 'PEST_CONTROL', 'PRUNING', 'HARVESTING', 'IRRIGATION', 'SOIL_PREPARATION', 'MAINTENANCE']),
  description: z.string().min(1, 'La descripción es requerida'),
  scheduledDate: z.string().datetime(),
  estimatedDuration: z.number().positive().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  assignedTo: z.string().optional(),
  notes: z.string().optional(),
  inputUsage: z.array(z.object({
    inventoryId: z.number().int().positive(),
    quantityUsed: z.number().positive()
  })).optional()
});

const updateTaskSchema = createTaskSchema.partial().extend({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  completedDate: z.string().datetime().optional(),
  actualDuration: z.number().positive().optional(),
  completionNotes: z.string().optional()
});

// Obtener tareas
export const getTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { 
    farmId, 
    lotId, 
    status, 
    type, 
    priority,
    startDate, 
    endDate,
    page = 1, 
    limit = 20 
  } = req.query;

  const where: any = {
    farm: { userId }
  };

  if (farmId) {
    where.farmId = parseInt(farmId as string);
  }

  if (lotId) {
    where.lotId = parseInt(lotId as string);
  }

  if (status) {
    where.status = status;
  }

  if (type) {
    where.type = type;
  }

  if (priority) {
    where.priority = priority;
  }

  if (startDate && endDate) {
    where.scheduledDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [tasks, total] = await Promise.all([
    prisma.agriculturalTask.findMany({
      where,
      include: {
        farm: {
          select: { id: true, name: true }
        },
        lot: {
          select: { id: true, name: true, variety: true }
        },
        inputUsage: {
          include: {
            inventory: {
              include: {
                input: true
              }
            }
          }
        }
      },
      orderBy: [
        { priority: 'desc' },
        { scheduledDate: 'asc' }
      ],
      skip,
      take: Number(limit)
    }),
    prisma.agriculturalTask.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      tasks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    },
    message: 'Tareas obtenidas exitosamente'
  });
});

// Obtener tarea específica
export const getTaskById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const task = await prisma.agriculturalTask.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    },
    include: {
      farm: {
        select: { id: true, name: true, location: true }
      },
      lot: {
        select: { id: true, name: true, variety: true, area: true }
      },
      inputUsage: {
        include: {
          inventory: {
            include: {
              input: true
            }
          }
        }
      }
    }
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  res.json({
    success: true,
    data: task,
    message: 'Tarea obtenida exitosamente'
  });
});

// Crear nueva tarea
export const createTask = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const validatedData = createTaskSchema.parse(req.body);

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

  // Verificar que el lote pertenece a la finca (si se especifica)
  if (validatedData.lotId) {
    const lot = await prisma.lot.findFirst({
      where: { 
        id: validatedData.lotId,
        farmId: validatedData.farmId
      }
    });

    if (!lot) {
      throw new NotFoundError('Lote no encontrado en la finca especificada');
    }
  }

  // Verificar disponibilidad de insumos si se especifican
  if (validatedData.inputUsage && validatedData.inputUsage.length > 0) {
    for (const usage of validatedData.inputUsage) {
      const inventory = await prisma.inventory.findUnique({
        where: { id: usage.inventoryId }
      });

      if (!inventory) {
        throw new NotFoundError(`Entrada de inventario ${usage.inventoryId} no encontrada`);
      }

      if (inventory.quantity < usage.quantityUsed) {
        throw new ValidationError(
          `Stock insuficiente para el inventario ${usage.inventoryId}. Disponible: ${inventory.quantity}, Requerido: ${usage.quantityUsed}`
        );
      }
    }
  }

  // Crear la tarea
  const task = await prisma.agriculturalTask.create({
    data: {
      farmId: validatedData.farmId,
      lotId: validatedData.lotId,
      type: validatedData.type,
      description: validatedData.description,
      scheduledDate: new Date(validatedData.scheduledDate),
      estimatedDuration: validatedData.estimatedDuration,
      priority: validatedData.priority,
      assignedTo: validatedData.assignedTo,
      notes: validatedData.notes,
      status: 'PENDING'
    },
    include: {
      farm: {
        select: { id: true, name: true }
      },
      lot: {
        select: { id: true, name: true, variety: true }
      }
    }
  });

  // Crear registros de uso de insumos si se especifican
  if (validatedData.inputUsage && validatedData.inputUsage.length > 0) {
    await prisma.inputUsage.createMany({
      data: validatedData.inputUsage.map(usage => ({
        agriculturalTaskId: task.id,
        inventoryId: usage.inventoryId,
        quantityUsed: usage.quantityUsed
      }))
    });

    // Actualizar inventario
    for (const usage of validatedData.inputUsage) {
      await prisma.inventory.update({
        where: { id: usage.inventoryId },
        data: {
          quantity: {
            decrement: usage.quantityUsed
          }
        }
      });
    }
  }

  // Obtener la tarea completa con los insumos
  const completeTask = await prisma.agriculturalTask.findUnique({
    where: { id: task.id },
    include: {
      farm: {
        select: { id: true, name: true }
      },
      lot: {
        select: { id: true, name: true, variety: true }
      },
      inputUsage: {
        include: {
          inventory: {
            include: {
              input: true
            }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: completeTask,
    message: 'Tarea creada exitosamente'
  });
});

// Actualizar tarea
export const updateTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const validatedData = updateTaskSchema.parse(req.body);

  // Verificar que la tarea existe y pertenece al usuario
  const existingTask = await prisma.agriculturalTask.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    }
  });

  if (!existingTask) {
    throw new NotFoundError('Tarea no encontrada');
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

  // Verificar que el lote pertenece a la finca (si se especifica)
  if (validatedData.lotId) {
    const farmId = validatedData.farmId || existingTask.farmId;
    const lot = await prisma.lot.findFirst({
      where: { 
        id: validatedData.lotId,
        farmId
      }
    });

    if (!lot) {
      throw new NotFoundError('Lote no encontrado en la finca especificada');
    }
  }

  // Si se está marcando como completada, establecer fecha de completado
  const updateData: any = { ...validatedData };
  if (validatedData.status === 'COMPLETED' && !validatedData.completedDate) {
    updateData.completedDate = new Date();
  }

  // Convertir fechas string a Date objects
  if (validatedData.scheduledDate) {
    updateData.scheduledDate = new Date(validatedData.scheduledDate);
  }
  if (validatedData.completedDate) {
    updateData.completedDate = new Date(validatedData.completedDate);
  }

  const task = await prisma.agriculturalTask.update({
    where: { id: parseInt(id) },
    data: updateData,
    include: {
      farm: {
        select: { id: true, name: true }
      },
      lot: {
        select: { id: true, name: true, variety: true }
      },
      inputUsage: {
        include: {
          inventory: {
            include: {
              input: true
            }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    data: task,
    message: 'Tarea actualizada exitosamente'
  });
});

// Eliminar tarea
export const deleteTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar que la tarea existe y pertenece al usuario
  const task = await prisma.agriculturalTask.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    },
    include: {
      inputUsage: true
    }
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  // No permitir eliminar tareas completadas con uso de insumos
  if (task.status === 'COMPLETED' && task.inputUsage.length > 0) {
    throw new ApplicationError(
      'No se puede eliminar una tarea completada que tiene uso de insumos registrado',
      400
    );
  }

  // Si la tarea tiene uso de insumos pendientes, restaurar el inventario
  if (task.status !== 'COMPLETED' && task.inputUsage.length > 0) {
    for (const usage of task.inputUsage) {
      await prisma.inventory.update({
        where: { id: usage.inventoryId },
        data: {
          quantity: {
            increment: usage.quantityUsed
          }
        }
      });
    }
  }

  // Eliminar la tarea (esto también eliminará los registros de uso por cascada)
  await prisma.agriculturalTask.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Tarea eliminada exitosamente'
  });
});

// Marcar tarea como completada
export const completeTask = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { actualDuration, completionNotes } = req.body;

  // Verificar que la tarea existe y pertenece al usuario
  const task = await prisma.agriculturalTask.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    }
  });

  if (!task) {
    throw new NotFoundError('Tarea no encontrada');
  }

  if (task.status === 'COMPLETED') {
    throw new ApplicationError('La tarea ya está completada', 400);
  }

  const updatedTask = await prisma.agriculturalTask.update({
    where: { id: parseInt(id) },
    data: {
      status: 'COMPLETED',
      completedDate: new Date(),
      actualDuration,
      completionNotes
    },
    include: {
      farm: {
        select: { id: true, name: true }
      },
      lot: {
        select: { id: true, name: true, variety: true }
      },
      inputUsage: {
        include: {
          inventory: {
            include: {
              input: true
            }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    data: updatedTask,
    message: 'Tarea marcada como completada'
  });
});

// Obtener tareas pendientes
export const getPendingTasks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { farmId, priority } = req.query;

  const where: any = {
    farm: { userId },
    status: { in: ['PENDING', 'IN_PROGRESS'] }
  };

  if (farmId) {
    where.farmId = parseInt(farmId as string);
  }

  if (priority) {
    where.priority = priority;
  }

  const tasks = await prisma.agriculturalTask.findMany({
    where,
    include: {
      farm: {
        select: { id: true, name: true }
      },
      lot: {
        select: { id: true, name: true, variety: true }
      },
      inputUsage: {
        include: {
          inventory: {
            include: {
              input: true
            }
          }
        }
      }
    },
    orderBy: [
      { priority: 'desc' },
      { scheduledDate: 'asc' }
    ]
  });

  // Categorizar tareas por urgencia
  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const categorized = {
    overdue: tasks.filter(task => task.scheduledDate < now),
    today: tasks.filter(task => 
      task.scheduledDate >= now && 
      task.scheduledDate < tomorrow
    ),
    thisWeek: tasks.filter(task => 
      task.scheduledDate >= tomorrow && 
      task.scheduledDate < nextWeek
    ),
    upcoming: tasks.filter(task => task.scheduledDate >= nextWeek)
  };

  res.json({
    success: true,
    data: {
      all: tasks,
      categorized,
      summary: {
        total: tasks.length,
        overdue: categorized.overdue.length,
        today: categorized.today.length,
        thisWeek: categorized.thisWeek.length,
        upcoming: categorized.upcoming.length
      }
    },
    message: 'Tareas pendientes obtenidas exitosamente'
  });
});

// Obtener estadísticas de tareas
export const getTaskStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { farmId, startDate, endDate } = req.query;

  const where: any = {
    farm: { userId }
  };

  if (farmId) {
    where.farmId = parseInt(farmId as string);
  }

  if (startDate && endDate) {
    where.scheduledDate = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const [
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    cancelledTasks,
    tasksByType,
    tasksByPriority
  ] = await Promise.all([
    prisma.agriculturalTask.count({ where }),
    prisma.agriculturalTask.count({ where: { ...where, status: 'COMPLETED' } }),
    prisma.agriculturalTask.count({ where: { ...where, status: 'PENDING' } }),
    prisma.agriculturalTask.count({ where: { ...where, status: 'IN_PROGRESS' } }),
    prisma.agriculturalTask.count({ where: { ...where, status: 'CANCELLED' } }),
    prisma.agriculturalTask.groupBy({
      by: ['type'],
      where,
      _count: { id: true }
    }),
    prisma.agriculturalTask.groupBy({
      by: ['priority'],
      where,
      _count: { id: true }
    })
  ]);

  const stats = {
    total: totalTasks,
    completed: completedTasks,
    pending: pendingTasks,
    inProgress: inProgressTasks,
    cancelled: cancelledTasks,
    completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    byType: tasksByType.reduce((acc, item) => {
      acc[item.type] = item._count.id;
      return acc;
    }, {} as any),
    byPriority: tasksByPriority.reduce((acc, item) => {
      acc[item.priority] = item._count.id;
      return acc;
    }, {} as any)
  };

  res.json({
    success: true,
    data: stats,
    message: 'Estadísticas de tareas obtenidas exitosamente'
  });
});

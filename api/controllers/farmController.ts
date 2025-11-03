import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { ApplicationError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

// Esquemas de validación
const createFarmSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  location: z.string().min(1, 'La ubicación es requerida'),
  totalArea: z.number().positive('El área total debe ser positiva'),
  cultivatedArea: z.number().positive('El área cultivada debe ser positiva'),
  altitude: z.number().positive('La altitud debe ser positiva'),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional(),
  description: z.string().optional()
});

const updateFarmSchema = createFarmSchema.partial();

// Obtener todas las fincas del usuario
export const getFarms = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  
  const farms = await prisma.farm.findMany({
    where: { userId },
    include: {
      lots: {
        select: {
          id: true,
          name: true,
          area: true,
          variety: true
        }
      },
      _count: {
        select: {
          lots: true,
          agriculturalTasks: true,
          expenses: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: farms,
    message: 'Fincas obtenidas exitosamente'
  });
});

// Obtener una finca específica
export const getFarmById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const farm = await prisma.farm.findFirst({
    where: { 
      id: parseInt(id),
      userId 
    },
    include: {
      lots: {
        include: {
          _count: {
            select: {
              agriculturalTasks: true,
              pestMonitoring: true,
              harvests: true
            }
          }
        }
      },
      agriculturalTasks: {
        take: 5,
        orderBy: { scheduledDate: 'desc' },
        include: {
          lot: {
            select: { name: true }
          }
        }
      },
      expenses: {
        take: 5,
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!farm) {
    throw new NotFoundError('Finca no encontrada');
  }

  res.json({
    success: true,
    data: farm,
    message: 'Finca obtenida exitosamente'
  });
});

// Crear nueva finca
export const createFarm = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const validatedData = createFarmSchema.parse(req.body);

  // Validación de área (si se necesita lógica específica se puede agregar aquí)

  const farm = await prisma.farm.create({
    data: {
      ...validatedData,
      coordinates: validatedData.coordinates ? JSON.stringify(validatedData.coordinates) : null,
      ownerId: userId!
    },
    include: {
      lots: true
    }
  });

  res.status(201).json({
    success: true,
    data: farm,
    message: 'Finca creada exitosamente'
  });
});

// Actualizar finca
export const updateFarm = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const validatedData = updateFarmSchema.parse(req.body);

  // Verificar que la finca existe y pertenece al usuario
  const existingFarm = await prisma.farm.findFirst({
    where: { 
      id: id,
      ownerId: userId 
    }
  });

  if (!existingFarm) {
    throw new NotFoundError('Finca no encontrada');
  }

  const farm = await prisma.farm.update({
    where: { id: id },
    data: {
      ...validatedData,
      coordinates: validatedData.coordinates ? JSON.stringify(validatedData.coordinates) : undefined
    },
    include: {
      lots: true
    }
  });

  res.json({
    success: true,
    data: farm,
    message: 'Finca actualizada exitosamente'
  });
});

// Eliminar finca
export const deleteFarm = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar que la finca existe y pertenece al usuario
  const farm = await prisma.farm.findFirst({
    where: { 
      id: id,
      ownerId: userId 
    },
    include: {
      _count: {
        select: {
          lots: true,
          agriculturalTasks: true,
          expenses: true
        }
      }
    }
  });

  if (!farm) {
    throw new NotFoundError('Finca no encontrada');
  }

  // Verificar si tiene datos relacionados
  if (farm._count.lots > 0 || farm._count.agriculturalTasks > 0 || farm._count.expenses > 0) {
    throw new ApplicationError(
      'No se puede eliminar la finca porque tiene datos relacionados (lotes, tareas o gastos)',
      400
    );
  }

  await prisma.farm.delete({
    where: { id: id }
  });

  res.json({
    success: true,
    message: 'Finca eliminada exitosamente'
  });
});

// Obtener estadísticas de la finca
export const getFarmStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar que la finca existe y pertenece al usuario
  const farm = await prisma.farm.findFirst({
    where: { 
      id: id,
      ownerId: userId 
    }
  });

  if (!farm) {
    throw new NotFoundError('Finca no encontrada');
  }

  // Obtener estadísticas
  const [
    totalLots,
    totalTasks,
    completedTasks,
    totalExpenses,
    totalHarvests,
    activeMonitoring
  ] = await Promise.all([
    prisma.lot.count({ where: { farmId: id } }),
    prisma.agriculturalTask.count({ where: { lot: { farmId: id } } }),
    prisma.agriculturalTask.count({ 
      where: { 
        lot: { farmId: id },
        status: 'COMPLETED'
      } 
    }),
    prisma.expense.aggregate({
      where: { lot: { farmId: id } },
      _sum: { amount: true }
    }),
    prisma.harvest.count({ where: { lot: { farmId: id } } }),
    prisma.pestMonitoring.count({ 
      where: { 
        lot: { farmId: id },
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        }
      } 
    })
  ]);

  const stats = {
    totalLots,
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
    taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    totalExpenses: totalExpenses._sum.amount || 0,
    totalHarvests,
    activeMonitoring,
    farmArea: {
      total: farm.area,
      utilizationRate: 100 // Asumiendo que toda el área está en uso
    }
  };

  res.json({
    success: true,
    data: stats,
    message: 'Estadísticas obtenidas exitosamente'
  });
});

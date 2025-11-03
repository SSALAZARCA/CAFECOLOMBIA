import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { ApplicationError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

// Esquemas de validación
const createLotSchema = z.object({
  farmId: z.number().int().positive(),
  name: z.string().min(1, 'El nombre es requerido'),
  area: z.number().positive('El área debe ser positiva'),
  variety: z.string().min(1, 'La variedad es requerida'),
  plantingDate: z.string().datetime().optional(),
  coordinates: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180)
  }).optional(),
  description: z.string().optional()
});

const updateLotSchema = createLotSchema.partial().omit({ farmId: true });

// Obtener todos los lotes de una finca
export const getLotsByFarm = asyncHandler(async (req: Request, res: Response) => {
  const { farmId } = req.params;
  const userId = req.user?.id;

  // Verificar que la finca pertenece al usuario
  const farm = await prisma.farm.findFirst({
    where: { 
      id: parseInt(farmId),
      userId 
    }
  });

  if (!farm) {
    throw new NotFoundError('Finca no encontrada');
  }

  const lots = await prisma.lot.findMany({
    where: { farmId: parseInt(farmId) },
    include: {
      _count: {
        select: {
          agriculturalTasks: true,
          pestMonitoring: true,
          harvests: true,
          microlots: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: lots,
    message: 'Lotes obtenidos exitosamente'
  });
});

// Obtener un lote específico
export const getLotById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const lot = await prisma.lot.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    },
    include: {
      farm: {
        select: {
          id: true,
          name: true,
          location: true
        }
      },
      agriculturalTasks: {
        take: 10,
        orderBy: { scheduledDate: 'desc' },
        include: {
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
      },
      pestMonitoring: {
        take: 5,
        orderBy: { createdAt: 'desc' }
      },
      harvests: {
        take: 5,
        orderBy: { date: 'desc' }
      },
      processing: {
        take: 5,
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!lot) {
    throw new NotFoundError('Lote no encontrado');
  }

  res.json({
    success: true,
    data: lot,
    message: 'Lote obtenido exitosamente'
  });
});

// Crear nuevo lote
export const createLot = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const validatedData = createLotSchema.parse(req.body);

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

  // Verificar que el área del lote no exceda el área disponible de la finca
  const existingLots = await prisma.lot.aggregate({
    where: { farmId: validatedData.farmId },
    _sum: { area: true }
  });

  const totalUsedArea = (existingLots._sum.area || 0) + validatedData.area;
  if (totalUsedArea > farm.cultivatedArea) {
    throw new ValidationError(
      `El área del lote excede el área disponible. Área disponible: ${farm.cultivatedArea - (existingLots._sum.area || 0)} hectáreas`
    );
  }

  const lot = await prisma.lot.create({
    data: {
      ...validatedData,
      plantingDate: validatedData.plantingDate ? new Date(validatedData.plantingDate) : null,
      coordinates: validatedData.coordinates ? JSON.stringify(validatedData.coordinates) : null
    },
    include: {
      farm: {
        select: {
          id: true,
          name: true,
          location: true
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: lot,
    message: 'Lote creado exitosamente'
  });
});

// Actualizar lote
export const updateLot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const validatedData = updateLotSchema.parse(req.body);

  // Verificar que el lote existe y pertenece al usuario
  const existingLot = await prisma.lot.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    },
    include: {
      farm: true
    }
  });

  if (!existingLot) {
    throw new NotFoundError('Lote no encontrado');
  }

  // Si se está actualizando el área, verificar disponibilidad
  if (validatedData.area) {
    const otherLots = await prisma.lot.aggregate({
      where: { 
        farmId: existingLot.farmId,
        id: { not: parseInt(id) }
      },
      _sum: { area: true }
    });

    const totalUsedArea = (otherLots._sum.area || 0) + validatedData.area;
    if (totalUsedArea > existingLot.farm.cultivatedArea) {
      throw new ValidationError(
        `El área del lote excede el área disponible. Área disponible: ${existingLot.farm.cultivatedArea - (otherLots._sum.area || 0)} hectáreas`
      );
    }
  }

  const lot = await prisma.lot.update({
    where: { id: id },
    data: {
      ...validatedData,
      plantingDate: validatedData.plantingDate ? new Date(validatedData.plantingDate) : undefined,
      coordinates: validatedData.coordinates ? JSON.stringify(validatedData.coordinates) : undefined
    },
    include: {
      farm: {
        select: {
          id: true,
          name: true,
          location: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: lot,
    message: 'Lote actualizado exitosamente'
  });
});

// Eliminar lote
export const deleteLot = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar que el lote existe y pertenece al usuario
  const lot = await prisma.lot.findFirst({
    where: { 
      id: id,
      farm: { ownerId: userId }
    },
    include: {
      _count: {
        select: {
          agriculturalTasks: true,
          pestMonitoring: true,
          harvests: true,
          microlots: true
        }
      }
    }
  });

  if (!lot) {
    throw new NotFoundError('Lote no encontrado');
  }

  // Verificar si tiene datos relacionados
  const relatedDataCount = await Promise.all([
    prisma.agriculturalTask.count({ where: { lotId: id } }),
    prisma.pestMonitoring.count({ where: { lotId: id } }),
    prisma.harvest.count({ where: { lotId: id } }),
    prisma.microlot.count({ where: { lotId: id } })
  ]);

  const hasRelatedData = relatedDataCount.some(count => count > 0);
  if (hasRelatedData) {
    throw new ApplicationError(
      'No se puede eliminar el lote porque tiene datos relacionados (tareas, monitoreo, cosechas o procesamientos)',
      400
    );
  }

  await prisma.lot.delete({
    where: { id: id }
  });

  res.json({
    success: true,
    message: 'Lote eliminado exitosamente'
  });
});

// Obtener estadísticas del lote
export const getLotStats = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar que el lote existe y pertenece al usuario
  const lot = await prisma.lot.findFirst({
    where: { 
      id: id,
      farm: { 
        ownerId: userId 
      }
    }
  });

  if (!lot) {
    throw new NotFoundError('Lote no encontrado');
  }

  // Obtener estadísticas
  const [
    totalTasks,
    completedTasks,
    totalHarvests,
    totalProduction,
    recentMonitoring,
    activeProcessing
  ] = await Promise.all([
    prisma.agriculturalTask.count({ where: { lotId: id } }),
    prisma.agriculturalTask.count({ 
      where: { 
        lotId: id,
        status: 'COMPLETADA'
      } 
    }),
    prisma.harvest.count({ where: { lotId: id } }),
    prisma.harvest.aggregate({
      where: { lotId: id },
      _sum: { quantityKg: true }
    }),
    prisma.pestMonitoring.count({ 
      where: { 
        lotId: id,
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Últimos 30 días
        }
      } 
    }),
    prisma.processing.count({ 
      where: { 
        microlot: {
          lotId: id
        },
        endDate: null // Procesamientos activos
      } 
    })
  ]);

  // Calcular edad del cultivo si hay fecha de siembra
  let cultivationAge = null;
  if (lot.plantingDate) {
    const ageInMs = Date.now() - lot.plantingDate.getTime();
    cultivationAge = Math.floor(ageInMs / (365.25 * 24 * 60 * 60 * 1000)); // Años
  }

  const stats = {
    totalTasks,
    completedTasks,
    pendingTasks: totalTasks - completedTasks,
    taskCompletionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
    totalHarvests,
    totalProduction: totalProduction._sum.quantityKg || 0,
    productionPerHectare: totalProduction._sum.quantityKg ? (totalProduction._sum.quantityKg / lot.area) : 0,
    recentMonitoring,
    activeProcessing,
    cultivationAge,
    lotInfo: {
      area: lot.area,
      variety: lot.variety,
      plantingDate: lot.plantingDate
    }
  };

  res.json({
    success: true,
    data: stats,
    message: 'Estadísticas del lote obtenidas exitosamente'
  });
});

// Obtener historial de actividades del lote
export const getLotHistory = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { page = 1, limit = 20 } = req.query;

  // Verificar que el lote existe y pertenece al usuario
  const lot = await prisma.lot.findFirst({
    where: { 
      id: id,
      farm: { 
        ownerId: userId 
      }
    }
  });

  if (!lot) {
    throw new NotFoundError('Lote no encontrado');
  }

  const skip = (Number(page) - 1) * Number(limit);

  // Obtener actividades recientes del lote
  const [tasks, monitoring, harvests, processing] = await Promise.all([
    prisma.agriculturalTask.findMany({
      where: { lotId: id },
      take: Number(limit),
      skip,
      orderBy: { scheduledDate: 'desc' },
      include: {
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
    }),
    prisma.pestMonitoring.findMany({
      where: { lotId: id },
      take: Number(limit),
      skip,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.harvest.findMany({
      where: { lotId: id },
      take: Number(limit),
      skip,
      orderBy: { harvestDate: 'desc' }
    }),
    prisma.processing.findMany({
      where: { 
        microlot: {
          lotId: id
        }
      },
      take: Number(limit),
      skip,
      orderBy: { startDate: 'desc' },
      include: {
        microlot: true
      }
    })
  ]);

  // Combinar y ordenar todas las actividades por fecha
  const activities = [
    ...tasks.map(task => ({
      type: 'task',
      id: task.id,
      date: task.scheduledDate,
      title: task.description,
      status: task.status,
      details: task
    })),
    ...monitoring.map(monitor => ({
      type: 'monitoring',
      id: monitor.id,
      date: monitor.createdAt,
      title: `Monitoreo de ${monitor.pestType}`,
      status: monitor.actionRequired ? 'action_required' : 'normal',
      details: monitor
    })),
    ...harvests.map(harvest => ({
      type: 'harvest',
      id: harvest.id,
      date: harvest.harvestDate,
      title: `Cosecha - ${harvest.quantityKg}kg`,
      status: 'completed',
      details: harvest
    })),
    ...processing.map(process => ({
      type: 'processing',
      id: process.id,
      date: process.startDate,
      title: `Procesamiento ${process.processType}`,
      status: process.endDate ? 'completed' : 'in_progress',
      details: process
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  res.json({
    success: true,
    data: {
      activities: activities.slice(0, Number(limit)),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: activities.length
      }
    },
    message: 'Historial del lote obtenido exitosamente'
  });
});

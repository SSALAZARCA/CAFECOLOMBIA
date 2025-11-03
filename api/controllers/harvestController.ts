import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { ApplicationError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

// Esquemas de validación
const createHarvestSchema = z.object({
  lotId: z.number().int().positive(),
  date: z.string().datetime(),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  quality: z.enum(['PREMIUM', 'GOOD', 'REGULAR', 'DEFECTIVE']),
  moisture: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  workers: z.array(z.string()).optional(),
  weather: z.string().optional()
});

const updateHarvestSchema = createHarvestSchema.partial();

const createProcessingSchema = z.object({
  lotId: z.number().int().positive(),
  harvestId: z.number().int().positive().optional(),
  type: z.enum(['WASHED', 'NATURAL', 'HONEY', 'FERMENTED']),
  date: z.string().datetime(),
  quantity: z.number().positive('La cantidad debe ser positiva'),
  description: z.string().optional(),
  parameters: z.object({
    temperature: z.number().optional(),
    humidity: z.number().optional(),
    fermentationTime: z.number().optional(),
    dryingTime: z.number().optional()
  }).optional(),
  notes: z.string().optional()
});

const updateProcessingSchema = createProcessingSchema.partial();

// CONTROLADORES PARA COSECHAS

// Obtener cosechas
export const getHarvests = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { 
    lotId, 
    farmId, 
    quality,
    startDate, 
    endDate,
    page = 1, 
    limit = 20 
  } = req.query;

  const where: any = {
    lot: {
      farm: { userId }
    }
  };

  if (lotId) {
    where.lotId = parseInt(lotId as string);
  }

  if (farmId) {
    where.lot.farmId = parseInt(farmId as string);
  }

  if (quality) {
    where.quality = quality;
  }

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [harvests, total] = await Promise.all([
    prisma.harvest.findMany({
      where,
      include: {
        lot: {
          include: {
            farm: {
              select: { id: true, name: true }
            }
          }
        },
        processing: {
          select: { id: true, type: true, quantity: true }
        }
      },
      orderBy: { date: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.harvest.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      harvests,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    },
    message: 'Cosechas obtenidas exitosamente'
  });
});

// Obtener cosecha específica
export const getHarvestById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const harvest = await prisma.harvest.findFirst({
    where: { 
      id: parseInt(id),
      lot: {
        farm: { userId }
      }
    },
    include: {
      lot: {
        include: {
          farm: {
            select: { id: true, name: true, location: true }
          }
        }
      },
      processing: {
        orderBy: { date: 'desc' }
      }
    }
  });

  if (!harvest) {
    throw new NotFoundError('Cosecha no encontrada');
  }

  res.json({
    success: true,
    data: harvest,
    message: 'Cosecha obtenida exitosamente'
  });
});

// Crear nueva cosecha
export const createHarvest = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const validatedData = createHarvestSchema.parse(req.body);

  // Verificar que el lote pertenece al usuario
  const lot = await prisma.lot.findFirst({
    where: { 
      id: validatedData.lotId,
      farm: { userId }
    }
  });

  if (!lot) {
    throw new NotFoundError('Lote no encontrado');
  }

  const harvest = await prisma.harvest.create({
    data: {
      ...validatedData,
      date: new Date(validatedData.date),
      workers: validatedData.workers ? JSON.stringify(validatedData.workers) : null
    },
    include: {
      lot: {
        include: {
          farm: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: harvest,
    message: 'Cosecha registrada exitosamente'
  });
});

// Actualizar cosecha
export const updateHarvest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const validatedData = updateHarvestSchema.parse(req.body);

  // Verificar que la cosecha existe y pertenece al usuario
  const existingHarvest = await prisma.harvest.findFirst({
    where: { 
      id: parseInt(id),
      lot: {
        farm: { userId }
      }
    }
  });

  if (!existingHarvest) {
    throw new NotFoundError('Cosecha no encontrada');
  }

  // Verificar que el lote pertenece al usuario (si se está actualizando)
  if (validatedData.lotId) {
    const lot = await prisma.lot.findFirst({
      where: { 
        id: validatedData.lotId,
        farm: { userId }
      }
    });

    if (!lot) {
      throw new NotFoundError('Lote no encontrado');
    }
  }

  const harvest = await prisma.harvest.update({
    where: { id: parseInt(id) },
    data: {
      ...validatedData,
      date: validatedData.date ? new Date(validatedData.date) : undefined,
      workers: validatedData.workers ? JSON.stringify(validatedData.workers) : undefined
    },
    include: {
      lot: {
        include: {
          farm: {
            select: { id: true, name: true }
          }
        }
      }
    }
  });

  res.json({
    success: true,
    data: harvest,
    message: 'Cosecha actualizada exitosamente'
  });
});

// Eliminar cosecha
export const deleteHarvest = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar que la cosecha existe y pertenece al usuario
  const harvest = await prisma.harvest.findFirst({
    where: { 
      id: parseInt(id),
      lot: {
        farm: { userId }
      }
    },
    include: {
      _count: {
        select: {
          processing: true
        }
      }
    }
  });

  if (!harvest) {
    throw new NotFoundError('Cosecha no encontrada');
  }

  // Verificar si tiene procesamientos relacionados
  if (harvest._count.processing > 0) {
    throw new ApplicationError(
      'No se puede eliminar la cosecha porque tiene procesamientos relacionados',
      400
    );
  }

  await prisma.harvest.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Cosecha eliminada exitosamente'
  });
});

// CONTROLADORES PARA PROCESAMIENTO

// Obtener procesamientos
export const getProcessing = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { 
    lotId, 
    farmId, 
    type,
    active,
    startDate, 
    endDate,
    page = 1, 
    limit = 20 
  } = req.query;

  const where: any = {
    lot: {
      farm: { userId }
    }
  };

  if (lotId) {
    where.lotId = parseInt(lotId as string);
  }

  if (farmId) {
    where.lot.farmId = parseInt(farmId as string);
  }

  if (type) {
    where.type = type;
  }

  if (active === 'true') {
    where.endDate = null;
  } else if (active === 'false') {
    where.endDate = { not: null };
  }

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [processing, total] = await Promise.all([
    prisma.processing.findMany({
      where,
      include: {
        lot: {
          include: {
            farm: {
              select: { id: true, name: true }
            }
          }
        },
        harvest: {
          select: { id: true, date: true, quantity: true, quality: true }
        }
      },
      orderBy: { date: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.processing.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      processing,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    },
    message: 'Procesamientos obtenidos exitosamente'
  });
});

// Obtener procesamiento específico
export const getProcessingById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const processing = await prisma.processing.findFirst({
    where: { 
      id: parseInt(id),
      lot: {
        farm: { userId }
      }
    },
    include: {
      lot: {
        include: {
          farm: {
            select: { id: true, name: true, location: true }
          }
        }
      },
      harvest: true
    }
  });

  if (!processing) {
    throw new NotFoundError('Procesamiento no encontrado');
  }

  res.json({
    success: true,
    data: processing,
    message: 'Procesamiento obtenido exitosamente'
  });
});

// Crear nuevo procesamiento
export const createProcessing = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const validatedData = createProcessingSchema.parse(req.body);

  // Verificar que el lote pertenece al usuario
  const lot = await prisma.lot.findFirst({
    where: { 
      id: validatedData.lotId,
      farm: { userId }
    }
  });

  if (!lot) {
    throw new NotFoundError('Lote no encontrado');
  }

  // Verificar que la cosecha pertenece al lote (si se especifica)
  if (validatedData.harvestId) {
    const harvest = await prisma.harvest.findFirst({
      where: { 
        id: validatedData.harvestId,
        lotId: validatedData.lotId
      }
    });

    if (!harvest) {
      throw new NotFoundError('Cosecha no encontrada en el lote especificado');
    }
  }

  const processing = await prisma.processing.create({
    data: {
      ...validatedData,
      date: new Date(validatedData.date),
      parameters: validatedData.parameters ? JSON.stringify(validatedData.parameters) : null
    },
    include: {
      lot: {
        include: {
          farm: {
            select: { id: true, name: true }
          }
        }
      },
      harvest: {
        select: { id: true, date: true, quantity: true, quality: true }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: processing,
    message: 'Procesamiento iniciado exitosamente'
  });
});

// Actualizar procesamiento
export const updateProcessing = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const validatedData = updateProcessingSchema.parse(req.body);

  // Verificar que el procesamiento existe y pertenece al usuario
  const existingProcessing = await prisma.processing.findFirst({
    where: { 
      id: parseInt(id),
      lot: {
        farm: { userId }
      }
    }
  });

  if (!existingProcessing) {
    throw new NotFoundError('Procesamiento no encontrado');
  }

  const processing = await prisma.processing.update({
    where: { id: parseInt(id) },
    data: {
      ...validatedData,
      date: validatedData.date ? new Date(validatedData.date) : undefined,
      parameters: validatedData.parameters ? JSON.stringify(validatedData.parameters) : undefined
    },
    include: {
      lot: {
        include: {
          farm: {
            select: { id: true, name: true }
          }
        }
      },
      harvest: {
        select: { id: true, date: true, quantity: true, quality: true }
      }
    }
  });

  res.json({
    success: true,
    data: processing,
    message: 'Procesamiento actualizado exitosamente'
  });
});

// Finalizar procesamiento
export const finishProcessing = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { endDate, finalQuantity, finalNotes } = req.body;

  // Verificar que el procesamiento existe y pertenece al usuario
  const processing = await prisma.processing.findFirst({
    where: { 
      id: parseInt(id),
      lot: {
        farm: { userId }
      }
    }
  });

  if (!processing) {
    throw new NotFoundError('Procesamiento no encontrado');
  }

  if (processing.endDate) {
    throw new ApplicationError('El procesamiento ya está finalizado', 400);
  }

  const updatedProcessing = await prisma.processing.update({
    where: { id: parseInt(id) },
    data: {
      endDate: endDate ? new Date(endDate) : new Date(),
      finalQuantity: finalQuantity || processing.quantity,
      finalNotes
    },
    include: {
      lot: {
        include: {
          farm: {
            select: { id: true, name: true }
          }
        }
      },
      harvest: {
        select: { id: true, date: true, quantity: true, quality: true }
      }
    }
  });

  res.json({
    success: true,
    data: updatedProcessing,
    message: 'Procesamiento finalizado exitosamente'
  });
});

// Eliminar procesamiento
export const deleteProcessing = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar que el procesamiento existe y pertenece al usuario
  const processing = await prisma.processing.findFirst({
    where: { 
      id: parseInt(id),
      lot: {
        farm: { userId }
      }
    }
  });

  if (!processing) {
    throw new NotFoundError('Procesamiento no encontrado');
  }

  await prisma.processing.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Procesamiento eliminado exitosamente'
  });
});

// Obtener estadísticas de cosecha y procesamiento
export const getHarvestStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { farmId, lotId, startDate, endDate } = req.query;

  const where: any = {
    lot: {
      farm: { userId }
    }
  };

  if (farmId) {
    where.lot.farmId = parseInt(farmId as string);
  }

  if (lotId) {
    where.lotId = parseInt(lotId as string);
  }

  if (startDate && endDate) {
    where.date = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const [
    totalHarvests,
    totalQuantity,
    harvestsByQuality,
    averageMoisture,
    processingStats,
    productionByMonth
  ] = await Promise.all([
    prisma.harvest.count({ where }),
    prisma.harvest.aggregate({
      where,
      _sum: { quantity: true }
    }),
    prisma.harvest.groupBy({
      by: ['quality'],
      where,
      _count: { id: true },
      _sum: { quantity: true }
    }),
    prisma.harvest.aggregate({
      where: { ...where, moisture: { not: null } },
      _avg: { moisture: true }
    }),
    prisma.processing.groupBy({
      by: ['type'],
      where: {
        lot: {
          farm: { userId }
        },
        ...(farmId && { lot: { farmId: parseInt(farmId as string) } }),
        ...(lotId && { lotId: parseInt(lotId as string) }),
        ...(startDate && endDate && {
          date: {
            gte: new Date(startDate as string),
            lte: new Date(endDate as string)
          }
        })
      },
      _count: { id: true },
      _sum: { quantity: true }
    }),
    // Producción por mes (últimos 12 meses)
    prisma.harvest.findMany({
      where: {
        ...where,
        date: {
          gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        date: true,
        quantity: true
      }
    })
  ]);

  // Agrupar producción por mes
  const monthlyProduction = productionByMonth.reduce((acc, harvest) => {
    const month = harvest.date.toISOString().slice(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = 0;
    }
    acc[month] += harvest.quantity;
    return acc;
  }, {} as any);

  const stats = {
    totalHarvests,
    totalQuantity: totalQuantity._sum.quantity || 0,
    averageMoisture: averageMoisture._avg.moisture || 0,
    qualityDistribution: harvestsByQuality.reduce((acc, item) => {
      acc[item.quality] = {
        count: item._count.id,
        quantity: item._sum.quantity || 0
      };
      return acc;
    }, {} as any),
    processingDistribution: processingStats.reduce((acc, item) => {
      acc[item.type] = {
        count: item._count.id,
        quantity: item._sum.quantity || 0
      };
      return acc;
    }, {} as any),
    monthlyProduction: Object.entries(monthlyProduction).map(([month, quantity]) => ({
      month,
      quantity
    })).sort((a, b) => a.month.localeCompare(b.month))
  };

  res.json({
    success: true,
    data: stats,
    message: 'Estadísticas de cosecha obtenidas exitosamente'
  });
});

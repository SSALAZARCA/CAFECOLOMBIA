import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { ApplicationError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

// Esquemas de validación
const createPestMonitoringSchema = z.object({
  lotId: z.number().int().positive(),
  pestType: z.string().min(1, 'El tipo de plaga es requerido'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  affectedArea: z.number().positive('El área afectada debe ser positiva'),
  description: z.string().min(1, 'La descripción es requerida'),
  symptoms: z.string().optional(),
  location: z.string().optional(),
  weatherConditions: z.string().optional(),
  photos: z.array(z.string()).optional(),
  recommendedActions: z.string().optional()
});

const updatePestMonitoringSchema = createPestMonitoringSchema.partial();

// Obtener monitoreos de plagas
export const getPestMonitoring = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { 
    lotId, 
    farmId, 
    severity, 
    pestType,
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

  if (severity) {
    where.severity = severity;
  }

  if (pestType) {
    where.pestType = { contains: pestType as string, mode: 'insensitive' };
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [monitoring, total] = await Promise.all([
    prisma.pestMonitoring.findMany({
      where,
      include: {
        lot: {
          include: {
            farm: {
              select: { id: true, name: true }
            }
          }
        }
      },
      orderBy: [
        { severity: 'desc' },
        { createdAt: 'desc' }
      ],
      skip,
      take: Number(limit)
    }),
    prisma.pestMonitoring.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      monitoring,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    },
    message: 'Monitoreos de plagas obtenidos exitosamente'
  });
});

// Obtener monitoreo específico
export const getPestMonitoringById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const monitoring = await prisma.pestMonitoring.findFirst({
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
      }
    }
  });

  if (!monitoring) {
    throw new NotFoundError('Monitoreo de plagas no encontrado');
  }

  res.json({
    success: true,
    data: monitoring,
    message: 'Monitoreo de plagas obtenido exitosamente'
  });
});

// Crear nuevo monitoreo de plagas
export const createPestMonitoring = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const validatedData = createPestMonitoringSchema.parse(req.body);

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

  // Verificar que el área afectada no exceda el área del lote
  if (validatedData.affectedArea > lot.area) {
    throw new ValidationError('El área afectada no puede ser mayor al área del lote');
  }

  const monitoring = await prisma.pestMonitoring.create({
    data: {
      ...validatedData,
      photos: validatedData.photos ? JSON.stringify(validatedData.photos) : null
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
    data: monitoring,
    message: 'Monitoreo de plagas creado exitosamente'
  });
});

// Actualizar monitoreo de plagas
export const updatePestMonitoring = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const validatedData = updatePestMonitoringSchema.parse(req.body);

  // Verificar que el monitoreo existe y pertenece al usuario
  const existingMonitoring = await prisma.pestMonitoring.findFirst({
    where: { 
      id: parseInt(id),
      lot: {
        farm: { userId }
      }
    },
    include: {
      lot: true
    }
  });

  if (!existingMonitoring) {
    throw new NotFoundError('Monitoreo de plagas no encontrado');
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

    // Verificar que el área afectada no exceda el área del lote
    if (validatedData.affectedArea && validatedData.affectedArea > lot.area) {
      throw new ValidationError('El área afectada no puede ser mayor al área del lote');
    }
  } else if (validatedData.affectedArea) {
    // Si no se está cambiando el lote, verificar con el lote actual
    if (validatedData.affectedArea > existingMonitoring.lot.area) {
      throw new ValidationError('El área afectada no puede ser mayor al área del lote');
    }
  }

  const monitoring = await prisma.pestMonitoring.update({
    where: { id: parseInt(id) },
    data: {
      ...validatedData,
      photos: validatedData.photos ? JSON.stringify(validatedData.photos) : undefined
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
    data: monitoring,
    message: 'Monitoreo de plagas actualizado exitosamente'
  });
});

// Eliminar monitoreo de plagas
export const deletePestMonitoring = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  // Verificar que el monitoreo existe y pertenece al usuario
  const monitoring = await prisma.pestMonitoring.findFirst({
    where: { 
      id: parseInt(id),
      lot: {
        farm: { userId }
      }
    }
  });

  if (!monitoring) {
    throw new NotFoundError('Monitoreo de plagas no encontrado');
  }

  await prisma.pestMonitoring.delete({
    where: { id: parseInt(id) }
  });

  res.json({
    success: true,
    message: 'Monitoreo de plagas eliminado exitosamente'
  });
});

// Obtener alertas de plagas
export const getPestAlerts = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { farmId } = req.query;

  const where: any = {
    lot: {
      farm: { userId }
    },
    severity: { in: ['HIGH', 'CRITICAL'] }
  };

  if (farmId) {
    where.lot.farmId = parseInt(farmId as string);
  }

  // Obtener alertas recientes (últimos 30 días)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  where.createdAt = { gte: thirtyDaysAgo };

  const alerts = await prisma.pestMonitoring.findMany({
    where,
    include: {
      lot: {
        include: {
          farm: {
            select: { id: true, name: true }
          }
        }
      }
    },
    orderBy: [
      { severity: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  // Agrupar por tipo de plaga
  const alertsByPest = alerts.reduce((acc, alert) => {
    if (!acc[alert.pestType]) {
      acc[alert.pestType] = [];
    }
    acc[alert.pestType].push(alert);
    return acc;
  }, {} as any);

  res.json({
    success: true,
    data: {
      alerts,
      alertsByPest,
      summary: {
        total: alerts.length,
        critical: alerts.filter(a => a.severity === 'CRITICAL').length,
        high: alerts.filter(a => a.severity === 'HIGH').length,
        affectedLots: [...new Set(alerts.map(a => a.lotId))].length
      }
    },
    message: 'Alertas de plagas obtenidas exitosamente'
  });
});

// Obtener estadísticas de plagas
export const getPestStats = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { farmId, startDate, endDate } = req.query;

  const where: any = {
    lot: {
      farm: { userId }
    }
  };

  if (farmId) {
    where.lot.farmId = parseInt(farmId as string);
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const [
    totalMonitoring,
    monitoringBySeverity,
    monitoringByPest,
    affectedArea,
    recentTrends
  ] = await Promise.all([
    prisma.pestMonitoring.count({ where }),
    prisma.pestMonitoring.groupBy({
      by: ['severity'],
      where,
      _count: { id: true }
    }),
    prisma.pestMonitoring.groupBy({
      by: ['pestType'],
      where,
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10
    }),
    prisma.pestMonitoring.aggregate({
      where,
      _sum: { affectedArea: true }
    }),
    // Tendencias de los últimos 7 días
    prisma.pestMonitoring.findMany({
      where: {
        ...where,
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        }
      },
      select: {
        createdAt: true,
        severity: true
      },
      orderBy: { createdAt: 'asc' }
    })
  ]);

  const stats = {
    total: totalMonitoring,
    totalAffectedArea: affectedArea._sum.affectedArea || 0,
    bySeverity: monitoringBySeverity.reduce((acc, item) => {
      acc[item.severity] = item._count.id;
      return acc;
    }, {} as any),
    byPestType: monitoringByPest.map(item => ({
      pestType: item.pestType,
      count: item._count.id
    })),
    recentTrends: recentTrends.map(item => ({
      date: item.createdAt.toISOString().split('T')[0],
      severity: item.severity
    }))
  };

  res.json({
    success: true,
    data: stats,
    message: 'Estadísticas de plagas obtenidas exitosamente'
  });
});

// Obtener recomendaciones de tratamiento
export const getTreatmentRecommendations = asyncHandler(async (req: Request, res: Response) => {
  const { pestType, severity } = req.query;

  if (!pestType || !severity) {
    throw new ValidationError('Tipo de plaga y severidad son requeridos');
  }

  // Base de conocimiento simple para recomendaciones
  const recommendations: any = {
    'Broca del café': {
      LOW: {
        actions: ['Monitoreo semanal', 'Recolección de frutos caídos', 'Poda sanitaria'],
        inputs: ['Control biológico con Beauveria bassiana'],
        frequency: 'Semanal',
        carencyPeriod: 0
      },
      MEDIUM: {
        actions: ['Aplicación de control biológico', 'Intensificar monitoreo', 'Recolección frecuente'],
        inputs: ['Beauveria bassiana', 'Trampas con alcohol'],
        frequency: 'Cada 3 días',
        carencyPeriod: 0
      },
      HIGH: {
        actions: ['Control químico selectivo', 'Control biológico intensivo', 'Manejo cultural'],
        inputs: ['Clorpirifos', 'Beauveria bassiana', 'Trampas'],
        frequency: 'Diario',
        carencyPeriod: 21
      },
      CRITICAL: {
        actions: ['Control químico inmediato', 'Renovación de lotes afectados', 'Manejo integrado'],
        inputs: ['Endosulfan', 'Clorpirifos', 'Control biológico'],
        frequency: 'Inmediato',
        carencyPeriod: 30
      }
    },
    'Roya del café': {
      LOW: {
        actions: ['Monitoreo de hojas', 'Mejora de ventilación', 'Nutrición balanceada'],
        inputs: ['Fungicidas preventivos', 'Fertilización foliar'],
        frequency: 'Quincenal',
        carencyPeriod: 7
      },
      MEDIUM: {
        actions: ['Aplicación de fungicidas', 'Poda de ventilación', 'Control nutricional'],
        inputs: ['Oxicloruro de cobre', 'Mancozeb'],
        frequency: 'Semanal',
        carencyPeriod: 14
      },
      HIGH: {
        actions: ['Fungicidas sistémicos', 'Poda drástica', 'Manejo de sombra'],
        inputs: ['Propiconazol', 'Tebuconazol', 'Cobre'],
        frequency: 'Cada 3 días',
        carencyPeriod: 21
      },
      CRITICAL: {
        actions: ['Renovación parcial', 'Control químico intensivo', 'Manejo integral'],
        inputs: ['Fungicidas sistémicos', 'Renovación de plantas'],
        frequency: 'Inmediato',
        carencyPeriod: 30
      }
    }
  };

  const recommendation = recommendations[pestType as string]?.[severity as string] || {
    actions: ['Consultar con técnico especializado'],
    inputs: ['Evaluación profesional requerida'],
    frequency: 'Según recomendación técnica',
    carencyPeriod: 'Variable'
  };

  res.json({
    success: true,
    data: {
      pestType,
      severity,
      recommendation,
      generalAdvice: [
        'Mantener registros detallados de aplicaciones',
        'Respetar períodos de carencia',
        'Usar equipo de protección personal',
        'Alternar principios activos para evitar resistencia',
        'Monitorear efectividad del tratamiento'
      ]
    },
    message: 'Recomendaciones de tratamiento obtenidas exitosamente'
  });
});

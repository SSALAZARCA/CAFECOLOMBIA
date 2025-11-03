import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { ApplicationError, NotFoundError, ValidationError } from '../middleware/errorHandler';
import { asyncHandler } from '../middleware/errorHandler';

// Esquemas de validación
const generateReportSchema = z.object({
  farmId: z.number().int().positive(),
  type: z.enum(['BPA_COMPLIANCE', 'PRODUCTION', 'FINANCIAL', 'PEST_CONTROL', 'TRACEABILITY', 'HARVEST']),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  format: z.enum(['PDF', 'EXCEL', 'JSON']).optional().default('PDF'),
  includeImages: z.boolean().optional().default(false),
  language: z.enum(['es', 'en']).optional().default('es')
});

const createComplianceCheckSchema = z.object({
  farmId: z.number().int().positive(),
  category: z.string().min(1, 'La categoría es requerida'),
  requirement: z.string().min(1, 'El requerimiento es requerido'),
  status: z.enum(['COMPLIANT', 'NON_COMPLIANT', 'PARTIAL', 'PENDING']),
  evidence: z.string().optional(),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
  responsible: z.string().optional()
});

const updateComplianceCheckSchema = createComplianceCheckSchema.partial();

// CONTROLADORES PARA REPORTES

// Generar reporte
export const generateReport = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const validatedData = generateReportSchema.parse(req.body);

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

  let reportData: any = {};

  switch (validatedData.type) {
    case 'BPA_COMPLIANCE':
      reportData = await generateBPAComplianceReport(validatedData.farmId, validatedData.startDate, validatedData.endDate);
      break;
    case 'PRODUCTION':
      reportData = await generateProductionReport(validatedData.farmId, validatedData.startDate, validatedData.endDate);
      break;
    case 'FINANCIAL':
      reportData = await generateFinancialReport(validatedData.farmId, validatedData.startDate, validatedData.endDate);
      break;
    case 'PEST_CONTROL':
      reportData = await generatePestControlReport(validatedData.farmId, validatedData.startDate, validatedData.endDate);
      break;
    case 'TRACEABILITY':
      reportData = await generateTraceabilityReport(validatedData.farmId, validatedData.startDate, validatedData.endDate);
      break;
    case 'HARVEST':
      reportData = await generateHarvestReport(validatedData.farmId, validatedData.startDate, validatedData.endDate);
      break;
    default:
      throw new ValidationError('Tipo de reporte no válido');
  }

  // Crear registro del reporte
  const report = await prisma.report.create({
    data: {
      farmId: validatedData.farmId,
      type: validatedData.type,
      startDate: new Date(validatedData.startDate),
      endDate: new Date(validatedData.endDate),
      format: validatedData.format,
      data: JSON.stringify(reportData),
      generatedBy: userId,
      status: 'COMPLETED'
    },
    include: {
      farm: {
        select: { id: true, name: true }
      }
    }
  });

  res.json({
    success: true,
    data: {
      report,
      reportData
    },
    message: 'Reporte generado exitosamente'
  });
});

// Obtener reportes
export const getReports = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { 
    farmId, 
    type,
    status,
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

  if (type) {
    where.type = type;
  }

  if (status) {
    where.status = status;
  }

  if (startDate && endDate) {
    where.createdAt = {
      gte: new Date(startDate as string),
      lte: new Date(endDate as string)
    };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [reports, total] = await Promise.all([
    prisma.report.findMany({
      where,
      include: {
        farm: {
          select: { id: true, name: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    }),
    prisma.report.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      reports,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    },
    message: 'Reportes obtenidos exitosamente'
  });
});

// Obtener reporte específico
export const getReportById = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const report = await prisma.report.findFirst({
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

  if (!report) {
    throw new NotFoundError('Reporte no encontrado');
  }

  res.json({
    success: true,
    data: {
      ...report,
      data: JSON.parse(report.data || '{}')
    },
    message: 'Reporte obtenido exitosamente'
  });
});

// CONTROLADORES PARA CUMPLIMIENTO BPA

// Obtener verificaciones de cumplimiento
export const getComplianceChecks = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { 
    farmId, 
    category,
    status,
    overdue,
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

  if (status) {
    where.status = status;
  }

  if (overdue === 'true') {
    where.dueDate = { lt: new Date() };
    where.status = { not: 'COMPLIANT' };
  }

  const skip = (Number(page) - 1) * Number(limit);

  const [checks, total] = await Promise.all([
    prisma.complianceCheck.findMany({
      where,
      include: {
        farm: {
          select: { id: true, name: true }
        }
      },
      orderBy: { dueDate: 'asc' },
      skip,
      take: Number(limit)
    }),
    prisma.complianceCheck.count({ where })
  ]);

  res.json({
    success: true,
    data: {
      checks,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    },
    message: 'Verificaciones de cumplimiento obtenidas exitosamente'
  });
});

// Crear verificación de cumplimiento
export const createComplianceCheck = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const validatedData = createComplianceCheckSchema.parse(req.body);

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

  const check = await prisma.complianceCheck.create({
    data: {
      ...validatedData,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : null
    },
    include: {
      farm: {
        select: { id: true, name: true }
      }
    }
  });

  res.status(201).json({
    success: true,
    data: check,
    message: 'Verificación de cumplimiento creada exitosamente'
  });
});

// Actualizar verificación de cumplimiento
export const updateComplianceCheck = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const validatedData = updateComplianceCheckSchema.parse(req.body);

  // Verificar que la verificación existe y pertenece al usuario
  const existingCheck = await prisma.complianceCheck.findFirst({
    where: { 
      id: parseInt(id),
      farm: { userId }
    }
  });

  if (!existingCheck) {
    throw new NotFoundError('Verificación de cumplimiento no encontrada');
  }

  const check = await prisma.complianceCheck.update({
    where: { id: parseInt(id) },
    data: {
      ...validatedData,
      dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined
    },
    include: {
      farm: {
        select: { id: true, name: true }
      }
    }
  });

  res.json({
    success: true,
    data: check,
    message: 'Verificación de cumplimiento actualizada exitosamente'
  });
});

// Obtener dashboard de cumplimiento BPA
export const getBPADashboard = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { farmId } = req.query;

  const where: any = {
    farm: { userId }
  };

  if (farmId) {
    where.farmId = parseInt(farmId as string);
  }

  const [
    totalChecks,
    complianceByStatus,
    overdueChecks,
    upcomingDeadlines,
    complianceByCategory
  ] = await Promise.all([
    prisma.complianceCheck.count({ where }),
    prisma.complianceCheck.groupBy({
      by: ['status'],
      where,
      _count: { id: true }
    }),
    prisma.complianceCheck.count({
      where: {
        ...where,
        dueDate: { lt: new Date() },
        status: { not: 'COMPLIANT' }
      }
    }),
    prisma.complianceCheck.findMany({
      where: {
        ...where,
        dueDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Próximos 30 días
        },
        status: { not: 'COMPLIANT' }
      },
      orderBy: { dueDate: 'asc' },
      take: 10
    }),
    prisma.complianceCheck.groupBy({
      by: ['category', 'status'],
      where,
      _count: { id: true }
    })
  ]);

  const complianceRate = totalChecks > 0 
    ? (complianceByStatus.find(s => s.status === 'COMPLIANT')?._count.id || 0) / totalChecks * 100
    : 0;

  const dashboard = {
    summary: {
      totalChecks,
      complianceRate: Math.round(complianceRate * 100) / 100,
      overdueChecks,
      upcomingDeadlines: upcomingDeadlines.length
    },
    statusDistribution: complianceByStatus.reduce((acc, item) => {
      acc[item.status] = item._count.id;
      return acc;
    }, {} as any),
    categoryBreakdown: complianceByCategory.reduce((acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = {};
      }
      acc[item.category][item.status] = item._count.id;
      return acc;
    }, {} as any),
    upcomingDeadlines
  };

  res.json({
    success: true,
    data: dashboard,
    message: 'Dashboard de cumplimiento BPA obtenido exitosamente'
  });
});

// FUNCIONES AUXILIARES PARA GENERAR REPORTES

async function generateBPAComplianceReport(farmId: number, startDate: string, endDate: string) {
  const farm = await prisma.farm.findUnique({
    where: { id: farmId },
    include: {
      lots: true,
      complianceChecks: {
        where: {
          createdAt: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        }
      }
    }
  });

  const complianceStats = await prisma.complianceCheck.groupBy({
    by: ['category', 'status'],
    where: {
      farmId,
      createdAt: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    _count: { id: true }
  });

  return {
    farm,
    period: { startDate, endDate },
    complianceStats,
    totalChecks: farm?.complianceChecks.length || 0,
    complianceRate: farm?.complianceChecks.length > 0 
      ? (farm.complianceChecks.filter(c => c.status === 'COMPLIANT').length / farm.complianceChecks.length) * 100
      : 0
  };
}

async function generateProductionReport(farmId: number, startDate: string, endDate: string) {
  const harvests = await prisma.harvest.findMany({
    where: {
      lot: { farmId },
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    include: {
      lot: true,
      processing: true
    }
  });

  const totalProduction = harvests.reduce((sum, h) => sum + h.quantity, 0);
  const qualityDistribution = harvests.reduce((acc, h) => {
    acc[h.quality] = (acc[h.quality] || 0) + h.quantity;
    return acc;
  }, {} as any);

  return {
    period: { startDate, endDate },
    harvests,
    totalProduction,
    qualityDistribution,
    averageQuality: harvests.length > 0 ? harvests.reduce((sum, h) => sum + (h.moisture || 0), 0) / harvests.length : 0
  };
}

async function generateFinancialReport(farmId: number, startDate: string, endDate: string) {
  const transactions = await prisma.transaction.findMany({
    where: {
      farmId,
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    }
  });

  const income = transactions.filter(t => t.type === 'INCOME').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'EXPENSE').reduce((sum, t) => sum + t.amount, 0);

  return {
    period: { startDate, endDate },
    transactions,
    summary: {
      totalIncome: income,
      totalExpenses: expenses,
      netProfit: income - expenses
    }
  };
}

async function generatePestControlReport(farmId: number, startDate: string, endDate: string) {
  const pestMonitoring = await prisma.pestMonitoring.findMany({
    where: {
      lot: { farmId },
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    include: {
      lot: true
    }
  });

  return {
    period: { startDate, endDate },
    pestMonitoring,
    summary: {
      totalRecords: pestMonitoring.length,
      activePests: pestMonitoring.filter(p => p.status === 'ACTIVE').length,
      criticalAlerts: pestMonitoring.filter(p => p.severity === 'CRITICAL').length
    }
  };
}

async function generateTraceabilityReport(farmId: number, startDate: string, endDate: string) {
  const harvests = await prisma.harvest.findMany({
    where: {
      lot: { farmId },
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    include: {
      lot: {
        include: {
          farm: true
        }
      },
      processing: true
    }
  });

  const tasks = await prisma.task.findMany({
    where: {
      lot: { farmId },
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    include: {
      lot: true,
      inputs: {
        include: {
          input: true
        }
      }
    }
  });

  return {
    period: { startDate, endDate },
    harvests,
    tasks,
    traceabilityChain: harvests.map(harvest => ({
      harvestId: harvest.id,
      lot: harvest.lot,
      processing: harvest.processing,
      relatedTasks: tasks.filter(t => t.lotId === harvest.lotId)
    }))
  };
}

async function generateHarvestReport(farmId: number, startDate: string, endDate: string) {
  const harvests = await prisma.harvest.findMany({
    where: {
      lot: { farmId },
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    include: {
      lot: true,
      processing: true
    }
  });

  const processing = await prisma.processing.findMany({
    where: {
      lot: { farmId },
      date: {
        gte: new Date(startDate),
        lte: new Date(endDate)
      }
    },
    include: {
      lot: true,
      harvest: true
    }
  });

  return {
    period: { startDate, endDate },
    harvests,
    processing,
    summary: {
      totalHarvests: harvests.length,
      totalQuantity: harvests.reduce((sum, h) => sum + h.quantity, 0),
      processingTypes: processing.reduce((acc, p) => {
        acc[p.type] = (acc[p.type] || 0) + 1;
        return acc;
      }, {} as any)
    }
  };
}

import { Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/database';
import { MicrolotStatus, QualityTestType, TraceabilityEventType, CertificationType, DocumentType } from '@prisma/client';
import crypto from 'crypto';

// Esquemas de validación
const createMicrolotSchema = z.object({
  lotId: z.string().min(1, 'ID del lote es requerido'),
  harvestId: z.string().min(1, 'ID de cosecha es requerido'),
  quantityKg: z.number().positive('La cantidad debe ser positiva'),
  qualityGrade: z.string().optional(),
  certifications: z.string().optional()
});

const qualityControlSchema = z.object({
  microlotId: z.string().min(1, 'ID del microlote es requerido'),
  testType: z.enum(['FISICO', 'SENSORIAL', 'COMPLETO']),
  moisture: z.number().min(0).max(100).optional(),
  density: z.number().positive().optional(),
  defects: z.number().min(0).max(100).optional(),
  screenSize: z.string().optional(),
  aroma: z.number().min(1).max(10).optional(),
  acidity: z.number().min(1).max(10).optional(),
  body: z.number().min(1).max(10).optional(),
  flavor: z.number().min(1).max(10).optional(),
  scaScore: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  photoUrls: z.string().optional()
});

const traceabilityEventSchema = z.object({
  microlotId: z.string().min(1, 'ID del microlote es requerido'),
  eventType: z.enum(['COSECHA', 'INICIO_BENEFICIO', 'FIN_BENEFICIO', 'INICIO_SECADO', 'FIN_SECADO', 'ALMACENAMIENTO', 'CONTROL_CALIDAD', 'CERTIFICACION', 'PREPARACION_EXPORTACION', 'EXPORTACION']),
  description: z.string().min(1, 'Descripción es requerida'),
  location: z.string().optional(),
  metadata: z.string().optional()
});

const certificationSchema = z.object({
  microlotId: z.string().min(1, 'ID del microlote es requerido'),
  certificationType: z.enum(['ORGANICO', 'FAIR_TRADE', 'RAINFOREST_ALLIANCE', 'UTZ', 'SPECIALTY', 'BIRD_FRIENDLY', 'OTRO']),
  certificationBody: z.string().min(1, 'Entidad certificadora es requerida'),
  certificateNumber: z.string().min(1, 'Número de certificado es requerido'),
  issueDate: z.string().transform((str) => new Date(str)),
  expiryDate: z.string().transform((str) => new Date(str)),
  documentUrl: z.string().optional(),
  notes: z.string().optional()
});

// Función para generar hash único
const generateHash = (data: string, previousHash?: string): string => {
  const input = previousHash ? `${previousHash}${data}` : data;
  return crypto.createHash('sha256').update(input).digest('hex');
};

// Función para generar código QR único
const generateQRCode = (): string => {
  const timestamp = Date.now().toString();
  const random = Math.random().toString(36).substring(2, 15);
  return `CF-${timestamp}-${random}`.toUpperCase();
};

// Obtener todos los microlotes con información de trazabilidad
export const getMicrolots = async (req: Request, res: Response) => {
  try {
    const { page = 1, limit = 10, status, lotId } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = {
      isActive: true
    };

    if (status) {
      where.status = status;
    }

    if (lotId) {
      where.lotId = lotId;
    }

    const [microlots, total] = await Promise.all([
      prisma.microlot.findMany({
        where,
        include: {
          lot: {
            include: {
              farm: true
            }
          },
          harvest: true,
          processing: true,
          qualityControls: {
            orderBy: { testDate: 'desc' },
            take: 1
          },
          traceabilityEvents: {
            orderBy: { eventDate: 'desc' },
            take: 5
          },
          certificationRecords: {
            where: { status: 'ACTIVA' }
          }
        },
        skip,
        take: Number(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.microlot.count({ where })
    ]);

    res.json({
      success: true,
      data: microlots,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error al obtener microlotes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener un microlote específico con toda su información de trazabilidad
export const getMicrolotById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const microlot = await prisma.microlot.findFirst({
      where: {
        id,
        isActive: true
      },
      include: {
        lot: {
          include: {
            farm: {
              include: {
                owner: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                  }
                }
              }
            }
          }
        },
        harvest: {
          include: {
            harvestedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        },
        processing: {
          include: {
            processedByUser: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { startDate: 'desc' }
        },
        qualityControls: {
          include: {
            tester: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { testDate: 'desc' }
        },
        traceabilityEvents: {
          include: {
            responsible: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: { eventDate: 'desc' }
        },
        certificationRecords: {
          orderBy: { issueDate: 'desc' }
        },
        generatedDocuments: {
          orderBy: { generatedAt: 'desc' }
        }
      }
    });

    if (!microlot) {
      return res.status(404).json({
        success: false,
        message: 'Microlote no encontrado'
      });
    }

    res.json({
      success: true,
      data: microlot
    });
  } catch (error) {
    console.error('Error al obtener microlote:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear un nuevo microlote
export const createMicrolot = async (req: Request, res: Response) => {
  try {
    const validatedData = createMicrolotSchema.parse(req.body);
    const userId = req.user?.id;

    // Verificar que el lote y la cosecha existen
    const [lot, harvest] = await Promise.all([
      prisma.lot.findFirst({
        where: { id: validatedData.lotId, isActive: true }
      }),
      prisma.harvest.findFirst({
        where: { id: validatedData.harvestId }
      })
    ]);

    if (!lot) {
      return res.status(404).json({
        success: false,
        message: 'Lote no encontrado'
      });
    }

    if (!harvest) {
      return res.status(404).json({
        success: false,
        message: 'Cosecha no encontrada'
      });
    }

    // Generar código QR único
    const qrCode = generateQRCode();

    // Crear el microlote
    const microlot = await prisma.microlot.create({
      data: {
        ...validatedData,
        code: qrCode,
        processDate: new Date(),
        status: 'COSECHADO'
      },
      include: {
        lot: {
          include: {
            farm: true
          }
        },
        harvest: true
      }
    });

    // Crear evento inicial de trazabilidad
    const eventData = `${microlot.id}-COSECHA-${new Date().toISOString()}`;
    const hash = generateHash(eventData);

    await prisma.traceabilityEvent.create({
      data: {
        microlotId: microlot.id,
        eventType: 'COSECHA',
        eventDate: new Date(),
        description: `Microlote creado desde cosecha ${harvest.id}`,
        location: lot.farm.location,
        responsibleBy: userId!,
        currentHash: hash,
        blockNumber: 1,
        metadata: JSON.stringify({
          quantityKg: microlot.quantityKg,
          qualityGrade: microlot.qualityGrade,
          farmName: lot.farm.name,
          lotName: lot.name
        })
      }
    });

    res.status(201).json({
      success: true,
      data: microlot,
      message: 'Microlote creado exitosamente'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors
      });
    }

    console.error('Error al crear microlote:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar estado de microlote
export const updateMicrolotStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;
    const userId = req.user?.id;

    const validStatuses: MicrolotStatus[] = ['COSECHADO', 'EN_BENEFICIO', 'SECANDO', 'ALMACENADO', 'LISTO_EXPORTACION', 'EXPORTADO'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    const microlot = await prisma.microlot.findFirst({
      where: { id, isActive: true }
    });

    if (!microlot) {
      return res.status(404).json({
        success: false,
        message: 'Microlote no encontrado'
      });
    }

    // Actualizar microlote
    const updatedMicrolot = await prisma.microlot.update({
      where: { id },
      data: { status }
    });

    // Crear evento de trazabilidad
    const lastEvent = await prisma.traceabilityEvent.findFirst({
      where: { microlotId: id },
      orderBy: { blockNumber: 'desc' }
    });

    const eventData = `${id}-${status}-${new Date().toISOString()}`;
    const hash = generateHash(eventData, lastEvent?.currentHash);

    await prisma.traceabilityEvent.create({
      data: {
        microlotId: id,
        eventType: status as TraceabilityEventType,
        eventDate: new Date(),
        description: `Estado cambiado a ${status}`,
        responsibleBy: userId!,
        previousHash: lastEvent?.currentHash,
        currentHash: hash,
        blockNumber: (lastEvent?.blockNumber || 0) + 1,
        metadata: JSON.stringify({ notes, previousStatus: microlot.status })
      }
    });

    res.json({
      success: true,
      data: updatedMicrolot,
      message: 'Estado actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error al actualizar estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear control de calidad
export const createQualityControl = async (req: Request, res: Response) => {
  try {
    const validatedData = qualityControlSchema.parse(req.body);
    const userId = req.user?.id;

    const microlot = await prisma.microlot.findFirst({
      where: { id: validatedData.microlotId, isActive: true }
    });

    if (!microlot) {
      return res.status(404).json({
        success: false,
        message: 'Microlote no encontrado'
      });
    }

    // Determinar si pasó el control de calidad
    let passed = false;
    if (validatedData.testType === 'FISICO') {
      passed = (validatedData.moisture || 0) <= 12 && (validatedData.defects || 0) <= 5;
    } else if (validatedData.testType === 'SENSORIAL') {
      passed = (validatedData.scaScore || 0) >= 80;
    } else if (validatedData.testType === 'COMPLETO') {
      passed = (validatedData.moisture || 0) <= 12 && 
               (validatedData.defects || 0) <= 5 && 
               (validatedData.scaScore || 0) >= 80;
    }

    const qualityControl = await prisma.qualityControl.create({
      data: {
        ...validatedData,
        testDate: new Date(),
        testedBy: userId!,
        passed
      },
      include: {
        tester: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Crear evento de trazabilidad
    const lastEvent = await prisma.traceabilityEvent.findFirst({
      where: { microlotId: validatedData.microlotId },
      orderBy: { blockNumber: 'desc' }
    });

    const eventData = `${validatedData.microlotId}-CONTROL_CALIDAD-${new Date().toISOString()}`;
    const hash = generateHash(eventData, lastEvent?.currentHash);

    await prisma.traceabilityEvent.create({
      data: {
        microlotId: validatedData.microlotId,
        eventType: 'CONTROL_CALIDAD',
        eventDate: new Date(),
        description: `Control de calidad ${validatedData.testType} - ${passed ? 'APROBADO' : 'RECHAZADO'}`,
        responsibleBy: userId!,
        previousHash: lastEvent?.currentHash,
        currentHash: hash,
        blockNumber: (lastEvent?.blockNumber || 0) + 1,
        metadata: JSON.stringify({
          testType: validatedData.testType,
          passed,
          scaScore: validatedData.scaScore,
          moisture: validatedData.moisture,
          defects: validatedData.defects
        })
      }
    });

    res.status(201).json({
      success: true,
      data: qualityControl,
      message: 'Control de calidad registrado exitosamente'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors
      });
    }

    console.error('Error al crear control de calidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear evento de trazabilidad manual
export const createTraceabilityEvent = async (req: Request, res: Response) => {
  try {
    const validatedData = traceabilityEventSchema.parse(req.body);
    const userId = req.user?.id;

    const microlot = await prisma.microlot.findFirst({
      where: { id: validatedData.microlotId, isActive: true }
    });

    if (!microlot) {
      return res.status(404).json({
        success: false,
        message: 'Microlote no encontrado'
      });
    }

    const lastEvent = await prisma.traceabilityEvent.findFirst({
      where: { microlotId: validatedData.microlotId },
      orderBy: { blockNumber: 'desc' }
    });

    const eventData = `${validatedData.microlotId}-${validatedData.eventType}-${new Date().toISOString()}`;
    const hash = generateHash(eventData, lastEvent?.currentHash);

    const traceabilityEvent = await prisma.traceabilityEvent.create({
      data: {
        ...validatedData,
        eventDate: new Date(),
        responsibleBy: userId!,
        previousHash: lastEvent?.currentHash,
        currentHash: hash,
        blockNumber: (lastEvent?.blockNumber || 0) + 1
      },
      include: {
        responsible: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: traceabilityEvent,
      message: 'Evento de trazabilidad creado exitosamente'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors
      });
    }

    console.error('Error al crear evento de trazabilidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear certificación
export const createCertification = async (req: Request, res: Response) => {
  try {
    const validatedData = certificationSchema.parse(req.body);

    const microlot = await prisma.microlot.findFirst({
      where: { id: validatedData.microlotId, isActive: true }
    });

    if (!microlot) {
      return res.status(404).json({
        success: false,
        message: 'Microlote no encontrado'
      });
    }

    const certification = await prisma.certificationRecord.create({
      data: {
        ...validatedData,
        status: 'ACTIVA'
      }
    });

    res.status(201).json({
      success: true,
      data: certification,
      message: 'Certificación creada exitosamente'
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: error.errors
      });
    }

    console.error('Error al crear certificación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener información pública de un microlote por código QR
export const getPublicMicrolotInfo = async (req: Request, res: Response) => {
  try {
    const { code } = req.params;

    const microlot = await prisma.microlot.findFirst({
      where: {
        code,
        isActive: true
      },
      include: {
        lot: {
          include: {
            farm: {
              include: {
                owner: {
                  select: {
                    firstName: true,
                    lastName: true
                  }
                }
              }
            }
          }
        },
        harvest: true,
        processing: {
          orderBy: { startDate: 'desc' }
        },
        qualityControls: {
          where: { passed: true },
          orderBy: { testDate: 'desc' },
          take: 1
        },
        certificationRecords: {
          where: { status: 'ACTIVA' }
        },
        traceabilityEvents: {
          orderBy: { eventDate: 'asc' }
        }
      }
    });

    if (!microlot) {
      return res.status(404).json({
        success: false,
        message: 'Microlote no encontrado'
      });
    }

    // Información pública (sin datos sensibles)
    const publicInfo = {
      code: microlot.code,
      quantityKg: microlot.quantityKg,
      qualityGrade: microlot.qualityGrade,
      status: microlot.status,
      processDate: microlot.processDate,
      farm: {
        name: microlot.lot.farm.name,
        location: microlot.lot.farm.location,
        altitude: microlot.lot.farm.altitude,
        owner: `${microlot.lot.farm.owner.firstName} ${microlot.lot.farm.owner.lastName}`
      },
      lot: {
        name: microlot.lot.name,
        variety: microlot.lot.variety,
        area: microlot.lot.area
      },
      harvest: {
        date: microlot.harvest.harvestDate,
        qualityGrade: microlot.harvest.qualityGrade
      },
      processing: microlot.processing.map(p => ({
        type: p.processType,
        startDate: p.startDate,
        endDate: p.endDate,
        qualityScore: p.qualityScore
      })),
      qualityControl: microlot.qualityControls[0] ? {
        testType: microlot.qualityControls[0].testType,
        testDate: microlot.qualityControls[0].testDate,
        scaScore: microlot.qualityControls[0].scaScore,
        moisture: microlot.qualityControls[0].moisture,
        passed: microlot.qualityControls[0].passed
      } : null,
      certifications: microlot.certificationRecords.map(c => ({
        type: c.certificationType,
        body: c.certificationBody,
        issueDate: c.issueDate,
        expiryDate: c.expiryDate
      })),
      traceabilityTimeline: microlot.traceabilityEvents.map(e => ({
        eventType: e.eventType,
        eventDate: e.eventDate,
        description: e.description,
        location: e.location
      }))
    };

    res.json({
      success: true,
      data: publicInfo
    });
  } catch (error) {
    console.error('Error al obtener información pública:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener estadísticas de trazabilidad
export const getTraceabilityStats = async (req: Request, res: Response) => {
  try {
    const [
      totalMicrolots,
      statusStats,
      qualityStats,
      certificationStats,
      recentEvents
    ] = await Promise.all([
      prisma.microlot.count({ where: { isActive: true } }),
      prisma.microlot.groupBy({
        by: ['status'],
        _count: { status: true },
        where: { isActive: true }
      }),
      prisma.qualityControl.groupBy({
        by: ['passed'],
        _count: { passed: true },
        _avg: { scaScore: true }
      }),
      prisma.certificationRecord.groupBy({
        by: ['certificationType'],
        _count: { certificationType: true },
        where: { status: 'ACTIVA' }
      }),
      prisma.traceabilityEvent.findMany({
        take: 10,
        orderBy: { eventDate: 'desc' },
        include: {
          microlot: {
            select: {
              code: true,
              lot: {
                select: {
                  name: true,
                  farm: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          responsible: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        totalMicrolots,
        statusDistribution: statusStats,
        qualityMetrics: qualityStats,
        certificationDistribution: certificationStats,
        recentEvents
      }
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
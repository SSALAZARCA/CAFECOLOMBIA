import express from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Interfaces para análisis de IA
interface AIAnalysisResult {
  id: string;
  type: 'phytosanitary' | 'predictive' | 'optimization' | 'rag';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  confidence: number;
  result: any;
  metadata: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
  processingTime?: number;
}

interface AINotification {
  id: string;
  type: 'analysis_complete' | 'alert' | 'recommendation' | 'warning';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  farmId?: string;
  lotId?: string;
  isRead: boolean;
  createdAt: Date;
  expiresAt?: Date;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// Datos de ejemplo para resultados de análisis IA
const mockAnalysisResults: AIAnalysisResult[] = [
  {
    id: 'analysis_1',
    type: 'phytosanitary',
    status: 'completed',
    confidence: 0.92,
    result: {
      detections: [
        {
          pest: 'Broca del café',
          confidence: 0.92,
          severity: 'high',
          location: { x: 150, y: 200, width: 80, height: 60 },
          recommendations: [
            'Aplicar tratamiento específico para broca',
            'Monitorear área afectada semanalmente',
            'Implementar trampas preventivas'
          ]
        }
      ],
      overallHealth: 'moderate',
      riskLevel: 'high'
    },
    metadata: {
      imageId: 'img_123',
      farmId: 'farm_1',
      lotId: 'lot_3',
      captureDate: '2024-01-15T10:30:00Z'
    },
    createdAt: new Date('2024-01-15T10:30:00Z'),
    completedAt: new Date('2024-01-15T10:32:15Z'),
    processingTime: 135
  },
  {
    id: 'analysis_2',
    type: 'predictive',
    status: 'completed',
    confidence: 0.87,
    result: {
      forecast: {
        pestRisk: 'medium',
        diseaseRisk: 'low',
        weatherImpact: 'high',
        harvestPrediction: {
          estimatedYield: '2.3 ton/ha',
          qualityGrade: 'premium',
          harvestWindow: '2024-03-15 - 2024-04-15'
        }
      },
      recommendations: [
        'Incrementar monitoreo de plagas en las próximas 2 semanas',
        'Preparar sistemas de drenaje para temporada lluviosa',
        'Planificar cosecha para mediados de marzo'
      ]
    },
    metadata: {
      farmId: 'farm_1',
      analysisType: 'seasonal_forecast',
      dataPoints: 156
    },
    createdAt: new Date('2024-01-14T15:20:00Z'),
    completedAt: new Date('2024-01-14T15:25:30Z'),
    processingTime: 330
  }
];

// Datos de ejemplo para notificaciones IA
const mockAINotifications: AINotification[] = [
  {
    id: 'notif_1',
    type: 'analysis_complete',
    title: 'Análisis Fitosanitario Completado',
    message: 'El análisis de la imagen del lote 3 ha detectado presencia de broca del café con 92% de confianza.',
    priority: 'high',
    userId: 'user_1',
    farmId: 'farm_1',
    lotId: 'lot_3',
    isRead: false,
    createdAt: new Date('2024-01-15T10:32:15Z'),
    actionUrl: '/analysis/analysis_1',
    metadata: {
      analysisId: 'analysis_1',
      confidence: 0.92,
      detectionType: 'pest'
    }
  },
  {
    id: 'notif_2',
    type: 'recommendation',
    title: 'Recomendación de Tratamiento',
    message: 'Basado en el análisis predictivo, se recomienda incrementar el monitoreo de plagas.',
    priority: 'medium',
    userId: 'user_1',
    farmId: 'farm_1',
    isRead: false,
    createdAt: new Date('2024-01-14T15:25:30Z'),
    actionUrl: '/recommendations',
    metadata: {
      analysisId: 'analysis_2',
      recommendationType: 'preventive'
    }
  },
  {
    id: 'notif_3',
    type: 'alert',
    title: 'Alerta Climática',
    message: 'Las condiciones climáticas favorecen el desarrollo de hongos. Considere aplicar fungicidas preventivos.',
    priority: 'medium',
    userId: 'user_1',
    farmId: 'farm_1',
    isRead: true,
    createdAt: new Date('2024-01-13T08:15:00Z'),
    expiresAt: new Date('2024-01-20T08:15:00Z'),
    metadata: {
      alertType: 'weather_based',
      riskLevel: 'medium'
    }
  }
];

// GET /api/ai/analysis/results - Obtener resultados de análisis IA
router.get('/analysis/results', async (req: Request, res: Response) => {
  try {
    const { type, status, farmId, limit = 10, offset = 0 } = req.query;
    
    let filteredResults = [...mockAnalysisResults];
    
    // Filtrar por tipo
    if (type) {
      filteredResults = filteredResults.filter(result => result.type === type);
    }
    
    // Filtrar por estado
    if (status) {
      filteredResults = filteredResults.filter(result => result.status === status);
    }
    
    // Filtrar por finca
    if (farmId) {
      filteredResults = filteredResults.filter(result => result.metadata.farmId === farmId);
    }
    
    // Paginación
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedResults = filteredResults.slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      success: true,
      data: paginatedResults,
      total: filteredResults.length,
      limit: limitNum,
      offset: offsetNum,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo resultados de análisis IA:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener los resultados de análisis'
    });
  }
});

// GET /api/ai/analysis/results/:id - Obtener resultado específico
router.get('/analysis/results/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const result = mockAnalysisResults.find(r => r.id === id);
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Resultado no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error obteniendo resultado de análisis:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// POST /api/ai/analysis - Crear nuevo análisis IA
router.post('/analysis', async (req: Request, res: Response) => {
  try {
    const { type, imageData, metadata } = req.body;
    
    const newAnalysis: AIAnalysisResult = {
      id: `analysis_${Date.now()}`,
      type,
      status: 'pending',
      confidence: 0,
      result: null,
      metadata: metadata || {},
      createdAt: new Date()
    };
    
    mockAnalysisResults.push(newAnalysis);
    
    // Simular procesamiento asíncrono
    setTimeout(() => {
      const analysisIndex = mockAnalysisResults.findIndex(a => a.id === newAnalysis.id);
      if (analysisIndex !== -1) {
        mockAnalysisResults[analysisIndex].status = 'completed';
        mockAnalysisResults[analysisIndex].confidence = 0.85 + Math.random() * 0.15;
        mockAnalysisResults[analysisIndex].completedAt = new Date();
        mockAnalysisResults[analysisIndex].processingTime = 120 + Math.random() * 180;
        mockAnalysisResults[analysisIndex].result = {
          message: 'Análisis completado exitosamente',
          detections: [],
          recommendations: []
        };
      }
    }, 2000);
    
    res.status(201).json({
      success: true,
      data: newAnalysis,
      message: 'Análisis iniciado exitosamente'
    });
  } catch (error) {
    console.error('Error creando análisis IA:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/ai/notifications - Obtener notificaciones IA
router.get('/notifications', async (req: Request, res: Response) => {
  try {
    const { type, priority, isRead, farmId, limit = 20, offset = 0 } = req.query;
    const userId = (req as any).user?.id || 'user_1';
    
    let filteredNotifications = mockAINotifications.filter(notif => notif.userId === userId);
    
    // Filtrar por tipo
    if (type) {
      filteredNotifications = filteredNotifications.filter(notif => notif.type === type);
    }
    
    // Filtrar por prioridad
    if (priority) {
      filteredNotifications = filteredNotifications.filter(notif => notif.priority === priority);
    }
    
    // Filtrar por estado de lectura
    if (isRead !== undefined) {
      const readStatus = isRead === 'true';
      filteredNotifications = filteredNotifications.filter(notif => notif.isRead === readStatus);
    }
    
    // Filtrar por finca
    if (farmId) {
      filteredNotifications = filteredNotifications.filter(notif => notif.farmId === farmId);
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    filteredNotifications.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    // Paginación
    const limitNum = parseInt(limit as string);
    const offsetNum = parseInt(offset as string);
    const paginatedNotifications = filteredNotifications.slice(offsetNum, offsetNum + limitNum);
    
    res.json({
      success: true,
      data: paginatedNotifications,
      total: filteredNotifications.length,
      unread: filteredNotifications.filter(n => !n.isRead).length,
      limit: limitNum,
      offset: offsetNum
    });
  } catch (error) {
    console.error('Error obteniendo notificaciones IA:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/ai/notifications/:id/read - Marcar notificación como leída
router.put('/notifications/:id/read', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user?.id || 'user_1';
    
    const notificationIndex = mockAINotifications.findIndex(
      notif => notif.id === id && notif.userId === userId
    );
    
    if (notificationIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Notificación no encontrada'
      });
    }
    
    mockAINotifications[notificationIndex].isRead = true;
    
    res.json({
      success: true,
      data: mockAINotifications[notificationIndex],
      message: 'Notificación marcada como leída'
    });
  } catch (error) {
    console.error('Error marcando notificación como leída:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/ai/notifications/read-all - Marcar todas las notificaciones como leídas
router.put('/notifications/read-all', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'user_1';
    
    let updatedCount = 0;
    mockAINotifications.forEach(notif => {
      if (notif.userId === userId && !notif.isRead) {
        notif.isRead = true;
        updatedCount++;
      }
    });
    
    res.json({
      success: true,
      message: `${updatedCount} notificaciones marcadas como leídas`,
      updatedCount
    });
  } catch (error) {
    console.error('Error marcando todas las notificaciones como leídas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/ai/status - Estado general del sistema IA
router.get('/status', async (req: Request, res: Response) => {
  try {
    const status = {
      services: {
        phytosanitary: { status: 'online', responseTime: '120ms', accuracy: '94%' },
        predictive: { status: 'online', responseTime: '250ms', accuracy: '87%' },
        rag: { status: 'online', responseTime: '180ms', satisfaction: '92%' },
        optimization: { status: 'online', responseTime: '300ms', efficiency: '89%' }
      },
      statistics: {
        totalAnalyses: mockAnalysisResults.length,
        completedToday: mockAnalysisResults.filter(r => 
          r.completedAt && r.completedAt.toDateString() === new Date().toDateString()
        ).length,
        averageProcessingTime: '165ms',
        successRate: '96.5%'
      },
      notifications: {
        total: mockAINotifications.length,
        unread: mockAINotifications.filter(n => !n.isRead).length,
        highPriority: mockAINotifications.filter(n => n.priority === 'high' || n.priority === 'critical').length
      }
    };
    
    res.json({
      success: true,
      data: status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo estado del sistema IA:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
const express = require('express');
const router = express.Router();

// Datos de ejemplo para resultados de análisis IA
const mockAnalysisResults = [
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
  },
  {
    id: 'analysis_3',
    type: 'optimization',
    status: 'processing',
    confidence: 0.0,
    result: null,
    metadata: {
      farmId: 'farm_2',
      analysisType: 'yield_optimization',
      startedAt: '2024-01-16T09:00:00Z'
    },
    createdAt: new Date('2024-01-16T09:00:00Z')
  }
];

// Datos de ejemplo para notificaciones IA
const mockAINotifications = [
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
  }
];

// GET /api/ai/analysis/results - Obtener resultados de análisis IA
router.get('/analysis/results', async (req, res) => {
  try {
    const { type, status, farmId, limit = 10, offset = 0 } = req.query;
    
    let filteredResults = [...mockAnalysisResults];
    
    // Aplicar filtros
    if (type) {
      filteredResults = filteredResults.filter(result => result.type === type);
    }
    
    if (status) {
      filteredResults = filteredResults.filter(result => result.status === status);
    }
    
    if (farmId) {
      filteredResults = filteredResults.filter(result => 
        result.metadata && result.metadata.farmId === farmId
      );
    }
    
    // Paginación
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedResults = filteredResults.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedResults,
      total: filteredResults.length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < filteredResults.length
      },
      filters: { type, status, farmId }
    });
  } catch (error) {
    console.error('Error fetching AI analysis results:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/ai/analysis/results/:id - Obtener resultado específico
router.get('/analysis/results/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = mockAnalysisResults.find(r => r.id === id);
    
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Resultado de análisis no encontrado'
      });
    }
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching AI analysis result:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/ai/analysis - Iniciar nuevo análisis IA
router.post('/analysis', async (req, res) => {
  try {
    const { type, farmId, lotId, imageData, parameters } = req.body;
    
    if (!type || !farmId) {
      return res.status(400).json({
        success: false,
        message: 'Tipo de análisis y ID de finca son requeridos'
      });
    }
    
    const newAnalysis = {
      id: `analysis_${Date.now()}`,
      type,
      status: 'pending',
      confidence: 0.0,
      result: null,
      metadata: {
        farmId,
        lotId,
        parameters: parameters || {},
        startedAt: new Date().toISOString()
      },
      createdAt: new Date()
    };
    
    mockAnalysisResults.push(newAnalysis);
    
    // Simular procesamiento asíncrono
    setTimeout(() => {
      const analysisIndex = mockAnalysisResults.findIndex(a => a.id === newAnalysis.id);
      if (analysisIndex !== -1) {
        mockAnalysisResults[analysisIndex].status = 'processing';
      }
    }, 1000);
    
    res.status(201).json({
      success: true,
      message: 'Análisis iniciado exitosamente',
      data: newAnalysis
    });
  } catch (error) {
    console.error('Error starting AI analysis:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/ai/notifications - Obtener notificaciones IA
router.get('/notifications', async (req, res) => {
  try {
    const { type, priority, isRead, userId, limit = 20, offset = 0 } = req.query;
    
    let filteredNotifications = [...mockAINotifications];
    
    // Aplicar filtros
    if (type) {
      filteredNotifications = filteredNotifications.filter(notif => notif.type === type);
    }
    
    if (priority) {
      filteredNotifications = filteredNotifications.filter(notif => notif.priority === priority);
    }
    
    if (isRead !== undefined) {
      const readFilter = isRead === 'true';
      filteredNotifications = filteredNotifications.filter(notif => notif.isRead === readFilter);
    }
    
    if (userId) {
      filteredNotifications = filteredNotifications.filter(notif => notif.userId === userId);
    }
    
    // Ordenar por fecha de creación (más recientes primero)
    filteredNotifications.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Paginación
    const startIndex = parseInt(offset);
    const endIndex = startIndex + parseInt(limit);
    const paginatedNotifications = filteredNotifications.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: paginatedNotifications,
      total: filteredNotifications.length,
      unreadCount: filteredNotifications.filter(n => !n.isRead).length,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: endIndex < filteredNotifications.length
      }
    });
  } catch (error) {
    console.error('Error fetching AI notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/ai/status - Estado del sistema IA
router.get('/status', async (req, res) => {
  try {
    const stats = {
      analysisStats: {
        total: mockAnalysisResults.length,
        pending: mockAnalysisResults.filter(r => r.status === 'pending').length,
        processing: mockAnalysisResults.filter(r => r.status === 'processing').length,
        completed: mockAnalysisResults.filter(r => r.status === 'completed').length,
        failed: mockAnalysisResults.filter(r => r.status === 'failed').length
      },
      notificationStats: {
        total: mockAINotifications.length,
        unread: mockAINotifications.filter(n => !n.isRead).length,
        byPriority: {
          critical: mockAINotifications.filter(n => n.priority === 'critical').length,
          high: mockAINotifications.filter(n => n.priority === 'high').length,
          medium: mockAINotifications.filter(n => n.priority === 'medium').length,
          low: mockAINotifications.filter(n => n.priority === 'low').length
        }
      },
      systemStatus: {
        aiServiceOnline: true,
        lastAnalysis: mockAnalysisResults.length > 0 ? 
          Math.max(...mockAnalysisResults.map(r => new Date(r.createdAt).getTime())) : null,
        averageProcessingTime: mockAnalysisResults
          .filter(r => r.processingTime)
          .reduce((acc, r) => acc + r.processingTime, 0) / 
          mockAnalysisResults.filter(r => r.processingTime).length || 0
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching AI status:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

module.exports = router;
const express = require('express');
const router = express.Router();

// Datos de ejemplo para alertas inteligentes
const mockSmartAlerts = [
  {
    id: '1',
    type: 'weather',
    severity: 'high',
    title: 'Alerta de Lluvia Intensa',
    message: 'Se pronostican lluvias intensas en las próximas 24 horas. Considere proteger los cultivos.',
    farmId: 'farm_1',
    isActive: true,
    createdAt: new Date(),
    metadata: {
      precipitation: '45mm',
      windSpeed: '25km/h',
      duration: '6 horas'
    }
  },
  {
    id: '2',
    type: 'pest',
    severity: 'critical',
    title: 'Detección de Broca del Café',
    message: 'Se ha detectado presencia de broca del café en el lote 3. Acción inmediata requerida.',
    farmId: 'farm_1',
    lotId: 'lot_3',
    isActive: true,
    createdAt: new Date(),
    metadata: {
      infestationLevel: 'high',
      affectedArea: '2.5 hectáreas',
      recommendedAction: 'Aplicar tratamiento específico'
    }
  },
  {
    id: '3',
    type: 'irrigation',
    severity: 'medium',
    title: 'Nivel de Humedad Bajo',
    message: 'Los sensores indican niveles de humedad por debajo del óptimo en el lote 1.',
    farmId: 'farm_1',
    lotId: 'lot_1',
    isActive: true,
    createdAt: new Date(),
    metadata: {
      currentHumidity: '35%',
      optimalRange: '45-65%',
      lastIrrigation: '3 días'
    }
  }
];

// GET /api/alerts/smart - Obtener alertas inteligentes
router.get('/smart', async (req, res) => {
  try {
    const { type, severity, farmId, isActive } = req.query;

    let filteredAlerts = [...mockSmartAlerts];

    // Aplicar filtros
    if (type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }

    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }

    if (farmId) {
      filteredAlerts = filteredAlerts.filter(alert => alert.farmId === farmId);
    }

    if (isActive !== undefined) {
      const activeFilter = isActive === 'true';
      filteredAlerts = filteredAlerts.filter(alert => alert.isActive === activeFilter);
    }

    res.json({
      success: true,
      data: filteredAlerts,
      total: filteredAlerts.length,
      filters: { type, severity, farmId, isActive }
    });
  } catch (error) {
    console.error('Error fetching smart alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// POST /api/alerts/smart - Crear nueva alerta
router.post('/smart', async (req, res) => {
  try {
    const { type, severity, title, message, farmId, lotId, metadata } = req.body;

    if (!type || !severity || !title || !message) {
      return res.status(400).json({
        success: false,
        message: 'Tipo, severidad, título y mensaje son requeridos'
      });
    }

    const newAlert = {
      id: `alert_${Date.now()}`,
      type,
      severity,
      title,
      message,
      farmId,
      lotId,
      isActive: true,
      createdAt: new Date(),
      metadata: metadata || {}
    };

    mockSmartAlerts.push(newAlert);

    res.status(201).json({
      success: true,
      message: 'Alerta creada exitosamente',
      data: newAlert
    });
  } catch (error) {
    console.error('Error creating smart alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// PUT /api/alerts/smart/:id/acknowledge - Marcar alerta como reconocida
router.put('/smart/:id/acknowledge', async (req, res) => {
  try {
    const { id } = req.params;

    const alertIndex = mockSmartAlerts.findIndex(alert => alert.id === id);

    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Alerta no encontrada'
      });
    }

    mockSmartAlerts[alertIndex].acknowledgedAt = new Date();
    mockSmartAlerts[alertIndex].isActive = false;

    res.json({
      success: true,
      message: 'Alerta marcada como reconocida',
      data: mockSmartAlerts[alertIndex]
    });
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/alerts/stats - Estadísticas de alertas
router.get('/stats', async (req, res) => {
  try {
    const stats = {
      total: mockSmartAlerts.length,
      active: mockSmartAlerts.filter(alert => alert.isActive).length,
      acknowledged: mockSmartAlerts.filter(alert => alert.acknowledgedAt).length,
      bySeverity: {
        critical: mockSmartAlerts.filter(alert => alert.severity === 'critical').length,
        high: mockSmartAlerts.filter(alert => alert.severity === 'high').length,
        medium: mockSmartAlerts.filter(alert => alert.severity === 'medium').length,
        low: mockSmartAlerts.filter(alert => alert.severity === 'low').length
      },
      byType: {
        weather: mockSmartAlerts.filter(alert => alert.type === 'weather').length,
        pest: mockSmartAlerts.filter(alert => alert.type === 'pest').length,
        disease: mockSmartAlerts.filter(alert => alert.type === 'disease').length,
        irrigation: mockSmartAlerts.filter(alert => alert.type === 'irrigation').length,
        harvest: mockSmartAlerts.filter(alert => alert.type === 'harvest').length,
        market: mockSmartAlerts.filter(alert => alert.type === 'market').length
      }
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error fetching alert stats:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// GET /api/alerts/settings - Obtener configuración
router.get('/settings', async (req, res) => {
  try {
    // Mock settings
    res.json({
      thresholdAlerts: true,
      weatherAlerts: true,
      monitoringReminders: true,
      treatmentReminders: true,
      resistanceWarnings: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      alertFrequency: 'IMMEDIATE',
      quietHours: {
        enabled: false,
        start: '22:00',
        end: '06:00'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/alerts/settings - Actualizar configuración
router.put('/settings', async (req, res) => {
  try {
    // Mock success
    res.json({ success: true, message: 'Configuración actualizada' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/alerts/:id/read - Marcar como leída
router.put('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = mockSmartAlerts.find(a => a.id === id);
    if (alert) alert.isRead = true;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/alerts/:id/dismiss - Descartar alerta
router.put('/:id/dismiss', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = mockSmartAlerts.find(a => a.id === id);
    if (alert) alert.isActive = false;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/alerts/:id/action - Tomar acción
router.post('/:id/action', async (req, res) => {
  try {
    const { id } = req.params;
    const alert = mockSmartAlerts.find(a => a.id === id);
    if (alert) alert.actionTaken = true;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
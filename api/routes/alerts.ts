import express from 'express';
import { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Interfaz para alertas inteligentes
interface SmartAlert {
  id: string;
  type: 'weather' | 'pest' | 'disease' | 'irrigation' | 'harvest' | 'market';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  farmId?: string;
  lotId?: string;
  isActive: boolean;
  createdAt: Date;
  acknowledgedAt?: Date;
  expiresAt?: Date;
  metadata?: Record<string, any>;
}

// Interfaz para configuración de alertas
interface AlertSettings {
  userId: string;
  thresholdAlerts: boolean;
  weatherAlerts: boolean;
  monitoringReminders: boolean;
  treatmentReminders: boolean;
  resistanceWarnings: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  alertFrequency: 'IMMEDIATE' | 'HOURLY' | 'DAILY';
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

// Datos de ejemplo para alertas inteligentes
const mockSmartAlerts: SmartAlert[] = [
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

// Configuración de alertas por defecto
const defaultAlertSettings: Omit<AlertSettings, 'userId'> = {
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
};

// GET /api/alerts/smart - Obtener alertas inteligentes
router.get('/smart', async (req: Request, res: Response) => {
  try {
    const { farmId, type, severity, active } = req.query;
    
    let filteredAlerts = [...mockSmartAlerts];
    
    // Filtrar por finca
    if (farmId) {
      filteredAlerts = filteredAlerts.filter(alert => alert.farmId === farmId);
    }
    
    // Filtrar por tipo
    if (type) {
      filteredAlerts = filteredAlerts.filter(alert => alert.type === type);
    }
    
    // Filtrar por severidad
    if (severity) {
      filteredAlerts = filteredAlerts.filter(alert => alert.severity === severity);
    }
    
    // Filtrar por estado activo
    if (active !== undefined) {
      const isActive = active === 'true';
      filteredAlerts = filteredAlerts.filter(alert => alert.isActive === isActive);
    }
    
    res.json({
      success: true,
      data: filteredAlerts,
      total: filteredAlerts.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error obteniendo alertas inteligentes:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudieron obtener las alertas inteligentes'
    });
  }
});

// POST /api/alerts/smart - Crear nueva alerta inteligente
router.post('/smart', async (req: Request, res: Response) => {
  try {
    const alertData = req.body;
    
    const newAlert: SmartAlert = {
      id: `alert_${Date.now()}`,
      type: alertData.type,
      severity: alertData.severity,
      title: alertData.title,
      message: alertData.message,
      farmId: alertData.farmId,
      lotId: alertData.lotId,
      isActive: true,
      createdAt: new Date(),
      metadata: alertData.metadata || {}
    };
    
    mockSmartAlerts.push(newAlert);
    
    res.status(201).json({
      success: true,
      data: newAlert,
      message: 'Alerta creada exitosamente'
    });
  } catch (error) {
    console.error('Error creando alerta:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor',
      message: 'No se pudo crear la alerta'
    });
  }
});

// PUT /api/alerts/smart/:id/acknowledge - Reconocer alerta
router.put('/smart/:id/acknowledge', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const alertIndex = mockSmartAlerts.findIndex(alert => alert.id === id);
    if (alertIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Alerta no encontrada'
      });
    }
    
    mockSmartAlerts[alertIndex].acknowledgedAt = new Date();
    
    res.json({
      success: true,
      data: mockSmartAlerts[alertIndex],
      message: 'Alerta reconocida exitosamente'
    });
  } catch (error) {
    console.error('Error reconociendo alerta:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/alerts/settings - Obtener configuración de alertas
router.get('/settings', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'default_user';
    
    // En una implementación real, esto vendría de la base de datos
    const userSettings: AlertSettings = {
      userId,
      ...defaultAlertSettings
    };
    
    res.json({
      success: true,
      data: userSettings
    });
  } catch (error) {
    console.error('Error obteniendo configuración de alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// PUT /api/alerts/settings - Actualizar configuración de alertas
router.put('/settings', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id || 'default_user';
    const settingsData = req.body;
    
    // En una implementación real, esto se guardaría en la base de datos
    const updatedSettings: AlertSettings = {
      userId,
      ...settingsData
    };
    
    res.json({
      success: true,
      data: updatedSettings,
      message: 'Configuración de alertas actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando configuración de alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// GET /api/alerts/stats - Estadísticas de alertas
router.get('/stats', async (req: Request, res: Response) => {
  try {
    const stats = {
      total: mockSmartAlerts.length,
      active: mockSmartAlerts.filter(a => a.isActive).length,
      acknowledged: mockSmartAlerts.filter(a => a.acknowledgedAt).length,
      bySeverity: {
        critical: mockSmartAlerts.filter(a => a.severity === 'critical').length,
        high: mockSmartAlerts.filter(a => a.severity === 'high').length,
        medium: mockSmartAlerts.filter(a => a.severity === 'medium').length,
        low: mockSmartAlerts.filter(a => a.severity === 'low').length
      },
      byType: {
        weather: mockSmartAlerts.filter(a => a.type === 'weather').length,
        pest: mockSmartAlerts.filter(a => a.type === 'pest').length,
        disease: mockSmartAlerts.filter(a => a.type === 'disease').length,
        irrigation: mockSmartAlerts.filter(a => a.type === 'irrigation').length,
        harvest: mockSmartAlerts.filter(a => a.type === 'harvest').length,
        market: mockSmartAlerts.filter(a => a.type === 'market').length
      }
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error obteniendo estadísticas de alertas:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

export default router;
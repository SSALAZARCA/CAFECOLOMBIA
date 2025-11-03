import express from 'express';
import { adminAuth } from '../../middleware/adminAuth.js';
import { body, validationResult } from 'express-validator';
import { pool } from '../../lib/database.js';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import SystemConfigService from '../../services/admin/SystemConfigService.js';

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(adminAuth);

interface SystemSettings {
  id: number;
  category: string;
  key: string;
  value: string;
  description?: string;
  is_encrypted: boolean;
  created_at: string;
  updated_at: string;
}

// GET /admin/settings - Obtener todas las configuraciones
router.get('/', async (req, res) => {
  try {
    const settings = await SystemConfigService.getAllSettings();
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /admin/settings/:category - Obtener configuraciones por categoría
router.get('/:category', async (req, res) => {
  try {
    const { category } = req.params;
    
    const settings = await SystemConfigService.getSettingsByCategory(category);
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('Error obteniendo configuraciones por categoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /admin/settings - Guardar configuraciones
router.post('/', [
  body('settings').isObject().withMessage('Las configuraciones deben ser un objeto'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { settings } = req.body;
    
    // Convertir el objeto de configuraciones a array
    const settingsArray = [];
    for (const [category, categorySettings] of Object.entries(settings)) {
      for (const [key, settingData] of Object.entries(categorySettings as Record<string, any>)) {
        settingsArray.push({
          category,
          key,
          value: settingData.value,
          description: settingData.description,
          is_encrypted: settingData.is_encrypted || false
        });
      }
    }

    const success = await SystemConfigService.saveSettings(settingsArray);
    
    if (success) {
      res.json({
        success: true,
        message: 'Configuraciones guardadas exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error guardando configuraciones'
      });
    }
  } catch (error) {
    console.error('Error guardando configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /admin/settings/test-email - Probar configuración de email
router.post('/test-email', [
  body('to').isEmail().withMessage('Email de destino inválido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Email de destino inválido',
        errors: errors.array()
      });
    }

    const result = await SystemConfigService.testEmailConfiguration();
    
    res.json({
      success: result.status === 'success',
      message: result.message,
      details: result.details
    });
  } catch (error) {
    console.error('Error testing email:', error);
    res.status(500).json({
      success: false,
      message: 'Error al probar la configuración de email'
    });
  }
});

// POST /admin/settings/test-payment - Probar configuración de Wompi
router.post('/test-payment', async (req, res) => {
  try {
    const result = await SystemConfigService.testWompiConfiguration();
    
    res.json({
      success: result.status === 'success',
      message: result.message,
      details: result.details
    });
  } catch (error) {
    console.error('Error testing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Error al probar la configuración de pagos'
    });
  }
});

// POST /admin/settings/backup - Crear backup de configuraciones
router.post('/backup', async (req, res) => {
  try {
    const result = await SystemConfigService.createBackup();
    
    if (result.success) {
      res.json({
        success: true,
        message: 'Backup creado exitosamente',
        filename: result.filename
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.error || 'Error creando backup'
      });
    }
  } catch (error) {
    console.error('Error creando backup:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /admin/settings/restore - Restaurar configuraciones desde backup
router.post('/restore', [
  body('backup').isObject().withMessage('El backup debe ser un objeto válido'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Backup inválido',
        errors: errors.array()
      });
    }

    const { backup } = req.body;
    const connection = await pool.getConnection();
    
    try {
      await connection.beginTransaction();

      // Limpiar configuraciones existentes
      await connection.execute('DELETE FROM system_settings');

      // Restaurar configuraciones del backup
      for (const setting of backup.settings) {
        await connection.execute(
          'INSERT INTO system_settings (category, key, value, description, is_encrypted, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [
            setting.category,
            setting.key,
            setting.value,
            setting.description,
            setting.is_encrypted,
            setting.created_at,
            setting.updated_at
          ]
        );
      }

      await connection.commit();
      
      res.json({
        success: true,
        message: 'Configuraciones restauradas exitosamente'
      });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Error restoring settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al restaurar las configuraciones'
    });
  }
});

// POST /admin/settings/reset - Resetear configuraciones a valores por defecto
router.post('/reset', async (req, res) => {
  try {
    const { category } = req.body;
    
    const success = await SystemConfigService.resetToDefaults(category);
    
    if (success) {
      res.json({
        success: true,
        message: category 
          ? `Configuraciones de ${category} reseteadas exitosamente`
          : 'Todas las configuraciones reseteadas exitosamente'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Error reseteando configuraciones'
      });
    }
  } catch (error) {
    console.error('Error reseteando configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;
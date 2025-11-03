const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const router = express.Router();

// Configuración de la base de datos (reutilizar del servidor principal)
const dbConfig = {
  host: process.env.DB_HOST || 'srv1196.hstgr.io',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'u689528678_SSALAZARCA',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA',
  charset: 'utf8mb4',
  timezone: '+00:00',
  ssl: {
    rejectUnauthorized: false
  }
};

// Middleware de autenticación para admin
const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7);
    
    // Verificar token simple por ahora
    if (token.startsWith('admin-token-')) {
      req.admin = { id: 1, email: 'admin@cafecolombia.com', role: 'admin' };
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
  } catch (error) {
    console.error('Error en autenticación admin:', error);
    res.status(401).json({
      success: false,
      message: 'Error de autenticación'
    });
  }
};

// GET /admin/settings - Obtener todas las configuraciones
router.get('/settings', authenticateAdmin, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [settings] = await connection.execute(`
        SELECT 
          id,
          category,
          setting_key,
          setting_value,
          description,
          data_type,
          is_public,
          updated_at
        FROM system_settings 
        ORDER BY category, setting_key
      `);

      // Agrupar configuraciones por categoría
      const groupedSettings = settings.reduce((acc, setting) => {
        if (!acc[setting.category]) {
          acc[setting.category] = {};
        }
        
        // Parsear valor según el tipo de dato
        let parsedValue = setting.setting_value;
        try {
          if (setting.data_type === 'json') {
            parsedValue = JSON.parse(setting.setting_value);
          } else if (setting.data_type === 'boolean') {
            parsedValue = setting.setting_value === 'true';
          } else if (setting.data_type === 'number') {
            parsedValue = parseFloat(setting.setting_value);
          }
        } catch (e) {
          // Mantener valor original si no se puede parsear
        }

        acc[setting.category][setting.setting_key] = {
          value: parsedValue,
          description: setting.description,
          data_type: setting.data_type,
          is_public: setting.is_public,
          updated_at: setting.updated_at
        };
        
        return acc;
      }, {});

      await connection.end();

      res.json({
        success: true,
        data: groupedSettings
      });

    } catch (dbError) {
      await connection.end();
      throw dbError;
    }

  } catch (error) {
    console.error('Error obteniendo configuraciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /admin/settings/payment - Obtener configuraciones de pago específicamente
router.get('/settings/payment', authenticateAdmin, async (req, res) => {
  try {
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      const [settings] = await connection.execute(`
        SELECT 
          setting_key,
          setting_value,
          description,
          data_type,
          updated_at
        FROM system_settings 
        WHERE category = 'payment'
        ORDER BY setting_key
      `);

      // Convertir a objeto con claves como propiedades
      const paymentSettings = {};
      settings.forEach(setting => {
        let parsedValue = setting.setting_value;
        try {
          if (setting.data_type === 'json') {
            parsedValue = JSON.parse(setting.setting_value);
          } else if (setting.data_type === 'boolean') {
            parsedValue = setting.setting_value === 'true';
          } else if (setting.data_type === 'number') {
            parsedValue = parseFloat(setting.setting_value);
          }
        } catch (e) {
          // Mantener valor original si no se puede parsear
        }

        paymentSettings[setting.setting_key] = parsedValue;
      });

      await connection.end();

      res.json({
        success: true,
        data: paymentSettings
      });

    } catch (dbError) {
      await connection.end();
      throw dbError;
    }

  } catch (error) {
    console.error('Error obteniendo configuraciones de pago:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router;
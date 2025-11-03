const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuración de la base de datos
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

async function createSystemSettingsTable() {
  let connection;
  
  try {
    console.log('🔌 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado exitosamente');

    // Verificar si la tabla existe
    console.log('🔍 Verificando si la tabla system_settings existe...');
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'system_settings'"
    );

    if (tables.length === 0) {
      console.log('📝 Creando tabla system_settings...');
      
      // Crear la tabla
      await connection.execute(`
        CREATE TABLE system_settings (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category VARCHAR(50) NOT NULL COMMENT 'Categoría de la configuración (email, payment, security, etc.)',
          setting_key VARCHAR(100) NOT NULL COMMENT 'Clave de la configuración',
          setting_value TEXT COMMENT 'Valor de la configuración',
          description TEXT COMMENT 'Descripción de la configuración',
          data_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
          is_public BOOLEAN DEFAULT FALSE COMMENT 'Indica si la configuración es pública',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          
          UNIQUE KEY unique_category_key (category, setting_key),
          INDEX idx_category (category),
          INDEX idx_setting_key (setting_key)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);

      console.log('✅ Tabla system_settings creada exitosamente');

      // Insertar configuraciones por defecto para Wompi
      console.log('📝 Insertando configuraciones por defecto...');
      
      const defaultSettings = [
        // Configuraciones de pago Wompi
        ['payment', 'wompi_public_key', '', 'Clave pública de Wompi', 'string', false],
        ['payment', 'wompi_private_key', '', 'Clave privada de Wompi', 'string', false],
        ['payment', 'wompi_environment', 'test', 'Entorno de Wompi (test/production)', 'string', false],
        ['payment', 'wompi_webhook_secret', '', 'Secreto del webhook de Wompi', 'string', false],
        ['payment', 'wompi_currency', 'COP', 'Moneda por defecto', 'string', true],
        ['payment', 'wompi_tax_rate', '19', 'Tasa de impuesto (%)', 'number', true]
      ];

      for (const [category, key, value, description, dataType, isPublic] of defaultSettings) {
        await connection.execute(`
          INSERT INTO system_settings (category, setting_key, setting_value, description, data_type, is_public)
          VALUES (?, ?, ?, ?, ?, ?)
        `, [category, key, value, description, dataType, isPublic]);
      }

      console.log('✅ Configuraciones por defecto insertadas');
    } else {
      console.log('✅ La tabla system_settings ya existe');
    }

    // Verificar configuraciones de Wompi
    console.log('🔍 Verificando configuraciones de Wompi...');
    const [wompiSettings] = await connection.execute(`
      SELECT setting_key, setting_value 
      FROM system_settings 
      WHERE category = 'payment' AND setting_key LIKE 'wompi_%'
    `);

    console.log('📋 Configuraciones de Wompi encontradas:');
    wompiSettings.forEach(setting => {
      console.log(`   ${setting.setting_key}: ${setting.setting_value || '(vacío)'}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
createSystemSettingsTable()
  .then(() => {
    console.log('🎉 Script completado exitosamente');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Error ejecutando script:', error);
    process.exit(1);
  });
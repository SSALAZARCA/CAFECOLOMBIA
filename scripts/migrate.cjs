#!/usr/bin/env node

/**
 * 🗄️ SCRIPT DE MIGRACIÓN DE BASE DE DATOS - CAFÉ COLOMBIA APP
 * Este script ejecuta las migraciones necesarias para la base de datos
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// Configuración de colores para consola
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

function log(message, color = colors.green) {
    const timestamp = new Date().toISOString();
    console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
}

function error(message) {
    log(`❌ ERROR: ${message}`, colors.red);
}

function warning(message) {
    log(`⚠️  WARNING: ${message}`, colors.yellow);
}

function info(message) {
    log(`ℹ️  INFO: ${message}`, colors.blue);
}

function success(message) {
    log(`✅ SUCCESS: ${message}`, colors.green);
}

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cafe_colombia_app',
    multipleStatements: true
};

// SQL para crear las tablas principales
const createTablesSQL = `
-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user', 'manager') DEFAULT 'user',
    phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de fincas
CREATE TABLE IF NOT EXISTS fincas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    area DECIMAL(10,2),
    altitude DECIMAL(8,2),
    coordinates JSON,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de lotes
CREATE TABLE IF NOT EXISTS lotes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    finca_id INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    area DECIMAL(10,2),
    variety VARCHAR(100),
    planting_date DATE,
    trees_count INT,
    status ENUM('active', 'inactive', 'renovation') DEFAULT 'active',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE,
    INDEX idx_finca_id (finca_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de plagas
CREATE TABLE IF NOT EXISTS plagas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    scientific_name VARCHAR(255),
    description TEXT,
    symptoms TEXT,
    treatment TEXT,
    prevention TEXT,
    severity_level ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_severity (severity_level)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de registros MIP
CREATE TABLE IF NOT EXISTS mip_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lote_id INT NOT NULL,
    plaga_id INT,
    date DATE NOT NULL,
    severity ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
    affected_area DECIMAL(10,2),
    treatment_applied TEXT,
    observations TEXT,
    images JSON,
    weather_conditions JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE CASCADE,
    FOREIGN KEY (plaga_id) REFERENCES plagas(id) ON DELETE SET NULL,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_lote_id (lote_id),
    INDEX idx_date (date),
    INDEX idx_severity (severity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de alertas IA
CREATE TABLE IF NOT EXISTS ai_alerts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    lote_id INT NOT NULL,
    type ENUM('pest', 'disease', 'weather', 'harvest', 'maintenance') NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity ENUM('info', 'warning', 'critical') DEFAULT 'info',
    confidence DECIMAL(5,2),
    data JSON,
    is_read BOOLEAN DEFAULT false,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP NULL,
    resolved_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lote_id) REFERENCES lotes(id) ON DELETE CASCADE,
    FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_lote_id (lote_id),
    INDEX idx_type (type),
    INDEX idx_severity (severity),
    INDEX idx_read (is_read),
    INDEX idx_resolved (is_resolved)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de precios de mercado
CREATE TABLE IF NOT EXISTS market_prices (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    quality VARCHAR(100),
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'COP',
    unit VARCHAR(20) DEFAULT 'kg',
    market VARCHAR(255),
    location VARCHAR(255),
    date DATE NOT NULL,
    source VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_product (product),
    INDEX idx_date (date),
    INDEX idx_market (market)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de insumos
CREATE TABLE IF NOT EXISTS insumos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category ENUM('fertilizer', 'pesticide', 'herbicide', 'fungicide', 'equipment', 'other') NOT NULL,
    brand VARCHAR(255),
    description TEXT,
    unit VARCHAR(20) DEFAULT 'kg',
    current_price DECIMAL(10,2),
    supplier VARCHAR(255),
    safety_info TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de inventario de insumos
CREATE TABLE IF NOT EXISTS inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    finca_id INT NOT NULL,
    insumo_id INT NOT NULL,
    quantity DECIMAL(10,2) NOT NULL DEFAULT 0,
    min_stock DECIMAL(10,2) DEFAULT 0,
    max_stock DECIMAL(10,2),
    last_purchase_date DATE,
    last_purchase_price DECIMAL(10,2),
    expiry_date DATE,
    location VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (finca_id) REFERENCES fincas(id) ON DELETE CASCADE,
    FOREIGN KEY (insumo_id) REFERENCES insumos(id) ON DELETE CASCADE,
    UNIQUE KEY unique_finca_insumo (finca_id, insumo_id),
    INDEX idx_quantity (quantity),
    INDEX idx_expiry (expiry_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de configuración del sistema
CREATE TABLE IF NOT EXISTS system_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    key_name VARCHAR(255) UNIQUE NOT NULL,
    value TEXT,
    description TEXT,
    type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_key (key_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de sesiones
CREATE TABLE IF NOT EXISTS sessions (
    session_id VARCHAR(128) PRIMARY KEY,
    expires INT UNSIGNED NOT NULL,
    data MEDIUMTEXT,
    INDEX idx_expires (expires)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

// Datos iniciales
const insertInitialDataSQL = `
-- Insertar plagas comunes del café
INSERT IGNORE INTO plagas (name, scientific_name, description, symptoms, treatment, prevention, severity_level) VALUES
('Broca del Café', 'Hypothenemus hampei', 'Pequeño escarabajo que perfora los granos de café', 'Perforaciones en los granos, caída prematura de frutos', 'Aplicación de Beauveria bassiana, recolección sanitaria', 'Manejo integrado, recolección oportuna', 'high'),
('Roya del Café', 'Hemileia vastatrix', 'Hongo que afecta las hojas del cafeto', 'Manchas amarillas en el envés de las hojas, defoliación', 'Fungicidas cúpricos, variedades resistentes', 'Manejo de sombra, nutrición balanceada', 'critical'),
('Minador de la Hoja', 'Leucoptera coffeella', 'Larva que mina las hojas del café', 'Galerías o minas en las hojas, amarillamiento', 'Control biológico con parasitoides', 'Manejo de malezas, control de hormigas', 'medium'),
('Cochinilla Harinosa', 'Planococcus citri', 'Insecto chupador que forma colonias', 'Presencia de melaza, fumagina, debilitamiento', 'Aceites minerales, control biológico', 'Manejo de hormigas, podas sanitarias', 'medium');

-- Insertar insumos básicos
INSERT IGNORE INTO insumos (name, category, description, unit, current_price) VALUES
('Urea', 'fertilizer', 'Fertilizante nitrogenado 46%', 'kg', 2500),
('DAP', 'fertilizer', 'Fosfato diamónico 18-46-0', 'kg', 3200),
('KCl', 'fertilizer', 'Cloruro de potasio 60%', 'kg', 2800),
('Cal Dolomítica', 'fertilizer', 'Corrector de acidez del suelo', 'kg', 800),
('Beauveria bassiana', 'pesticide', 'Hongo entomopatógeno para control de broca', 'kg', 45000),
('Cobre', 'fungicide', 'Fungicida cúprico para roya', 'kg', 8500),
('Glifosato', 'herbicide', 'Herbicida sistémico no selectivo', 'L', 15000);

-- Configuraciones del sistema
INSERT IGNORE INTO system_settings (key_name, value, description, type) VALUES
('app_name', 'Café Colombia App', 'Nombre de la aplicación', 'string'),
('app_version', '1.0.0', 'Versión actual de la aplicación', 'string'),
('default_currency', 'COP', 'Moneda por defecto', 'string'),
('alert_retention_days', '90', 'Días para mantener alertas', 'number'),
('backup_enabled', 'true', 'Habilitar backups automáticos', 'boolean'),
('max_file_size', '10485760', 'Tamaño máximo de archivo en bytes', 'number'),
('allowed_file_types', '["jpg","jpeg","png","pdf","doc","docx"]', 'Tipos de archivo permitidos', 'json');
`;

async function runMigrations() {
    let connection;
    
    try {
        log('🚀 Iniciando migraciones de base de datos...');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        success('✅ Conexión a la base de datos establecida');
        
        // Verificar si la base de datos existe
        const [databases] = await connection.execute('SHOW DATABASES LIKE ?', [dbConfig.database]);
        if (databases.length === 0) {
            error(`La base de datos '${dbConfig.database}' no existe`);
            process.exit(1);
        }
        
        // Ejecutar creación de tablas
        log('📋 Creando tablas...');
        await connection.execute(createTablesSQL);
        success('✅ Tablas creadas correctamente');
        
        // Insertar datos iniciales
        log('📊 Insertando datos iniciales...');
        await connection.execute(insertInitialDataSQL);
        success('✅ Datos iniciales insertados');
        
        // Verificar tablas creadas
        const [tables] = await connection.execute('SHOW TABLES');
        info(`📋 Tablas en la base de datos: ${tables.length}`);
        tables.forEach(table => {
            info(`   - ${Object.values(table)[0]}`);
        });
        
        success('🎉 Migraciones completadas exitosamente');
        
    } catch (err) {
        error(`Error durante las migraciones: ${err.message}`);
        console.error(err);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            info('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runMigrations();
}

module.exports = { runMigrations };
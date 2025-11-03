#!/usr/bin/env node

/**
 * 👤 SCRIPT PARA CREAR USUARIO ADMINISTRADOR - CAFÉ COLOMBIA APP
 * Este script crea un usuario administrador por defecto
 */

const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
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
    database: process.env.DB_NAME || 'cafe_colombia_app'
};

// Datos del administrador por defecto
const adminData = {
    email: 'admin@cafecolombiaapp.com',
    password: 'CafeAdmin2024!',
    name: 'Administrador del Sistema',
    role: 'admin',
    phone: '+57 300 123 4567',
    address: 'Oficina Principal - Colombia'
};

async function createAdmin() {
    let connection;
    
    try {
        log('👤 Iniciando creación de usuario administrador...');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        success('✅ Conexión a la base de datos establecida');
        
        // Verificar si ya existe un administrador
        const [existingAdmin] = await connection.execute(
            'SELECT id, email FROM users WHERE role = ? OR email = ?',
            ['admin', adminData.email]
        );
        
        if (existingAdmin.length > 0) {
            warning(`⚠️  Ya existe un usuario administrador: ${existingAdmin[0].email}`);
            info('🔄 Actualizando contraseña del administrador existente...');
            
            // Hashear la nueva contraseña
            const hashedPassword = await bcrypt.hash(adminData.password, 12);
            
            // Actualizar el administrador existente
            await connection.execute(
                `UPDATE users SET 
                 password = ?, 
                 name = ?, 
                 phone = ?, 
                 address = ?, 
                 is_active = true, 
                 email_verified = true,
                 updated_at = CURRENT_TIMESTAMP
                 WHERE email = ?`,
                [hashedPassword, adminData.name, adminData.phone, adminData.address, adminData.email]
            );
            
            success('✅ Usuario administrador actualizado correctamente');
        } else {
            info('👤 Creando nuevo usuario administrador...');
            
            // Hashear la contraseña
            const hashedPassword = await bcrypt.hash(adminData.password, 12);
            
            // Crear el usuario administrador
            const [result] = await connection.execute(
                `INSERT INTO users (email, password, name, role, phone, address, is_active, email_verified) 
                 VALUES (?, ?, ?, ?, ?, ?, true, true)`,
                [adminData.email, hashedPassword, adminData.name, adminData.role, adminData.phone, adminData.address]
            );
            
            success(`✅ Usuario administrador creado con ID: ${result.insertId}`);
        }
        
        // Crear finca de ejemplo para el administrador
        log('🏡 Creando finca de ejemplo...');
        
        // Obtener el ID del administrador
        const [admin] = await connection.execute('SELECT id FROM users WHERE email = ?', [adminData.email]);
        const adminId = admin[0].id;
        
        // Verificar si ya existe una finca para este administrador
        const [existingFinca] = await connection.execute(
            'SELECT id FROM fincas WHERE user_id = ?',
            [adminId]
        );
        
        if (existingFinca.length === 0) {
            const fincaData = {
                name: 'Finca Demostrativa',
                location: 'Zona Cafetera, Colombia',
                area: 10.5,
                altitude: 1650,
                coordinates: JSON.stringify({ lat: 4.5709, lng: -75.6173 }),
                description: 'Finca de demostración para el sistema Café Colombia App'
            };
            
            const [fincaResult] = await connection.execute(
                `INSERT INTO fincas (user_id, name, location, area, altitude, coordinates, description) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [adminId, fincaData.name, fincaData.location, fincaData.area, fincaData.altitude, fincaData.coordinates, fincaData.description]
            );
            
            success(`✅ Finca de ejemplo creada con ID: ${fincaResult.insertId}`);
            
            // Crear lote de ejemplo
            const loteData = {
                name: 'Lote Principal',
                area: 5.2,
                variety: 'Caturra',
                planting_date: '2020-03-15',
                trees_count: 2600,
                status: 'active',
                notes: 'Lote principal con variedad Caturra, plantado en 2020'
            };
            
            await connection.execute(
                `INSERT INTO lotes (finca_id, name, area, variety, planting_date, trees_count, status, notes) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [fincaResult.insertId, loteData.name, loteData.area, loteData.variety, loteData.planting_date, loteData.trees_count, loteData.status, loteData.notes]
            );
            
            success('✅ Lote de ejemplo creado');
        } else {
            info('ℹ️  Ya existe una finca para el administrador');
        }
        
        // Mostrar información de acceso
        log('📋 INFORMACIÓN DE ACCESO AL SISTEMA:');
        console.log('');
        console.log('🌐 URL de la aplicación: http://localhost:5173 (desarrollo) / https://tu-dominio.com (producción)');
        console.log('👤 Email: ' + colors.cyan + adminData.email + colors.reset);
        console.log('🔑 Contraseña: ' + colors.cyan + adminData.password + colors.reset);
        console.log('');
        warning('⚠️  IMPORTANTE: Cambia la contraseña después del primer acceso');
        warning('⚠️  SEGURIDAD: No compartas estas credenciales');
        
        success('🎉 Usuario administrador configurado correctamente');
        
    } catch (err) {
        error(`Error al crear el administrador: ${err.message}`);
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
    createAdmin();
}

module.exports = { createAdmin };
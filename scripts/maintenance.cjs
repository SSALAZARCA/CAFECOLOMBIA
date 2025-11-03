#!/usr/bin/env node

/**
 * 🔧 SCRIPT DE MANTENIMIENTO - CAFÉ COLOMBIA APP
 * Este script realiza tareas de mantenimiento automatizado
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
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

// Configuración
const config = {
    db: {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'cafe_colombia_app'
    },
    maintenance: {
        logRetentionDays: 30,
        backupRetentionDays: 7,
        sessionCleanupDays: 7,
        tempFileRetentionHours: 24,
        maxLogFileSize: 100 * 1024 * 1024, // 100MB
        maxBackupSize: 1024 * 1024 * 1024 // 1GB
    }
};

// Función para limpiar logs antiguos
async function cleanupLogs() {
    try {
        log('🧹 Limpiando logs antiguos...');
        
        const logDir = path.join(process.cwd(), 'logs');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - config.maintenance.logRetentionDays);
        
        let deletedFiles = 0;
        let totalSizeFreed = 0;
        
        try {
            const files = await fs.readdir(logDir);
            
            for (const file of files) {
                const filepath = path.join(logDir, file);
                const stats = await fs.stat(filepath);
                
                // Eliminar archivos antiguos o muy grandes
                if (stats.mtime < cutoffDate || stats.size > config.maintenance.maxLogFileSize) {
                    await fs.unlink(filepath);
                    deletedFiles++;
                    totalSizeFreed += stats.size;
                    info(`Eliminado: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                }
            }
            
            success(`Logs limpiados: ${deletedFiles} archivos, ${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB liberados`);
            
        } catch (err) {
            if (err.code === 'ENOENT') {
                info('Directorio de logs no existe, creándolo...');
                await fs.mkdir(logDir, { recursive: true });
            } else {
                throw err;
            }
        }
        
        return { deletedFiles, totalSizeFreed };
        
    } catch (err) {
        error(`Error limpiando logs: ${err.message}`);
        return { deletedFiles: 0, totalSizeFreed: 0 };
    }
}

// Función para limpiar backups antiguos
async function cleanupBackups() {
    try {
        log('🧹 Limpiando backups antiguos...');
        
        const backupDir = path.join(process.cwd(), 'backups');
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - config.maintenance.backupRetentionDays);
        
        let deletedFiles = 0;
        let totalSizeFreed = 0;
        
        try {
            const files = await fs.readdir(backupDir);
            
            for (const file of files) {
                const filepath = path.join(backupDir, file);
                const stats = await fs.stat(filepath);
                
                // Eliminar backups antiguos
                if (stats.mtime < cutoffDate) {
                    await fs.unlink(filepath);
                    deletedFiles++;
                    totalSizeFreed += stats.size;
                    info(`Eliminado: ${file} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
                }
            }
            
            success(`Backups limpiados: ${deletedFiles} archivos, ${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB liberados`);
            
        } catch (err) {
            if (err.code === 'ENOENT') {
                info('Directorio de backups no existe');
            } else {
                throw err;
            }
        }
        
        return { deletedFiles, totalSizeFreed };
        
    } catch (err) {
        error(`Error limpiando backups: ${err.message}`);
        return { deletedFiles: 0, totalSizeFreed: 0 };
    }
}

// Función para limpiar archivos temporales
async function cleanupTempFiles() {
    try {
        log('🧹 Limpiando archivos temporales...');
        
        const tempDirs = [
            path.join(process.cwd(), 'temp'),
            path.join(process.cwd(), 'uploads', 'temp'),
            path.join(process.cwd(), 'api', 'temp')
        ];
        
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - config.maintenance.tempFileRetentionHours);
        
        let deletedFiles = 0;
        let totalSizeFreed = 0;
        
        for (const tempDir of tempDirs) {
            try {
                const files = await fs.readdir(tempDir);
                
                for (const file of files) {
                    const filepath = path.join(tempDir, file);
                    const stats = await fs.stat(filepath);
                    
                    if (stats.mtime < cutoffDate) {
                        await fs.unlink(filepath);
                        deletedFiles++;
                        totalSizeFreed += stats.size;
                        info(`Eliminado: ${filepath}`);
                    }
                }
            } catch (err) {
                if (err.code !== 'ENOENT') {
                    warning(`Error procesando ${tempDir}: ${err.message}`);
                }
            }
        }
        
        success(`Archivos temporales limpiados: ${deletedFiles} archivos, ${(totalSizeFreed / 1024 / 1024).toFixed(2)} MB liberados`);
        
        return { deletedFiles, totalSizeFreed };
        
    } catch (err) {
        error(`Error limpiando archivos temporales: ${err.message}`);
        return { deletedFiles: 0, totalSizeFreed: 0 };
    }
}

// Función para limpiar sesiones expiradas
async function cleanupSessions() {
    let connection;
    try {
        log('🧹 Limpiando sesiones expiradas...');
        
        connection = await mysql.createConnection(config.db);
        
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - config.maintenance.sessionCleanupDays);
        
        const [result] = await connection.execute(
            'DELETE FROM sessions WHERE created_at < ?',
            [cutoffDate]
        );
        
        success(`Sesiones limpiadas: ${result.affectedRows} registros eliminados`);
        
        return { deletedSessions: result.affectedRows };
        
    } catch (err) {
        error(`Error limpiando sesiones: ${err.message}`);
        return { deletedSessions: 0 };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Función para optimizar la base de datos
async function optimizeDatabase() {
    let connection;
    try {
        log('🔧 Optimizando base de datos...');
        
        connection = await mysql.createConnection(config.db);
        
        // Obtener todas las tablas
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(row => Object.values(row)[0]);
        
        let optimizedTables = 0;
        
        for (const tableName of tableNames) {
            try {
                await connection.execute(`OPTIMIZE TABLE ${tableName}`);
                optimizedTables++;
                info(`Tabla optimizada: ${tableName}`);
            } catch (err) {
                warning(`Error optimizando tabla ${tableName}: ${err.message}`);
            }
        }
        
        // Actualizar estadísticas
        try {
            await connection.execute('ANALYZE TABLE ' + tableNames.join(', '));
            info('Estadísticas de tablas actualizadas');
        } catch (err) {
            warning(`Error actualizando estadísticas: ${err.message}`);
        }
        
        success(`Base de datos optimizada: ${optimizedTables} tablas procesadas`);
        
        return { optimizedTables };
        
    } catch (err) {
        error(`Error optimizando base de datos: ${err.message}`);
        return { optimizedTables: 0 };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Función para verificar y reparar permisos de archivos
async function checkFilePermissions() {
    try {
        log('🔧 Verificando permisos de archivos...');
        
        const criticalDirs = [
            'logs',
            'backups',
            'uploads',
            'temp'
        ];
        
        let createdDirs = 0;
        
        for (const dir of criticalDirs) {
            const dirPath = path.join(process.cwd(), dir);
            
            try {
                await fs.access(dirPath);
                info(`Directorio OK: ${dir}`);
            } catch (err) {
                if (err.code === 'ENOENT') {
                    await fs.mkdir(dirPath, { recursive: true });
                    createdDirs++;
                    success(`Directorio creado: ${dir}`);
                } else {
                    warning(`Error verificando ${dir}: ${err.message}`);
                }
            }
        }
        
        return { createdDirs };
        
    } catch (err) {
        error(`Error verificando permisos: ${err.message}`);
        return { createdDirs: 0 };
    }
}

// Función para generar reporte de uso de espacio
async function generateSpaceReport() {
    try {
        log('📊 Generando reporte de uso de espacio...');
        
        const directories = [
            'logs',
            'backups',
            'uploads',
            'node_modules',
            'dist',
            'build'
        ];
        
        const report = {
            timestamp: new Date().toISOString(),
            directories: {}
        };
        
        for (const dir of directories) {
            const dirPath = path.join(process.cwd(), dir);
            
            try {
                const size = await getDirSize(dirPath);
                report.directories[dir] = {
                    size: size,
                    sizeFormatted: formatBytes(size)
                };
                info(`${dir}: ${formatBytes(size)}`);
            } catch (err) {
                report.directories[dir] = {
                    size: 0,
                    sizeFormatted: '0 B',
                    error: err.message
                };
            }
        }
        
        // Guardar reporte
        const reportPath = path.join(process.cwd(), 'logs', `space-report-${Date.now()}.json`);
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        success(`Reporte de espacio guardado: ${reportPath}`);
        
        return report;
        
    } catch (err) {
        error(`Error generando reporte de espacio: ${err.message}`);
        return null;
    }
}

// Función auxiliar para calcular tamaño de directorio
async function getDirSize(dirPath) {
    let totalSize = 0;
    
    try {
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = await fs.stat(itemPath);
            
            if (stats.isDirectory()) {
                totalSize += await getDirSize(itemPath);
            } else {
                totalSize += stats.size;
            }
        }
    } catch (err) {
        // Directorio no existe o no accesible
    }
    
    return totalSize;
}

// Función auxiliar para formatear bytes
function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Función principal de mantenimiento
async function runMaintenance(options = {}) {
    try {
        log('🔧 Iniciando mantenimiento del sistema...');
        
        const results = {
            timestamp: new Date().toISOString(),
            tasks: {}
        };
        
        // Verificar permisos de archivos
        if (options.checkPermissions !== false) {
            results.tasks.permissions = await checkFilePermissions();
        }
        
        // Limpiar logs antiguos
        if (options.cleanLogs !== false) {
            results.tasks.logs = await cleanupLogs();
        }
        
        // Limpiar backups antiguos
        if (options.cleanBackups !== false) {
            results.tasks.backups = await cleanupBackups();
        }
        
        // Limpiar archivos temporales
        if (options.cleanTemp !== false) {
            results.tasks.temp = await cleanupTempFiles();
        }
        
        // Limpiar sesiones expiradas
        if (options.cleanSessions !== false) {
            results.tasks.sessions = await cleanupSessions();
        }
        
        // Optimizar base de datos
        if (options.optimizeDb !== false) {
            results.tasks.database = await optimizeDatabase();
        }
        
        // Generar reporte de espacio
        if (options.spaceReport !== false) {
            results.tasks.spaceReport = await generateSpaceReport();
        }
        
        // Resumen final
        console.log('\n📋 RESUMEN DE MANTENIMIENTO');
        console.log('============================');
        
        let totalFilesDeleted = 0;
        let totalSpaceFreed = 0;
        
        if (results.tasks.logs) {
            totalFilesDeleted += results.tasks.logs.deletedFiles;
            totalSpaceFreed += results.tasks.logs.totalSizeFreed;
        }
        
        if (results.tasks.backups) {
            totalFilesDeleted += results.tasks.backups.deletedFiles;
            totalSpaceFreed += results.tasks.backups.totalSizeFreed;
        }
        
        if (results.tasks.temp) {
            totalFilesDeleted += results.tasks.temp.deletedFiles;
            totalSpaceFreed += results.tasks.temp.totalSizeFreed;
        }
        
        console.log(`📁 Archivos eliminados: ${totalFilesDeleted}`);
        console.log(`💾 Espacio liberado: ${formatBytes(totalSpaceFreed)}`);
        
        if (results.tasks.sessions) {
            console.log(`🗂️  Sesiones limpiadas: ${results.tasks.sessions.deletedSessions}`);
        }
        
        if (results.tasks.database) {
            console.log(`🔧 Tablas optimizadas: ${results.tasks.database.optimizedTables}`);
        }
        
        if (results.tasks.permissions) {
            console.log(`📂 Directorios creados: ${results.tasks.permissions.createdDirs}`);
        }
        
        // Guardar reporte de mantenimiento
        const reportPath = path.join(process.cwd(), 'logs', `maintenance-${Date.now()}.json`);
        try {
            await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
            info(`Reporte de mantenimiento guardado: ${reportPath}`);
        } catch (err) {
            warning(`No se pudo guardar el reporte: ${err.message}`);
        }
        
        success('🎉 Mantenimiento completado exitosamente');
        
        return results;
        
    } catch (err) {
        error(`Error en el mantenimiento: ${err.message}`);
        return {
            success: false,
            error: err.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {};
    
    // Parsear argumentos
    if (args.includes('--no-logs')) options.cleanLogs = false;
    if (args.includes('--no-backups')) options.cleanBackups = false;
    if (args.includes('--no-temp')) options.cleanTemp = false;
    if (args.includes('--no-sessions')) options.cleanSessions = false;
    if (args.includes('--no-db')) options.optimizeDb = false;
    if (args.includes('--no-permissions')) options.checkPermissions = false;
    if (args.includes('--no-report')) options.spaceReport = false;
    
    runMaintenance(options).then(result => {
        process.exit(0);
    });
}

module.exports = { runMaintenance };
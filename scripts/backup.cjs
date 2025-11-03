#!/usr/bin/env node

/**
 * 💾 SCRIPT DE BACKUP AUTOMÁTICO - CAFÉ COLOMBIA APP
 * Este script crea backups de la base de datos y archivos importantes
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
    backup: {
        dir: path.join(process.cwd(), 'backups'),
        retention: parseInt(process.env.BACKUP_RETENTION_DAYS) || 7,
        compress: true
    }
};

async function ensureBackupDir() {
    try {
        await fs.access(config.backup.dir);
    } catch {
        await fs.mkdir(config.backup.dir, { recursive: true });
        info(`📁 Directorio de backup creado: ${config.backup.dir}`);
    }
}

async function createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `database_${timestamp}.sql`;
    const filepath = path.join(config.backup.dir, filename);
    
    try {
        log('🗄️ Creando backup de la base de datos...');
        
        // Comando mysqldump
        const command = `mysqldump -h ${config.db.host} -P ${config.db.port} -u ${config.db.user} -p${config.db.password} ${config.db.database}`;
        
        const { stdout } = await execAsync(command);
        await fs.writeFile(filepath, stdout);
        
        success(`✅ Backup de base de datos creado: ${filename}`);
        
        // Comprimir si está habilitado
        if (config.backup.compress) {
            const gzipCommand = `gzip "${filepath}"`;
            await execAsync(gzipCommand);
            success(`🗜️ Backup comprimido: ${filename}.gz`);
            return `${filepath}.gz`;
        }
        
        return filepath;
    } catch (err) {
        error(`Error creando backup de base de datos: ${err.message}`);
        throw err;
    }
}

async function createFilesBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `files_${timestamp}.tar.gz`;
    const filepath = path.join(config.backup.dir, filename);
    
    try {
        log('📁 Creando backup de archivos...');
        
        // Directorios a respaldar
        const dirsToBackup = [
            'uploads',
            '.env',
            'api/.env',
            'package.json',
            'api/package.json'
        ].filter(async (dir) => {
            try {
                await fs.access(dir);
                return true;
            } catch {
                return false;
            }
        });
        
        if (dirsToBackup.length === 0) {
            warning('⚠️ No se encontraron archivos para respaldar');
            return null;
        }
        
        // Crear archivo tar.gz
        const tarCommand = `tar -czf "${filepath}" ${dirsToBackup.join(' ')}`;
        await execAsync(tarCommand);
        
        success(`✅ Backup de archivos creado: ${filename}`);
        return filepath;
    } catch (err) {
        error(`Error creando backup de archivos: ${err.message}`);
        throw err;
    }
}

async function cleanOldBackups() {
    try {
        log('🧹 Limpiando backups antiguos...');
        
        const files = await fs.readdir(config.backup.dir);
        const backupFiles = files.filter(file => 
            file.startsWith('database_') || file.startsWith('files_')
        );
        
        // Ordenar por fecha de modificación
        const filesWithStats = await Promise.all(
            backupFiles.map(async (file) => {
                const filepath = path.join(config.backup.dir, file);
                const stats = await fs.stat(filepath);
                return { file, filepath, mtime: stats.mtime };
            })
        );
        
        filesWithStats.sort((a, b) => b.mtime - a.mtime);
        
        // Eliminar archivos antiguos
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - config.backup.retention);
        
        let deletedCount = 0;
        for (const { file, filepath, mtime } of filesWithStats) {
            if (mtime < cutoffDate) {
                await fs.unlink(filepath);
                info(`🗑️ Backup eliminado: ${file}`);
                deletedCount++;
            }
        }
        
        if (deletedCount > 0) {
            success(`✅ ${deletedCount} backups antiguos eliminados`);
        } else {
            info('ℹ️ No hay backups antiguos para eliminar');
        }
        
    } catch (err) {
        error(`Error limpiando backups antiguos: ${err.message}`);
    }
}

async function getBackupStats() {
    try {
        const files = await fs.readdir(config.backup.dir);
        const backupFiles = files.filter(file => 
            file.startsWith('database_') || file.startsWith('files_')
        );
        
        let totalSize = 0;
        for (const file of backupFiles) {
            const filepath = path.join(config.backup.dir, file);
            const stats = await fs.stat(filepath);
            totalSize += stats.size;
        }
        
        const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);
        
        info(`📊 Estadísticas de backup:`);
        info(`   - Total de archivos: ${backupFiles.length}`);
        info(`   - Tamaño total: ${sizeInMB} MB`);
        info(`   - Directorio: ${config.backup.dir}`);
        
    } catch (err) {
        warning(`No se pudieron obtener estadísticas: ${err.message}`);
    }
}

async function verifyDatabaseConnection() {
    let connection;
    try {
        connection = await mysql.createConnection(config.db);
        const [rows] = await connection.execute('SELECT 1 as test');
        success('✅ Conexión a la base de datos verificada');
        return true;
    } catch (err) {
        error(`Error conectando a la base de datos: ${err.message}`);
        return false;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

async function runBackup() {
    try {
        log('💾 Iniciando proceso de backup automático...');
        
        // Verificar conexión a la base de datos
        const dbConnected = await verifyDatabaseConnection();
        if (!dbConnected) {
            throw new Error('No se pudo conectar a la base de datos');
        }
        
        // Crear directorio de backup
        await ensureBackupDir();
        
        // Crear backups
        const dbBackup = await createDatabaseBackup();
        const filesBackup = await createFilesBackup();
        
        // Limpiar backups antiguos
        await cleanOldBackups();
        
        // Mostrar estadísticas
        await getBackupStats();
        
        success('🎉 Proceso de backup completado exitosamente');
        
        return {
            success: true,
            dbBackup,
            filesBackup,
            timestamp: new Date().toISOString()
        };
        
    } catch (err) {
        error(`Error en el proceso de backup: ${err.message}`);
        return {
            success: false,
            error: err.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runBackup().then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { runBackup, createDatabaseBackup, createFilesBackup };
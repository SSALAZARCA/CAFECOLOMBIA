#!/usr/bin/env node

/**
 * 📊 SCRIPT DE MONITOREO - CAFÉ COLOMBIA APP
 * Este script monitorea el estado de la aplicación y servicios
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileAsync = promisify(execFile);
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
    api: {
        url: process.env.VITE_API_URL || 'http://localhost:3001',
        timeout: 10000
    },
    thresholds: {
        cpu: 80,
        memory: 85,
        disk: 90,
        responseTime: 2000
    }
};

// Función para verificar la base de datos
async function checkDatabase() {
    let connection;
    try {
        const startTime = Date.now();
        connection = await mysql.createConnection(config.db);
        
        // Verificar conexión
        await connection.execute('SELECT 1');
        
        // Verificar tablas principales
        const [tables] = await connection.execute('SHOW TABLES');
        const tableCount = tables.length;
        
        // Verificar usuarios
        const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const userCount = users[0].count;
        
        const responseTime = Date.now() - startTime;
        
        return {
            status: 'healthy',
            responseTime,
            tableCount,
            userCount,
            details: 'Base de datos funcionando correctamente'
        };
    } catch (err) {
        return {
            status: 'error',
            error: err.message,
            details: 'Error conectando a la base de datos'
        };
    } finally {
        if (connection) {
            await connection.end();
        }
    }
}

// Función para verificar la API
async function checkAPI() {
    try {
        const startTime = Date.now();
        
        // Verificar endpoint de salud
        const response = await fetch(`${config.api.url}/api/health`, {
            method: 'GET',
            timeout: config.api.timeout
        });
        
        const responseTime = Date.now() - startTime;
        
        if (response.ok) {
            const data = await response.json();
            return {
                status: 'healthy',
                responseTime,
                statusCode: response.status,
                details: data.message || 'API funcionando correctamente'
            };
        } else {
            return {
                status: 'warning',
                responseTime,
                statusCode: response.status,
                details: `API respondió con código ${response.status}`
            };
        }
    } catch (err) {
        return {
            status: 'error',
            error: err.message,
            details: 'Error conectando a la API'
        };
    }
}

// Función para verificar el sistema
async function checkSystem() {
    try {
        const results = {};
        
        // Verificar uso de CPU
        try {
            const { stdout: cpuInfo } = await execFileAsync('wmic', ['cpu', 'get', 'loadpercentage', '/value']);
            const cpuMatch = cpuInfo.match(/LoadPercentage=(\d+)/);
            results.cpu = cpuMatch ? parseInt(cpuMatch[1]) : 0;
        } catch {
            results.cpu = 0;
        }
        
        // Verificar uso de memoria
        try {
            const { stdout: memInfo } = await execFileAsync('wmic', ['OS', 'get', 'TotalVisibleMemorySize,FreePhysicalMemory', '/value']);
            const totalMatch = memInfo.match(/TotalVisibleMemorySize=(\d+)/);
            const freeMatch = memInfo.match(/FreePhysicalMemory=(\d+)/);
            
            if (totalMatch && freeMatch) {
                const total = parseInt(totalMatch[1]);
                const free = parseInt(freeMatch[1]);
                const used = total - free;
                results.memory = Math.round((used / total) * 100);
            } else {
                results.memory = 0;
            }
        } catch {
            results.memory = 0;
        }
        
        // Verificar espacio en disco
        try {
            const { stdout: diskInfo } = await execFileAsync('wmic', ['logicaldisk', 'get', 'size,freespace,caption']);
            const lines = diskInfo.split('\n').filter(line => line.includes('C:'));
            if (lines.length > 0) {
                const parts = lines[0].trim().split(/\s+/);
                if (parts.length >= 3) {
                    const free = parseInt(parts[1]);
                    const total = parseInt(parts[2]);
                    const used = total - free;
                    results.disk = Math.round((used / total) * 100);
                } else {
                    results.disk = 0;
                }
            } else {
                results.disk = 0;
            }
        } catch {
            results.disk = 0;
        }
        
        // Verificar procesos de Node.js
        try {
            const { stdout: processInfo } = await execFileAsync('tasklist', ['/fi', 'imagename eq node.exe', '/fo', 'csv']);
            const lines = processInfo.split('\n').filter(line => line.includes('node.exe'));
            results.nodeProcesses = lines.length;
        } catch {
            results.nodeProcesses = 0;
        }
        
        return {
            status: 'healthy',
            ...results,
            details: 'Sistema funcionando correctamente'
        };
    } catch (err) {
        return {
            status: 'error',
            error: err.message,
            details: 'Error obteniendo información del sistema'
        };
    }
}

// Función para verificar PM2 (si está disponible)
async function checkPM2() {
    try {
        const { stdout } = await execFileAsync('pm2', ['jlist']);
        const processes = JSON.parse(stdout);
        
        const cafeProcess = processes.find(p => p.name === 'cafe-colombia-api');
        
        if (cafeProcess) {
            return {
                status: cafeProcess.pm2_env.status === 'online' ? 'healthy' : 'warning',
                processStatus: cafeProcess.pm2_env.status,
                uptime: cafeProcess.pm2_env.pm_uptime,
                restarts: cafeProcess.pm2_env.restart_time,
                memory: cafeProcess.monit.memory,
                cpu: cafeProcess.monit.cpu,
                details: `Proceso PM2 ${cafeProcess.pm2_env.status}`
            };
        } else {
            return {
                status: 'warning',
                details: 'Proceso cafe-colombia-api no encontrado en PM2'
            };
        }
    } catch (err) {
        return {
            status: 'info',
            details: 'PM2 no disponible o no instalado'
        };
    }
}

// Función para verificar archivos de log
async function checkLogs() {
    try {
        const logDir = path.join(process.cwd(), 'logs');
        const results = {
            status: 'healthy',
            files: [],
            totalSize: 0
        };
        
        try {
            const files = await fs.readdir(logDir);
            
            for (const file of files) {
                const filepath = path.join(logDir, file);
                const stats = await fs.stat(filepath);
                
                results.files.push({
                    name: file,
                    size: stats.size,
                    modified: stats.mtime
                });
                
                results.totalSize += stats.size;
            }
            
            results.details = `${files.length} archivos de log encontrados`;
        } catch {
            results.status = 'warning';
            results.details = 'Directorio de logs no encontrado';
        }
        
        return results;
    } catch (err) {
        return {
            status: 'error',
            error: err.message,
            details: 'Error verificando logs'
        };
    }
}

// Función principal de monitoreo
async function runMonitoring() {
    try {
        log('📊 Iniciando monitoreo del sistema...');
        
        const results = {
            timestamp: new Date().toISOString(),
            checks: {}
        };
        
        // Ejecutar todas las verificaciones
        log('🔍 Verificando base de datos...');
        results.checks.database = await checkDatabase();
        
        log('🔍 Verificando API...');
        results.checks.api = await checkAPI();
        
        log('🔍 Verificando sistema...');
        results.checks.system = await checkSystem();
        
        log('🔍 Verificando PM2...');
        results.checks.pm2 = await checkPM2();
        
        log('🔍 Verificando logs...');
        results.checks.logs = await checkLogs();
        
        // Mostrar resultados
        console.log('\n📋 REPORTE DE MONITOREO');
        console.log('========================');
        
        for (const [service, result] of Object.entries(results.checks)) {
            const statusIcon = result.status === 'healthy' ? '✅' : 
                              result.status === 'warning' ? '⚠️' : '❌';
            
            console.log(`\n${statusIcon} ${service.toUpperCase()}`);
            console.log(`   Estado: ${result.status}`);
            console.log(`   Detalles: ${result.details}`);
            
            if (result.responseTime) {
                console.log(`   Tiempo de respuesta: ${result.responseTime}ms`);
            }
            
            if (result.cpu !== undefined) {
                console.log(`   CPU: ${result.cpu}%`);
            }
            
            if (result.memory !== undefined) {
                console.log(`   Memoria: ${result.memory}%`);
            }
            
            if (result.disk !== undefined) {
                console.log(`   Disco: ${result.disk}%`);
            }
            
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        }
        
        // Verificar alertas
        const alerts = [];
        
        if (results.checks.system.cpu > config.thresholds.cpu) {
            alerts.push(`CPU alta: ${results.checks.system.cpu}%`);
        }
        
        if (results.checks.system.memory > config.thresholds.memory) {
            alerts.push(`Memoria alta: ${results.checks.system.memory}%`);
        }
        
        if (results.checks.system.disk > config.thresholds.disk) {
            alerts.push(`Disco lleno: ${results.checks.system.disk}%`);
        }
        
        if (results.checks.api.responseTime > config.thresholds.responseTime) {
            alerts.push(`API lenta: ${results.checks.api.responseTime}ms`);
        }
        
        if (alerts.length > 0) {
            console.log('\n🚨 ALERTAS');
            console.log('==========');
            alerts.forEach(alert => warning(alert));
        } else {
            console.log('\n✅ No hay alertas activas');
        }
        
        // Guardar reporte
        const reportPath = path.join(process.cwd(), 'logs', `monitor-${Date.now()}.json`);
        try {
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
            info(`Reporte guardado en: ${reportPath}`);
        } catch (err) {
            warning(`No se pudo guardar el reporte: ${err.message}`);
        }
        
        success('🎉 Monitoreo completado');
        
        return results;
        
    } catch (err) {
        error(`Error en el monitoreo: ${err.message}`);
        return {
            success: false,
            error: err.message,
            timestamp: new Date().toISOString()
        };
    }
}

// Ejecutar si se llama directamente
if (require.main === module) {
    runMonitoring().then(result => {
        process.exit(0);
    });
}

module.exports = { runMonitoring };
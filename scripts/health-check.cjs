#!/usr/bin/env node

/**
 * 🏥 SCRIPT DE HEALTH CHECK - CAFÉ COLOMBIA APP
 * Este script verifica el estado de salud de todos los servicios
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
// Cargar .env desde api/.env.production si existe; fallback al root .env
(() => {
  try {
    const apiProd = path.join(__dirname, '..', 'api', '.env.production');
    const rootEnv = path.join(__dirname, '..', '.env');
    if (fs.existsSync(apiProd)) {
      require('dotenv').config({ path: apiProd });
    } else if (fs.existsSync(rootEnv)) {
      require('dotenv').config({ path: rootEnv });
    } else {
      require('dotenv').config();
    }
  } catch {
    require('dotenv').config();
  }
})();

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
    redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379
    },
    thresholds: {
        responseTime: 2000,
        cpu: 80,
        memory: 85,
        disk: 90
    }
};

// Función para verificar la conectividad de red
async function checkNetworkConnectivity() {
    try {
        log('🌐 Verificando conectividad de red...');
        
        const tests = [
            { name: 'Google DNS', host: '8.8.8.8' },
            { name: 'Cloudflare DNS', host: '1.1.1.1' }
        ];
        
        const results = [];
        
        for (const test of tests) {
            try {
                const startTime = Date.now();
        await execAsync(`ping -c 1 ${test.host}`, { timeout: 5000 });
                const responseTime = Date.now() - startTime;
                
                results.push({
                    name: test.name,
                    host: test.host,
                    status: 'success',
                    responseTime
                });
            } catch (err) {
                results.push({
                    name: test.name,
                    host: test.host,
                    status: 'failed',
                    error: err.message
                });
            }
        }
        
        const successCount = results.filter(r => r.status === 'success').length;
        
        return {
            status: successCount > 0 ? 'healthy' : 'error',
            tests: results,
            details: `${successCount}/${tests.length} pruebas de conectividad exitosas`
        };
        
    } catch (err) {
        return {
            status: 'error',
            error: err.message,
            details: 'Error verificando conectividad de red'
        };
    }
}

// Función para verificar la base de datos
async function checkDatabase() {
    let connection;
    try {
        log('🗄️  Verificando base de datos...');
        
        const startTime = Date.now();
        connection = await mysql.createConnection(config.db);
        
        // Verificar conexión básica
        await connection.execute('SELECT 1');
        const connectionTime = Date.now() - startTime;
        
        // Verificar tablas principales
        const [tables] = await connection.execute('SHOW TABLES');
        const requiredTables = [
            'users', 'fincas', 'lotes', 'plagas', 'mip_records',
            'ai_alerts', 'market_prices', 'insumos', 'inventory',
            'system_settings', 'sessions'
        ];
        
        const existingTables = tables.map(row => Object.values(row)[0]);
        const missingTables = requiredTables.filter(table => !existingTables.includes(table));
        
        // Verificar datos básicos
        const [userCount] = await connection.execute('SELECT COUNT(*) as count FROM users');
        const [fincaCount] = await connection.execute('SELECT COUNT(*) as count FROM fincas');
        
        // Verificar integridad de datos
        const [orphanedLotes] = await connection.execute(`
            SELECT COUNT(*) as count FROM lotes l 
            LEFT JOIN fincas f ON l.finca_id = f.id 
            WHERE f.id IS NULL
        `);
        
        // Verificar espacio de la base de datos
        const [dbSize] = await connection.execute(`
            SELECT 
                ROUND(SUM(data_length + index_length) / 1024 / 1024, 2) AS size_mb
            FROM information_schema.tables 
            WHERE table_schema = ?
        `, [config.db.database]);
        
        return {
            status: missingTables.length === 0 ? 'healthy' : 'warning',
            connectionTime,
            tableCount: existingTables.length,
            missingTables,
            userCount: userCount[0].count,
            fincaCount: fincaCount[0].count,
            orphanedLotes: orphanedLotes[0].count,
            sizeInMB: dbSize[0].size_mb || 0,
            details: missingTables.length === 0 ? 
                'Base de datos funcionando correctamente' : 
                `Faltan ${missingTables.length} tablas: ${missingTables.join(', ')}`
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
        log('🔌 Verificando API...');
        
        const endpoints = [
            { path: '/api/health', method: 'GET', name: 'Health Check' },
            { path: '/api/auth/status', method: 'GET', name: 'Auth Status' },
            { path: '/api/fincas', method: 'GET', name: 'Fincas List' }
        ];
        
        const results = [];
        
        for (const endpoint of endpoints) {
            try {
                const startTime = Date.now();
                const response = await fetch(`${config.api.url}${endpoint.path}`, {
                    method: endpoint.method,
                    timeout: config.api.timeout,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                
                const responseTime = Date.now() - startTime;
                
                results.push({
                    name: endpoint.name,
                    path: endpoint.path,
                    status: response.ok ? 'success' : 'warning',
                    statusCode: response.status,
                    responseTime
                });
                
            } catch (err) {
                results.push({
                    name: endpoint.name,
                    path: endpoint.path,
                    status: 'error',
                    error: err.message
                });
            }
        }
        
        const successCount = results.filter(r => r.status === 'success').length;
        const avgResponseTime = results
            .filter(r => r.responseTime)
            .reduce((sum, r) => sum + r.responseTime, 0) / results.length || 0;
        
        return {
            status: successCount === endpoints.length ? 'healthy' : 
                   successCount > 0 ? 'warning' : 'error',
            endpoints: results,
            avgResponseTime,
            details: `${successCount}/${endpoints.length} endpoints funcionando`
        };
        
    } catch (err) {
        return {
            status: 'error',
            error: err.message,
            details: 'Error verificando API'
        };
    }
}

// Función para verificar Redis (si está configurado)
async function checkRedis() {
    try {
        log('🔴 Verificando Redis...');
        
        // Verificar si Redis está configurado
        if (!process.env.REDIS_HOST && !process.env.REDIS_URL) {
            return {
                status: 'info',
                details: 'Redis no configurado'
            };
        }
        
        // Intentar conectar usando redis-cli si está disponible
        try {
            const startTime = Date.now();
            await execAsync(`redis-cli -h ${config.redis.host} -p ${config.redis.port} ping`);
            const responseTime = Date.now() - startTime;
            
            // Obtener información del servidor Redis
            const { stdout: info } = await execAsync(`redis-cli -h ${config.redis.host} -p ${config.redis.port} info server`);
            const versionMatch = info.match(/redis_version:([^\r\n]+)/);
            const version = versionMatch ? versionMatch[1] : 'unknown';
            
            return {
                status: 'healthy',
                responseTime,
                version,
                details: 'Redis funcionando correctamente'
            };
            
        } catch (err) {
            return {
                status: 'warning',
                error: err.message,
                details: 'Redis no disponible o no instalado'
            };
        }
        
    } catch (err) {
        return {
            status: 'error',
            error: err.message,
            details: 'Error verificando Redis'
        };
    }
}

// Función para verificar archivos críticos
async function checkCriticalFiles() {
    try {
        log('📁 Verificando archivos críticos...');
        
        const criticalFiles = [
            { path: 'package.json', required: true },
            { path: '.env', required: true },
            { path: 'api/package.json', required: true },
            { path: 'api/.env', required: false },
            { path: 'dist/index.html', required: false },
            { path: 'api/dist/server.js', required: false }
        ];
        
        const results = [];
        
        for (const file of criticalFiles) {
            const filePath = path.join(process.cwd(), file.path);
            
            try {
                const stats = await fs.stat(filePath);
                results.push({
                    path: file.path,
                    status: 'exists',
                    size: stats.size,
                    modified: stats.mtime
                });
            } catch (err) {
                results.push({
                    path: file.path,
                    status: file.required ? 'missing' : 'optional',
                    error: err.code
                });
            }
        }
        
        const missingRequired = results.filter(r => r.status === 'missing');
        
        return {
            status: missingRequired.length === 0 ? 'healthy' : 'error',
            files: results,
            missingRequired: missingRequired.map(f => f.path),
            details: missingRequired.length === 0 ? 
                'Todos los archivos críticos presentes' : 
                `Faltan archivos críticos: ${missingRequired.map(f => f.path).join(', ')}`
        };
        
    } catch (err) {
        return {
            status: 'error',
            error: err.message,
            details: 'Error verificando archivos críticos'
        };
    }
}

// Función para verificar servicios del sistema
async function checkSystemServices() {
    try {
        log('⚙️  Verificando servicios del sistema...');
        
        const services = [];
        
        // Verificar Node.js
        try {
            const { stdout: nodeVersion } = await execAsync('node --version');
            services.push({
                name: 'Node.js',
                status: 'running',
                version: nodeVersion.trim()
            });
        } catch (err) {
            services.push({
                name: 'Node.js',
                status: 'error',
                error: err.message
            });
        }
        
        // Verificar npm
        try {
            const { stdout: npmVersion } = await execAsync('npm --version');
            services.push({
                name: 'npm',
                status: 'running',
                version: npmVersion.trim()
            });
        } catch (err) {
            services.push({
                name: 'npm',
                status: 'error',
                error: err.message
            });
        }
        
        // Verificar PM2 (si está disponible)
        try {
            const { stdout: pm2Version } = await execAsync('pm2 --version');
            services.push({
                name: 'PM2',
                status: 'running',
                version: pm2Version.trim()
            });
        } catch (err) {
            services.push({
                name: 'PM2',
                status: 'not_installed',
                details: 'PM2 no instalado'
            });
        }
        
        // Verificar MySQL (si está disponible)
        try {
            const { stdout: mysqlVersion } = await execAsync('mysql --version');
            services.push({
                name: 'MySQL',
                status: 'running',
                version: mysqlVersion.trim()
            });
        } catch (err) {
            services.push({
                name: 'MySQL',
                status: 'not_available',
                details: 'MySQL CLI no disponible'
            });
        }
        
        const runningServices = services.filter(s => s.status === 'running').length;
        
        return {
            status: 'healthy',
            services,
            runningServices,
            details: `${runningServices} servicios verificados`
        };
        
    } catch (err) {
        return {
            status: 'error',
            error: err.message,
            details: 'Error verificando servicios del sistema'
        };
    }
}

// Función principal de health check
async function runHealthCheck(options = {}) {
    try {
        log('🏥 Iniciando health check del sistema...');
        
        const results = {
            timestamp: new Date().toISOString(),
            overall: 'healthy',
            checks: {}
        };
        
        // Ejecutar todas las verificaciones
        if (options.network !== false) {
            results.checks.network = await checkNetworkConnectivity();
        }
        
        if (options.database !== false) {
            results.checks.database = await checkDatabase();
        }
        
        if (options.api !== false) {
            results.checks.api = await checkAPI();
        }
        
        if (options.redis !== false) {
            results.checks.redis = await checkRedis();
        }
        
        if (options.files !== false) {
            results.checks.files = await checkCriticalFiles();
        }
        
        if (options.services !== false) {
            results.checks.services = await checkSystemServices();
        }
        
        // Determinar estado general
        const statuses = Object.values(results.checks).map(check => check.status);
        if (statuses.includes('error')) {
            results.overall = 'error';
        } else if (statuses.includes('warning')) {
            results.overall = 'warning';
        }
        
        // Mostrar resultados
        console.log('\n🏥 REPORTE DE HEALTH CHECK');
        console.log('==========================');
        
        const overallIcon = results.overall === 'healthy' ? '✅' : 
                           results.overall === 'warning' ? '⚠️' : '❌';
        
        console.log(`\n${overallIcon} ESTADO GENERAL: ${results.overall.toUpperCase()}`);
        
        for (const [service, result] of Object.entries(results.checks)) {
            const statusIcon = result.status === 'healthy' ? '✅' : 
                              result.status === 'warning' ? '⚠️' : 
                              result.status === 'info' ? 'ℹ️' : '❌';
            
            console.log(`\n${statusIcon} ${service.toUpperCase()}`);
            console.log(`   Estado: ${result.status}`);
            console.log(`   Detalles: ${result.details}`);
            
            if (result.responseTime) {
                console.log(`   Tiempo de respuesta: ${result.responseTime}ms`);
            }
            
            if (result.error) {
                console.log(`   Error: ${result.error}`);
            }
        }
        
        // Guardar reporte
        const reportPath = path.join(process.cwd(), 'logs', `health-check-${Date.now()}.json`);
        try {
            await fs.mkdir(path.dirname(reportPath), { recursive: true });
            await fs.writeFile(reportPath, JSON.stringify(results, null, 2));
            info(`Reporte guardado en: ${reportPath}`);
        } catch (err) {
            warning(`No se pudo guardar el reporte: ${err.message}`);
        }
        
        const finalMessage = results.overall === 'healthy' ? 
            '🎉 Sistema funcionando correctamente' :
            results.overall === 'warning' ?
            '⚠️  Sistema funcionando con advertencias' :
            '🚨 Sistema con errores críticos';
        
        log(finalMessage, results.overall === 'healthy' ? colors.green : 
                         results.overall === 'warning' ? colors.yellow : colors.red);
        
        return results;
        
    } catch (err) {
        error(`Error en health check: ${err.message}`);
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
    if (args.includes('--no-network')) options.network = false;
    if (args.includes('--no-database')) options.database = false;
    if (args.includes('--no-api')) options.api = false;
    if (args.includes('--no-redis')) options.redis = false;
    if (args.includes('--no-files')) options.files = false;
    if (args.includes('--no-services')) options.services = false;
    
    runHealthCheck(options).then(result => {
        // Salir con código de error si hay problemas críticos
        const exitCode = result.overall === 'error' ? 1 : 0;
        process.exit(exitCode);
    });
}

module.exports = { runHealthCheck };

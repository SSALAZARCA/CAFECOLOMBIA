const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
<<<<<<< HEAD
const fs = require('fs');

// Cargar variables de entorno (solo desde archivo en desarrollo)
try {
  const isProduction = (process.env.NODE_ENV || 'development') === 'production';
  if (!isProduction) {
    const envPath = path.join(__dirname, '.env');
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
    } else {
      dotenv.config();
    }
  }
} catch (e) {
  console.warn('dotenv load skipped:', e?.message);
=======
const logger = require('./lib/logger'); // Importar el logger
const { errorHandler, asyncErrorHandler, validateRequest, ErrorCodes } = require('./lib/errorHandler'); // Importar manejador de errores

// Cargar variables de entorno
// Si existe .env.production y no se fuerza modo dev, usarlo por defecto
const prodEnvPath = path.join(__dirname, '.env.production');
const devEnvPath = path.join(__dirname, '.env');
if (fs.existsSync(prodEnvPath) && process.env.FORCE_DEV_ENV !== 'true') {
  dotenv.config({ path: prodEnvPath });
  process.env.NODE_ENV = process.env.NODE_ENV || 'production';
} else {
  dotenv.config({ path: devEnvPath });
  process.env.NODE_ENV = process.env.NODE_ENV || 'development';
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
}

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de la base de datos (acepta ambas familias DB_* y MYSQL_*)
const { dbConfig, pool } = require('./config/database.cjs');

// Configuración de CORS
<<<<<<< HEAD
const defaultOrigins = [
  'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176',
  'http://localhost', 'http://localhost:80',
  'http://127.0.0.1:5173', 'http://127.0.0.1:3001', // Add IP based origins
  'http://192.168.1.13:5173' // Common local IP
];
const envOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean) : [];
const allowedOrigins = [...defaultOrigins, ...envOrigins];
const corsOptions = {
  // En desarrollo, permitir cualquier origen temporalmente si falla el match
  origin: function (origin, callback) {
    // Permitir requests sin origen (como curl o apps móviles)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1 || !process.env.NODE_ENV || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      console.log('🚫 Bloqueado por CORS:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
=======
const parsedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5175',
      'http://localhost:5176',
      'http://localhost:5177',
      'http://localhost:4174'
    ];

const corsOptions = {
  origin: parsedOrigins,
  credentials: process.env.CORS_CREDENTIALS === 'true' || true,
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Access-Control-Allow-Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Middlewares
app.use(cors(corsOptions));
// Manejo explícito de preflight para todas las rutas
app.options('*', cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging mejorado con información detallada
app.use((req, res, next) => {
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(2, 15);
  
  // Agregar requestId al request para trazabilidad
  req.requestId = requestId;
  
  logger.info('Incoming request', {
    requestId,
    method: req.method,
    url: req.url,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    contentType: req.get('Content-Type'),
    contentLength: req.get('Content-Length'),
    accept: req.get('Accept'),
    referer: req.get('Referer'),
    origin: req.get('Origin')
  });
  
  // Sobrescribir res.json para capturar respuestas
  const originalJson = res.json;
  res.json = function(data) {
    const responseTime = Date.now() - startTime;
    
    logger.info('Response sent', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      responseSize: JSON.stringify(data).length,
      hasError: !!data.error || !!data.message || data.success === false,
      errorCode: data.errorCode || data.error || null
    });
    
    return originalJson.call(this, data);
  };
  
  // Capturar errores en la respuesta
  res.on('error', (error) => {
    logger.error('Response error', error, {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode
    });
  });
  
  next();
});

<<<<<<< HEAD
app.get('/api/ping-test', (req, res) => res.send('SERVER IS UPDATED'));

// Función para probar conexión a MySQL
=======
// Función mejorada para probar conexión a MySQL con logging detallado
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
async function testMySQLConnection() {
  let connection = null;
  
  try {
<<<<<<< HEAD
    const [rows] = await pool.execute('SELECT 1');
    return true;
=======
    logger.info('Testing MySQL connection', {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user
    });
    
    connection = await mysql.createConnection(dbConfig);
    
    // Verificar conexión con una consulta simple
    const [result] = await connection.execute('SELECT 1 as test');
    
    if (Array.isArray(result) && result.length > 0) {
      logger.info('MySQL connection test successful', {
        serverInfo: connection.serverVersion,
        testQuery: result[0]
      });
      await connection.end();
      return { 
        success: true, 
        message: 'Conexión a MySQL exitosa',
        serverVersion: connection.serverVersion
      };
    } else {
      throw new Error('Query test returned no results');
    }
    
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
  } catch (error) {
    if (connection) {
      try {
        await connection.end();
      } catch (closeErr) {
        logger.error('Error closing MySQL connection during test', closeErr);
      }
    }
    
    logger.error('MySQL connection test failed', error, {
      host: dbConfig.host,
      port: dbConfig.port,
      database: dbConfig.database,
      user: dbConfig.user,
      errorCode: error.code,
      errorMessage: error.message
    });
    
    return { 
      success: false, 
      message: 'Error conectando a MySQL',
      error: error.message,
      errorCode: error.code,
      sqlState: error.sqlState,
      errno: error.errno
    };
  }
}

// Health check mejorado con logging detallado
app.get('/api/health', async (req, res) => {
  const startTime = Date.now();
  
  try {
<<<<<<< HEAD
    const mysqlConnected = await testMySQLConnection();

=======
    logger.debug('Health check requested', { ip: req.ip });
    
    const dbTest = await testMySQLConnection();
    
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
    const healthStatus = {
      status: dbTest.success ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: {
        status: dbTest.success ? 'connected' : 'error',
        message: dbTest.message,
        serverVersion: dbTest.serverVersion || null,
        error: dbTest.error || null,
        errorCode: dbTest.errorCode || null
      },
      memory: process.memoryUsage(),
      responseTime: `${Date.now() - startTime}ms`
    };
    
    if (dbTest.success) {
      logger.info('Health check successful', {
        responseTime: healthStatus.responseTime,
        databaseStatus: healthStatus.database.status,
        ip: req.ip
      });
      
      return res.status(200).json(healthStatus);
    } else {
      logger.error('Health check failed - database connection error', {
        databaseError: dbTest.error,
        errorCode: dbTest.errorCode,
        responseTime: healthStatus.responseTime,
        ip: req.ip
      });
      
      return res.status(503).json(healthStatus);
    }
    
  } catch (error) {
    logger.error('Health check endpoint error', error, {
      responseTime: `${Date.now() - startTime}ms`,
      ip: req.ip
    });
    
    return res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Error en health check',
      error: error.message,
      responseTime: `${Date.now() - startTime}ms`
    });
  }
});

<<<<<<< HEAD
// Ruta de ping simple
app.get('/api/ping', (req, res) => {
  res.json({
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString()
  });
});

// Endpoint de diagnóstico completo
app.get('/api/debug/connection', (req, res) => {
  const debugInfo = {
    server: {
      status: 'running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      port: PORT,
      baseUrl: `http://0.0.0.0:${PORT}/api`
    },
    network: {
      hostname: require('os').hostname(),
      platform: process.platform,
      nodeVersion: process.version,
      memoryUsage: process.memoryUsage()
    },
    configuration: {
      corsOrigin: process.env.CORS_ORIGIN || '*',
      dbHost: process.env.DB_HOST || 'localhost',
      dbName: process.env.DB_NAME || 'cafe_colombia',
      redisHost: process.env.REDIS_HOST || 'localhost'
    },
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      admin: '/api/admin',
      dashboard: '/api/dashboard',
      alerts: '/api/alerts',
      ai: '/api/ai'
    },
    request: {
      method: req.method,
      url: req.url,
      headers: {
        host: req.get('host'),
        userAgent: req.get('user-agent'),
        origin: req.get('origin'),
        referer: req.get('referer')
      },
      ip: req.ip || req.connection.remoteAddress
    }
  };

  res.json({
    success: true,
    message: 'Información de diagnóstico del servidor',
    data: debugInfo
  });
});

// Ruta principal de la API
app.get('/api', (req, res) => {
  res.json({
    message: 'Café Colombia API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      admin: '/api/admin',
      dashboard: '/api/dashboard',
      alerts: '/api/alerts',
      ai: '/api/ai'
    },
    features: {
      smartAlerts: '/api/alerts/smart',
      aiAnalysis: '/api/ai/analysis/results',
      aiStatus: '/api/ai/status',
      alertsStats: '/api/alerts/stats'
    }
  });
=======
// Ping mejorado con logging detallado
app.get('/api/ping', (req, res) => {
  try {
    logger.debug('Ping requested', { ip: req.ip });
    
    const pingResponse = {
      message: 'pong',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      requestId: req.requestId || 'unknown'
    };
    
    logger.debug('Ping response sent', {
      timestamp: pingResponse.timestamp,
      uptime: pingResponse.uptime,
      ip: req.ip
    });
    
    return res.json(pingResponse);
    
  } catch (error) {
    logger.error('Ping endpoint error', error, {
      ip: req.ip,
      requestId: req.requestId || 'unknown'
    });
    
    return res.status(500).json({
      error: 'Error en ping',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
});

// Ruta principal mejorada con logging detallado
app.get('/api', (req, res) => {
  try {
<<<<<<< HEAD
    const { email, password } = req.body;
=======
    logger.debug('Main API endpoint requested', { ip: req.ip });
    
    const apiInfo = {
      message: 'Café Colombia API Server',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      status: 'running',
      endpoints: {
        health: '/api/health',
        ping: '/api/ping',
        auth: '/api/auth',
        admin: '/api/admin',
        dashboard: '/api/dashboard',
        alerts: '/api/alerts',
        ai: '/api/ai'
      },
      features: {
        smartAlerts: '/api/alerts/smart',
        aiAnalysis: '/api/ai/analysis/results',
        aiStatus: '/api/ai/status',
        alertsStats: '/api/alerts/stats'
      },
      requestId: req.requestId || 'unknown'
    };
    
    logger.debug('Main API response sent', {
      timestamp: apiInfo.timestamp,
      uptime: apiInfo.uptime,
      ip: req.ip
    });
    
    return res.json(apiInfo);
    
  } catch (error) {
    logger.error('Main API endpoint error', error, {
      ip: req.ip,
      requestId: req.requestId || 'unknown'
    });
    
    return res.status(500).json({
      error: 'Error en API principal',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Login de caficultor - Versión mejorada con validación y manejo de errores robusto
app.post('/api/auth/login', validateRequest({
  required: ['password'],
  // Aceptar email o username
  email: ['email'],
  minLength: { password: 6 }
}), asyncErrorHandler(async (req, res) => {
  const startTime = Date.now();
  let connection = null;
  
  try {
    const body = req.body || {};
    const email = body.email || body.username;
    const password = body.password;
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad

    if (!email || !password) {
      logger.warn('Login attempt with missing credentials', {
        hasEmail: !!email,
        hasPassword: !!password,
        ip: req.ip
      });
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }

<<<<<<< HEAD
    try {
      // Buscar usuario en la tabla users
      const [users] = await pool.execute(
        'SELECT id, email, password, firstName, lastName, role, isActive FROM users WHERE email = ? AND isActive = true',
        [email]
      );

      if (users.length === 0) {
        const fs = require('fs');
        try {
          fs.appendFileSync('backend-errors.log', new Date().toISOString() + ` LOGIN FAIL: User not found for email ${email}\n`);
        } catch (e) { }
        return res.status(401).json({
          error: 'Credenciales inválidas'
        });
      }

      const user = users[0];

      // Verificar contraseña con bcrypt
      const isValidPassword = await bcrypt.compare(password, user.password);

      if (!isValidPassword) {
        const fs = require('fs');
        try {
          fs.appendFileSync('backend-errors.log', new Date().toISOString() + ` LOGIN FAIL: Invalid password for ${email}\n`);
        } catch (e) { }
        return res.status(401).json({
          error: 'Credenciales inválidas'
=======
    // Validación de formato de email si parece email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.includes('@') && !emailRegex.test(email)) {
      logger.warn('Login attempt with invalid email format', { email, ip: req.ip });
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    connection = await mysql.createConnection(dbConfig);
    logger.debug('Database connection established for login', { email });

    // Primero intentar como administrador
    logger.debug('Attempting admin login', { email });
    const [adminRows] = await connection.execute(
      'SELECT id, email, password_hash, name, is_super_admin, is_active FROM admin_users WHERE email = ? AND is_active = true LIMIT 1',
      [email]
    );

    if (adminRows && adminRows.length > 0) {
      const admin = adminRows[0];
      
      // Verificar estado del admin (is_active es tinyint(1), 1 = activo)
      if (admin.is_active !== 1) {
        logger.warn('Admin login attempt on inactive account', {
          email,
          adminId: admin.id,
          isActive: admin.is_active,
          ip: req.ip
        });
        await connection.end();
        return res.status(403).json({
          success: false,
          message: 'Cuenta de administrador no activa',
          isActive: admin.is_active
        });
      }
      
      const okAdmin = await bcrypt.compare(password, admin.password_hash || '');
      if (okAdmin) {
        logger.info('Admin login successful', {
          adminId: admin.id,
          email,
          role: admin.is_super_admin ? 'super_admin' : 'admin',
          ip: req.ip
        });
        
        await connection.execute(
          'UPDATE admin_users SET last_login_at = NOW() WHERE id = ?',
          [admin.id]
        );
        
        await connection.end();
        
        const responseTime = Date.now() - startTime;
        logger.info('Admin login completed successfully', {
          adminId: admin.id,
          email,
          role: admin.is_super_admin ? 'super_admin' : 'admin',
          responseTime: `${responseTime}ms`,
          ip: req.ip
        });
        
        return res.json({
          success: true,
          message: 'Login exitoso',
          user: {
            id: admin.id,
            email: admin.email,
            name: admin.name,
            role: admin.is_super_admin ? 'super_admin' : 'admin'
          },
          token: 'admin-token-' + admin.email
        });
      } else {
        logger.warn('Admin login attempt with invalid password', {
          email,
          adminId: admin.id,
          ip: req.ip
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
        });
      }
    }

<<<<<<< HEAD
      // Login exitoso

      // Generar token compatible con rutas de caficultor si es necesario
      let token;
      if (user.role === 'coffee_grower' || user.role === 'TRABAJADOR') {
        // Usar formato grower-token para compatibilidad con workers.cjs y dashboard
        token = 'grower-token-' + user.email;
      } else {
        token = 'user-token-' + user.id + '-' + Date.now();
      }

      return res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            firstName: user.firstName,
            lastName: user.lastName
          },
          token: token
        }
      });

    } catch (dbError) {
      console.error('Database error during login:', dbError);
      throw dbError;
    }

  } catch (error) {
    console.error('Login error:', error);
    const fs = require('fs');
    try {
      fs.appendFileSync('backend-errors.log', new Date().toISOString() + ' LOGIN ERROR: ' + error.message + '\n');
    } catch (e) { }
    res.status(500).json({
      error: 'Error en el servidor durante el inicio de sesión'
=======
    // Intentar login como caficultor
    logger.debug('Attempting coffee grower login', { email });
    const [rows] = await connection.execute(
      `SELECT cg.id, cg.email, cg.password_hash, cg.full_name, cg.status,
              f.id as farm_id, f.name as farm_name
       FROM coffee_growers cg
       LEFT JOIN farms f ON cg.id = f.coffee_grower_id AND f.status = 'active'
       WHERE cg.email = ?
       LIMIT 1`,
      [email]
    );

    if (!rows || rows.length === 0) {
      logger.warn('Login attempt with non-existent email', { email, ip: req.ip });
      await connection.end();
      return res.status(401).json({ 
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = rows[0];

    // Verificar estado del usuario
    if (user.status && user.status !== 'active') {
      logger.warn('Login attempt on inactive account', {
        email,
        userId: user.id,
        status: user.status,
        ip: req.ip
      });
      await connection.end();
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada. Contacta al administrador.',
        status: user.status
      });
    }

    const isValidPassword = await bcrypt.compare(password, user.password_hash || '');
    if (!isValidPassword) {
      logger.warn('Login attempt with invalid password', {
        email,
        userId: user.id,
        ip: req.ip
      });
      
      await connection.end();
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Login exitoso
    logger.info('Coffee grower login successful', {
      userId: user.id,
      email,
      fullName: user.full_name,
      ip: req.ip
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
    });

    await connection.end();
    
    const responseTime = Date.now() - startTime;
    logger.info('Coffee grower login completed successfully', {
      userId: user.id,
      email,
      role: 'coffee_grower',
      responseTime: `${responseTime}ms`,
      ip: req.ip
    });

    return res.json({
      success: true,
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: (user.full_name || '').trim(),
        role: 'coffee_grower',
        farmId: user.farm_id,
        farmName: user.farm_name
      },
      token: 'grower-token-' + user.email
    });
  } catch (dbError) {
    if (connection) {
      await connection.end();
    }
    logger.logDatabaseError('login', dbError, 
      'SELECT/UPDATE coffee_growers/admin_users', 
      { email }
    );
    
    throw dbError; // El errorHandler global lo procesará
  }
}));

// Registro de caficultor - Versión mejorada con validación y manejo de errores robusto
app.post('/api/auth/register', validateRequest({
  // Relajar validación para compatibilidad: frontend puede enviar 'name' en lugar de first/last
  required: ['email', 'password'],
  email: ['email'],
  minLength: { password: 6 }
}), asyncErrorHandler(async (req, res) => {
  const startTime = Date.now();
  let connection = null;
  
  try {
    const body = req.body || {};
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      farmName: rawFarmName,
      farmLocation,
      farmSize,
      coffeeVarieties,
      certifications,
      experience
    } = body;

    // Compatibilidad: aceptar 'name' y 'fincaName' del frontend
    const name = (body.name || '').trim();
    const farmName = (rawFarmName || body.fincaName || '').trim();

    // Documento e identificación: aceptar snake_case y camelCase
    const documentType = body.document_type || body.documentType;
    const identificationNumber = body.identification_number || body.identificationNumber;
    // Normalizar valores opcionales para evitar 'undefined' en parámetros SQL
    // Si falta identificación/documento, generar valores seguros para esquemas que requieran NOT NULL
    // Preferir valores proporcionados por el cliente; si vienen vacíos, usar fallback único
    let normalizedDocumentType;
    let normalizedIdentificationNumber;
    if (documentType === undefined || documentType === null || String(documentType).trim() === '') {
      normalizedDocumentType = 'unknown';
      logger.warn('Missing document_type on registration, using fallback', { email });
    } else {
      normalizedDocumentType = String(documentType).trim();
    }

    if (identificationNumber === undefined || identificationNumber === null || String(identificationNumber).trim() === '') {
      normalizedIdentificationNumber = `TEMP-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
      logger.warn('Missing identification_number on registration, using temporary unique placeholder', { email });
    } else {
      normalizedIdentificationNumber = String(identificationNumber).trim();
    }

    // Validación de campos obligatorios (relajada)
    if (!email || !password) {
      logger.warn('Registration attempt with missing fields', {
        email: email || 'missing',
        hasPassword: !!password,
        hasFirstName: !!firstName,
        hasLastName: !!lastName,
        hasPhone: !!phone,
        ip: req.ip
      });
      
      return res.status(400).json({
        success: false,
        message: 'Campos obligatorios faltantes',
        required: ['email', 'password']
      });
    }

    // Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      logger.warn('Registration attempt with invalid email format', { email, ip: req.ip });
      return res.status(400).json({
        success: false,
        message: 'Formato de email inválido'
      });
    }

    // Validación de longitud de contraseña
    if (password.length < 6) {
      logger.warn('Registration attempt with weak password', { email, passwordLength: password.length, ip: req.ip });
      return res.status(400).json({
        success: false,
        message: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    connection = await mysql.createConnection(dbConfig);
    logger.info('Database connection established for registration', { email });

    // Asegurar columnas para documento/identificación y índice único
    try {
      const [columns] = await connection.execute(
        `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coffee_growers' 
         AND COLUMN_NAME IN ('document_type', 'identification_number')`
      );
      const colSet = new Set((columns || []).map(c => c.COLUMN_NAME));
      const alters = [];
      if (!colSet.has('document_type')) alters.push('ADD COLUMN document_type VARCHAR(50) NULL');
      if (!colSet.has('identification_number')) alters.push('ADD COLUMN identification_number VARCHAR(64) NULL');
      if (alters.length > 0) {
        const alterSQL = `ALTER TABLE coffee_growers ${alters.join(', ')}`;
        logger.info('Executing schema alter for coffee_growers', { alterSQL });
        await connection.execute(alterSQL);
      }
      const [idx] = await connection.execute(
        `SELECT INDEX_NAME FROM information_schema.STATISTICS 
         WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'coffee_growers' 
         AND COLUMN_NAME = 'identification_number' AND NON_UNIQUE = 0`
      );
      if (!idx || idx.length === 0) {
        logger.info('Creating unique index on identification_number');
        await connection.execute(
          'ALTER TABLE coffee_growers ADD UNIQUE KEY uniq_identification_number (identification_number)'
        );
      }
    } catch (schemaErr) {
      logger.warn('Could not ensure coffee_growers schema', { error: schemaErr.message });
    }

    try {
      // Verificar si el email ya existe
      logger.debug('Checking if email exists', { email });
      const [existing] = await connection.execute(
        'SELECT id, email, status FROM coffee_growers WHERE email = ? LIMIT 1',
        [email]
      );

      if (Array.isArray(existing) && existing.length > 0) {
        logger.warn('Registration attempt with existing email', { 
          email, 
          existingUserId: existing[0].id,
          existingStatus: existing[0].status,
          ip: req.ip 
        });
        await connection.end();
        return res.status(409).json({ 
          success: false,
          message: 'El email ya está registrado',
          existingStatus: existing[0].status
        });
      }

      // Hash de contraseña
      logger.debug('Hashing password', { email });
      const passwordHash = await bcrypt.hash(password, 10);
      // Construir nombre completo con tolerancia
      let fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
      if (!fullName) {
        fullName = name || 'Usuario';
      }
      // Normalizar teléfono (opcional)
      const phoneValue = (phone || body.phoneNumber || '').trim() || null;

      // Obtener ID del admin por defecto para created_by
      logger.debug('Getting default admin user for created_by', { email });
      const [adminRows] = await connection.execute(
        'SELECT id FROM admin_users WHERE email = ? LIMIT 1',
        ['admin@cafecolombia.com']
      );
      
      const createdBy = (adminRows && adminRows.length > 0) ? adminRows[0].id : 'admin-001';
      
      // Insertar usuario caficultor
      logger.info('Creating new coffee grower', { email, fullName, phone: phoneValue, createdBy });
      const [result] = await connection.execute(
        `INSERT INTO coffee_growers (
           email, password_hash, full_name, phone, status, created_by, created_at,
           document_type, identification_number
         ) VALUES (?, ?, ?, ?, 'active', ?, NOW(), ?, ?)`,
        [email, passwordHash, fullName, phoneValue, createdBy, normalizedDocumentType, normalizedIdentificationNumber]
      );

      const growerId = result.insertId;
      logger.info('Coffee grower created successfully', { 
        userId: growerId, 
        email, 
        fullName 
      });

      // Intentar crear la finca si hay datos suficientes
      if (farmName && growerId) {
        try {
          logger.debug('Creating farm for new user', { 
            userId: growerId, 
            farmName,
            farmLocation: farmLocation || 'not provided',
            farmSize: farmSize || 'not provided'
          });
          // Construir ubicación flexible: aceptar objeto o campos planos
          let locationValue = null;
          if (farmLocation && typeof farmLocation === 'object') {
            locationValue = JSON.stringify({
              department: farmLocation.department,
              municipality: farmLocation.municipality,
              address: farmLocation.address,
              coordinates: farmLocation.coordinates || null
            });
          } else {
            const department = body.department;
            const municipality = body.municipality;
            const address = body.address;
            if (department || municipality || address) {
              locationValue = JSON.stringify({ department, municipality, address });
            } else {
              locationValue = farmLocation || null;
            }
          }

          await connection.execute(
            `INSERT INTO farms (coffee_grower_id, name, location, size_hectares, status, created_by, created_at)
             VALUES (?, ?, ?, ?, 'active', ?, NOW())`,
            [growerId, farmName, locationValue, farmSize || null, createdBy]
          );
          
          logger.info('Farm created successfully', { 
            userId: growerId, 
            farmName 
          });
        } catch (farmErr) {
          logger.warn('Could not create farm for new user', {
            userId: growerId,
            farmName,
            error: farmErr.message,
            sql: farmErr.sql
          });
          // Continuar sin la finca, no es crítico
        }
      }

      await connection.end();
      
      const responseTime = Date.now() - startTime;
      logger.info('Registration completed successfully', {
        userId: growerId,
        email,
        fullName,
        hasFarm: !!farmName,
        responseTime: `${responseTime}ms`,
        ip: req.ip
      });

      return res.status(201).json({
        success: true,
        message: 'Registro exitoso. Bienvenido a Café Colombia!',
        user: {
          id: growerId,
          email,
          fullName,
          role: 'coffee_grower'
        }
      });
      
    } catch (dbError) {
      await connection.end();
      // Duplicados de email/identificación
      if (dbError && (dbError.code === 'ER_DUP_ENTRY' || String(dbError.message).includes('Duplicate entry'))) {
        logger.warn('Duplicate entry on registration', { error: dbError.message });
        return res.status(409).json({ success: false, message: 'El email o identificación ya está registrado' });
      }
      logger.logDatabaseError('register_user', dbError, 
        'INSERT INTO coffee_growers', 
        { email, phone }
      );
      
      throw dbError; // El errorHandler global lo procesará
    }
  } catch (error) {
    if (connection) {
      try {
        await connection.end();
      } catch (closeErr) {
        logger.error('Error closing connection in register catch', closeErr);
      }
    }
    
    logger.error('Registration endpoint error', error, {
      email: req.body?.email,
      ip: req.ip
    });
    
    throw error; // asyncErrorHandler lo procesará
  }
}));

// Ruta de login para administradores
// Compatibilidad con rutas: aceptar ambas `/api/auth/admin/login` y `/api/admin/auth/login`
const adminLoginHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    try {
      // Buscar en admin_users
      const [adminUsers] = await pool.execute(
        'SELECT id, email, password_hash, name, is_super_admin, is_active FROM admin_users WHERE email = ? AND is_active = true',
        [email]
      );

      if (adminUsers.length > 0) {
        const user = adminUsers[0];
<<<<<<< HEAD
        // Para admin, verificar credenciales hardcodeadas por ahora
        if (email === 'admin@cafecolombiaapp.com' && password === 'admin123') {
=======
        const ok = await bcrypt.compare(password, user.password_hash || '');
        if (ok) {
          await connection.end();
          const token = 'admin-token-' + user.email;
          // Respuesta compatible con frontend (adminApiService) y rutas existentes
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
          return res.json({
            success: true,
            message: 'Login exitoso',
            // Compat: datos planos
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.is_super_admin ? 'super_admin' : 'admin'
            },
            admin: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.is_super_admin ? 'super_admin' : 'admin'
            },
            token,
            session: {
              token,
              type: 'simple',
              expiresIn: '24h'
            },
            // Forma esperada por AdminApiService: response.data.session.token
            data: {
              admin: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.is_super_admin ? 'super_admin' : 'admin'
              },
              session: {
                token,
                type: 'simple',
                expiresIn: '24h'
              }
            }
          });
        }
      }

<<<<<<< HEAD
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });
=======
      await connection.end();
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad

    } catch (dbError) {
      throw dbError;
    }

  } catch (error) {
    console.error('Error en admin login:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor', error: error.message });
  }
};

<<<<<<< HEAD
// Ruta de registro para caficultores
// Ruta de registro para caficultores
app.post('/api/auth/register', async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      farmName,
      location,
      farmSize,
      altitude,
      coffeeVariety,
      phone
    } = req.body;

    // Validaciones básicas
    if (!name || !email || !password || !farmName) {
      return res.status(400).json({
        error: 'Nombre, email, contraseña y nombre de finca son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    try {
      // Verificar si el email ya existe
      const [existingUsers] = await pool.execute(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          error: 'El email ya está registrado'
        });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const userId = uuidv4();
      const firstName = name.split(' ')[0];
      const lastName = name.split(' ').slice(1).join(' ') || '';

      // Insertar nuevo usuario (caficultor)
      await pool.execute(
        `INSERT INTO users (id, email, password, firstName, lastName, role, isActive, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, 'coffee_grower', true, NOW(), NOW())`,
        [userId, email, hashedPassword, firstName, lastName]
      );

      // Crear finca asociada
      if (farmName) {
        const farmId = uuidv4();
        await pool.execute(
          `INSERT INTO farms 
           (id, ownerId, name, location, area, altitude, isActive, createdAt, updatedAt) 
           VALUES (?, ?, ?, ?, ?, ?, true, NOW(), NOW())`,
          [
            farmId,
            userId,
            farmName,
            location || 'No especificado',
            farmSize || 0,
            altitude || 0
          ]
        );
      }

      res.status(201).json({
        success: true,
        message: 'Caficultor registrado exitosamente',
        user: {
          id: userId,
          name,
          email,
          farmName
        }
      });

    } catch (dbError) {
      throw dbError;
=======
app.post('/api/auth/admin/login', adminLoginHandler);
app.post('/api/admin/auth/login', adminLoginHandler);

// Endpoints mínimos para refresh y logout del admin (compatibilidad frontend)
app.post('/api/admin/auth/refresh', async (req, res) => {
  try {
    // Simplemente devuelve el mismo token si existe en Authorization o body
    const authHeader = req.headers['authorization'] || '';
    const bearer = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const headerToken = bearer.startsWith('Bearer ') ? bearer.split(' ')[1] : null;
    const bodyToken = req.body && (req.body.refresh_token || req.body.token);
    const token = headerToken || bodyToken || null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
    }

    return res.json({ success: true, data: { token } });
  } catch (error) {
    console.error('Error en admin refresh:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

<<<<<<< HEAD
=======
// Alias para compatibilidad: /api/auth/admin/refresh
app.post('/api/auth/admin/refresh', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'] || '';
    const bearer = Array.isArray(authHeader) ? authHeader[0] : authHeader;
    const headerToken = bearer.startsWith('Bearer ') ? bearer.split(' ')[1] : null;
    const bodyToken = req.body && (req.body.refresh_token || req.body.token);
    const token = headerToken || bodyToken || null;

    if (!token) {
      return res.status(401).json({ success: false, message: 'Token no proporcionado' });
    }

    return res.json({ success: true, data: { token } });
  } catch (error) {
    console.error('Error en admin refresh (alias):', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

app.post('/api/admin/auth/logout', async (req, res) => {
  try {
    // En esta implementación simple, no hay invalidación de token
    return res.json({ success: true, message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en admin logout:', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});

// Alias para compatibilidad: /api/auth/admin/logout
app.post('/api/auth/admin/logout', async (req, res) => {
  try {
    return res.json({ success: true, message: 'Logout exitoso' });
  } catch (error) {
    console.error('Error en admin logout (alias):', error);
    return res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
});


// Ruta para obtener información del usuario
app.get('/api/admin/me', (req, res) => {
  // Simulación de usuario autenticado
  res.json({
    id: 'admin-001',
    email: 'admin@cafecolombia.com',
    name: 'Administrador Principal',
    is_super_admin: true,
    is_active: true
  });
});

// Ruta para obtener estadísticas del dashboard (ADMIN)
app.get('/api/admin/dashboard/stats', authenticateJWT, requireAdmin, async (req, res) => {
  try {
    // Datos de ejemplo para evitar límites de conexión de BD
    res.json({
      users: 42,
      admins: 3,
      configurations: 15,
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas'
    });
  }
});

// Ruta real de métricas del dashboard de administración
// Devuelve conteos y totales directamente desde la BD de producción
app.get('/api/admin/dashboard/metrics', async (req, res) => {
  let connection = null;
  try {
    connection = await mysql.createConnection(dbConfig);

    const [[adminsTotal]] = await connection.execute("SELECT COUNT(*) AS count FROM admin_users WHERE is_active = true");
    const [[growersTotal]] = await connection.execute("SELECT COUNT(*) AS count FROM coffee_growers");
    const [[farmsTotal]] = await connection.execute("SELECT COUNT(*) AS count FROM farms");
    const [[areas]] = await connection.execute("SELECT ROUND(SUM(total_area),2) AS total_area, ROUND(SUM(coffee_area),2) AS coffee_area FROM farms WHERE total_area IS NOT NULL");
    const [[subscriptionsActive]] = await connection.execute("SELECT COUNT(*) AS count FROM subscriptions WHERE status='active' AND (end_date IS NULL OR end_date > NOW())");
    const [[paymentsThisMonth]] = await connection.execute("SELECT COALESCE(SUM(amount),0) AS total FROM payments WHERE status='completed' AND YEAR(created_at)=YEAR(CURDATE()) AND MONTH(created_at)=MONTH(CURDATE())");

    const totalUsers = (adminsTotal.count || 0) + (growersTotal.count || 0);

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers
        },
        admins: {
          total: adminsTotal.count || 0
        },
        coffee_growers: {
          total: growersTotal.count || 0
        },
        farms: {
          total: farmsTotal.count || 0,
          total_area: String(areas.total_area || 0),
          coffee_area: String(areas.coffee_area || 0)
        },
        subscriptions: {
          active: subscriptionsActive.count || 0
        },
        payments: {
          revenue_this_month: Number(paymentsThisMonth.total) || 0
        },
        lastUpdated: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error obteniendo métricas del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo métricas del dashboard',
      error: error.message
    });
  } finally {
    if (connection) {
      try { await connection.end(); } catch (_) {}
    }
  }
});

// Endpoints unificados de usuarios para alineación con frontend
// GET /api/users - Lista usuarios del sistema (admins + caficultores)
app.get('/api/users', async (req, res) => {
  let connection = null;
  try {
    connection = await mysql.createConnection(dbConfig);

    const role = (req.query.role || '').toString(); // 'admin' | 'coffee_grower' opcional
    const page = parseInt((req.query.page || '1').toString(), 10) || 1;
    const pageSize = parseInt((req.query.pageSize || '20').toString(), 10) || 20;

    // Consultas
    let admins = [];
    let growers = [];

    if (!role || role === 'admin') {
      const [adminRows] = await connection.execute(
        'SELECT id, email, name, is_active, is_super_admin, last_login_at FROM admin_users'
      );
      admins = adminRows.map(a => ({
        id: `admin-${a.id}`,
        rawId: a.id,
        email: a.email,
        name: a.name,
        role: a.is_super_admin ? 'super_admin' : 'admin',
        type: 'admin',
        status: a.is_active ? 'active' : 'inactive',
        lastLoginAt: a.last_login_at || null
      }));
    }

    if (!role || role === 'coffee_grower') {
      const [growerRows] = await connection.execute(
        'SELECT id, email, full_name, status, created_at FROM coffee_growers'
      );
      growers = growerRows.map(g => ({
        id: `grower-${g.id}`,
        rawId: g.id,
        email: g.email,
        name: g.full_name,
        role: 'coffee_grower',
        type: 'coffee_grower',
        status: g.status || 'active',
        createdAt: g.created_at || null
      }));
    }

    const all = [...admins, ...growers];
    const total = all.length;

    // Orden simple por nombre/email
    all.sort((a, b) => (a.name || a.email || '').localeCompare(b.name || b.email || ''));

    // Paginación
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const items = all.slice(start, end);

    res.setHeader('X-Total-Count', String(total));
    res.setHeader('X-Page-Count', String(Math.ceil(total / pageSize)));

    return res.json({
      success: true,
      data: {
        items,
        total,
        page,
        pageSize
      }
    });
  } catch (error) {
    console.error('Error listando usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error listando usuarios',
      error: error.message
    });
  } finally {
    if (connection) {
      try { await connection.end(); } catch (_) {}
    }
  }
});

// GET /api/users/counts - Conteos unificados
app.get('/api/users/counts', async (req, res) => {
  let connection = null;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [[adminsTotal]] = await connection.execute("SELECT COUNT(*) AS count FROM admin_users WHERE is_active = true");
    const [[growersTotal]] = await connection.execute("SELECT COUNT(*) AS count FROM coffee_growers");
    const totalUsers = (adminsTotal.count || 0) + (growersTotal.count || 0);

    return res.json({
      success: true,
      data: {
        total: totalUsers,
        admins: adminsTotal.count || 0,
        coffee_growers: growersTotal.count || 0
      }
    });
  } catch (error) {
    console.error('Error obteniendo conteos de usuarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error obteniendo conteos de usuarios',
      error: error.message
    });
  } finally {
    if (connection) {
      try { await connection.end(); } catch (_) {}
    }
  }
});

// Ruta para obtener datos de gráficos del dashboard
app.get('/admin/dashboard/charts', async (req, res) => {
  try {
    const period = req.query.period || '30d';
    const chartData = {
      userGrowth: [
        { date: '2024-10-01', users: 10 },
        { date: '2024-10-15', users: 25 },
        { date: '2024-11-01', users: 45 }
      ],
      subscriptionDistribution: [
        { name: 'Básico', value: 30 },
        { name: 'Premium', value: 45 },
        { name: 'Enterprise', value: 25 }
      ],
      revenueData: [
        { month: 'Oct', revenue: 1200 },
        { month: 'Nov', revenue: 1800 }
      ],
      period: period,
      lastUpdate: new Date().toISOString()
    };
    res.json(chartData);
  } catch (error) {
    console.error('Error obteniendo datos de gráficos:', error);
    res.status(500).json({
      error: 'Error obteniendo datos de gráficos'
    });
  }
});

>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

const { authenticateToken } = require('./middleware/auth.cjs');

// Ruta del dashboard delegada al router externo
app.use('/api/dashboard', require('./routes/dashboard.cjs'));

// Ruta para obtener información del administrador autenticado
app.get('/api/admin/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');

    // Verificar token JWT
    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'admin-secret-key');

    // Buscar sesión activa y admin
    const [sessionRows] = await pool.execute(`
      SELECT s.*, a.* FROM admin_sessions s
      JOIN admin_users a ON s.admin_user_id = a.id
      WHERE s.expires_at > NOW() AND a.is_active = true
    `);

    // Verificar el token hash
    let validSession = null;
    for (const session of sessionRows) {
      if (await bcrypt.compare(token, session.token_hash)) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada'
      });
    }

    const admin = validSession;

    // Preparar respuesta sin datos sensibles
    const { password_hash, two_factor_secret, ...safeAdmin } = admin;

    res.json({
      success: true,
      admin: safeAdmin
    });

  } catch (error) {
    console.error('Error obteniendo información del administrador:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// Servir archivos estáticos del frontend
const distPath = path.join(__dirname, '..', 'dist');
console.log('📁 Serving static files from:', distPath);

// Verificar si existe el directorio dist
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  
  // Ruta catch-all para SPA - servir index.html para rutas no encontradas
  app.get('*', (req, res) => {
    // No interferir con rutas API
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Ruta API no encontrada' });
    }
    
    const indexPath = path.join(distPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      res.status(404).json({ error: 'Archivo no encontrado' });
    }
  });
  
  console.log('✅ Static file serving configured');
} else {
  console.log('⚠️  Warning: dist directory not found at', distPath);
}

// Importar y configurar rutas adicionales
const alertsRoutes = require('./routes/alerts.cjs');
const aiRoutes = require('./routes/ai.cjs');
const adminRoutes = require('./routes/admin.cjs');
const adminDashboardRoutes = require('./routes/admin/dashboard.cjs');
const adminReportsRoutes = require('./routes/admin/reports.cjs');
const adminSecurityRoutes = require('./routes/admin/security.cjs');
const adminUsersRoutes = require('./routes/admin/users.cjs');
const adminCoffeeGrowersRoutes = require('./routes/admin/coffee-growers.cjs');
const adminFarmsRoutes = require('./routes/admin/farms.cjs');
const adminSubscriptionsRoutes = require('./routes/admin/subscriptions.cjs');
const adminSubscriptionPlansRoutes = require('./routes/admin/subscription-plans.cjs');
const adminPaymentsRoutes = require('./routes/admin/payments.cjs');
const adminAnalyticsRoutes = require('./routes/admin/analytics.cjs');
const adminAuditRoutes = require('./routes/admin/audit.cjs');
const adminProfileRoutes = require('./routes/admin/profile.cjs');
const workersRoutes = require('./routes/workers.cjs');
const dashboardRoutes = require('./routes/dashboard.cjs');

// Configurar rutas de alertas, AI y admin
app.use('/api/alerts', alertsRoutes);
app.use('/api/ai', aiRoutes);
// Montar dashboard router ANTES de admin router para que tenga prioridad
app.use('/api/admin/dashboard', adminDashboardRoutes);
app.use('/api/admin/reports', adminReportsRoutes);
app.use('/api/admin/security', adminSecurityRoutes);
app.use('/api/admin/users', adminUsersRoutes);
app.use('/api/admin/coffee-growers', adminCoffeeGrowersRoutes);
app.use('/api/admin/farms', adminFarmsRoutes);
app.use('/api/admin/subscriptions', adminSubscriptionsRoutes);
app.use('/api/admin/subscription-plans', adminSubscriptionPlansRoutes);
app.use('/api/admin/payments', adminPaymentsRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/audit', adminAuditRoutes);
app.use('/api/admin/profile', adminProfileRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/workers', authenticateToken, workersRoutes);
app.use('/api/dashboard', dashboardRoutes);

<<<<<<< HEAD
// Servir archivos estáticos del frontend (build de Vite)
const frontendPath = path.join(__dirname, '..', 'dist');
app.use(express.static(frontendPath));

// Fallback para SPA - servir index.html para todas las rutas que no sean API
app.get('*', (req, res) => {
  // Si la ruta comienza con /api, devolver error 404 para API
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'Ruta de API no encontrada',
      path: req.originalUrl
    });
  }

  // Para todas las demás rutas, servir el index.html (SPA fallback)
  res.sendFile(path.join(frontendPath, 'index.html'));
});
=======
// Middleware de manejo de errores global (debe ir después de todas las rutas)
app.use(errorHandler);
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad

// Iniciar servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Café Colombia...');

    // Probar conexión a MySQL
    console.log('🔌 Probando conexión a MySQL...');
    const mysqlConnected = await testMySQLConnection();

    if (mysqlConnected) {
      console.log('✅ Conexión a MySQL exitosa');
    } else {
      console.log('⚠️  Advertencia: No se pudo conectar a MySQL');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎉 Servidor corriendo en puerto ${PORT}`);
      console.log(`📍 Health check: http://0.0.0.0:${PORT}/api/health`);
      console.log(`📍 API base: http://0.0.0.0:${PORT}/api`);
      console.log('');
      console.log('📋 Configuración de base de datos:');
      console.log(`   Host: ${dbConfig.host}`);
      console.log(`   Usuario: ${dbConfig.user}`);
      console.log(`   Base de datos: ${dbConfig.database}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();
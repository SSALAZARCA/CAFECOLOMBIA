const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const fs = require('fs');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios'); // Import axios for scraping
const helmet = require('helmet'); // Security Headers
const prisma = require('./lib/prisma.cjs'); // Singleton de Prisma

const logger = require('./lib/logger.cjs'); // Importar el logger
const { errorHandler, asyncErrorHandler, validateRequest, ErrorCodes } = require('./lib/errorHandler.cjs'); // Importar manejador de errores

// Cargar variables de entorno
// Si existe .env.production y no se fuerza modo dev, usarlo por defecto
const prodEnvPath = path.join(__dirname, '.env.production');
const devEnvPath = path.join(__dirname, '.env');
const envPath = fs.existsSync(prodEnvPath) && process.env.FORCE_DEV_ENV !== 'true' ? prodEnvPath : devEnvPath;

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config(); // Fallback
}
// Ajustar NODE_ENV basado en el archivo cargado si no estaba ya definido
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = envPath === prodEnvPath ? 'production' : 'development';
}

const app = express();
const PORT = process.env.PORT || 5001;

// Trust Proxy for Coolify/Nginx/Load Balancer (Critical for HTTPS)
app.set('trust proxy', 1);

// Security Headers (Helmet)
// Disable CSP/COEP to avoid breaking external scripts (Maps, Firebase) for now
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// Configuración de la base de datos eliminada (ahora se usa Prisma)

// Configuración de CORS
const parsedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:4174',
    'http://localhost:3001',
    'http://127.0.0.1:3001',
    'http://127.0.0.1:5173',
    'https://cafecolombia.site',
    'https://www.cafecolombia.site',
    'http://cafecolombia.site',
    'http://www.cafecolombia.site'
  ];

// Middlewares
// CORS debe ir PRIMERO antes que cualquier otra cosa para manejar OPTIONS correctamente
const corsOptions = {
  origin: true, // Allow ALL origins for now to fix local dev issues
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Access-Control-Allow-Origin', 'X-API-Key'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Log all requests to console to see if they reach the server
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// STATIC FILES SERVING
const distPath = path.join(__dirname, '..', 'dist');
if (fs.existsSync(distPath)) {
  console.log('📁 Serving static files from:', distPath);
  app.use(express.static(distPath));
} else {
  console.warn('⚠️ DIST FOLDER NOT FOUND - Frontend will not be served');
}

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

  // Sobrescribir res.json para capturar respuestas JSON (no para archivos estáticos)
  const originalJson = res.json;
  const originalSend = res.send;

  res.json = function (data) {
    const responseTime = Date.now() - startTime;

    logger.info('Response sent', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      responseSize: JSON.stringify(data || {}).length,
      hasError: data && (!!data.error || !!data.message || data.success === false),
      errorCode: data && (data.errorCode || data.error || null)
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

// Función mejorada para probar conexión a MySQL con logging detallado
async function testMySQLConnection() {
  let connection = null;

  try {
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
    logger.debug('Health check requested', { ip: req.ip });

    // Deshabilitamos el test estricto de MySQL para permitir funcionamiento Offline/Local con SQLite
    // const dbTest = await testMySQLConnection();
    // if (!dbTest) {
    //   logger.warn('⚠️  MySQL connection failed - Some legacy features may not work');
    // } else {
    //   logger.info('✅ MySQL connection verified');
    // }
    const dbTest = { success: true, message: 'MySQL test skipped (offline/SQLite mode)', serverVersion: 'N/A' }; // Mock dbTest for healthStatus

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

// FNC Price Scraper (Moved UP for priority)
app.get('/api/fnc-price', async (req, res) => {
  console.log('☕ FNC Price Endpoint Hit');
  try {
    const fncUrl = 'https://federaciondecafeteros.org/';
    const response = await axios.get(fncUrl);
    const html = response.data;

    // Regex simplificado para buscar el precio interno
    const priceRegex = /Precio.*?(\$[\s\d,.]+\d)/i;
    const match = html.match(priceRegex);

    if (match && match[1]) {
      const rawPrice = match[1];
      const numericString = rawPrice.replace(/[^\d]/g, '');
      const price = parseInt(numericString, 10);

      return res.json({
        success: true,
        price: price,
        formatted: rawPrice,
        source: 'FNC Scraping'
      });
    }

    // Fallback
    const fallbackRegex = /\$\s*2[\d.,]{6,}/;
    const fallbackMatch = html.match(fallbackRegex);
    if (fallbackMatch) {
      const rawPrice = fallbackMatch[0];
      const numericString = rawPrice.replace(/[^\d]/g, '');
      return res.json({ success: true, price: parseInt(numericString, 10), formatted: rawPrice, source: 'FNC Fallback' });
    }

    res.json({ success: false, message: 'Precio no encontrado en el HTML' });

  } catch (error) {
    console.error('Error scraping FNC:', error);
    res.status(500).json({ success: false, error: 'Error obteniendo precio externo' });
  }
});

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
});

// Debug endpoint to check superadmin status
app.get('/api/debug-auth', async (req, res) => {
  try {
    const emailToTest = 'ssalazarc84@gmail.com';
    const passwordToTest = 'ssc841209';
    
    const admin = await prisma.adminUser.findUnique({
      where: { email: emailToTest }
    });
    
    let passwordMatch = false;
    if (admin) {
      passwordMatch = await bcrypt.compare(passwordToTest, admin.password_hash);
    }
    
    // Check if there are other users with similar email
    const allAdmins = await prisma.adminUser.findMany({
      select: { email: true, is_active: true, is_super_admin: true }
    });
    
    res.json({
      exists: !!admin,
      email: admin ? admin.email : 'not found',
      is_super_admin: admin ? admin.is_super_admin : false,
      is_active: admin ? admin.is_active : false,
      manual_password_check: passwordMatch ? "MATCH" : "FAIL",
      all_admins_summary: allAdmins,
      database_url_defined: !!process.env.DATABASE_URL,
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(500).json({ error: error.message, stack: error.stack });
  }
});

// Ruta principal mejorada con logging detallado
app.get('/api', (req, res) => {
  try {
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

// Login de caficultor
// Login unificado
const authController = require('./controllers/authController.cjs');
app.post('/api/auth/login', validateRequest({
  required: ['password'],
  minLength: { password: 6 }
}), asyncErrorHandler(authController.loginUnified));

// Alias para admin login (compatible con adminApiService)
app.post('/api/auth/admin/login', validateRequest({
  required: ['password'],
  minLength: { password: 6 }
}), asyncErrorHandler(authController.loginUnified));

// Registro de caficultor (Migrado a Prisma)
app.post('/api/auth/register', validateRequest({
  required: ['email', 'password'],
  email: ['email'],
  minLength: { password: 6 }
}), asyncErrorHandler(authController.register));

// Admin login handler reusing same logic if needed, or redirecting to main login

// Rutas de administración (eliminados login handlers duplicados)
app.post('/api/admin/auth/logout', (req, res) => res.json({ success: true }));
app.post('/api/auth/admin/logout', (req, res) => res.json({ success: true }));

app.get('/api/admin/me', (req, res) => res.json({ id: 'admin', role: 'super_admin' })); // Mock


// Routers
// Routers
const statsRoutes = require('./routes/admin/analytics.cjs');
app.use('/api/admin/analytics', statsRoutes);

// Dashboard route for Coffee Growers (General Dashboard)
const growerDashboardRoutes = require('./routes/grower-dashboard.cjs');
app.use('/api/dashboard', growerDashboardRoutes);

// Workers route for Coffee Growers
const workersRoutes = require('./routes/workers.cjs');
app.use('/api/workers', workersRoutes);

// Alerts route
const alertsRoutes = require('./routes/alerts.cjs');
app.use('/api/alerts', alertsRoutes);

// AI route
const aiRoutes = require('./routes/ai.cjs');
app.use('/api/ai', aiRoutes);

const notificationsRoutes = require('./routes/notifications.cjs');
app.use('/api/notifications', notificationsRoutes);

const dashboardRoutes = require('./routes/admin/dashboard.cjs');
app.use('/api/admin/dashboard', dashboardRoutes);

const usersRoutes = require('./routes/admin/users.cjs');
app.use('/api/admin/users', usersRoutes);

const growersRoutes = require('./routes/admin/coffee-growers.cjs');
app.use('/api/admin/coffee-growers', growersRoutes);

const farmsRoutes = require('./routes/admin/farms.cjs');
app.use('/api/admin/farms', farmsRoutes);

const paymentsRoutes = require('./routes/admin/payments.cjs');
app.use('/api/admin/payments', paymentsRoutes);

const subscriptionsRoutes = require('./routes/admin/subscriptions.cjs');
app.use('/api/admin/subscriptions', subscriptionsRoutes);

const plansRoutes = require('./routes/admin/subscription-plans.cjs');
app.use('/api/admin/subscription-plans', plansRoutes);

const reportsRoutes = require('./routes/admin/reports.cjs');
app.use('/api/admin/reports', reportsRoutes);

// Market Prices Route (Sync)
const marketPricesRoutes = require('./routes/market-prices.cjs');
app.use('/api/market-prices', marketPricesRoutes);

const settingsRoutes = require('./routes/admin/settings.cjs');
app.use('/api/admin/settings', settingsRoutes);

const securityRoutes = require('./routes/admin/security.cjs');
app.use('/api/admin/security', securityRoutes);

const auditRoutes = require('./routes/admin/audit.cjs');
app.use('/api/admin/audit', auditRoutes);

const profileRoutes = require('./routes/admin/profile.cjs');
app.use('/api/admin/profile', profileRoutes);

// SPA Catch-all (after all API routes)
if (fs.existsSync(distPath)) {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Api route not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 GLOBAL ERROR HANDLER TRIGGERED:');
  console.error('Error name:', err.name);
  console.error('Error message:', err.message);
  console.error('Error stack:', err.stack);
  console.error('Request URL:', req.url);
  console.error('Request method:', req.method);
  console.error('Request path:', req.path);

  // Check if CORS error
  if (err.message && err.message.includes('CORS')) {
    console.error('⚠️ CORS ERROR DETECTED');
    return res.status(403).json({ error: 'CORS policy error', message: err.message });
  }

  res.status(500).json({ error: 'Internal Server Error', message: err.message, stack: process.env.NODE_ENV === 'development' ? err.stack : undefined });
});

/**
 * Asegura que el superadministrador Santiago Salazar esté configurado (Coolify Auto-Bootstrap)
 */
async function ensureSuperAdminConfig() {
  const superadminEmail = 'ssalazarc84@gmail.com';
  const plainPassword = 'ssc841209';

  try {
    // Generar hash en tiempo de ejecución para asegurar compatibilidad total
    const passwordHash = await bcrypt.hash(plainPassword, 10);
    
    const admin = await prisma.adminUser.findUnique({
      where: { email: superadminEmail }
    });

    if (!admin) {
      await prisma.adminUser.create({
        data: {
          email: superadminEmail,
          password_hash: passwordHash,
          name: 'Santiago Salazar',
          is_super_admin: true,
          is_active: true
        }
      });
      console.log(`✅ Bootstrapping: Superadmin ${superadminEmail} creado satisfactoriamente.`);
    } else {
      // Forzar actualización de password_hash para corregir cualquier discrepancia previa
      await prisma.adminUser.update({
        where: { email: superadminEmail },
        data: {
          password_hash: passwordHash,
          is_super_admin: true,
          is_active: true
        }
      });
      console.log(`✅ Bootstrapping: Credenciales de Superadmin ${superadminEmail} REESTABLECIDAS correctamente.`);
    }
  } catch (error) {
    console.error(`❌ Error en bootstrap de superadmin:`, error.message);
  }
}

// Start Server
app.listen(PORT, '0.0.0.0', async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV}`);
  
  // Ejecutar bootstrap de superadmin
  await ensureSuperAdminConfig();
  // Sembrar planes iniciales si no existen
  await seedSubscriptionPlans();
  // Sembrar configuraciones iniciales si no existen
  await seedSystemSettings();
});

/**
 * Siembra los planes de suscripción básicos si la tabla está vacía
 */
async function seedSubscriptionPlans() {
  try {
    const count = await prisma.subscriptionPlan.count();
    if (count === 0) {
      await prisma.subscriptionPlan.createMany({
        data: [
          {
            name: 'Plan Básico',
            description: 'Ideal para pequeños caficultores',
            price: 30000,
            currency: 'COP',
            interval: 'month',
            features: JSON.stringify(['Hasta 2 fincas', 'Reportes básicos', 'Soporte por email']),
            isActive: true
          },
          {
            name: 'Plan Pro',
            description: 'Para caficultores profesionales',
            price: 50000,
            currency: 'COP',
            interval: 'month',
            features: JSON.stringify(['Hasta 5 fincas', 'Reportes avanzados', 'Soporte prioritario', 'Analíticas']),
            isActive: true
          }
        ]
      });
      console.log('✅ Bootstrapping: Planes de suscripción iniciales creados.');
    }
  } catch (error) {
    console.error('❌ Error sembrando planes de suscripción:', error.message);
  }
}

/**
 * Siembra las configuraciones básicas del sistema si la tabla está vacía
 */
async function seedSystemSettings() {
  try {
    const count = await prisma.systemSetting.count();
    if (count === 0) {
      await prisma.systemSetting.createMany({
        data: [
          { key: 'site_name', value: 'Café Colombia', section: 'general' },
          { key: 'contact_email', value: 'contacto@cafecolombia.site', section: 'general' },
          { key: 'currency', value: 'COP', section: 'general' },
          { key: 'password_min_length', value: '8', section: 'security' },
          { key: 'require_numbers', value: 'true', section: 'security' }
        ]
      });
      console.log('✅ Bootstrapping: Configuraciones del sistema iniciales creadas.');
    }
  } catch (error) {
    console.error('❌ Error sembrando configuraciones del sistema:', error.message);
  }
}

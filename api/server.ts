import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { testConnection } from './config/database.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';

// Importar todas las rutas
import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import coffeeGrowersRoutes from './routes/coffeeGrowers.js';
import farmsRoutes from './routes/farms.js';
import subscriptionPlansRoutes from './routes/subscriptionPlans.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import paymentsRoutes from './routes/payments.js';
import reportsRoutes from './routes/reports.js';
import auditRoutes from './routes/audit.js';
import settingsRoutes from './routes/settings.js';
import securityRoutes from './routes/security.js';
import dashboardRoutes from './routes/dashboard.js';
import aiRoutes from './routes/ai.js';

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
    ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5176', 'http://localhost:5177', 'http://localhost:4174'],
  credentials: process.env.CORS_CREDENTIALS === 'true' || true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Configuración de Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // límite de 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intenta de nuevo más tarde.',
    retryAfter: '15 minutos'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Saltar rate limiting para health/ping
    const path = req.path;
    const original = req.originalUrl;
    return (
      path === '/health' ||
      path === '/ping' ||
      original === '/api/health' ||
      original === '/api/ping'
    );
  }
});

// Middlewares globales
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(requestLogger);
app.use('/api', limiter);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Verificar conexión a la base de datos
    await testConnection();
    
    res.status(200).json({
      status: 'healthy',
      message: 'Servidor funcionando correctamente',
      timestamp: new Date().toISOString(),
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      database: 'connected'
    });
  } catch (error: any) {
    console.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      message: 'Error en la conexión a la base de datos',
      timestamp: new Date().toISOString(),
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Ping endpoint (respuesta rápida para monitoreo y diagnósticos)
app.get('/api/ping', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'pong',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Endpoint de información de la API
app.get('/api', (req, res) => {
  res.json({
    message: 'Café Colombia API Server',
    version: process.env.APP_VERSION || '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      ping: '/api/ping',
      auth: '/api/auth',
      users: '/api/users',
      coffeeGrowers: '/api/coffee-growers',
      farms: '/api/farms',
      subscriptionPlans: '/api/subscription-plans',
      subscriptions: '/api/subscriptions',
      payments: '/api/payments',
      reports: '/api/reports',
      audit: '/api/audit',
      settings: '/api/settings',
      security: '/api/security',
      dashboard: '/api/dashboard'
      , ai: '/api/ai'
    }
  });
});

// Configurar rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/coffee-growers', coffeeGrowersRoutes);
app.use('/api/farms', farmsRoutes);
app.use('/api/subscription-plans', subscriptionPlansRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);

// Middleware para rutas no encontradas
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    message: `La ruta ${req.originalUrl} no existe`,
    timestamp: new Date().toISOString()
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Función para inicializar el servidor
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    console.log('🔍 Verificando conexión a la base de datos...');
    await testConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');

    // Iniciar el servidor
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor iniciado en puerto ${PORT}`);
<<<<<<< HEAD
      console.log(`📍 API disponible en: http://0.0.0.0:${PORT}/api`);
      console.log(`🏥 Health check: http://0.0.0.0:${PORT}/api/health`);
=======
      console.log(`📍 API disponible en: http://localhost:${PORT}/api`);
      console.log(`🏥 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔔 Ping: http://localhost:${PORT}/api/ping`);
>>>>>>> f33fbe9a86f68dc9ab07d6cb1473b463841ee9ad
      console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Base de datos: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`);
    });

  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    console.error('💡 Verifica la configuración de la base de datos en el archivo .env');
    process.exit(1);
  }
}

// Manejo de errores no capturados
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 SIGINT recibido, cerrando servidor...');
  process.exit(0);
});

// Iniciar el servidor
startServer();

export default app;
/**
 * This is a API server for CaféColombia App
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import path from 'path'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'

// Importar middlewares de seguridad
import { 
  apiLimiter, 
  corsHandler, 
  requestLogger, 
  validateContentType,
  sanitizeHeaders,
  validatePayloadSize 
} from './middleware/security'
import { errorHandler, notFoundHandler } from './middleware/errorHandler'

// Importar configuración de base de datos
import { connectDatabase, checkDatabaseHealth } from './lib/database'

// Importar rutas
import authRoutes from './routes/auth'
import farmRoutes from './routes/farms'
import lotRoutes from './routes/lots'
import inventoryRoutes from './routes/inventory'
import taskRoutes from './routes/tasks'
import harvestRoutes from './routes/harvests'
import pestRoutes from './routes/pests'
import financeRoutes from './routes/finance'
import reportRoutes from './routes/reports'
import alertsRoutes from './routes/alerts'
import aiRoutes from './routes/ai'
import { traceabilityRouter, publicTraceabilityRouter } from './routes/traceability'

// for esm mode
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// load env
dotenv.config()

const app: express.Application = express()

// Conectar a la base de datos
connectDatabase()

// Middlewares de seguridad
app.use(requestLogger)
app.use(sanitizeHeaders)
app.use(corsHandler)
app.use(apiLimiter)
app.use(validatePayloadSize())
app.use(validateContentType)

// Middlewares de Express
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/farms', farmRoutes)
app.use('/api/lots', lotRoutes)
app.use('/api/inventory', inventoryRoutes)
app.use('/api/tasks', taskRoutes)
app.use('/api/harvests', harvestRoutes)
app.use('/api/pests', pestRoutes)
app.use('/api/finance', financeRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/alerts', alertsRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/traceability', traceabilityRouter)

// Rutas públicas (sin autenticación)
app.use('/api/traceability', publicTraceabilityRouter)

/**
 * Health check endpoint
 */
app.get('/api/health', async (req: Request, res: Response) => {
  const dbHealth = await checkDatabaseHealth()
  
  res.status(dbHealth.status === 'healthy' ? 200 : 503).json({
    status: dbHealth.status,
    message: dbHealth.message,
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  })
})

/**
 * Root endpoint
 */
app.get('/api', (req: Request, res: Response) => {
  res.json({
    message: 'CaféColombia API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      farms: '/api/farms',
      lots: '/api/lots',
      inventory: '/api/inventory',
      tasks: '/api/tasks',
      harvests: '/api/harvests',
      pests: '/api/pests',
      finance: '/api/finance',
      reports: '/api/reports',
      alerts: '/api/alerts',
      ai: '/api/ai',
      traceability: '/api/traceability',
      health: '/api/health',
    }
  })
})

// Middleware para rutas no encontradas
app.use(notFoundHandler)

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler)

export default app

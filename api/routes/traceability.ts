import express from 'express';
import {
  getMicrolots,
  getMicrolotById,
  createMicrolot,
  updateMicrolotStatus,
  createQualityControl,
  createTraceabilityEvent,
  createCertification,
  getPublicMicrolotInfo,
  getTraceabilityStats
} from '../controllers/traceabilityController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Rutas protegidas (requieren autenticación)
router.use(authenticateToken);

// Gestión de microlotes
router.get('/microlots', getMicrolots);
router.get('/microlots/:id', getMicrolotById);
router.post('/microlots', createMicrolot);
router.patch('/microlots/:id/status', updateMicrolotStatus);

// Control de calidad
router.post('/quality-control', createQualityControl);

// Eventos de trazabilidad
router.post('/events', createTraceabilityEvent);

// Certificaciones
router.post('/certifications', createCertification);

// Estadísticas
router.get('/stats', getTraceabilityStats);

// Rutas públicas (sin autenticación)
const publicRouter = express.Router();

// Información pública por código QR
publicRouter.get('/public/:code', getPublicMicrolotInfo);

export { router as traceabilityRouter, publicRouter as publicTraceabilityRouter };
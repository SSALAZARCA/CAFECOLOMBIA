import express from 'express';
import { executeQuery } from '../config/database';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Placeholder para rutas de planes de suscripción
router.get('/', authenticateToken, async (req, res) => {
  res.json({
    success: true,
    message: 'Endpoint de planes de suscripción disponible'
  });
});

export default router;
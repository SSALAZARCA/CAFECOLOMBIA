import express from 'express';
import adminRoutes from './admin/index.js';
import authRoutes from './auth.js';
import farmsRoutes from './farms.js';
import financeRoutes from './finance.js';
import harvestsRoutes from './harvests.js';
import inventoryRoutes from './inventory.js';
import lotsRoutes from './lots.js';
import pestsRoutes from './pests.js';
import reportsRoutes from './reports.js';
import tasksRoutes from './tasks.js';
import traceabilityRoutes from './traceability.js';

const router = express.Router();

// Rutas administrativas
router.use('/admin', adminRoutes);

// Rutas de la aplicación principal
router.use('/auth', authRoutes);
router.use('/farms', farmsRoutes);
router.use('/finance', financeRoutes);
router.use('/harvests', harvestsRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/lots', lotsRoutes);
router.use('/pests', pestsRoutes);
router.use('/reports', reportsRoutes);
router.use('/tasks', tasksRoutes);
router.use('/traceability', traceabilityRoutes);

export default router;
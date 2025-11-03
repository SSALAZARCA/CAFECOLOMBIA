import express from 'express';
import authRoutes from './auth.js';
import usersRoutes from './users.js';
import coffeeGrowersRoutes from './coffeeGrowers.js';
import farmsRoutes from './farms.js';
import subscriptionPlansRoutes from './subscriptionPlans.js';
import subscriptionsRoutes from './subscriptions.js';
import paymentsRoutes from './payments.js';
import auditRoutes from './audit.js';
import subscriptionPlansRouter from './subscription-plans';
import dashboardRoutes from './dashboard.js';
import settingsRoutes from './settings.js';
import analyticsRoutes from './analytics.js';

const router = express.Router();

// Rutas de autenticación (no requieren autenticación previa)
router.use('/auth', authRoutes);

// Rutas protegidas (requieren autenticación)
router.use('/dashboard', dashboardRoutes);
router.use('/users', usersRoutes);
router.use('/coffee-growers', coffeeGrowersRoutes);
router.use('/farms', farmsRoutes);
router.use('/subscription-plans', subscriptionPlansRoutes);
router.use('/subscriptions', subscriptionsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/audit', auditRoutes);
router.use('/settings', settingsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/subscription-plans', subscriptionPlansRouter);

export default router;
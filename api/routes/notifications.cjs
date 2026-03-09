
const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const notificationController = require('../controllers/notificationController.cjs');

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware de autenticación
const verifyToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.status(401).json({ success: false, message: 'No autenticado' });
    if (!JWT_SECRET) return res.status(500).json({ success: false, message: 'Server configuration error: JWT_SECRET missing' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ success: false, message: 'Token inválido' });
    }
};

router.use(verifyToken);

router.get('/', notificationController.getNotifications);
router.post('/', notificationController.createNotification);
router.put('/:id/read', notificationController.markAsRead);
router.put('/read-all', notificationController.markAllAsRead);

module.exports = router;

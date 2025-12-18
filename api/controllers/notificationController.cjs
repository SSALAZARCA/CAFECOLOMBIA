
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const notificationController = {
    getNotifications: async (req, res) => {
        try {
            const userId = String(req.user.id);
            const { type, priority, isRead, limit = 20, offset = 0 } = req.query;

            const where = { userId };

            if (type) where.type = String(type);
            if (priority) where.priority = String(priority);
            if (isRead !== undefined) where.read = isRead === 'true';

            const notifications = await prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: Number(limit),
                skip: Number(offset),
            });

            const total = await prisma.notification.count({ where });
            const unreadCount = await prisma.notification.count({ where: { userId, read: false } });

            res.json({
                success: true,
                data: notifications,
                total,
                unreadCount,
                limit: Number(limit),
                offset: Number(offset),
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    markAsRead: async (req, res) => {
        try {
            const { id } = req.params;
            const userId = String(req.user.id);

            const notification = await prisma.notification.findFirst({
                where: { id: Number(id), userId },
            });

            if (!notification) {
                return res.status(404).json({ success: false, error: 'Notification not found' });
            }

            const updated = await prisma.notification.update({
                where: { id: Number(id) },
                data: { read: true },
            });

            res.json({ success: true, data: updated });
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    markAllAsRead: async (req, res) => {
        try {
            const userId = String(req.user.id);

            const result = await prisma.notification.updateMany({
                where: { userId, read: false },
                data: { read: true },
            });

            res.json({
                success: true,
                message: `${result.count} notifications marked as read`,
                count: result.count
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    },

    createNotification: async (req, res) => {
        try {
            const { userId, type, agentType, title, message, priority, data } = req.body;
            // Note: userId might be passed in body for system events, or inferred from auth if user triggers it.
            // For system events (AI), userId is required in body.

            if (!userId || !type || !title || !message) {
                return res.status(400).json({ success: false, error: 'Missing required fields' });
            }

            const notification = await prisma.notification.create({
                data: {
                    userId: String(userId),
                    type,
                    agentType: agentType || 'system',
                    title,
                    message,
                    priority: priority || 'low',
                    data: data ? JSON.stringify(data) : null,
                }
            });

            res.status(201).json({ success: true, data: notification });
        } catch (error) {
            console.error('Error creating notification:', error);
            res.status(500).json({ success: false, error: 'Internal server error' });
        }
    }
};

module.exports = notificationController;

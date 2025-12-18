
import { Request, Response } from 'express';
import { prisma } from '../../prisma/client';
import { z } from 'zod';

export const getNotifications = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;
        if (!userId) {
            return res.status(401).json({ success: false, error: 'Unauthorized' });
        }

        const { type, priority, isRead, limit = "20", offset = "0" } = req.query;

        const where: any = { userId };

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
};

export const markAsRead = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = (req as any).user?.id;

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
};

export const markAllAsRead = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user?.id;

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
};

export const createNotification = async (req: Request, res: Response) => {
    try {
        const { userId, type, agentType, title, message, priority, data } = req.body;

        // Basic validation
        if (!userId || !type || !title || !message) {
            return res.status(400).json({ success: false, error: 'Missing required fields' });
        }

        const notification = await prisma.notification.create({
            data: {
                userId,
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

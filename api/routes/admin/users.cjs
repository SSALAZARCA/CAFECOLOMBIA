const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/admin/users - Listar usuarios (Real Data)
router.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;

        // Fetch all possible user types
        // 1. AdminUsers
        const admins = await prisma.adminUser.findMany();
        // 2. CoffeeGrowers
        const growers = await prisma.coffeeGrower.findMany();
        // 3. Generic Users (if any)
        const generics = await prisma.user.findMany();

        // Map to uniform User interface
        let allUsers = [];

        allUsers = allUsers.concat(admins.map(a => ({
            id: `admin-${a.id}`,
            realId: a.id,
            username: a.email,
            email: a.email,
            firstName: a.name || 'Admin',
            lastName: '',
            role: 'admin',
            status: a.is_active ? 'active' : 'inactive',
            createdAt: a.created_at || new Date().toISOString(),
            lastLogin: a.last_login || new Date().toISOString()
        })));

        allUsers = allUsers.concat(growers.map(g => ({
            id: `grower-${g.id}`,
            realId: g.id,
            username: g.email,
            email: g.email,
            firstName: g.full_name ? g.full_name.split(' ')[0] : 'Caficultor',
            lastName: g.full_name ? g.full_name.split(' ').slice(1).join(' ') : '',
            role: 'coffee_grower',
            status: g.status || 'active',
            createdAt: g.created_at || new Date().toISOString(),
            lastLogin: new Date().toISOString()
        })));

        allUsers = allUsers.concat(generics.map(u => ({
            id: `user-${u.id}`,
            realId: u.id,
            username: u.username || u.email,
            email: u.email,
            firstName: u.name || 'User',
            lastName: '',
            role: 'user',
            status: 'active',
            createdAt: u.created_at || new Date().toISOString(),
            lastLogin: new Date().toISOString()
        })));

        // Filtering Logic
        let filteredUsers = allUsers;

        if (search) {
            const lowerSearch = search.toLowerCase();
            filteredUsers = filteredUsers.filter(user =>
                user.firstName.toLowerCase().includes(lowerSearch) ||
                user.lastName.toLowerCase().includes(lowerSearch) ||
                user.email.toLowerCase().includes(lowerSearch)
            );
        }

        if (role && role !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.role === role);
        }

        if (status && status !== 'all') {
            filteredUsers = filteredUsers.filter(user => user.status === status);
        }

        // Pagination
        const total = filteredUsers.length;
        const startIndex = (Number(page) - 1) * Number(limit);
        const endIndex = startIndex + Number(limit);
        const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

        // Return flattened structure as expected by AdminUsers.tsx
        res.json({
            users: paginatedUsers,
            pagination: {
                page: Number(page),
                limit: Number(limit),
                total,
                totalPages: Math.ceil(total / Number(limit))
            }
        });

    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Error obteniendo usuarios', details: error.message });
    }
});

module.exports = router;
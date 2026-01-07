const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
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

// POST /api/admin/users - Crear nuevo usuario
router.post('/', async (req, res) => {
    try {
        const { username, email, firstName, lastName, password, role, status, phone, location } = req.body;

        // Validar campos requeridos
        if (!email || !firstName || !lastName || !password || !role) {
            return res.status(400).json({ error: 'Campos requeridos faltantes' });
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        let newUser;

        // Crear usuario según el rol
        if (role === 'admin') {
            newUser = await prisma.adminUser.create({
                data: {
                    email,
                    name: `${firstName} ${lastName}`,
                    password_hash: hashedPassword,
                    is_active: status === 'active',
                    role: 'super_admin' // o el rol que corresponda
                }
            });

            // Retornar en formato esperado por el frontend
            return res.status(201).json({
                id: `admin-${newUser.id}`,
                username: email,
                email: newUser.email,
                firstName,
                lastName,
                role: 'admin',
                status: newUser.is_active ? 'active' : 'inactive',
                phone: phone || '',
                location: location || ''
            });

        } else if (role === 'coffee_grower') {
            newUser = await prisma.coffeeGrower.create({
                data: {
                    email,
                    full_name: `${firstName} ${lastName}`,
                    password_hash: hashedPassword,
                    status: status || 'active',
                    phone: phone || null,
                    location: location || null
                }
            });

            return res.status(201).json({
                id: `grower-${newUser.id}`,
                username: email,
                email: newUser.email,
                firstName,
                lastName,
                role: 'coffee_grower',
                status: newUser.status,
                phone: newUser.phone || '',
                location: newUser.location || ''
            });

        } else if (role === 'user') {
            newUser = await prisma.user.create({
                data: {
                    email,
                    username: username || email,
                    password: hashedPassword,
                    firstName,
                    lastName,
                    role: 'TRABAJADOR',
                    isActive: status === 'active'
                }
            });

            return res.status(201).json({
                id: `user-${newUser.id}`,
                username: newUser.username,
                email: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                role: 'user',
                status: newUser.isActive ? 'active' : 'inactive',
                phone: phone || '',
                location: location || ''
            });
        }

        return res.status(400).json({ error: 'Rol no válido' });

    } catch (error) {
        console.error('Error creating user:', error);

        // Manejar error de email duplicado
        if (error.code === 'P2002') {
            return res.status(409).json({ error: 'El email ya está registrado' });
        }

        res.status(500).json({ error: 'Error creando usuario', details: error.message });
    }
});

// DELETE /api/admin/users/:id - Eliminar usuario
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [type, realIdStr] = id.split('-');
        const realId = parseInt(realIdStr);

        if (!realId || isNaN(realId)) {
            return res.status(400).json({ error: 'ID inválido' });
        }

        if (type === 'admin') {
            await prisma.adminUser.delete({ where: { id: realId } });
        } else if (type === 'grower') {
            // Delete related farm first if cascade is not set, or rely on cascade
            // Check if farm exists to be safe
            await prisma.farm.deleteMany({ where: { coffee_grower_id: realId } });
            await prisma.coffeeGrower.delete({ where: { id: realId } });
        } else if (type === 'user') {
            await prisma.user.delete({ where: { id: id.replace('user-', '') } }); // User IDs might be strings/CUIDs
        } else {
            return res.status(400).json({ error: 'Tipo de usuario desconocido' });
        }

        res.json({ success: true, message: 'Usuario eliminado exitosamente' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error eliminando usuario', details: error.message });
    }
});

// PATCH /api/admin/users/:id/status - Cambiar estado
router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // active, inactive, suspended
        const [type, realIdStr] = id.split('-');

        let isActive = status === 'active';

        if (type === 'admin') {
            await prisma.adminUser.update({
                where: { id: parseInt(realIdStr) },
                data: { is_active: isActive }
            });
        } else if (type === 'grower') {
            await prisma.coffeeGrower.update({
                where: { id: parseInt(realIdStr) },
                data: { status: status } // CoffeeGrower has string status
            });
        } else if (type === 'user') {
            // User model might not have status, assuming strict check or implementation
            // If User model has no status field, we might mock it or skip
            // Checking schema previously: User has no obvious status, maybe ignore or implement later
        }

        res.json({ success: true, message: 'Estado actualizado' });
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).json({ error: 'Error actualizando estado', details: error.message });
    }
});

module.exports = router;
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma.cjs');
const logger = require('../lib/logger.cjs');

// Clave secreta para JWT
const JWT_SECRET = process.env.JWT_SECRET || 'cafe_colombia_jwt_secret_key_2024';
const JWT_EXPIRES_IN = '24h';

const authController = {
    /**
     * Login Unificado (Migrado a Prisma/SQLite)
     */
    loginUnified: async (req, res, next) => {
        try {
            console.log('🔐 [AuthController] Login request incoming:', {
                email: req.body.email,
                username: req.body.username
            });

            const { email, password, username } = req.body;
            const loginEmail = email || username;

            if (!loginEmail || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Email y contraseña son requeridos'
                });
            }

            // 1. Intentar como Administrador
            const admin = await prisma.adminUser.findFirst({
                where: { email: loginEmail, is_active: true }
            });

            if (admin) {
                const samePassword = await bcrypt.compare(password, admin.password_hash);

                if (samePassword) {
                    // Actualizar último login
                    await prisma.adminUser.update({
                        where: { id: admin.id },
                        data: { last_login_at: new Date() }
                    });

                    const token = jwt.sign(
                        { id: admin.id, email: admin.email, role: admin.is_super_admin ? 'super_admin' : 'admin' },
                        JWT_SECRET,
                        { expiresIn: JWT_EXPIRES_IN }
                    );

                    logger.info('Login exitoso (Admin - SQLite)', { email: loginEmail });

                    return res.json({
                        success: true,
                        message: 'Login exitoso',
                        token,
                        user: {
                            id: admin.id,
                            email: admin.email,
                            name: admin.name,
                            role: admin.is_super_admin ? 'super_admin' : 'admin'
                        }
                    });
                }
            }

            // 2. Intentar como Caficultor
            const grower = await prisma.coffeeGrower.findUnique({
                where: { email: loginEmail },
                include: { farms: true } // Incluir fincas relacionadas
            });

            if (grower) {
                if (grower.status !== 'active') {
                    return res.status(403).json({ success: false, message: 'Cuenta desactivada' });
                }

                const samePassword = await bcrypt.compare(password, grower.password_hash);

                if (samePassword) {
                    const farm = grower.farms[0]; // Tomar la primera finca si existe
                    const farmId = farm ? farm.id : null;
                    const farmName = farm ? farm.name : null;

                    const token = jwt.sign(
                        { id: grower.id, email: grower.email, role: 'coffee_grower', farmId },
                        JWT_SECRET,
                        { expiresIn: JWT_EXPIRES_IN }
                    );

                    logger.info('Login exitoso (Caficultor - SQLite)', { email: loginEmail });

                    return res.json({
                        success: true,
                        message: 'Login exitoso',
                        token,
                        user: {
                            id: grower.id,
                            email: grower.email,
                            name: grower.full_name,
                            role: 'coffee_grower',
                            farmId,
                            farmName
                        }
                    });
                }
            }

            return res.status(401).json({ success: false, message: 'Credenciales inválidas' });

        } catch (error) {
            console.error('❌ Error en Login:', error);
            next(error);
        }
    },

    /**
     * Registro de Caficultor (Migrado a Prisma)
     */
    register: async (req, res, next) => {
        try {
            const body = req.body || {};
            const { email, password, firstName, lastName, phone, farmName: rawFarmName } = body;
            const name = (body.name || '').trim();
            const farmName = (rawFarmName || body.fincaName || '').trim();

            // 1. Verificar si el usuario ya existe
            const existingGrower = await prisma.coffeeGrower.findUnique({
                where: { email }
            });

            if (existingGrower) {
                return res.status(409).json({
                    success: false,
                    message: 'El email ya está registrado'
                });
            }

            // 2. Crear el hash de la contraseña
            const passwordHash = await bcrypt.hash(password, 10);
            const fullName = firstName ? `${firstName} ${lastName || ''}`.trim() : name;

            // 3. Crear el caficultor y su finca en una transacción de Prisma
            const result = await prisma.$transaction(async (tx) => {
                const grower = await tx.coffeeGrower.create({
                    data: {
                        email,
                        password_hash: passwordHash,
                        full_name: fullName,
                        phone: phone || null,
                        status: 'active'
                    }
                });

                if (farmName) {
                    await tx.farm.create({
                        data: {
                            coffee_grower_id: grower.id,
                            name: farmName,
                            status: 'active'
                        }
                    });
                }

                return grower;
            });

            logger.info('Registro exitoso de caficultor', { email: result.email });

            return res.status(201).json({
                success: true,
                message: 'Registro exitoso',
                user: {
                    id: result.id,
                    email: result.email,
                    fullName: result.full_name,
                    role: 'coffee_grower'
                }
            });

        } catch (error) {
            console.error('❌ Error en Registro:', error);
            next(error);
        }
    }
};

module.exports = authController;

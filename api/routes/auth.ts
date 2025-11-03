import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import { executeQuery, executeTransaction } from '../config/database.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Interfaz para datos de login
interface LoginData {
  email: string;
  password: string;
  twoFactorCode?: string;
}

// Interfaz para datos de registro
interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role?: string;
}

// Interfaz para datos de registro de caficultor
interface CoffeeGrowerRegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  farmName: string;
  farmLocation: {
    department: string;
    municipality: string;
    address: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  farmSize: number; // hectáreas
  coffeeVarieties: string[];
  certifications?: string[];
  experience: number; // años
}

// Registro de caficultor
router.post('/register', asyncHandler(async (req, res) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    farmName,
    farmLocation,
    farmSize,
    coffeeVarieties,
    certifications = [],
    experience
  }: CoffeeGrowerRegisterData = req.body;

  // Validaciones básicas
  if (!email || !password || !firstName || !lastName || !phone || !farmName || !farmLocation) {
    throw createError('Todos los campos obligatorios deben ser completados', 400);
  }

  if (password.length < 8) {
    throw createError('La contraseña debe tener al menos 8 caracteres', 400);
  }

  if (!farmLocation.department || !farmLocation.municipality || !farmLocation.address) {
    throw createError('La ubicación de la finca debe incluir departamento, municipio y dirección', 400);
  }

  if (farmSize <= 0) {
    throw createError('El tamaño de la finca debe ser mayor a 0 hectáreas', 400);
  }

  if (!coffeeVarieties || coffeeVarieties.length === 0) {
    throw createError('Debe especificar al menos una variedad de café', 400);
  }

  // Verificar si el email ya existe
  const [existingUsers] = await executeQuery(
    'SELECT id FROM coffee_growers WHERE email = ?',
    [email]
  ) as any[];

  if (existingUsers && existingUsers.length > 0) {
    throw createError('El email ya está registrado', 409);
  }

  // Hash de la contraseña
  const passwordHash = await bcrypt.hash(password, 12);

  // Usar transacción para crear caficultor y finca
  await executeTransaction(async (connection) => {
    // Crear caficultor
    const [coffeeGrowerResult] = await connection.execute(
      `INSERT INTO coffee_growers (
        email, password_hash, first_name, last_name, phone, 
        experience_years, is_active, email_verified, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, true, false, NOW())`,
      [email, passwordHash, firstName, lastName, phone, experience]
    ) as any;

    const coffeeGrowerId = coffeeGrowerResult.insertId;

    // Crear finca principal
    const [farmResult] = await connection.execute(
      `INSERT INTO farms (
        coffee_grower_id, name, location_department, location_municipality, 
        location_address, total_area_hectares, is_active, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, true, NOW())`,
      [
        coffeeGrowerId,
        farmName,
        farmLocation.department,
        farmLocation.municipality,
        farmLocation.address,
        farmSize
      ]
    ) as any;

    const farmId = farmResult.insertId;

    // Agregar coordenadas si están disponibles
    if (farmLocation.coordinates) {
      await connection.execute(
        'UPDATE farms SET latitude = ?, longitude = ? WHERE id = ?',
        [farmLocation.coordinates.latitude, farmLocation.coordinates.longitude, farmId]
      );
    }

    // Agregar variedades de café
    for (const variety of coffeeVarieties) {
      await connection.execute(
        `INSERT INTO farm_coffee_varieties (farm_id, variety_name, created_at) 
         VALUES (?, ?, NOW())`,
        [farmId, variety]
      );
    }

    // Agregar certificaciones si existen
    for (const certification of certifications) {
      await connection.execute(
        `INSERT INTO farm_certifications (farm_id, certification_name, status, created_at) 
         VALUES (?, ?, 'active', NOW())`,
        [farmId, certification]
      );
    }

    // Log de auditoría
    await connection.execute(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
       VALUES (?, 'register', 'coffee_grower', ?, ?, ?)`,
      [
        coffeeGrowerId,
        'coffee_grower_registration',
        coffeeGrowerId,
        JSON.stringify({ email, farmName, farmSize }),
        req.ip
      ]
    );
  });

  res.status(201).json({
    message: 'Registro exitoso. Por favor verifica tu email para activar tu cuenta.',
    user: {
      email,
      firstName,
      lastName,
      farmName
    }
  });
}));

// Login de caficultor
router.post('/login', asyncHandler(async (req, res) => {
  const { email, password }: LoginData = req.body;

  if (!email || !password) {
    throw createError('Email y contraseña son requeridos', 400);
  }

  // Buscar caficultor
  const [users] = await executeQuery(
    `SELECT cg.id, cg.email, cg.password_hash, cg.first_name, cg.last_name, 
     cg.is_active, cg.email_verified, cg.failed_login_attempts, cg.locked_until, 
     cg.last_login, f.id as farm_id, f.name as farm_name
     FROM coffee_growers cg
     LEFT JOIN farms f ON cg.id = f.coffee_grower_id AND f.is_active = true
     WHERE cg.email = ?`,
    [email]
  ) as any[];

  if (!users || users.length === 0) {
    throw createError('Credenciales inválidas', 401);
  }

  const user = users[0];

  // Verificar si la cuenta está activa
  if (!user.is_active) {
    throw createError('Cuenta desactivada. Contacta al administrador.', 401);
  }

  // Verificar si el email está verificado
  if (!user.email_verified) {
    throw createError('Email no verificado. Revisa tu bandeja de entrada.', 401);
  }

  // Verificar si la cuenta está bloqueada
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw createError('Cuenta temporalmente bloqueada por múltiples intentos fallidos', 423);
  }

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    // Incrementar intentos fallidos
    await executeQuery(
      `UPDATE coffee_growers SET 
       failed_login_attempts = failed_login_attempts + 1,
       locked_until = CASE 
         WHEN failed_login_attempts >= 4 THEN DATE_ADD(NOW(), INTERVAL 15 MINUTE)
         ELSE locked_until
       END
       WHERE id = ?`,
      [user.id]
    );

    throw createError('Credenciales inválidas', 401);
  }

  // Generar JWT
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError('Configuración de JWT no encontrada', 500);
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: 'coffee_grower',
      farmId: user.farm_id
    },
    jwtSecret,
    { expiresIn: '7d' }
  );

  // Actualizar último login y resetear intentos fallidos
  await executeQuery(
    `UPDATE coffee_growers SET 
     last_login = NOW(),
     failed_login_attempts = 0,
     locked_until = NULL
     WHERE id = ?`,
    [user.id]
  );

  // Log de auditoría
  await executeQuery(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, 'login', 'coffee_grower', ?, ?, ?)`,
    [
      user.id,
      'coffee_grower_login',
      user.id,
      JSON.stringify({ email: user.email, farmId: user.farm_id }),
      req.ip
    ]
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: 'coffee_grower',
      farmId: user.farm_id,
      farmName: user.farm_name
    },
    expiresIn: '7d'
  });
}));

// Verificar token de caficultor
router.get('/verify', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const user = req.user!;
  
  // Si es caficultor, obtener información de la finca
  if (user.role === 'coffee_grower') {
    const [farms] = await executeQuery(
      'SELECT id, name FROM farms WHERE coffee_grower_id = ? AND is_active = true',
      [user.id]
    ) as any[];

    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        farmId: farms[0]?.id,
        farmName: farms[0]?.name
      },
      valid: true
    });
  } else {
    // Para administradores, usar la lógica existente
    const permissions = await getUserPermissions(user.role);
    res.json({
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions
      },
      valid: true
    });
  }
}));

// Login de administrador
router.post('/admin/login', asyncHandler(async (req, res) => {
  const { email, password, twoFactorCode }: LoginData = req.body;

  if (!email || !password) {
    throw createError('Email y contraseña son requeridos', 400);
  }

  // Buscar usuario administrador
  const [users] = await executeQuery(
    `SELECT id, email, password_hash, role, is_active, two_factor_enabled, 
     two_factor_secret, failed_login_attempts, locked_until, last_login
     FROM admin_users WHERE email = ?`,
    [email]
  ) as any[];

  if (!users || users.length === 0) {
    throw createError('Credenciales inválidas', 401);
  }

  const user = users[0];

  // Verificar si la cuenta está activa
  if (!user.is_active) {
    throw createError('Cuenta desactivada', 401);
  }

  // Verificar si la cuenta está bloqueada
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    throw createError('Cuenta temporalmente bloqueada', 423);
  }

  // Verificar contraseña
  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  if (!isValidPassword) {
    // Incrementar intentos fallidos
    await executeQuery(
      `UPDATE admin_users SET 
       failed_login_attempts = failed_login_attempts + 1,
       locked_until = CASE 
         WHEN failed_login_attempts >= 4 THEN DATE_ADD(NOW(), INTERVAL 15 MINUTE)
         ELSE locked_until
       END
       WHERE id = ?`,
      [user.id]
    );

    throw createError('Credenciales inválidas', 401);
  }

  // Verificar 2FA si está habilitado
  if (user.two_factor_enabled) {
    if (!twoFactorCode) {
      return res.json({
        requiresTwoFactor: true,
        message: 'Código de autenticación de dos factores requerido'
      });
    }

    const isValid2FA = speakeasy.totp.verify({
      secret: user.two_factor_secret,
      encoding: 'base32',
      token: twoFactorCode,
      window: 2
    });

    if (!isValid2FA) {
      throw createError('Código de autenticación inválido', 401);
    }
  }

  // Obtener permisos del usuario
  const permissions = await getUserPermissions(user.role);

  // Generar JWT
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw createError('Configuración de JWT no encontrada', 500);
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions
    },
    jwtSecret,
    { expiresIn: '24h' }
  );

  // Actualizar último login y resetear intentos fallidos
  await executeQuery(
    `UPDATE admin_users SET 
     last_login = NOW(),
     failed_login_attempts = 0,
     locked_until = NULL
     WHERE id = ?`,
    [user.id]
  );

  // Crear sesión
  await executeQuery(
    `INSERT INTO admin_sessions (user_id, token_hash, expires_at, ip_address, user_agent)
     VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?, ?)`,
    [
      user.id,
      await bcrypt.hash(token, 10),
      req.ip,
      req.get('User-Agent') || 'Unknown'
    ]
  );

  // Log de auditoría
  await executeQuery(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, 'login', 'admin_user', ?, ?, ?)`,
    [
      user.id,
      'admin_login',
      user.id,
      JSON.stringify({ email: user.email, role: user.role }),
      req.ip
    ]
  );

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      permissions
    },
    expiresIn: '24h'
  });
}));

// Logout
router.post('/admin/logout', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (token) {
    // Invalidar sesión
    const tokenHash = await bcrypt.hash(token, 10);
    await executeQuery(
      'UPDATE admin_sessions SET is_active = false WHERE token_hash = ?',
      [tokenHash]
    );

    // Log de auditoría
    await executeQuery(
      `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
       VALUES (?, 'logout', 'admin_user', ?, ?, ?)`,
      [
        req.user!.id,
        'admin_logout',
        req.user!.id,
        JSON.stringify({ email: req.user!.email }),
        req.ip
      ]
    );
  }

  res.json({ message: 'Logout exitoso' });
}));

// Verificar token
router.get('/admin/verify', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const permissions = await getUserPermissions(req.user!.role);
  
  res.json({
    user: {
      id: req.user!.id,
      email: req.user!.email,
      role: req.user!.role,
      permissions
    },
    valid: true
  });
}));

// Configurar 2FA
router.post('/admin/2fa/setup', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const secret = speakeasy.generateSecret({
    name: `Café Colombia (${req.user!.email})`,
    issuer: 'Café Colombia'
  });

  // Guardar secret temporalmente (no activar hasta verificar)
  await executeQuery(
    'UPDATE admin_users SET two_factor_temp_secret = ? WHERE id = ?',
    [secret.base32, req.user!.id]
  );

  res.json({
    secret: secret.base32,
    qrCode: secret.otpauth_url,
    manualEntryKey: secret.base32
  });
}));

// Verificar y activar 2FA
router.post('/admin/2fa/verify', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { token } = req.body;

  if (!token) {
    throw createError('Token de verificación requerido', 400);
  }

  // Obtener secret temporal
  const [users] = await executeQuery(
    'SELECT two_factor_temp_secret FROM admin_users WHERE id = ?',
    [req.user!.id]
  ) as any[];

  if (!users || !users[0].two_factor_temp_secret) {
    throw createError('No hay configuración 2FA pendiente', 400);
  }

  const secret = users[0].two_factor_temp_secret;

  // Verificar token
  const isValid = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2
  });

  if (!isValid) {
    throw createError('Token de verificación inválido', 400);
  }

  // Activar 2FA
  await executeQuery(
    `UPDATE admin_users SET 
     two_factor_enabled = true,
     two_factor_secret = ?,
     two_factor_temp_secret = NULL
     WHERE id = ?`,
    [secret, req.user!.id]
  );

  // Log de auditoría
  await executeQuery(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, 'enable_2fa', 'admin_user', ?, ?, ?)`,
    [
      req.user!.id,
      'security_setting',
      req.user!.id,
      JSON.stringify({ action: 'enable_2fa' }),
      req.ip
    ]
  );

  res.json({ message: '2FA activado exitosamente' });
}));

// Desactivar 2FA
router.post('/admin/2fa/disable', authenticateToken, asyncHandler(async (req: AuthRequest, res) => {
  const { password, token } = req.body;

  if (!password || !token) {
    throw createError('Contraseña y token 2FA requeridos', 400);
  }

  // Verificar contraseña actual
  const [users] = await executeQuery(
    'SELECT password_hash, two_factor_secret FROM admin_users WHERE id = ?',
    [req.user!.id]
  ) as any[];

  if (!users || !users[0]) {
    throw createError('Usuario no encontrado', 404);
  }

  const isValidPassword = await bcrypt.compare(password, users[0].password_hash);
  if (!isValidPassword) {
    throw createError('Contraseña incorrecta', 401);
  }

  // Verificar token 2FA
  const isValid2FA = speakeasy.totp.verify({
    secret: users[0].two_factor_secret,
    encoding: 'base32',
    token,
    window: 2
  });

  if (!isValid2FA) {
    throw createError('Token 2FA inválido', 401);
  }

  // Desactivar 2FA
  await executeQuery(
    `UPDATE admin_users SET 
     two_factor_enabled = false,
     two_factor_secret = NULL
     WHERE id = ?`,
    [req.user!.id]
  );

  // Log de auditoría
  await executeQuery(
    `INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
     VALUES (?, 'disable_2fa', 'admin_user', ?, ?, ?)`,
    [
      req.user!.id,
      'security_setting',
      req.user!.id,
      JSON.stringify({ action: 'disable_2fa' }),
      req.ip
    ]
  );

  res.json({ message: '2FA desactivado exitosamente' });
}));

// Función auxiliar para obtener permisos
async function getUserPermissions(role: string): Promise<string[]> {
  // Definir permisos por rol (usando formato con dos puntos para coincidir con el frontend)
  const rolePermissions: Record<string, string[]> = {
    super_admin: [
      'dashboard:view', 'dashboard:analytics', 'users:view', 'users:create', 'users:edit', 'users:delete', 'users:export',
      'growers:view', 'growers:create', 'growers:edit', 'growers:delete', 'growers:export',
      'farms:view', 'farms:create', 'farms:edit', 'farms:delete', 'farms:export',
      'plans:view', 'plans:create', 'plans:edit', 'plans:delete',
      'subscriptions:view', 'subscriptions:create', 'subscriptions:edit', 'subscriptions:cancel', 'subscriptions:export',
      'payments:view', 'payments:refund', 'payments:export',
      'reports:view', 'reports:export', 'reports:analytics',
      'audit:view', 'audit:export',
      'security:view', 'security:manage', 'security:roles',
      'settings:view', 'settings:edit', 'settings:system'
    ],
    admin: [
      'dashboard:view', 'dashboard:analytics',
      'users:view', 'users:create', 'users:edit', 'users:export',
      'growers:view', 'growers:create', 'growers:edit', 'growers:export',
      'farms:view', 'farms:create', 'farms:edit', 'farms:export',
      'plans:view', 'plans:create', 'plans:edit',
      'subscriptions:view', 'subscriptions:create', 'subscriptions:edit', 'subscriptions:export',
      'payments:view', 'payments:export',
      'reports:view', 'reports:export',
      'audit:view',
      'settings:view'
    ],
    moderator: [
      'dashboard:view',
      'users:view',
      'growers:view',
      'farms:view',
      'plans:view',
      'subscriptions:view',
      'payments:view',
      'reports:view'
    ]
  };

  return rolePermissions[role] || [];
}

export default router;
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 3001;

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'srv1196.hstgr.io',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'u689528678_SSALAZARCA',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA',
  charset: 'utf8mb4',
  timezone: '+00:00',
  ssl: {
    rejectUnauthorized: false
  }
};

// Configuración de CORS
const corsOptions = {
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175', 'http://localhost:5176'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

// Middlewares
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware de logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Función para probar conexión a MySQL
async function testMySQLConnection() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1');
    await connection.end();
    return true;
  } catch (error) {
    console.error('Error conectando a MySQL:', error.message);
    return false;
  }
}

// Ruta de health check
app.get('/api/health', async (req, res) => {
  try {
    const mysqlConnected = await testMySQLConnection();
    
    const healthStatus = {
      status: mysqlConnected ? 'healthy' : 'degraded',
      message: 'Café Colombia API Server',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      services: {
        mysql: mysqlConnected ? 'connected' : 'disconnected',
        database: process.env.DB_NAME
      }
    };

    res.status(mysqlConnected ? 200 : 503).json(healthStatus);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking health',
      error: error.message
    });
  }
});

// Ruta principal de la API
app.get('/api', (req, res) => {
  res.json({
    message: 'Café Colombia API Server',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/api/health',
      auth: '/api/auth',
      admin: '/api/admin',
      dashboard: '/api/dashboard',
      alerts: '/api/alerts',
      ai: '/api/ai'
    },
    features: {
      smartAlerts: '/api/alerts/smart',
      aiAnalysis: '/api/ai/analysis/results',
      aiStatus: '/api/ai/status',
      alertsStats: '/api/alerts/stats'
    }
  });
});

// Rutas de autenticación básicas
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    // Conectar a la base de datos
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      // Primero buscar en admin_users
      const [adminUsers] = await connection.execute(
        'SELECT id, email, password_hash, name, is_super_admin, is_active FROM admin_users WHERE email = ? AND is_active = true',
        [email]
      );

      if (adminUsers.length > 0) {
        const user = adminUsers[0];
        // Para admin, verificar credenciales hardcodeadas por ahora
        if (email === 'admin@cafecolombia.com' && password === 'admin123') {
          await connection.end();
          return res.json({
            message: 'Login exitoso',
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: 'admin',
              is_super_admin: user.is_super_admin
            },
            token: 'admin-token-' + Date.now()
          });
        }
      }

      // Buscar en coffee_growers con password
      const [coffeeGrowers] = await connection.execute(
        'SELECT cg.id, cg.email, cg.password_hash, cg.full_name, f.id as farm_id, f.name as farm_name FROM coffee_growers cg LEFT JOIN farms f ON cg.id = f.coffee_grower_id WHERE cg.email = ? AND cg.status = "active"',
        [email]
      );

      if (coffeeGrowers.length > 0) {
        const grower = coffeeGrowers[0];
        // Para caficultores registrados, verificar password simple por ahora
        if (password === 'password123' && grower.password_hash === 'simple_hash_password123') {
          await connection.end();
          return res.json({
            message: 'Login exitoso',
            user: {
              id: grower.id,
              email: grower.email,
              name: grower.full_name,
              role: 'coffee_grower',
              farmId: grower.farm_id,
              farmName: grower.farm_name
            },
            token: 'grower-token-' + grower.email
          });
        }
      }

      await connection.end();
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });

    } catch (dbError) {
      await connection.end();
      throw dbError;
    }

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Ruta de login para administradores
app.post('/api/auth/admin/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        error: 'Email y contraseña son requeridos'
      });
    }

    // Conectar a la base de datos
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      // Buscar en admin_users
      const [adminUsers] = await connection.execute(
        'SELECT id, email, password_hash, name, is_super_admin, is_active FROM admin_users WHERE email = ? AND is_active = true',
        [email]
      );

      if (adminUsers.length > 0) {
        const user = adminUsers[0];
        // Para admin, verificar credenciales hardcodeadas por ahora
        if (email === 'admin@cafecolombiaapp.com' && password === 'admin123') {
          await connection.end();
          return res.json({
            message: 'Login exitoso',
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.is_super_admin ? 'super_admin' : 'admin'
            },
            token: 'admin-token-' + Date.now()
          });
        }
      }

      await connection.end();
      return res.status(401).json({
        error: 'Credenciales inválidas'
      });

    } catch (dbError) {
      await connection.end();
      throw dbError;
    }

  } catch (error) {
    console.error('Error en admin login:', error);
    res.status(500).json({
      error: 'Error interno del servidor'
    });
  }
});

// Ruta de registro para caficultores
app.post('/api/auth/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      farmName, 
      location, 
      farmSize, 
      altitude, 
      coffeeVariety, 
      phone 
    } = req.body;
    
    // Validaciones básicas
    if (!name || !email || !password || !farmName) {
      return res.status(400).json({
        error: 'Nombre, email, contraseña y nombre de finca son requeridos'
      });
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: 'Formato de email inválido'
      });
    }

    // Validar longitud de contraseña
    if (password.length < 6) {
      return res.status(400).json({
        error: 'La contraseña debe tener al menos 6 caracteres'
      });
    }

    // Conectar a la base de datos
    const connection = await mysql.createConnection(dbConfig);
    
    try {
      // Verificar si el email ya existe
      const [existingUsers] = await connection.execute(
        'SELECT id FROM coffee_growers WHERE email = ?',
        [email]
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          error: 'El email ya está registrado'
        });
      }

      // Obtener un admin_user válido para la clave foránea
      const [adminUsers] = await connection.execute(
        'SELECT id FROM admin_users LIMIT 1'
      );
      
      const adminUserId = adminUsers.length > 0 ? adminUsers[0].id : null;
      
      if (!adminUserId) {
        return res.status(500).json({
          error: 'Error de configuración del sistema'
        });
      }

      // Insertar nuevo caficultor
      const [result] = await connection.execute(
        `INSERT INTO coffee_growers 
         (identification_number, identification_type, full_name, email, phone, department, municipality, total_farm_area, coffee_area, preferred_varieties, status, created_by) 
         VALUES (?, 'cedula', ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?)`,
        [
          email.split('@')[0], // Usar parte del email como identificación temporal
          name, 
          email, 
          phone || null, 
          location ? location.split(',')[0] : 'No especificado',
          location ? location.split(',')[1] || 'No especificado' : 'No especificado',
          farmSize || null, 
          farmSize || null, 
          coffeeVariety || null,
          adminUserId
        ]
      );

      const userId = result.insertId;

      // Crear finca asociada si se proporcionaron datos
      if (farmSize || altitude || location) {
        await connection.execute(
          `INSERT INTO farms 
           (coffee_grower_id, name, address, department, municipality, total_area, coffee_area, altitude, irrigation_type, processing_method, certification_status, created_by) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'secano', 'lavado', 'no_certificada', ?)`,
          [
            userId, 
            farmName, 
            location || 'Dirección no especificada',
            location ? location.split(',')[0] : 'No especificado',
            location ? location.split(',')[1] || 'No especificado' : 'No especificado',
            farmSize || null, 
            farmSize || null, 
            altitude || null,
            adminUserId
          ]
        );
      }

      await connection.end();

      res.status(201).json({
        success: true,
        message: 'Caficultor registrado exitosamente',
        user: {
          id: userId,
          name,
          email,
          farmName,
          location,
          farmSize,
          altitude,
          coffeeVariety,
          phone
        }
      });

    } catch (dbError) {
      await connection.end();
      throw dbError;
    }

  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      error: 'Error interno del servidor',
      message: error.message
    });
  }
});

// Ruta para obtener información del usuario
app.get('/api/admin/me', (req, res) => {
  // Simulación de usuario autenticado
  res.json({
    id: 'admin-001',
    email: 'admin@cafecolombia.com',
    name: 'Administrador Principal',
    is_super_admin: true,
    is_active: true
  });
});

// Ruta para obtener estadísticas del dashboard
app.get('/api/admin/dashboard/stats', async (req, res) => {
  try {
    // Datos de ejemplo para evitar límites de conexión de BD
    res.json({
      users: 42,
      admins: 3,
      configurations: 15,
      lastUpdate: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas'
    });
  }
});

// Ruta para obtener datos de gráficos del dashboard
app.get('/admin/dashboard/charts', async (req, res) => {
  try {
    const period = req.query.period || '30d';
    
    // Datos de ejemplo para gráficos (sin conexión a BD para evitar límites)
    const chartData = {
      userGrowth: [
        { date: '2024-10-01', users: 10 },
        { date: '2024-10-15', users: 25 },
        { date: '2024-11-01', users: 45 }
      ],
      subscriptionDistribution: [
        { name: 'Básico', value: 30 },
        { name: 'Premium', value: 45 },
        { name: 'Enterprise', value: 25 }
      ],
      revenueData: [
        { month: 'Oct', revenue: 1200 },
        { month: 'Nov', revenue: 1800 }
      ],
      period: period,
      lastUpdate: new Date().toISOString()
    };
    
    res.json(chartData);

  } catch (error) {
    console.error('Error obteniendo datos de gráficos:', error);
    res.status(500).json({
      error: 'Error obteniendo datos de gráficos'
    });
  }
});

// Middleware de manejo de errores
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Middleware simple de autenticación
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  // Verificación simple del token (en producción usar JWT)
  if (token.startsWith('admin-token-') || token.startsWith('grower-token-')) {
    req.user = {
      token: token,
      role: token.startsWith('admin-token-') ? 'admin' : 'coffee_grower'
    };
    next();
  } else {
    return res.status(403).json({ error: 'Token inválido' });
  }
}

// Ruta del dashboard para caficultores
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    const { token, role } = req.user;
    console.log('Dashboard request - Token:', token, 'Role:', role);
    
    if (role === 'admin') {
      // Dashboard para administrador - datos generales
      const connection = await mysql.createConnection(dbConfig);
      
      const [coffeeGrowersCount] = await connection.execute('SELECT COUNT(*) as count FROM coffee_growers');
      const [farmsCount] = await connection.execute('SELECT COUNT(*) as count FROM farms');
      const [totalArea] = await connection.execute('SELECT SUM(total_area) as total FROM farms WHERE total_area IS NOT NULL');
      
      await connection.end();
      
      const adminDashboard = {
        user: {
          name: 'Administrador',
          email: 'admin@cafecolombia.com',
          role: 'admin'
        },
        stats: {
          totalGrowers: coffeeGrowersCount[0].count,
          totalFarms: farmsCount[0].count,
          totalArea: totalArea[0].total || 0
        },
        systemInfo: {
          lastUpdate: new Date().toISOString(),
          status: 'active'
        }
      };
      
      return res.json({
        success: true,
        data: adminDashboard
      });
    }
    
    // Dashboard para caficultor - datos específicos de su finca
    const connection = await mysql.createConnection(dbConfig);
    
    // Extraer email del token (formato: grower-token-email)
    const email = token.replace('grower-token-', '');
    
    // Obtener datos del caficultor y su finca
    const [growerData] = await connection.execute(`
      SELECT 
        cg.id, cg.full_name, cg.email,
        f.id as farm_id, f.name as farm_name, f.total_area, f.coffee_area, 
        f.department, f.municipality, f.altitude
      FROM coffee_growers cg
      LEFT JOIN farms f ON cg.id = f.coffee_grower_id
      WHERE cg.email = ?
    `, [email]);
    
    await connection.end();
    
    if (growerData.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Caficultor no encontrado'
      });
    }
    
    const grower = growerData[0];
    
    const dashboardData = {
      user: {
        name: grower.full_name,
        email: grower.email,
        farmName: grower.farm_name || 'Sin finca asignada'
      },
      farm: grower.farm_id ? {
        id: grower.farm_id,
        totalArea: grower.total_area,
        coffeeArea: grower.coffee_area,
        location: `${grower.department}, ${grower.municipality}`,
        altitude: grower.altitude
      } : null,
      production: {
        currentSeason: 2800 + Math.floor(Math.random() * 1000),
        lastSeason: 2650 + Math.floor(Math.random() * 800),
        trend: Math.random() > 0.5 ? 'up' : 'down'
      },
      weather: {
        temperature: 22 + Math.random() * 6,
        humidity: 70 + Math.random() * 20,
        rainfall: 80 + Math.random() * 80
      },
      alerts: [
        {
          id: '1',
          type: 'warning',
          message: `Riesgo de roya detectado en ${grower.farm_name || 'su finca'}`,
          date: new Date().toISOString().split('T')[0]
        },
        {
          id: '2',
          type: 'info',
          message: 'Próxima fertilización programada',
          date: new Date().toISOString().split('T')[0]
        }
      ],
      tasks: [
        {
          id: '1',
          title: 'Aplicar fungicida preventivo',
          dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'high',
          completed: false
        },
        {
          id: '2',
          title: 'Revisar sistema de riego',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: 'medium',
          completed: false
        }
      ]
    };

    res.json({
      success: true,
      data: dashboardData
    });

  } catch (error) {
    console.error('Error al obtener datos del dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Error interno del servidor'
    });
  }
});

// Rutas de autenticación de administrador
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    const connection = await mysql.createConnection(dbConfig);
    
    // Buscar administrador por email
    const [adminRows] = await connection.execute(
      'SELECT * FROM admin_users WHERE email = ? AND is_active = true',
      [username]
    );

    if (!adminRows || adminRows.length === 0) {
      await connection.end();
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    const admin = adminRows[0];

    // Verificar si la cuenta está bloqueada
    if (admin.locked_until && new Date() < new Date(admin.locked_until)) {
      await connection.end();
      return res.status(423).json({ 
        success: false, 
        message: `Cuenta bloqueada hasta ${new Date(admin.locked_until).toLocaleString()}` 
      });
    }

    // Verificar contraseña (comparación simple por ahora)
    const bcrypt = require('bcryptjs');
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    
    if (!isValidPassword) {
      // Incrementar intentos fallidos
      await connection.execute(
        'UPDATE admin_users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = ?',
        [admin.id]
      );
      await connection.end();
      return res.status(401).json({ 
        success: false, 
        message: 'Credenciales inválidas' 
      });
    }

    // Resetear intentos fallidos y actualizar último login
    await connection.execute(
      'UPDATE admin_users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?',
      [admin.id]
    );

    // Generar token JWT
    const jwt = require('jsonwebtoken');
    
    // Generar permisos usando la misma lógica que en adminAuth.ts
    const allPermissions = [
      'dashboard:view', 'dashboard:analytics', 
      'users:view', 'users:create', 'users:edit', 'users:delete', 'users:export',
      'growers:view', 'growers:create', 'growers:edit', 'growers:delete', 'growers:export',
      'farms:view', 'farms:create', 'farms:edit', 'farms:delete', 'farms:export',
      'plans:view', 'plans:create', 'plans:edit', 'plans:delete',
      'subscriptions:view', 'subscriptions:create', 'subscriptions:edit', 'subscriptions:cancel', 'subscriptions:export',
      'payments:view', 'payments:refund', 'payments:export',
      'reports:view', 'reports:export', 'reports:analytics',
      'audit:view', 'audit:export',
      'security:view', 'security:manage', 'security:roles',
      'settings:view', 'settings:edit', 'settings:system'
    ];
    
    let permissions;
    if (admin.is_super_admin) {
      permissions = ['*', ...allPermissions];
    } else {
      permissions = [
        'dashboard:view', 'dashboard:analytics',
        'users:view', 'users:create', 'users:edit', 'users:export',
        'growers:view', 'growers:create', 'growers:edit', 'growers:export',
        'farms:view', 'farms:create', 'farms:edit', 'farms:export',
        'plans:view', 'plans:create', 'plans:edit',
        'subscriptions:view', 'subscriptions:create', 'subscriptions:edit', 'subscriptions:export',
        'payments:view', 'payments:export',
        'reports:view', 'reports:export',
        'settings:view'
      ];
    }
    
    const token = jwt.sign(
      { 
        id: admin.id, 
        email: admin.email, 
        permissions: permissions
      },
      process.env.ADMIN_JWT_SECRET || 'admin-secret-key',
      { expiresIn: '24h' }
    );

    // Crear sesión
    const sessionId = require('uuid').v4();
    const tokenHash = await bcrypt.hash(token, 10);
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('User-Agent') || 'unknown';
    
    await connection.execute(
      `INSERT INTO admin_sessions (id, admin_user_id, token_hash, expires_at, ip_address, user_agent) 
       VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 24 HOUR), ?, ?)`,
      [sessionId, admin.id, tokenHash, ipAddress, userAgent]
    );

    await connection.end();

    // Preparar respuesta sin datos sensibles
    const { password_hash, two_factor_secret, ...safeAdmin } = admin;

    res.json({
      success: true,
      token,
      admin: safeAdmin
    });

  } catch (error) {
    console.error('Error en login de administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// Ruta para obtener información del administrador autenticado
app.get('/api/admin/auth/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7);
    const jwt = require('jsonwebtoken');
    
    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'admin-secret-key');

    const connection = await mysql.createConnection(dbConfig);
    
    // Buscar sesión activa y admin
    const [sessionRows] = await connection.execute(`
      SELECT s.*, a.* FROM admin_sessions s
      JOIN admin_users a ON s.admin_user_id = a.id
      WHERE s.expires_at > NOW() AND a.is_active = true
    `);
    
    // Verificar el token hash
    let validSession = null;
    for (const session of sessionRows) {
      if (await bcrypt.compare(token, session.token_hash)) {
        validSession = session;
        break;
      }
    }

    if (!validSession) {
      await connection.end();
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada'
      });
    }

    const admin = validSession;
    await connection.end();

    // Preparar respuesta sin datos sensibles
    const { password_hash, two_factor_secret, ...safeAdmin } = admin;

    res.json({
      success: true,
      admin: safeAdmin
    });

  } catch (error) {
    console.error('Error obteniendo información del administrador:', error);
    res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
});

// Importar y configurar rutas adicionales
const alertsRoutes = require('./routes/alerts.cjs');
const aiRoutes = require('./routes/ai.cjs');
const adminRoutes = require('./routes/admin.cjs');

// Configurar rutas de alertas, AI y admin
app.use('/api/alerts', alertsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/admin', adminRoutes);

// Middleware para rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Iniciar servidor
async function startServer() {
  try {
    console.log('🚀 Iniciando servidor Café Colombia...');
    
    // Probar conexión a MySQL
    console.log('🔌 Probando conexión a MySQL...');
    const mysqlConnected = await testMySQLConnection();
    
    if (mysqlConnected) {
      console.log('✅ Conexión a MySQL exitosa');
    } else {
      console.log('⚠️  Advertencia: No se pudo conectar a MySQL');
    }

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🎉 Servidor corriendo en puerto ${PORT}`);
      console.log(`📍 Health check: http://0.0.0.0:${PORT}/api/health`);
      console.log(`📍 API base: http://0.0.0.0:${PORT}/api`);
      console.log('');
      console.log('📋 Configuración de base de datos:');
      console.log(`   Host: ${dbConfig.host}`);
      console.log(`   Usuario: ${dbConfig.user}`);
      console.log(`   Base de datos: ${dbConfig.database}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

module.exports = app;
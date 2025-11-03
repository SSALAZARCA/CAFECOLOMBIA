import { createConnection } from '../config/database.js';
import { runMigrations } from './runMigrations.js';
import bcrypt from 'bcryptjs';

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🚀 Iniciando configuración de la base de datos...');
    
    // Crear conexión
    connection = await createConnection();
    console.log('✅ Conexión establecida con MySQL');

    // Ejecutar migraciones
    console.log('📋 Ejecutando migraciones...');
    await runMigrations();
    console.log('✅ Migraciones ejecutadas correctamente');

    // Crear usuario superadministrador por defecto
    console.log('👤 Creando usuario superadministrador...');
    await createSuperAdmin(connection);
    console.log('✅ Usuario superadministrador creado');

    // Crear configuraciones del sistema por defecto
    console.log('⚙️ Creando configuraciones del sistema...');
    await createSystemSettings(connection);
    console.log('✅ Configuraciones del sistema creadas');

    // Crear planes de suscripción por defecto
    console.log('💳 Creando planes de suscripción por defecto...');
    await createDefaultSubscriptionPlans(connection);
    console.log('✅ Planes de suscripción creados');

    console.log('🎉 ¡Base de datos configurada exitosamente!');
    console.log('');
    console.log('📋 Credenciales del superadministrador:');
    console.log('   Email: admin@cafecolombiaapp.com');
    console.log('   Contraseña: Admin123!');
    console.log('   ⚠️  IMPORTANTE: Cambia esta contraseña después del primer login');
    console.log('');

  } catch (error) {
    console.error('❌ Error configurando la base de datos:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

async function createSuperAdmin(connection: any) {
  try {
    // Verificar si ya existe un superadministrador
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM users WHERE email = ? OR user_type = ?',
      ['admin@cafecolombiaapp.com', 'super_admin']
    );

    if (existingAdmin.length > 0) {
      console.log('ℹ️  Usuario superadministrador ya existe, omitiendo creación...');
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('Admin123!', 12);

    // Crear el usuario superadministrador
    const [result] = await connection.execute(`
      INSERT INTO users (
        email, password, first_name, last_name, user_type, 
        is_active, email_verified, must_change_password,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
    `, [
      'admin@cafecolombiaapp.com',
      hashedPassword,
      'Super',
      'Administrador',
      'super_admin',
      1,
      1,
      1 // Debe cambiar la contraseña en el primer login
    ]);

    const userId = (result as any).insertId;

    // Crear perfil de administrador
    await connection.execute(`
      INSERT INTO admin_users (
        user_id, permissions, two_factor_enabled, 
        created_at, updated_at
      ) VALUES (?, ?, ?, NOW(), NOW())
    `, [
      userId,
      JSON.stringify(['*']), // Todos los permisos
      0
    ]);

    console.log('✅ Usuario superadministrador creado con ID:', userId);

  } catch (error) {
    console.error('❌ Error creando superadministrador:', error);
    throw error;
  }
}

async function createSystemSettings(connection: any) {
  const defaultSettings = [
    // Configuraciones generales
    { key: 'app_name', value: 'Café Colombia', category: 'general', data_type: 'string', description: 'Nombre de la aplicación' },
    { key: 'app_version', value: '1.0.0', category: 'general', data_type: 'string', description: 'Versión de la aplicación' },
    { key: 'maintenance_mode', value: 'false', category: 'general', data_type: 'boolean', description: 'Modo de mantenimiento' },
    { key: 'registration_enabled', value: 'true', category: 'general', data_type: 'boolean', description: 'Registro de usuarios habilitado' },
    
    // Configuraciones de seguridad
    { key: 'max_login_attempts', value: '5', category: 'security', data_type: 'integer', description: 'Máximo intentos de login' },
    { key: 'lockout_duration', value: '15', category: 'security', data_type: 'integer', description: 'Duración del bloqueo en minutos' },
    { key: 'session_timeout', value: '30', category: 'security', data_type: 'integer', description: 'Tiempo de sesión en minutos' },
    { key: 'password_min_length', value: '8', category: 'security', data_type: 'integer', description: 'Longitud mínima de contraseña' },
    { key: 'require_2fa_admin', value: 'true', category: 'security', data_type: 'boolean', description: '2FA obligatorio para administradores' },
    
    // Configuraciones de email
    { key: 'email_notifications', value: 'true', category: 'email', data_type: 'boolean', description: 'Notificaciones por email habilitadas' },
    { key: 'email_from_name', value: 'Café Colombia', category: 'email', data_type: 'string', description: 'Nombre del remitente' },
    { key: 'email_from_address', value: 'noreply@cafecolombiaapp.com', category: 'email', data_type: 'string', description: 'Email del remitente' },
    
    // Configuraciones de pagos
    { key: 'payments_enabled', value: 'true', category: 'payments', data_type: 'boolean', description: 'Pagos habilitados' },
    { key: 'currency', value: 'COP', category: 'payments', data_type: 'string', description: 'Moneda por defecto' },
    { key: 'tax_rate', value: '19', category: 'payments', data_type: 'decimal', description: 'Tasa de impuesto (%)' },
    
    // Configuraciones de la aplicación
    { key: 'default_subscription_plan', value: '1', category: 'subscriptions', data_type: 'integer', description: 'Plan de suscripción por defecto' },
    { key: 'trial_period_days', value: '7', category: 'subscriptions', data_type: 'integer', description: 'Días de período de prueba' },
    { key: 'auto_renew_default', value: 'true', category: 'subscriptions', data_type: 'boolean', description: 'Auto-renovación por defecto' }
  ];

  for (const setting of defaultSettings) {
    try {
      // Verificar si la configuración ya existe
      const [existing] = await connection.execute(
        'SELECT id FROM system_settings WHERE setting_key = ?',
        [setting.key]
      );

      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO system_settings (
            setting_key, setting_value, category, data_type, 
            description, is_public, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          setting.key,
          setting.value,
          setting.category,
          setting.data_type,
          setting.description,
          setting.category === 'general' ? 1 : 0
        ]);
      }
    } catch (error) {
      console.error(`Error creando configuración ${setting.key}:`, error);
    }
  }
}

async function createDefaultSubscriptionPlans(connection: any) {
  const defaultPlans = [
    {
      name: 'Plan Básico',
      description: 'Plan básico para caficultores individuales',
      price: 29900,
      billing_cycle: 'monthly',
      features: JSON.stringify([
        'Gestión de hasta 2 fincas',
        'Registro de cosechas',
        'Reportes básicos',
        'Soporte por email'
      ]),
      max_farms: 2,
      is_active: 1
    },
    {
      name: 'Plan Profesional',
      description: 'Plan profesional para caficultores con múltiples fincas',
      price: 59900,
      billing_cycle: 'monthly',
      features: JSON.stringify([
        'Gestión de hasta 10 fincas',
        'Registro detallado de cosechas',
        'Reportes avanzados',
        'Análisis de productividad',
        'Soporte prioritario'
      ]),
      max_farms: 10,
      is_active: 1
    },
    {
      name: 'Plan Empresarial',
      description: 'Plan empresarial para cooperativas y grandes productores',
      price: 149900,
      billing_cycle: 'monthly',
      features: JSON.stringify([
        'Gestión ilimitada de fincas',
        'Registro completo de cosechas',
        'Reportes personalizados',
        'Dashboard ejecutivo',
        'API de integración',
        'Soporte 24/7'
      ]),
      max_farms: null,
      is_active: 1
    }
  ];

  for (const plan of defaultPlans) {
    try {
      // Verificar si el plan ya existe
      const [existing] = await connection.execute(
        'SELECT id FROM subscription_plans WHERE name = ?',
        [plan.name]
      );

      if (existing.length === 0) {
        await connection.execute(`
          INSERT INTO subscription_plans (
            name, description, price, billing_cycle, features, 
            max_farms, is_active, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          plan.name,
          plan.description,
          plan.price,
          plan.billing_cycle,
          plan.features,
          plan.max_farms,
          plan.is_active
        ]);
      }
    } catch (error) {
      console.error(`Error creando plan ${plan.name}:`, error);
    }
  }
}

// Ejecutar si se llama directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDatabase()
    .then(() => {
      console.log('✅ Configuración completada exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error en la configuración:', error);
      process.exit(1);
    });
}

export { setupDatabase };
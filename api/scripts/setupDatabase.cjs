const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const path = require('path');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

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

async function setupDatabase() {
  let connection;
  
  try {
    console.log('🚀 Iniciando configuración de la base de datos...');
    console.log('📋 Configuración de DB:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    // Crear conexión
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida con MySQL');

    // Crear usuario administrador por defecto
    console.log('👤 Creando usuario administrador...');
    await createAdminUser(connection);
    console.log('✅ Usuario administrador creado');

    // Crear configuraciones del sistema por defecto
    console.log('⚙️ Verificando configuraciones del sistema...');
    await verifySystemConfig(connection);
    console.log('✅ Configuraciones del sistema verificadas');

    console.log('🎉 ¡Base de datos configurada exitosamente!');
    console.log('');
    console.log('📋 Credenciales del administrador:');
    console.log('   Email: admin@cafecolombia.com');
    console.log('   Contraseña: admin123');
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

async function createAdminUser(connection) {
  try {
    // Verificar si ya existe un administrador
    const [existingAdmin] = await connection.execute(
      'SELECT id FROM admin_users WHERE email = ?',
      ['admin@cafecolombia.com']
    );

    if (existingAdmin.length > 0) {
      console.log('ℹ️  Usuario administrador ya existe, omitiendo creación...');
      return;
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash('admin123', 10);

    // Crear el usuario administrador
    await connection.execute(`
      INSERT INTO admin_users (
        id, email, password_hash, name, is_super_admin, is_active
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      'admin-001',
      'admin@cafecolombia.com',
      hashedPassword,
      'Administrador Principal',
      true,
      true
    ]);

    console.log('✅ Usuario administrador creado exitosamente');

  } catch (error) {
    console.error('❌ Error creando administrador:', error);
    throw error;
  }
}

async function verifySystemConfig(connection) {
  try {
    // Verificar si existen configuraciones
    const [configs] = await connection.execute(
      'SELECT COUNT(*) as count FROM system_config'
    );

    const configCount = configs[0].count;
    console.log(`ℹ️  Encontradas ${configCount} configuraciones en el sistema`);

    if (configCount === 0) {
      console.log('⚠️  No se encontraron configuraciones. Esto es normal si es la primera vez.');
    }

  } catch (error) {
    console.error('❌ Error verificando configuraciones:', error);
    throw error;
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
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

module.exports = { setupDatabase };
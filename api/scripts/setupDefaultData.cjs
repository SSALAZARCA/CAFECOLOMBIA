const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: '193.203.175.58',
  user: 'u689528678_SSALAZARCA',
  password: 'Ssc841209*',
  database: 'u689528678_CAFECOLOMBIA',
  port: 3306,
  charset: 'utf8mb4',
  timezone: '+00:00',
  ssl: {
    rejectUnauthorized: false
  }
};

async function setupDefaultData() {
  let connection;
  
  try {
    console.log('🔗 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión exitosa a la base de datos');

    // 1. Crear administrador por defecto
    console.log('\n📝 Creando administrador por defecto...');
    
    // Verificar si ya existe un super_admin
    const [existingAdmins] = await connection.execute(
      'SELECT id FROM admin_users WHERE is_super_admin = 1'
    );

    if (existingAdmins.length === 0) {
      const adminPassword = await bcrypt.hash('Admin123!', 12);
      
      await connection.execute(`
        INSERT INTO admin_users (
          email, password_hash, name, is_super_admin, is_active, 
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        'admin@cafecolombia.com',
        adminPassword,
        'Administrador Principal',
        true,
        true
      ]);
      
      console.log('✅ Administrador creado:');
      console.log('   Email: admin@cafecolombia.com');
      console.log('   Contraseña: Admin123!');
      console.log('   Nombre: Administrador Principal');
      console.log('   Super Admin: Sí');
    } else {
      console.log('ℹ️  Ya existe un super administrador');
    }

    // 2. Crear caficultor de prueba
    console.log('\n👨‍🌾 Creando caficultor de prueba...');
    
    // Verificar si ya existe el caficultor de prueba
    const [existingGrowers] = await connection.execute(
      'SELECT id FROM coffee_growers WHERE identification_number = ?',
      ['12345678']
    );

    if (existingGrowers.length === 0) {
      // Crear caficultor
      const [growerResult] = await connection.execute(`
        INSERT INTO coffee_growers (
          identification_number, identification_type, full_name, email, phone,
          department, municipality, farm_experience_years, coffee_experience_years,
          certification_type, total_farm_area, coffee_area, farming_practices,
          processing_method, annual_production, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        '12345678',
        'cedula',
        'Juan Carlos Pérez García',
        'juan.perez@cafecolombia.com',
        '+57 300 123 4567',
        'Huila',
        'Pitalito',
        15,
        12,
        'Rainforest Alliance',
        12.5,
        10.0,
        'Agricultura orgánica, manejo integrado de plagas',
        'lavado',
        8500.00,
        'active'
      ]);

      const coffeeGrowerId = growerResult.insertId;

      // Crear finca principal
      const [farmResult] = await connection.execute(`
        INSERT INTO farms (
          coffee_grower_id, name, department, municipality, address,
          total_area, coffee_area, latitude, longitude, altitude,
          soil_type, climate_type, coffee_varieties, annual_production,
          processing_method, certification_status, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
      `, [
        coffeeGrowerId,
        'Finca El Paraíso',
        'Huila',
        'Pitalito',
        'Vereda La Esperanza, Km 5 vía Pitalito-Isnos',
        12.5,
        10.0,
        1.8533, // Latitud de Pitalito
        -76.0492, // Longitud de Pitalito
        1650, // Altitud típica de Pitalito
        'volcanico',
        'tropical',
        JSON.stringify(['Caturra', 'Colombia', 'Castillo']),
        8500.00,
        'lavado',
        'certificada',
        'active'
      ]);

      const farmId = farmResult.insertId;

      console.log('✅ Caficultor de prueba creado:');
      console.log('   Email: juan.perez@cafecolombia.com');
      console.log('   Nombre: Juan Carlos Pérez García');
      console.log('   Cédula: 12345678');
      console.log('   Finca: Finca El Paraíso (12.5 hectáreas)');
      console.log('   Ubicación: Pitalito, Huila');
      console.log('   Variedades: Caturra, Colombia, Castillo');
      console.log('   Certificación: Rainforest Alliance');
      console.log('   Producción anual: 8,500 kg');
    } else {
      console.log('ℹ️  Ya existe el caficultor de prueba');
    }

    // 3. Crear datos adicionales de ejemplo
    console.log('\n📊 Creando datos adicionales...');

    // Verificar si ya existen datos de inventario
    const [existingInventory] = await connection.execute(
      'SELECT COUNT(*) as count FROM inventory_items'
    );

    if (existingInventory[0].count === 0) {
      // Primero crear categorías de inventario si no existen
      const categories = [
        { name: 'Fertilizantes', description: 'Productos para nutrición del cultivo' },
        { name: 'Pesticidas', description: 'Productos para control de plagas y enfermedades' },
        { name: 'Herramientas', description: 'Herramientas y equipos de trabajo' },
        { name: 'Empaque', description: 'Materiales de empaque y almacenamiento' }
      ];

      for (const category of categories) {
        await connection.execute(`
          INSERT IGNORE INTO inventory_categories (name, description, created_at)
          VALUES (?, ?, NOW())
        `, [category.name, category.description]);
      }

      // Obtener IDs de categorías
      const [categoryIds] = await connection.execute(
        'SELECT id, name FROM inventory_categories'
      );
      const categoryMap = {};
      categoryIds.forEach(cat => {
        categoryMap[cat.name] = cat.id;
      });

      // Crear algunos elementos de inventario
      const inventoryItems = [
        { name: 'Fertilizante NPK 15-15-15', category: 'Fertilizantes', unit: 'kg', stock: 500, min_stock: 100 },
        { name: 'Fungicida Cobre', category: 'Pesticidas', unit: 'litros', stock: 25, min_stock: 5 },
        { name: 'Sacos de Fique 60kg', category: 'Empaque', unit: 'unidades', stock: 200, min_stock: 50 },
        { name: 'Herramientas de Poda', category: 'Herramientas', unit: 'unidades', stock: 15, min_stock: 3 }
      ];

      for (const item of inventoryItems) {
        await connection.execute(`
          INSERT INTO inventory_items (name, category_id, unit, current_stock, minimum_stock, created_at)
          VALUES (?, ?, ?, ?, ?, NOW())
        `, [item.name, categoryMap[item.category], item.unit, item.stock, item.min_stock]);
      }

      console.log('✅ Datos de inventario creados');
    } else {
      console.log('ℹ️  Ya existen datos de inventario');
    }

    // 4. Configurar sistema
    console.log('\n⚙️  Configurando sistema...');

    const systemSettings = [
      { key: 'app_name', value: 'Café Colombia', description: 'Nombre de la aplicación' },
      { key: 'app_version', value: '1.0.0', description: 'Versión de la aplicación' },
      { key: 'email_enabled', value: 'true', description: 'Habilitar notificaciones por email' },
      { key: 'session_timeout', value: '3600', description: 'Tiempo de expiración de sesión en segundos' },
      { key: 'default_currency', value: 'COP', description: 'Moneda por defecto' },
      { key: 'price_update_frequency', value: '24', description: 'Frecuencia de actualización de precios en horas' }
    ];

    for (const setting of systemSettings) {
      await connection.execute(`
        INSERT IGNORE INTO system_config (
          config_key, config_value, description, created_at
        ) VALUES (?, ?, ?, NOW())
      `, [setting.key, setting.value, setting.description]);
    }

    console.log('✅ Configuraciones del sistema creadas');

    console.log('\n🎉 ¡Configuración inicial completada exitosamente!');
    console.log('\n📋 RESUMEN DE CREDENCIALES:');
    console.log('==========================================');
    console.log('👨‍💼 ADMINISTRADOR:');
    console.log('   URL: /admin/login');
    console.log('   Email: admin@cafecolombia.com');
    console.log('   Contraseña: Admin123!');
    console.log('');
    console.log('👨‍🌾 CAFICULTOR DE PRUEBA:');
    console.log('   URL: /login');
    console.log('   Email: juan.perez@cafecolombia.com');
    console.log('   Contraseña: Caficultor123!');
    console.log('==========================================');

  } catch (error) {
    console.error('❌ Error durante la configuración:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Conexión cerrada');
    }
  }
}

// Ejecutar el script
setupDefaultData();
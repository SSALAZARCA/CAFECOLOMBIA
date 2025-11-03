const mysql = require('mysql2/promise');

async function checkUsers() {
  try {
    // Probar con las credenciales que veo en los scripts
    const connection = await mysql.createConnection({
      host: '193.203.175.58',
      user: 'u689528678_SSALAZARCA',
      password: 'Ssc841209*',
      database: 'u689528678_CAFECOLOMBIA',
      port: 3306,
      ssl: {
        rejectUnauthorized: false
      }
    });

    console.log('=== USUARIOS ADMINISTRADORES ===');
    try {
      const [admins] = await connection.execute('SELECT id, email, name, is_super_admin, is_active FROM admin_users WHERE is_active = 1 LIMIT 5');
      console.table(admins);
    } catch (error) {
      console.log('Error consultando admin_users:', error.message);
    }

    console.log('\n=== CAFICULTORES (ESTRUCTURA) ===');
    try {
      const [growerColumns] = await connection.execute('DESCRIBE coffee_growers');
      console.table(growerColumns.slice(0, 10)); // Solo primeras 10 columnas
    } catch (error) {
      console.log('Tabla coffee_growers no existe:', error.message);
    }

    console.log('\n=== CAFICULTORES (DATOS) ===');
    try {
      const [growers] = await connection.execute('SELECT * FROM coffee_growers LIMIT 3');
      console.table(growers);
    } catch (error) {
      console.log('Error consultando coffee_growers:', error.message);
    }

    console.log('\n=== FINCAS ===');
    try {
      const [farms] = await connection.execute('SELECT id, name, coffee_grower_id FROM farms LIMIT 5');
      console.table(farms);
    } catch (error) {
      console.log('Error consultando farms:', error.message);
    }

    await connection.end();
    console.log('\n✅ Verificación de usuarios completada');
    
    console.log('\n📋 CREDENCIALES PARA PRUEBAS:');
    console.log('👤 Administrador: admin@cafecolombia.com / admin123');
    console.log('🌱 Caficultor: [Ver tabla coffee_growers arriba]');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkUsers();
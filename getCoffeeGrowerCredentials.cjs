const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: '193.203.175.58',
  user: 'u689528678_SSALAZARCA',
  password: 'Ssc841209*',
  database: 'u689528678_CAFECOLOMBIA',
  port: 3306,
  ssl: {
    rejectUnauthorized: false
  }
};

async function getCoffeeGrowerCredentials() {
  let connection;
  
  try {
    console.log('🔗 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    // Primero verificar la estructura de la tabla
    console.log('\n=== ESTRUCTURA DE COFFEE_GROWERS ===');
    const [structure] = await connection.execute('DESCRIBE coffee_growers');
    console.table(structure);
    
    // Buscar columnas que contengan 'password'
    console.log('\n=== COLUMNAS RELACIONADAS CON PASSWORD ===');
    const [passwordColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'coffee_growers' 
      AND COLUMN_NAME LIKE '%password%'
    `);
    console.table(passwordColumns);

    // Obtener caficultores con sus fincas
    console.log('\n=== CAFICULTORES CON CREDENCIALES ===');
    const [coffeeGrowers] = await connection.execute(`
      SELECT 
        cg.id,
        cg.email,
        f.id as farm_id,
        f.name as farm_name
      FROM coffee_growers cg
      LEFT JOIN farms f ON cg.id = f.coffee_grower_id
      LIMIT 5
    `);
    
    console.table(coffeeGrowers);
    
    // Mostrar credenciales específicas para pruebas
    if (coffeeGrowers.length > 0) {
      const firstGrower = coffeeGrowers[0];
      console.log('\n📋 CREDENCIALES PARA PRUEBAS:');
      console.log(`👤 Administrador: admin@cafecolombia.com / admin123`);
      console.log(`🌱 Caficultor: ${firstGrower.email} / [password needed]`);
      console.log(`🏡 Finca: ${firstGrower.farm_name} (ID: ${firstGrower.farm_id})`);
      
      // Buscar si hay una tabla de usuarios separada para caficultores
      console.log('\n=== BUSCANDO TABLA DE USUARIOS ===');
      try {
        const [users] = await connection.execute(`
          SELECT * FROM users 
          WHERE email = ? OR user_type = 'coffee_grower'
          LIMIT 3
        `, [firstGrower.email]);
        console.table(users);
      } catch (error) {
        console.log('No se encontró tabla users:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

getCoffeeGrowerCredentials();
const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'api/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'srv1196.hstgr.io',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'u472469844_cafeadmin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u472469844_cafecolombia'
};

async function checkCoffeeGrowersTable() {
  console.log('🔍 Verificando estructura de la tabla coffee_growers...\n');

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar estructura de la tabla
    console.log('📋 Estructura de la tabla coffee_growers:');
    const [columns] = await connection.execute('DESCRIBE coffee_growers');
    
    console.table(columns);
    
    // Verificar si hay datos
    console.log('\n📊 Datos en la tabla coffee_growers:');
    const [rows] = await connection.execute('SELECT id, email, full_name, status FROM coffee_growers LIMIT 5');
    
    if (rows.length > 0) {
      console.table(rows);
    } else {
      console.log('   No hay datos en la tabla');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCoffeeGrowersTable();
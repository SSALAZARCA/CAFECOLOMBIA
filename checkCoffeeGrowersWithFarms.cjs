const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'api/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'srv1196.hstgr.io',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'u472469844_cafeadmin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u472469844_cafecolombia'
};

async function checkCoffeeGrowersWithFarms() {
  console.log('🔍 Verificando caficultores con fincas...\n');

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar caficultores con fincas
    console.log('📋 Caficultores con fincas:');
    const [rows] = await connection.execute(`
      SELECT 
        cg.id, 
        cg.email, 
        cg.full_name, 
        cg.password_hash,
        f.id as farm_id, 
        f.name as farm_name,
        f.total_area,
        f.department,
        f.municipality
      FROM coffee_growers cg 
      LEFT JOIN farms f ON cg.id = f.coffee_grower_id 
      WHERE cg.status = 'active'
      ORDER BY cg.id
    `);
    
    if (rows.length > 0) {
      console.table(rows);
    } else {
      console.log('   No hay caficultores registrados');
    }
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCoffeeGrowersWithFarms()
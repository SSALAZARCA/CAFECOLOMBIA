const mysql = require('mysql2/promise');

const dbConfig = {
  host: '193.203.175.58',
  port: 3306,
  user: 'u689528678_SSALAZARCA',
  password: 'Ssc841209*',
  database: 'u689528678_CAFECOLOMBIA',
  charset: 'utf8mb4',
  timezone: '+00:00',
  ssl: {
    rejectUnauthorized: false
  }
};

async function checkAdminUsers() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a base de datos exitosa');
    
    // Verificar estructura de la tabla
    const [structure] = await connection.execute('DESCRIBE admin_users');
    console.log('Estructura de admin_users:');
    structure.forEach(col => {
      console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${col.Key ? col.Key : ''} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });
    
    // Verificar si hay usuarios admin
    const [users] = await connection.execute('SELECT * FROM admin_users LIMIT 5');
    console.log('\nUsuarios admin encontrados:', users.length);
    if (users.length > 0) {
      console.log('Primer usuario:', users[0]);
    }
    
    await connection.end();
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAdminUsers();
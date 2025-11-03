const mysql = require('mysql2/promise');

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

async function checkTables() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión exitosa');

    console.log('\nEstructura de admin_users:');
    const [adminColumns] = await connection.execute('DESCRIBE admin_users');
    console.table(adminColumns);

    console.log('\nEstructura de coffee_growers:');
    const [growerColumns] = await connection.execute('DESCRIBE coffee_growers');
    console.table(growerColumns);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();
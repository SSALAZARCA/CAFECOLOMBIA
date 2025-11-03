const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: require('path').join(__dirname, '../.env') });

async function checkTable() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });
  
  console.log('Columnas de la tabla payments:');
  const [columns] = await connection.execute('DESCRIBE payments');
  columns.forEach(col => console.log(`- ${col.Field} (${col.Type})`));
  
  await connection.end();
}

checkTable().catch(console.error)
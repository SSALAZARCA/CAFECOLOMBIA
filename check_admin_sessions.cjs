const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
dotenv.config({ path: 'api/.env' });

const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: 'utf8mb4',
  timezone: '+00:00',
  ssl: { rejectUnauthorized: false }
};

async function checkTable() {
  const connection = await mysql.createConnection(dbConfig);
  try {
    const [columns] = await connection.execute('DESCRIBE admin_sessions');
    console.log('Columnas de admin_sessions:');
    columns.forEach(col => console.log('- ' + col.Field + ' (' + col.Type + ')'));
  } catch (error) {
    console.log('Error: La tabla admin_sessions no existe');
    console.log('Creando tabla admin_sessions...');
    await connection.execute(`
      CREATE TABLE admin_sessions (
        id VARCHAR(36) PRIMARY KEY,
        admin_id VARCHAR(36) NOT NULL,
        token TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE
      )
    `);
    console.log('Tabla admin_sessions creada exitosamente');
  }
  await connection.end();
}

checkTable().catch(console.error);
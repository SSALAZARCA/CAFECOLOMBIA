const mysql = require('mysql2/promise');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Probando conexión MySQL...');
    console.log('Host:', process.env.MYSQL_HOST || 'srv1196.hstgr.io');
    console.log('Usuario:', process.env.MYSQL_USER || 'NO CONFIGURADO');
    console.log('Base de datos:', process.env.MYSQL_DATABASE || 'cafe_colombia');
    
    if (!process.env.MYSQL_USER || !process.env.MYSQL_PASSWORD) {
      console.log('❌ Error: Credenciales MySQL no configuradas en .env');
      console.log('Por favor configura MYSQL_USER y MYSQL_PASSWORD en el archivo .env');
      return false;
    }
    
    const connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'srv1196.hstgr.io',
      user: process.env.MYSQL_USER,
      password: process.env.MYSQL_PASSWORD,
      database: process.env.MYSQL_DATABASE || 'cafe_colombia',
      port: parseInt(process.env.MYSQL_PORT || '3306'),
      ssl: {
        rejectUnauthorized: false
      }
    });
    
    await connection.ping();
    console.log('✅ Conexión MySQL establecida correctamente');
    
    // Probar una consulta simple
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de prueba exitosa:', rows[0]);
    
    await connection.end();
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error.message);
    return false;
  }
}

testConnection();
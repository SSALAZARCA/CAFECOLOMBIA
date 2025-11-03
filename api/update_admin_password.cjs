const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

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

async function updateAdminPassword() {
  try {
    const connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión a base de datos exitosa');
    
    // Generar nuevo hash para la contraseña admin123
    const newPassword = 'admin123';
    const newHash = await bcrypt.hash(newPassword, 12);
    console.log('Nuevo hash generado:', newHash);
    
    // Actualizar la contraseña y resetear intentos fallidos
    const [result] = await connection.execute(
      'UPDATE admin_users SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL WHERE email = ?',
      [newHash, 'admin@cafecolombiaapp.com']
    );
    
    console.log('Resultado de la actualización:', result);
    
    // Verificar que se actualizó correctamente
    const [users] = await connection.execute(
      'SELECT email, failed_login_attempts, locked_until FROM admin_users WHERE email = ?',
      ['admin@cafecolombiaapp.com']
    );
    
    console.log('Usuario actualizado:', users[0]);
    
    await connection.end();
    console.log('✅ Contraseña actualizada exitosamente');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

updateAdminPassword();
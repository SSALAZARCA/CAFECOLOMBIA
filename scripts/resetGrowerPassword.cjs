const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
  host: process.env.DB_HOST || '193.203.175.58',
  user: process.env.DB_USER || 'u689528678_SSALAZARCA',
  password: process.env.DB_PASSWORD || 'Ssc841209*',
  database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA',
  port: parseInt(process.env.DB_PORT || '3306', 10)
};

async function resetGrowerPassword(email, newPassword) {
  if (!email || !newPassword) {
    console.error('Uso: node scripts/resetGrowerPassword.cjs <email> <nueva-contraseña>');
    process.exit(1);
  }

  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute(
      'SELECT id, email FROM coffee_growers WHERE email = ? LIMIT 1',
      [email]
    );

    if (!rows || rows.length === 0) {
      console.error('❌ Usuario no encontrado:', email);
      process.exit(2);
    }

    const hash = await bcrypt.hash(newPassword, 12);
    await connection.execute(
      'UPDATE coffee_growers SET password_hash = ?, status = "active" WHERE email = ?',
      [hash, email]
    );

    console.log('✅ Contraseña actualizada y usuario activado:', email);
  } catch (err) {
    console.error('❌ Error reseteando contraseña:', err.message);
    process.exit(3);
  } finally {
    if (connection) await connection.end();
  }
}

// Ejecutar desde CLI
const [,, emailArg, passArg] = process.argv;
resetGrowerPassword(emailArg, passArg);
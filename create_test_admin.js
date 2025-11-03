const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

async function createTestAdmin() {
  const connection = await mysql.createConnection({
    host: '193.203.175.58',
    port: 3306,
    user: 'u689528678_SSALAZARCA',
    password: 'Ssc841209*',
    database: 'u689528678_CAFECOLOMBIA',
    ssl: { rejectUnauthorized: false }
  });
  
  const email = 'test@admin.com';
  const password = 'test123';
  const hashedPassword = await bcrypt.hash(password, 12);
  const adminId = uuidv4();
  
  // Eliminar usuario si existe
  await connection.execute('DELETE FROM admin_users WHERE email = ?', [email]);
  
  // Crear nuevo usuario
  await connection.execute(`
    INSERT INTO admin_users (id, email, password_hash, name, is_super_admin, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())
  `, [adminId, email, hashedPassword, 'Test Admin', true, true]);
  
  console.log('✅ Usuario administrador de prueba creado:');
  console.log('   Email:', email);
  console.log('   Contraseña:', password);
  console.log('   ID:', adminId);
  
  await connection.end();
}

createTestAdmin().catch(console.error);
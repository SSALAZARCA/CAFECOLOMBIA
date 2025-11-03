const mysql = require('mysql2/promise');

async function checkAdmins() {
  const connection = await mysql.createConnection({
    host: '193.203.175.58',
    port: 3306,
    user: 'u689528678_SSALAZARCA',
    password: 'Ssalazar2024*',
    database: 'u689528678_CAFECOLOMBIA'
  });

  const [rows] = await connection.execute('SELECT id, email, is_super_admin FROM admin_users');
  console.log('Usuarios administradores:');
  rows.forEach(admin => {
    console.log(`ID: ${admin.id}, Email: ${admin.email}, Super Admin: ${admin.is_super_admin}`);
  });

  await connection.end();
}

checkAdmins().catch(console.error)
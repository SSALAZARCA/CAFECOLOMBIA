const mysql = require('mysql2/promise');

async function checkAdminStructure() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Laestacion123',
    database: 'cafe_colombia_db'
  });

  try {
    console.log('=== ESTRUCTURA DE LA TABLA admin_users ===');
    const [structure] = await connection.execute('DESCRIBE admin_users');
    console.table(structure);

    console.log('\n=== DATOS DEL USUARIO ADMIN ===');
    const [adminData] = await connection.execute('SELECT * FROM admin_users WHERE email = ?', ['admin@cafecolombiaapp.com']);
    console.log('Admin user data:', JSON.stringify(adminData[0], null, 2));

    console.log('\n=== VERIFICAR SI EXISTE TABLA DE PERMISOS ===');
    const [tables] = await connection.execute("SHOW TABLES LIKE '%permission%'");
    console.log('Permission-related tables:', tables);

    const [allTables] = await connection.execute('SHOW TABLES');
    console.log('\n=== TODAS LAS TABLAS ===');
    console.table(allTables);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAdminStructure();
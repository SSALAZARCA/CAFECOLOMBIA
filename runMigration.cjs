const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function runMigration() {
  let connection;
  
  try {
    // Conectar a la base de datos
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '123456',
      database: 'cafe_colombia',
      multipleStatements: true
    });

    console.log('✅ Conectado a la base de datos');

    // Leer el archivo de migración
    const migrationPath = path.join(__dirname, 'api', 'migrations', '011_coffee_growers_auth.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📄 Ejecutando migración 011_coffee_growers_auth.sql...');

    // Ejecutar la migración
    await connection.execute(migrationSQL);

    console.log('✅ Migración ejecutada exitosamente');

    // Verificar que las columnas se agregaron
    const [columns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'cafe_colombia' 
      AND TABLE_NAME = 'coffee_growers' 
      AND COLUMN_NAME IN ('password_hash', 'is_active', 'email_verified', 'first_name', 'last_name')
      ORDER BY COLUMN_NAME
    `);

    console.log('\n📋 Columnas de autenticación agregadas:');
    console.table(columns);

    // Verificar usuarios con contraseñas
    const [users] = await connection.execute(`
      SELECT id, email, first_name, last_name, is_active, email_verified, 
             CASE WHEN password_hash IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_password
      FROM coffee_growers 
      WHERE email IS NOT NULL
      LIMIT 5
    `);

    console.log('\n👥 Usuarios con autenticación configurada:');
    console.table(users);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

runMigration();
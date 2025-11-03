const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function testMigration() {
  let connection;
  
  try {
    // Usar la misma configuración que el servidor
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '123456',
      database: process.env.DB_NAME || 'cafe_colombia',
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conectado a la base de datos');

    // Verificar si las columnas ya existen
    const [existingColumns] = await connection.execute(`
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'coffee_growers' 
      AND COLUMN_NAME IN ('password_hash', 'is_active', 'email_verified')
    `);

    if (existingColumns.length > 0) {
      console.log('✅ Las columnas de autenticación ya existen');
      console.table(existingColumns);
    } else {
      console.log('⚠️ Las columnas de autenticación no existen, ejecutando migración...');
      
      // Leer y ejecutar la migración
      const migrationPath = path.join(__dirname, 'api', 'migrations', '011_coffee_growers_auth.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Dividir en statements individuales y ejecutar uno por uno
      const statements = migrationSQL.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        if (statement.trim()) {
          try {
            await connection.execute(statement);
            console.log('✅ Statement ejecutado');
          } catch (error) {
            if (error.message.includes('Duplicate column name')) {
              console.log('⚠️ Columna ya existe, continuando...');
            } else {
              console.error('❌ Error en statement:', error.message);
            }
          }
        }
      }
    }

    // Verificar usuarios con credenciales
    const [users] = await connection.execute(`
      SELECT id, email, first_name, last_name, is_active, email_verified, 
             CASE WHEN password_hash IS NOT NULL THEN 'SÍ' ELSE 'NO' END as tiene_password
      FROM coffee_growers 
      WHERE email IS NOT NULL
      LIMIT 5
    `);

    console.log('\n👥 Usuarios disponibles para login:');
    console.table(users);

    console.log('\n🔑 Credenciales de prueba:');
    console.log('Email: juan.perez@email.com');
    console.log('Password: password123');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testMigration();
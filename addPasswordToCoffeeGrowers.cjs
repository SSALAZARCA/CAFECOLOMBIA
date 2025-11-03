const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'api/.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'srv1196.hstgr.io',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'u472469844_cafeadmin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u472469844_cafecolombia'
};

async function addPasswordColumn() {
  console.log('🔧 Agregando columna password_hash a coffee_growers...\n');

  try {
    const connection = await mysql.createConnection(dbConfig);
    
    // Verificar si la columna ya existe
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'coffee_growers' AND COLUMN_NAME = 'password_hash'",
      [dbConfig.database]
    );
    
    if (columns.length > 0) {
      console.log('✅ La columna password_hash ya existe');
      await connection.end();
      return;
    }
    
    // Agregar la columna password_hash
    console.log('📝 Agregando columna password_hash...');
    await connection.execute(
      'ALTER TABLE coffee_growers ADD COLUMN password_hash VARCHAR(255) NULL AFTER email'
    );
    
    console.log('✅ Columna password_hash agregada exitosamente');
    
    // Establecer una contraseña por defecto para usuarios existentes (hash de "password123")
    // En un entorno real, esto se haría de manera más segura
    console.log('🔑 Estableciendo contraseña por defecto para usuarios existentes...');
    
    // Para simplificar, vamos a usar un hash simple (en producción usar bcrypt)
    const defaultPasswordHash = 'simple_hash_password123';
    
    await connection.execute(
      'UPDATE coffee_growers SET password_hash = ? WHERE password_hash IS NULL',
      [defaultPasswordHash]
    );
    
    console.log('✅ Contraseñas por defecto establecidas');
    
    // Verificar la estructura actualizada
    console.log('\n📋 Estructura actualizada de coffee_growers:');
    const [newColumns] = await connection.execute('DESCRIBE coffee_growers');
    
    const relevantColumns = newColumns.filter(col => 
      ['id', 'email', 'password_hash', 'full_name', 'status'].includes(col.Field)
    );
    console.table(relevantColumns);
    
    await connection.end();
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addPasswordColumn();
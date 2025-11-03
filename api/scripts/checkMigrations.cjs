const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'cafe_colombia',
  port: process.env.DB_PORT || 3306
};

async function checkMigrations() {
  let connection;
  
  try {
    console.log('🔍 Verificando estado de las migraciones...\n');
    
    // Conectar a la base de datos
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conectado a la base de datos');
    
    // Verificar si existe la tabla de migraciones
    const [migrationTableExists] = await connection.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = 'migrations'
    `, [dbConfig.database]);
    
    if (migrationTableExists[0].count === 0) {
      console.log('❌ La tabla de migraciones no existe');
      return;
    }
    
    // Obtener migraciones ejecutadas
    const [executedMigrations] = await connection.execute(`
      SELECT filename, executed_at 
      FROM migrations 
      ORDER BY executed_at ASC
    `);
    
    console.log('\n📋 Migraciones ejecutadas:');
    executedMigrations.forEach(migration => {
      console.log(`  ✅ ${migration.filename} - ${migration.executed_at}`);
    });
    
    // Verificar migraciones pendientes
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    const executedFilenames = executedMigrations.map(m => m.filename);
    const pendingMigrations = migrationFiles.filter(file => !executedFilenames.includes(file));
    
    if (pendingMigrations.length > 0) {
      console.log('\n⚠️  Migraciones pendientes:');
      pendingMigrations.forEach(migration => {
        console.log(`  ❌ ${migration}`);
      });
    } else {
      console.log('\n✅ Todas las migraciones están ejecutadas');
    }
    
    // Verificar tablas específicas para el dashboard
    console.log('\n🔍 Verificando tablas necesarias para el dashboard...');
    
    const requiredTables = [
      'coffee_growers',
      'farms', 
      'production_records',
      'alerts',
      'tasks'
    ];
    
    for (const table of requiredTables) {
      const [tableExists] = await connection.execute(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = ?
      `, [dbConfig.database, table]);
      
      if (tableExists[0].count > 0) {
        console.log(`  ✅ Tabla '${table}' existe`);
      } else {
        console.log(`  ❌ Tabla '${table}' NO existe`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error al verificar migraciones:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkMigrations();
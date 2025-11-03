const mysql = require('mysql2/promise');
const config = require('../config/database.js');

async function checkAllTables() {
  const connection = await mysql.createConnection(config);
  
  try {
    console.log('Verificando todas las tablas en la base de datos...');
    
    // Obtener todas las tablas
    const [tables] = await connection.execute('SHOW TABLES');
    
    console.log('\\nTablas existentes:');
    console.log('==================');
    
    const tableNames = tables.map(row => Object.values(row)[0]).sort();
    
    tableNames.forEach((table, index) => {
      console.log(`${index + 1}. ${table}`);
    });
    
    console.log(`\\nTotal de tablas: ${tableNames.length}`);
    
    // Verificar migraciones ejecutadas
    const [migrations] = await connection.execute('SELECT * FROM migrations ORDER BY executed_at');
    
    console.log('\\nMigraciones ejecutadas:');
    console.log('=======================');
    
    migrations.forEach((migration, index) => {
      console.log(`${index + 1}. ${migration.filename} (${migration.executed_at})`);
    });
    
    console.log(`\\nTotal de migraciones: ${migrations.length}`);
    
    // Verificar tablas específicas importantes
    const importantTables = [
      'users', 'admin_users', 'coffee_growers', 'farms', 'lots', 'harvests',
      'inventory', 'pests', 'traceability', 'tasks', 'market_analysis',
      'subscription_plans', 'subscriptions', 'payments', 'audit_logs'
    ];
    
    console.log('\\nVerificación de tablas importantes:');
    console.log('===================================');
    
    for (const table of importantTables) {
      const exists = tableNames.includes(table);
      console.log(`${table}: ${exists ? '✓ EXISTS' : '✗ MISSING'}`);
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

checkAllTables();
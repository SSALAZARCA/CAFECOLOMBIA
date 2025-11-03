const mysql = require('mysql2/promise');
const config = require('../config/database.js');

async function markMigration008() {
  const connection = await mysql.createConnection(config);
  
  try {
    // Verificar si la migración 008 ya está marcada
    const [existing] = await connection.execute(
      'SELECT * FROM migrations WHERE filename = ?',
      ['008_payments_audit.sql']
    );
    
    if (existing.length > 0) {
      console.log('La migración 008 ya está marcada como ejecutada');
    } else {
      // Marcar la migración 008 como ejecutada
      await connection.execute(
        'INSERT INTO migrations (filename, executed_at) VALUES (?, NOW())',
        ['008_payments_audit.sql']
      );
      console.log('Migración 008 marcada como ejecutada');
    }
    
    // Verificar qué migraciones están ejecutadas
    const [migrations] = await connection.execute('SELECT * FROM migrations ORDER BY executed_at');
    console.log('\nMigraciones ejecutadas:');
    migrations.forEach(m => {
      console.log(`- ${m.filename} (${m.executed_at})`);
    });
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

markMigration008();
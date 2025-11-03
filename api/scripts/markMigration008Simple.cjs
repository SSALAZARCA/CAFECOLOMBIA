const mysql = require('mysql2/promise');

async function markMigration008() {
  const connection = await mysql.createConnection({
    host: 'srv1196.hstgr.io',
    port: 3306,
    user: 'u472469844_cafeadmin',
    password: 'Cafe2024*',
    database: 'u472469844_cafecolombia',
    charset: 'utf8mb4',
    timezone: '+00:00'
  });
  
  try {
    console.log('Marcando migración 008 como ejecutada...');
    
    // Marcar migración 008 como ejecutada
    await connection.execute(
      'INSERT IGNORE INTO migrations (filename, executed_at) VALUES (?, NOW())',
      ['008_payments_audit.sql']
    );
    
    console.log('Migración 008 marcada como ejecutada');
    
    // Verificar migraciones
    const [migrations] = await connection.execute('SELECT * FROM migrations ORDER BY executed_at');
    console.log('\\nMigraciones ejecutadas:');
    migrations.forEach(m => console.log(`- ${m.filename}`));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await connection.end();
  }
}

markMigration008();
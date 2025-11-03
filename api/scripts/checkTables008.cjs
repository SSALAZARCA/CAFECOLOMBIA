const mysql = require('mysql2/promise');
const config = require('../config/database.js');

async function checkTables() {
  const connection = await mysql.createConnection(config);
  
  const tables008 = ['payment_methods', 'payments', 'payment_webhooks', 'payment_refunds', 'audit_logs', 'audit_log_details', 'system_events'];
  
  console.log('Verificando tablas de la migración 008:');
  
  for (const table of tables008) {
    try {
      const [rows] = await connection.execute('SHOW TABLES LIKE ?', [table]);
      console.log(`${table}: ${rows.length > 0 ? 'EXISTS' : 'NOT EXISTS'}`);
    } catch (error) {
      console.log(`${table}: ERROR - ${error.message}`);
    }
  }
  
  await connection.end();
}

checkTables().catch(console.error);
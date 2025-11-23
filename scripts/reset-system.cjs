#!/usr/bin/env node
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

(() => {
  try {
    const apiProd = path.join(__dirname, '..', 'api', '.env.production');
    if (fs.existsSync(apiProd)) require('dotenv').config({ path: apiProd });
    else require('dotenv').config();
  } catch { require('dotenv').config(); }
})();

const db = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

async function run() {
  const ADMIN_EMAIL = process.argv[2] || 'asalazalaza110@msn.com';
  const ADMIN_PASS = process.argv[3] || 'ssc841209';
  const GROWER_EMAIL = process.argv[4] || 'ssalazarca84@gmail.com';
  const GROWER_PASS = process.argv[5] || 'Ssc841209';
  const FARM_NAME = 'Villa Linda';

  let conn;
  try {
    conn = await mysql.createConnection(db);

    // Deshabilitar checks para operaciones controladas
    await conn.execute('SET FOREIGN_KEY_CHECKS=0');
    await conn.execute('DELETE FROM admin_users WHERE email <> ?', [ADMIN_EMAIL]);

    const adminHash = await bcrypt.hash(ADMIN_PASS, 12);
    await conn.execute(
      `INSERT INTO admin_users (id, email, password_hash, name, is_super_admin, is_active)
       VALUES (UUID(), ?, ?, 'Super Administrator', 1, 1)
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), is_super_admin = 1, is_active = 1, name='Super Administrator'`,
      [ADMIN_EMAIL, adminHash]
    );

    await conn.execute('DELETE FROM coffee_growers WHERE email <> ?', [GROWER_EMAIL]);

    const growerHash = await bcrypt.hash(GROWER_PASS, 12);
    await conn.execute(
      `INSERT INTO coffee_growers (id, email, password_hash, full_name, status)
       VALUES (UUID(), ?, ?, 'santiago salazar', 'active')
       ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), status='active', full_name='santiago salazar'`,
      [GROWER_EMAIL, growerHash]
    );

    const [growerRow] = await conn.execute('SELECT id FROM coffee_growers WHERE email = ? LIMIT 1', [GROWER_EMAIL]);
    if (!growerRow || growerRow.length === 0) throw new Error('Grower not found after upsert');
    const growerId = growerRow[0].id;

    await conn.execute('DELETE FROM farms WHERE coffee_grower_id = ?', [growerId]);
    await conn.execute(
      `INSERT INTO farms (id, coffee_grower_id, name, status)
       VALUES (UUID(), ?, ?, 'active')`,
      [growerId, FARM_NAME]
    );

    console.log('✅ Sistema reiniciado: admin y caficultor configurados');
    await conn.execute('SET FOREIGN_KEY_CHECKS=1');
  } catch (e) {
    console.error('❌ Error en reseteo del sistema:', e.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

run();

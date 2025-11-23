const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env.production') });

async function verifyAdmin(email, plainPassword) {
  const config = {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: 'utf8mb4',
    timezone: '+00:00',
    ssl: { rejectUnauthorized: false }
  };

  const result = { exists: false, role: null, passwordMatch: false, admin: null };
  let connection;
  try {
    connection = await mysql.createConnection(config);
    const [rows] = await connection.execute(
      'SELECT id, email, password_hash, name, is_super_admin, is_active FROM admin_users WHERE email = ? LIMIT 1',
      [email]
    );

    if (rows.length === 0) {
      return result;
    }

    const admin = rows[0];
    result.exists = true;
    result.role = admin.is_super_admin ? 'super_admin' : 'admin';
    result.admin = { id: admin.id, email: admin.email, name: admin.name, is_active: admin.is_active };

    if (admin.password_hash) {
      result.passwordMatch = await bcrypt.compare(plainPassword, admin.password_hash);
    }

    return result;
  } catch (err) {
    return { error: err.message, ...result };
  } finally {
    if (connection) await connection.end();
  }
}

async function main() {
  const email = process.argv[2] || 'asalaza110@msn.com';
  const password = process.argv[3] || 'ssc841209';

  const res = await verifyAdmin(email, password);
  if (res.error) {
    console.error('Error:', res.error);
    process.exitCode = 1;
  }

  console.log(JSON.stringify(res, null, 2));
}

main();
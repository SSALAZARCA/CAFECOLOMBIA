#!/usr/bin/env node
/**
 * Create or update a super admin user in admin_users
 */
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load env from api/.env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// Simple argv parsing
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--email') out.email = argv[++i];
    else if (a === '--password') out.password = argv[++i];
    else if (a === '--name') out.name = argv[++i];
  }
  return out;
}

const args = parseArgs(process.argv.slice(2));
const email = args.email;
const password = args.password;
const name = args.name || 'Super Administrator';

if (!email || !password) {
  console.error('Usage: node create-superadmin.cjs --email <email> --password <password> [--name <name>]');
  process.exit(1);
}

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
};

async function main() {
  let conn;
  try {
    conn = await mysql.createConnection(dbConfig);

    // Ensure table exists
    const [tables] = await conn.execute("SHOW TABLES LIKE 'admin_users'");
    if (tables.length === 0) {
      console.error('Table admin_users not found. Apply migrations first.');
      process.exit(2);
    }

    const [rows] = await conn.execute(
      'SELECT id, email FROM admin_users WHERE email = ? LIMIT 1',
      [email]
    );

    const hash = await bcrypt.hash(password, 10);

    if (rows.length > 0) {
      const id = rows[0].id;
      await conn.execute(
        'UPDATE admin_users SET password_hash = ?, name = ?, is_super_admin = true, is_active = true, updated_at = NOW() WHERE id = ?',
        [hash, name, id]
      );
      console.log(`Updated existing super admin: ${email}`);
    } else {
      const [res] = await conn.execute(
        'INSERT INTO admin_users (email, password_hash, name, is_super_admin, is_active, created_at) VALUES (?, ?, ?, true, true, NOW())',
        [email, hash, name]
      );
      console.log(`Created super admin ${email} with id ${res.insertId}`);
    }

    console.log('Done.');
  } catch (err) {
    console.error('Error creating super admin:', err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
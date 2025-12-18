const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST || '193.203.175.58',
    user: process.env.DB_USER || 'u689528678_SSALAZARCA',
    password: process.env.DB_PASSWORD || 'Ssc841209*',
    database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA',
    multipleStatements: true
};

const coffeeGrowersSql = `
CREATE TABLE IF NOT EXISTS \`coffee_growers\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`identification_number\` varchar(50) NOT NULL,
  \`identification_type\` enum('cedula','cedula_extranjeria','pasaporte','nit') NOT NULL,
  \`full_name\` varchar(255) NOT NULL,
  \`email\` varchar(255) DEFAULT NULL,
  \`password_hash\` varchar(255) DEFAULT NULL,
  \`phone\` varchar(20) DEFAULT NULL,
  \`status\` enum('active','inactive','suspended') NOT NULL DEFAULT 'active',
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  \`created_by\` varchar(36) NOT NULL DEFAULT 'system',
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`identification_number\` (\`identification_number\`),
  UNIQUE KEY \`email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

const farmsSql = `
CREATE TABLE IF NOT EXISTS \`farms\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`coffee_grower_id\` int(11) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`status\` enum('active','inactive','maintenance','abandoned') NOT NULL DEFAULT 'active',
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  \`created_by\` varchar(36) NOT NULL DEFAULT 'system',
  PRIMARY KEY (\`id\`),
  KEY \`idx_farms_coffee_grower\` (\`coffee_grower_id\`),
  CONSTRAINT \`fk_farms_coffee_grower\` FOREIGN KEY (\`coffee_grower_id\`) REFERENCES \`coffee_growers\` (\`id\`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`;

async function fixDb() {
    console.log('🔧 Fixing DB...');
    const connection = await mysql.createConnection(config);
    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        // 1. Fix Admin Password
        const newHash = await bcrypt.hash('admin123', 10);
        await connection.execute('UPDATE admin_users SET password_hash = ? WHERE email = ?', [newHash, 'admin@cafecolombia.com']);
        console.log('✅ Admin password updated.');

        // Recreate tables to ensure schema
        await connection.query('DROP TABLE IF EXISTS farms');
        await connection.query('DROP TABLE IF EXISTS coffee_growers');
        console.log('🗑️ Tables dropped.');


        // 2. Create coffee_growers
        await connection.query(coffeeGrowersSql);
        console.log('✅ coffee_growers table created.');

        // 3. Create farms
        await connection.query(farmsSql);
        console.log('✅ farms table created.');

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await connection.end();
    }
}

fixDb();

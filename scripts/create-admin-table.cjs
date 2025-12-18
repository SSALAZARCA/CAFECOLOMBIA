const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST || '193.203.175.58',
    user: process.env.DB_USER || 'u689528678_SSALAZARCA',
    password: process.env.DB_PASSWORD || 'Ssc841209*',
    database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA',
    multipleStatements: true
};

const sql = `
CREATE TABLE IF NOT EXISTS \`admin_users\` (
  \`id\` int(11) NOT NULL AUTO_INCREMENT,
  \`email\` varchar(255) NOT NULL,
  \`password_hash\` varchar(255) NOT NULL,
  \`name\` varchar(255) NOT NULL,
  \`is_super_admin\` tinyint(1) DEFAULT '0',
  \`is_active\` tinyint(1) DEFAULT '1',
  \`two_factor_secret\` varchar(255) DEFAULT NULL,
  \`two_factor_enabled\` tinyint(1) DEFAULT '0',
  \`last_login_at\` timestamp NULL DEFAULT NULL,
  \`failed_login_attempts\` int(11) DEFAULT '0',
  \`locked_until\` timestamp NULL DEFAULT NULL,
  \`created_at\` timestamp NOT NULL DEFAULT current_timestamp(),
  \`updated_at\` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (\`id\`),
  UNIQUE KEY \`email\` (\`email\`),
  KEY \`idx_admin_status\` (\`is_active\`),
  KEY \`idx_admin_email\` (\`email\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO \`admin_users\` (\`email\`,\`password_hash\`,\`name\`,\`is_super_admin\`,\`is_active\`) VALUES
('admin@cafecolombia.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Administrador Principal', 1, 1);
`;

async function createAdminTable() {
    console.log('Creating admin_users...');
    const connection = await mysql.createConnection(config);
    try {
        await connection.query(sql);
        console.log('✅ admin_users table created and user seeded.');
    } catch (e) {
        console.error('❌ Error:', e.message);
    } finally {
        await connection.end();
    }
}

createAdminTable();

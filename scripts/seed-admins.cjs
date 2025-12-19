const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const { URL } = require('url');
const crypto = require('crypto');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

async function getDbConfig() {
    let config = {
        ssl: { rejectUnauthorized: false }
    };

    // Prioritize DATABASE_URL if available (Prisma style)
    if (process.env.DATABASE_URL) {
        try {
            console.log('Parsing DATABASE_URL for connection...');
            const dbUrl = new URL(process.env.DATABASE_URL);
            config.host = dbUrl.hostname;
            config.port = parseInt(dbUrl.port || '3306');
            config.user = dbUrl.username;
            config.password = dbUrl.password;
            config.database = dbUrl.pathname.replace('/', '');
            return config;
        } catch (e) {
            console.error("Failed to parse DATABASE_URL, falling back to individual vars", e);
        }
    }

    // Fallback to individual vars
    config.host = process.env.DB_HOST || process.env.MYSQL_HOST;
    config.port = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306');
    config.user = process.env.DB_USER || process.env.MYSQL_USER;
    config.password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
    config.database = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'default';

    return config;
}

const admins = [
    { email: 'ssalazarca84@gmail.com', password: 'change_me_in_code', firstName: 'Admin', lastName: 'SS' },
    { email: 'asalaza6@gmail.com', password: 'change_me_in_code', firstName: 'Admin', lastName: 'AS' }
];

async function seedAdmins() {
    try {
        const dbConfig = await getDbConfig();
        console.log('Connecting to database at:', dbConfig.host);

        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        for (const admin of admins) {
            // Check if user exists in admin_users table
            const [existing] = await connection.execute(
                'SELECT id FROM admin_users WHERE email = ?',
                [admin.email]
            );

            let plainPassword = '';
            if (admin.email === 'ssalazarca84@gmail.com') plainPassword = 'ssc841209';
            if (admin.email === 'asalaza6@gmail.com') plainPassword = 'asc1982';

            const hashedPassword = await bcrypt.hash(plainPassword, 10);
            const fullName = `${admin.firstName} ${admin.lastName}`;

            if (existing.length === 0) {
                // Insert into admin_users
                // Schema: id (auto), email, password_hash, name, is_super_admin, is_active, created_at
                await connection.execute(
                    `INSERT INTO admin_users (email, password_hash, name, is_super_admin, is_active, created_at) 
                     VALUES (?, ?, ?, 1, 1, NOW())`,
                    [admin.email, hashedPassword, fullName]
                );
                console.log(`✅ Created AdminUser: ${admin.email}`);
            } else {
                // Update password ensuring it matches the code
                await connection.execute(
                    `UPDATE admin_users SET password_hash = ? WHERE email = ?`,
                    [hashedPassword, admin.email]
                );
                console.log(`🔄 Updated password for existing AdminUser: ${admin.email}`);
            }
        }

        await connection.end();
        console.log('Done.');
    } catch (error) {
        console.error('Error seeding admins:', error);
        process.exit(1);
    }
}

seedAdmins();

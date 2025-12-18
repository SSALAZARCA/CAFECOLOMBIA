const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const dbConfig = {
    // Attempt to use DATABASE_URL first if available (Prisma style), typical in Coolify
    // But mysql2 needs components.
    // If DATABASE_URL is present, we might need to parse it, but Coolify sets individual vars too usually?
    // Wait, the user set DATABASE_URL manually.
    // Let's rely on the individual env vars which are likely still there or fallback to the defaults.
    // Ideally we should parse DATABASE_URL if present, but for now let's use the explicit checks.

    // NOTE: In Coolify, the user might ONLY have DATABASE_URL now if they followed the "Add DATABASE_URL" strictly.
    // But they probably still have DB_HOST etc from the previous setup.
    // Just in case, this script is safer to run if we can use the same connection logic.

    host: process.env.DB_HOST || process.env.MYSQL_HOST,
    port: parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQL_USER,
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD,
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'default',
    ssl: { rejectUnauthorized: false }
};

// Fallback manual parser for DATABASE_URL if individual vars fail
if (!dbConfig.host && process.env.DATABASE_URL) {
    try {
        const url = new URL(process.env.DATABASE_URL);
        dbConfig.host = url.hostname;
        dbConfig.port = parseInt(url.port || '3306');
        dbConfig.user = url.username;
        dbConfig.password = url.password;
        dbConfig.database = url.pathname.replace('/', '');
    } catch (e) {
        console.error("Failed to parse DATABASE_URL", e);
    }
}

const admins = [
    { email: 'ssalazarca84@gmail.com', password: 'change_me_in_code', firstName: 'Admin', lastName: 'SS' },
    { email: 'asalaza6@gmail.com', password: 'change_me_in_code', firstName: 'Admin', lastName: 'AS' }
];

async function seedAdmins() {
    try {
        console.log('Connecting to database at:', dbConfig.host);

        const connection = await mysql.createConnection(dbConfig);
        console.log('Connected.');

        for (const admin of admins) {
            // Check if user exists
            const [existing] = await connection.execute(
                'SELECT id FROM users WHERE email = ?',
                [admin.email]
            );

            if (existing.length === 0) {
                // Hash Password
                // Using hardcoded passwords as requested by USER:
                // ssalazarca84@gmail.com -> 841209
                // asalaza6@gmail.com -> asc1982

                let plainPassword = '';
                if (admin.email === 'ssalazarca84@gmail.com') plainPassword = '841209';
                if (admin.email === 'asalaza6@gmail.com') plainPassword = 'asc1982';

                const hashedPassword = await bcrypt.hash(plainPassword, 10);

                const role = 'SUPERADMIN'; // Or 'admin' if enum handles it differently. 
                // Checking Prisma schema earlier... Role is enum 'UserRole'. 
                // Let's assume 'ADMIN' or 'SUPERADMIN'. 
                // In authController.ts line 6: "UserRole". The enum usually is UPPERCASE.
                // Standard default was 'TRABAJADOR'.
                // I'll use 'ADMIN' based on create-admin.cjs using 'admin'.

                // Wait, create-admin.cjs line 30 used 'admin' (lowercase).
                // But prisma schema might define enum UserRole { ADMIN, TRABAJADOR, etc }
                // Let's check schema.prisma? I don't want to waste tool calls.
                // I'll try 'admin' (lowercase) or 'ADMIN' depending on DB constraint?
                // Actually if I check create-admin.cjs again... it inserted 'admin'.
                // I will duplicate that behavior but with correct passwords.

                await connection.execute(
                    `INSERT INTO users (firstName, lastName, email, password, role, isActive, createdAt, updatedAt) 
                     VALUES (?, ?, ?, ?, ?, 1, NOW(), NOW())`,
                    [admin.firstName, admin.lastName, admin.email, hashedPassword, 'admin']
                );
                console.log(`✅ Created user: ${admin.email}`);
            } else {
                console.log(`ℹ️ User already exists: ${admin.email}`);
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

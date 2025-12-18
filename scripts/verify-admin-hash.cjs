const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST || '193.203.175.58',
    user: process.env.DB_USER || 'u689528678_SSALAZARCA',
    password: process.env.DB_PASSWORD || 'Ssc841209*',
    database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA'
};

async function verify() {
    // 1. Check Hash
    const password = 'admin123';
    const hash = '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi';
    const match = await bcrypt.compare(password, hash);
    console.log('Hash verification for "admin123":', match);

    // 2. Check DB User
    const connection = await mysql.createConnection(config);
    try {
        const [rows] = await connection.execute('SELECT * FROM admin_users WHERE email = ?', ['admin@cafecolombia.com']);
        console.log('Admin user found in DB:', rows.length > 0);
        if (rows.length > 0) {
            const dbMatch = await bcrypt.compare(password, rows[0].password_hash);
            console.log('DB Hash verification:', dbMatch);
        }
    } catch (e) {
        console.error('DB Error:', e.message);
    } finally {
        await connection.end();
    }
}
verify();

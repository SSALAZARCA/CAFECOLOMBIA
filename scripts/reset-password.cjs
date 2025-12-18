const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const bcrypt = require('bcryptjs');
const { URL } = require('url');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

async function getDbConfig() {
    let config = {
        ssl: { rejectUnauthorized: false }
    };

    if (process.env.DATABASE_URL) {
        try {
            const dbUrl = new URL(process.env.DATABASE_URL);
            config.host = dbUrl.hostname;
            config.port = parseInt(dbUrl.port || '3306');
            config.user = dbUrl.username;
            config.password = dbUrl.password;
            config.database = dbUrl.pathname.replace('/', '');
            return config;
        } catch (e) { console.error(e); }
    }

    config.host = process.env.DB_HOST || process.env.MYSQL_HOST;
    config.port = parseInt(process.env.DB_PORT || process.env.MYSQL_PORT || '3306');
    config.user = process.env.DB_USER || process.env.MYSQL_USER;
    config.password = process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD;
    config.database = process.env.DB_NAME || process.env.MYSQL_DATABASE || 'default';

    return config;
}

const usersToReset = [
    { email: 'ssalazarca84@gmail.com', password: 'ssc841209' },
    { email: 'asalaza6@gmail.com', password: 'asc1982' }
];

async function resetPasswords() {
    try {
        console.log('--- FORZANDO RESET DE CONTRASEÑAS ---');
        const dbConfig = await getDbConfig();
        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a BD');

        for (const user of usersToReset) {
            console.log(`\nProcesando: ${user.email}`);

            // 1. Check existence
            const [rows] = await connection.execute('SELECT id FROM users WHERE email = ?', [user.email]);

            if (rows.length === 0) {
                console.log(`⚠️ Usuario NO encontrado. Saltando.`);
                continue;
            }

            // 2. Hash New Password
            const hashedPassword = await bcrypt.hash(user.password, 10);

            // 3. Force Update
            const [result] = await connection.execute(
                'UPDATE users SET password = ?, isActive = 1, role = ? WHERE email = ?',
                [hashedPassword, 'admin', user.email]
            );

            console.log(`UPDATE Resultado: Rows Affected = ${result.affectedRows}, Changed = ${result.changedRows}`);

            if (result.affectedRows > 0) {
                console.log(`✅ Contraseña ACTUALIZADA CORRECTAMENTE a: "${user.password}"`);
            } else {
                console.log(`ℹ️ La contraseña ya era esa (no hubo cambios).`);
            }
        }

        await connection.end();
        console.log('\n--- LISTO ---');
    } catch (error) {
        console.error('❌ Error fatal:', error);
    }
}

resetPasswords();

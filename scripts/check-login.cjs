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

const testEmail = 'ssalazarca84@gmail.com';
const testPassword = 'ssc841209';

async function checkLogin() {
    try {
        console.log('--- DIAGNOSTICO DE LOGIN ---');
        const dbConfig = await getDbConfig();
        console.log(`Conectando a BD: ${dbConfig.host} (Usuario: ${dbConfig.user})`);

        const connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión Exitosa');

        // 1. Buscar Usuario
        const [rows] = await connection.execute('SELECT * FROM users WHERE email = ?', [testEmail]);

        if (rows.length === 0) {
            console.error(`❌ El usuario ${testEmail} NO EXISTE en la base de datos.`);
            process.exit(1);
        }

        const user = rows[0];
        console.log(`✅ Usuario encontrado: ID=${user.id}, Role=${user.role}`);
        console.log(`🔑 Hash en BD: ${user.password.substring(0, 20)}...`);

        // 2. Probar Contraseña
        console.log(`Testing password: "${testPassword}"`);
        const isMatch = await bcrypt.compare(testPassword, user.password);

        if (isMatch) {
            console.log('✅ ¡CONTRASEÑA CORRECTA! bcrypt.compare() devolvió TRUE.');
            console.log('El problema NO es la base de datos ni la contraseña.');
        } else {
            console.error('❌ ¡CONTRASEÑA INCORRECTA! bcrypt.compare() devolvió FALSE.');
            console.log('El hash en la base de datos no coincide con la contraseña probada.');

            // Intento de generar el hash de nuevo para ver
            const newHash = await bcrypt.hash(testPassword, 10);
            console.log(`Generando nuevo hash de prueba: ${newHash.substring(0, 20)}...`);
        }

        await connection.end();
    } catch (error) {
        console.error('❌ Error fatal:', error);
    }
}

checkLogin();

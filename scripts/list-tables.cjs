const mysql = require('mysql2/promise');
require('dotenv').config();

// Fallback to hardcoded credentials if env read fails (though .env is preferred)
const config = {
    host: process.env.DB_HOST || '193.203.175.58',
    user: process.env.DB_USER || 'u689528678_SSALAZARCA',
    password: process.env.DB_PASSWORD || 'Ssc841209*',
    database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA'
};

async function listTables() {
    console.log('Connecting to:', config.host, config.database);
    const connection = await mysql.createConnection(config);
    try {
        const [rows] = await connection.execute('SHOW TABLES');
        console.log('Tables:', rows.map(r => Object.values(r)[0]));

        // Check specifics
        const [exists] = await connection.execute("SHOW TABLES LIKE 'admin_users'");
        console.log('admin_users exists:', exists.length > 0);
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await connection.end();
    }
}
listTables();

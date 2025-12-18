const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const config = {
    host: process.env.DB_HOST || '193.203.175.58',
    user: process.env.DB_USER || 'u689528678_SSALAZARCA',
    password: process.env.DB_PASSWORD || 'Ssc841209*',
    database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA',
    multipleStatements: true
};

async function restoreSchema() {
    console.log('Connecting to restore schema...', config.database);
    const connection = await mysql.createConnection(config);
    try {
        const sqlPath = path.join(__dirname, '../database-schema-complete.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        // Simple execution of the whole file (mysql2 supports multipleStatements)
        // Note: DELIMITER syntax might confuse the driver if not handled, but usually the driver ignores it or needs stripped.
        // We'll try running it as a big block. If it fails on DELIMITER, we might need manual parsing.

        // Remove DELIMITER commands as they are client-side only usually
        const cleanSql = sql.replace(/DELIMITER \/\/|DELIMITER ;/g, '');

        // Also the triggers need to be handled carefuly. 
        // For now, let's try to just run the CREATE TABLE parts if strictly needed.
        // But let's try running the whole thing first.

        await connection.query(cleanSql);
        console.log('Schema restored successfully.');
    } catch (e) {
        console.error('Error executing SQL:', e.message);
        // Fallback: Split by statement and try individually? 
        // Or just print error.
    } finally {
        await connection.end();
    }
}

restoreSchema();

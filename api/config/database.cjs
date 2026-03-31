const mysql = require('mysql2/promise');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
try {
    const isProduction = (process.env.NODE_ENV || 'development') === 'production';
    if (!isProduction) {
        const envPath = path.join(__dirname, '../../.env');
        if (fs.existsSync(envPath)) {
            dotenv.config({ path: envPath });
        } else {
            dotenv.config();
        }
    }
} catch (e) {
    console.warn('dotenv load skipped in db config:', e?.message);
}

const dbConfig = {
    host: process.env.DB_HOST || 'db', // 'db' es el nombre del servicio en docker-compose
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
    password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || 'cafe2024',
    database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'cafe_colombia',
    charset: 'utf8mb4',
    timezone: '+00:00',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

module.exports = {
    pool,
    dbConfig
};

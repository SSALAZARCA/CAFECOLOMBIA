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

async function resetAndSeed() {
    console.log('🔄 Iniciando reseteo total de credenciales...');
    const connection = await mysql.createConnection(config);

    try {
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');

        // 1. Limpiar tablas
        console.log('🗑️  Truncando tablas de usuarios...');
        await connection.query('TRUNCATE TABLE admin_users');
        await connection.query('TRUNCATE TABLE coffee_growers');
        await connection.query('TRUNCATE TABLE farms'); // Limpiar fincas para evitar huérfanos

        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        // 2. Preparar Hash Común
        const plainPassword = 'password123';
        const hashedPassword = await bcrypt.hash(plainPassword, 10);
        console.log(`🔑 Contraseña generada para todos: "${plainPassword}"`);

        // 3. Insertar Admin
        console.log('👤 Creando Admin...');
        await connection.execute(
            `INSERT INTO admin_users (email, password_hash, name, is_super_admin, is_active) 
             VALUES (?, ?, ?, 1, 1)`,
            ['admin@test.com', hashedPassword, 'Admin Test']
        );

        // 4. Insertar Caficultor
        console.log('👨‍🌾 Creando Caficultor...');
        await connection.execute(
            `INSERT INTO coffee_growers (
                identification_number, identification_type, full_name, email, 
                password_hash, status, created_by
            ) VALUES (?, ?, ?, ?, ?, 'active', 'system')`,
            ['123456789', 'cedula', 'Caficultor Test', 'caficultor@test.com', hashedPassword]
        );

        console.log('\n✅ RESETEO COMPLETADO EXITOSAMENTE');
        console.log('------------------------------------------------');
        console.log('👉 Admin User:      admin@test.com');
        console.log('👉 Coffee Grower:   caficultor@test.com');
        console.log('🔑 Password:        password123');
        console.log('------------------------------------------------');

    } catch (e) {
        console.error('❌ Error crítico durante el reseteo:', e);
    } finally {
        await connection.end();
    }
}

resetAndSeed();

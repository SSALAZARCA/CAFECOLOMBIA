const mysql = require('mysql2/promise');

// Configuración usando las credenciales del .env
const dbConfig = {
    host: '193.203.175.58',
    port: 3306,
    user: 'u689528678_SSALAZARCA',
    password: 'Ssc841209*',
    database: 'u689528678_CAFECOLOMBIA',
    charset: 'utf8mb4',
    timezone: '+00:00',
    ssl: {
        rejectUnauthorized: false
    }
};

async function quickCheck() {
    let connection;
    
    try {
        console.log('🔍 Verificación rápida de la base de datos...\n');
        
        // Conectar
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa');
        console.log(`📡 Host: ${dbConfig.host}`);
        console.log(`🗄️  Base de datos: ${dbConfig.database}\n`);
        
        // Contar tablas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`📊 Total de tablas: ${tables.length}\n`);
        
        // Listar primeras 10 tablas
        console.log('📋 Primeras tablas encontradas:');
        tables.slice(0, 10).forEach((table, index) => {
            const tableName = Object.values(table)[0];
            console.log(`   ${index + 1}. ${tableName}`);
        });
        
        if (tables.length > 10) {
            console.log(`   ... y ${tables.length - 10} tablas más`);
        }
        
        // Verificar tabla de migraciones
        console.log('\n🔄 Verificando migraciones:');
        try {
            const [migrations] = await connection.execute('SELECT COUNT(*) as count FROM migrations');
            console.log(`✅ ${migrations[0].count} migraciones ejecutadas`);
        } catch (error) {
            console.log('⚠️  Tabla de migraciones no encontrada');
        }
        
        // Verificar algunas tablas clave
        console.log('\n📋 Verificando tablas clave:');
        const keyTables = ['users', 'coffee_growers', 'farms', 'roles'];
        
        for (const table of keyTables) {
            try {
                const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                console.log(`   ✅ ${table}: ${count[0].count} registros`);
            } catch (error) {
                console.log(`   ❌ ${table}: No encontrada`);
            }
        }
        
        console.log('\n🎉 Verificación completada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
        if (error.code) {
            console.error('Código:', error.code);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

quickCheck()
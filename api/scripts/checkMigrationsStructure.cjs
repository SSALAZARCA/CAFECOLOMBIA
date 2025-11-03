const mysql = require('mysql2/promise');

// Configuración usando las credenciales correctas
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

async function checkMigrationsStructure() {
    let connection;
    
    try {
        console.log('🔍 Verificando estructura de la tabla migrations...\n');
        
        // Conectar
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa');
        
        // Verificar si existe la tabla migrations
        const [tables] = await connection.execute("SHOW TABLES LIKE 'migrations'");
        
        if (tables.length === 0) {
            console.log('❌ La tabla migrations no existe');
            return;
        }
        
        // Mostrar estructura de la tabla
        const [structure] = await connection.execute('DESCRIBE migrations');
        console.log('📋 Estructura de la tabla migrations:');
        structure.forEach(col => {
            console.log(`   ${col.Field} - ${col.Type} - ${col.Null} - ${col.Key} - ${col.Default}`);
        });
        
        // Mostrar contenido actual
        const [migrations] = await connection.execute('SELECT * FROM migrations ORDER BY id');
        console.log(`\n📊 Migraciones registradas: ${migrations.length}`);
        migrations.forEach(m => {
            console.log(`   ${m.id}: ${m.filename || m.migration_name || 'Sin nombre'} - ${m.executed_at}`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

checkMigrationsStructure();
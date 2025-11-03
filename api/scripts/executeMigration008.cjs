const mysql = require('mysql2/promise');
const fs = require('fs').promises;

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

async function executeMigration008() {
    let connection;
    
    try {
        console.log('🚀 Ejecutando migración 008_payments_audit.sql...\n');
        
        // Conectar
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa');
        
        // Leer el archivo de migración
        const migrationPath = 'api/migrations/008_payments_audit.sql';
        const migrationSQL = await fs.readFile(migrationPath, 'utf8');
        
        // Dividir en statements individuales
        const statements = migrationSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📋 Ejecutando ${statements.length} statements...\n`);
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                    console.log(`✅ Statement ${i + 1}/${statements.length} ejecutado`);
                } catch (error) {
                    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
                        console.log(`⚠️  Statement ${i + 1}/${statements.length} - Tabla ya existe`);
                    } else {
                        console.error(`❌ Error en statement ${i + 1}:`, error.message);
                        console.log(`Statement: ${statement.substring(0, 100)}...`);
                    }
                }
            }
        }
        
        console.log('\n✅ Migración 008 completada');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

executeMigration008();
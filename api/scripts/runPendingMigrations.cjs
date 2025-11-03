const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

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

async function runPendingMigrations() {
    let connection;
    
    try {
        console.log('🚀 Ejecutando migraciones pendientes...\n');
        
        // Conectar
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa');
        console.log(`📡 Host: ${dbConfig.host}`);
        console.log(`🗄️  Base de datos: ${dbConfig.database}\n`);
        
        // Verificar migraciones ejecutadas
        const [migrations] = await connection.execute('SELECT migration_name FROM migrations ORDER BY id');
        const executedMigrations = migrations.map(m => m.migration_name);
        console.log(`📋 Migraciones ejecutadas: ${executedMigrations.length}`);
        executedMigrations.forEach(m => console.log(`   ✅ ${m}`));
        
        // Migraciones pendientes
        const pendingMigrations = [
            '008_payments_audit.sql',
            '009_ai_analysis_advanced.sql',
            '010_notifications_reports.sql'
        ];
        
        console.log('\n🔄 Ejecutando migraciones pendientes:');
        
        for (const migrationFile of pendingMigrations) {
            if (executedMigrations.includes(migrationFile)) {
                console.log(`   ⏭️  ${migrationFile} - Ya ejecutada`);
                continue;
            }
            
            console.log(`   🔄 Ejecutando ${migrationFile}...`);
            
            try {
                // Leer archivo de migración
                const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
                const migrationSQL = await fs.readFile(migrationPath, 'utf8');
                
                // Dividir en statements individuales
                const statements = migrationSQL
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
                
                // Ejecutar cada statement
                for (const statement of statements) {
                    if (statement.trim()) {
                        await connection.execute(statement);
                    }
                }
                
                // Registrar migración como ejecutada
                await connection.execute(
                    'INSERT INTO migrations (migration_name, executed_at) VALUES (?, NOW())',
                    [migrationFile]
                );
                
                console.log(`   ✅ ${migrationFile} - Ejecutada exitosamente`);
                
            } catch (error) {
                console.error(`   ❌ Error ejecutando ${migrationFile}:`, error.message);
                throw error;
            }
        }
        
        console.log('\n🎉 Todas las migraciones pendientes han sido ejecutadas exitosamente!');
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        if (error.code) {
            console.error('Código de error:', error.code);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

// Ejecutar
runPendingMigrations();
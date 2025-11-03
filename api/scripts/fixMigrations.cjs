const mysql = require('mysql2/promise');

// Configuración de la base de datos
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

async function fixMigrations() {
    let connection;
    
    try {
        console.log('🔧 Corrigiendo registros de migraciones...\n');
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a la base de datos\n');
        
        // Verificar migraciones actuales
        const [currentMigrations] = await connection.execute(
            'SELECT filename FROM migrations ORDER BY executed_at'
        );
        
        console.log('📋 Migraciones actualmente registradas:');
        currentMigrations.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.filename}`);
        });
        
        // Migraciones que deberían estar
        const expectedMigrations = [
            '001_initial_setup.sql',
            '002_initial_data.sql', 
            '003_coffee_growers_farms.sql',
            '004_lots_harvests.sql',
            '005_inventory_phytosanitary.sql',
            '006_traceability_tasks.sql',
            '007_market_analysis_subscriptions.sql',
            '008_payments_audit.sql',
            '009_ai_analysis_advanced.sql',
            '010_notifications_reports.sql'
        ];
        
        const registeredMigrations = currentMigrations.map(row => row.filename);
        const missingMigrations = expectedMigrations.filter(migration => 
            !registeredMigrations.includes(migration)
        );
        
        console.log(`\n🔍 Migraciones faltantes en el registro: ${missingMigrations.length}`);
        
        if (missingMigrations.length > 0) {
            console.log('📝 Registrando migraciones faltantes:');
            
            for (const migration of missingMigrations) {
                try {
                    await connection.execute(
                        'INSERT INTO migrations (filename, executed_at) VALUES (?, NOW())',
                        [migration]
                    );
                    console.log(`   ✅ ${migration} registrada`);
                } catch (error) {
                    console.log(`   ❌ Error registrando ${migration}: ${error.message}`);
                }
            }
        }
        
        // Verificar estado final
        const [finalMigrations] = await connection.execute(
            'SELECT filename, executed_at FROM migrations ORDER BY executed_at'
        );
        
        console.log(`\n📊 Estado final: ${finalMigrations.length} migraciones registradas`);
        finalMigrations.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.filename} - ${row.executed_at}`);
        });
        
        // Verificar tablas existentes
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`\n🗄️  Total de tablas en la base de datos: ${tables.length}`);
        
        console.log('\n🎉 Corrección de migraciones completada!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

fixMigrations();
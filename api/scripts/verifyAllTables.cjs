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

async function verifyAllTables() {
    let connection;
    
    try {
        console.log('🔍 Verificando todas las tablas...\n');
        
        // Conectar
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa');
        
        // Obtener todas las tablas
        const [tables] = await connection.execute('SHOW TABLES');
        const tableNames = tables.map(t => Object.values(t)[0]);
        
        console.log(`📊 Total de tablas: ${tableNames.length}\n`);
        
        // Tablas esperadas por migración
        const expectedTables = {
            '001_initial_setup.sql': ['users', 'admin_users', 'admin_sessions'],
            '002_initial_data.sql': ['coffee_prices'],
            '003_coffee_growers_farms.sql': ['coffee_growers', 'farms'],
            '004_lots_harvests.sql': ['lots', 'harvests'],
            '005_inventory_phytosanitary.sql': ['inventory_categories', 'inventory_items', 'inventory_movements', 'phytosanitary_applications'],
            '006_traceability_tasks.sql': ['traceability_records', 'tasks'],
            '007_market_analysis_subscriptions.sql': ['market_analysis', 'subscriptions'],
            '008_payments_audit.sql': ['payments', 'audit_logs'],
            '009_ai_analysis_advanced.sql': ['ai_analysis_results', 'ai_notifications'],
            '010_notifications_reports.sql': ['notifications', 'reports']
        };
        
        // Verificar cada grupo de tablas
        for (const [migration, expectedTablesForMigration] of Object.entries(expectedTables)) {
            console.log(`📋 ${migration}:`);
            for (const tableName of expectedTablesForMigration) {
                if (tableNames.includes(tableName)) {
                    // Contar registros
                    const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                    console.log(`   ✅ ${tableName}: ${count[0].count} registros`);
                } else {
                    console.log(`   ❌ ${tableName}: No encontrada`);
                }
            }
            console.log('');
        }
        
        // Mostrar todas las tablas encontradas
        console.log('📋 Todas las tablas en la base de datos:');
        tableNames.sort().forEach((table, index) => {
            console.log(`   ${index + 1}. ${table}`);
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

verifyAllTables()
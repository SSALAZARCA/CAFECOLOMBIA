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

async function checkSpecificTables() {
    let connection;
    
    try {
        console.log('🔍 Verificando tablas específicas...\n');
        
        // Conectar
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa');
        
        // Tablas a verificar
        const tablesToCheck = [
            'payments', 'audit_logs', 'ai_analysis_results', 'ai_notifications',
            'notifications', 'reports', 'market_analysis', 'phytosanitary_applications'
        ];
        
        for (const tableName of tablesToCheck) {
            try {
                const [tables] = await connection.execute(`SHOW TABLES LIKE '${tableName}'`);
                if (tables.length > 0) {
                    const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
                    console.log(`✅ ${tableName}: Existe - ${count[0].count} registros`);
                } else {
                    console.log(`❌ ${tableName}: No existe`);
                }
            } catch (error) {
                console.log(`❌ ${tableName}: Error - ${error.message}`);
            }
        }
        
        // Buscar tablas que contengan palabras clave
        console.log('\n🔍 Buscando tablas relacionadas...');
        const [allTables] = await connection.execute('SHOW TABLES');
        const tableNames = allTables.map(t => Object.values(t)[0]);
        
        const keywords = ['payment', 'audit', 'ai_', 'notification', 'report', 'market', 'phyto'];
        
        keywords.forEach(keyword => {
            const matchingTables = tableNames.filter(table => table.toLowerCase().includes(keyword.toLowerCase()));
            if (matchingTables.length > 0) {
                console.log(`📋 Tablas con "${keyword}": ${matchingTables.join(', ')}`);
            }
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

checkSpecificTables();
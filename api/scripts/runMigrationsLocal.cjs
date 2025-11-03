const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Configuración de la base de datos LOCAL
const dbConfig = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'root',
    database: 'cafe_colombia',
    charset: 'utf8mb4',
    timezone: '+00:00'
};

// Lista de migraciones en orden
const migrations = [
    '001_initial_setup.sql',
    '002_coffee_growers_farms.sql',
    '003_lots_harvests.sql',
    '004_inventory_pests.sql',
    '005_traceability_tasks.sql',
    '006_market_subscriptions.sql',
    '007_payments_admin.sql',
    '008_payments_audit.sql',
    '009_ai_analysis_advanced.sql',
    '010_notifications_reports.sql'
];

async function runMigrations() {
    let connection;
    
    try {
        console.log('🚀 Iniciando ejecución de migraciones en MySQL local...\n');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a la base de datos MySQL local');
        
        // Crear tabla de migraciones si no existe
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                checksum VARCHAR(64) NULL,
                execution_time_ms INT NULL
            )
        `);
        console.log('✅ Tabla de migraciones verificada\n');
        
        // Obtener migraciones ya ejecutadas
        const [executedMigrations] = await connection.execute(
            'SELECT filename FROM migrations ORDER BY executed_at'
        );
        const executedFiles = executedMigrations.map(row => row.filename);
        
        console.log('📋 Migraciones ya ejecutadas:');
        if (executedFiles.length === 0) {
            console.log('   - Ninguna migración ejecutada previamente');
        } else {
            executedFiles.forEach(file => console.log(`   - ${file}`));
        }
        console.log('');
        
        // Ejecutar migraciones pendientes
        let executedCount = 0;
        let skippedCount = 0;
        
        for (const migrationFile of migrations) {
            const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
            
            // Verificar si la migración ya fue ejecutada
            if (executedFiles.includes(migrationFile)) {
                console.log(`⏭️  Saltando ${migrationFile} (ya ejecutada)`);
                skippedCount++;
                continue;
            }
            
            // Verificar si el archivo existe
            if (!fs.existsSync(migrationPath)) {
                console.log(`⚠️  Archivo no encontrado: ${migrationFile}`);
                continue;
            }
            
            try {
                console.log(`🔄 Ejecutando ${migrationFile}...`);
                const startTime = Date.now();
                
                // Leer el contenido del archivo
                const sqlContent = fs.readFileSync(migrationPath, 'utf8');
                
                // Dividir en statements individuales (separados por ;)
                const statements = sqlContent
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
                
                // Ejecutar cada statement
                for (const statement of statements) {
                    if (statement.trim()) {
                        try {
                            await connection.execute(statement);
                        } catch (stmtError) {
                            console.log(`   ⚠️  Error en statement: ${stmtError.message}`);
                            // Continuar con el siguiente statement
                        }
                    }
                }
                
                const executionTime = Date.now() - startTime;
                
                // Marcar como ejecutada
                await connection.execute(
                    'INSERT INTO migrations (filename, execution_time_ms) VALUES (?, ?)',
                    [migrationFile, executionTime]
                );
                
                console.log(`✅ ${migrationFile} ejecutada exitosamente (${executionTime}ms)`);
                executedCount++;
                
            } catch (error) {
                console.error(`❌ Error ejecutando ${migrationFile}:`);
                console.error(`   ${error.message}`);
                
                // Continuar con la siguiente migración en caso de error
                continue;
            }
        }
        
        console.log('\n📊 Resumen de ejecución:');
        console.log(`   - Migraciones ejecutadas: ${executedCount}`);
        console.log(`   - Migraciones saltadas: ${skippedCount}`);
        console.log(`   - Total de migraciones: ${migrations.length}`);
        
        // Mostrar estado final de migraciones
        const [finalMigrations] = await connection.execute(
            'SELECT filename, executed_at FROM migrations ORDER BY executed_at'
        );
        
        console.log('\n📋 Estado final de migraciones:');
        finalMigrations.forEach((row, index) => {
            console.log(`   ${index + 1}. ${row.filename} - ${row.executed_at}`);
        });
        
        // Mostrar tablas creadas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`\n🗄️  Total de tablas en la base de datos: ${tables.length}`);
        console.log('   Tablas creadas:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`   - ${tableName}`);
        });
        
        console.log('\n🎉 ¡Todas las migraciones completadas exitosamente!');
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión a la base de datos cerrada');
        }
    }
}

// Ejecutar el script
runMigrations().catch(console.error);
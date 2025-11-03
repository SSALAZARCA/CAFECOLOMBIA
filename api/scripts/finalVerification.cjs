const mysql = require('mysql2/promise');

// Configuración de la base de datos REMOTA
const dbConfig = {
    host: 'srv1196.hstgr.io',
    port: 3306,
    user: 'u472469844_cafeadmin',
    password: '',
    database: 'u472469844_cafecolombia',
    charset: 'utf8mb4',
    timezone: '+00:00',
    ssl: {
        rejectUnauthorized: false
    }
};

// Tablas esperadas según las migraciones
const expectedTables = [
    // 001_initial_setup.sql
    'users', 'user_profiles', 'roles', 'permissions', 'user_roles', 'role_permissions',
    
    // 002_initial_data.sql (datos iniciales)
    
    // 003_coffee_growers_farms.sql
    'coffee_growers', 'farms', 'farm_certifications',
    
    // 004_lots_harvests.sql
    'lots', 'harvests', 'harvest_details',
    
    // 005_inventory_phytosanitary.sql
    'inventory', 'inventory_movements', 'pests', 'phytosanitary_treatments',
    
    // 006_traceability_tasks.sql
    'traceability', 'traceability_events', 'tasks', 'task_assignments',
    
    // 007_market_analysis_subscriptions.sql
    'market_analysis', 'price_history', 'subscription_plans', 'subscriptions',
    
    // 008_payments_audit.sql
    'payments', 'payment_methods', 'audit_logs',
    
    // 009_ai_analysis_advanced.sql
    'ai_analysis_results', 'phytosanitary_detections', 'ai_recommendations', 
    'predictive_models', 'predictions', 'optimization_suggestions', 'early_warning_alerts',
    
    // 010_notifications_reports.sql
    'notifications', 'notification_preferences', 'notification_templates',
    'system_reports', 'report_executions', 'system_configurations', 'activity_logs',
    
    // Tabla de control
    'migrations'
];

async function finalVerification() {
    let connection;
    
    try {
        console.log('🔍 VERIFICACIÓN FINAL DE LA BASE DE DATOS');
        console.log('==========================================\n');
        
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a la base de datos remota');
        console.log(`📡 Host: ${dbConfig.host}`);
        console.log(`🗄️  Base de datos: ${dbConfig.database}\n`);
        
        // Obtener todas las tablas existentes
        const [tables] = await connection.execute('SHOW TABLES');
        const existingTables = tables.map(table => Object.values(table)[0]);
        
        console.log(`📊 RESUMEN DE TABLAS:`);
        console.log(`   - Tablas esperadas: ${expectedTables.length}`);
        console.log(`   - Tablas encontradas: ${existingTables.length}\n`);
        
        // Verificar tablas faltantes
        const missingTables = expectedTables.filter(table => !existingTables.includes(table));
        const extraTables = existingTables.filter(table => !expectedTables.includes(table));
        
        if (missingTables.length === 0) {
            console.log('✅ TODAS LAS TABLAS ESPERADAS ESTÁN PRESENTES\n');
        } else {
            console.log(`❌ TABLAS FALTANTES (${missingTables.length}):`);
            missingTables.forEach(table => console.log(`   - ${table}`));
            console.log('');
        }
        
        if (extraTables.length > 0) {
            console.log(`ℹ️  TABLAS ADICIONALES (${extraTables.length}):`);
            extraTables.forEach(table => console.log(`   - ${table}`));
            console.log('');
        }
        
        // Verificar migraciones ejecutadas
        console.log('📋 MIGRACIONES EJECUTADAS:');
        try {
            const [migrations] = await connection.execute(
                'SELECT filename, executed_at FROM migrations ORDER BY executed_at'
            );
            
            if (migrations.length > 0) {
                migrations.forEach((row, index) => {
                    console.log(`   ${index + 1}. ${row.filename} - ${row.executed_at}`);
                });
            } else {
                console.log('   - No se encontraron registros de migraciones');
            }
        } catch (error) {
            console.log('   ⚠️  No se pudo acceder a la tabla de migraciones');
        }
        
        console.log('\n📋 LISTA COMPLETA DE TABLAS:');
        existingTables.sort().forEach((table, index) => {
            const status = expectedTables.includes(table) ? '✅' : 'ℹ️ ';
            console.log(`   ${index + 1}. ${status} ${table}`);
        });
        
        // Verificar algunas tablas clave con conteo de registros
        console.log('\n📊 VERIFICACIÓN DE DATOS:');
        const keyTables = ['users', 'coffee_growers', 'farms', 'subscription_plans', 'roles'];
        
        for (const table of keyTables) {
            if (existingTables.includes(table)) {
                try {
                    const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                    console.log(`   - ${table}: ${count[0].count} registros`);
                } catch (error) {
                    console.log(`   - ${table}: Error al contar registros`);
                }
            }
        }
        
        console.log('\n🎉 VERIFICACIÓN COMPLETADA');
        
        if (missingTables.length === 0) {
            console.log('✅ ¡TODAS LAS BASES DE DATOS HAN SIDO CREADAS EXITOSAMENTE!');
            console.log('✅ La aplicación Café Colombia está lista para funcionar');
        } else {
            console.log('⚠️  Algunas tablas están faltantes. Revisar las migraciones.');
        }
        
    } catch (error) {
        console.error('❌ Error en la verificación:', error.message);
        if (error.code) {
            console.error('Código de error:', error.code);
        }
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

finalVerification().catch(console.error);
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

// Configuración de la base de datos usando variables de entorno
const dbConfig = {
    host: process.env.DB_HOST || '193.203.175.58',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'u689528678_SSALAZARCA',
    password: process.env.DB_PASSWORD || 'Ssc841209*',
    database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA',
    charset: 'utf8mb4',
    timezone: '+00:00',
    ssl: {
        rejectUnauthorized: false
    }
};

// Tablas esperadas según las migraciones
const expectedTables = [
    // Sistema de usuarios
    'users', 'user_profiles', 'roles', 'permissions', 'user_roles', 'role_permissions',
    
    // Gestión cafetera
    'coffee_growers', 'farms', 'farm_certifications',
    
    // Lotes y cosechas
    'lots', 'harvests', 'harvest_details',
    
    // Inventario y control fitosanitario
    'inventory', 'inventory_movements', 'pests', 'phytosanitary_treatments',
    
    // Trazabilidad y tareas
    'traceability', 'traceability_events', 'tasks', 'task_assignments',
    
    // Mercado y suscripciones
    'market_analysis', 'price_history', 'subscription_plans', 'subscriptions',
    
    // Pagos y auditoría
    'payments', 'payment_methods', 'audit_logs',
    
    // IA y análisis avanzado
    'ai_analysis_results', 'phytosanitary_detections', 'ai_recommendations', 
    'predictive_models', 'predictions', 'optimization_suggestions', 'early_warning_alerts',
    
    // Notificaciones y reportes
    'notifications', 'notification_preferences', 'notification_templates',
    'system_reports', 'report_executions', 'system_configurations', 'activity_logs',
    
    // Control de migraciones
    'migrations'
];

async function verifyDatabase() {
    let connection;
    
    try {
        console.log('🔍 VERIFICACIÓN COMPLETA DE LA BASE DE DATOS');
        console.log('============================================\n');
        
        console.log('📡 Configuración de conexión:');
        console.log(`   Host: ${dbConfig.host}`);
        console.log(`   Puerto: ${dbConfig.port}`);
        console.log(`   Usuario: ${dbConfig.user}`);
        console.log(`   Base de datos: ${dbConfig.database}\n`);
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión exitosa a la base de datos\n');
        
        // 1. Listar todas las tablas existentes
        console.log('📋 1. LISTANDO TODAS LAS TABLAS:');
        const [tables] = await connection.execute('SHOW TABLES');
        const existingTables = tables.map(table => Object.values(table)[0]);
        
        console.log(`   Total de tablas encontradas: ${existingTables.length}`);
        existingTables.sort().forEach((table, index) => {
            const isExpected = expectedTables.includes(table);
            const status = isExpected ? '✅' : '⚠️ ';
            console.log(`   ${index + 1}. ${status} ${table}`);
        });
        
        // 2. Verificar tablas faltantes
        console.log('\n🔍 2. VERIFICANDO TABLAS ESPERADAS:');
        const missingTables = expectedTables.filter(table => !existingTables.includes(table));
        const extraTables = existingTables.filter(table => !expectedTables.includes(table));
        
        if (missingTables.length === 0) {
            console.log('✅ Todas las tablas esperadas están presentes');
        } else {
            console.log(`❌ Tablas faltantes (${missingTables.length}):`);
            missingTables.forEach(table => console.log(`   - ${table}`));
        }
        
        if (extraTables.length > 0) {
            console.log(`ℹ️  Tablas adicionales (${extraTables.length}):`);
            extraTables.forEach(table => console.log(`   - ${table}`));
        }
        
        // 3. Contar registros en cada tabla
        console.log('\n📊 3. CONTEO DE REGISTROS POR TABLA:');
        const tableCounts = {};
        
        for (const table of existingTables) {
            try {
                const [count] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
                tableCounts[table] = count[0].count;
                console.log(`   ${table}: ${count[0].count} registros`);
            } catch (error) {
                console.log(`   ${table}: Error al contar (${error.message})`);
                tableCounts[table] = 'Error';
            }
        }
        
        // 4. Verificar migraciones ejecutadas
        console.log('\n🔄 4. VERIFICANDO MIGRACIONES EJECUTADAS:');
        try {
            const [migrations] = await connection.execute(
                'SELECT filename, executed_at FROM migrations ORDER BY executed_at'
            );
            
            if (migrations.length > 0) {
                console.log(`✅ ${migrations.length} migraciones ejecutadas:`);
                migrations.forEach((row, index) => {
                    console.log(`   ${index + 1}. ${row.filename} - ${row.executed_at}`);
                });
            } else {
                console.log('⚠️  No se encontraron registros de migraciones');
            }
        } catch (error) {
            console.log('❌ Error al verificar migraciones:', error.message);
        }
        
        // 5. Verificar datos iniciales en tablas clave
        console.log('\n📋 5. VERIFICANDO DATOS INICIALES:');
        const keyTables = ['roles', 'permissions', 'subscription_plans', 'predictive_models'];
        
        for (const table of keyTables) {
            if (existingTables.includes(table)) {
                try {
                    const [rows] = await connection.execute(`SELECT * FROM ${table} LIMIT 3`);
                    if (rows.length > 0) {
                        console.log(`   ✅ ${table}: ${rows.length} registros de ejemplo encontrados`);
                        // Mostrar algunos campos clave
                        if (rows[0].name) console.log(`      - Primer registro: ${rows[0].name}`);
                        if (rows[0].title) console.log(`      - Primer registro: ${rows[0].title}`);
                    } else {
                        console.log(`   ⚠️  ${table}: Sin datos iniciales`);
                    }
                } catch (error) {
                    console.log(`   ❌ ${table}: Error al verificar datos (${error.message})`);
                }
            }
        }
        
        // 6. Verificar algunas relaciones clave
        console.log('\n🔗 6. VERIFICANDO RELACIONES ENTRE TABLAS:');
        
        // Verificar relación users -> user_profiles
        if (existingTables.includes('users') && existingTables.includes('user_profiles')) {
            try {
                const [userRelation] = await connection.execute(`
                    SELECT COUNT(*) as count 
                    FROM users u 
                    LEFT JOIN user_profiles up ON u.id = up.user_id 
                    WHERE up.user_id IS NOT NULL
                `);
                console.log(`   ✅ users -> user_profiles: ${userRelation[0].count} relaciones`);
            } catch (error) {
                console.log(`   ❌ Error verificando relación users -> user_profiles`);
            }
        }
        
        // Verificar relación coffee_growers -> farms
        if (existingTables.includes('coffee_growers') && existingTables.includes('farms')) {
            try {
                const [farmRelation] = await connection.execute(`
                    SELECT COUNT(*) as count 
                    FROM coffee_growers cg 
                    LEFT JOIN farms f ON cg.id = f.grower_id 
                    WHERE f.grower_id IS NOT NULL
                `);
                console.log(`   ✅ coffee_growers -> farms: ${farmRelation[0].count} relaciones`);
            } catch (error) {
                console.log(`   ❌ Error verificando relación coffee_growers -> farms`);
            }
        }
        
        // Resumen final
        console.log('\n🎯 RESUMEN FINAL:');
        console.log(`   📊 Total de tablas: ${existingTables.length}`);
        console.log(`   ✅ Tablas esperadas presentes: ${expectedTables.length - missingTables.length}/${expectedTables.length}`);
        console.log(`   📋 Total de registros: ${Object.values(tableCounts).filter(c => typeof c === 'number').reduce((a, b) => a + b, 0)}`);
        
        if (missingTables.length === 0) {
            console.log('\n🎉 ¡VERIFICACIÓN EXITOSA!');
            console.log('✅ Todas las tablas están creadas correctamente');
            console.log('✅ La base de datos está lista para la aplicación Café Colombia');
        } else {
            console.log('\n⚠️  VERIFICACIÓN PARCIAL');
            console.log(`❌ ${missingTables.length} tablas faltantes`);
            console.log('💡 Revisar las migraciones pendientes');
        }
        
    } catch (error) {
        console.error('\n❌ ERROR EN LA VERIFICACIÓN:', error.message);
        console.error('Código de error:', error.code);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 No se pudo conectar al servidor de base de datos');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.log('\n💡 Error de autenticación - verificar credenciales');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión a la base de datos cerrada');
        }
    }
}

// Ejecutar la verificación
verifyDatabase().catch(console.error);
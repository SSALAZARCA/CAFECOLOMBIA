const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
    let connection;
    
    try {
        // Crear conexión a la base de datos
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            multipleStatements: true
        });

        console.log('✅ Conectado a la base de datos MySQL');

        // Crear tabla de migraciones si no existe
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Obtener migraciones ya ejecutadas
        const [executedMigrations] = await connection.execute(
            'SELECT filename FROM migrations ORDER BY filename'
        );
        const executedFiles = executedMigrations.map(row => row.filename);

        // Leer archivos de migración
        const migrationsDir = path.join(__dirname, 'migrations');
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort();

        console.log(`📁 Encontrados ${migrationFiles.length} archivos de migración`);
        console.log(`✅ Ya ejecutadas: ${executedFiles.length} migraciones`);

        // Ejecutar migraciones pendientes
        for (const file of migrationFiles) {
            if (executedFiles.includes(file)) {
                console.log(`⏭️  Saltando ${file} (ya ejecutada)`);
                continue;
            }

            console.log(`🔄 Ejecutando migración: ${file}`);
            
            try {
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf8');
                
                // Ejecutar la migración
                await connection.execute(sql);
                
                // Registrar la migración como ejecutada
                await connection.execute(
                    'INSERT INTO migrations (filename) VALUES (?)',
                    [file]
                );
                
                console.log(`✅ Migración ${file} ejecutada exitosamente`);
                
            } catch (error) {
                console.error(`❌ Error ejecutando migración ${file}:`, error.message);
                throw error;
            }
        }

        console.log('\n🎉 Todas las migraciones se ejecutaron exitosamente');
        
        // Mostrar resumen de tablas creadas
        const [tables] = await connection.execute('SHOW TABLES');
        console.log(`\n📊 Total de tablas en la base de datos: ${tables.length}`);
        console.log('Tablas creadas:');
        tables.forEach(table => {
            const tableName = Object.values(table)[0];
            console.log(`  - ${tableName}`);
        });

    } catch (error) {
        console.error('❌ Error durante la ejecución de migraciones:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión a la base de datos cerrada');
        }
    }
}

// Ejecutar migraciones
runMigrations();
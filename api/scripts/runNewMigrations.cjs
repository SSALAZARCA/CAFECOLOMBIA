const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

// Configuración de la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'srv1196.hstgr.io',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'u689528678_SSALAZARCA',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'u689528678_cafe_colombia',
    charset: 'utf8mb4',
    timezone: '+00:00'
};

async function runNewMigrations() {
    let connection;
    
    try {
        console.log('🚀 Ejecutando nuevas migraciones...\n');
        
        // Conectar a la base de datos
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conectado a la base de datos');
        
        // Crear tabla de migraciones si no existe
        await connection.execute(`
            CREATE TABLE IF NOT EXISTS migrations (
                id INT AUTO_INCREMENT PRIMARY KEY,
                filename VARCHAR(255) NOT NULL UNIQUE,
                executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                checksum VARCHAR(64) NULL,
                INDEX idx_filename (filename)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
        `);
        
        // Lista de nuevas migraciones a ejecutar
        const newMigrations = [
            '20241220_create_system_settings.sql',
            '20241220_enhance_existing_tables.sql'
        ];
        
        for (const migrationFile of newMigrations) {
            try {
                // Verificar si la migración ya fue ejecutada
                const [existing] = await connection.execute(
                    'SELECT filename FROM migrations WHERE filename = ?',
                    [migrationFile]
                );
                
                if (existing.length > 0) {
                    console.log(`⏭️  Migración ${migrationFile} ya fue ejecutada, saltando...`);
                    continue;
                }
                
                console.log(`🔄 Ejecutando migración: ${migrationFile}`);
                
                // Leer el archivo de migración
                const migrationPath = path.join(__dirname, '../migrations', migrationFile);
                
                if (!fs.existsSync(migrationPath)) {
                    console.log(`⚠️  Archivo de migración no encontrado: ${migrationFile}`);
                    continue;
                }
                
                const sql = fs.readFileSync(migrationPath, 'utf8');
                
                // Dividir el SQL en statements individuales
                const statements = sql
                    .split(';')
                    .map(stmt => stmt.trim())
                    .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
                
                // Ejecutar cada statement
                for (const statement of statements) {
                    if (statement.trim()) {
                        try {
                            await connection.execute(statement);
                        } catch (error) {
                            // Ignorar errores de "ya existe" para hacer la migración idempotente
                            if (error.code === 'ER_TABLE_EXISTS_ERROR' || 
                                error.code === 'ER_DUP_FIELDNAME' ||
                                error.code === 'ER_DUP_KEYNAME' ||
                                error.code === 'ER_DUP_ENTRY') {
                                console.log(`⚠️  Elemento ya existe, continuando...`);
                                continue;
                            }
                            throw error;
                        }
                    }
                }
                
                // Registrar la migración como ejecutada
                await connection.execute(
                    'INSERT INTO migrations (filename) VALUES (?)',
                    [migrationFile]
                );
                
                console.log(`✅ Migración ${migrationFile} ejecutada exitosamente`);
                
            } catch (error) {
                console.error(`❌ Error ejecutando migración ${migrationFile}:`, error.message);
                // Continuar con la siguiente migración en lugar de fallar completamente
                continue;
            }
        }
        
        console.log('\n🎉 Proceso de migraciones completado');
        
    } catch (error) {
        console.error('❌ Error general:', error.message);
        console.error('Stack:', error.stack);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 Conexión cerrada');
        }
    }
}

// Ejecutar las migraciones
runNewMigrations();
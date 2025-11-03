import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Configurar variables de entorno
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'srv1196.hstgr.io',
  user: process.env.DB_USER || 'u472469844_cafe_colombia',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'u472469844_cafe_colombia',
  port: parseInt(process.env.DB_PORT || '3306'),
  multipleStatements: true,
  ssl: false
};

async function runMigrations() {
  let connection;
  
  try {
    console.log('🔄 Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión establecida exitosamente');

    // Crear tabla de migraciones si no existe
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Obtener migraciones ya ejecutadas
    const [executedMigrations] = await connection.execute(
      'SELECT filename FROM migrations'
    );
    const executedFiles = executedMigrations.map(row => row.filename);

    // Leer archivos de migración
    const migrationsDir = path.join(__dirname, '..', 'migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Encontrados ${migrationFiles.length} archivos de migración`);

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

    console.log('🎉 Todas las migraciones se ejecutaron exitosamente');

  } catch (error) {
    console.error('❌ Error durante la ejecución de migraciones:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Conexión cerrada');
    }
  }
}

// Función para verificar la conexión
async function testConnection() {
  let connection;
  
  try {
    console.log('🔄 Probando conexión a la base de datos...');
    console.log('📋 Configuración:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port
    });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Conexión de prueba exitosa');
    
    // Verificar que podemos ejecutar consultas
    const [result] = await connection.execute('SELECT 1 as test');
    console.log('✅ Consulta de prueba exitosa:', result[0]);
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('💡 Verifica que:');
    console.error('   - Las credenciales de la base de datos sean correctas');
    console.error('   - El servidor MySQL esté accesible');
    console.error('   - Las variables de entorno estén configuradas');
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Función principal
async function main() {
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      await testConnection();
      break;
    case 'migrate':
    default:
      await runMigrations();
      break;
  }
}

// Ejecutar si es llamado directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}

export { runMigrations, testConnection };
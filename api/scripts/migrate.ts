import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, testConnection } from '../config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  console.log('🚀 Iniciando migraciones de base de datos...');
  
  // Probar conexión
  const isConnected = await testConnection();
  if (!isConnected) {
    console.error('❌ No se pudo conectar a la base de datos');
    process.exit(1);
  }
  
  try {
    // Crear tabla de migraciones si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT PRIMARY KEY AUTO_INCREMENT,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Obtener migraciones ya ejecutadas
    const [executedMigrations] = await pool.execute(
      'SELECT filename FROM migrations ORDER BY executed_at'
    );
    const executed = (executedMigrations as any[]).map(row => row.filename);
    
    // Leer archivos de migración
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    console.log(`📁 Encontrados ${migrationFiles.length} archivos de migración`);
    
    for (const filename of migrationFiles) {
      if (executed.includes(filename)) {
        console.log(`⏭️  Saltando ${filename} (ya ejecutada)`);
        continue;
      }
      
      console.log(`🔄 Ejecutando migración: ${filename}`);
      
      const filePath = path.join(migrationsDir, filename);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      // Dividir el SQL en statements individuales
      const statements = sql
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0);
      
      const connection = await pool.getConnection();
      
      try {
        await connection.beginTransaction();
        
        for (const statement of statements) {
          if (statement.trim()) {
            await connection.execute(statement);
          }
        }
        
        // Registrar migración como ejecutada
        await connection.execute(
          'INSERT INTO migrations (filename) VALUES (?)',
          [filename]
        );
        
        await connection.commit();
        console.log(`✅ Migración ${filename} ejecutada correctamente`);
        
      } catch (error) {
        await connection.rollback();
        console.error(`❌ Error ejecutando migración ${filename}:`, error);
        throw error;
      } finally {
        connection.release();
      }
    }
    
    console.log('🎉 Todas las migraciones se ejecutaron correctamente');
    
  } catch (error) {
    console.error('❌ Error durante las migraciones:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Ejecutar migraciones si el script se ejecuta directamente
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations();
}

export { runMigrations };
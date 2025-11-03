const fs = require('fs').promises;
const path = require('path');
const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config({ path: path.join(__dirname, '../.env') });

class MigrationRunner {
  constructor() {
    this.connection = null;
  }

  async getConnection() {
    if (!this.connection) {
      const config = {
        host: process.env.DB_HOST || 'srv1196.hstgr.io',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USER || 'u689528678_SSALAZARCA',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'u689528678_CAFECOLOMBIA',
        charset: 'utf8mb4',
        timezone: '+00:00',
        ssl: {
          rejectUnauthorized: false
        },
        multipleStatements: true
      };

      console.log('🔌 Conectando a MySQL...');
      this.connection = await mysql.createConnection(config);
      console.log('✅ Conexión establecida');
    }
    return this.connection;
  }

  async createMigrationsTable() {
    const connection = await this.getConnection();
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_filename (filename)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await connection.execute(createTableSQL);
    console.log('📋 Tabla de migraciones verificada');
  }

  async getExecutedMigrations() {
    const connection = await this.getConnection();
    const [rows] = await connection.execute(
      'SELECT filename FROM migrations ORDER BY id'
    );
    return rows.map(row => row.filename);
  }

  async getMigrationFiles() {
    const migrationsDir = path.join(__dirname, '../migrations');
    try {
      const files = await fs.readdir(migrationsDir);
      return files
        .filter(file => file.endsWith('.sql'))
        .sort();
    } catch (error) {
      console.log('📁 Directorio de migraciones no encontrado, creándolo...');
      await fs.mkdir(migrationsDir, { recursive: true });
      return [];
    }
  }

  async executeMigration(filename) {
    const connection = await this.getConnection();
    const migrationPath = path.join(__dirname, '../migrations', filename);
    
    console.log(`🔄 Ejecutando migración: ${filename}`);
    
    try {
      const sql = await fs.readFile(migrationPath, 'utf8');
      
      // Manejar SQL con delimitadores personalizados
      if (sql.includes('DELIMITER')) {
        // Para archivos con triggers que usan DELIMITER, ejecutar todo como una sola declaración
        await connection.query(sql);
      } else {
        // Dividir el SQL en declaraciones individuales para archivos normales
        const statements = sql.split(';').filter(stmt => stmt.trim());
        
        for (const statement of statements) {
          if (statement.trim()) {
            await connection.execute(statement);
          }
        }
      }
      
      // Registrar la migración como ejecutada
      await connection.execute(
        'INSERT INTO migrations (filename) VALUES (?)',
        [filename]
      );
      
      console.log(`✅ Migración completada: ${filename}`);
    } catch (error) {
      console.error(`❌ Error en migración ${filename}:`, error.message);
      throw error;
    }
  }

  async runMigrations() {
    try {
      console.log('🚀 Iniciando migraciones...');
      
      await this.createMigrationsTable();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      const pendingMigrations = migrationFiles.filter(
        file => !executedMigrations.includes(file)
      );
      
      if (pendingMigrations.length === 0) {
        console.log('✨ No hay migraciones pendientes');
        return;
      }
      
      console.log(`📝 Encontradas ${pendingMigrations.length} migraciones pendientes:`);
      pendingMigrations.forEach(file => console.log(`  - ${file}`));
      
      for (const migration of pendingMigrations) {
        await this.executeMigration(migration);
      }
      
      console.log('🎉 Todas las migraciones completadas exitosamente');
      
    } catch (error) {
      console.error('❌ Error durante las migraciones:', error.message);
      throw error;
    }
  }

  async showStatus() {
    try {
      await this.createMigrationsTable();
      
      const migrationFiles = await this.getMigrationFiles();
      const executedMigrations = await this.getExecutedMigrations();
      
      console.log('\n📊 Estado de las migraciones:');
      console.log('================================');
      
      if (migrationFiles.length === 0) {
        console.log('📁 No se encontraron archivos de migración');
        return;
      }
      
      migrationFiles.forEach(file => {
        const status = executedMigrations.includes(file) ? '✅ Ejecutada' : '⏳ Pendiente';
        console.log(`${status} - ${file}`);
      });
      
      const pendingCount = migrationFiles.length - executedMigrations.length;
      console.log(`\n📈 Total: ${migrationFiles.length} migraciones`);
      console.log(`✅ Ejecutadas: ${executedMigrations.length}`);
      console.log(`⏳ Pendientes: ${pendingCount}`);
      
    } catch (error) {
      console.error('❌ Error al obtener el estado:', error.message);
      throw error;
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }
}

async function main() {
  const runner = new MigrationRunner();
  
  try {
    const args = process.argv.slice(2);
    
    if (args.includes('--status')) {
      await runner.showStatus();
    } else {
      await runner.runMigrations();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await runner.close();
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { MigrationRunner };
const fs = require('fs').promises;
const path = require('path');
const { executeQuery, testConnection } = require('../config/database');

// Tabla para tracking de migraciones
const createMigrationsTable = async () => {
  const query = `
    CREATE TABLE IF NOT EXISTS migrations (
      id INT PRIMARY KEY AUTO_INCREMENT,
      filename VARCHAR(255) NOT NULL UNIQUE,
      executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;
  
  try {
    await executeQuery(query);
    console.log('✅ Tabla de migraciones creada/verificada');
  } catch (error) {
    console.error('❌ Error creando tabla de migraciones:', error);
    throw error;
  }
};

// Obtener migraciones ejecutadas
const getExecutedMigrations = async () => {
  try {
    const results = await executeQuery('SELECT filename FROM migrations ORDER BY id');
    return results.map(row => row.filename);
  } catch (error) {
    console.error('Error obteniendo migraciones ejecutadas:', error);
    return [];
  }
};

// Marcar migración como ejecutada
const markMigrationAsExecuted = async (filename) => {
  try {
    await executeQuery('INSERT INTO migrations (filename) VALUES (?)', [filename]);
    console.log(`✅ Migración ${filename} marcada como ejecutada`);
  } catch (error) {
    console.error(`❌ Error marcando migración ${filename}:`, error);
    throw error;
  }
};

// Ejecutar una migración
const executeMigration = async (filename, content) => {
  try {
    console.log(`🔄 Ejecutando migración: ${filename}`);
    
    // Dividir el contenido en statements individuales
    const statements = content
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    for (const statement of statements) {
      if (statement.trim()) {
        await executeQuery(statement);
      }
    }

    await markMigrationAsExecuted(filename);
    console.log(`✅ Migración ${filename} ejecutada exitosamente`);
  } catch (error) {
    console.error(`❌ Error ejecutando migración ${filename}:`, error);
    throw error;
  }
};

// Ejecutar todas las migraciones pendientes
const runMigrations = async () => {
  try {
    console.log('🚀 Iniciando proceso de migraciones...');

    // Verificar conexión a la base de datos
    const isConnected = await testConnection();
    if (!isConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Crear tabla de migraciones si no existe
    await createMigrationsTable();

    // Obtener migraciones ejecutadas
    const executedMigrations = await getExecutedMigrations();
    console.log(`📋 Migraciones ya ejecutadas: ${executedMigrations.length}`);

    // Leer archivos de migración
    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = await fs.readdir(migrationsDir);
    
    // Filtrar solo archivos .sql y ordenarlos
    const sqlFiles = migrationFiles
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log(`📁 Archivos de migración encontrados: ${sqlFiles.length}`);

    // Ejecutar migraciones pendientes
    let executedCount = 0;
    for (const filename of sqlFiles) {
      if (!executedMigrations.includes(filename)) {
        const filePath = path.join(migrationsDir, filename);
        const content = await fs.readFile(filePath, 'utf8');
        await executeMigration(filename, content);
        executedCount++;
      } else {
        console.log(`⏭️  Saltando migración ya ejecutada: ${filename}`);
      }
    }

    if (executedCount === 0) {
      console.log('✨ No hay migraciones pendientes');
    } else {
      console.log(`✅ ${executedCount} migración(es) ejecutada(s) exitosamente`);
    }

    console.log('🎉 Proceso de migraciones completado');
  } catch (error) {
    console.error('💥 Error en el proceso de migraciones:', error);
    process.exit(1);
  }
};

// Rollback de la última migración (funcionalidad básica)
const rollbackLastMigration = async () => {
  try {
    console.log('🔄 Iniciando rollback de la última migración...');

    const lastMigration = await executeQuery(
      'SELECT filename FROM migrations ORDER BY id DESC LIMIT 1'
    );

    if (lastMigration.length === 0) {
      console.log('ℹ️  No hay migraciones para hacer rollback');
      return;
    }

    const filename = lastMigration[0].filename;
    console.log(`⚠️  ADVERTENCIA: El rollback automático no está implementado para ${filename}`);
    console.log('   Por favor, revisa manualmente la migración y ejecuta el rollback necesario');
    
    // Aquí podrías implementar lógica de rollback más sofisticada
    // Por ahora, solo removemos el registro de la tabla de migraciones
    const confirm = process.argv.includes('--force');
    if (confirm) {
      await executeQuery('DELETE FROM migrations WHERE filename = ?', [filename]);
      console.log(`✅ Registro de migración ${filename} removido`);
      console.log('⚠️  IMPORTANTE: Debes revertir manualmente los cambios en la base de datos');
    } else {
      console.log('💡 Usa --force para confirmar el rollback');
    }
  } catch (error) {
    console.error('❌ Error en rollback:', error);
    process.exit(1);
  }
};

// Mostrar estado de migraciones
const showMigrationStatus = async () => {
  try {
    console.log('📊 Estado de migraciones:');
    
    const isConnected = await testConnection();
    if (!isConnected) {
      console.log('❌ No se pudo conectar a la base de datos');
      return;
    }

    await createMigrationsTable();
    const executedMigrations = await getExecutedMigrations();

    const migrationsDir = path.join(__dirname, '../migrations');
    const migrationFiles = await fs.readdir(migrationsDir);
    const sqlFiles = migrationFiles
      .filter(file => file.endsWith('.sql'))
      .sort();

    console.log('\n📁 Archivos de migración:');
    for (const filename of sqlFiles) {
      const status = executedMigrations.includes(filename) ? '✅ Ejecutada' : '⏳ Pendiente';
      console.log(`   ${filename} - ${status}`);
    }

    console.log(`\n📈 Resumen:`);
    console.log(`   Total de migraciones: ${sqlFiles.length}`);
    console.log(`   Ejecutadas: ${executedMigrations.length}`);
    console.log(`   Pendientes: ${sqlFiles.length - executedMigrations.length}`);
  } catch (error) {
    console.error('❌ Error mostrando estado:', error);
  }
};

// Función principal
const main = async () => {
  const command = process.argv[2];

  switch (command) {
    case 'up':
    case 'migrate':
      await runMigrations();
      break;
    case 'rollback':
      await rollbackLastMigration();
      break;
    case 'status':
      await showMigrationStatus();
      break;
    default:
      console.log('📖 Uso:');
      console.log('   node migrate.js up       - Ejecutar migraciones pendientes');
      console.log('   node migrate.js status   - Mostrar estado de migraciones');
      console.log('   node migrate.js rollback - Rollback de la última migración');
      break;
  }

  process.exit(0);
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  main().catch(error => {
    console.error('💥 Error fatal:', error);
    process.exit(1);
  });
}

module.exports = {
  runMigrations,
  rollbackLastMigration,
  showMigrationStatus
};
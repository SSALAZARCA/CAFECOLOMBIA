#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Script de build simplificado para Café Colombia App
 * NO usa TypeScript - solo copia archivos JavaScript existentes
 */

function copyRecursive(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();

  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      copyRecursive(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

function main() {
  console.log('🔨 Iniciando build simplificado del servidor...');

  const rootDir = process.cwd();
  const apiDistDir = path.join(rootDir, 'api', 'dist');

  try {
    // Crear directorio api/dist si no existe
    if (!fs.existsSync(apiDistDir)) {
      console.log('📁 Creando directorio api/dist...');
      fs.mkdirSync(apiDistDir, { recursive: true });
    }

    // Copiar archivos JavaScript del API (NO compilar TypeScript)
    console.log('📂 Copiando archivos JavaScript del API...');
    const apiSrc = path.join(rootDir, 'api');
    const apiFiles = fs.readdirSync(apiSrc).filter(file =>
      file.endsWith('.js') || file.endsWith('.cjs')
    );

    if (apiFiles.length === 0) {
      console.warn('⚠️  No se encontraron archivos JavaScript en el API');
    }

    apiFiles.forEach(file => {
      console.log(`   Copiando ${file}...`);
      fs.copyFileSync(
        path.join(apiSrc, file),
        path.join(apiDistDir, file)
      );
    });

    // Copiar subdirectorios importantes del API
    const apiSubDirs = ['routes', 'controllers', 'middleware', 'services', 'utils', 'config', 'lib'];
    apiSubDirs.forEach(subDir => {
      const srcPath = path.join(apiSrc, subDir);
      const destPath = path.join(apiDistDir, subDir);

      if (fs.existsSync(srcPath)) {
        console.log(`📂 Copiando directorio ${subDir}...`);
        copyRecursive(srcPath, destPath);
      }
    });

    // Copiar directorio scripts al dist principal
    const distDir = path.join(rootDir, 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }

    const scriptsSrc = path.join(rootDir, 'scripts');
    const scriptsDest = path.join(distDir, 'scripts');

    if (fs.existsSync(scriptsSrc)) {
      console.log('📂 Copiando directorio scripts...');
      copyRecursive(scriptsSrc, scriptsDest);
    }

    console.log('✅ Build simplificado completado exitosamente');
    console.log('📋 Archivos copiados:');
    console.log(`   - ${apiFiles.length} archivos JavaScript del API`);
    console.log('   - Subdirectorios del API');
    console.log('   - Directorio scripts');

  } catch (error) {
    console.error('❌ Error durante el build:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { copyRecursive, main };
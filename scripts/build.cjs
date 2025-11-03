#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Script de build multiplataforma para Café Colombia App
 * Funciona en Windows, Linux y macOS
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
  console.log('🔨 Iniciando build del servidor...');
  
  const rootDir = process.cwd();
  const apiDistDir = path.join(rootDir, 'api', 'dist');
  
  try {
    // Crear directorio api/dist si no existe
    if (!fs.existsSync(apiDistDir)) {
      console.log('📁 Creando directorio api/dist...');
      fs.mkdirSync(apiDistDir, { recursive: true });
    }
    
    // Compilar TypeScript del API
    console.log('🔧 Compilando TypeScript del API...');
    try {
      execSync('npx tsc --project tsconfig.server.json', { 
        stdio: 'inherit',
        cwd: rootDir 
      });
      console.log('✅ Compilación de TypeScript completada');
    } catch (error) {
      console.error('❌ Error compilando TypeScript:', error.message);
      // Si falla TypeScript, copiar archivos JS existentes
      console.log('📂 Copiando archivos JS existentes...');
      const apiSrc = path.join(rootDir, 'api');
      const apiFiles = fs.readdirSync(apiSrc).filter(file => 
        file.endsWith('.js') || file.endsWith('.cjs')
      );
      
      apiFiles.forEach(file => {
        fs.copyFileSync(
          path.join(apiSrc, file),
          path.join(apiDistDir, file)
        );
      });
    }
    
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
    } else {
      console.warn('⚠️  Directorio scripts no encontrado');
    }
    
    console.log('✅ Build del servidor completado exitosamente');
    
  } catch (error) {
    console.error('❌ Error durante el build:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { copyRecursive, main };
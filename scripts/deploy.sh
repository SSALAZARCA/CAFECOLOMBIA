#!/bin/bash

# 🚀 SCRIPT DE DESPLIEGUE AUTOMÁTICO - CAFÉ COLOMBIA APP
# Este script automatiza el proceso de despliegue en producción

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar si estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
fi

# Verificar si PM2 está instalado
if ! command -v pm2 &> /dev/null; then
    error "PM2 no está instalado. Ejecute primero install-production.sh"
    exit 1
fi

log "🚀 Iniciando proceso de despliegue..."

# Crear backup antes del despliegue
BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
log "💾 Creando backup en $BACKUP_DIR..."
mkdir -p "$BACKUP_DIR"
cp -r dist "$BACKUP_DIR/" 2>/dev/null || true
cp -r api/dist "$BACKUP_DIR/" 2>/dev/null || true
mysqldump -u cafeapp -p cafe_colombia_app > "$BACKUP_DIR/database.sql" 2>/dev/null || warning "No se pudo crear backup de la base de datos"

# Obtener la última versión del código
log "📥 Obteniendo última versión del código..."
git fetch origin
git pull origin main

# Verificar si hay cambios
if git diff --quiet HEAD~1 HEAD; then
    info "No hay cambios nuevos para desplegar"
    exit 0
fi

# Instalar/actualizar dependencias
log "📦 Actualizando dependencias..."
npm ci --production=false
cd api && npm ci --production=false && cd ..

# Ejecutar tests (si existen)
if [ -f "package.json" ] && grep -q "\"test\"" package.json; then
    log "🧪 Ejecutando tests..."
    npm test || {
        error "Los tests fallaron. Despliegue cancelado."
        exit 1
    }
fi

# Compilar aplicación
log "🏗️ Compilando aplicación..."
npm run build || {
    error "Error en la compilación del frontend"
    exit 1
}

cd api
npm run build || {
    error "Error en la compilación del backend"
    exit 1
}
cd ..

# Ejecutar migraciones de base de datos
log "🗄️ Ejecutando migraciones de base de datos..."
if [ -f "scripts/migrate.js" ]; then
    node scripts/migrate.js || warning "Error en las migraciones"
fi

# Reiniciar aplicación con PM2
log "🔄 Reiniciando aplicación..."
pm2 reload ecosystem.config.js --update-env

# Verificar que la aplicación esté funcionando
log "🔍 Verificando estado de la aplicación..."
sleep 5

# Verificar PM2
if pm2 list | grep -q "online"; then
    log "✅ Aplicación reiniciada correctamente"
else
    error "❌ Error al reiniciar la aplicación"
    
    # Intentar rollback
    warning "🔄 Intentando rollback..."
    if [ -d "$BACKUP_DIR/dist" ]; then
        cp -r "$BACKUP_DIR/dist" .
        cp -r "$BACKUP_DIR/api/dist" api/
        pm2 reload ecosystem.config.js
        error "Rollback completado. Revise los logs para más detalles."
    fi
    exit 1
fi

# Verificar conectividad HTTP
log "🌐 Verificando conectividad HTTP..."
if curl -f -s http://localhost:3001/api/health > /dev/null; then
    log "✅ API respondiendo correctamente"
else
    warning "⚠️ La API no responde en el puerto 3001"
fi

# Limpiar archivos temporales
log "🧹 Limpiando archivos temporales..."
npm run clean 2>/dev/null || true

# Limpiar backups antiguos (mantener solo los últimos 5)
log "🗂️ Limpiando backups antiguos..."
cd backups
ls -t | tail -n +6 | xargs -r rm -rf
cd ..

# Recargar Nginx
log "🌐 Recargando Nginx..."
sudo nginx -t && sudo systemctl reload nginx || warning "Error al recargar Nginx"

# Mostrar información del despliegue
log "📊 Información del despliegue:"
info "Versión desplegada: $(git rev-parse --short HEAD)"
info "Fecha: $(date)"
info "Usuario: $(whoami)"
info "Backup creado en: $BACKUP_DIR"

# Mostrar logs recientes
log "📋 Logs recientes de la aplicación:"
pm2 logs cafe-colombia-api --lines 10 --nostream

log "✅ Despliegue completado exitosamente!"
info "🌐 Aplicación disponible en el dominio configurado"
info "📊 Monitoreo: pm2 monit"
info "📋 Logs: pm2 logs cafe-colombia-api"
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
# Intentar volcar la base de datos si existe y se puede acceder
if command -v mysqldump &> /dev/null; then
  DB_NAME="cafe_colombia_app"
  log "🗄️ Intentando backup de base de datos $DB_NAME..."
  if [ -n "$MYSQL_PWD" ]; then
    mysqldump -u cafeapp --password="$MYSQL_PWD" "$DB_NAME" > "$BACKUP_DIR/database.sql" 2>/dev/null || warning "No se pudo crear backup de la base de datos"
  else
    warning "MYSQL_PWD no definido, saltando backup de base de datos no interactivo"
  fi
else
  warning "mysqldump no disponible, saltando backup de base de datos"
fi

# Obtener la última versión del código
log "📥 Obteniendo última versión del código..."
git fetch origin
git pull origin main

# Instalar/actualizar dependencias
log "📦 Actualizando dependencias..."
npm ci --production=false
cd api && npm ci --production=false && cd ..

# Compilar aplicación (frontend)
log "🏗️ Compilando frontend..."
npm run build || {
    error "Error en la compilación del frontend"
    exit 1
}

# Compilar backend si aplica (TS). En este proyecto usamos server.cjs directamente.
log "🏗️ Preparando backend..."
if [ -f "api/server.ts" ]; then
  info "Detectado server.ts, pero el runtime usa server.cjs. No se requiere build."
fi

# Ejecutar migraciones de base de datos (si existen)
log "🗄️ Ejecutando migraciones de base de datos..."
if [ -f "scripts/migrate.cjs" ]; then
    node scripts/migrate.cjs || warning "Error en las migraciones"
else
    info "No hay script de migraciones (.cjs)"
fi

# Reiniciar aplicación con PM2 (ecosystem usa api/server.cjs)
log "🔄 Reiniciando aplicación con PM2..."
pm2 reload ecosystem.config.cjs --update-env || {
  warning "PM2 reload falló, intentando start"
  pm2 start ecosystem.config.cjs --env production || {
    error "No se pudo iniciar la aplicación con PM2"
    exit 1
  }
}

# Verificar que la aplicación esté funcionando
log "🔍 Verificando estado de la aplicación..."
sleep 5

# Verificar PM2
if pm2 list | grep -q "cafe-colombia-api"; then
    log "✅ Aplicación en PM2 detectada"
else
    error "❌ La aplicación no está en PM2"
    exit 1
fi

# Verificar conectividad HTTP
log "🌐 Verificando conectividad HTTP (localhost:3001)..."
if command -v curl &> /dev/null; then
  if curl -f -s http://localhost:3001/api/health > /dev/null; then
      log "✅ API respondiendo correctamente"
  else
      warning "⚠️ La API no responde en el puerto 3001"
  fi
else
  info "curl no disponible, saltando verificación HTTP"
fi

# Limpiar archivos temporales
log "🧹 Limpiando archivos temporales..."
npm run clean 2>/dev/null || true

# Limpiar backups antiguos (mantener solo los últimos 5)
log "🗂️ Limpiando backups antiguos..."
cd backups
ls -t | tail -n +6 | xargs -r rm -rf
cd ..

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
info "🌐 Asegúrate de tener Nginx configurado para servir dist y proxy /api -> http://localhost:3001"
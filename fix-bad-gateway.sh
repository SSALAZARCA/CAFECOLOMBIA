#!/bin/bash

# 🔧 Script de Corrección Definitiva - Bad Gateway
# Limpia completamente la configuración y redespliega con Traefik

echo "🔧 CORRECCIÓN DEFINITIVA DEL BAD GATEWAY - CAFÉ COLOMBIA"
echo "======================================================="
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para logging
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.traefik.yml" ]; then
    log_error "❌ No se encontró docker-compose.traefik.yml. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

echo "🚀 PASO 1: LIMPIEZA COMPLETA DEL SISTEMA"
echo "========================================"

log_info "Deteniendo todos los contenedores..."
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose -f docker-compose.traefik.yml down --remove-orphans 2>/dev/null || true

log_info "Eliminando contenedores relacionados..."
docker ps -a --format "{{.Names}}" | grep -E "(cafe|traefik|api|nginx|mysql|redis)" | xargs -r docker rm -f 2>/dev/null || true

log_info "Eliminando imágenes obsoletas..."
docker images --format "{{.Repository}}:{{.Tag}}" | grep -E "(cafe|traefik)" | xargs -r docker rmi -f 2>/dev/null || true

log_info "Limpiando redes..."
docker network ls --format "{{.Name}}" | grep -E "(cafe|traefik)" | xargs -r docker network rm 2>/dev/null || true

log_info "Limpiando volúmenes no utilizados..."
docker volume prune -f 2>/dev/null || true

log_success "✅ Limpieza completa terminada"

echo ""
echo "🔍 PASO 2: VERIFICACIÓN DE CONFIGURACIÓN"
echo "========================================"

# Verificar archivo .env.docker
if [ ! -f ".env.docker" ]; then
    log_error "❌ Archivo .env.docker no encontrado"
    exit 1
fi

# Verificar variables críticas
if ! grep -q "DOMAIN=" .env.docker; then
    log_error "❌ Variable DOMAIN no encontrada en .env.docker"
    exit 1
fi

if ! grep -q "SSL_EMAIL=" .env.docker; then
    log_error "❌ Variable SSL_EMAIL no encontrada en .env.docker"
    exit 1
fi

log_success "✅ Configuración verificada"

echo ""
echo "🏗️ PASO 3: BUILD DEL FRONTEND"
echo "============================="

log_info "Construyendo frontend (Vite build)..."
npm run build

if [ $? -ne 0 ]; then
    log_error "❌ Error en el build del frontend"
    exit 1
fi

log_success "✅ Frontend construido exitosamente"

echo ""
echo "🐳 PASO 4: CONSTRUCCIÓN Y DESPLIEGUE DOCKER"
echo "==========================================="

log_info "Construyendo imágenes Docker..."
docker-compose -f docker-compose.traefik.yml build --no-cache

if [ $? -ne 0 ]; then
    log_error "❌ Error en la construcción de imágenes"
    exit 1
fi

log_info "Iniciando servicios con Traefik..."
docker-compose -f docker-compose.traefik.yml up -d

if [ $? -ne 0 ]; then
    log_error "❌ Error al iniciar servicios"
    exit 1
fi

log_success "✅ Servicios iniciados"

echo ""
echo "⏳ PASO 5: VERIFICACIÓN DE SERVICIOS"
echo "===================================="

log_info "Esperando que los servicios estén listos..."
sleep 30

# Verificar que los contenedores estén ejecutándose
log_info "Estado de los contenedores:"
docker-compose -f docker-compose.traefik.yml ps

# Verificar logs de Traefik
log_info "Últimos logs de Traefik:"
docker logs traefik --tail 10 2>/dev/null || log_warning "No se pudieron obtener logs de Traefik"

# Verificar logs de la API
api_container=$(docker ps --format "{{.Names}}" | grep -E "(api|cafe.*api)" | head -1)
if [ ! -z "$api_container" ]; then
    log_info "Últimos logs de $api_container:"
    docker logs "$api_container" --tail 10 2>/dev/null || log_warning "No se pudieron obtener logs de la API"
fi

echo ""
echo "🌐 PASO 5: VERIFICACIÓN DE CONECTIVIDAD"
echo "======================================="

# Obtener el dominio del archivo .env.docker
DOMAIN=$(grep "DOMAIN=" .env.docker | cut -d'=' -f2)

log_info "Verificando conectividad..."

# Verificar Traefik dashboard
if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080 | grep -q "200"; then
    log_success "✅ Dashboard de Traefik accesible en http://localhost:8080"
else
    log_warning "⚠️  Dashboard de Traefik no accesible"
fi

# Verificar API directamente
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200"; then
    log_success "✅ API accesible directamente en puerto 3001"
else
    log_warning "⚠️  API no accesible directamente"
fi

# Verificar a través de Traefik (si el dominio está configurado)
if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ]; then
    log_info "Verificando acceso a través de Traefik..."
    # Nota: Esto solo funcionará si el DNS está configurado correctamente
    if curl -s -H "Host: $DOMAIN" -o /dev/null -w "%{http_code}" http://localhost/api/health | grep -q "200"; then
        log_success "✅ API accesible a través de Traefik"
    else
        log_warning "⚠️  API no accesible a través de Traefik (puede ser normal si DNS no está configurado)"
    fi
fi

echo ""
echo "📊 PASO 6: RESUMEN FINAL"
echo "========================"

log_success "🎉 CORRECCIÓN COMPLETADA"
echo ""
echo "📋 INFORMACIÓN DE ACCESO:"
echo "========================="
echo "🌐 Dashboard Traefik: http://localhost:8080"
echo "🔧 API directa: http://localhost:3001/api/health"
if [ ! -z "$DOMAIN" ] && [ "$DOMAIN" != "your-domain.com" ]; then
    echo "🌍 Sitio web: https://$DOMAIN"
    echo "🔗 API pública: https://$DOMAIN/api/health"
fi
echo ""
echo "📋 COMANDOS ÚTILES:"
echo "=================="
echo "Ver logs: docker-compose -f docker-compose.traefik.yml logs -f"
echo "Estado: docker-compose -f docker-compose.traefik.yml ps"
echo "Reiniciar: docker-compose -f docker-compose.traefik.yml restart"
echo "Parar: docker-compose -f docker-compose.traefik.yml down"
echo ""

# Verificar configuración de puertos en Traefik
log_info "Verificando configuración de puertos en Traefik..."
if docker exec traefik cat /etc/traefik/traefik.yml 2>/dev/null | grep -q "3001"; then
    log_success "✅ Configuración de puerto 3001 detectada en Traefik"
else
    log_warning "⚠️  No se pudo verificar la configuración de puertos en Traefik"
fi

echo ""
log_success "🔧 Script de corrección completado - $(date)"
echo ""
log_warning "📝 NOTAS IMPORTANTES:"
echo "1. Si el problema persiste, verifica que el DNS apunte a este servidor"
echo "2. Los certificados SSL pueden tardar unos minutos en generarse"
echo "3. Revisa los logs con: docker-compose -f docker-compose.traefik.yml logs -f traefik"
#!/bin/bash

# 🚀 SCRIPT DE DESPLIEGUE - CAFÉ COLOMBIA APP
# Configuración para acceso directo por IP: 31.97.128.11

set -e

echo "🔄 Iniciando configuración de despliegue para IP directa..."

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar si se ejecuta como root
if [[ $EUID -ne 0 ]]; then
   print_error "Este script debe ejecutarse como root o con sudo"
   exit 1
fi

print_status "1️⃣ Verificando estado actual de puertos..."

# Verificar qué está usando los puertos 80 y 443
echo "Puerto 80:"
ss -lntp | grep ':80 ' || echo "Puerto 80 libre"

echo "Puerto 443:"
ss -lntp | grep ':443 ' || echo "Puerto 443 libre"

echo "Puerto 3001 (Backend):"
ss -lntp | grep ':3001' || echo "Puerto 3001 libre"

echo "Puerto 4173 (Frontend Preview):"
ss -lntp | grep ':4173' || echo "Puerto 4173 libre"

print_status "2️⃣ Deteniendo servicios que puedan estar usando puertos conflictivos..."

# Detener coolify-proxy si existe
if docker ps --format '{{.Names}}' | grep -q '^coolify-proxy$'; then
    print_warning "Deteniendo coolify-proxy..."
    docker stop coolify-proxy || true
    docker rm -f coolify-proxy || true
fi

# Matar procesos en puertos 80 y 443
print_status "Liberando puertos 80 y 443..."
lsof -t -iTCP:80 -sTCP:LISTEN | xargs -r kill -9 || true
lsof -t -iTCP:443 -sTCP:LISTEN | xargs -r kill -9 || true
sleep 2

print_status "3️⃣ Verificando que el backend esté funcionando..."

# Verificar backend con PM2
if pm2 list | grep -q "cafe-colombia-api"; then
    print_status "✅ Backend encontrado en PM2"
    pm2 list
else
    print_warning "⚠️ Backend no encontrado en PM2, iniciando..."
    cd /root/CAFECOLOMBIAAPP
    pm2 start ecosystem.config.cjs --env production
fi

# Verificar que el backend responda
print_status "Verificando salud del backend..."
for i in {1..10}; do
    if curl -s http://localhost:3001/api/health > /dev/null; then
        print_status "✅ Backend respondiendo correctamente"
        break
    else
        print_warning "Intento $i/10 - Backend no responde, esperando..."
        sleep 3
    fi
done

print_status "4️⃣ Configurando Nginx..."

# Crear enlace simbólico a la configuración IP
NGINX_CONF="/etc/nginx/sites-available/cafecolombia-ip"
NGINX_CONF_ENABLED="/etc/nginx/sites-enabled/cafecolombia-ip"

if [ -f "/root/CAFECOLOMBIAAPP/nginx/conf.d/cafecolombia-ip.conf" ]; then
    print_status "Copiando configuración IP a Nginx..."
    cp /root/CAFECOLOMBIAAPP/nginx/conf.d/cafecolombia-ip.conf "$NGINX_CONF"
    
    # Deshabilitar configuraciones anteriores
    rm -f /etc/nginx/sites-enabled/default
    rm -f /etc/nginx/sites-enabled/cafecolombia
    rm -f /etc/nginx/sites-enabled/cafecolombia-ip 2>/dev/null || true
    
    # Habilitar nueva configuración
    ln -sf "$NGINX_CONF" "$NGINX_CONF_ENABLED"
    
    # Test de configuración
    print_status "Verificando configuración de Nginx..."
    nginx -t
    
    if [ $? -eq 0 ]; then
        print_status "✅ Configuración de Nginx válida"
        
        # Recargar Nginx
        print_status "Recargando Nginx..."
        systemctl reload nginx || nginx -s reload || service nginx reload
        
        if [ $? -eq 0 ]; then
            print_status "✅ Nginx recargado exitosamente"
        else
            print_warning "⚠️ Problema al recargar Nginx, intentando reiniciar..."
            systemctl restart nginx || service nginx restart
        fi
    else
        print_error "❌ Configuración de Nginx inválida"
        exit 1
    fi
else
    print_error "❌ No se encontró el archivo de configuración IP"
    exit 1
fi

print_status "5️⃣ Verificando puertos después de la configuración..."

echo "Estado final de puertos:"
echo "Puerto 80:"
ss -lntp | grep ':80 ' || echo "Puerto 80 aún libre"

echo "Puerto 3001 (Backend):"
ss -lntp | grep ':3001' || echo "Puerto 3001 libre"

print_status "6️⃣ Realizando pruebas de acceso..."

# Probar acceso local
echo "Prueba de acceso local:"
curl -sI http://localhost/ | head -n 3 || echo "No accesible localmente"

echo "Prueba de acceso a API:"
curl -s http://localhost/api/health || echo "API no accesible"

# Probar acceso externo (desde el VPS)
echo "Prueba de acceso externo (IP pública):"
curl -sI http://31.97.128.11/ | head -n 3 || echo "No accesible externamente"

echo "Prueba de API externa:"
curl -s http://31.97.128.11/api/health || echo "API no accesible externamente"

print_status "7️⃣ Resumen del despliegue..."

echo ""
echo "🎯 ACCESO A LA APLICACIÓN:"
echo "📱 Frontend: http://31.97.128.11/"
echo "🔧 Backend API: http://31.97.128.11/api/health"
echo "📊 PM2 Status: pm2 list"
echo "🌐 Nginx Status: systemctl status nginx"
echo ""

# Verificación final
if curl -s http://31.97.128.11/api/health > /dev/null; then
    print_status "✅ DESPLIEGUE EXITOSO - Todo está funcionando!"
else
    print_warning "⚠️ El backend no responde externamente, pero puede estar funcionando internamente"
    print_status "Prueba accediendo a: http://31.97.128.11:4173/ (preview directo)"
fi

echo ""
echo "📋 COMANDOS ÚTILES:"
echo "Ver logs del backend: pm2 logs cafe-colombia-api"
echo "Ver logs de Nginx: tail -f /var/log/nginx/access.log"
echo "Reiniciar backend: pm2 restart cafe-colombia-api"
echo "Reiniciar Nginx: systemctl restart nginx"
echo ""

print_status "🚀 Script de despliegue completado!"
#!/usr/bin/env pwsh
# Script de Diagnóstico Completo para Producción
# Resuelve el problema "Error de red - servidor no disponible"

Write-Host "🔍 DIAGNÓSTICO COMPLETO DE CONECTIVIDAD EN PRODUCCIÓN" -ForegroundColor Cyan
Write-Host "=" * 60 -ForegroundColor Gray

# 1. Verificar estado de contenedores Docker
Write-Host "`n📦 1. ESTADO DE CONTENEDORES DOCKER" -ForegroundColor Yellow
Write-Host "-" * 40
try {
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
} catch {
    Write-Host "❌ Error al verificar contenedores: $_" -ForegroundColor Red
}

# 2. Verificar conectividad del backend
Write-Host "`n🔌 2. CONECTIVIDAD DEL BACKEND" -ForegroundColor Yellow
Write-Host "-" * 40

$backendUrls = @(
    "http://localhost:3001/api/health",
    "http://localhost:3001/api/debug/connection",
    "http://api:3001/api/health"
)

foreach ($url in $backendUrls) {
    Write-Host "Probando: $url" -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5
        Write-Host "✅ $url - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $url - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Verificar configuración de Nginx
Write-Host "`n🌐 3. CONFIGURACIÓN DE NGINX" -ForegroundColor Yellow
Write-Host "-" * 40
if (Test-Path "nginx/conf.d/cafecolombiaapp.conf") {
    Write-Host "📄 Configuración de Nginx encontrada:" -ForegroundColor Green
    Get-Content "nginx/conf.d/cafecolombiaapp.conf" | Select-String -Pattern "upstream|proxy_pass|location /api" | ForEach-Object {
        Write-Host "  $($_.Line.Trim())" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Archivo de configuración de Nginx no encontrado" -ForegroundColor Red
}

# 4. Verificar logs de contenedores
Write-Host "`n📋 4. LOGS DE CONTENEDORES (ÚLTIMAS 10 LÍNEAS)" -ForegroundColor Yellow
Write-Host "-" * 40

$containers = @("cafecolombiaapp-api-1", "cafecolombiaapp-nginx-1", "cafecolombiaapp-client-1")
foreach ($container in $containers) {
    Write-Host "`n🔍 Logs de $container:" -ForegroundColor Cyan
    try {
        docker logs --tail 10 $container 2>&1 | ForEach-Object {
            Write-Host "  $_" -ForegroundColor Gray
        }
    } catch {
        Write-Host "❌ No se pudieron obtener logs de $container" -ForegroundColor Red
    }
}

# 5. Verificar variables de entorno
Write-Host "`n🔧 5. VARIABLES DE ENTORNO CRÍTICAS" -ForegroundColor Yellow
Write-Host "-" * 40
if (Test-Path ".env") {
    Write-Host "📄 Variables de entorno encontradas:" -ForegroundColor Green
    Get-Content ".env" | Select-String -Pattern "VITE_API_URL|API_URL|NODE_ENV" | ForEach-Object {
        Write-Host "  $($_.Line)" -ForegroundColor Gray
    }
} else {
    Write-Host "❌ Archivo .env no encontrado" -ForegroundColor Red
}

# 6. Probar conectividad desde el navegador
Write-Host "`n🌍 6. PRUEBA DE CONECTIVIDAD DESDE NAVEGADOR" -ForegroundColor Yellow
Write-Host "-" * 40
$frontendUrls = @(
    "http://localhost/api/health",
    "http://localhost/api/debug/connection"
)

foreach ($url in $frontendUrls) {
    Write-Host "Probando desde frontend: $url" -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5
        Write-Host "✅ $url - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "❌ $url - Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 7. Verificar puertos en uso
Write-Host "`n🔌 7. PUERTOS EN USO" -ForegroundColor Yellow
Write-Host "-" * 40
$ports = @(80, 3001, 3306, 6379)
foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "✅ Puerto $port está abierto" -ForegroundColor Green
        } else {
            Write-Host "❌ Puerto $port está cerrado" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Error al verificar puerto $port" -ForegroundColor Red
    }
}

# 8. Recomendaciones de solución
Write-Host "`n💡 8. RECOMENDACIONES DE SOLUCIÓN" -ForegroundColor Yellow
Write-Host "-" * 40
Write-Host "Si el backend no responde:" -ForegroundColor Cyan
Write-Host "  1. Reiniciar contenedor API: docker restart cafecolombiaapp-api-1" -ForegroundColor Gray
Write-Host "  2. Verificar logs: docker logs cafecolombiaapp-api-1" -ForegroundColor Gray
Write-Host "  3. Verificar base de datos: docker exec -it cafecolombiaapp-mysql-1 mysql -u root -p" -ForegroundColor Gray

Write-Host "`nSi Nginx no redirige correctamente:" -ForegroundColor Cyan
Write-Host "  1. Reiniciar Nginx: docker restart cafecolombiaapp-nginx-1" -ForegroundColor Gray
Write-Host "  2. Verificar configuración: docker exec cafecolombiaapp-nginx-1 nginx -t" -ForegroundColor Gray
Write-Host "  3. Recargar configuración: docker exec cafecolombiaapp-nginx-1 nginx -s reload" -ForegroundColor Gray

Write-Host "`nSi persiste el problema:" -ForegroundColor Cyan
Write-Host "  1. Reconstruir contenedores: docker-compose down && docker-compose up --build -d" -ForegroundColor Gray
Write-Host "  2. Limpiar volúmenes: docker-compose down -v && docker-compose up -d" -ForegroundColor Gray
Write-Host "  3. Verificar red Docker: docker network ls && docker network inspect cafecolombiaapp_default" -ForegroundColor Gray

Write-Host "`n🎯 DIAGNÓSTICO COMPLETADO" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray
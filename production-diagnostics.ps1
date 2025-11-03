# Script de Diagnostico Completo para Produccion
# Resuelve el problema "Error de red - servidor no disponible"

Write-Host "DIAGNOSTICO COMPLETO DE CONECTIVIDAD EN PRODUCCION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Gray

# 1. Verificar estado de contenedores Docker
Write-Host "`n1. ESTADO DE CONTENEDORES DOCKER" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
try {
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
} catch {
    Write-Host "Error al verificar contenedores: $_" -ForegroundColor Red
}

# 2. Verificar conectividad del backend
Write-Host "`n2. CONECTIVIDAD DEL BACKEND" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

$backendUrls = @(
    "http://localhost:3001/api/health",
    "http://localhost:3001/api/debug/connection"
)

foreach ($url in $backendUrls) {
    Write-Host "Probando: $url" -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5
        Write-Host "OK $url - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "ERROR $url - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Verificar configuracion de Nginx
Write-Host "`n3. CONFIGURACION DE NGINX" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
if (Test-Path "nginx/conf.d/cafecolombiaapp.conf") {
    Write-Host "Configuracion de Nginx encontrada:" -ForegroundColor Green
    Get-Content "nginx/conf.d/cafecolombiaapp.conf" | Select-String -Pattern "upstream|proxy_pass|location /api" | ForEach-Object {
        Write-Host "  $($_.Line.Trim())" -ForegroundColor Gray
    }
} else {
    Write-Host "Archivo de configuracion de Nginx no encontrado" -ForegroundColor Red
}

# 4. Verificar variables de entorno
Write-Host "`n4. VARIABLES DE ENTORNO CRITICAS" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
if (Test-Path ".env") {
    Write-Host "Variables de entorno encontradas:" -ForegroundColor Green
    Get-Content ".env" | Select-String -Pattern "VITE_API_URL|API_URL|NODE_ENV" | ForEach-Object {
        Write-Host "  $($_.Line)" -ForegroundColor Gray
    }
} else {
    Write-Host "Archivo .env no encontrado" -ForegroundColor Red
}

# 5. Probar conectividad desde el navegador
Write-Host "`n5. PRUEBA DE CONECTIVIDAD DESDE NAVEGADOR" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$frontendUrls = @(
    "http://localhost:3001/api/health",
    "http://localhost:3001/api/debug/connection"
)

foreach ($url in $frontendUrls) {
    Write-Host "Probando desde frontend: $url" -ForegroundColor Gray
    try {
        $response = Invoke-WebRequest -Uri $url -Method GET -TimeoutSec 5
        Write-Host "OK $url - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "ERROR $url - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 6. Verificar puertos en uso
Write-Host "`n6. PUERTOS EN USO" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
$ports = @(80, 3001, 3306, 6379)
foreach ($port in $ports) {
    try {
        $connection = Test-NetConnection -ComputerName localhost -Port $port -WarningAction SilentlyContinue
        if ($connection.TcpTestSucceeded) {
            Write-Host "OK Puerto $port esta abierto" -ForegroundColor Green
        } else {
            Write-Host "ERROR Puerto $port esta cerrado" -ForegroundColor Red
        }
    } catch {
        Write-Host "ERROR al verificar puerto $port" -ForegroundColor Red
    }
}

# 7. Recomendaciones de solucion
Write-Host "`n7. RECOMENDACIONES DE SOLUCION" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host "Si el backend no responde:" -ForegroundColor Cyan
Write-Host "  1. Reiniciar contenedor API: docker restart cafecolombiaapp-api-1" -ForegroundColor Gray
Write-Host "  2. Verificar logs: docker logs cafecolombiaapp-api-1" -ForegroundColor Gray

Write-Host "`nSi Nginx no redirige correctamente:" -ForegroundColor Cyan
Write-Host "  1. Reiniciar Nginx: docker restart cafecolombiaapp-nginx-1" -ForegroundColor Gray
Write-Host "  2. Verificar configuracion: docker exec cafecolombiaapp-nginx-1 nginx -t" -ForegroundColor Gray

Write-Host "`nSi persiste el problema:" -ForegroundColor Cyan
Write-Host "  1. Reconstruir contenedores: docker-compose down; docker-compose up --build -d" -ForegroundColor Gray
Write-Host "  2. Limpiar volumenes: docker-compose down -v; docker-compose up -d" -ForegroundColor Gray

Write-Host "`nDIAGNOSTICO COMPLETADO" -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Gray
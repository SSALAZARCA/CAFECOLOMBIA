# 🚀 SCRIPT DE DESPLIEGUE PARA WINDOWS - CAFÉ COLOMBIA APP
# Este script automatiza el proceso de despliegue en Windows

param(
    [switch]$Production,
    [switch]$Test,
    [string]$Environment = "development"
)

# Colores para output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"
$Blue = "Cyan"

function Write-Log {
    param([string]$Message, [string]$Color = $Green)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] $Message" -ForegroundColor $Color
}

function Write-Error-Log {
    param([string]$Message)
    Write-Log $Message $Red
}

function Write-Warning-Log {
    param([string]$Message)
    Write-Log $Message $Yellow
}

function Write-Info-Log {
    param([string]$Message)
    Write-Log $Message $Blue
}

# Verificar si estamos en el directorio correcto
if (-not (Test-Path "package.json")) {
    Write-Error-Log "Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
}

Write-Log "🚀 Iniciando proceso de despliegue..."

# Verificar Node.js
try {
    $nodeVersion = node --version
    Write-Info-Log "Node.js version: $nodeVersion"
} catch {
    Write-Error-Log "Node.js no está instalado o no está en el PATH"
    exit 1
}

# Crear directorio de backup
$backupDir = "backups\$(Get-Date -Format 'yyyyMMdd_HHmmss')"
Write-Log "💾 Creando backup en $backupDir..."
New-Item -ItemType Directory -Path $backupDir -Force | Out-Null

if (Test-Path "dist") {
    Copy-Item -Path "dist" -Destination "$backupDir\" -Recurse -Force
}
if (Test-Path "api\dist") {
    Copy-Item -Path "api\dist" -Destination "$backupDir\" -Recurse -Force
}

# Verificar Git
try {
    Write-Log "📥 Obteniendo última versión del código..."
    git fetch origin
    git pull origin main
} catch {
    Write-Warning-Log "Error al actualizar desde Git"
}

# Instalar dependencias
Write-Log "📦 Instalando dependencias del frontend..."
try {
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "Error en npm ci" }
} catch {
    Write-Error-Log "Error al instalar dependencias del frontend"
    exit 1
}

Write-Log "📦 Instalando dependencias del backend..."
try {
    Set-Location api
    npm ci
    if ($LASTEXITCODE -ne 0) { throw "Error en npm ci del backend" }
    Set-Location ..
} catch {
    Write-Error-Log "Error al instalar dependencias del backend"
    Set-Location ..
    exit 1
}

# Ejecutar tests si existen
$packageJson = Get-Content "package.json" | ConvertFrom-Json
if ($packageJson.scripts.test) {
    Write-Log "🧪 Ejecutando tests..."
    try {
        npm test
        if ($LASTEXITCODE -ne 0) { throw "Tests fallaron" }
    } catch {
        Write-Error-Log "Los tests fallaron. Despliegue cancelado."
        exit 1
    }
}

# Compilar aplicación
Write-Log "🏗️ Compilando frontend..."
try {
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Error en build del frontend" }
} catch {
    Write-Error-Log "Error en la compilación del frontend"
    exit 1
}

Write-Log "🏗️ Compilando backend..."
try {
    Set-Location api
    npm run build
    if ($LASTEXITCODE -ne 0) { throw "Error en build del backend" }
    Set-Location ..
} catch {
    Write-Error-Log "Error en la compilación del backend"
    Set-Location ..
    exit 1
}

# Verificar archivos compilados
if (-not (Test-Path "dist\index.html")) {
    Write-Error-Log "No se encontró dist\index.html después de la compilación"
    exit 1
}

if (-not (Test-Path "api\dist\server.js")) {
    Write-Error-Log "No se encontró api\dist\server.js después de la compilación"
    exit 1
}

# Crear directorios necesarios
$directories = @("uploads", "logs", "backups")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Info-Log "Directorio creado: $dir"
    }
}

# Si es producción, verificar variables de entorno
if ($Production) {
    Write-Log "🔍 Verificando configuración de producción..."
    
    if (-not (Test-Path ".env.production")) {
        Write-Error-Log "No se encontró .env.production"
        exit 1
    }
    
    if (-not (Test-Path "api\.env.production")) {
        Write-Error-Log "No se encontró api\.env.production"
        exit 1
    }
    
    # Copiar archivos de producción
    Copy-Item ".env.production" ".env" -Force
    Copy-Item "api\.env.production" "api\.env" -Force
    Write-Info-Log "Archivos de configuración de producción aplicados"
}

# Limpiar backups antiguos (mantener solo los últimos 5)
Write-Log "🗂️ Limpiando backups antiguos..."
if (Test-Path "backups") {
    $oldBackups = Get-ChildItem "backups" | Sort-Object CreationTime -Descending | Select-Object -Skip 5
    foreach ($backup in $oldBackups) {
        Remove-Item $backup.FullName -Recurse -Force
        Write-Info-Log "Backup eliminado: $($backup.Name)"
    }
}

# Mostrar información del despliegue
Write-Log "📊 Información del despliegue:"
try {
    $gitHash = git rev-parse --short HEAD
    Write-Info-Log "Versión desplegada: $gitHash"
} catch {
    Write-Info-Log "Versión: No disponible (sin Git)"
}
Write-Info-Log "Fecha: $(Get-Date)"
Write-Info-Log "Usuario: $env:USERNAME"
Write-Info-Log "Backup creado en: $backupDir"

Write-Log "✅ Despliegue completado exitosamente!"
Write-Info-Log "🌐 Para iniciar la aplicación:"
Write-Info-Log "   Frontend: npm run preview (puerto 4173)"
Write-Info-Log "   Backend: cd api && npm start (puerto 3001)"

if ($Production) {
    Write-Warning-Log "⚠️  Recuerda configurar el servidor web (Nginx/IIS) para producción"
    Write-Warning-Log "⚠️  Configura PM2 o un gestor de procesos para el backend"
}
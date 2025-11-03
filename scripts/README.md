# 🛠️ Scripts de Automatización - Café Colombia App

Este directorio contiene todos los scripts de automatización para el despliegue, mantenimiento y monitoreo de la aplicación Café Colombia.

## 📁 Estructura de Scripts

```
scripts/
├── README.md                 # Este archivo
├── install-production.sh     # Instalación automática en Linux
├── deploy.sh                # Despliegue automático en Linux
├── deploy.ps1               # Despliegue automático en Windows
├── migrate.js               # Migraciones de base de datos
├── create-admin.js          # Creación de usuario administrador
├── backup.js                # Sistema de backups
├── monitor.js               # Monitoreo del sistema
├── maintenance.js           # Mantenimiento automatizado
└── health-check.js          # Verificación de salud del sistema
```

## 🚀 Scripts de Despliegue

### install-production.sh
**Propósito:** Instalación completa del sistema en un servidor Linux limpio.

```bash
# Uso
chmod +x scripts/install-production.sh
sudo ./scripts/install-production.sh

# Funciones:
# - Actualiza el sistema
# - Instala Node.js, PM2, Nginx, MySQL, Certbot
# - Configura firewall
# - Crea base de datos y usuario
# - Clona repositorio
# - Configura variables de entorno
# - Compila aplicación
# - Ejecuta migraciones
# - Configura Nginx y SSL
# - Inicia aplicación con PM2
```

### deploy.sh
**Propósito:** Despliegue automático de actualizaciones en Linux.

```bash
# Uso
./scripts/deploy.sh

# Funciones:
# - Crea backup antes del despliegue
# - Obtiene últimos cambios del repositorio
# - Actualiza dependencias
# - Ejecuta tests
# - Compila aplicación
# - Ejecuta migraciones
# - Reinicia aplicación
# - Verifica estado post-despliegue
```

### deploy.ps1
**Propósito:** Despliegue automático de actualizaciones en Windows.

```powershell
# Uso
.\scripts\deploy.ps1

# Funciones similares a deploy.sh pero para Windows
```

## 🗄️ Scripts de Base de Datos

### migrate.js
**Propósito:** Ejecutar migraciones de base de datos.

```bash
# Uso
npm run mysql:migrate
# o directamente:
node scripts/migrate.js

# Funciones:
# - Verifica conexión a base de datos
# - Crea tablas necesarias
# - Inserta datos iniciales
# - Maneja errores de migración
```

### create-admin.js
**Propósito:** Crear usuario administrador inicial.

```bash
# Uso
npm run create-admin
# o directamente:
node scripts/create-admin.js

# Funciones:
# - Crea usuario administrador por defecto
# - Genera contraseña segura
# - Crea finca y lote de ejemplo
# - Verifica si ya existe admin
```

## 💾 Scripts de Backup

### backup.js
**Propósito:** Sistema completo de backups.

```bash
# Uso completo
npm run backup
node scripts/backup.js

# Uso específico
node scripts/backup.js --db-only      # Solo base de datos
node scripts/backup.js --files-only   # Solo archivos
node scripts/backup.js --no-cleanup   # Sin limpiar backups antiguos

# Funciones:
# - Backup de base de datos MySQL
# - Backup de archivos críticos
# - Compresión automática
# - Limpieza de backups antiguos
# - Verificación de integridad
```

## 📊 Scripts de Monitoreo

### monitor.js
**Propósito:** Monitoreo completo del sistema.

```bash
# Uso
npm run monitor
node scripts/monitor.js

# Funciones:
# - Verifica estado de base de datos
# - Monitorea API endpoints
# - Revisa uso de recursos del sistema
# - Verifica procesos PM2
# - Analiza logs
# - Genera alertas automáticas
# - Guarda reportes en JSON
```

### health-check.js
**Propósito:** Verificación rápida de salud del sistema.

```bash
# Uso completo
npm run health-check
node scripts/health-check.js

# Uso específico
node scripts/health-check.js --no-network    # Sin verificar red
node scripts/health-check.js --no-database   # Sin verificar BD
node scripts/health-check.js --no-api        # Sin verificar API

# Funciones:
# - Verifica conectividad de red
# - Prueba conexión a base de datos
# - Verifica endpoints de API
# - Revisa servicios del sistema
# - Verifica archivos críticos
# - Retorna código de salida para scripts
```

### maintenance.js
**Propósito:** Mantenimiento automatizado del sistema.

```bash
# Uso completo
npm run maintenance
node scripts/maintenance.js

# Uso rápido
npm run maintenance:quick

# Uso personalizado
node scripts/maintenance.js --no-logs      # Sin limpiar logs
node scripts/maintenance.js --no-backups  # Sin limpiar backups
node scripts/maintenance.js --no-db       # Sin optimizar BD

# Funciones:
# - Limpia logs antiguos
# - Limpia backups antiguos
# - Limpia archivos temporales
# - Limpia sesiones expiradas
# - Optimiza base de datos
# - Verifica permisos de archivos
# - Genera reporte de uso de espacio
```

## ⚙️ Configuración de Scripts

### Variables de Entorno Requeridas

```bash
# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=cafe_colombia_user
DB_PASSWORD=tu_password_seguro
DB_NAME=cafe_colombia_app

# API
VITE_API_URL=http://localhost:3001

# Opcional para Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Configuración de Umbrales

Los scripts de monitoreo usan estos umbrales por defecto:

```javascript
const thresholds = {
    cpu: 80,           // % de uso de CPU
    memory: 85,        // % de uso de memoria
    disk: 90,          // % de uso de disco
    responseTime: 2000 // ms de tiempo de respuesta
};
```

### Configuración de Retención

```javascript
const retention = {
    logRetentionDays: 30,        // Días para mantener logs
    backupRetentionDays: 7,      // Días para mantener backups
    sessionCleanupDays: 7,       // Días para limpiar sesiones
    tempFileRetentionHours: 24   // Horas para archivos temporales
};
```

## 🔧 Automatización con Cron

### Configuración Recomendada

```bash
# Editar crontab
crontab -e

# Agregar estas líneas:

# Health check cada 5 minutos
*/5 * * * * cd /path/to/app && npm run health-check >> /var/log/cafe-health.log 2>&1

# Monitoreo completo cada hora
0 * * * * cd /path/to/app && npm run monitor >> /var/log/cafe-monitor.log 2>&1

# Mantenimiento diario a las 2 AM
0 2 * * * cd /path/to/app && npm run maintenance >> /var/log/cafe-maintenance.log 2>&1

# Backup diario a las 3 AM
0 3 * * * cd /path/to/app && npm run backup >> /var/log/cafe-backup.log 2>&1

# Mantenimiento rápido cada 6 horas
0 */6 * * * cd /path/to/app && npm run maintenance:quick >> /var/log/cafe-maintenance-quick.log 2>&1
```

## 📋 Uso en Producción

### Secuencia de Despliegue Inicial

```bash
# 1. Instalación completa (solo primera vez)
sudo ./scripts/install-production.sh

# 2. Verificar instalación
npm run health-check

# 3. Crear usuario administrador
npm run create-admin

# 4. Primer backup
npm run backup

# 5. Configurar monitoreo automático
# (configurar cron jobs como se muestra arriba)
```

### Secuencia de Actualización

```bash
# 1. Verificar estado actual
npm run health-check

# 2. Crear backup pre-despliegue
npm run backup

# 3. Ejecutar despliegue
./scripts/deploy.sh

# 4. Verificar estado post-despliegue
npm run health-check

# 5. Ejecutar mantenimiento si es necesario
npm run maintenance:quick
```

### Monitoreo Continuo

```bash
# Verificación rápida diaria
npm run health-check

# Monitoreo detallado semanal
npm run monitor

# Mantenimiento semanal
npm run maintenance

# Backup según política definida
npm run backup
```

## 🚨 Solución de Problemas

### Errores Comunes

#### Error de Permisos
```bash
# Solución
chmod +x scripts/*.sh
sudo chown -R $USER:$USER scripts/
```

#### Error de Conexión a Base de Datos
```bash
# Verificar configuración
npm run mysql:test

# Verificar variables de entorno
echo $DB_HOST $DB_USER $DB_NAME
```

#### Error en Scripts de Node.js
```bash
# Verificar dependencias
npm install

# Verificar versión de Node.js
node --version  # Debe ser >= 18.0.0
```

### Logs de Depuración

Todos los scripts generan logs detallados:

```bash
# Logs de aplicación
tail -f logs/app.log

# Logs de scripts específicos
tail -f logs/monitor-*.json
tail -f logs/maintenance-*.json
tail -f logs/health-check-*.json
```

## 📞 Soporte

Para problemas con los scripts:

1. Verificar logs en el directorio `logs/`
2. Ejecutar `npm run health-check` para diagnóstico
3. Revisar variables de entorno
4. Consultar este README
5. Contactar al equipo de desarrollo

---

**Nota:** Todos los scripts están diseñados para ser idempotentes y seguros para ejecutar múltiples veces.
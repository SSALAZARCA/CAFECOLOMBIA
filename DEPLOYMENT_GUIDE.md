# 🚀 GUÍA COMPLETA DE DESPLIEGUE - CAFÉ COLOMBIA APP

## 📋 Información General

**Aplicación:** Café Colombia - Sistema de Gestión Integral de Fincas Cafeteras  
**Versión:** 1.0.0  
**Fecha de Despliegue:** [FECHA_DESPLIEGUE]  
**Responsable:** [NOMBRE_RESPONSABLE]  

---

## 🌐 URLs y Accesos

### URLs de Producción
- **Frontend:** `https://cafecolombiaapp.com`
- **API Backend:** `https://api.cafecolombiaapp.com`
- **Panel de Administración:** `https://cafecolombiaapp.com/admin`
- **Documentación API:** `https://api.cafecolombiaapp.com/docs`

### URLs de Desarrollo/Staging
- **Frontend:** `https://staging.cafecolombiaapp.com`
- **API Backend:** `https://api-staging.cafecolombiaapp.com`

---

## 🔐 Credenciales y Configuración

### Base de Datos MySQL

```bash
# Servidor de Producción
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cafe_colombia_app
DB_USER=cafe_colombia_user
DB_PASSWORD=[GENERAR_PASSWORD_SEGURO]

# Ejemplo de conexión
mysql -h localhost -u cafe_colombia_user -p cafe_colombia_app
```

### Usuario Administrador por Defecto

```bash
# Credenciales iniciales (CAMBIAR INMEDIATAMENTE)
Email: admin@cafecolombiaapp.com
Password: CafeAdmin2024!
Rol: Administrador

# Para crear nuevo admin:
npm run create-admin
```

### Variables de Entorno Críticas

#### Frontend (.env.production)
```bash
# API Configuration
VITE_API_URL=https://api.cafecolombiaapp.com
VITE_APP_NAME="Café Colombia"
VITE_APP_VERSION=1.0.0

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=[TU_GOOGLE_MAPS_API_KEY]

# Wompi Payments
VITE_WOMPI_PUBLIC_KEY=[TU_WOMPI_PUBLIC_KEY]
VITE_WOMPI_ENVIRONMENT=production

# PWA Configuration
VITE_PWA_NAME="Café Colombia"
VITE_PWA_SHORT_NAME="CafeColombia"
```

#### Backend (api/.env.production)
```bash
# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=cafe_colombia_user
DB_PASSWORD=[DB_PASSWORD]
DB_NAME=cafe_colombia_app

# JWT Configuration
JWT_SECRET=[GENERAR_JWT_SECRET_SEGURO]
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=https://cafecolombiaapp.com

# Wompi Payments
WOMPI_PUBLIC_KEY=[TU_WOMPI_PUBLIC_KEY]
WOMPI_PRIVATE_KEY=[TU_WOMPI_PRIVATE_KEY]
WOMPI_ENVIRONMENT=production
WOMPI_WEBHOOK_SECRET=[TU_WOMPI_WEBHOOK_SECRET]

# Email Configuration (Opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=[TU_EMAIL]
SMTP_PASS=[TU_APP_PASSWORD]
EMAIL_FROM="Café Colombia <noreply@cafecolombiaapp.com>"

# File Upload
UPLOAD_MAX_SIZE=10485760
UPLOAD_ALLOWED_TYPES=image/jpeg,image/png,image/webp,application/pdf

# Security
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info
LOG_FILE=logs/app.log
```

---

## 🛠️ Comandos de Despliegue

### Instalación Inicial (Linux/Ubuntu)

```bash
# 1. Ejecutar script de instalación automática
chmod +x scripts/install-production.sh
sudo ./scripts/install-production.sh

# 2. Configurar variables de entorno
cp .env.example .env.production
cp api/.env.example api/.env.production
# Editar archivos con valores reales

# 3. Ejecutar migraciones
npm run mysql:migrate

# 4. Crear usuario administrador
npm run create-admin

# 5. Iniciar aplicación
pm2 start ecosystem.config.js --env production
```

### Despliegue con Docker

```bash
# 1. Configurar variables de entorno
cp .env.docker .env

# 2. Construir y ejecutar
docker-compose up -d

# 3. Verificar servicios
docker-compose ps
docker-compose logs -f api
```

### Despliegue Manual

```bash
# 1. Instalar dependencias
npm install
cd api && npm install && cd ..

# 2. Compilar aplicación
npm run build:prod
npm run server:build:prod

# 3. Ejecutar migraciones
npm run mysql:migrate

# 4. Iniciar aplicación
npm run start
```

---

## 🔧 Scripts de Mantenimiento

### Monitoreo del Sistema

```bash
# Verificar estado general
npm run health-check

# Monitoreo completo
npm run monitor

# Verificar solo API
npm run health-check --no-database --no-files
```

### Mantenimiento Automatizado

```bash
# Mantenimiento completo
npm run maintenance

# Mantenimiento rápido (sin optimización DB)
npm run maintenance:quick

# Mantenimiento personalizado
node scripts/maintenance.js --no-logs --no-backups
```

### Backup y Restauración

```bash
# Crear backup completo
npm run backup

# Backup solo base de datos
node scripts/backup.js --db-only

# Backup solo archivos
node scripts/backup.js --files-only
```

---

## 📊 Monitoreo y Logs

### Ubicación de Logs

```bash
# Logs de aplicación
logs/app.log
logs/error.log
logs/access.log

# Logs de PM2
~/.pm2/logs/cafe-colombia-api-out.log
~/.pm2/logs/cafe-colombia-api-error.log

# Logs de Nginx
/var/log/nginx/access.log
/var/log/nginx/error.log
```

### Comandos de Monitoreo

```bash
# Ver logs en tiempo real
pm2 logs cafe-colombia-api

# Estado de procesos PM2
pm2 status

# Monitoreo de recursos
pm2 monit

# Reiniciar aplicación
pm2 restart cafe-colombia-api

# Ver logs de Nginx
sudo tail -f /var/log/nginx/access.log
```

---

## 🔒 Configuración de Seguridad

### SSL/TLS (Certbot)

```bash
# Obtener certificado SSL
sudo certbot --nginx -d cafecolombiaapp.com -d api.cafecolombiaapp.com

# Renovar certificados (automático)
sudo crontab -e
# Agregar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### Firewall (UFW)

```bash
# Configurar firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw allow 3306  # MySQL (solo si es necesario)
sudo ufw enable
```

### Configuración de Nginx

```bash
# Archivo de configuración principal
/etc/nginx/nginx.conf

# Configuración del sitio
/etc/nginx/sites-available/cafecolombiaapp.conf
/etc/nginx/sites-enabled/cafecolombiaapp.conf

# Reiniciar Nginx
sudo systemctl restart nginx
sudo systemctl reload nginx
```

---

## 🚨 Solución de Problemas

### Problemas Comunes

#### 1. Error de Conexión a Base de Datos
```bash
# Verificar estado de MySQL
sudo systemctl status mysql

# Verificar conexión
npm run mysql:test

# Reiniciar MySQL
sudo systemctl restart mysql
```

#### 2. Error 502 Bad Gateway
```bash
# Verificar estado de la aplicación
pm2 status

# Verificar logs
pm2 logs cafe-colombia-api

# Reiniciar aplicación
pm2 restart cafe-colombia-api
```

#### 3. Problemas de SSL
```bash
# Verificar certificados
sudo certbot certificates

# Renovar certificados
sudo certbot renew

# Verificar configuración Nginx
sudo nginx -t
```

#### 4. Problemas de Permisos
```bash
# Verificar permisos de archivos
ls -la uploads/
ls -la logs/

# Corregir permisos
sudo chown -R www-data:www-data uploads/
sudo chown -R www-data:www-data logs/
sudo chmod -R 755 uploads/
sudo chmod -R 755 logs/
```

### Comandos de Diagnóstico

```bash
# Verificar estado completo del sistema
npm run health-check

# Verificar configuración
node -e "console.log(process.env)" | grep -E "(DB_|JWT_|API_)"

# Verificar puertos en uso
sudo netstat -tlnp | grep -E "(3001|80|443|3306)"

# Verificar espacio en disco
df -h

# Verificar memoria
free -h

# Verificar procesos
ps aux | grep -E "(node|nginx|mysql)"
```

---

## 📈 Optimización de Rendimiento

### Configuración de PM2

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'cafe-colombia-api',
    script: 'api/dist/server.js',
    instances: 'max',  // Usar todos los cores disponibles
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### Optimización de MySQL

```sql
-- Configuración recomendada en /etc/mysql/mysql.conf.d/mysqld.cnf
[mysqld]
innodb_buffer_pool_size = 256M
innodb_log_file_size = 64M
max_connections = 100
query_cache_size = 32M
query_cache_type = 1
```

### Optimización de Nginx

```nginx
# Configuración de rendimiento en nginx.conf
worker_processes auto;
worker_connections 1024;

# Compresión
gzip on;
gzip_vary on;
gzip_min_length 1024;
gzip_types text/plain text/css application/json application/javascript;

# Cache de archivos estáticos
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 📋 Checklist de Despliegue

### Pre-Despliegue
- [ ] Configurar servidor (Ubuntu 20.04+ recomendado)
- [ ] Instalar dependencias del sistema
- [ ] Configurar base de datos MySQL
- [ ] Obtener certificados SSL
- [ ] Configurar DNS (A records para dominio y subdominio api)
- [ ] Configurar variables de entorno
- [ ] Obtener API keys (Google Maps, Wompi)

### Durante el Despliegue
- [ ] Ejecutar script de instalación
- [ ] Verificar compilación de frontend y backend
- [ ] Ejecutar migraciones de base de datos
- [ ] Crear usuario administrador
- [ ] Configurar Nginx
- [ ] Configurar PM2
- [ ] Verificar SSL/TLS

### Post-Despliegue
- [ ] Ejecutar health check completo
- [ ] Verificar todas las URLs
- [ ] Probar funcionalidades críticas
- [ ] Configurar monitoreo
- [ ] Configurar backups automáticos
- [ ] Documentar credenciales
- [ ] Capacitar al equipo

---

## 📞 Contacto y Soporte

### Información de Contacto
- **Desarrollador:** [NOMBRE_DESARROLLADOR]
- **Email:** [EMAIL_CONTACTO]
- **Teléfono:** [TELEFONO_CONTACTO]

### Repositorio y Documentación
- **Repositorio:** [URL_REPOSITORIO]
- **Documentación:** [URL_DOCUMENTACION]
- **Issues:** [URL_ISSUES]

### Horarios de Soporte
- **Lunes a Viernes:** 8:00 AM - 6:00 PM COT
- **Emergencias:** 24/7 (solo para problemas críticos)

---

## 📝 Notas Adicionales

### Actualizaciones
- Las actualizaciones se realizan mediante el script `deploy.sh`
- Siempre crear backup antes de actualizar
- Probar en ambiente de staging antes de producción

### Seguridad
- Cambiar todas las contraseñas por defecto
- Revisar logs regularmente
- Mantener sistema actualizado
- Configurar alertas de monitoreo

### Mantenimiento
- Ejecutar mantenimiento semanal: `npm run maintenance`
- Revisar logs diariamente
- Monitorear uso de recursos
- Limpiar archivos temporales regularmente

---

**Fecha de Creación:** [FECHA_ACTUAL]  
**Última Actualización:** [FECHA_ACTUALIZACION]  
**Versión del Documento:** 1.0
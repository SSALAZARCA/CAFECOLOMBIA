# 🤖 Scripts de Automatización para Despliegue - Café Colombia App

## 📋 Contenido
1. [Script de Instalación Automática](#script-de-instalación-automática)
2. [Configuraciones de Producción](#configuraciones-de-producción)
3. [Scripts de Mantenimiento](#scripts-de-mantenimiento)
4. [Monitoreo Automatizado](#monitoreo-automatizado)
5. [Scripts de Seguridad](#scripts-de-seguridad)

---

## 🚀 Script de Instalación Automática

### install-production.sh
```bash
#!/bin/bash

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

# Verificar si se ejecuta como root
if [[ $EUID -eq 0 ]]; then
   error "Este script no debe ejecutarse como root"
   exit 1
fi

log "🚀 Iniciando instalación automática de Café Colombia App"

# Solicitar información necesaria
read -p "Ingrese el dominio (ej: cafecolombiaapp.com): " DOMAIN
read -p "Ingrese el email para SSL (ej: admin@cafecolombiaapp.com): " SSL_EMAIL
read -s -p "Ingrese la contraseña para la base de datos: " DB_PASSWORD
echo
read -s -p "Confirme la contraseña para la base de datos: " DB_PASSWORD_CONFIRM
echo

if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
    error "Las contraseñas no coinciden"
    exit 1
fi

# Generar JWT secret
JWT_SECRET=$(openssl rand -base64 32)

log "📦 Actualizando sistema..."
sudo apt update && sudo apt upgrade -y

log "🔧 Instalando dependencias del sistema..."
sudo apt install -y curl wget git nginx mysql-server ufw certbot python3-certbot-nginx

log "📱 Instalando Node.js 18 LTS..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

log "🌐 Instalando PM2..."
sudo npm install -g pm2

log "🔥 Configurando firewall..."
sudo ufw --force enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443

log "🗄️ Configurando MySQL..."
sudo mysql -e "CREATE DATABASE cafe_colombia_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
sudo mysql -e "CREATE USER 'cafeapp'@'localhost' IDENTIFIED BY '$DB_PASSWORD';"
sudo mysql -e "GRANT ALL PRIVILEGES ON cafe_colombia_app.* TO 'cafeapp'@'localhost';"
sudo mysql -e "FLUSH PRIVILEGES;"

log "📁 Clonando repositorio..."
if [ ! -d "CAFECOLOMBIAAPP" ]; then
    git clone https://github.com/SSALAZARCA/CAFECOLOMBIAAPP.git
fi
cd CAFECOLOMBIAAPP

log "⚙️ Creando archivo de configuración..."
cat > .env << EOF
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cafe_colombia_app
DB_USER=cafeapp
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d
VITE_API_URL=https://$DOMAIN/api
VITE_APP_URL=https://$DOMAIN
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=https://$DOMAIN
UPLOAD_DIR=/home/$(whoami)/CAFECOLOMBIAAPP/uploads
MAX_FILE_SIZE=10485760
WOMPI_PUBLIC_KEY=pub_test_
WOMPI_PRIVATE_KEY=prv_test_
WOMPI_ENVIRONMENT=production
WOMPI_WEBHOOK_SECRET=webhook_secret_change_me
EOF

cp .env api/.env

log "📦 Instalando dependencias del proyecto..."
npm install
cd api && npm install && cd ..

log "🏗️ Compilando aplicación..."
npm run build
cd api && npm run build && cd ..

log "📁 Creando directorios necesarios..."
mkdir -p uploads logs backups scripts

log "🔧 Creando scripts de automatización..."

# Script de migración
cat > scripts/migrate.js << 'EOF'
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('🔄 Ejecutando migraciones...');
    
    // Crear tablas básicas si no existen
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS admins (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        role ENUM('admin', 'super_admin') DEFAULT 'admin',
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS system_settings (
        id INT PRIMARY KEY AUTO_INCREMENT,
        setting_key VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        description TEXT,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        phone VARCHAR(20),
        isActive BOOLEAN DEFAULT true,
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.execute(`
      CREATE TABLE IF NOT EXISTS fincas (
        id INT PRIMARY KEY AUTO_INCREMENT,
        user_id INT NOT NULL,
        name VARCHAR(100) NOT NULL,
        location VARCHAR(255),
        area DECIMAL(10,2),
        altitude INT,
        variety VARCHAR(100),
        createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Migraciones completadas');
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  require('dotenv').config();
  runMigrations().catch(console.error);
}

module.exports = { runMigrations };
EOF

# Script de creación de admin
cat > scripts/create-admin.js << 'EOF'
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    const adminEmail = 'admin@cafecolombiaapp.com';
    const adminPassword = 'CafeAdmin2024!';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await connection.execute(`
      INSERT IGNORE INTO admins (email, password, name, role, isActive)
      VALUES (?, ?, ?, ?, ?)
    `, [adminEmail, hashedPassword, 'Administrador Principal', 'super_admin', 1]);

    // Insertar configuraciones del sistema
    const settings = [
      ['wompi_public_key', 'pub_test_', 'Clave pública de Wompi'],
      ['wompi_private_key', 'prv_test_', 'Clave privada de Wompi'],
      ['wompi_environment', 'production', 'Ambiente de Wompi'],
      ['wompi_webhook_secret', 'webhook_secret_change_me', 'Secret del webhook de Wompi'],
      ['app_name', 'Café Colombia App', 'Nombre de la aplicación'],
      ['app_version', '1.0.0', 'Versión de la aplicación']
    ];

    for (const [key, value, description] of settings) {
      await connection.execute(`
        INSERT IGNORE INTO system_settings (setting_key, setting_value, description)
        VALUES (?, ?, ?)
      `, [key, value, description]);
    }

    console.log('✅ Administrador y configuraciones creados');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('⚠️  CAMBIAR LA CONTRASEÑA DESPUÉS DEL PRIMER LOGIN');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await connection.end();
  }
}

if (require.main === module) {
  require('dotenv').config();
  createAdmin().catch(console.error);
}
EOF

log "🗄️ Ejecutando migraciones..."
node scripts/migrate.js

log "👤 Creando usuario administrador..."
node scripts/create-admin.js

log "🌐 Configurando Nginx..."
sudo tee /etc/nginx/sites-available/cafecolombiaapp > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    root /home/$(whoami)/CAFECOLOMBIAAPP/dist;
    index index.html;
    
    # SSL será configurado por Certbot
    
    # Configuración de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    
    # Compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # SPA
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Uploads
    location /uploads {
        alias /home/$(whoami)/CAFECOLOMBIAAPP/uploads;
        expires 1d;
    }
    
    client_max_body_size 10M;
}
EOF

sudo ln -sf /etc/nginx/sites-available/cafecolombiaapp /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

log "🔒 Configurando SSL..."
sudo certbot --nginx --non-interactive --agree-tos --email $SSL_EMAIL -d $DOMAIN -d www.$DOMAIN

log "🔄 Configurando PM2..."
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'cafe-colombia-api',
      script: './api/dist/server.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/api-error.log',
      out_file: './logs/api-out.log',
      log_file: './logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
EOF

pm2 start ecosystem.config.js
pm2 save
pm2 startup | tail -1 | sudo bash

log "✅ Instalación completada!"
info "🌐 Aplicación disponible en: https://$DOMAIN"
info "🔧 Panel admin: https://$DOMAIN/admin"
info "📧 Email admin: admin@cafecolombiaapp.com"
info "🔑 Password admin: CafeAdmin2024!"
warning "⚠️  Recuerda cambiar la contraseña del administrador"
```

---

## ⚙️ Configuraciones de Producción

### nginx-optimization.conf
```nginx
# Configuración optimizada de Nginx para producción

# Configuración principal
user www-data;
worker_processes auto;
worker_rlimit_nofile 65535;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    # Configuración básica
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    # Límites
    client_max_body_size 10M;
    client_body_buffer_size 128k;
    client_header_buffer_size 1k;
    large_client_header_buffers 4 4k;
    
    # Timeouts
    client_body_timeout 12;
    client_header_timeout 12;
    send_timeout 10;
    
    # Compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;
    
    # Cache de archivos
    open_file_cache max=200000 inactive=20s;
    open_file_cache_valid 30s;
    open_file_cache_min_uses 2;
    open_file_cache_errors on;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    include /etc/nginx/sites-enabled/*;
}
```

### mysql-production.cnf
```ini
[mysqld]
# Configuración de rendimiento
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
max_connections = 200
query_cache_size = 64M
query_cache_type = 1
tmp_table_size = 64M
max_heap_table_size = 64M

# Configuración de seguridad
bind-address = 127.0.0.1
skip-networking = 0
local-infile = 0

# Configuración de logs
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Configuración de charset
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci
```

---

## 🛠️ Scripts de Mantenimiento

### maintenance.sh
```bash
#!/bin/bash

# Script de mantenimiento automático

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Función de backup
backup_database() {
    log "📊 Iniciando backup de base de datos..."
    BACKUP_DIR="/home/$(whoami)/backups"
    DATE=$(date +%Y%m%d_%H%M%S)
    
    mkdir -p $BACKUP_DIR
    
    mysqldump -u cafeapp -p$DB_PASSWORD cafe_colombia_app > $BACKUP_DIR/db_backup_$DATE.sql
    
    if [ $? -eq 0 ]; then
        log "✅ Backup de BD completado: db_backup_$DATE.sql"
        gzip $BACKUP_DIR/db_backup_$DATE.sql
    else
        log "❌ Error en backup de BD"
        return 1
    fi
}

# Función de limpieza de logs
cleanup_logs() {
    log "🧹 Limpiando logs antiguos..."
    
    # Limpiar logs de aplicación mayores a 30 días
    find /home/$(whoami)/CAFECOLOMBIAAPP/logs -name "*.log" -mtime +30 -delete
    
    # Limpiar backups mayores a 7 días
    find /home/$(whoami)/backups -name "*backup*" -mtime +7 -delete
    
    # Rotar logs de PM2
    pm2 flush
    
    log "✅ Limpieza de logs completada"
}

# Función de optimización de BD
optimize_database() {
    log "⚡ Optimizando base de datos..."
    
    mysql -u cafeapp -p$DB_PASSWORD cafe_colombia_app -e "
        OPTIMIZE TABLE admins;
        OPTIMIZE TABLE users;
        OPTIMIZE TABLE fincas;
        OPTIMIZE TABLE system_settings;
    "
    
    log "✅ Optimización de BD completada"
}

# Función de verificación de salud
health_check() {
    log "🔍 Verificando salud del sistema..."
    
    # Verificar servicios
    systemctl is-active --quiet nginx || log "⚠️ Nginx no está activo"
    systemctl is-active --quiet mysql || log "⚠️ MySQL no está activo"
    
    # Verificar PM2
    pm2 list | grep -q "cafe-colombia-api" || log "⚠️ API no está ejecutándose en PM2"
    
    # Verificar espacio en disco
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 80 ]; then
        log "⚠️ Uso de disco alto: ${DISK_USAGE}%"
    fi
    
    # Verificar memoria
    MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEM_USAGE -gt 80 ]; then
        log "⚠️ Uso de memoria alto: ${MEM_USAGE}%"
    fi
    
    log "✅ Verificación de salud completada"
}

# Función de actualización de certificados SSL
update_ssl() {
    log "🔒 Verificando certificados SSL..."
    
    certbot renew --quiet
    
    if [ $? -eq 0 ]; then
        log "✅ Certificados SSL actualizados"
        systemctl reload nginx
    else
        log "⚠️ No se requiere actualización de SSL"
    fi
}

# Ejecutar mantenimiento
case "$1" in
    "backup")
        backup_database
        ;;
    "cleanup")
        cleanup_logs
        ;;
    "optimize")
        optimize_database
        ;;
    "health")
        health_check
        ;;
    "ssl")
        update_ssl
        ;;
    "full")
        backup_database
        cleanup_logs
        optimize_database
        health_check
        update_ssl
        ;;
    *)
        echo "Uso: $0 {backup|cleanup|optimize|health|ssl|full}"
        exit 1
        ;;
esac
```

### update-app.sh
```bash
#!/bin/bash

# Script de actualización de la aplicación

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[ERROR] $1"
    exit 1
}

log "🔄 Iniciando actualización de la aplicación..."

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    error "No se encontró package.json. Ejecutar desde el directorio raíz del proyecto."
fi

# Backup antes de actualizar
log "💾 Creando backup antes de actualizar..."
./scripts/maintenance.sh backup

# Detener aplicación
log "⏹️ Deteniendo aplicación..."
pm2 stop cafe-colombia-api

# Actualizar código
log "📥 Actualizando código desde repositorio..."
git stash
git pull origin main

if [ $? -ne 0 ]; then
    error "Error al actualizar código desde repositorio"
fi

# Instalar dependencias
log "📦 Instalando dependencias..."
npm install

cd api
npm install
cd ..

# Compilar aplicación
log "🏗️ Compilando aplicación..."
npm run build

cd api
npm run build
cd ..

# Ejecutar migraciones
log "🗄️ Ejecutando migraciones..."
node scripts/migrate.js

# Reiniciar aplicación
log "🚀 Reiniciando aplicación..."
pm2 restart cafe-colombia-api

# Verificar que la aplicación esté funcionando
sleep 5
if pm2 list | grep -q "cafe-colombia-api.*online"; then
    log "✅ Aplicación actualizada y funcionando correctamente"
else
    error "❌ Error: La aplicación no está funcionando después de la actualización"
fi

log "🎉 Actualización completada exitosamente"
```

---

## 📊 Monitoreo Automatizado

### monitor-system.sh
```bash
#!/bin/bash

# Script de monitoreo del sistema

ALERT_EMAIL="admin@cafecolombiaapp.com"
LOG_FILE="/home/$(whoami)/logs/monitor.log"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a $LOG_FILE
}

alert() {
    log "🚨 ALERTA: $1"
    # Enviar email si está configurado
    # echo "$1" | mail -s "Alerta Café Colombia App" $ALERT_EMAIL
}

# Verificar servicios críticos
check_services() {
    log "🔍 Verificando servicios críticos..."
    
    # Nginx
    if ! systemctl is-active --quiet nginx; then
        alert "Nginx no está funcionando"
        systemctl restart nginx
    fi
    
    # MySQL
    if ! systemctl is-active --quiet mysql; then
        alert "MySQL no está funcionando"
        systemctl restart mysql
    fi
    
    # PM2 App
    if ! pm2 list | grep -q "cafe-colombia-api.*online"; then
        alert "La aplicación no está ejecutándose en PM2"
        pm2 restart cafe-colombia-api
    fi
}

# Verificar recursos del sistema
check_resources() {
    log "💾 Verificando recursos del sistema..."
    
    # Uso de disco
    DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ $DISK_USAGE -gt 85 ]; then
        alert "Uso de disco crítico: ${DISK_USAGE}%"
    elif [ $DISK_USAGE -gt 75 ]; then
        log "⚠️ Uso de disco alto: ${DISK_USAGE}%"
    fi
    
    # Uso de memoria
    MEM_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ $MEM_USAGE -gt 90 ]; then
        alert "Uso de memoria crítico: ${MEM_USAGE}%"
    elif [ $MEM_USAGE -gt 80 ]; then
        log "⚠️ Uso de memoria alto: ${MEM_USAGE}%"
    fi
    
    # Carga del sistema
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    LOAD_THRESHOLD=4.0
    if (( $(echo "$LOAD_AVG > $LOAD_THRESHOLD" | bc -l) )); then
        alert "Carga del sistema alta: $LOAD_AVG"
    fi
}

# Verificar conectividad de la aplicación
check_app_connectivity() {
    log "🌐 Verificando conectividad de la aplicación..."
    
    # Verificar API
    API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health)
    if [ "$API_STATUS" != "200" ]; then
        alert "API no responde correctamente (Status: $API_STATUS)"
    fi
    
    # Verificar frontend
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
    if [ "$FRONTEND_STATUS" != "200" ]; then
        alert "Frontend no responde correctamente (Status: $FRONTEND_STATUS)"
    fi
}

# Verificar logs de errores
check_error_logs() {
    log "📋 Verificando logs de errores..."
    
    # Verificar errores recientes en logs de la aplicación
    ERROR_COUNT=$(tail -n 100 /home/$(whoami)/CAFECOLOMBIAAPP/logs/api-error.log 2>/dev/null | grep -c "ERROR\|FATAL" || echo "0")
    if [ $ERROR_COUNT -gt 10 ]; then
        alert "Muchos errores en logs de aplicación: $ERROR_COUNT errores en las últimas 100 líneas"
    fi
    
    # Verificar errores de Nginx
    NGINX_ERRORS=$(tail -n 50 /var/log/nginx/error.log 2>/dev/null | grep -c "$(date +%Y/%m/%d)" || echo "0")
    if [ $NGINX_ERRORS -gt 5 ]; then
        alert "Errores en Nginx hoy: $NGINX_ERRORS"
    fi
}

# Generar reporte de estado
generate_status_report() {
    log "📊 Generando reporte de estado..."
    
    echo "=== REPORTE DE ESTADO - $(date) ===" > /tmp/status_report.txt
    echo "" >> /tmp/status_report.txt
    
    echo "SERVICIOS:" >> /tmp/status_report.txt
    echo "- Nginx: $(systemctl is-active nginx)" >> /tmp/status_report.txt
    echo "- MySQL: $(systemctl is-active mysql)" >> /tmp/status_report.txt
    echo "- PM2 Apps: $(pm2 list | grep -c online) activas" >> /tmp/status_report.txt
    echo "" >> /tmp/status_report.txt
    
    echo "RECURSOS:" >> /tmp/status_report.txt
    echo "- Uso de disco: $(df -h / | awk 'NR==2 {print $5}')" >> /tmp/status_report.txt
    echo "- Uso de memoria: $(free -h | awk 'NR==2{printf "%.1f%%", $3*100/$2}')" >> /tmp/status_report.txt
    echo "- Carga del sistema: $(uptime | awk -F'load average:' '{print $2}')" >> /tmp/status_report.txt
    echo "" >> /tmp/status_report.txt
    
    echo "CONECTIVIDAD:" >> /tmp/status_report.txt
    echo "- API Status: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health 2>/dev/null || echo "ERROR")" >> /tmp/status_report.txt
    echo "- Frontend Status: $(curl -s -o /dev/null -w "%{http_code}" http://localhost/ 2>/dev/null || echo "ERROR")" >> /tmp/status_report.txt
    
    cat /tmp/status_report.txt >> $LOG_FILE
}

# Ejecutar todas las verificaciones
main() {
    log "🚀 Iniciando monitoreo del sistema..."
    
    check_services
    check_resources
    check_app_connectivity
    check_error_logs
    
    if [ "$1" = "report" ]; then
        generate_status_report
    fi
    
    log "✅ Monitoreo completado"
}

# Ejecutar script
main "$@"
```

---

## 🔒 Scripts de Seguridad

### security-hardening.sh
```bash
#!/bin/bash

# Script de endurecimiento de seguridad

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log "🔒 Iniciando endurecimiento de seguridad..."

# Configurar fail2ban
log "🛡️ Configurando fail2ban..."
sudo apt install -y fail2ban

sudo tee /etc/fail2ban/jail.local > /dev/null << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 10
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# Configurar límites de rate en Nginx
log "⚡ Configurando rate limiting en Nginx..."
sudo tee /etc/nginx/conf.d/rate-limit.conf > /dev/null << 'EOF'
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

# Connection limiting
limit_conn_zone $binary_remote_addr zone=conn_limit_per_ip:10m;
limit_conn conn_limit_per_ip 20;
EOF

# Configurar headers de seguridad
log "🔐 Configurando headers de seguridad..."
sudo tee /etc/nginx/conf.d/security-headers.conf > /dev/null << 'EOF'
# Security headers
add_header X-Frame-Options DENY always;
add_header X-Content-Type-Options nosniff always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none';" always;
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;

# Hide server information
server_tokens off;
EOF

sudo nginx -t && sudo systemctl reload nginx

# Configurar logrotate para logs de seguridad
log "📋 Configurando rotación de logs..."
sudo tee /etc/logrotate.d/cafecolombiaapp-security > /dev/null << 'EOF'
/home/*/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 cafeapp cafeapp
    postrotate
        pm2 reloadLogs > /dev/null 2>&1 || true
    endscript
}

/var/log/nginx/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data adm
    postrotate
        systemctl reload nginx > /dev/null 2>&1 || true
    endscript
}
EOF

# Configurar actualizaciones automáticas de seguridad
log "🔄 Configurando actualizaciones automáticas..."
sudo apt install -y unattended-upgrades

sudo tee /etc/apt/apt.conf.d/50unattended-upgrades > /dev/null << 'EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};

Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
EOF

sudo systemctl enable unattended-upgrades

log "✅ Endurecimiento de seguridad completado"
```

### backup-security.sh
```bash
#!/bin/bash

# Script de backup con cifrado

BACKUP_DIR="/home/$(whoami)/backups"
ENCRYPTION_KEY="your-encryption-key-here"  # Cambiar por una clave segura

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Backup cifrado de base de datos
backup_database_encrypted() {
    log "🔐 Creando backup cifrado de base de datos..."
    
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/db_backup_encrypted_$DATE.sql.gpg"
    
    mysqldump -u cafeapp -p$DB_PASSWORD cafe_colombia_app | \
    gpg --symmetric --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
        --s2k-digest-algo SHA512 --s2k-count 65536 --force-mdc \
        --passphrase "$ENCRYPTION_KEY" --batch --quiet > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "✅ Backup cifrado completado: $(basename $BACKUP_FILE)"
    else
        log "❌ Error en backup cifrado"
        return 1
    fi
}

# Backup de archivos de configuración
backup_config_encrypted() {
    log "📁 Creando backup cifrado de configuración..."
    
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/config_backup_encrypted_$DATE.tar.gz.gpg"
    
    tar -czf - .env api/.env ecosystem.config.js | \
    gpg --symmetric --cipher-algo AES256 --compress-algo 1 --s2k-mode 3 \
        --s2k-digest-algo SHA512 --s2k-count 65536 --force-mdc \
        --passphrase "$ENCRYPTION_KEY" --batch --quiet > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        log "✅ Backup de configuración cifrado completado: $(basename $BACKUP_FILE)"
    else
        log "❌ Error en backup de configuración cifrado"
        return 1
    fi
}

# Ejecutar backups
mkdir -p "$BACKUP_DIR"
backup_database_encrypted
backup_config_encrypted

# Limpiar backups antiguos (mantener últimos 14 días)
find "$BACKUP_DIR" -name "*encrypted*" -mtime +14 -delete

log "🎉 Proceso de backup seguro completado"
```

---

## 📋 Crontab de Automatización

### Configuración de Cron Jobs
```bash
# Editar crontab
crontab -e

# Agregar las siguientes líneas:

# Monitoreo cada 5 minutos
*/5 * * * * /home/cafeapp/CAFECOLOMBIAAPP/scripts/monitor-system.sh >> /home/cafeapp/logs/monitor.log 2>&1

# Backup diario a las 2:00 AM
0 2 * * * /home/cafeapp/CAFECOLOMBIAAPP/scripts/maintenance.sh backup >> /home/cafeapp/logs/maintenance.log 2>&1

# Backup cifrado semanal los domingos a las 3:00 AM
0 3 * * 0 /home/cafeapp/CAFECOLOMBIAAPP/scripts/backup-security.sh >> /home/cafeapp/logs/backup-security.log 2>&1

# Limpieza semanal los lunes a las 1:00 AM
0 1 * * 1 /home/cafeapp/CAFECOLOMBIAAPP/scripts/maintenance.sh cleanup >> /home/cafeapp/logs/maintenance.log 2>&1

# Optimización de BD mensual el primer día del mes a las 4:00 AM
0 4 1 * * /home/cafeapp/CAFECOLOMBIAAPP/scripts/maintenance.sh optimize >> /home/cafeapp/logs/maintenance.log 2>&1

# Reporte de estado diario a las 8:00 AM
0 8 * * * /home/cafeapp/CAFECOLOMBIAAPP/scripts/monitor-system.sh report >> /home/cafeapp/logs/daily-report.log 2>&1

# Renovación de SSL mensual
0 5 1 * * /home/cafeapp/CAFECOLOMBIAAPP/scripts/maintenance.sh ssl >> /home/cafeapp/logs/ssl.log 2>&1
```

---

*Estos scripts proporcionan una automatización completa para el despliegue, mantenimiento y monitoreo de la aplicación Café Colombia App en producción.*
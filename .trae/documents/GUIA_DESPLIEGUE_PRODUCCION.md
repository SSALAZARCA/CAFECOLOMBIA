# 🚀 Guía de Despliegue en Producción - Café Colombia App

## 📋 Tabla de Contenidos
1. [Requisitos del Servidor](#requisitos-del-servidor)
2. [Configuración Inicial del Servidor](#configuración-inicial-del-servidor)
3. [Instalación de Dependencias](#instalación-de-dependencias)
4. [Configuración de Base de Datos](#configuración-de-base-de-datos)
5. [Clonado y Configuración del Proyecto](#clonado-y-configuración-del-proyecto)
6. [Variables de Entorno](#variables-de-entorno)
7. [Build y Configuración del Frontend](#build-y-configuración-del-frontend)
8. [Configuración del Backend](#configuración-del-backend)
9. [Configuración de Nginx](#configuración-de-nginx)
10. [Configuración de SSL/HTTPS](#configuración-de-sslhttps)
11. [Configuración de PM2](#configuración-de-pm2)
12. [Scripts de Migración y Setup](#scripts-de-migración-y-setup)
13. [Monitoreo y Logs](#monitoreo-y-logs)
14. [Backup y Mantenimiento](#backup-y-mantenimiento)
15. [Verificación Final](#verificación-final)

---

## 🖥️ Requisitos del Servidor

### Especificaciones Mínimas
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Almacenamiento**: 50GB SSD
- **OS**: Ubuntu 20.04 LTS o superior
- **Ancho de banda**: 100 Mbps

### Especificaciones Recomendadas
- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Almacenamiento**: 100GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Ancho de banda**: 1 Gbps

---

## ⚙️ Configuración Inicial del Servidor

### 1. Actualizar el Sistema
```bash
sudo apt update && sudo apt upgrade -y
```

### 2. Configurar Firewall
```bash
sudo ufw enable
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 3001  # Puerto del backend (temporal)
```

### 3. Crear Usuario para la Aplicación
```bash
sudo adduser cafeapp
sudo usermod -aG sudo cafeapp
sudo su - cafeapp
```

---

## 📦 Instalación de Dependencias

### 1. Instalar Node.js (v18 LTS)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### 2. Instalar MySQL Server
```bash
sudo apt install mysql-server -y
sudo mysql_secure_installation
```

### 3. Instalar Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 4. Instalar PM2 Globalmente
```bash
sudo npm install -g pm2
```

### 5. Instalar Git
```bash
sudo apt install git -y
```

### 6. Instalar Certbot para SSL
```bash
sudo apt install certbot python3-certbot-nginx -y
```

---

## 🗄️ Configuración de Base de Datos

### 1. Configurar MySQL
```bash
sudo mysql -u root -p
```

```sql
-- Crear base de datos
CREATE DATABASE cafe_colombia_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Crear usuario para la aplicación
CREATE USER 'cafeapp'@'localhost' IDENTIFIED BY 'TU_PASSWORD_SEGURO_AQUI';

-- Otorgar permisos
GRANT ALL PRIVILEGES ON cafe_colombia_app.* TO 'cafeapp'@'localhost';
FLUSH PRIVILEGES;

-- Verificar
SHOW DATABASES;
SELECT User, Host FROM mysql.user WHERE User = 'cafeapp';

EXIT;
```

### 2. Configurar MySQL para Producción
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Agregar/modificar:
```ini
[mysqld]
# Configuración de rendimiento
innodb_buffer_pool_size = 2G
innodb_log_file_size = 256M
max_connections = 200
query_cache_size = 64M

# Configuración de seguridad
bind-address = 127.0.0.1
skip-networking = 0
```

```bash
sudo systemctl restart mysql
```

---

## 📁 Clonado y Configuración del Proyecto

### 1. Clonar el Repositorio
```bash
cd /home/cafeapp
git clone git@github.com:SSALAZARCA/CAFECOLOMBIAAPP.git
cd CAFECOLOMBIAAPP
```

### 2. Configurar SSH Key (si es necesario)
```bash
ssh-keygen -t rsa -b 4096 -C "tu-email@ejemplo.com"
cat ~/.ssh/id_rsa.pub
# Agregar la clave pública a GitHub
```

---

## 🔐 Variables de Entorno

### 1. Archivo .env Principal (Raíz del proyecto)
```bash
nano .env
```

```env
# Entorno
NODE_ENV=production

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cafe_colombia_app
DB_USER=cafeapp
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI

# JWT
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_min_32_caracteres
JWT_EXPIRES_IN=7d

# API URLs
VITE_API_URL=https://tu-dominio.com/api
VITE_APP_URL=https://tu-dominio.com

# Configuración del servidor
PORT=3001
HOST=0.0.0.0

# Configuración de CORS
CORS_ORIGIN=https://tu-dominio.com

# Configuración de archivos
UPLOAD_DIR=/home/cafeapp/CAFECOLOMBIAAPP/uploads
MAX_FILE_SIZE=10485760

# Configuración de email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password

# Configuración de Wompi (Pagos)
WOMPI_PUBLIC_KEY=pub_test_tu_clave_publica
WOMPI_PRIVATE_KEY=prv_test_tu_clave_privada
WOMPI_ENVIRONMENT=production
WOMPI_WEBHOOK_SECRET=tu_webhook_secret

# Configuración de IA (opcional)
OPENAI_API_KEY=tu_openai_api_key
```

### 2. Archivo .env para el Backend
```bash
nano api/.env
```

```env
# Heredar configuración principal
NODE_ENV=production
DB_HOST=localhost
DB_PORT=3306
DB_NAME=cafe_colombia_app
DB_USER=cafeapp
DB_PASSWORD=TU_PASSWORD_SEGURO_AQUI
JWT_SECRET=tu_jwt_secret_muy_seguro_aqui_min_32_caracteres
JWT_EXPIRES_IN=7d
PORT=3001
HOST=0.0.0.0
CORS_ORIGIN=https://tu-dominio.com
```

---

## 🎨 Build y Configuración del Frontend

### 1. Instalar Dependencias del Frontend
```bash
npm install
```

### 2. Build del Frontend para Producción
```bash
npm run build
```

### 3. Verificar Build
```bash
ls -la dist/
```

---

## ⚙️ Configuración del Backend

### 1. Instalar Dependencias del Backend
```bash
cd api
npm install
```

### 2. Compilar TypeScript
```bash
npm run build
```

### 3. Crear Directorio de Uploads
```bash
mkdir -p /home/cafeapp/CAFECOLOMBIAAPP/uploads
chmod 755 /home/cafeapp/CAFECOLOMBIAAPP/uploads
```

---

## 🌐 Configuración de Nginx

### 1. Crear Configuración del Sitio
```bash
sudo nano /etc/nginx/sites-available/cafecolombiaapp
```

```nginx
server {
    listen 80;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Redirigir HTTP a HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name tu-dominio.com www.tu-dominio.com;
    
    # Configuración SSL (se configurará con Certbot)
    ssl_certificate /etc/letsencrypt/live/tu-dominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/tu-dominio.com/privkey.pem;
    
    # Configuración de seguridad SSL
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Headers de seguridad
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Configuración de archivos estáticos
    root /home/cafeapp/CAFECOLOMBIAAPP/dist;
    index index.html;
    
    # Configuración de compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Configuración de caché para archivos estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Proxy para API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Configuración para SPA (Single Page Application)
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Configuración para archivos de upload
    location /uploads {
        alias /home/cafeapp/CAFECOLOMBIAAPP/uploads;
        expires 1d;
        add_header Cache-Control "public";
    }
    
    # Configuración de límites
    client_max_body_size 10M;
}
```

### 2. Habilitar el Sitio
```bash
sudo ln -s /etc/nginx/sites-available/cafecolombiaapp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Configuración de SSL/HTTPS

### 1. Obtener Certificado SSL con Let's Encrypt
```bash
sudo certbot --nginx -d tu-dominio.com -d www.tu-dominio.com
```

### 2. Configurar Renovación Automática
```bash
sudo crontab -e
```

Agregar:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔄 Configuración de PM2

### 1. Crear Archivo de Configuración PM2
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'cafe-colombia-api',
      script: './api/dist/server.js',
      cwd: '/home/cafeapp/CAFECOLOMBIAAPP',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: '/home/cafeapp/logs/api-error.log',
      out_file: '/home/cafeapp/logs/api-out.log',
      log_file: '/home/cafeapp/logs/api-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads'],
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
```

### 2. Crear Directorio de Logs
```bash
mkdir -p /home/cafeapp/logs
```

### 3. Iniciar la Aplicación con PM2
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

---

## 🗃️ Scripts de Migración y Setup

### 1. Script de Migración de Base de Datos
```bash
nano scripts/migrate-production.js
```

```javascript
const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');

async function runMigrations() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'cafeapp',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'cafe_colombia_app',
    multipleStatements: true
  });

  try {
    console.log('🔄 Ejecutando migraciones...');
    
    // Leer y ejecutar migraciones
    const migrationFiles = await fs.readdir('./api/migrations');
    
    for (const file of migrationFiles.sort()) {
      if (file.endsWith('.sql')) {
        console.log(`📄 Ejecutando migración: ${file}`);
        const migration = await fs.readFile(path.join('./api/migrations', file), 'utf8');
        await connection.execute(migration);
        console.log(`✅ Migración completada: ${file}`);
      }
    }
    
    console.log('🎉 Todas las migraciones completadas exitosamente');
  } catch (error) {
    console.error('❌ Error en migraciones:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

runMigrations().catch(console.error);
```

### 2. Script de Setup Inicial
```bash
nano scripts/setup-production.sh
```

```bash
#!/bin/bash

echo "🚀 Iniciando setup de producción..."

# Cargar variables de entorno
source .env

# Ejecutar migraciones
echo "📊 Ejecutando migraciones de base de datos..."
node scripts/migrate-production.js

# Crear configuraciones del sistema
echo "⚙️ Creando configuraciones del sistema..."
node api/scripts/createSystemSettings.cjs

# Crear usuario administrador por defecto
echo "👤 Creando usuario administrador..."
node scripts/create-admin.js

# Configurar permisos
echo "🔐 Configurando permisos..."
chmod +x scripts/*.sh
chmod 755 uploads/

echo "✅ Setup de producción completado"
```

### 3. Script de Creación de Admin
```bash
nano scripts/create-admin.js
```

```javascript
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function createAdmin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'cafeapp',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'cafe_colombia_app'
  });

  try {
    const adminEmail = 'admin@cafecolombiaapp.com';
    const adminPassword = 'CafeAdmin2024!'; // Cambiar después del primer login
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    await connection.execute(`
      INSERT IGNORE INTO admins (email, password, name, role, isActive, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, NOW(), NOW())
    `, [adminEmail, hashedPassword, 'Administrador Principal', 'super_admin', 1]);

    console.log('✅ Usuario administrador creado:');
    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña después del primer login');
  } catch (error) {
    console.error('❌ Error creando administrador:', error);
  } finally {
    await connection.end();
  }
}

createAdmin();
```

### 4. Hacer Scripts Ejecutables
```bash
chmod +x scripts/setup-production.sh
```

---

## 📊 Monitoreo y Logs

### 1. Configurar Logrotate
```bash
sudo nano /etc/logrotate.d/cafecolombiaapp
```

```
/home/cafeapp/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 cafeapp cafeapp
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 2. Script de Monitoreo
```bash
nano scripts/monitor.sh
```

```bash
#!/bin/bash

# Verificar estado de servicios
echo "🔍 Estado de servicios:"
echo "Nginx: $(systemctl is-active nginx)"
echo "MySQL: $(systemctl is-active mysql)"
echo "PM2: $(pm2 jlist | jq length) procesos activos"

# Verificar uso de recursos
echo -e "\n💾 Uso de recursos:"
echo "RAM: $(free -h | awk '/^Mem:/ {print $3 "/" $2}')"
echo "Disco: $(df -h / | awk 'NR==2 {print $3 "/" $2 " (" $5 ")"}')"
echo "CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)%"

# Verificar logs recientes
echo -e "\n📋 Logs recientes (últimas 5 líneas):"
tail -n 5 /home/cafeapp/logs/api-error.log 2>/dev/null || echo "No hay errores recientes"
```

### 3. Configurar Cron para Monitoreo
```bash
crontab -e
```

```bash
# Monitoreo cada 5 minutos
*/5 * * * * /home/cafeapp/CAFECOLOMBIAAPP/scripts/monitor.sh >> /home/cafeapp/logs/monitor.log 2>&1

# Backup diario a las 2 AM
0 2 * * * /home/cafeapp/CAFECOLOMBIAAPP/scripts/backup.sh

# Limpiar logs antiguos semanalmente
0 3 * * 0 find /home/cafeapp/logs -name "*.log" -mtime +30 -delete
```

---

## 💾 Backup y Mantenimiento

### 1. Script de Backup
```bash
nano scripts/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/home/cafeapp/backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="cafe_colombia_app"

# Crear directorio de backup
mkdir -p $BACKUP_DIR

# Backup de base de datos
echo "📊 Creando backup de base de datos..."
mysqldump -u cafeapp -p$DB_PASSWORD $DB_NAME > $BACKUP_DIR/db_backup_$DATE.sql

# Backup de archivos de configuración
echo "📁 Creando backup de configuración..."
tar -czf $BACKUP_DIR/config_backup_$DATE.tar.gz .env api/.env ecosystem.config.js

# Backup de uploads
echo "📸 Creando backup de archivos..."
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz uploads/

# Limpiar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "*backup*" -mtime +7 -delete

echo "✅ Backup completado: $BACKUP_DIR"
```

### 2. Script de Actualización
```bash
nano scripts/update.sh
```

```bash
#!/bin/bash

echo "🔄 Iniciando actualización..."

# Backup antes de actualizar
./scripts/backup.sh

# Detener aplicación
pm2 stop cafe-colombia-api

# Actualizar código
git pull origin main

# Instalar dependencias
npm install
cd api && npm install && cd ..

# Rebuild
npm run build
cd api && npm run build && cd ..

# Ejecutar migraciones
node scripts/migrate-production.js

# Reiniciar aplicación
pm2 restart cafe-colombia-api

echo "✅ Actualización completada"
```

---

## ✅ Verificación Final

### 1. Script de Verificación Completa
```bash
nano scripts/verify-deployment.sh
```

```bash
#!/bin/bash

echo "🔍 Verificando despliegue..."

# Verificar servicios
echo "1. Verificando servicios del sistema:"
systemctl is-active --quiet nginx && echo "✅ Nginx activo" || echo "❌ Nginx inactivo"
systemctl is-active --quiet mysql && echo "✅ MySQL activo" || echo "❌ MySQL inactivo"

# Verificar PM2
echo -e "\n2. Verificando PM2:"
pm2 list | grep -q "cafe-colombia-api" && echo "✅ API activa en PM2" || echo "❌ API no encontrada en PM2"

# Verificar conectividad de base de datos
echo -e "\n3. Verificando base de datos:"
mysql -u cafeapp -p$DB_PASSWORD -e "SELECT 1" cafe_colombia_app &>/dev/null && echo "✅ Conexión a BD exitosa" || echo "❌ Error de conexión a BD"

# Verificar endpoints
echo -e "\n4. Verificando endpoints:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health | grep -q "200" && echo "✅ API respondiendo" || echo "❌ API no responde"

# Verificar archivos estáticos
echo -e "\n5. Verificando frontend:"
[ -f "dist/index.html" ] && echo "✅ Frontend compilado" || echo "❌ Frontend no compilado"

# Verificar SSL
echo -e "\n6. Verificando SSL:"
curl -s -I https://tu-dominio.com | grep -q "200 OK" && echo "✅ HTTPS funcionando" || echo "❌ HTTPS no configurado"

echo -e "\n🎉 Verificación completada"
```

### 2. Checklist Final

```bash
# Ejecutar todos los pasos de verificación
chmod +x scripts/verify-deployment.sh
./scripts/verify-deployment.sh
```

**Checklist de Verificación:**

- [ ] ✅ Servidor configurado y actualizado
- [ ] ✅ Node.js, MySQL, Nginx instalados
- [ ] ✅ Base de datos creada y configurada
- [ ] ✅ Repositorio clonado y configurado
- [ ] ✅ Variables de entorno configuradas
- [ ] ✅ Frontend compilado (npm run build)
- [ ] ✅ Backend compilado (npm run build en /api)
- [ ] ✅ Nginx configurado y funcionando
- [ ] ✅ SSL/HTTPS configurado
- [ ] ✅ PM2 configurado y aplicación ejecutándose
- [ ] ✅ Migraciones de BD ejecutadas
- [ ] ✅ Configuraciones del sistema creadas
- [ ] ✅ Usuario administrador creado
- [ ] ✅ Monitoreo y logs configurados
- [ ] ✅ Scripts de backup configurados
- [ ] ✅ Firewall configurado
- [ ] ✅ Dominio apuntando al servidor
- [ ] ✅ Aplicación accesible desde internet

---

## 🚀 Comandos de Despliegue Rápido

### Despliegue Completo (Primera vez)
```bash
# 1. Clonar repositorio
git clone git@github.com:SSALAZARCA/CAFECOLOMBIAAPP.git
cd CAFECOLOMBIAAPP

# 2. Configurar variables de entorno
cp .env.example .env
nano .env  # Editar con valores de producción

# 3. Ejecutar setup
./scripts/setup-production.sh

# 4. Compilar aplicación
npm install && npm run build
cd api && npm install && npm run build && cd ..

# 5. Iniciar con PM2
pm2 start ecosystem.config.js
pm2 save

# 6. Verificar despliegue
./scripts/verify-deployment.sh
```

### Actualización (Despliegues posteriores)
```bash
./scripts/update.sh
```

---

## 📞 Información de Contacto y Soporte

### Credenciales por Defecto
- **Admin Email**: admin@cafecolombiaapp.com
- **Admin Password**: CafeAdmin2024! (cambiar después del primer login)

### URLs Importantes
- **Frontend**: https://tu-dominio.com
- **Admin Panel**: https://tu-dominio.com/admin
- **API**: https://tu-dominio.com/api

### Logs Importantes
- **API Logs**: `/home/cafeapp/logs/api-*.log`
- **Nginx Logs**: `/var/log/nginx/`
- **MySQL Logs**: `/var/log/mysql/`
- **PM2 Logs**: `pm2 logs`

---

## ⚠️ Notas Importantes

1. **Cambiar todas las contraseñas por defecto** antes de poner en producción
2. **Configurar el dominio** en todas las variables de entorno
3. **Verificar que el firewall** esté correctamente configurado
4. **Monitorear los logs** regularmente
5. **Realizar backups** antes de cualquier actualización
6. **Mantener el sistema actualizado** con parches de seguridad

---

*Esta guía asegura un despliegue completo y seguro de la aplicación Café Colombia App en producción.*
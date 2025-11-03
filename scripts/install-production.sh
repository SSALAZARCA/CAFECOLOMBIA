#!/bin/bash

# 🚀 SCRIPT DE INSTALACIÓN AUTOMÁTICA - CAFÉ COLOMBIA APP
# Este script automatiza la instalación completa en producción

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
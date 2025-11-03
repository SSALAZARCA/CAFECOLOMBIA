# 🐳 Despliegue con Docker - Café Colombia App

## 📋 Contenido
1. [Configuración Docker](#configuración-docker)
2. [Docker Compose para Producción](#docker-compose-para-producción)
3. [Configuraciones de Servicios](#configuraciones-de-servicios)
4. [Scripts de Despliegue Docker](#scripts-de-despliegue-docker)
5. [Monitoreo con Docker](#monitoreo-con-docker)
6. [Backup y Restauración](#backup-y-restauración)

---

## 🐳 Configuración Docker

### Dockerfile para Frontend
```dockerfile
# Dockerfile.frontend
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar archivos de dependencias
COPY package*.json ./
RUN npm ci --only=production

# Copiar código fuente
COPY . .

# Variables de entorno para build
ARG VITE_API_URL
ARG VITE_APP_URL
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_URL=$VITE_APP_URL

# Build de la aplicación
RUN npm run build

# Imagen de producción con Nginx
FROM nginx:alpine

# Copiar configuración de Nginx
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/default.conf /etc/nginx/conf.d/default.conf

# Copiar archivos compilados
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 80

# Comando de inicio
CMD ["nginx", "-g", "daemon off;"]
```

### Dockerfile para Backend
```dockerfile
# Dockerfile.backend
FROM node:18-alpine

WORKDIR /app

# Instalar dependencias del sistema
RUN apk add --no-cache \
    mysql-client \
    curl \
    bash

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodeuser -u 1001

# Copiar archivos de dependencias
COPY api/package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código fuente
COPY api/ .

# Compilar TypeScript
RUN npm run build

# Crear directorio de uploads
RUN mkdir -p uploads && chown -R nodeuser:nodejs uploads

# Cambiar a usuario no-root
USER nodeuser

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

# Comando de inicio
CMD ["node", "dist/server.js"]
```

### Dockerfile para Base de Datos (MySQL personalizado)
```dockerfile
# Dockerfile.mysql
FROM mysql:8.0

# Copiar scripts de inicialización
COPY docker/mysql/init/ /docker-entrypoint-initdb.d/

# Copiar configuración personalizada
COPY docker/mysql/my.cnf /etc/mysql/conf.d/

# Variables de entorno
ENV MYSQL_ROOT_PASSWORD=rootpassword
ENV MYSQL_DATABASE=cafe_colombia_app
ENV MYSQL_USER=cafeapp
ENV MYSQL_PASSWORD=cafeapppassword

# Exponer puerto
EXPOSE 3306
```

---

## 🚀 Docker Compose para Producción

### docker-compose.prod.yml
```yaml
version: '3.8'

services:
  # Base de datos MySQL
  mysql:
    build:
      context: .
      dockerfile: Dockerfile.mysql
    container_name: cafe-mysql
    restart: unless-stopped
    environment:
      MYSQL_ROOT_PASSWORD: ${MYSQL_ROOT_PASSWORD}
      MYSQL_DATABASE: ${MYSQL_DATABASE}
      MYSQL_USER: ${MYSQL_USER}
      MYSQL_PASSWORD: ${MYSQL_PASSWORD}
    volumes:
      - mysql_data:/var/lib/mysql
      - ./docker/mysql/logs:/var/log/mysql
      - ./backups:/backups
    networks:
      - cafe-network
    ports:
      - "3306:3306"
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      timeout: 20s
      retries: 10

  # Backend API
  api:
    build:
      context: .
      dockerfile: Dockerfile.backend
    container_name: cafe-api
    restart: unless-stopped
    environment:
      NODE_ENV: production
      DB_HOST: mysql
      DB_PORT: 3306
      DB_NAME: ${MYSQL_DATABASE}
      DB_USER: ${MYSQL_USER}
      DB_PASSWORD: ${MYSQL_PASSWORD}
      JWT_SECRET: ${JWT_SECRET}
      JWT_EXPIRES_IN: 7d
      PORT: 3001
      HOST: 0.0.0.0
      CORS_ORIGIN: ${CORS_ORIGIN}
      UPLOAD_DIR: /app/uploads
      MAX_FILE_SIZE: 10485760
      WOMPI_PUBLIC_KEY: ${WOMPI_PUBLIC_KEY}
      WOMPI_PRIVATE_KEY: ${WOMPI_PRIVATE_KEY}
      WOMPI_ENVIRONMENT: ${WOMPI_ENVIRONMENT}
      WOMPI_WEBHOOK_SECRET: ${WOMPI_WEBHOOK_SECRET}
    volumes:
      - uploads_data:/app/uploads
      - ./logs:/app/logs
    networks:
      - cafe-network
    ports:
      - "3001:3001"
    depends_on:
      mysql:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend Nginx
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        VITE_API_URL: ${VITE_API_URL}
        VITE_APP_URL: ${VITE_APP_URL}
    container_name: cafe-frontend
    restart: unless-stopped
    volumes:
      - ./docker/nginx/logs:/var/log/nginx
    networks:
      - cafe-network
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - api
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Redis para caché (opcional)
  redis:
    image: redis:7-alpine
    container_name: cafe-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    networks:
      - cafe-network
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Proxy Manager (para SSL automático)
  nginx-proxy:
    image: jc21/nginx-proxy-manager:latest
    container_name: cafe-proxy
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "81:81"  # Admin interface
    volumes:
      - proxy_data:/data
      - proxy_letsencrypt:/etc/letsencrypt
    networks:
      - cafe-network
    environment:
      DB_MYSQL_HOST: mysql
      DB_MYSQL_PORT: 3306
      DB_MYSQL_USER: ${MYSQL_USER}
      DB_MYSQL_PASSWORD: ${MYSQL_PASSWORD}
      DB_MYSQL_NAME: nginx_proxy_manager

  # Monitoring con Portainer
  portainer:
    image: portainer/portainer-ce:latest
    container_name: cafe-portainer
    restart: unless-stopped
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    networks:
      - cafe-network

volumes:
  mysql_data:
    driver: local
  uploads_data:
    driver: local
  redis_data:
    driver: local
  proxy_data:
    driver: local
  proxy_letsencrypt:
    driver: local
  portainer_data:
    driver: local

networks:
  cafe-network:
    driver: bridge
```

### .env.docker
```env
# Configuración para Docker Compose

# Base de datos
MYSQL_ROOT_PASSWORD=super_secure_root_password_2024
MYSQL_DATABASE=cafe_colombia_app
MYSQL_USER=cafeapp
MYSQL_PASSWORD=secure_cafeapp_password_2024

# JWT
JWT_SECRET=super_secure_jwt_secret_for_production_min_32_chars

# URLs de la aplicación
VITE_API_URL=https://api.tudominio.com
VITE_APP_URL=https://tudominio.com
CORS_ORIGIN=https://tudominio.com

# Wompi (Pagos)
WOMPI_PUBLIC_KEY=pub_prod_tu_clave_publica
WOMPI_PRIVATE_KEY=prv_prod_tu_clave_privada
WOMPI_ENVIRONMENT=production
WOMPI_WEBHOOK_SECRET=tu_webhook_secret_seguro

# Redis
REDIS_PASSWORD=secure_redis_password_2024

# Configuración de email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
```

---

## ⚙️ Configuraciones de Servicios

### docker/nginx/default.conf
```nginx
# Configuración de Nginx para el frontend
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Configuración de compresión
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json
        image/svg+xml;

    # Headers de seguridad
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Archivos estáticos con caché
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # Proxy para API
    location /api {
        proxy_pass http://cafe-api:3001;
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

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### docker/mysql/my.cnf
```ini
[mysqld]
# Configuración de rendimiento
innodb_buffer_pool_size = 1G
innodb_log_file_size = 128M
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
max_connections = 100
query_cache_size = 32M
query_cache_type = 1
tmp_table_size = 32M
max_heap_table_size = 32M

# Configuración de seguridad
bind-address = 0.0.0.0
local-infile = 0

# Configuración de logs
log_error = /var/log/mysql/error.log
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2

# Configuración de charset
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Configuración de binlog para replicación
server-id = 1
log-bin = mysql-bin
binlog_format = ROW
expire_logs_days = 7
```

### docker/mysql/init/01-init.sql
```sql
-- Script de inicialización de la base de datos

-- Crear tablas principales
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

CREATE TABLE IF NOT EXISTS system_settings (
    id INT PRIMARY KEY AUTO_INCREMENT,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

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
    INDEX idx_user_id (user_id)
);

-- Insertar configuraciones por defecto
INSERT IGNORE INTO system_settings (setting_key, setting_value, description) VALUES
('wompi_public_key', 'pub_test_', 'Clave pública de Wompi'),
('wompi_private_key', 'prv_test_', 'Clave privada de Wompi'),
('wompi_environment', 'production', 'Ambiente de Wompi'),
('wompi_webhook_secret', 'webhook_secret_change_me', 'Secret del webhook de Wompi'),
('app_name', 'Café Colombia App', 'Nombre de la aplicación'),
('app_version', '1.0.0', 'Versión de la aplicación'),
('maintenance_mode', 'false', 'Modo de mantenimiento'),
('max_upload_size', '10485760', 'Tamaño máximo de archivo en bytes');

-- Crear usuario administrador por defecto
-- Password: CafeAdmin2024! (hash bcrypt)
INSERT IGNORE INTO admins (email, password, name, role, isActive) VALUES
('admin@cafecolombiaapp.com', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uO8O', 'Administrador Principal', 'super_admin', 1);
```

---

## 🚀 Scripts de Despliegue Docker

### deploy-docker.sh
```bash
#!/bin/bash

# Script de despliegue con Docker

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Verificar dependencias
check_dependencies() {
    log "🔍 Verificando dependencias..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker no está instalado"
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose no está instalado"
    fi
    
    log "✅ Dependencias verificadas"
}

# Configurar variables de entorno
setup_environment() {
    log "⚙️ Configurando variables de entorno..."
    
    if [ ! -f ".env.docker" ]; then
        warning "Archivo .env.docker no encontrado, creando desde plantilla..."
        cp .env.docker.example .env.docker
        error "Por favor, edita .env.docker con tus configuraciones y ejecuta el script nuevamente"
    fi
    
    # Cargar variables de entorno
    export $(cat .env.docker | grep -v '^#' | xargs)
    
    log "✅ Variables de entorno configuradas"
}

# Crear directorios necesarios
create_directories() {
    log "📁 Creando directorios necesarios..."
    
    mkdir -p logs
    mkdir -p backups
    mkdir -p docker/nginx/logs
    mkdir -p docker/mysql/logs
    
    log "✅ Directorios creados"
}

# Construir imágenes
build_images() {
    log "🏗️ Construyendo imágenes Docker..."
    
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    log "✅ Imágenes construidas"
}

# Iniciar servicios
start_services() {
    log "🚀 Iniciando servicios..."
    
    # Iniciar base de datos primero
    docker-compose -f docker-compose.prod.yml up -d mysql
    
    # Esperar a que MySQL esté listo
    log "⏳ Esperando a que MySQL esté listo..."
    sleep 30
    
    # Iniciar el resto de servicios
    docker-compose -f docker-compose.prod.yml up -d
    
    log "✅ Servicios iniciados"
}

# Verificar servicios
verify_services() {
    log "🔍 Verificando servicios..."
    
    # Esperar un poco para que los servicios se inicien
    sleep 10
    
    # Verificar MySQL
    if docker-compose -f docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost --silent; then
        log "✅ MySQL está funcionando"
    else
        error "❌ MySQL no está funcionando"
    fi
    
    # Verificar API
    if curl -f http://localhost:3001/api/health &> /dev/null; then
        log "✅ API está funcionando"
    else
        error "❌ API no está funcionando"
    fi
    
    # Verificar Frontend
    if curl -f http://localhost/ &> /dev/null; then
        log "✅ Frontend está funcionando"
    else
        error "❌ Frontend no está funcionando"
    fi
    
    log "✅ Todos los servicios están funcionando correctamente"
}

# Mostrar información de acceso
show_access_info() {
    log "📋 Información de acceso:"
    info "🌐 Aplicación: http://localhost"
    info "🔧 Admin Panel: http://localhost/admin"
    info "📊 API: http://localhost:3001/api"
    info "🐳 Portainer: http://localhost:9000"
    info "🔒 Nginx Proxy Manager: http://localhost:81"
    info ""
    info "👤 Credenciales por defecto:"
    info "📧 Email: admin@cafecolombiaapp.com"
    info "🔑 Password: CafeAdmin2024!"
    warning "⚠️  Recuerda cambiar las credenciales por defecto"
}

# Función principal
main() {
    log "🚀 Iniciando despliegue con Docker..."
    
    check_dependencies
    setup_environment
    create_directories
    build_images
    start_services
    verify_services
    show_access_info
    
    log "🎉 Despliegue completado exitosamente!"
}

# Ejecutar función principal
main "$@"
```

### docker-maintenance.sh
```bash
#!/bin/bash

# Script de mantenimiento para Docker

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Backup de volúmenes
backup_volumes() {
    log "💾 Creando backup de volúmenes..."
    
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_DIR="./backups/docker_backup_$DATE"
    
    mkdir -p "$BACKUP_DIR"
    
    # Backup de MySQL
    docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump \
        -u root -p$MYSQL_ROOT_PASSWORD cafe_colombia_app > "$BACKUP_DIR/database.sql"
    
    # Backup de uploads
    docker cp cafe-api:/app/uploads "$BACKUP_DIR/uploads"
    
    # Comprimir backup
    tar -czf "$BACKUP_DIR.tar.gz" -C ./backups "docker_backup_$DATE"
    rm -rf "$BACKUP_DIR"
    
    log "✅ Backup completado: docker_backup_$DATE.tar.gz"
}

# Limpiar recursos Docker
cleanup_docker() {
    log "🧹 Limpiando recursos Docker..."
    
    # Limpiar contenedores parados
    docker container prune -f
    
    # Limpiar imágenes no utilizadas
    docker image prune -f
    
    # Limpiar volúmenes no utilizados
    docker volume prune -f
    
    # Limpiar redes no utilizadas
    docker network prune -f
    
    log "✅ Limpieza completada"
}

# Actualizar aplicación
update_application() {
    log "🔄 Actualizando aplicación..."
    
    # Crear backup antes de actualizar
    backup_volumes
    
    # Detener servicios
    docker-compose -f docker-compose.prod.yml down
    
    # Actualizar código
    git pull origin main
    
    # Reconstruir imágenes
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Iniciar servicios
    docker-compose -f docker-compose.prod.yml up -d
    
    log "✅ Actualización completada"
}

# Monitorear servicios
monitor_services() {
    log "📊 Estado de servicios Docker:"
    
    docker-compose -f docker-compose.prod.yml ps
    
    echo ""
    log "💾 Uso de recursos:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo ""
    log "📋 Logs recientes:"
    docker-compose -f docker-compose.prod.yml logs --tail=10
}

# Restaurar desde backup
restore_backup() {
    if [ -z "$1" ]; then
        echo "Uso: $0 restore <archivo_backup.tar.gz>"
        exit 1
    fi
    
    BACKUP_FILE="$1"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo "Error: Archivo de backup no encontrado: $BACKUP_FILE"
        exit 1
    fi
    
    log "🔄 Restaurando desde backup: $BACKUP_FILE"
    
    # Detener servicios
    docker-compose -f docker-compose.prod.yml down
    
    # Extraer backup
    TEMP_DIR="/tmp/restore_$(date +%s)"
    mkdir -p "$TEMP_DIR"
    tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
    
    # Restaurar base de datos
    docker-compose -f docker-compose.prod.yml up -d mysql
    sleep 30
    
    docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
        -u root -p$MYSQL_ROOT_PASSWORD cafe_colombia_app < "$TEMP_DIR"/*/database.sql
    
    # Restaurar uploads
    docker cp "$TEMP_DIR"/*/uploads cafe-api:/app/
    
    # Iniciar todos los servicios
    docker-compose -f docker-compose.prod.yml up -d
    
    # Limpiar archivos temporales
    rm -rf "$TEMP_DIR"
    
    log "✅ Restauración completada"
}

# Función principal
case "$1" in
    "backup")
        backup_volumes
        ;;
    "cleanup")
        cleanup_docker
        ;;
    "update")
        update_application
        ;;
    "monitor")
        monitor_services
        ;;
    "restore")
        restore_backup "$2"
        ;;
    *)
        echo "Uso: $0 {backup|cleanup|update|monitor|restore <archivo>}"
        echo ""
        echo "Comandos disponibles:"
        echo "  backup  - Crear backup de volúmenes"
        echo "  cleanup - Limpiar recursos Docker no utilizados"
        echo "  update  - Actualizar aplicación desde repositorio"
        echo "  monitor - Mostrar estado y recursos de servicios"
        echo "  restore - Restaurar desde archivo de backup"
        exit 1
        ;;
esac
```

---

## 📊 Monitoreo con Docker

### docker-compose.monitoring.yml
```yaml
version: '3.8'

services:
  # Prometheus para métricas
  prometheus:
    image: prom/prometheus:latest
    container_name: cafe-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    volumes:
      - ./docker/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    networks:
      - cafe-network

  # Grafana para visualización
  grafana:
    image: grafana/grafana:latest
    container_name: cafe-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      GF_SECURITY_ADMIN_PASSWORD: admin123
    volumes:
      - grafana_data:/var/lib/grafana
      - ./docker/grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./docker/grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - cafe-network

  # Node Exporter para métricas del sistema
  node-exporter:
    image: prom/node-exporter:latest
    container_name: cafe-node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'
    networks:
      - cafe-network

  # cAdvisor para métricas de contenedores
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cafe-cadvisor
    restart: unless-stopped
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    devices:
      - /dev/kmsg
    networks:
      - cafe-network

volumes:
  prometheus_data:
  grafana_data:

networks:
  cafe-network:
    external: true
```

### docker/prometheus/prometheus.yml
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'cafe-api'
    static_configs:
      - targets: ['cafe-api:3001']
    metrics_path: '/api/metrics'

  - job_name: 'mysql'
    static_configs:
      - targets: ['mysql:3306']
```

---

## 💾 Backup y Restauración

### backup-docker-complete.sh
```bash
#!/bin/bash

# Script completo de backup para Docker

BACKUP_BASE_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$BACKUP_BASE_DIR/complete_backup_$DATE"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# Crear directorio de backup
mkdir -p "$BACKUP_DIR"

log "🚀 Iniciando backup completo..."

# 1. Backup de base de datos
log "📊 Backup de base de datos..."
docker-compose -f docker-compose.prod.yml exec -T mysql mysqldump \
    -u root -p$MYSQL_ROOT_PASSWORD --single-transaction --routines --triggers \
    cafe_colombia_app > "$BACKUP_DIR/database.sql"

# 2. Backup de volúmenes Docker
log "💾 Backup de volúmenes Docker..."
docker run --rm -v cafe-colombia-app_mysql_data:/data -v "$PWD/$BACKUP_DIR":/backup \
    alpine tar czf /backup/mysql_volume.tar.gz -C /data .

docker run --rm -v cafe-colombia-app_uploads_data:/data -v "$PWD/$BACKUP_DIR":/backup \
    alpine tar czf /backup/uploads_volume.tar.gz -C /data .

# 3. Backup de configuraciones
log "⚙️ Backup de configuraciones..."
cp -r docker/ "$BACKUP_DIR/"
cp docker-compose.prod.yml "$BACKUP_DIR/"
cp .env.docker "$BACKUP_DIR/"

# 4. Backup de logs
log "📋 Backup de logs..."
cp -r logs/ "$BACKUP_DIR/" 2>/dev/null || true

# 5. Crear archivo de información del backup
cat > "$BACKUP_DIR/backup_info.txt" << EOF
Backup Information
==================
Date: $(date)
Docker Compose Version: $(docker-compose --version)
Docker Version: $(docker --version)
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo "N/A")
Git Branch: $(git branch --show-current 2>/dev/null || echo "N/A")

Services backed up:
- MySQL Database
- Uploads Volume
- Configuration Files
- Application Logs

Restore Instructions:
1. Extract this backup to the application directory
2. Run: ./restore-docker-complete.sh complete_backup_$DATE
EOF

# 6. Comprimir backup completo
log "🗜️ Comprimiendo backup..."
tar -czf "$BACKUP_BASE_DIR/complete_backup_$DATE.tar.gz" -C "$BACKUP_BASE_DIR" "complete_backup_$DATE"
rm -rf "$BACKUP_DIR"

# 7. Limpiar backups antiguos (mantener últimos 7)
log "🧹 Limpiando backups antiguos..."
ls -t "$BACKUP_BASE_DIR"/complete_backup_*.tar.gz | tail -n +8 | xargs -r rm

log "✅ Backup completo creado: complete_backup_$DATE.tar.gz"
log "📁 Ubicación: $BACKUP_BASE_DIR/complete_backup_$DATE.tar.gz"
```

### restore-docker-complete.sh
```bash
#!/bin/bash

# Script de restauración completa para Docker

if [ -z "$1" ]; then
    echo "Uso: $0 <nombre_backup>"
    echo "Ejemplo: $0 complete_backup_20241201_143022"
    exit 1
fi

BACKUP_NAME="$1"
BACKUP_FILE="./backups/$BACKUP_NAME.tar.gz"

log() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

error() {
    echo "[ERROR] $1"
    exit 1
}

# Verificar que existe el archivo de backup
if [ ! -f "$BACKUP_FILE" ]; then
    error "Archivo de backup no encontrado: $BACKUP_FILE"
fi

log "🔄 Iniciando restauración desde: $BACKUP_NAME"

# 1. Detener servicios
log "⏹️ Deteniendo servicios..."
docker-compose -f docker-compose.prod.yml down

# 2. Extraer backup
log "📦 Extrayendo backup..."
TEMP_DIR="/tmp/restore_$(date +%s)"
mkdir -p "$TEMP_DIR"
tar -xzf "$BACKUP_FILE" -C "$TEMP_DIR"
BACKUP_DIR="$TEMP_DIR/$BACKUP_NAME"

# 3. Restaurar configuraciones
log "⚙️ Restaurando configuraciones..."
cp -r "$BACKUP_DIR/docker/" ./
cp "$BACKUP_DIR/docker-compose.prod.yml" ./
cp "$BACKUP_DIR/.env.docker" ./

# 4. Restaurar volúmenes
log "💾 Restaurando volúmenes..."

# Crear volúmenes si no existen
docker volume create cafe-colombia-app_mysql_data
docker volume create cafe-colombia-app_uploads_data

# Restaurar volumen de MySQL
docker run --rm -v cafe-colombia-app_mysql_data:/data -v "$BACKUP_DIR":/backup \
    alpine tar xzf /backup/mysql_volume.tar.gz -C /data

# Restaurar volumen de uploads
docker run --rm -v cafe-colombia-app_uploads_data:/data -v "$BACKUP_DIR":/backup \
    alpine tar xzf /backup/uploads_volume.tar.gz -C /data

# 5. Iniciar MySQL y restaurar base de datos
log "🗄️ Restaurando base de datos..."
docker-compose -f docker-compose.prod.yml up -d mysql

# Esperar a que MySQL esté listo
log "⏳ Esperando a que MySQL esté listo..."
sleep 30

# Restaurar base de datos
docker-compose -f docker-compose.prod.yml exec -T mysql mysql \
    -u root -p$MYSQL_ROOT_PASSWORD cafe_colombia_app < "$BACKUP_DIR/database.sql"

# 6. Iniciar todos los servicios
log "🚀 Iniciando todos los servicios..."
docker-compose -f docker-compose.prod.yml up -d

# 7. Verificar servicios
log "🔍 Verificando servicios..."
sleep 10

if docker-compose -f docker-compose.prod.yml ps | grep -q "Up"; then
    log "✅ Servicios iniciados correctamente"
else
    error "❌ Error al iniciar servicios"
fi

# 8. Limpiar archivos temporales
log "🧹 Limpiando archivos temporales..."
rm -rf "$TEMP_DIR"

log "🎉 Restauración completada exitosamente!"
log "🌐 La aplicación debería estar disponible en: http://localhost"
```

---

## 📋 Comandos Útiles Docker

### Comandos de Gestión
```bash
# Iniciar todos los servicios
docker-compose -f docker-compose.prod.yml up -d

# Detener todos los servicios
docker-compose -f docker-compose.prod.yml down

# Ver logs de todos los servicios
docker-compose -f docker-compose.prod.yml logs -f

# Ver logs de un servicio específico
docker-compose -f docker-compose.prod.yml logs -f api

# Reiniciar un servicio específico
docker-compose -f docker-compose.prod.yml restart api

# Escalar un servicio
docker-compose -f docker-compose.prod.yml up -d --scale api=3

# Ver estado de servicios
docker-compose -f docker-compose.prod.yml ps

# Ejecutar comando en contenedor
docker-compose -f docker-compose.prod.yml exec api bash

# Ver recursos utilizados
docker stats

# Limpiar sistema Docker
docker system prune -a
```

### Comandos de Desarrollo
```bash
# Reconstruir imágenes
docker-compose -f docker-compose.prod.yml build --no-cache

# Actualizar un servicio específico
docker-compose -f docker-compose.prod.yml up -d --build api

# Acceder a MySQL
docker-compose -f docker-compose.prod.yml exec mysql mysql -u root -p

# Backup rápido de BD
docker-compose -f docker-compose.prod.yml exec mysql mysqldump -u root -p cafe_colombia_app > backup.sql

# Restaurar BD
docker-compose -f docker-compose.prod.yml exec -T mysql mysql -u root -p cafe_colombia_app < backup.sql
```

---

*Esta configuración Docker proporciona un entorno de producción completo, escalable y fácil de mantener para la aplicación Café Colombia App.*
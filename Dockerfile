# 🐳 DOCKERFILE PARA CAFÉ COLOMBIA APP
# Imagen base con Node.js 18 LTS
FROM node:18-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache \
    mysql-client \
    curl \
    bash \
    tzdata

# Configurar zona horaria
ENV TZ=America/Bogota
RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

# Crear usuario no-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S cafeapp -u 1001

# Establecer directorio de trabajo
WORKDIR /app

# Copiar archivos de configuración
COPY package*.json ./
COPY api/package*.json ./api/

# Copiar scripts necesarios para el build (requerido por postinstall)
COPY scripts/ ./scripts/

# ================================
# STAGE 1: Dependencias
# ================================
FROM base AS deps

# Instalar dependencias
RUN npm ci --only=production && npm cache clean --force
RUN cd api && npm ci --only=production && npm cache clean --force

# ================================
# STAGE 2: Builder
# ================================
FROM base AS builder

# Copiar dependencias
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules

# Copiar código fuente
COPY . .

# Compilar aplicación
RUN npm run build
RUN cd api && npm run build

# ================================
# STAGE 3: Runner (Producción)
# ================================
FROM base AS runner

# Variables de entorno de producción
ENV NODE_ENV=production
ENV PORT=3001
ENV HOST=0.0.0.0

# Crear directorios necesarios
RUN mkdir -p /app/uploads /app/logs /app/backups
RUN chown -R cafeapp:nodejs /app

# Copiar archivos necesarios
COPY --from=builder --chown=cafeapp:nodejs /app/dist ./dist
COPY --from=builder --chown=cafeapp:nodejs /app/api/dist ./api/dist
COPY --from=deps --chown=cafeapp:nodejs /app/node_modules ./node_modules
COPY --from=deps --chown=cafeapp:nodejs /app/api/node_modules ./api/node_modules

# Copiar archivos de configuración
COPY --chown=cafeapp:nodejs package.json ./
COPY --chown=cafeapp:nodejs api/package.json ./api/
COPY --chown=cafeapp:nodejs ecosystem.config.js ./
COPY --chown=cafeapp:nodejs scripts/ ./scripts/

# Instalar PM2 globalmente
RUN npm install -g pm2

# Cambiar a usuario no-root
USER cafeapp

# Exponer puerto
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/api/health || exit 1

# Comando por defecto
CMD ["pm2-runtime", "start", "ecosystem.config.js", "--env", "production"]
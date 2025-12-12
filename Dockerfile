# 🐳 DOCKERFILE PARA CAFÉ COLOMBIA APP
# Imagen base con Node.js 20 LTS
FROM node:20-alpine AS base

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

# Copiar archivos de configuración TypeScript
COPY tsconfig*.json ./

# Copiar scripts necesarios para el build (requerido por postinstall)
COPY scripts/ ./scripts/

# ================================
# STAGE 1: Dependencias (todas para el build)
# ================================
FROM base AS deps

    # Instalar TODAS las dependencias (incluyendo devDependencies para el build)
    # Usar --ignore-scripts para evitar que postinstall ejecute npm run build sin archivos fuente
    RUN npm ci --ignore-scripts && npm cache clean --force
    RUN cd api && npm ci && npm cache clean --force

# ================================
# STAGE 1.5: Dependencias de producción solamente
# ================================
FROM base AS deps-prod

# Instalar solo dependencias de producción para la imagen final (sin ejecutar scripts)
RUN npm ci --only=production --ignore-scripts && npm cache clean --force
RUN cd api && npm ci --only=production --ignore-scripts && npm cache clean --force

# ================================
# STAGE 2: Builder
# ================================
FROM base AS builder

# Copiar dependencias
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/api/node_modules ./api/node_modules

# Copiar código fuente
COPY . .

# Ejecutar build simplificado (sin TypeScript)
RUN npm run build

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

# Copiar archivos necesarios (no copiar api/.env en producción)
COPY --from=builder --chown=cafeapp:nodejs /app/dist ./dist
COPY --from=builder --chown=cafeapp:nodejs /app/api/dist ./api/dist
COPY --from=builder --chown=cafeapp:nodejs /app/api/*.cjs ./api/
COPY --from=builder --chown=cafeapp:nodejs /app/api/routes/*.cjs ./api/routes/
COPY --from=deps-prod --chown=cafeapp:nodejs /app/node_modules ./node_modules
COPY --from=deps-prod --chown=cafeapp:nodejs /app/api/node_modules ./api/node_modules

# Copiar archivos de configuración
COPY --chown=cafeapp:nodejs package.json ./
COPY --chown=cafeapp:nodejs api/package.json ./api/
COPY --chown=cafeapp:nodejs ecosystem.config.cjs ./
COPY --chown=cafeapp:nodejs scripts/ ./scripts/

# Instalar PM2 globalmente
RUN npm install -g pm2

# Cambiar a usuario no-root
USER cafeapp

# Exponer puerto
EXPOSE 3001

# Health check (independiente de la DB)
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:3001/api/ping || exit 1

# Comando por defecto
CMD ["pm2-runtime", "start", "ecosystem.config.cjs", "--env", "production"]
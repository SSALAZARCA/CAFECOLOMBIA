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

# Ejecutar prisma generate y build
RUN npx prisma generate
RUN npm run build

# ================================
# STAGE 3: Runner (Producción)
# ================================
FROM base AS runner

# Variables de entorno de producción
ENV NODE_ENV=production
ENV PORT=5001
ENV HOST=0.0.0.0

# Crear directorios necesarios
RUN mkdir -p /app/uploads /app/logs /app/backups
RUN chown -R cafeapp:nodejs /app

# Copiar archivos necesarios para Prisma (schema es requerido por el engine en runtime si no se usa binaryTargets bundleados, pero client se copia en node_modules)
COPY --from=builder --chown=cafeapp:nodejs /app/prisma ./prisma

# Copiar Frontend (dist)
COPY --from=builder --chown=cafeapp:nodejs /app/dist ./dist

# Copiar Backend (api/dist -> api)
# Esto asegura que controllers, routes, lib y server.cjs estén en /app/api
COPY --from=builder --chown=cafeapp:nodejs /app/api/dist ./api
COPY --from=deps-prod --chown=cafeapp:nodejs /app/node_modules ./node_modules
COPY --from=deps-prod --chown=cafeapp:nodejs /app/api/node_modules ./api/node_modules
# Asegurar que el cliente generado de Prisma esté disponible para el motor de ejecución
COPY --from=builder --chown=cafeapp:nodejs /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder --chown=cafeapp:nodejs /app/node_modules/.prisma ./api/node_modules/.prisma

# Copiar archivos de configuración
COPY --chown=cafeapp:nodejs package.json ./
COPY --chown=cafeapp:nodejs api/package.json ./api/
COPY --chown=cafeapp:nodejs ecosystem.config.cjs ./
COPY --chown=cafeapp:nodejs scripts/ ./scripts/

# Copiar el script de entrada y darle permisos de ejecución
COPY --chown=cafeapp:nodejs scripts/entrypoint.sh /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

# Instalar PM2 globalmente
RUN npm install -g pm2

# Cambiar a usuario no-root
USER cafeapp

# Exponer puerto
EXPOSE 5001

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -fsS http://localhost:5001/api/ping || exit 1

# Usar el script de entrada para ejecutar migraciones antes de PM2
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["pm2-runtime", "start", "ecosystem.config.cjs", "--env", "production"]
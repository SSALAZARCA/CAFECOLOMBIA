# 🐳 DOCKERFILE PARA CAFÉ COLOMBIA APP
# Imagen base con Node.js 20 LTS
FROM node:20-alpine AS base

# Instalar dependencias del sistema
RUN apk add --no-cache \
  mysql-client \
  curl \
  bash \
  tzdata \
  openssl \
  libc6-compat

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
COPY prisma ./prisma/

# ================================
# STAGE 1: Dependencias (todas para el build)
# ================================
FROM base AS deps

# Instalar TODAS las dependencias (incluyendo devDependencies para el build)
RUN npm ci --ignore-scripts && npm cache clean --force
RUN cd api && npm ci && npm cache clean --force

# ================================
# STAGE 1.5: Dependencias de producción solamente
# ================================
FROM base AS deps-prod

# Instalar solo dependencias de producción
RUN npm ci --only=production --ignore-scripts && npm cache clean --force
RUN cd api && npm ci --only=production --ignore-scripts && npm cache clean --force

# GENERAR PRISMA CLIENT EN PRODUCCIÓN
# Esto asegura que el motor (.prisma) esté en el lugar correcto para el runner
RUN npx prisma generate
# También generarlo para el contexto de la API por si acaso
RUN cd api && npx prisma generate --schema=../prisma/schema.prisma

# ================================
# STAGE 2: Builder
# ================================
FROM base AS builder

# Copiar dependencias de build
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

# Copiar archivos necesarios para Prisma
COPY --from=builder --chown=cafeapp:nodejs /app/prisma ./prisma

# Copiar Frontend (dist)
COPY --from=builder --chown=cafeapp:nodejs /app/dist ./dist

# Copiar Backend (api/dist -> api)
COPY --from=builder --chown=cafeapp:nodejs /app/api/dist ./api

# COPIAR NODE_MODULES CON PRISMA GENERADO DESDE deps-prod
COPY --from=deps-prod --chown=cafeapp:nodejs /app/node_modules ./node_modules
COPY --from=deps-prod --chown=cafeapp:nodejs /app/api/node_modules ./api/node_modules

# Copiar archivos de configuración remanentes
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
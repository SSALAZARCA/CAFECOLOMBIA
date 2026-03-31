#!/bin/sh

# 🚀 Script de entrada para Cafe Colombia App

echo "⏳ Esperando a que la base de datos esté lista..."

# Esperar a que el host 'db' responda en el puerto 3306
while ! nc -z db 3306; do
  sleep 1
done

echo "✅ Base de datos detectada."

# Ejecutar migraciones de Prisma
echo "🔄 Ejecutando migraciones de Prisma..."
npx prisma migrate deploy

# Ejecutar el comando principal
echo "🚀 Iniciando la aplicación con PM2..."
exec "$@"

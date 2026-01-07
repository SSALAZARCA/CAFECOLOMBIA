#!/bin/bash
set -e

echo "🔄 Sincronizando schema de Prisma con la base de datos..."
npx prisma db push --accept-data-loss

echo "🚀 Iniciando servidor..."
exec node api/server.cjs

@echo off
echo ===================================================
echo   VISOR DE BASE DE DATOS (NUBE / HOSTINGER)
echo ===================================================
echo.
echo Para que esto funcione, debes haber configurado en Coolify:
echo  1. Ve a tu recurso MySQL -> Configuration
echo  2. En "Ports Mappings" escribe: 3307:3306
echo  3. Guarda y dale Restart al MySQL.
echo.
echo Conectando a 72.62.130.152 por el puerto 3307...
echo.

set DATABASE_URL=mysql://mysql:ssc841209@72.62.130.152:3307/default

echo Generando cliente de Prisma...
call npx prisma generate

call npx prisma studio --port 5556

pause

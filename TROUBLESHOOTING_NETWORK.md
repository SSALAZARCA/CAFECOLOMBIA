# 🔧 Guía de Troubleshooting - Error de Red "Servidor no disponible"

## 🚨 Problema Identificado

El frontend muestra **"Error de red - servidor no disponible. Reintentando..."** debido a problemas de conectividad entre el frontend y el backend.

## 🔍 Diagnóstico Rápido

### 1. Ejecutar Script de Diagnóstico
```powershell
.\production-diagnostics.ps1
```

### 2. Verificar Estado de Servicios
```bash
docker ps
docker-compose ps
```

### 3. Probar Conectividad Manual
```bash
# Probar backend directamente
curl http://localhost:3001/api/health
curl http://localhost:3001/api/debug/connection

# Probar a través del proxy
curl http://localhost/api/health
```

## 🛠️ Soluciones por Escenario

### Escenario 1: Backend no responde (Puerto 3001)

**Síntomas:**
- `curl http://localhost:3001/api/health` falla
- Logs del contenedor API muestran errores

**Soluciones:**
```bash
# 1. Reiniciar contenedor API
docker restart cafecolombiaapp-api-1

# 2. Verificar logs detallados
docker logs -f cafecolombiaapp-api-1

# 3. Verificar base de datos
docker exec -it cafecolombiaapp-mysql-1 mysql -u root -p

# 4. Reconstruir si es necesario
docker-compose down
docker-compose up --build -d
```

### Escenario 2: Nginx no redirige /api correctamente

**Síntomas:**
- Backend responde en puerto 3001
- `curl http://localhost/api/health` falla
- Error 502 Bad Gateway

**Soluciones:**
```bash
# 1. Verificar configuración de Nginx
docker exec cafecolombiaapp-nginx-1 nginx -t

# 2. Recargar configuración
docker exec cafecolombiaapp-nginx-1 nginx -s reload

# 3. Reiniciar Nginx
docker restart cafecolombiaapp-nginx-1

# 4. Verificar logs de Nginx
docker logs cafecolombiaapp-nginx-1
```

### Escenario 3: Problemas de red Docker

**Síntomas:**
- Contenedores no se comunican entre sí
- DNS interno no funciona

**Soluciones:**
```bash
# 1. Verificar red Docker
docker network ls
docker network inspect cafecolombiaapp_default

# 2. Recrear red
docker-compose down
docker network prune
docker-compose up -d

# 3. Verificar conectividad interna
docker exec cafecolombiaapp-nginx-1 ping api
docker exec cafecolombiaapp-nginx-1 curl http://api:3001/api/health
```

### Escenario 4: Variables de entorno incorrectas

**Síntomas:**
- Frontend intenta conectar a URL incorrecta
- VITE_API_URL mal configurada

**Soluciones:**
```bash
# 1. Verificar variables de entorno
cat .env
cat .env.production

# 2. Verificar en el contenedor
docker exec cafecolombiaapp-client-1 env | grep VITE

# 3. Reconstruir con variables correctas
docker-compose down
docker-compose up --build -d
```

## 🔧 Herramientas de Debug Implementadas

### 1. Panel de Debug en Frontend
- **Activación:** `Ctrl+Shift+D`
- **Ubicación:** Esquina inferior derecha
- **Funciones:**
  - Monitoreo en tiempo real de conectividad
  - Prueba de URLs disponibles
  - Información de entorno
  - Logs de conexión

### 2. Endpoint de Diagnóstico en Backend
- **URL:** `http://localhost:3001/api/debug/connection`
- **Información proporcionada:**
  - Estado del servidor
  - Configuración de red
  - Endpoints disponibles
  - Detalles de la solicitud

### 3. Script de Diagnóstico Automático
- **Archivo:** `production-diagnostics.ps1`
- **Funciones:**
  - Verificación completa de servicios
  - Pruebas de conectividad
  - Análisis de logs
  - Recomendaciones automáticas

## 📋 Checklist de Verificación

### ✅ Antes de Desplegar
- [ ] Variables de entorno configuradas correctamente
- [ ] Base de datos accesible
- [ ] Redis funcionando
- [ ] Puertos disponibles (80, 3001, 3306, 6379)

### ✅ Después de Desplegar
- [ ] Todos los contenedores ejecutándose
- [ ] Backend responde en puerto 3001
- [ ] Nginx redirige /api correctamente
- [ ] Frontend carga sin errores
- [ ] Panel de debug funciona (Ctrl+Shift+D)

### ✅ En Caso de Problemas
- [ ] Ejecutar script de diagnóstico
- [ ] Verificar logs de todos los contenedores
- [ ] Probar conectividad manual
- [ ] Verificar configuración de red Docker
- [ ] Reconstruir contenedores si es necesario

## 🚀 Comandos de Recuperación Rápida

### Reinicio Completo
```bash
# Parar todo
docker-compose down

# Limpiar volúmenes (CUIDADO: elimina datos)
docker-compose down -v

# Reconstruir y iniciar
docker-compose up --build -d

# Verificar estado
docker-compose ps
```

### Reinicio Selectivo
```bash
# Solo API
docker restart cafecolombiaapp-api-1

# Solo Nginx
docker restart cafecolombiaapp-nginx-1

# Solo Frontend
docker restart cafecolombiaapp-client-1
```

## 📞 Contacto y Soporte

Si el problema persiste después de seguir esta guía:

1. Ejecutar `.\production-diagnostics.ps1` y guardar la salida
2. Recopilar logs de todos los contenedores
3. Verificar configuración de red y variables de entorno
4. Documentar pasos reproducibles del error

## 🔄 Actualizaciones

- **v1.0:** Implementación inicial del sistema de diagnóstico
- **v1.1:** Agregado panel de debug en tiempo real
- **v1.2:** Mejorado endpoint de diagnóstico backend
- **v1.3:** Script automatizado de troubleshooting
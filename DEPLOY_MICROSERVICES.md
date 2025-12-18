
# Guía de Despliegue Microservicios (Frontend + Backend Separados)

Esta guía explica cómo desplegar la aplicación dividida en tres servicios independientes en Coolify: **Base de Datos**, **Backend**, y **Frontend**.

## 1. Actualizar Repositorio
Sube los nuevos archivos Dockerfile creados:
```bash
git add .
git commit -m "feat: dockerfiles for microservices deployment"
git push origin main
```

## 2. Crear Base de Datos
1.  En tu proyecto Coolify, haz clic en **+ New Resource**.
2.  Selecciona **Database** -> **MySQL** (o PostgreSQL).
3.  Dale un nombre y despliégala.
4.  Copia las credenciales (Root Password, User, Password, Database Name).
5.  **Importante**: Nota el nombre del servicio interno (ej. `mysql-uuid` o simplemente el nombre que le diste, Coolify te muestra el "Internal Connection URL").

## 3. Desplegar Backend (API)
1.  **+ New Resource** -> **Git Repository**.
2.  Selecciona `SSALAZARCA/CAFECOLOMBIA` (rama `main`).
3.  **Build Pack**: `Dockerfile`.
4.  **Dockerfile Location**: `/Dockerfile.backend` (¡Importante cambiar esto!).
5.  **Puerto**: `3001` (Exposed Port).
6.  **Variables de Entorno**:
    *   `NODE_ENV`: `production`
    *   `DB_HOST`: (Host interno de la BD, ej: `uuid-mysql`)
    *   `DB_USER`: (Usuario BD)
    *   `DB_PASSWORD`: (Password BD)
    *   `DB_NAME`: (Nombre BD)
    *   `JWT_SECRET`: (Tu secreto)
    *   `PORT`: `3001`
7.  Haz clic en **Deploy**.
8.  Una vez desplegado, copia la **URL pública** que Coolify le asignó (ej. `https://api.tu-dominio.com`).
9.  **Inicializar BD**: Entra a la Terminal del Backend y ejecuta `npx prisma db push`.

## 4. Desplegar Frontend (UI)
1.  **+ New Resource** -> **Git Repository**.
2.  Selecciona el mismo repo `SSALAZARCA/CAFECOLOMBIA`.
3.  **Build Pack**: `Dockerfile`.
4.  **Dockerfile Location**: `/Dockerfile.frontend`.
5.  **Puerto**: `80`.
6.  **Variables de Entorno (BUILD TIME)**:
    *   `VITE_API_URL`: (Pega la URL del Backend del paso anterior, ej. `https://api.tu-dominio.com`).
    *   *Nota: Asegúrate de marcar esta variable como "Build Variable" si Coolify lo pide, o simplemente agrégala en Environment Variables normales, Coolify suele inyectarlas.*
7.  Haz clic en **Deploy**.
8.  Coolify construirá el frontend estático conectándolo a tu backend.

## Resumen de Arquitectura
*   **Frontend**: Contenedor Nginx estático (Puerto 80).
*   **Backend**: Contenedor Node.js API (Puerto 3001).
*   **Database**: Servicio MySQL gestionado.

La comunicación entre Frontend y Backend se hace vía internet (HTTPS), por lo que el navegador de tus usuarios llamará a `https://api.tu-dominio.com`. Asegúrate de que el Backend tenga configurado CORS (la app ya permite todos los orígenes por defecto o configúralo con `CORS_ORIGIN`).

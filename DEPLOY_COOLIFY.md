
# Guía de Despliegue en Coolify (KVM4)

Esta guía explica cómo desplegar la aplicación **Café Colombia** en tu servidor VPS usando Coolify.

## 1. Preparación del Repositorio
Asegúrate de ejecutar los siguientes comandos para subir los cambios recientes al repositorio Git:
```bash
git add .
git commit -m "Preparación para Coolify: Dockerfile y Compose"
git push origin main
```

## 2. Configuración en Coolify

1.  **Login** en tu panel Coolify.
2.  Ve a **Projects** -> Selecciona tu proyecto (o crea uno).
3.  Selecciona el **Environment** (ej. Production).
4.  Haz clic en **+ New Resource**.
5.  Selecciona **Git Repository** (o GitHub/GitLab App si tienes integración).
6.  Selecciona el repositorio `SSALAZARCA/CAFECOLOMBIA` y la rama `main`.

## 3. Configuración del Build Pack

Coolify preguntará cómo construir el proyecto. Elige:
*   **Build Pack**: `Docker Compose`
*   **Docker Compose Location**: `/docker-compose.coolify.yml` (O copia el contenido de este archivo manualmente si te lo pide).

> **Nota**: Si Coolify no detecta automáticamente el archivo, puedes usar `Dockerfile` directamente, pero perderás los servicios integrados (MySQL/Redis) definidos en el compose. Se recomienda usar **Docker Compose** para tener todo el stack junto.

## 4. Variables de Entorno
En la sección **Configuration** -> **Environment Variables**, define las siguientes variables:

| Variable | Valor Recomendado |
| :--- | :--- |
| `NODE_ENV` | `production` |
| `MYSQL_ROOT_PASSWORD` | (Tu contraseña segura) |
| `MYSQL_DATABASE` | `cafedb` |
| `MYSQL_USER` | `cafe` |
| `MYSQL_PASSWORD` | (Tu contraseña segura para usuario) |
| `REDIS_PASSWORD` | (Tu contraseña segura para Redis) |
| `JWT_SECRET` | (Genera un string largo y seguro) |
| `COOLIFY_URL` | `https://tu-dominio.com` (Domino donde correrá la app) |

## 5. Volúmenes (Persistencia)
Coolify creará volúmenes automáticos basados en el `docker-compose.coolify.yml`.
- `mysql_data`: Persistencia de Base de Datos.
- `uploads_data`: Archivos subidos.

## 6. Despliegue
Haz clic en **Deploy**.
Coolify construirá la imagen usando el `Dockerfile`, levantará MySQL y Redis, y conectará todo.

## 7. Verificación
Una vez desplegado:
1.  Revisa los **Logs** de la aplicación para asegurar que inició correctamente (`Server running on port 3000`).
2.  Accede a `https://tu-dominio.com`. Deberías ver la aplicación.
3.  Si es la primera vez, necesitarás correr las migraciones (Prisma).
    *   Entra a la **Terminal** del contenedor `app` en Coolify.
    *   Ejecuta: `npx prisma db push` o `npx prisma migrate deploy`.

---
**Troubleshooting**:
- Si falla el build por memoria, aumenta el Swap en tu VPS.
- Si falla la conexión a BD: Verifica que `DB_HOST` sea `mysql` (nombre del servicio en compose).

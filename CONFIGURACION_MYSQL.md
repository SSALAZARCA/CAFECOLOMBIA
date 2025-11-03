# Configuración de MySQL para Café Colombia

## 🔧 Configuración Requerida

Para que el sistema funcione correctamente, necesitas configurar la contraseña de la base de datos MySQL.

### 📝 Pasos a seguir:

1. **Edita el archivo `.env`** en la carpeta `api/`:
   ```
   api/.env
   ```

2. **Busca la línea que dice:**
   ```
   DB_PASSWORD=CONFIGURE_YOUR_PASSWORD_HERE
   ```

3. **Reemplaza `CONFIGURE_YOUR_PASSWORD_HERE`** con la contraseña real de tu base de datos MySQL.

### 🗄️ Información de la Base de Datos

- **Host:** srv1196.hstgr.io (o IP: 193.203.175.58)
- **Puerto:** 3306
- **Usuario:** u484426513_cafe_colombia
- **Base de datos:** u484426513_cafe_colombia
- **Contraseña:** [NECESITAS CONFIGURARLA]

### 🧪 Probar la Conexión

Una vez configurada la contraseña, puedes probar la conexión ejecutando:

```bash
npm run mysql:test
```

### 🚀 Configurar la Base de Datos

Después de verificar que la conexión funciona, ejecuta:

```bash
npm run mysql:migrate
```

Para crear todas las tablas necesarias.

### 🎯 Configuración Inicial Completa

Para configurar todo el sistema (tablas + datos iniciales):

```bash
npm run mysql:setup
```

Esto creará:
- ✅ Todas las tablas necesarias
- ✅ Usuario superadministrador
- ✅ Configuraciones del sistema
- ✅ Planes de suscripción por defecto

### 👤 Credenciales del Superadministrador

Después de ejecutar `npm run mysql:setup`, podrás acceder con:

- **Email:** admin@cafecolombiaapp.com
- **Contraseña:** Admin123!

⚠️ **IMPORTANTE:** Cambia esta contraseña después del primer login.

### 🔄 Iniciar el Servidor

Una vez configurada la base de datos, puedes iniciar el servidor backend:

```bash
npm run server:dev
```

El servidor estará disponible en: http://localhost:3001

### 📊 Endpoints Disponibles

- **Health Check:** http://localhost:3001/api/health
- **API Info:** http://localhost:3001/api
- **Documentación completa:** Disponible en cada endpoint

---

## ❓ Problemas Comunes

### Error: "Access denied"
- Verifica que la contraseña en el archivo `.env` sea correcta
- Asegúrate de que el usuario tenga permisos en la base de datos

### Error: "Connection refused"
- Verifica que el host y puerto sean correctos
- Asegúrate de que el servidor MySQL esté funcionando

### Error: "Database not found"
- Verifica que el nombre de la base de datos sea correcto
- Asegúrate de que la base de datos exista en el servidor

---

## 🆘 Soporte

Si tienes problemas con la configuración, verifica:

1. ✅ Contraseña configurada correctamente en `.env`
2. ✅ Conexión a internet estable
3. ✅ Credenciales de base de datos válidas
4. ✅ Servidor MySQL funcionando

¡Una vez configurado, tendrás acceso completo al Panel de Superadministrador de Café Colombia!
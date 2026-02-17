# Checklist minimo para produccion

## 1) Variables de entorno
Crear un archivo `.env` local (o variables en Railway/Render) usando `.env.example`.

Minimo obligatorio:
- `COOKIE_SECRET`
- `SESSION_SECRET`
- `DB_HOST`
- `DB_PORT`
- `DB_NAME`
- `DB_USER`
- `DB_PASSWORD`

Para produccion:
- `NODE_ENV=production`
- `SESSION_SECURE=true`
- `DB_SSL=true` (si el proveedor lo exige)

## 2) Base de datos
- Crear la base en la nube.
- Ejecutar los scripts SQL/migraciones del proyecto (`scriptSQL/`).
- Verificar que existan todas las columnas nuevas (por ejemplo `direccion`, `piso`, `plantas`, `superficie_*`).

## 3) Sesiones persistentes
La app guarda sesiones en MySQL (tabla `sessions`).
Se crea automaticamente al iniciar.

## 4) Imagenes
Actualmente se leen desde `public/images`.
Si se hace deploy en servicios con disco efimero, usar almacenamiento externo (S3/Cloudinary) para no perder archivos.

## 5) Deploy
- Subir codigo a GitHub.
- Conectar repo al proveedor (Railway/Render).
- Configurar variables de entorno.
- Deploy.

## 6) Verificacion post deploy
- Login y logout.
- Refrescar pagina y confirmar que la sesion sigue activa.
- Alta/edicion/baja de propiedades como admin.
- Envio de formulario de contacto y consulta de propiedad (tabla `consultas`).

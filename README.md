# ClaveSegura Cloud v5.0

Versión sincronizada para GitHub + Netlify + Supabase. Los registros se cifran con AES-256-GCM antes de guardarse en PostgreSQL.

## 1. Subir a GitHub

Subí **todo el contenido de esta carpeta** a la raíz de un repositorio nuevo. Deben verse `package.json`, `netlify.toml`, `public` y `netlify` en la página principal del repositorio.

## 2. Crear la base en Supabase

1. Creá un proyecto gratuito en https://supabase.com
2. Abrí **SQL Editor > New query**.
3. Copiá todo el contenido del archivo `supabase-setup.sql` y presioná **Run**.
4. Entrá en **Project Settings > API** y guardá estos dos datos:
   - Project URL
   - `service_role` key (secreta)

Nunca subas la `service_role` key a GitHub ni la compartas.

## 3. Crear el proyecto en Netlify

Elegí **Add new project > Import an existing project > GitHub** y seleccioná el repositorio.

Configuración:

- Base directory: dejar vacío
- Build command: dejar vacío
- Publish directory: `public`
- Functions directory: `netlify/functions`

## 4. Configurar las variables privadas

En Netlify ingresá en **Project configuration > Environment variables** y agregá:

| Variable | Valor de ejemplo |
| --- | --- |
| `ADMIN_USER` | `admin` |
| `ADMIN_PASSWORD` | Tu contraseña de 4 caracteres o más |
| `SESSION_SECRET` | Una frase aleatoria larga de 32 caracteres o más |
| `DATA_ENCRYPTION_KEY` | Otra frase aleatoria larga de 32 caracteres o más |
| `SUPABASE_URL` | Project URL de Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave secreta `service_role` de Supabase |

Marcá las seis como disponibles para **Functions**. `ADMIN_PASSWORD`, `SESSION_SECRET`, `DATA_ENCRYPTION_KEY` y `SUPABASE_SERVICE_ROLE_KEY` deben marcarse como valores secretos cuando Netlify ofrezca esa opción.

No escribas estos valores dentro de GitHub ni los compartas por chat.

## 5. Volver a desplegar

Entrá en **Deploys > Trigger deploy > Clear cache and deploy project**. Cuando aparezca **Published**, abrí la dirección del sitio.

## Importar los datos anteriores

Desde la versión local descargá un backup JSON. En ClaveSegura Cloud ingresá y elegí **Importar backup**. El archivo reemplazará la base online y quedará disponible en todos tus dispositivos.

## Seguridad

- Login validado en el servidor.
- Sesiones firmadas con vencimiento de 12 horas.
- Bloqueo temporal después de 5 intentos fallidos.
- Registros cifrados con AES-256-GCM antes de guardarse.
- Las variables privadas se almacenan únicamente en Netlify.

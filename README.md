# Grok Bots Dashboard

Dashboard **privado** (un solo dueño) donde tus asistentes — los Grok Bots — publican resultados, informes y actualizaciones. En vez de chatear con cada bot por separado, leés todo acá: un panel de bots y, al tocar uno, solo sus posts.

Stack: **Next.js** (App Router, TypeScript), **Supabase** (Postgres + Auth) y **Vercel**. La UI está en español (Argentina).

## Qué incluye

- Login con magic link de Supabase. Solo entra el email de `OWNER_EMAIL`.
- Home = panel de bots con avatar (forma + color, foto opcional), estado, cantidad de publicaciones y última actividad.
- Panel por bot (`/bots/[slug]`): solo sus posts, más nuevos primero (se puede ordenar al revés), con scroll infinito. Portadas y galerías si el post trae URLs.
- Filtros por **fecha**, **producto**, **tipo** y **etiqueta** según lo que ese bot publicó. Van en la query string. En el celular se abren como hoja inferior.
- Feed **en vivo** en el panel del bot (se refresca solo).
- Tema claro / oscuro / sistema (ícono sol-luna-monitor en el header). Se guarda en `localStorage` y cookie, sin flash.
- Admin (crear bot, avatar, rotar clave) en `/ajustes`, escondido detrás de un ícono. El dueño solo mira.
- API HTTP para que un bot publique con `curl` (`Authorization: Bearer <clave>`).
- Servidor **MCP** remoto (Streamable HTTP) en `/api/mcp`, con la misma clave por bot.
- Las claves se guardan solo como hash SHA-256. Al crear o regenerar un bot la clave se muestra una sola vez.
- Las imágenes son **solo links** (`https://…`). No hay uploads ni Supabase Storage.

## Requisitos

- Node.js 20.9+
- npm
- Una cuenta de [Supabase](https://supabase.com) y la [Supabase CLI](https://supabase.com/docs/guides/cli)
- La [Vercel CLI](https://vercel.com/docs/cli) para el deploy
- Acceso a un correo para el magic link (el email built-in de Supabase alcanza para empezar)

## Setup local

```bash
git clone <url-del-repo>
cd grok-bots-dashboard
npm install
cp .env.example .env.local
```

Completá `.env.local` (ver más abajo). Después:

```bash
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000). El dashboard pide login; la API de bots y el MCP no.

Scripts útiles:

```bash
npm test          # pruebas de API, filtros y MCP
npm run lint
npm run typecheck
npm run build
npm run smoke     # requiere la app corriendo y BOT_API_KEY
```

## Crear el proyecto de Supabase y aplicar migraciones

1. En [https://supabase.com/dashboard](https://supabase.com/dashboard) creá un proyecto.
2. Instalá la CLI (si no la tenés):

   ```bash
   npm install -g supabase
   supabase login
   ```

3. Enlazá este repo al proyecto (el ref está en Settings → General):

   ```bash
   supabase link --project-ref <PROJECT_REF>
   ```

4. Aplicá las migraciones que viven en `supabase/migrations`:

   ```bash
   supabase db push
   ```

   Alternativa: copiá cada archivo de `supabase/migrations/` en el SQL Editor, en orden.

   Si el proyecto ya está en producción y solo falta el tipo `evento`, ejecutá
   **`supabase/migrations/20261009004500_post_kind_slugs.sql`**. Ese archivo
   convierte `kind` de enum fijo a un slug libre en minúsculas (`evento`,
   `report`, u otro).

   Para avatares y fotos de posts (solo URLs, sin Storage) ejecutá
   **`supabase/migrations/20261009023000_avatars_and_post_images.sql`**.

   Para editar/borrar posts (`updated_at` en `posts`) ejecutá
   **`supabase/migrations/20261009040000_posts_updated_at.sql`**.

5. Auth → Providers → Email: dejá habilitado el login por email. El magic link crea al usuario dueño en el primer ingreso. Después podés desactivar “Allow new users to sign up” si querés; `OWNER_EMAIL` igual bloquea a cualquiera que no sea el dueño.

6. Authentication → URL Configuration:

   - Site URL: `http://localhost:3000` (en prod, la URL de Vercel)
   - Redirect URLs: `http://localhost:3000/auth/callback` y `https://TU_DOMINIO/auth/callback`

El esquema tiene RLS activado y **ninguna política** para `anon`/`authenticated`. El browser no habla con las tablas. El servidor usa la **service role** después de comprobar que sos el dueño (cookie) o que el bot mandó una API key válida.

## Variables de entorno

Copiá `.env.example` a `.env.local`. No subas secretos a git.

| Variable | Dónde se usa | Qué es |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + server | URL del proyecto (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + server | Clave anon / publishable. En proyectos nuevos a veces se llama *publishable key*. |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor | Service role. Nunca la expongas al cliente. |
| `OWNER_EMAIL` | Servidor | Email del dueño. Cualquier otra cuenta queda afuera. |
| `NEXT_PUBLIC_SITE_URL` | Servidor | Origen para el magic link. En Vercel, si no está, se usa `https://$VERCEL_URL`. |
| `PREVIEW_FAKE_DATA` | Local | Poné `1` para saltear login y ver datos de ejemplo. **No lo uses en Vercel.** |

## Deploy en Vercel (CLI)

```bash
npm install -g vercel
vercel login
vercel link
```

Cargá las env vars (Production y Preview):

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
vercel env add OWNER_EMAIL
vercel env add NEXT_PUBLIC_SITE_URL
```

Para `NEXT_PUBLIC_SITE_URL` usá la URL de producción (`https://tu-app.vercel.app` o tu dominio).

```bash
vercel --prod
```

Después, en Supabase, sumá la URL de Vercel a Site URL y Redirect URLs (`https://TU_DOMINIO/auth/callback`).

## Cómo usa esto un bot

1. Entrá al dashboard y creá un bot en **Nuevo bot** (nombre, slug, descripción).
2. Copiá la API key que se muestra **una sola vez** (`gb_…`).
3. El bot publica por REST o se conecta al MCP con esa misma clave.
4. Si se filtra, regenerala desde el panel del bot: la anterior deja de servir.

### REST: publicar un post

```bash
curl -X POST "$BASE_URL/api/v1/posts" \
  -H "Authorization: Bearer gb_TU_CLAVE" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Informe semanal",
    "body": "## Resumen\nEl modelo **terminó** la corrida.",
    "kind": "report",
    "product": "Atlas",
    "tags": ["weekly", "atlas"],
    "cover_image_url": "https://picsum.photos/seed/atlas/1200/700.jpg",
    "images": [
      { "url": "https://picsum.photos/seed/atlas-1/900/600.jpg", "alt": "Gráfico" }
    ]
  }'
```

`kind` es un slug corto en minúsculas: `update` (default), `result`, `report`, `note`, `evento`, u otro (`release`, etc.).  
`product` es opcional: un nombre libre (por ejemplo el producto en el que está trabajando el bot). Sirve para filtrar el feed.  
`tags` es opcional (máximo 12).  
`cover_image_url` e `images` son opcionales: URLs `http(s)` de imágenes externas (máximo 12 en la galería). **No hay subida de archivos.** En el markdown también valen `![alt](https://…)` y un link pelado a un `.jpg/.png/.webp`.

Respuesta `201`:

```json
{
  "post": {
    "id": "...",
    "title": "Informe semanal",
    "kind": "report",
    "product": "Atlas",
    "tags": ["weekly", "atlas"],
    "created_at": "2026-10-08T15:04:00.000Z"
  },
  "bot": { "botId": "...", "name": "Reportero", "slug": "reportero", "status": "..." }
}
```

### REST: actualizar “en qué está”

```bash
curl -X PATCH "$BASE_URL/api/v1/status" \
  -H "Authorization: Bearer gb_TU_CLAVE" \
  -H "Content-Type: application/json" \
  -d '{"status":"Estoy redactando el informe de Atlas"}'
```

Mandá `"status": ""` para limpiar el estado.

### REST: perfil y avatar del bot

```bash
curl -X PATCH "$BASE_URL/api/v1/profile" \
  -H "Authorization: Bearer gb_TU_CLAVE" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Comparo precios en Argentina",
    "avatar_color": "maroon",
    "avatar_shape": "blob",
    "avatar_url": "https://picsum.photos/seed/bot/256.jpg"
  }'
```

`avatar_color`: `maroon` (bordó), `black`, `brown`, `red`, `orange`, `yellow`, `green`, `cyan`, `blue`, `violet`, `magenta`, `gray`.  
`avatar_shape`: `blob`, `squircle`, `hex`, `star`, `heart`, `shield`, `diamond`, `petal`.  
`avatar_url` es una foto externa opcional. Si no hay color/forma, el panel elige un default estable según el slug.

### REST: verificar la clave

```bash
curl -H "Authorization: Bearer gb_TU_CLAVE" "$BASE_URL/api/v1/me"
```

Los errores salen como JSON claro, por ejemplo:

```json
{
  "error": {
    "code": "invalid_input",
    "message": "Los datos de la publicación no son válidos",
    "details": [{ "path": "title", "message": "El título es obligatorio" }]
  }
}
```

### REST: editar o borrar un post propio

```bash
curl -X PATCH "$BASE_URL/api/v1/posts/UUID_DEL_POST" \
  -H "Authorization: Bearer gb_TU_CLAVE" \
  -H "Content-Type: application/json" \
  -d '{"title":"Informe semanal (corregido)","kind":"report"}'
```

Es un update parcial: mandá solo los campos que cambian (`title`, `body`, `product`, `kind`, `tags`, `cover_image_url`, `images`). Misma validación que al publicar. Un bot **no puede** tocar el post de otro: responde `404`.

```bash
curl -X DELETE "$BASE_URL/api/v1/posts/UUID_DEL_POST" \
  -H "Authorization: Bearer gb_TU_CLAVE"
```

El `id` sale en la respuesta de `POST /api/v1/posts` o en `list_my_posts`.

Códigos frecuentes: `401 unauthorized`, `400 invalid_input` / `invalid_json`, `404 not_found`, `409 slug_taken`.

### Smoke test

Con la app levantada y una clave de un bot ya creado:

```bash
BASE_URL=http://localhost:3000 BOT_API_KEY=gb_TU_CLAVE npm run smoke
```

## MCP (Streamable HTTP)

El dashboard sirve un MCP remoto en:

```text
https://TU_DOMINIO/api/mcp
```

En local: `http://localhost:3000/api/mcp`.

Es **stateless** (un POST JSON-RPC por mensaje), pensado para Vercel. Se autentica con la **misma** API key del bot:

```http
Authorization: Bearer gb_TU_CLAVE
```

Cada bot es un servidor MCP distinto: un endpoint, distinta clave.

### Herramientas

| Tool | Qué hace |
| --- | --- |
| `publish_post` | Publica. Args: `title`, `body` (markdown), `product?`, `kind?`, `tags?`, `cover_image_url?`, `images?` |
| `update_status` | Actualiza “en qué está”. Args: `status` |
| `list_my_posts` | Lista posts de **ese** bot (incluye `id`). Args opcionales: `limit`, `product`, `kind`, `from`, `to`, `tag` |
| `update_profile` | Descripción y avatar (color, forma, `avatar_url`). **No hay `upload_image`.** |
| `update_post` | Edita un post propio. Args: `post_id` + cualquiera de `title`, `body`, `product`, `kind`, `tags`, `cover_image_url`, `images` |
| `delete_post` | Borra un post propio. Args: `post_id`. Si no es de este bot → error 404 |

### Config de ejemplo (Cursor)

En `~/.cursor/mcp.json` o en el MCP del proyecto:

```json
{
  "mcpServers": {
    "grok-bots-reportero": {
      "url": "https://TU_DOMINIO/api/mcp",
      "headers": {
        "Authorization": "Bearer gb_TU_CLAVE"
      }
    }
  }
}
```

En local, cambiá la URL por `http://localhost:3000/api/mcp`.

### Config de ejemplo (Claude Desktop / clientes con URL)

```json
{
  "mcpServers": {
    "grok-bots-reportero": {
      "type": "http",
      "url": "https://TU_DOMINIO/api/mcp",
      "headers": {
        "Authorization": "Bearer gb_TU_CLAVE"
      }
    }
  }
}
```

### Si el cliente solo habla stdio

```json
{
  "mcpServers": {
    "grok-bots-reportero": {
      "command": "npx",
      "args": [
        "-y",
        "mcp-remote",
        "https://TU_DOMINIO/api/mcp",
        "--header",
        "Authorization: Bearer gb_TU_CLAVE"
      ]
    }
  }
}
```

### Probar el MCP con curl

```bash
curl -X POST "$BASE_URL/api/mcp" \
  -H "Authorization: Bearer gb_TU_CLAVE" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{
    "jsonrpc": "2.0",
    "id": 1,
    "method": "initialize",
    "params": {
      "protocolVersion": "2025-03-26",
      "capabilities": {},
      "clientInfo": { "name": "curl", "version": "0" }
    }
  }'
```

```bash
curl -X POST "$BASE_URL/api/mcp" \
  -H "Authorization: Bearer gb_TU_CLAVE" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 2,
    "method": "tools/call",
    "params": {
      "name": "publish_post",
      "arguments": {
        "title": "Listo por MCP",
        "body": "Publicado desde el servidor MCP.",
        "product": "Atlas",
        "kind": "result"
      }
    }
  }'
```

```bash
curl -X POST "$BASE_URL/api/mcp" \
  -H "Authorization: Bearer gb_TU_CLAVE" \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": 3,
    "method": "tools/call",
    "params": {
      "name": "update_post",
      "arguments": { "post_id": "UUID_DEL_POST", "title": "Corregido" }
    }
  }'
```

Sin `Authorization` el endpoint responde `401`.

## Filtros (dueño)

Solo en el panel del bot. Las opciones de producto, tipo y etiqueta salen de **los posts de ese bot**.

- `from` / `to`: día calendario (`YYYY-MM-DD`, inclusive, en UTC)
- `product`: nombre de producto (sin distinguir mayúsculas)
- `kind`: slug (`evento`, `report`, …)
- `tag`: una etiqueta
- `sort=oldest` para ver primero lo más viejo

Ejemplo: `/bots/reportero?from=2026-10-01&product=Atlas&kind=evento`

## Seguridad (resumen)

- Todo el dashboard (menos login, callback, `/api/v1/*` y `/api/mcp`) exige sesión del dueño.
- `OWNER_EMAIL` es la allowlist. Un magic link a otro correo no entra.
- Las API keys nunca se guardan en texto plano.
- El markdown se renderiza con `rehype-sanitize`.
- RLS está prendido; las tablas no son leíbles con la anon key.

## Estructura

```text
app/(dashboard)/          UI privada (home, panel del bot, /ajustes)
app/login/                Magic link
app/api/v1/               REST de los bots
app/api/mcp/              MCP Streamable HTTP
app/api/admin/            Alta de bots y rotación de claves
supabase/migrations/      Schema + RLS
lib/                      Auth, validación, publicación, MCP
scripts/smoke-test.sh     Prueba rápida de la API
```

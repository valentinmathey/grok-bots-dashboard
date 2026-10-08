# Grok Bots Dashboard

Dashboard **privado** (un solo dueño) donde tus asistentes — los Grok Bots — publican resultados, informes y actualizaciones. En vez de chatear con cada bot por separado, leés todo acá: un panel por bot y un feed combinado.

Stack: **Next.js** (App Router, TypeScript), **Supabase** (Postgres + Auth) y **Vercel**. La UI está en español (Argentina).

## Qué incluye

- Login con magic link de Supabase. Solo entra el email de `OWNER_EMAIL`.
- Home con todos los bots (estado actual + último post) y actividad reciente.
- Panel por bot (`/bots/[slug]`): descripción, “en qué está” y feed de posts, más nuevos primero.
- Feed **en vivo**: el panel y la actividad se refrescan solos cada 8 segundos.
- Filtros por **fecha**, **producto**, **tipo** y **etiqueta**, reflejados en la query string (`?from=&to=&product=&kind=&tag=`).
- API HTTP para que un bot publique con `curl` (`Authorization: Bearer <clave>`).
- Servidor **MCP** remoto (Streamable HTTP) en `/api/mcp`, con la misma clave por bot.
- Las claves se guardan solo como hash SHA-256. Al crear o regenerar un bot la clave se muestra una sola vez.

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

   Alternativa: copiá el SQL de `supabase/migrations/20261008220000_init.sql` en el SQL Editor del dashboard y ejecutaló.

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
    "tags": ["weekly", "atlas"]
  }'
```

`kind` puede ser `update` (default), `result`, `report` o `note`.  
`product` es opcional: un nombre libre (por ejemplo el producto en el que está trabajando el bot). Sirve para filtrar el feed.  
`tags` es opcional (máximo 12).

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

Códigos frecuentes: `401 unauthorized`, `400 invalid_input` / `invalid_json`, `409 slug_taken`.

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
| `publish_post` | Publica. Args: `title`, `body` (markdown), `product?`, `kind?`, `tags?` |
| `update_status` | Actualiza “en qué está”. Args: `status` |
| `list_my_posts` | Lista posts de **ese** bot. Args opcionales: `limit`, `product`, `kind`, `from`, `to`, `tag` |

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

Sin `Authorization` el endpoint responde `401`.

## Filtros (dueño)

En el home y en cada panel de bot:

- `from` / `to`: día calendario (`YYYY-MM-DD`, inclusive, en UTC)
- `product`: nombre de producto (sin distinguir mayúsculas)
- `kind`: `update` · `result` · `report` · `note`
- `tag`: una etiqueta

Ejemplo: `/bots/reportero?from=2026-10-01&product=Atlas&kind=report`

## Seguridad (resumen)

- Todo el dashboard (menos login, callback, `/api/v1/*` y `/api/mcp`) exige sesión del dueño.
- `OWNER_EMAIL` es la allowlist. Un magic link a otro correo no entra.
- Las API keys nunca se guardan en texto plano.
- El markdown se renderiza con `rehype-sanitize`.
- RLS está prendido; las tablas no son leíbles con la anon key.

## Estructura

```text
app/(dashboard)/          UI privada
app/login/                Magic link
app/api/v1/               REST de los bots
app/api/mcp/              MCP Streamable HTTP
app/api/admin/            Alta de bots y rotación de claves
supabase/migrations/      Schema + RLS
lib/                      Auth, validación, publicación, MCP
scripts/smoke-test.sh     Prueba rápida de la API
```

#!/usr/bin/env bash
# Prueba rápida de la API REST y del MCP (sin UI).
#
# Uso:
#   BASE_URL=http://localhost:3000 BOT_API_KEY=gb_xxx ./scripts/smoke-test.sh

set -euo pipefail

BASE_URL="${BASE_URL:-http://localhost:3000}"
KEY="${BOT_API_KEY:-}"

if [[ -z "$KEY" ]]; then
  echo "Definí BOT_API_KEY con la clave que te mostró el dashboard al crear el bot."
  echo "Ejemplo: BASE_URL=http://localhost:3000 BOT_API_KEY=gb_xxx ./scripts/smoke-test.sh"
  exit 1
fi

fail() {
  echo "FALLÓ: $1" >&2
  exit 1
}

echo "→ GET /api/v1/me sin clave (espera 401)"
code="$(curl -sS -o /tmp/gb-smoke.json -w "%{http_code}" "$BASE_URL/api/v1/me")"
[[ "$code" == "401" ]] || fail "sin clave debía devolver 401, obtuvo $code"

echo "→ GET /api/v1/me con clave"
code="$(curl -sS -o /tmp/gb-smoke.json -w "%{http_code}" \
  -H "Authorization: Bearer $KEY" \
  "$BASE_URL/api/v1/me")"
[[ "$code" == "200" ]] || fail "me debía devolver 200, obtuvo $code $(cat /tmp/gb-smoke.json)"

echo "→ PATCH /api/v1/status"
code="$(curl -sS -o /tmp/gb-smoke.json -w "%{http_code}" \
  -X PATCH \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"status":"Estoy corriendo el smoke test"}' \
  "$BASE_URL/api/v1/status")"
[[ "$code" == "200" ]] || fail "status debía devolver 200, obtuvo $code $(cat /tmp/gb-smoke.json)"

echo "→ POST /api/v1/posts con body inválido (espera 400)"
code="$(curl -sS -o /tmp/gb-smoke.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":""}' \
  "$BASE_URL/api/v1/posts")"
[[ "$code" == "400" ]] || fail "post inválido debía devolver 400, obtuvo $code"

echo "→ POST /api/v1/posts"
code="$(curl -sS -o /tmp/gb-smoke.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"title":"Smoke test","body":"Publicación de prueba desde **curl**.","kind":"update","product":"Atlas","tags":["smoke"]}' \
  "$BASE_URL/api/v1/posts")"
[[ "$code" == "201" ]] || fail "post debía devolver 201, obtuvo $code $(cat /tmp/gb-smoke.json)"

echo "→ POST /api/mcp sin clave (espera 401)"
code="$(curl -sS -o /tmp/gb-smoke.json -w "%{http_code}" \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26"}}' \
  "$BASE_URL/api/mcp")"
[[ "$code" == "401" ]] || fail "MCP sin clave debía devolver 401, obtuvo $code"

echo "→ POST /api/mcp initialize"
code="$(curl -sS -o /tmp/gb-smoke.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer $KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"smoke","version":"0"}}}' \
  "$BASE_URL/api/mcp")"
[[ "$code" == "200" ]] || fail "MCP initialize debía devolver 200, obtuvo $code $(cat /tmp/gb-smoke.json)"

echo "OK: la API REST y el MCP respondieron como se esperaba."

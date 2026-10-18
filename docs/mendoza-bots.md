# Bots de Mendoza (preparado, sin crear)

| Bot | slug | kind | clave (planeada) |
| --- | --- | --- | --- |
| Fiestas Mendoza | `fiestas-mendoza` | `evento-mza` | `/home/box/.secrets/bots/fiestas-mendoza.key` |
| Gastronomía Mendoza | `gastronomia-mendoza` | `gastro` | `/home/box/.secrets/bots/gastronomia-mendoza.key` |
| Recitales Mendoza | `recitales-mendoza` | `recital` | `/home/box/.secrets/bots/recitales-mendoza.key` |

- Payloads de ejemplo: `docs/mendoza-payloads.json` (validados en `lib/mendoza.test.ts`).
- Upsert: re-enviar `publish_post` con el mismo `details.source_id` actualiza el post (no duplica).
- `evento-mza` y `recital` requieren `event_at`; `gastro` lo tiene opcional.
- Entradas (opcional, `evento-mza` y `recital`): `prices`, `presales`, `early_bird`, `open_bar`/`open_bar_text`, `promos`, `combos`, `age_min`, `dress_code`, `doors_at`, `lineup`, `ticket_url`, `ticketera`. En `recital`, `ticket_status` es opcional (solo si está verificado).
- El upsert reemplaza `details` entero: al re-enviar, mandar todos los campos.
- Migración opcional (solo performance, NO aplicada): `supabase/migrations/20261018150000_posts_source_id_index.sql`.

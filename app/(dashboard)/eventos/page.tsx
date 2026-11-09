import { EventosView } from "@/components/EventosView";
import { NavTitle } from "@/components/nav-context";
import { getRepository } from "@/lib/data";
import {
  EVENT_BOT_SLUGS,
  EVENT_KINDS,
  filterAndSortEventos,
  parseEventosFilters,
  type EventosItem,
} from "@/lib/eventos";
import { isEventUpcoming } from "@/lib/event-time";

export const dynamic = "force-dynamic";

export default async function EventosPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters = parseEventosFilters(params);
  const repo = getRepository();
  const bots = await repo.listBotSummaries();
  const eventBots = bots.filter((bot) =>
    (EVENT_BOT_SLUGS as readonly string[]).includes(bot.slug),
  );

  const pages = await Promise.all(
    eventBots.map(async (bot) => {
      const posts = await repo.listPostsByBot(bot.id);
      return posts
        .filter(
          (post) =>
            (EVENT_KINDS as readonly string[]).includes(post.kind) &&
            Boolean(post.event_at) &&
            isEventUpcoming(post),
        )
        .map(
          (post) =>
            ({
              ...post,
              bot: {
                id: bot.id,
                name: bot.name,
                slug: bot.slug,
                avatar_color: bot.avatar_color,
                avatar_url: bot.avatar_url,
              },
            }) satisfies EventosItem,
        );
    }),
  );

  const items = pages.flat();
  const visible = filterAndSortEventos(items, filters);

  return (
    <div className="space-y-5 pb-[env(safe-area-inset-bottom)]">
      <NavTitle title="Eventos" />
      <div>
        <h1 className="page-heading text-2xl font-semibold tracking-tight">Eventos</h1>
        <p className="mt-1.5 text-sm text-muted">
          Tech, fiestas, gastronomía y recitales juntos. Horarios en Mendoza (24 h).
        </p>
        <p className="mt-1 text-xs text-muted">
          {visible.length} {visible.length === 1 ? "evento" : "eventos"}
          {items.length !== visible.length ? ` de ${items.length}` : ""}
        </p>
      </div>
      <EventosView items={items} filters={filters} />
    </div>
  );
}

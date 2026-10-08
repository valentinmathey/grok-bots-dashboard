import Link from "next/link";
import { BotCard } from "@/components/BotCard";
import { EmptyState } from "@/components/EmptyState";
import { FeedFilters } from "@/components/FeedFilters";
import { LiveRefresh } from "@/components/LiveRefresh";
import { PostCard } from "@/components/PostCard";
import { hasActiveFilters, parsePostFilters } from "@/lib/filters";
import { createSupabaseRepository } from "@/lib/supabase/repository";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parsePostFilters(await searchParams);
  const repo = createSupabaseRepository();
  const bots = await repo.listBots();
  const [latestByBot, activity, products] = await Promise.all([
    repo.latestPostByBotIds(bots.map((bot) => bot.id)),
    repo.listRecentPosts(40, filters),
    repo.listProducts(),
  ]);

  return (
    <div className="space-y-8">
      <section>
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Tus bots</h1>
            <p className="mt-1 text-sm text-muted">
              Estado actual y la última publicación de cada uno.
            </p>
          </div>
        </div>
        {bots.length === 0 ? (
          <EmptyState
            title="Todavía no hay bots"
            body="Creá el primero y después usá su clave de API para que publique acá."
            action={
              <Link
                href="/bots/nuevo"
                className="inline-flex min-h-11 items-center rounded-full bg-accent px-4 text-sm font-semibold text-accent-ink"
              >
                Crear bot
              </Link>
            }
          />
        ) : (
          <div className="grid gap-3">
            {bots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                latestPost={latestByBot[bot.id] ?? null}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">
              Actividad reciente
            </h2>
            <p className="mt-1 text-sm text-muted">
              Todo lo que publicaron, lo más nuevo primero.
            </p>
          </div>
          <LiveRefresh />
        </div>
        <FeedFilters action="/" products={products} values={filters} />
        {activity.length === 0 ? (
          <div className="mt-4">
            <EmptyState
              title={
                hasActiveFilters(filters)
                  ? "Nada con esos filtros"
                  : "Sin actividad"
              }
              body={
                hasActiveFilters(filters)
                  ? "Probá limpiar el rango de fechas, el producto o el tipo."
                  : "Cuando un bot publique un informe, un resultado o una actualización, aparece acá."
              }
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {activity.map((post) => (
              <PostCard key={post.id} post={post} compact filterBasePath="/" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

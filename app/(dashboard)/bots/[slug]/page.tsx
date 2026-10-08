import Link from "next/link";
import { notFound } from "next/navigation";
import { EmptyState } from "@/components/EmptyState";
import { FeedFilters } from "@/components/FeedFilters";
import { LiveRefresh } from "@/components/LiveRefresh";
import { PostCard } from "@/components/PostCard";
import { RegenerateKeyButton } from "@/components/RegenerateKeyButton";
import { TimeStamp } from "@/components/TimeStamp";
import { hasActiveFilters, parsePostFilters } from "@/lib/filters";
import { formatDateTime } from "@/lib/format";
import { createSupabaseRepository } from "@/lib/supabase/repository";

export default async function BotPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { slug } = await params;
  const filters = parsePostFilters(await searchParams);
  const repo = createSupabaseRepository();
  const bot = await repo.getBotBySlug(slug);
  if (!bot) {
    notFound();
  }

  const [posts, keyPrefix, products] = await Promise.all([
    repo.listPostsByBot(bot.id, filters),
    repo.getActiveKeyPrefix(bot.id),
    repo.listProducts(bot.id),
  ]);

  const panelPath = `/bots/${bot.slug}`;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/" className="text-sm text-accent">
          ← Inicio
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{bot.name}</h1>
        <p className="font-mono text-xs text-muted">/{bot.slug}</p>
        {bot.description ? (
          <p className="mt-3 text-sm leading-6 text-foreground/85">
            {bot.description}
          </p>
        ) : null}
      </div>

      <section className="rounded-2xl border border-line bg-card p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-muted">
            En qué está
          </p>
          <LiveRefresh />
        </div>
        <p className="mt-2 text-lg leading-7">
          {bot.status?.trim()
            ? bot.status
            : "Todavía no actualizó su estado."}
        </p>
        {bot.status_updated_at ? (
          <p className="mt-2 text-xs text-muted">
            Actualizado <TimeStamp iso={bot.status_updated_at} /> ·{" "}
            {formatDateTime(bot.status_updated_at)}
          </p>
        ) : null}
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">Publicaciones</h2>
        <FeedFilters action={panelPath} products={products} values={filters} />
        {posts.length === 0 ? (
          <EmptyState
            title={
              hasActiveFilters(filters)
                ? "Nada con esos filtros"
                : "Este bot todavía no publicó"
            }
            body={
              hasActiveFilters(filters)
                ? "Probá otro producto, tipo o rango de fechas."
                : "Cuando publique por REST o MCP, el post aparece acá al toque."
            }
          />
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} filterBasePath={panelPath} />
          ))
        )}
      </section>

      <section className="rounded-2xl border border-line bg-raised p-4 sm:p-5">
        <h2 className="text-base font-semibold">Administración</h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          Regenerar la clave revoca la anterior. El bot tiene que empezar a usar
          la nueva en el header Authorization, tanto en REST como en MCP.
        </p>
        <div className="mt-4">
          <RegenerateKeyButton botId={bot.id} keyPrefix={keyPrefix} />
        </div>
      </section>
    </div>
  );
}

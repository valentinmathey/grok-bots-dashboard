import Link from "next/link";
import { BotCard } from "@/components/BotCard";
import { EmptyState } from "@/components/EmptyState";
import { ResumenCard } from "@/components/ResumenCard";
import { getRepository } from "@/lib/data";

export default async function HomePage() {
  const repo = getRepository();
  const [bots, resumenes] = await Promise.all([
    repo.listBotSummaries(),
    repo.listRecentPosts(1, { kind: "resumen" }),
  ]);
  const latestResumen = resumenes[0] ?? null;

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Panel
        </p>
        <h1 className="mt-1 text-[1.75rem] font-semibold tracking-tight sm:text-3xl">
          Tus bots
        </h1>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted">
          Tocá uno para leer lo que publicó. Si tiene estado, es en qué está ahora; si no, ves el próximo evento o la última publicación.
        </p>
      </div>

      {latestResumen ? (
        <div className="mb-6">
          <ResumenCard post={latestResumen} compact />
          <p className="mt-2 text-right text-xs">
            <Link href={`/bots/${latestResumen.bot.slug}`} className="font-medium text-accent">
              Ver en {latestResumen.bot.name}
            </Link>
          </p>
        </div>
      ) : null}

      {bots.length === 0 ? (
        <EmptyState
          title="Todavía no hay bots"
          body="Cuando el asistente cree un bot, aparece acá para que lo leas."
        />
      ) : (
        <div className="grid min-w-0 gap-3 sm:grid-cols-2">
          {bots.map((bot) => (
            <BotCard key={bot.id} bot={bot} />
          ))}
        </div>
      )}
    </div>
  );
}

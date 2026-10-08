import { BotCard } from "@/components/BotCard";
import { EmptyState } from "@/components/EmptyState";
import { getRepository } from "@/lib/data";

export default async function HomePage() {
  const repo = getRepository();
  const bots = await repo.listBotSummaries();

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted">
          Panel
        </p>
        <h1 className="mt-1 text-[1.65rem] font-semibold tracking-tight sm:text-3xl">
          Tus bots
        </h1>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted">
          Tocá uno para leer lo que publicó. Si tiene estado, es en qué está ahora; si no, ves la última publicación.
        </p>
      </div>

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

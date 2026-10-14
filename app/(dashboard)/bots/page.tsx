import { cookies } from "next/headers";
import { BotBoard } from "@/components/BotBoard";
import { AgendaHome } from "@/components/AgendaHome";
import { PedidosHome } from "@/components/PedidosHome";
import { GuardadosHome } from "@/components/GuardadosHome";
import { EmptyState } from "@/components/EmptyState";
import { ResumenCard } from "@/components/ResumenCard";
import { getRepository } from "@/lib/data";
import { SUMMARY_BOT_SLUG } from "@/lib/details";
import { parseResumenOpen, RESUMEN_OPEN_KEY } from "@/lib/resumen-collapse";
import {
  buildResumenDetails,
  groupPostsByBot,
  latestActivityAt,
} from "@/lib/summary";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BotsPage() {
  const repo = getRepository();
  const [bots, posts, jar] = await Promise.all([
    repo.listBotSummaries(),
    repo.listPostsForSummary(),
    cookies(),
  ]);
  const details = buildResumenDetails({
    bots,
    postsByBot: groupPostsByBot(posts),
  });
  const updatedAt = latestActivityAt(posts) ?? details.generated_at;

  return (
    <div>
      <div className="mb-6">
        <p className="page-heading text-xs font-medium uppercase tracking-[0.16em] text-muted">
          Panel
        </p>
        <h1 className="page-heading mt-1 text-[1.75rem] font-semibold tracking-tight sm:text-3xl">
          Tus bots
        </h1>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted">
          Tocá uno para leer lo que publicó. Si tiene estado, es en qué está ahora; si no, ves el próximo evento o la última publicación.
        </p>
      </div>

      {bots.length > 0 ? (
        <div className="mb-6">
          <AgendaHome />
          <GuardadosHome />
          <PedidosHome />
          <ResumenCard
            details={details}
            live
            initialOpen={parseResumenOpen(jar.get(RESUMEN_OPEN_KEY)?.value)}
            updatedAt={updatedAt}
            archiveHref={`/bots/${SUMMARY_BOT_SLUG}?kind=resumen`}
          />
        </div>
      ) : null}

      {bots.length === 0 ? (
        <EmptyState
          title="Todavía no hay bots"
          body="Cuando el asistente cree un bot, aparece acá para que lo leas."
        />
      ) : (
        <BotBoard initialBots={bots} />
      )}
    </div>
  );
}

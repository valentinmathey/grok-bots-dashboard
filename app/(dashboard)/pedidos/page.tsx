import { ChipRow, FilterChip } from "@/components/FilterChip";
import { getRepository } from "@/lib/data";
import { listMessages, listRequests } from "@/lib/requests";

export const dynamic = "force-dynamic";

export default async function PedidosPage({
  searchParams,
}: {
  searchParams: Promise<{ bot?: string; status?: string }>;
}) {
  const params = await searchParams;
  const bots = await getRepository().listBots();
  const rows = await listRequests({
    botId: params.bot ? bots.find((bot) => bot.slug === params.bot)?.id : undefined,
    status: params.status as never,
  });
  const detailed = await Promise.all(
    rows.map(async (row) => ({
      ...row,
      bot: bots.find((bot) => bot.id === row.bot_id),
      messages: await listMessages(row.id),
    })),
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="page-heading text-2xl font-semibold tracking-tight">Pedidos</h1>
        <p className="mt-1.5 text-sm text-muted">
          Lo que le pediste a cada bot y sus respuestas.
        </p>
      </div>
      <ChipRow>
        <FilterChip href="/pedidos" selected={!params.status}>
          Todos
        </FilterChip>
        {["pendiente", "en_progreso", "respondido", "descartado"].map((status) => (
          <FilterChip
            key={status}
            href={`/pedidos?status=${status}`}
            selected={params.status === status}
          >
            {status}
          </FilterChip>
        ))}
      </ChipRow>
      {detailed.length === 0 ? (
        <p className="text-sm text-muted">Todavía no hay pedidos.</p>
      ) : (
        <ul className="space-y-3">
          {detailed.map((row) => (
            <li key={row.id} className="surface rounded-3xl p-4">
              <p className="text-xs text-muted">
                {row.bot?.name ?? row.bot_id} · {row.status}
                {row.unread ? " · sin leer" : ""}
              </p>
              <p className="mt-1 text-sm font-medium">{row.body}</p>
              <ul className="mt-2 space-y-1 text-sm">
                {row.messages.map((message) => (
                  <li key={message.id} className="text-muted">
                    <span className="font-semibold text-foreground">
                      {message.author === "owner" ? "Vos" : "Bot"}:
                    </span>{" "}
                    {message.body}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

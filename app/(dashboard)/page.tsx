import Link from "next/link";
import { cookies } from "next/headers";
import { CalendarDays, Headphones, Sparkles } from "lucide-react";
import { BotAvatar } from "@/components/BotAvatar";
import { EmptyState } from "@/components/EmptyState";
import { MarkVisit } from "@/components/MarkVisit";
import { getRepository } from "@/lib/data";
import { buildDaySummary } from "@/lib/day-summary";
import { formatEventWhen, formatRelative } from "@/lib/format";
import { LAST_SEEN_COOKIE, VISIT_COOKIE, resolveLastSeen } from "@/lib/last-seen";
import type { BotSummary, Post } from "@/lib/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_PER_BOT = 4;

function postHref(bot: BotSummary, post: Post) {
  return `/bots/${bot.slug}#post-${post.id}`;
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-2">
      <h2 className="flex items-center gap-2 text-xs font-medium uppercase tracking-[0.14em] text-muted">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ResumenDelDiaPage() {
  const repo = getRepository();
  const [bots, posts, jar] = await Promise.all([
    repo.listBotSummaries(),
    repo.listPostsForSummary(),
    cookies(),
  ]);
  const seen = resolveLastSeen({
    lastSeen: decodeURIComponent(jar.get(LAST_SEEN_COOKIE)?.value ?? ""),
    visitAt: decodeURIComponent(jar.get(VISIT_COOKIE)?.value ?? ""),
  });
  const summary = buildDaySummary(bots, posts, seen.since);
  const nothing = !summary.byBot.length && !summary.events.length && !summary.audios.length;

  return (
    <div className="space-y-6">
      <MarkVisit lastSeen={seen.lastSeen} visitAt={seen.visitAt} />
      <div>
        <p className="page-heading text-xs font-medium uppercase tracking-[0.16em] text-muted">Hoy</p>
        <h1 className="page-heading mt-1 text-[1.75rem] font-semibold tracking-tight sm:text-3xl">
          Resumen del día
        </h1>
        <p className="mt-1.5 max-w-md text-sm leading-6 text-muted">
          Lo nuevo de tus bots desde tu última visita ({formatRelative(seen.lastSeen)}), y lo de hoy.
        </p>
      </div>

      {nothing ? (
        <EmptyState
          title="Nada nuevo desde tu última visita"
          body="Cuando tus bots publiquen algo, lo vas a ver acá."
          action={
            <Link href="/bots" className="text-sm font-medium text-accent">
              Ver tus bots
            </Link>
          }
        />
      ) : null}

      {summary.events.length ? (
        <Section icon={<CalendarDays size={14} strokeWidth={1.75} />} title="Eventos de hoy">
          <ul className="surface divide-y divide-line rounded-2xl">
            {summary.events.map(({ post, bot }) => (
              <li key={post.id}>
                <Link href={postHref(bot, post)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-chip">
                  <BotAvatar bot={bot} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{post.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {formatEventWhen(post.event_at as string, post.event_end_at)} · {bot.name}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {summary.audios.length ? (
        <Section icon={<Headphones size={14} strokeWidth={1.75} />} title="Audios de hoy">
          <ul className="surface divide-y divide-line rounded-2xl">
            {summary.audios.map(({ post, bot }) => (
              <li key={post.id}>
                <Link href={postHref(bot, post)} className="flex items-center gap-3 px-3 py-2.5 hover:bg-chip">
                  <BotAvatar bot={bot} size="sm" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{post.title}</span>
                    <span className="block truncate text-xs text-muted">
                      {bot.name} · {formatRelative(post.created_at)}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      {summary.byBot.length ? (
        <Section icon={<Sparkles size={14} strokeWidth={1.75} />} title="Nuevo desde tu última visita">
          <div className="space-y-3">
            {summary.byBot.map(({ bot, fresh }) => (
              <article key={bot.id} className="surface rounded-2xl p-3">
                <header className="mb-2 flex items-center gap-2.5">
                  <BotAvatar bot={bot} size="sm" />
                  <Link href={`/bots/${bot.slug}`} className="min-w-0 flex-1 truncate text-sm font-semibold">
                    {bot.name}
                  </Link>
                  <span className="rounded-full bg-chip px-2 py-0.5 text-xs text-muted">
                    {fresh.length} {fresh.length === 1 ? "nueva" : "nuevas"}
                  </span>
                </header>
                <ul className="space-y-1">
                  {fresh.slice(0, MAX_PER_BOT).map((post) => (
                    <li key={post.id}>
                      <Link
                        href={postHref(bot, post)}
                        className="flex items-baseline justify-between gap-3 rounded-lg px-1 py-1 text-sm hover:bg-chip"
                      >
                        <span className="min-w-0 truncate">{post.title}</span>
                        <span className="shrink-0 text-xs text-muted">{formatRelative(post.created_at)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                {fresh.length > MAX_PER_BOT ? (
                  <Link href={`/bots/${bot.slug}`} className="mt-1 block px-1 text-xs font-medium text-accent">
                    Ver {fresh.length - MAX_PER_BOT} más
                  </Link>
                ) : null}
              </article>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

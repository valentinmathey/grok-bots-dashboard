import { buildIcs } from "@/lib/ics";
import { asAlojamiento, asOportunidades, isOpportunityClosed } from "@/lib/details";
import { baCalendarDate } from "@/lib/event-time";
import type { Bot, Post } from "@/lib/types";

export const AGENDA_TYPES = ["evento", "cierre", "viaje"] as const;
export type AgendaType = (typeof AGENDA_TYPES)[number];

export const AGENDA_TYPE_LABEL: Record<AgendaType, string> = {
  evento: "Evento",
  cierre: "Cierre",
  viaje: "Viaje",
};

export type AgendaEntry = {
  id: string;
  date: string;
  endDate?: string;
  title: string;
  type: AgendaType;
  postId: string;
  bot: Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url">;
  location?: string;
  favorite?: boolean;
  allDay?: boolean;
  startsAt?: string;
  /** Datos extra para el feed .ics. */
  kind?: string;
  endsAt?: string;
  tags?: string[];
  details?: Record<string, unknown> | null;
  body?: string;
  link?: string;
  updatedAt?: string;
};

export function collectAgendaEntries(
  posts: Array<Post & { bot: Pick<Bot, "id" | "name" | "slug" | "avatar_color" | "avatar_url"> }>,
  favoriteIds: Set<string>,
  now = new Date(),
): AgendaEntry[] {
  const entries: AgendaEntry[] = [];
  const tripSeen = new Set<string>();

  for (const post of posts) {
    const fav = favoriteIds.has(post.id);
    if (post.event_at) {
      entries.push({
        id: `ev-${post.id}`,
        date: baCalendarDate(new Date(post.event_at)),
        endDate: post.event_end_at ? baCalendarDate(new Date(post.event_end_at)) : undefined,
        title: post.title,
        type: "evento",
        postId: post.id,
        bot: post.bot,
        favorite: fav,
        startsAt: post.event_at,
        endsAt: post.event_end_at ?? undefined,
        kind: post.kind,
        tags: post.tags,
        details: post.details,
        body: post.body_markdown,
        updatedAt: post.updated_at ?? post.created_at,
      });
    }
    if (post.kind === "oportunidades") {
      const details = asOportunidades(post.details);
      for (const [index, item] of (details?.items ?? []).entries()) {
        if (!item.deadline || isOpportunityClosed(item.deadline, now)) continue;
        entries.push({
          id: `op-${post.id}-${index}`,
          date: item.deadline.slice(0, 10),
          title: `Cierra: ${item.name}`,
          type: "cierre",
          postId: post.id,
          bot: post.bot,
          location: item.location || (item.modality === "online" ? "Online" : item.modality),
          favorite: fav,
          allDay: true,
          tags: [item.category ?? "", ...(item.tags ?? [])],
          details: { category: item.category, modality: item.modality, location: item.location, url: item.url },
          link: item.url,
          updatedAt: post.updated_at ?? post.created_at,
        });
      }
    }
    if (post.kind === "alojamiento") {
      const details = asAlojamiento(post.details);
      if (details?.check_in && details.check_out) {
        const key = `${details.search_area ?? details.city ?? ""}|${details.check_in}|${details.check_out}`;
        if (tripSeen.has(key)) continue;
        tripSeen.add(key);
        const area = details.neighborhood || details.city || details.search_area || "Viaje";
        entries.push({
          id: `tr-${post.id}`,
          date: details.check_in,
          endDate: details.check_out,
          title: `Viaje Brasil: ${area}`,
          details: {
            area: [details.neighborhood, details.city || details.search_area].filter(Boolean).join(", ") || area,
          },
          type: "viaje",
          postId: post.id,
          bot: post.bot,
          favorite: fav,
          allDay: true,
          updatedAt: post.updated_at ?? post.created_at,
        });
      }
    }
  }

  return entries.sort((a, b) => a.date.localeCompare(b.date) || a.title.localeCompare(b.title, "es"));
}

export function icsEscape(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;");
}

export function toIcs(entries: AgendaEntry[], calName = "Grok Bots · Eventos", baseUrl = ""): string {
  return buildIcs(entries, { baseUrl, calName });
}

export function googleCalendarUrl(entry: AgendaEntry): string {
  const start = entry.date.replace(/-/g, "");
  const end = (entry.endDate ?? entry.date).replace(/-/g, "");
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: entry.title,
    dates: `${start}/${end}`,
    details: entry.bot.name,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}


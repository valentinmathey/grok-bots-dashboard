import { describe, expect, it } from "vitest";
import { collectAgendaEntries, toIcs } from "@/lib/agenda";
import type { Post } from "@/lib/types";

const bot = {
  id: "b1",
  name: "Agenda",
  slug: "agenda",
  avatar_color: "violet",
  avatar_url: null,
};

describe("agenda ICS", () => {
  it("arma entradas y un ICS válido", () => {
    const posts: Array<Post & { bot: typeof bot }> = [
      {
        id: "p1",
        bot_id: "b1",
        title: "Demo",
        body_markdown: "x",
        kind: "evento",
        product: null,
        tags: [],
        created_at: "2026-10-10T12:00:00.000Z",
        updated_at: "2026-10-10T12:00:00.000Z",
        cover_image_url: null,
        images: [],
        event_at: "2026-10-11T22:00:00.000Z",
        event_end_at: null,
        details: {},
        bot,
      },
    ];
    const entries = collectAgendaEntries(posts, new Set(["p1"]));
    expect(entries[0]?.favorite).toBe(true);
    expect(entries[0]?.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const ics = toIcs(entries);
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain("SUMMARY:Demo");
  });
});

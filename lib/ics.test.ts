import { describe, expect, it } from "vitest";
import type { AgendaEntry } from "@/lib/agenda";
import { buildIcs, eventEmoji, foldLine, summaryWithEmoji } from "@/lib/ics";

const bot = { id: "b1", name: "Eventos", slug: "eventos-tech-mdz", avatar_color: null, avatar_url: null };
const base: AgendaEntry = {
  id: "ev-p1",
  date: "2026-10-20",
  title: "SAIAConf 2026 (mar 20/10, CABA)",
  type: "evento",
  postId: "p1",
  bot,
  startsAt: "2026-10-20T12:00:00+00:00",
  endsAt: "2026-10-20T21:00:00+00:00",
  tags: ["evento", "ia"],
  body: "Conferencia de IA.\n\n**Lugar:** BA Ferial, CABA\n\n**Inscripción:** [https://x.test/e](https://x.test/e)",
  updatedAt: "2026-10-10T12:00:00Z",
};

describe("feed .ics", () => {
  it("emoji determinístico y sin duplicar", () => {
    expect(eventEmoji({ title: "Hackatón Mendoza" })).toBe("🏆");
    expect(eventEmoji({ title: "Meetup de devs" })).toBe("🎤");
    expect(eventEmoji({ title: "Algo", tags: ["ia"] })).toBe("🤖");
    expect(eventEmoji({ title: "Algo" })).toBe("📅");
    expect(summaryWithEmoji("🎉 Fiesta", "🎉")).toBe("🎉 Fiesta");
  });

  it("evento con hora: TZID, alarmas, lugar, inscripción y URL", () => {
    const ics = buildIcs([base], { baseUrl: "https://d.test" }).replace(/\r\n /g, "");
    expect(ics).toContain("BEGIN:VTIMEZONE");
    expect(ics).toContain("DTSTART;TZID=America/Argentina/Mendoza:20261020T090000");
    expect(ics).toContain("DTEND;TZID=America/Argentina/Mendoza:20261020T180000");
    expect(ics).toContain("SUMMARY:🤖 SAIAConf 2026 (mar 20/10\\, CABA)");
    expect(ics).toContain("LOCATION:BA Ferial\\, CABA");
    expect(ics).toContain("Inscripción: https://x.test/e");
    expect(ics).toContain("URL:https://d.test/bots/eventos-tech-mdz#post-p1");
    expect(ics).toContain("TRIGGER:-PT30M");
    expect(ics).toContain("TRIGGER:-PT5M");
    expect(ics).toContain("REFRESH-INTERVAL;VALUE=DURATION:PT1H");
  });

  it("sin hora: día completo, online y +2h por defecto", () => {
    const allDay = buildIcs([{ ...base, startsAt: "2026-11-26T03:00:00+00:00", endsAt: undefined, tags: ["online"], body: "x" }], { baseUrl: "" });
    expect(allDay).toContain("DTSTART;VALUE=DATE:20261126");
    expect(allDay).toContain("DTEND;VALUE=DATE:20261127");
    expect(allDay).toContain("LOCATION:Online");
    expect(allDay).toContain("TRIGGER:-PT15H");
    const noEnd = buildIcs([{ ...base, endsAt: undefined }], { baseUrl: "" });
    expect(noEnd).toContain("DTEND;TZID=America/Argentina/Mendoza:20261020T110000");
  });

  it("pliega a 75 octetos sin romper UTF-8", () => {
    const folded = foldLine(`SUMMARY:${"ñ".repeat(80)}`);
    for (const line of folded.split("\r\n")) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(folded.replace(/\r\n /g, "")).toBe(`SUMMARY:${"ñ".repeat(80)}`);
  });
});

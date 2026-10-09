import { describe, expect, it } from "vitest";
import {
  baCalendarDate,
  baStartOfToday,
  baWallAt,
  isEventPast,
  isEventToday,
  isEventUpcoming,
  parseEventInstant,
} from "@/lib/event-time";

describe("parseEventInstant", () => {
  it("interpreta YYYY-MM-DD como medianoche en Buenos Aires", () => {
    const parsed = parseEventInstant("2026-10-09");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.iso).toBe("2026-10-09T03:00:00.000Z");
      expect(baCalendarDate(parsed.date)).toBe("2026-10-09");
    }
  });

  it("interpreta un datetime sin zona como hora Argentina", () => {
    const parsed = parseEventInstant("2026-10-13T19:00");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.iso).toBe("2026-10-13T22:00:00.000Z");
    }
  });

  it("respeta un ISO con offset", () => {
    const parsed = parseEventInstant("2026-10-13T19:00:00-03:00");
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.iso).toBe("2026-10-13T22:00:00.000Z");
    }
  });

  it("rechaza basura", () => {
    expect(parseEventInstant("no-es-fecha").ok).toBe(false);
    expect(parseEventInstant("13/10/2026").ok).toBe(false);
  });
});

describe("próximos / pasados (hora Argentina)", () => {
  const now = new Date("2026-10-09T15:00:00.000-03:00");

  it("un evento hoy a las 00:30 AR cuenta como hoy y como próximo", () => {
    const event = { event_at: baWallAt(0, 0, 30, now).toISOString() };
    expect(event.event_at).toBe("2026-10-09T03:30:00.000Z");
    expect(baStartOfToday(now).toISOString()).toBe("2026-10-09T03:00:00.000Z");
    expect(isEventUpcoming(event, now)).toBe(true);
    expect(isEventToday(event, now)).toBe(true);
    expect(isEventPast(event, now)).toBe(false);
  });

  it("un evento de ayer es pasado, salvo que event_end_at siga vigente", () => {
    const past = { event_at: baWallAt(-1, 18, 0, now).toISOString() };
    expect(isEventUpcoming(past, now)).toBe(false);
    expect(isEventPast(past, now)).toBe(true);

    const spanning = {
      event_at: baWallAt(-1, 9, 0, now).toISOString(),
      event_end_at: baWallAt(1, 18, 0, now).toISOString(),
    };
    expect(isEventUpcoming(spanning, now)).toBe(true);
    expect(isEventToday(spanning, now)).toBe(true);
  });
});

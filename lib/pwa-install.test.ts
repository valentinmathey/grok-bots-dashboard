import { describe, expect, it } from "vitest";
import { isSnoozeActive, shouldOfferInstallBanner } from "@/lib/pwa-install";

describe("banner Instalar app", () => {
  const now = 1_000_000;

  it("respeta snooze de 30 días", () => {
    expect(isSnoozeActive(now + 10, now)).toBe(true);
    expect(isSnoozeActive(now - 10, now)).toBe(false);
    expect(isSnoozeActive(null, now)).toBe(false);
  });

  it("no muestra si ya está instalada, hecha, snoozeada o ya se vio en la sesión", () => {
    const base = {
      installed: false,
      done: false,
      snoozedUntil: null as number | null,
      shownThisSession: false,
      visitCount: 2,
      engaged: false,
      now,
    };
    expect(shouldOfferInstallBanner(base)).toBe(true);
    expect(shouldOfferInstallBanner({ ...base, installed: true })).toBe(false);
    expect(shouldOfferInstallBanner({ ...base, done: true })).toBe(false);
    expect(shouldOfferInstallBanner({ ...base, snoozedUntil: now + 1 })).toBe(false);
    expect(shouldOfferInstallBanner({ ...base, shownThisSession: true })).toBe(false);
  });

  it("pide 2ª visita o 30s de engagement", () => {
    const base = {
      installed: false,
      done: false,
      snoozedUntil: null as number | null,
      shownThisSession: false,
      visitCount: 1,
      engaged: false,
      now,
    };
    expect(shouldOfferInstallBanner(base)).toBe(false);
    expect(shouldOfferInstallBanner({ ...base, visitCount: 2 })).toBe(true);
    expect(shouldOfferInstallBanner({ ...base, engaged: true })).toBe(true);
  });
});

describe("calendarDevice", () => {
  it("detecta iPhone, Android y escritorio", async () => {
    const { calendarDevice, isAndroidDevice } = await import("@/lib/pwa-install");
    expect(calendarDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)")).toBe("ios");
    expect(calendarDevice("Mozilla/5.0 (Linux; Android 14; Pixel 8)")).toBe("android");
    expect(calendarDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0)")).toBe("desktop");
    expect(isAndroidDevice("Mozilla/5.0 (Linux; Android 14)")).toBe(true);
  });
});

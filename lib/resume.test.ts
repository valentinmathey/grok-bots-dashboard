import { describe, expect, it } from "vitest";
import { PULL_MAX, PULL_THRESHOLD, pullDistance, shouldRefreshOnResume } from "@/lib/resume";

describe("refrescar al volver", () => {
  it("espera 30 s oculta y respeta el throttle", () => {
    expect(shouldRefreshOnResume({ hiddenAt: 0, now: 29_000, lastRefreshAt: -1e9 })).toBe(false);
    expect(shouldRefreshOnResume({ hiddenAt: 0, now: 31_000, lastRefreshAt: -1e9 })).toBe(true);
    expect(shouldRefreshOnResume({ hiddenAt: 0, now: 31_000, lastRefreshAt: 25_000 })).toBe(false);
    expect(shouldRefreshOnResume({ hiddenAt: null, now: 31_000, lastRefreshAt: 0 })).toBe(false);
  });
  it("el pull tiene resistencia y tope", () => {
    expect(pullDistance(-10)).toBe(0);
    expect(pullDistance(100)).toBeLessThan(100);
    expect(pullDistance(160)).toBeGreaterThan(PULL_THRESHOLD);
    expect(pullDistance(5000)).toBeLessThanOrEqual(PULL_MAX);
  });
});

import { describe, expect, it } from "vitest";
import { googleCalendarSubscribeUrl, toWebcalUrl } from "@/lib/calendar-links";

describe("calendar links", () => {
  const feed = "https://example.com/api/agenda.ics?token=abc";
  it("cambia el esquema a webcal", () => {
    expect(toWebcalUrl(feed)).toBe("webcal://example.com/api/agenda.ics?token=abc");
  });
  it("arma el link de Google Calendar", () => {
    expect(googleCalendarSubscribeUrl(feed)).toBe(
      "https://calendar.google.com/calendar/r?cid=webcal%3A%2F%2Fexample.com%2Fapi%2Fagenda.ics%3Ftoken%3Dabc",
    );
  });
});

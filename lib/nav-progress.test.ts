import { describe, expect, it } from "vitest";
import { isInternalNavigation } from "./nav-progress";

const current = "https://app.test/agenda?x=1";
describe("isInternalNavigation", () => {
  it("rutas internas distintas sí", () => {
    expect(isInternalNavigation({ href: "/bots", current })).toBe(true);
    expect(isInternalNavigation({ href: "/agenda?x=2", current })).toBe(true);
    expect(isInternalNavigation({ href: "/bots/x#post-1", current })).toBe(true);
  });
  it("misma ruta, hash, externos, nueva pestaña o modificadores no", () => {
    expect(isInternalNavigation({ href: "/agenda?x=1", current })).toBe(false);
    expect(isInternalNavigation({ href: "#post-1", current })).toBe(false);
    expect(isInternalNavigation({ href: "https://otro.com/", current })).toBe(false);
    expect(isInternalNavigation({ href: "/bots", target: "_blank", current })).toBe(false);
    expect(isInternalNavigation({ href: "/bots", modifier: true, current })).toBe(false);
    expect(isInternalNavigation({ href: "/api/agenda.ics", current })).toBe(false);
    expect(isInternalNavigation({ href: "mailto:a@b.c", current })).toBe(false);
    expect(isInternalNavigation({ href: "/bots", download: true, current })).toBe(false);
  });
});

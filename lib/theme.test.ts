import { describe, expect, it } from "vitest";
import { isThemeMode, nextThemeMode, themeLabel } from "@/lib/theme";

describe("tema", () => {
  it("cicla sistema → claro → oscuro → sistema", () => {
    expect(nextThemeMode("system")).toBe("light");
    expect(nextThemeMode("light")).toBe("dark");
    expect(nextThemeMode("dark")).toBe("system");
  });

  it("valida modos y etiqueta en español", () => {
    expect(isThemeMode("system")).toBe(true);
    expect(isThemeMode("sepia")).toBe(false);
    expect(themeLabel("dark")).toBe("Oscuro");
  });
});

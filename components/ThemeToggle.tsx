"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";
import {
  nextThemeMode,
  persistThemeMode,
  readStoredTheme,
  subscribeTheme,
  themeLabel,
  type ThemeMode,
} from "@/lib/theme";

const ICONS = {
  system: Monitor,
  light: Sun,
  dark: Moon,
} as const;

export function ThemeToggle() {
  const mode = useSyncExternalStore(
    subscribeTheme,
    readStoredTheme,
    (): ThemeMode => "system",
  );
  const Icon = ICONS[mode];

  return (
    <button
      type="button"
      onClick={() => persistThemeMode(nextThemeMode(mode))}
      aria-label={`Tema: ${themeLabel(mode)}. Cambiar`}
      title={`Tema: ${themeLabel(mode)}`}
      suppressHydrationWarning
      className="grid h-10 w-10 place-items-center rounded-full text-muted transition-colors hover:bg-chip hover:text-foreground"
    >
      <Icon size={18} strokeWidth={1.75} />
    </button>
  );
}

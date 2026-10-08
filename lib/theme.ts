export const THEME_KEY = "gb-theme";
export const THEME_MODES = ["system", "light", "dark"] as const;
export type ThemeMode = (typeof THEME_MODES)[number];

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) {
    listener();
  }
}

export function isThemeMode(value: string | null | undefined): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function nextThemeMode(current: ThemeMode): ThemeMode {
  if (current === "system") return "light";
  if (current === "light") return "dark";
  return "system";
}

export function themeLabel(mode: ThemeMode): string {
  if (mode === "light") return "Claro";
  if (mode === "dark") return "Oscuro";
  return "Sistema";
}

export function applyThemeMode(mode: ThemeMode) {
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = mode === "dark" || (mode === "system" && systemDark);
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.dataset.theme = mode;
}

export function persistThemeMode(mode: ThemeMode) {
  localStorage.setItem(THEME_KEY, mode);
  document.cookie = `${THEME_KEY}=${mode}; Path=/; Max-Age=31536000; SameSite=Lax`;
  applyThemeMode(mode);
  emit();
}

export function readStoredTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "system";
  }
  const stored = localStorage.getItem(THEME_KEY);
  return isThemeMode(stored) ? stored : "system";
}

export function subscribeTheme(listener: () => void) {
  listeners.add(listener);
  if (typeof window === "undefined") {
    return () => {
      listeners.delete(listener);
    };
  }
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const onMedia = () => {
    if (readStoredTheme() === "system") {
      applyThemeMode("system");
    }
    listener();
  };
  media.addEventListener("change", onMedia);
  return () => {
    listeners.delete(listener);
    media.removeEventListener("change", onMedia);
  };
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export const INSTALL_SNOOZE_MS = 30 * 24 * 60 * 60 * 1000;
export const INSTALL_ENGAGE_MS = 30_000;
export const INSTALL_UNTIL_KEY = "gb-install-until";
export const INSTALL_DONE_KEY = "gb-install-done";
export const INSTALL_VISITS_KEY = "gb-install-visits";
export const INSTALL_SESSION_SHOWN = "gb-install-shown";
export const INSTALL_SESSION_VISIT = "gb-install-visit-counted";

let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeInstall(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function captureInstallPrompt(event: BeforeInstallPromptEvent) {
  deferred = event;
  emit();
}

export function clearInstallPrompt() {
  deferred = null;
  emit();
}

export function canNativeInstall() {
  return deferred != null;
}

export function isSnoozeActive(until: number | null | undefined, now: number) {
  return typeof until === "number" && until > now;
}

export function shouldOfferInstallBanner({
  installed,
  done,
  snoozedUntil,
  shownThisSession,
  visitCount,
  engaged,
  now,
}: {
  installed: boolean;
  done: boolean;
  snoozedUntil: number | null;
  shownThisSession: boolean;
  visitCount: number;
  engaged: boolean;
  now: number;
}) {
  if (installed || done || shownThisSession) return false;
  if (isSnoozeActive(snoozedUntil, now)) return false;
  return visitCount >= 2 || engaged;
}

function readStorage(key: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function writeCookie(name: string, value: string, maxAgeSec: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax`;
}

export function readSnoozeUntil(): number | null {
  const stored = readStorage(INSTALL_UNTIL_KEY) ?? readCookie(INSTALL_UNTIL_KEY);
  if (!stored) return null;
  const until = Number(stored);
  return Number.isFinite(until) ? until : null;
}

export function isInstallDone() {
  return readStorage(INSTALL_DONE_KEY) === "1" || readCookie(INSTALL_DONE_KEY) === "1";
}

export function wasInstallDismissed(now = Date.now()) {
  if (typeof window === "undefined") return false;
  if (isInstallDone()) return true;
  return isSnoozeActive(readSnoozeUntil(), now);
}

export function snoozeInstall(ms = INSTALL_SNOOZE_MS, now = Date.now()) {
  if (typeof window === "undefined") return;
  const until = now + ms;
  writeStorage(INSTALL_UNTIL_KEY, String(until));
  writeCookie(INSTALL_UNTIL_KEY, String(until), Math.ceil(ms / 1000));
  emit();
}

export function markInstallDone() {
  if (typeof window === "undefined") return;
  writeStorage(INSTALL_DONE_KEY, "1");
  writeCookie(INSTALL_DONE_KEY, "1", 60 * 60 * 24 * 400);
  deferred = null;
  emit();
}

export function dismissInstall() {
  snoozeInstall();
  deferred = null;
  emit();
}

export function markBannerShownThisSession() {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(INSTALL_SESSION_SHOWN, "1");
  } catch {
    /* ignore */
  }
}

export function wasBannerShownThisSession() {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(INSTALL_SESSION_SHOWN) === "1";
  } catch {
    return false;
  }
}

export function recordVisit(): number {
  if (typeof window === "undefined") return 0;
  try {
    if (sessionStorage.getItem(INSTALL_SESSION_VISIT) === "1") {
      return Number(readStorage(INSTALL_VISITS_KEY) ?? "0") || 0;
    }
    sessionStorage.setItem(INSTALL_SESSION_VISIT, "1");
  } catch {
    /* continue */
  }
  const next = (Number(readStorage(INSTALL_VISITS_KEY) ?? "0") || 0) + 1;
  writeStorage(INSTALL_VISITS_KEY, String(next));
  return next;
}

export async function promptNativeInstall() {
  if (!deferred) return false;
  await deferred.prompt();
  const choice = await deferred.userChoice;
  if (choice.outcome === "accepted") markInstallDone();
  else dismissInstall();
  return choice.outcome === "accepted";
}

export function isStandaloneDisplay() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export async function hasInstalledRelatedApp() {
  if (typeof navigator === "undefined") return false;
  const nav = navigator as Navigator & {
    getInstalledRelatedApps?: () => Promise<Array<{ platform?: string }>>;
  };
  if (!nav.getInstalledRelatedApps) return false;
  try {
    const apps = await nav.getInstalledRelatedApps();
    return apps.length > 0;
  } catch {
    return false;
  }
}

export function isAppInstalled() {
  return isStandaloneDisplay();
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "gb-install-dismissed";
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

export function wasInstallDismissed() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DISMISS_KEY) === "1";
}

export function dismissInstall() {
  if (typeof window === "undefined") return;
  localStorage.setItem(DISMISS_KEY, "1");
  deferred = null;
  emit();
}

export async function promptNativeInstall() {
  if (!deferred) return false;
  await deferred.prompt();
  await deferred.userChoice;
  dismissInstall();
  return true;
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

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

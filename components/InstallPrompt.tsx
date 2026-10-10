"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";

const STORAGE_KEY = "gb-install-dismissed";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: minimal-ui)").matches ||
    ("standalone" in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function InstallPrompt() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [iosSheet, setIosSheet] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (localStorage.getItem(STORAGE_KEY) === "1") return;
    if (isStandalone()) return;

    if (isIos()) {
      setIosSheet(true);
      setVisible(true);
      return;
    }

    function onPrompt(event: Event) {
      event.preventDefault();
      setDeferred(event as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    setDeferred(null);
  }

  async function install() {
    if (!deferred) {
      setIosSheet(true);
      return;
    }
    await deferred.prompt();
    await deferred.userChoice;
    dismiss();
  }

  if (!visible) return null;

  return (
    <div className="safe-px fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-3.5">
      <div className="surface flex w-full max-w-md items-start gap-3 rounded-3xl p-3.5 shadow-lg">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-sm font-bold text-accent-ink">
          G
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Instalar app</p>
          {iosSheet ? (
            <p className="mt-1 text-xs leading-5 text-muted">
              En Safari: tocá <Share size={12} className="inline" strokeWidth={1.75} /> Compartir y
              después <span className="font-medium text-foreground">Agregar a inicio</span>. En iOS
              16.4+ funciona como app.
            </p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-muted">
              Queda en la pantalla de inicio, como una app.
            </p>
          )}
          <div className="mt-2 flex gap-2">
            {!iosSheet ? (
              <button
                type="button"
                onClick={install}
                className="inline-flex min-h-9 items-center rounded-full bg-accent px-3 text-xs font-semibold text-accent-ink"
              >
                Instalar
              </button>
            ) : null}
            <button
              type="button"
              onClick={dismiss}
              className="inline-flex min-h-9 items-center rounded-full px-3 text-xs font-medium text-muted hover:bg-chip"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          aria-label="Cerrar"
          className="grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-chip"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

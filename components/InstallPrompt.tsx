"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import {
  captureInstallPrompt,
  dismissInstall,
  isIosDevice,
  isStandaloneDisplay,
  promptNativeInstall,
  type BeforeInstallPromptEvent,
  wasInstallDismissed,
} from "@/lib/pwa-install";

export function InstallPrompt() {
  const [iosSheet, setIosSheet] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (wasInstallDismissed()) return;
    if (isStandaloneDisplay()) return;

    if (isIosDevice()) {
      setIosSheet(true);
      setVisible(true);
      return;
    }

    function onPrompt(event: Event) {
      event.preventDefault();
      captureInstallPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  function close() {
    dismissInstall();
    setVisible(false);
  }

  async function install() {
    if (await promptNativeInstall()) {
      setVisible(false);
      return;
    }
    setIosSheet(true);
  }

  if (!visible) return null;

  return (
    <div className="safe-px fixed bottom-[calc(6.75rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-3.5 lg:bottom-[calc(0.75rem+env(safe-area-inset-bottom))]">
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
                onClick={() => void install()}
                className="inline-flex min-h-11 items-center rounded-full bg-accent px-3 text-xs font-semibold text-accent-ink"
              >
                Instalar
              </button>
            ) : null}
            <button
              type="button"
              onClick={close}
              className="inline-flex min-h-11 items-center rounded-full px-3 text-xs font-medium text-muted hover:bg-chip"
            >
              Ahora no
            </button>
          </div>
        </div>
        <button
          type="button"
          onClick={close}
          aria-label="Cerrar"
          className="grid h-11 w-11 place-items-center rounded-full text-muted hover:bg-chip"
        >
          <X size={16} strokeWidth={1.75} />
        </button>
      </div>
    </div>
  );
}

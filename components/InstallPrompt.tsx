"use client";

import { useEffect, useState } from "react";
import { Share, X } from "lucide-react";
import {
  captureInstallPrompt,
  hasInstalledRelatedApp,
  INSTALL_ENGAGE_MS,
  isAppInstalled,
  isInstallDone,
  isIosDevice,
  markBannerShownThisSession,
  markInstallDone,
  promptNativeInstall,
  readSnoozeUntil,
  recordVisit,
  shouldOfferInstallBanner,
  snoozeInstall,
  type BeforeInstallPromptEvent,
  wasBannerShownThisSession,
} from "@/lib/pwa-install";

export function InstallPrompt() {
  const [iosHelp, setIosHelp] = useState(false);
  const [visible, setVisible] = useState(false);
  const [nativeReady, setNativeReady] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [visits, setVisits] = useState(0);

  useEffect(() => {
    setVisits(recordVisit());
    if (isAppInstalled()) {
      setInstalled(true);
      return;
    }
    let cancelled = false;
    void hasInstalledRelatedApp().then((related) => {
      if (!cancelled && related) {
        setInstalled(true);
        markInstallDone();
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => setEngaged(true), INSTALL_ENGAGE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    function onInstalled() {
      markInstallDone();
      setInstalled(true);
      setVisible(false);
    }
    window.addEventListener("appinstalled", onInstalled);
    return () => window.removeEventListener("appinstalled", onInstalled);
  }, []);

  useEffect(() => {
    if (installed) return;
    function onPrompt(event: Event) {
      event.preventDefault();
      captureInstallPrompt(event as BeforeInstallPromptEvent);
      setNativeReady(true);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, [installed]);

  useEffect(() => {
    if (installed || visible) return;
    if (isIosDevice()) setIosHelp(true);
    const offer = shouldOfferInstallBanner({
      installed,
      done: isInstallDone(),
      snoozedUntil: readSnoozeUntil(),
      shownThisSession: wasBannerShownThisSession(),
      visitCount: visits,
      engaged: engaged || nativeReady,
      now: Date.now(),
    });
    if (!offer) return;
    if (isIosDevice() || nativeReady) {
      markBannerShownThisSession();
      setVisible(true);
    }
  }, [engaged, nativeReady, installed, visible, visits]);

  function close() {
    snoozeInstall();
    setVisible(false);
  }

  async function install() {
    if (await promptNativeInstall()) {
      setVisible(false);
      return;
    }
    setIosHelp(true);
  }

  if (!visible || installed) return null;

  return (
    <div className="safe-px fixed bottom-[calc(6.75rem+env(safe-area-inset-bottom)+var(--vv-bottom,0px))] left-0 right-0 z-40 flex justify-center px-3.5 lg:bottom-[calc(0.75rem+env(safe-area-inset-bottom))]">
      <div className="surface flex w-full max-w-md items-start gap-3 rounded-3xl p-3.5 shadow-lg">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-accent text-sm font-bold text-accent-ink">
          G
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">Instalar app</p>
          {iosHelp ? (
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
            {!iosHelp ? (
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

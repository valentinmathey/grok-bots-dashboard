"use client";

import { useEffect, useState } from "react";
import { InstallPrompt } from "@/components/InstallPrompt";

export function PwaProvider() {
  const [updateReady, setUpdateReady] = useState(false);
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;

    let mounted = true;
    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        if (!mounted) return;
        if (registration.waiting) {
          setWaiting(registration.waiting);
          setUpdateReady(true);
        }
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          if (!worker) return;
          worker.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller) {
              setWaiting(registration.waiting);
              setUpdateReady(true);
            }
          });
        });
      })
      .catch(() => {
        /* el SW es opcional */
      });

    return () => {
      mounted = false;
    };
  }, []);

  function applyUpdate() {
    waiting?.postMessage("skipWaiting");
    setUpdateReady(false);
    window.location.reload();
  }

  return (
    <>
      <InstallPrompt />
      {updateReady ? (
        <div className="safe-px fixed bottom-[calc(8.5rem+env(safe-area-inset-bottom))] left-0 right-0 z-40 flex justify-center px-3.5 lg:bottom-6">
          <button
            type="button"
            onClick={applyUpdate}
            className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background shadow-lg"
          >
            Nueva versión disponible · Actualizar
          </button>
        </div>
      ) : null}
    </>
  );
}

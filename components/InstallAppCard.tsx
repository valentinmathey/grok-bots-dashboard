"use client";

import { useEffect, useState } from "react";
import { InstallAppButton } from "@/components/InstallAppButton";
import { canNativeInstall, isAppInstalled, isIosDevice, subscribeInstall } from "@/lib/pwa-install";

/** Card "App" de Ajustes: no se muestra si ya está instalada o no se puede instalar. */
export function InstallAppCard() {
  const [available, setAvailable] = useState(false);

  useEffect(() => {
    const check = () => setAvailable(!isAppInstalled() && (canNativeInstall() || isIosDevice()));
    check();
    return subscribeInstall(check);
  }, []);

  if (!available) return null;
  return (
    <section className="surface rounded-3xl p-5">
      <h2 className="text-base font-semibold">App</h2>
      <div className="mt-3">
        <InstallAppButton className="inline-flex min-h-11 items-center gap-3 rounded-2xl px-3 text-sm font-medium hover:bg-chip" />
      </div>
    </section>
  );
}
